"""Combi van de Dag — selection + persistence + evaluation.

Pure service layer. Mirrors the inline selection helper in
``app/api/routes/value_bets.py::_select_combo_legs_from_predictions``
but writes the result to the ``combo_bets`` + ``combo_bet_legs`` tables.

The selection rules MUST stay in lock-step with the route helper or
backtest replay numbers diverge from the live cron's daily picks.
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.core.tier_leagues import (
    LEAGUES_FREE,
    LEAGUES_GOLD,
    LEAGUES_PLATINUM,
    LEAGUES_SILVER,
)
from app.core.tier_system import CONF_THRESHOLD, PickTier
from app.models.combo_bet import ComboBet, ComboBetLeg
from app.models.match import Match, MatchStatus
from app.models.prediction import Prediction, PredictionEvaluation

log = logging.getLogger(__name__)

# Selection knobs — DUPLICATED from the route module on purpose so
# this service has no incoming dependency on routes. Keep both in
# sync; a unit test asserts equality.
COMBO_LEG_COUNT = 3
COMBO_MIN_CONFIDENCE = 0.70
COMBO_MIN_LEG_ODDS = 1.40
COMBO_MAX_LEG_ODDS = 4.00
PLATINUM_TIER_BONUS = 1.2
GOLD_TIER_BONUS = 1.0
COMBO_LIVE_TRACKING_START = date(2026, 4, 16)


def _classify_tier(league_id, confidence: float) -> Optional[str]:
    lid = str(league_id)
    if lid in LEAGUES_PLATINUM and confidence >= CONF_THRESHOLD[PickTier.PLATINUM]:
        return "platinum"
    if lid in LEAGUES_GOLD and confidence >= CONF_THRESHOLD[PickTier.GOLD]:
        return "gold"
    if lid in LEAGUES_SILVER and confidence >= CONF_THRESHOLD[PickTier.SILVER]:
        return "silver"
    if lid in LEAGUES_FREE and confidence >= CONF_THRESHOLD[PickTier.FREE]:
        return "free"
    return None


def select_combo_legs(preds: list[Prediction]) -> list[dict]:
    """Run the live combo selection on a candidate prediction list.

    Returns a list of leg dicts (≤ ``COMBO_LEG_COUNT``); empty list when
    fewer than the required number of legs pass the filters.
    """
    candidates: list[tuple[float, dict]] = []
    for p in preds:
        match = p.match
        if match is None or match.home_team is None or match.away_team is None:
            continue
        if (p.confidence or 0) < COMBO_MIN_CONFIDENCE:
            continue
        snap = p.closing_odds_snapshot or {}
        book = snap.get("bookmaker_odds") if isinstance(snap, dict) else None
        if not isinstance(book, dict):
            continue

        sides = [
            ("home", float(p.home_win_prob or 0.0), book.get("home")),
            ("draw", float(p.draw_prob or 0.0) if p.draw_prob is not None else 0.0, book.get("draw")),
            ("away", float(p.away_win_prob or 0.0), book.get("away")),
        ]
        sides_with_odds = [
            (s, prob, float(o)) for s, prob, o in sides if o is not None and float(o) > 1.0
        ]
        if not sides_with_odds:
            continue
        sides_with_odds.sort(key=lambda t: t[1], reverse=True)
        pick_side, our_prob, leg_odds = sides_with_odds[0]
        if leg_odds < COMBO_MIN_LEG_ODDS or leg_odds > COMBO_MAX_LEG_ODDS:
            continue
        tier = _classify_tier(match.league_id, p.confidence)
        if tier not in ("gold", "platinum"):
            continue

        odds_h = book.get("home")
        odds_d = book.get("draw")
        odds_a = book.get("away")
        try:
            ov = (1.0 / float(odds_h) if odds_h else 0.0) + (
                1.0 / float(odds_a) if odds_a else 0.0
            )
            if odds_d is not None:
                ov += 1.0 / float(odds_d)
            if ov <= 0:
                continue
            raw_implied = 1.0 / leg_odds
            fair_implied = raw_implied / ov
        except Exception:
            continue
        leg_edge = our_prob - fair_implied
        if leg_edge <= 0:
            continue
        tier_bonus = PLATINUM_TIER_BONUS if tier == "platinum" else GOLD_TIER_BONUS
        score = float(p.confidence or 0.0) * tier_bonus * (1.0 + leg_edge)
        candidates.append(
            (
                score,
                {
                    "prediction_id": p.id,
                    "match_id": match.id,
                    "league_id": str(match.league_id),
                    "our_pick": pick_side,
                    "our_probability": our_prob,
                    "confidence": float(p.confidence or 0.0),
                    "prediction_tier": tier,
                    "leg_odds": leg_odds,
                    "bookmaker_implied": raw_implied,
                    "fair_implied": fair_implied,
                    "leg_edge": leg_edge,
                },
            )
        )
    candidates.sort(key=lambda t: t[0], reverse=True)
    chosen: list[dict] = []
    seen: set[str] = set()
    for _, leg in candidates:
        if leg["league_id"] in seen:
            continue
        chosen.append(leg)
        seen.add(leg["league_id"])
        if len(chosen) >= COMBO_LEG_COUNT:
            break
    return chosen if len(chosen) >= COMBO_LEG_COUNT else []


async def persist_daily_combo(
    db: AsyncSession,
    bet_date: date,
    is_live: bool = True,
) -> Optional[ComboBet]:
    """Generate and persist a combo for ``bet_date``.

    Idempotent: returns the existing row when one already exists for
    (bet_date, is_live). Returns None when no qualifying combo could
    be selected (logged for visibility).
    """
    existing = (
        await db.execute(
            select(ComboBet)
            .where(and_(ComboBet.bet_date == bet_date, ComboBet.is_live == is_live))
            .limit(1)
        )
    ).scalar_one_or_none()
    if existing is not None:
        log.info(
            "combo_bet: already exists for %s (live=%s, id=%s) — skipping",
            bet_date, is_live, existing.id,
        )
        return existing

    # Window: matches scheduled in the next 48h from start-of-day UTC
    window_start = datetime.combine(bet_date, datetime.min.time(), tzinfo=timezone.utc)
    window_end = window_start + timedelta(hours=48)

    pred_stmt = (
        select(Prediction)
        .options(
            joinedload(Prediction.match).joinedload(Match.home_team),
            joinedload(Prediction.match).joinedload(Match.away_team),
            joinedload(Prediction.match).joinedload(Match.league),
        )
        .join(Match, Match.id == Prediction.match_id)
        .where(
            Prediction.closing_odds_snapshot.is_not(None),
            Prediction.confidence >= COMBO_MIN_CONFIDENCE,
            Prediction.predicted_at <= Match.scheduled_at,
            Match.scheduled_at >= window_start,
            Match.scheduled_at <= window_end,
            Match.status.in_([MatchStatus.SCHEDULED, MatchStatus.LIVE, MatchStatus.FINISHED]),
        )
    )
    if is_live:
        # Only live-sourced predictions for the live combi
        pred_stmt = pred_stmt.where(Prediction.prediction_source == "live")
    preds = (await db.execute(pred_stmt)).unique().scalars().all()

    legs = select_combo_legs(list(preds))
    if not legs:
        log.info(
            "combo_bet: no qualifying combo for %s (live=%s) — %d candidates considered",
            bet_date, is_live, len(preds),
        )
        return None

    combined_odds = 1.0
    combined_model_prob = 1.0
    combined_book_implied = 1.0
    for leg in legs:
        combined_odds *= leg["leg_odds"]
        combined_model_prob *= leg["our_probability"]
        combined_book_implied *= leg["bookmaker_implied"]
    combined_edge = combined_model_prob * combined_odds - 1.0

    combo = ComboBet(
        bet_date=bet_date,
        picked_at=datetime.now(timezone.utc),
        is_live=is_live,
        leg_count=len(legs),
        combined_odds=combined_odds,
        combined_model_probability=combined_model_prob,
        combined_bookmaker_implied=combined_book_implied,
        combined_edge=combined_edge,
        expected_value_per_unit=combined_edge,
    )
    db.add(combo)
    await db.flush()  # populate combo.id

    for idx, leg in enumerate(legs):
        db.add(
            ComboBetLeg(
                combo_bet_id=combo.id,
                leg_index=idx,
                prediction_id=leg["prediction_id"],
                match_id=leg["match_id"],
                our_pick=leg["our_pick"],
                our_probability=leg["our_probability"],
                confidence=leg["confidence"],
                prediction_tier=leg["prediction_tier"],
                leg_odds=leg["leg_odds"],
                bookmaker_implied=leg["bookmaker_implied"],
                fair_implied=leg["fair_implied"],
                leg_edge=leg["leg_edge"],
            )
        )
    await db.commit()
    log.info(
        "combo_bet: persisted %s (live=%s, id=%s) — odds=%.2f legs=%d",
        bet_date, is_live, combo.id, combined_odds, len(legs),
    )
    return combo


async def evaluate_pending_combos(db: AsyncSession) -> int:
    """Grade any combo whose legs are all evaluated.

    For each pending combo:
      - Look up the PredictionEvaluation for each leg's prediction
      - If ALL legs are graded: set is_correct = (every leg correct),
        compute profit_loss_units, mark evaluated_at = now
      - Also set per-leg is_correct + actual_outcome from the evaluation

    Returns the number of combos newly evaluated. Logged for the
    scheduler heartbeat.
    """
    pending_stmt = (
        select(ComboBet)
        .options(selectinload(ComboBet.legs))
        .where(ComboBet.is_evaluated.is_(False))
    )
    pending = (await db.execute(pending_stmt)).scalars().unique().all()
    if not pending:
        return 0

    # Bulk-fetch all evaluations for pending leg prediction-ids
    pred_ids = [leg.prediction_id for combo in pending for leg in combo.legs]
    if not pred_ids:
        return 0
    eval_stmt = select(PredictionEvaluation).where(
        PredictionEvaluation.prediction_id.in_(pred_ids)
    )
    evals = {
        e.prediction_id: e for e in (await db.execute(eval_stmt)).scalars().all()
    }

    graded = 0
    for combo in pending:
        leg_evals = [evals.get(leg.prediction_id) for leg in combo.legs]
        if any(ev is None for ev in leg_evals):
            continue  # not all legs graded yet

        all_correct = True
        for leg, ev in zip(combo.legs, leg_evals):
            assert ev is not None  # for mypy
            leg.is_evaluated = True
            leg.is_correct = bool(ev.is_correct)
            leg.actual_outcome = getattr(ev, "actual_outcome", None) or (
                "correct" if ev.is_correct else "incorrect"
            )
            if not ev.is_correct:
                all_correct = False

        combo.is_evaluated = True
        combo.is_correct = all_correct
        combo.profit_loss_units = (combo.combined_odds - 1.0) if all_correct else -1.0
        combo.evaluated_at = datetime.now(timezone.utc)
        graded += 1

    if graded:
        await db.commit()
        log.info("combo_bet: evaluated %d pending combos", graded)
    return graded


async def backfill_historical_combos(
    db: AsyncSession,
    start_date: date,
    end_date: date,
) -> int:
    """Replay the selector for each day in [start_date, end_date] and
    persist a combo row per day with ``is_live = False``.

    Used by the seed script to populate the back-test panel with
    real combos rather than on-the-fly aggregations. Idempotent.
    """
    inserted = 0
    cursor = start_date
    while cursor <= end_date:
        result = await persist_daily_combo(db, cursor, is_live=False)
        if result is not None and result.created_at and (
            datetime.now(timezone.utc) - result.created_at
        ).total_seconds() < 60:
            inserted += 1
        cursor += timedelta(days=1)
    return inserted
