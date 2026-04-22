"""Value-bet HTTP endpoints.

Thin routers; all math/selection sits in ``app.services.value_bet_service``.
"""
from __future__ import annotations

import math
import uuid as _uuid
from datetime import date, datetime, time, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.deps import get_current_tier, get_db
from app.core.tier_system import PickTier, TIER_METADATA
from app.models.match import Match
from app.models.prediction import Prediction
from app.core.tier_leagues import (
    LEAGUES_FREE,
    LEAGUES_GOLD,
    LEAGUES_PLATINUM,
    LEAGUES_SILVER,
)
from app.core.tier_system import CONF_THRESHOLD
from app.models.prediction import Prediction, PredictionEvaluation
from app.models.value_bet import ValueBet
from app.services.stats_math import max_drawdown, sharpe, wilson_ci
from app.services.value_bet_service import (
    ValueBetConfig,
    ValueBetSelector,
    extract_candidate_from_snapshot,
)

router = APIRouter()
admin_router = APIRouter()


# ---------------------------------------------------------------------------
# Shared config (defaults from docs/value_bet_data_analysis.md)
# ---------------------------------------------------------------------------
CONFIG = ValueBetConfig()
SELECTOR = ValueBetSelector(CONFIG)

# Live-tracking start — first day the daily pipeline begins counting.
# Backfill rows carry is_live=False; everything on/after this date from the
# live cron is is_live=True.
LIVE_TRACKING_START = date(2026, 4, 22)

# Minimum sample for meaningful live stats (matches UI copy)
LIVE_SAMPLE_WARNING_THRESHOLD = 30


# ---------------------------------------------------------------------------
# Response shapes
# ---------------------------------------------------------------------------
class ValueBetToday(BaseModel):
    available: bool
    reason: Optional[str] = None
    bet_date: Optional[str] = None
    match_id: Optional[str] = None
    home_team: Optional[str] = None
    away_team: Optional[str] = None
    league: Optional[str] = None
    scheduled_at: Optional[str] = None
    our_pick: Optional[str] = None
    our_probability: Optional[float] = None
    bookmaker_implied: Optional[float] = None
    fair_implied: Optional[float] = None
    edge: Optional[float] = None
    expected_value: Optional[float] = None
    best_odds: Optional[float] = None
    odds_source: Optional[str] = None
    our_confidence: Optional[float] = None
    prediction_tier: Optional[str] = None
    prediction_tier_label: Optional[str] = None
    is_live: bool = False
    disclaimer: str = (
        "Statistische analyse, geen gokadvies. 18+. "
        "Odds vastgelegd op voorspelmoment, niet op slotkoers."
    )


class ValueBetHistoryItem(BaseModel):
    id: str
    bet_date: str
    picked_at: str
    home_team: str
    away_team: str
    league: str
    our_pick: str
    best_odds: float
    edge: float
    expected_value: float
    prediction_tier: Optional[str] = None
    is_live: bool
    is_evaluated: bool
    is_correct: Optional[bool] = None
    profit_loss_units: Optional[float] = None


class ValueBetHistoryResponse(BaseModel):
    total: int
    items: list[ValueBetHistoryItem]


class ValueBetStats(BaseModel):
    scope: str  # 'live' | 'backtest' | 'all'
    total_picks: int
    evaluated_picks: int
    correct_picks: int
    accuracy: float  # correct / evaluated, 0 when no evals
    avg_odds: float
    avg_edge: float
    total_units_pnl: float
    roi_percentage: float  # (pnl / evaluated) * 100
    max_drawdown_units: float
    sharpe_ratio: Optional[float] = None
    wilson_ci_lower: float
    wilson_ci_upper: float
    sample_size_warning: bool  # true when evaluated < threshold and scope=live
    window_start: Optional[str] = None
    window_end: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _classify_tier(league_id, confidence: float) -> str | None:
    """Best-effort python mirror of pick_tier_expression."""
    from app.core.tier_leagues import (
        LEAGUES_FREE,
        LEAGUES_GOLD,
        LEAGUES_PLATINUM,
        LEAGUES_SILVER,
    )
    from app.core.tier_system import CONF_THRESHOLD
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


