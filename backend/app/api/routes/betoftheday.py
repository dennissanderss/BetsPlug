"""
Pick of the Day route.

Selects the single highest-confidence prediction for today's matches.
This is the premium "killer feature" — the one prediction that stands out.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, time, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, noload

from datetime import timedelta

from app.db.session import get_db
from app.models.match import Match, MatchStatus
from app.models.prediction import Prediction

logger = logging.getLogger(__name__)

router = APIRouter()

# Minimum confidence for BOTD selection — single source of truth.
BOTD_MIN_CONFIDENCE = 0.60


# ─────────────────────────────────────────────────────────────────────────────
# v6.3: Historical accuracy endpoint for BOTD picks
# ─────────────────────────────────────────────────────────────────────────────


class BOTDHistoryItem(BaseModel):
    """A single past BOTD pick with its result."""
    date: str
    home_team: str
    away_team: str
    league: str
    prediction: str  # "Home" / "Draw" / "Away"
    confidence: float
    correct: bool | None = None  # None = pending
    home_score: int | None = None
    away_score: int | None = None
    odds_used: float | None = None


@router.get("/history", response_model=list[BOTDHistoryItem])
async def get_botd_history(
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[BOTDHistoryItem]:
    """Return the last N BOTD picks with their results."""
    from app.models.prediction import PredictionEvaluation
    from collections import defaultdict

    stmt = (
        select(Prediction, PredictionEvaluation)
        .join(Match, Match.id == Prediction.match_id)
        .outerjoin(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .where(
            Prediction.confidence >= BOTD_MIN_CONFIDENCE,
            Prediction.prediction_source == "live",
        )
        .order_by(Match.scheduled_at.desc())
    )
    rows = (await db.execute(stmt)).all()

    # Group by date, keep highest confidence per day
    by_date: dict[str, tuple] = {}
    for pred, evaluation in rows:
        if pred.match is None:
            continue
        date_key = pred.match.scheduled_at.strftime("%Y-%m-%d") if pred.match.scheduled_at else ""
        if not date_key:
            continue
        existing = by_date.get(date_key)
        if existing is None or pred.confidence > existing[0].confidence:
            by_date[date_key] = (pred, evaluation)

    # Sort by date descending, take last N
    sorted_picks = sorted(by_date.items(), key=lambda x: x[0], reverse=True)[:limit]

    pick_labels = {"home": "Home", "draw": "Draw", "away": "Away"}
    result = []
    for date_key, (pred, evaluation) in sorted_picks:
        probs = {"home": pred.home_win_prob, "draw": pred.draw_prob or 0, "away": pred.away_win_prob}
        pick = max(probs, key=lambda k: probs[k])

        m = pred.match
        home_name = m.home_team.name if m and m.home_team else "?"
        away_name = m.away_team.name if m and m.away_team else "?"
        league_name = m.league.name if m and m.league else ""

        home_score = m.result.home_score if m and m.result else None
        away_score = m.result.away_score if m and m.result else None

        # Implied odds for transparency
        pick_prob = probs.get(pick, 0.5)
        implied_odds = round(1.0 / (pick_prob * 0.95), 2) if pick_prob > 0.05 else None

        result.append(BOTDHistoryItem(
            date=date_key,
            home_team=home_name,
            away_team=away_name,
            league=league_name,
            prediction=pick_labels.get(pick, pick),
            confidence=round(pred.confidence * 100, 1),
            correct=bool(evaluation.is_correct) if evaluation else None,
            home_score=home_score,
            away_score=away_score,
            odds_used=implied_odds,
        ))

    return result


class BOTDTrackRecord(BaseModel):
    """Historical accuracy of the Pick of the Day feature."""
    total_picks: int = 0
    evaluated: int = 0
    correct: int = 0
    accuracy_pct: float = 0.0
    current_streak: int = 0          # consecutive correct (positive) or wrong (negative)
    best_streak: int = 0
    avg_confidence: float = 0.0
    last_updated: str | None = None


@router.get("/track-record", response_model=BOTDTrackRecord)
async def get_botd_track_record(
    db: AsyncSession = Depends(get_db),
) -> BOTDTrackRecord:
    """Return historical accuracy for the highest-confidence daily pick.

    The BOTD is defined as the prediction with confidence >= BOTD_MIN_CONFIDENCE
    on any given day, restricted to live (pre-match) predictions only.
    """
    from app.models.prediction import PredictionEvaluation

    stmt = (
        select(Prediction, PredictionEvaluation)
        .join(Match, Match.id == Prediction.match_id)
        .outerjoin(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .where(
            Prediction.confidence >= BOTD_MIN_CONFIDENCE,
            Prediction.prediction_source == "live",
        )
        .order_by(Match.scheduled_at)
    )
    rows = (await db.execute(stmt)).all()

    if not rows:
        return BOTDTrackRecord()

    # Group by date, keep highest confidence per day
    from collections import defaultdict
    by_date: dict[str, tuple] = {}  # date_key → (pred, eval) with highest conf
    for pred, evaluation in rows:
        if pred.match is None:
            continue
        date_key = pred.match.scheduled_at.strftime("%Y-%m-%d") if pred.match.scheduled_at else ""
        if not date_key:
            continue
        existing = by_date.get(date_key)
        if existing is None or pred.confidence > existing[0].confidence:
            by_date[date_key] = (pred, evaluation)

    picks = list(by_date.values())
    total = len(picks)
    evaluated_picks = [(p, e) for p, e in picks if e is not None]
    evaluated = len(evaluated_picks)
    correct = sum(1 for _, e in evaluated_picks if e.is_correct)
    accuracy = (correct / evaluated * 100) if evaluated > 0 else 0.0
    avg_conf = sum(p.confidence for p, _ in picks) / total if total > 0 else 0.0

    # Compute streaks
    current_streak = 0
    best_streak = 0
    temp_streak = 0
    for _, e in evaluated_picks:
        if e.is_correct:
            temp_streak += 1
            best_streak = max(best_streak, temp_streak)
        else:
            temp_streak = 0
    # Current streak: count from the end
    for _, e in reversed(evaluated_picks):
        if e.is_correct:
            current_streak += 1
        else:
            break

    last_date = None
    if picks:
        last_pred = picks[-1][0]
        if last_pred.match and last_pred.match.scheduled_at:
            last_date = last_pred.match.scheduled_at.isoformat()

    return BOTDTrackRecord(
        total_picks=total,
        evaluated=evaluated,
        correct=correct,
        accuracy_pct=round(accuracy, 1),
        current_streak=current_streak,
        best_streak=best_streak,
        avg_confidence=round(avg_conf * 100, 1),
        last_updated=last_date,
    )


class BOTDOdds(BaseModel):
    """Pre-match odds embedded in the BOTD response (v6.2).

    Mirrors the `OddsSummary` shape from fixtures.py. Duplicated as a
    separate type only to keep betoftheday.py self-contained — same
    field names so the frontend can reuse the OddsRow component.
    """

    home: float | None = None
    draw: float | None = None
    away: float | None = None
    over_2_5: float | None = None
    under_2_5: float | None = None
    bookmaker: str | None = None
    fetched_at: str | None = None


class BetOfTheDayResponse(BaseModel):
    available: bool
    match_id: str | None = None
    home_team: str | None = None
    away_team: str | None = None
    league: str | None = None
    scheduled_at: str | None = None
    home_win_prob: float | None = None
    draw_prob: float | None = None
    away_win_prob: float | None = None
    confidence: float | None = None
    predicted_outcome: str | None = None
    explanation_summary: str | None = None
    prediction_id: str | None = None
    # v6.2 transparency: expose the latest pre-match odds if available.
    odds: BOTDOdds | None = None

    class Config:
        from_attributes = True


@router.get("/", response_model=BetOfTheDayResponse)
async def get_bet_of_the_day(
    target_date: Optional[date] = Query(
        default=None,
        description="Date to get BOTD for (defaults to today UTC)",
    ),
    db: AsyncSession = Depends(get_db),
) -> BetOfTheDayResponse:
    """
    Returns the single highest-confidence prediction for the given date.

    Selection criteria:
    1. Match is scheduled for the target date
    2. Match has a prediction
    3. Prediction with highest confidence score wins
    4. Minimum confidence threshold: 0.65 (65%)

    This endpoint surfaces the single top-confidence analytical pick
    of the day for educational and informational purposes.
    """
    now = datetime.now(timezone.utc)

    # v6 fix: when no target_date is specified we want "the best
    # pick for the NEXT 72h", not "the best pick from the whole of
    # today even if it already kicked off". Otherwise the page shows
    # a match with a final score sitting under a "Pick of the Day"
    # header, which confuses users. When a target_date IS specified
    # (e.g. browse history), we keep the day-window behaviour.
    if target_date is None:
        window_start = now
        window_end = now + timedelta(hours=72)
        status_filter = Match.status == MatchStatus.SCHEDULED
    else:
        day_start = datetime.combine(target_date, time.min, tzinfo=timezone.utc)
        day_end = datetime.combine(target_date, time.max, tzinfo=timezone.utc)
        # For historical browsing, accept any status (finished included)
        # so the user can see what the pick WAS that day.
        if target_date >= now.date():
            window_start = max(day_start, now)
            status_filter = Match.status == MatchStatus.SCHEDULED
        else:
            window_start = day_start
            status_filter = None
        window_end = day_end

    base_clauses = [
        Match.scheduled_at >= window_start,
        Match.scheduled_at <= window_end,
        Prediction.confidence >= BOTD_MIN_CONFIDENCE,
    ]
    if status_filter is not None:
        base_clauses.append(status_filter)

    load_opts = [
        joinedload(Prediction.match).joinedload(Match.home_team),
        joinedload(Prediction.match).joinedload(Match.away_team),
        joinedload(Prediction.match).joinedload(Match.league),
        noload(Prediction.evaluation),
        noload(Prediction.model_version),
    ]

    # Try live predictions first; fall back to any prediction if no live picks exist yet
    stmt = (
        select(Prediction)
        .join(Match, Match.id == Prediction.match_id)
        .options(*load_opts)
        .where(and_(*base_clauses, Prediction.prediction_source == "live"))
        .order_by(Prediction.confidence.desc())
        .limit(1)
    )

    result = await db.execute(stmt)
    prediction = result.unique().scalar_one_or_none()

    # Fallback: if no live predictions exist yet, serve backtest predictions
    if prediction is None:
        stmt_fallback = (
            select(Prediction)
            .join(Match, Match.id == Prediction.match_id)
            .options(*load_opts)
            .where(and_(*base_clauses))
            .order_by(Prediction.confidence.desc())
            .limit(1)
        )
        result = await db.execute(stmt_fallback)
        prediction = result.unique().scalar_one_or_none()

    if prediction is None:
        return BetOfTheDayResponse(available=False)

    # Determine the predicted outcome
    probs = {
        "Home Win": prediction.home_win_prob or 0,
        "Draw": prediction.draw_prob or 0,
        "Away Win": prediction.away_win_prob or 0,
    }
    predicted_outcome = max(probs, key=probs.get)  # type: ignore[arg-type]

    # Match and related objects already eager-loaded above
    match = prediction.match

    home_name = match.home_team.name if match and match.home_team else None
    away_name = match.away_team.name if match and match.away_team else None
    league_name = match.league.name if match and match.league else None

    # Explanation already eager-loaded via selectin default on model
    explanation = None
    if prediction.explanation:
        explanation = prediction.explanation.summary

    # v6.2: pull the latest pre-match odds for this match using the same
    # helper the fixtures endpoints use. Yields None when no odds row is
    # on file — the frontend renders nothing in that case (no placeholder).
    botd_odds: BOTDOdds | None = None
    try:
        from app.api.routes.fixtures import _load_latest_odds  # noqa: WPS433
        odds_map = await _load_latest_odds([prediction.match_id], db)
        summary = odds_map.get(prediction.match_id)
        if summary is not None:
            botd_odds = BOTDOdds(
                home=summary.home,
                draw=summary.draw,
                away=summary.away,
                over_2_5=summary.over_2_5,
                under_2_5=summary.under_2_5,
                bookmaker=summary.bookmaker,
                fetched_at=summary.fetched_at,
            )
    except Exception as exc:  # pragma: no cover — odds are nice-to-have
        logger.debug("BOTD odds fetch failed (non-fatal): %s", exc)

    return BetOfTheDayResponse(
        available=True,
        match_id=str(prediction.match_id),
        home_team=home_name,
        away_team=away_name,
        league=league_name,
        scheduled_at=match.scheduled_at.isoformat() if match else None,
        home_win_prob=prediction.home_win_prob,
        draw_prob=prediction.draw_prob,
        away_win_prob=prediction.away_win_prob,
        confidence=prediction.confidence,
        predicted_outcome=predicted_outcome,
        explanation_summary=explanation,
        prediction_id=str(prediction.id),
        odds=botd_odds,
    )
