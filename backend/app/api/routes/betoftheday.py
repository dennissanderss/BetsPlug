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

from app.db.session import get_db
from app.models.match import Match
from app.models.prediction import Prediction

logger = logging.getLogger(__name__)

router = APIRouter()


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
    if target_date is None:
        target_date = datetime.now(timezone.utc).date()

    day_start = datetime.combine(target_date, time.min, tzinfo=timezone.utc)
    day_end = datetime.combine(target_date, time.max, tzinfo=timezone.utc)

    # Find the highest-confidence prediction for today's matches.
    # Eager-load match + its teams/league and explanation in one go;
    # suppress evaluation and model_version (not needed here).
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
        .where(
            and_(
                Match.scheduled_at >= day_start,
                Match.scheduled_at <= day_end,
                Prediction.confidence >= 0.55,  # Minimum confidence threshold
            )
        )
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
    )
