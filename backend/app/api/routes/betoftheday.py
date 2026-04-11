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

    where_clauses = [
        Match.scheduled_at >= window_start,
        Match.scheduled_at <= window_end,
        Prediction.confidence >= 0.55,
    ]
    if status_filter is not None:
        where_clauses.append(status_filter)

    stmt = (
        select(Prediction)
        .join(Match, Match.id == Prediction.match_id)
        .options(
            joinedload(Prediction.match)
            .joinedload(Match.home_team),
            joinedload(Prediction.match)
            .joinedload(Match.away_team),
            joinedload(Prediction.match)
            .joinedload(Match.league),
            noload(Prediction.evaluation),
            noload(Prediction.model_version),
        )
        .where(and_(*where_clauses))
        .order_by(Prediction.confidence.desc())
        .limit(1)
    )

    result = await db.execute(stmt)
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