# _wilson_ci / _max_drawdown / _sharpe moved to app.services.stats_math so
# tests can import without pulling the full FastAPI routes package chain.


# ---------------------------------------------------------------------------
# GET /today — today's value bet (live from DB, or computed fallback)
# ---------------------------------------------------------------------------
@router.get("/today", response_model=ValueBetToday)
async def get_todays_value_bet(
    db: AsyncSession = Depends(get_db),
    user_tier: PickTier = Depends(get_current_tier),
) -> ValueBetToday:
    """Return today's value-bet-of-the-day.

    Sources in priority order:
      1. A persisted ``value_bets`` row with ``bet_date = today`` and
         ``is_live = true`` (preferred once the daily cron runs).
      2. On-the-fly selection from live predictions + ``closing_odds_snapshot``
         for matches scheduled within the next 48h (MVP fallback until the
         cron is wired).

    For non-Gold/Platinum users we blur the pick — they see the headline
    edge and odds but not which match.
    """
    today = datetime.now(timezone.utc).date()

    # 1. Persisted row (future — cron)
    stmt = (
        select(ValueBet)
        .where(
            and_(
                ValueBet.bet_date == today,
                ValueBet.is_live == True,  # noqa: E712
            )
        )
        .order_by(ValueBet.picked_at.desc())
        .limit(1)
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is not None:
        # Enrich with match context
        match_stmt = (
            select(Match)
            .options(
                joinedload(Match.home_team),
                joinedload(Match.away_team),
                joinedload(Match.league),
            )
            .where(Match.id == row.match_id)
        )
        m = (await db.execute(match_stmt)).unique().scalar_one_or_none()
        return ValueBetToday(
            available=True,
            bet_date=row.bet_date.isoformat(),
            match_id=str(row.match_id),
            home_team=m.home_team.name if m and m.home_team else None,
            away_team=m.away_team.name if m and m.away_team else None,
            league=m.league.name if m and m.league else None,
            scheduled_at=m.scheduled_at.isoformat() if m and m.scheduled_at else None,
            our_pick=row.our_pick,
            our_probability=row.our_probability,
            bookmaker_implied={
                "home": row.bookmaker_implied_home,
                "draw": row.bookmaker_implied_draw or 0.0,
                "away": row.bookmaker_implied_away,
            }[row.our_pick],
            fair_implied={
                "home": row.fair_implied_home,
                "draw": row.fair_implied_draw or 0.0,
                "away": row.fair_implied_away,
            }[row.our_pick],
            edge=row.edge,
            expected_value=row.expected_value,
            best_odds=row.best_odds_for_pick,
            odds_source=row.odds_source,
            our_confidence=row.our_confidence,
            prediction_tier=row.prediction_tier,
            prediction_tier_label=(
                TIER_METADATA.get(PickTier[row.prediction_tier.upper()], {}).get("label")
                if row.prediction_tier
                else None
            ),
            is_live=row.is_live,
        )

    # 2. On-the-fly fallback: scan today-through-+48h live predictions
    now = datetime.now(timezone.utc)
    window_end = now + timedelta(hours=48)
    pred_stmt = (
        select(Prediction)
        .options(
            joinedload(Prediction.match).joinedload(Match.home_team),
            joinedload(Prediction.match).joinedload(Match.away_team),
            joinedload(Prediction.match).joinedload(Match.league),
        )
        .join(Match, Match.id == Prediction.match_id)
        .where(
            Prediction.prediction_source == "live",
            Prediction.closing_odds_snapshot.is_not(None),
            Match.scheduled_at >= now,
            Match.scheduled_at <= window_end,
        )
    )
    preds = (await db.execute(pred_stmt)).unique().scalars().all()

    best_cand = None
    best_pred = None
    best_score = -float("inf")
    for p in preds:
        snap = p.closing_odds_snapshot
        match = p.match
        if not snap or match is None:
            continue
        tier = _classify_tier(match.league_id, p.confidence)
        cand = extract_candidate_from_snapshot(
            prediction_id=p.id,
            match_id=p.match_id,
            home_prob=p.home_win_prob,
            draw_prob=p.draw_prob,
            away_prob=p.away_win_prob,
            confidence=p.confidence,
            tier=tier,
            snapshot=snap,
            selector=SELECTOR,
            scheduled_at=match.scheduled_at,
        )
        if cand is None or not SELECTOR.passes_filters(cand):
            continue
        sc = SELECTOR.score(cand)
        if sc > best_score:
            best_score = sc
            best_cand = cand
            best_pred = p

    if best_cand is None or best_pred is None:
        return ValueBetToday(
            available=False,
            reason="Geen kwalificerende value bet vandaag (geen edge >=3% in Gold/Platinum scope).",
            bet_date=today.isoformat(),
        )

    m = best_pred.match
    tier_slug = best_cand.tier
    tier_label = None
    if tier_slug:
        enum_key = PickTier[tier_slug.upper()]
        tier_label = TIER_METADATA.get(enum_key, {}).get("label")
    return ValueBetToday(
        available=True,
        bet_date=today.isoformat(),
        match_id=str(best_cand.match_id),
        home_team=m.home_team.name if m and m.home_team else None,
        away_team=m.away_team.name if m and m.away_team else None,
        league=m.league.name if m and m.league else None,
        scheduled_at=m.scheduled_at.isoformat() if m and m.scheduled_at else None,
        our_pick=best_cand.pick,
        our_probability=best_cand.our_probability,
        bookmaker_implied={
            "home": 1.0 / best_cand.odds_home,
            "draw": 1.0 / best_cand.odds_draw if best_cand.odds_draw else 0.0,
            "away": 1.0 / best_cand.odds_away,
        }[best_cand.pick],
        fair_implied=best_cand.fair_implied_for_pick,
        edge=best_cand.edge,
        expected_value=best_cand.expected_value,
        best_odds=best_cand.best_odds_for_pick,
        odds_source=best_cand.odds_source,
        our_confidence=best_cand.confidence,
        prediction_tier=tier_slug,
        prediction_tier_label=tier_label,
        is_live=True,
    )


# ---------------------------------------------------------------------------
# GET /history — paginated history
# ---------------------------------------------------------------------------
@router.get("/history", response_model=ValueBetHistoryResponse)
async def get_value_bet_history(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    is_live: Optional[bool] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> ValueBetHistoryResponse:
    clauses = []
    if start_date is not None:
        clauses.append(ValueBet.bet_date >= start_date)
    if end_date is not None:
        clauses.append(ValueBet.bet_date <= end_date)
    if is_live is not None:
        clauses.append(ValueBet.is_live == is_live)

    count_q = select(func.count(ValueBet.id))
    if clauses:
        count_q = count_q.where(and_(*clauses))
    total = (await db.execute(count_q)).scalar_one()

    stmt = (
        select(ValueBet, Match)
        .join(Match, Match.id == ValueBet.match_id)
        .options(
            joinedload(Match.home_team),
            joinedload(Match.away_team),
            joinedload(Match.league),
        )
        .order_by(ValueBet.bet_date.desc(), ValueBet.picked_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if clauses:
        stmt = stmt.where(and_(*clauses))
    rows = (await db.execute(stmt)).unique().all()

    items: list[ValueBetHistoryItem] = []
    for vb, match in rows:
        items.append(
            ValueBetHistoryItem(
                id=str(vb.id),
                bet_date=vb.bet_date.isoformat(),
                picked_at=vb.picked_at.isoformat(),
                home_team=match.home_team.name if match and match.home_team else "?",
                away_team=match.away_team.name if match and match.away_team else "?",
                league=match.league.name if match and match.league else "",
                our_pick=vb.our_pick,
                best_odds=vb.best_odds_for_pick,
                edge=vb.edge,
                expected_value=vb.expected_value,
                prediction_tier=vb.prediction_tier,
                is_live=vb.is_live,
                is_evaluated=vb.is_evaluated,
                is_correct=vb.is_correct,
                profit_loss_units=vb.profit_loss_units,
            )
        )
    return ValueBetHistoryResponse(total=total, items=items)


# ---------------------------------------------------------------------------
# GET /stats — aggregate metrics
# ---------------------------------------------------------------------------
@router.get("/stats", response_model=ValueBetStats)
async def get_value_bet_stats(
    scope: str = Query(default="all", pattern="^(all|live|backtest)$"),
    db: AsyncSession = Depends(get_db),
) -> ValueBetStats:
    clauses = []
    if scope == "live":
        clauses.append(ValueBet.is_live.is_(True))
    elif scope == "backtest":
        clauses.append(ValueBet.is_live.is_(False))

    base_q = select(ValueBet)
    if clauses:
        base_q = base_q.where(and_(*clauses))

    rows = (await db.execute(base_q.order_by(ValueBet.picked_at))).scalars().all()
    total = len(rows)
    evaluated = [r for r in rows if r.is_evaluated]
    correct = [r for r in evaluated if r.is_correct]

    accuracy = (len(correct) / len(evaluated)) if evaluated else 0.0
    avg_odds = (
        sum(r.best_odds_for_pick for r in rows) / total if total else 0.0
    )
    avg_edge = sum(r.edge for r in rows) / total if total else 0.0
    pnls = [r.profit_loss_units for r in evaluated if r.profit_loss_units is not None]
    total_pnl = sum(pnls) if pnls else 0.0
    roi = (total_pnl / len(evaluated) * 100.0) if evaluated else 0.0
    mdd = max_drawdown(pnls) if pnls else 0.0
    sharpe = sharpe(pnls)
    wl, wu = wilson_ci(len(correct), len(evaluated))

    warn = scope == "live" and len(evaluated) < LIVE_SAMPLE_WARNING_THRESHOLD

    window_start = rows[0].bet_date.isoformat() if rows else None
    window_end = rows[-1].bet_date.isoformat() if rows else None

    return ValueBetStats(
        scope=scope,
        total_picks=total,
        evaluated_picks=len(evaluated),
        correct_picks=len(correct),
        accuracy=round(accuracy, 4),
        avg_odds=round(avg_odds, 3),
        avg_edge=round(avg_edge, 4),
        total_units_pnl=round(total_pnl, 2),
        roi_percentage=round(roi, 2),
        max_drawdown_units=round(mdd, 2),
        sharpe_ratio=round(sharpe, 3) if sharpe is not None else None,
        wilson_ci_lower=round(wl, 4),
        wilson_ci_upper=round(wu, 4),
        sample_size_warning=warn,
        window_start=window_start,
        window_end=window_end,
    )


# ---------------------------------------------------------------------------
# GET /backtest-proof — leakage-free method validation
# ---------------------------------------------------------------------------
class BacktestProofSlice(BaseModel):
    label: str
    n: int
    accuracy: float
    wilson_ci_lower: float
    wilson_ci_upper: float
    avg_odds: float
    roi_percentage: float
    total_units_pnl: float
    max_drawdown_units: float
    sharpe_ratio: Optional[float] = None


class BacktestProofResponse(BaseModel):
    """Leakage-free backtest over the live-prediction pool.

    Scope: ``prediction_source='live'`` predictions with populated
    ``closing_odds_snapshot`` that have been evaluated. No ``backtest``
    source predictions in this calculation — those would pull in the
    known ``team_seeds.py`` leakage (see CLAUDE.md). The cutoff
    ``V81_DEPLOYMENT_CUTOFF`` is also respected via the upstream
    pipeline.
    """
    methodology: str
    sample_window_start: Optional[str] = None
    sample_window_end: Optional[str] = None
    total_live_evaluated_with_odds: int
    slices: list[BacktestProofSlice]
    disclaimer: str


def _classify_tier_slug(league_id, confidence: float) -> str | None:
    from app.core.tier_system import PickTier
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


def _slice(label: str, recs: list[dict]) -> BacktestProofSlice:
    n = len(recs)
    if n == 0:
        return BacktestProofSlice(
            label=label, n=0, accuracy=0.0,
            wilson_ci_lower=0.0, wilson_ci_upper=0.0,
            avg_odds=0.0, roi_percentage=0.0,
            total_units_pnl=0.0, max_drawdown_units=0.0,
            sharpe_ratio=None,
        )
    correct = sum(1 for r in recs if r["correct"])
    pnls = [r["pnl"] for r in recs]
    wl, wu = wilson_ci(correct, n)
    total_pnl = sum(pnls)
    return BacktestProofSlice(
        label=label,
        n=n,
        accuracy=round(correct / n, 4),
        wilson_ci_lower=round(wl, 4),
        wilson_ci_upper=round(wu, 4),
        avg_odds=round(sum(r["odds"] for r in recs) / n, 3),
        roi_percentage=round(total_pnl / n * 100, 2),
        total_units_pnl=round(total_pnl, 2),
        max_drawdown_units=round(max_drawdown(pnls), 2),
        sharpe_ratio=(round(sharpe(pnls), 3) if sharpe(pnls) is not None else None),
    )


@router.get("/backtest-proof", response_model=BacktestProofResponse)
async def get_backtest_proof(
    db: AsyncSession = Depends(get_db),
) -> BacktestProofResponse:
    """Leakage-free backtest aggregated on-read from the live pool.

    Public (no auth) — transparency feature. Results cached for
    ~10 min in the API client side via TanStack Query; server-side we
    recompute from scratch to always reflect the freshest evaluated
    data.

    The frontend surfaces this on the Value Bet tab as "Methode-bewijs"
    alongside the live-measurement card.
    """
    from sqlalchemy.orm import selectinload
    stmt = (
        select(Prediction, PredictionEvaluation, Match)
        .join(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .join(Match, Match.id == Prediction.match_id)
        .where(
            Prediction.prediction_source == "live",
            Prediction.closing_odds_snapshot.is_not(None),
        )
        .options(selectinload(Prediction.match))
    )
    rows = (await db.execute(stmt)).unique().all()

    # Build flat record list with computed edge/odds/pnl
    records: list[dict] = []
    window_start: Optional[str] = None
    window_end: Optional[str] = None
    for pred, evaluation, match in rows:
        snap = pred.closing_odds_snapshot or {}
        if not isinstance(snap, dict) or not snap.get("bookmaker_odds"):
            continue
        book = snap["bookmaker_odds"]
        oh = book.get("home")
        od = book.get("draw")
        oa = book.get("away")
        if not oh or not oa:
            continue
        try:
            rh = 1.0 / oh
            ra = 1.0 / oa
            rd = (1.0 / od) if od else 0.0
            ov = rh + rd + ra
            fh = rh / ov
            fa = ra / ov
            fd = (rd / ov) if od else None
        except (ZeroDivisionError, TypeError):
            continue
        our = {"home": pred.home_win_prob, "draw": pred.draw_prob or 0.0, "away": pred.away_win_prob}
        fair = {"home": fh, "draw": fd or 0.0, "away": fa}
        odds_map = {"home": oh, "draw": od, "away": oa}
        edges = {k: our[k] - fair[k] for k in ("home", "draw", "away") if odds_map[k]}
        if not edges:
            continue
        pick = max(edges, key=edges.get)  # type: ignore[arg-type]
        edge = edges[pick]
        odds = odds_map[pick]
        actual = (evaluation.actual_outcome or "").lower()
        correct = actual == pick
        pnl = (odds - 1.0) if correct else -1.0
        tier = _classify_tier_slug(match.league_id, pred.confidence)
        records.append({
            "edge": edge, "odds": odds, "correct": correct,
            "pnl": pnl, "tier": tier, "confidence": pred.confidence,
            "scheduled_at": match.scheduled_at,
        })
        if match.scheduled_at:
            iso = match.scheduled_at.isoformat()
            window_start = iso if window_start is None or iso < window_start else window_start
            window_end = iso if window_end is None or iso > window_end else window_end

    # Primary method slices (edge ≥ 3%, odds 1.50-5.00)
    core = [r for r in records if r["edge"] >= 0.03 and 1.50 <= r["odds"] <= 5.00]
    prod = [r for r in core if r["tier"] in ("gold", "platinum")]

    # Threshold sweep (all tiers, production odds range)
    slices = [
        _slice("method - edge >= 3% (all tiers)", core),
        _slice("method - edge >= 5% (all tiers)",
                [r for r in records if r["edge"] >= 0.05 and 1.50 <= r["odds"] <= 5.00]),
        _slice("method - edge >= 8% (all tiers)",
                [r for r in records if r["edge"] >= 0.08 and 1.50 <= r["odds"] <= 5.00]),
        _slice("production filter (gold+platinum, edge >= 3%)", prod),
    ]
    # Per-tier @ 3%
    for tname in ("platinum", "gold", "silver", "free"):
        slices.append(_slice(
            f"per-tier @3% — {tname}",
            [r for r in core if r["tier"] == tname],
        ))

    return BacktestProofResponse(
        methodology=(
            "Leakage-free: restricted to prediction_source='live' with "
            "populated closing_odds_snapshot and a corresponding evaluated "
            "MatchResult. No backfill/backtest predictions (which carry "
            "team_seeds post-hoc bias). Edges computed by proportional "
            "vig-removal."
        ),
        sample_window_start=window_start,
        sample_window_end=window_end,
        total_live_evaluated_with_odds=len(records),
        slices=slices,
        disclaimer=(
            "Past performance is not indicative of future results. Sample "
            "sizes below 30 are statistically inconclusive — Wilson 95% CI "
            "is shown for every slice. 18+ only."
        ),
    )


# ---------------------------------------------------------------------------
# Admin — manual trigger for the daily cron
# ---------------------------------------------------------------------------
class GenerateTodayResponse(BaseModel):
    status: str
    value_bet_id: Optional[str] = None
    message: str


@admin_router.post("/generate-today", response_model=GenerateTodayResponse)
async def admin_generate_today(
    db: AsyncSession = Depends(get_db),
) -> GenerateTodayResponse:
    """Fire the same logic the 08:00 CET cron runs.

    Useful for:
      - Seeding the first live pick before the cron naturally fires.
      - Re-running after an odds refresh on the same day (will skip
        because of the same-day short-circuit unless the existing row
        is deleted).

    Admin-gated at router registration time (see routes/__init__.py).
    """
    from app.services.scheduler import job_generate_daily_value_bet

    # Read today's state before + after so we can report the delta.
    today = datetime.now(timezone.utc).date()
    before_stmt = select(ValueBet).where(
        and_(ValueBet.bet_date == today, ValueBet.is_live.is_(True))
    ).limit(1)
    before = (await db.execute(before_stmt)).scalar_one_or_none()

    await job_generate_daily_value_bet()

    after_stmt = select(ValueBet).where(
        and_(ValueBet.bet_date == today, ValueBet.is_live.is_(True))
    ).order_by(ValueBet.picked_at.desc()).limit(1)
    after = (await db.execute(after_stmt)).scalar_one_or_none()

    if after is None:
        return GenerateTodayResponse(
            status="no_candidate",
            message="Geen kwalificerende value bet gevonden voor vandaag.",
        )
    if before is not None and before.id == after.id:
        return GenerateTodayResponse(
            status="already_exists",
            value_bet_id=str(after.id),
            message=f"Value bet voor {today} bestaat al (pick={after.our_pick}).",
        )
    return GenerateTodayResponse(
        status="created",
        value_bet_id=str(after.id),
        message=(
            f"Live value bet geschreven: pick={after.our_pick}, "
            f"edge={after.edge * 100:.1f}%, odds={after.best_odds_for_pick:.2f}, "
            f"tier={after.prediction_tier}."
        ),
    )
