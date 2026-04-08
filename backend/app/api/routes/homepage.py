"""Homepage featured match endpoint.

Returns the highest-edge upcoming prediction for the hero card on the homepage.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.match import Match, MatchStatus
from app.models.prediction import Prediction

router = APIRouter()
log = logging.getLogger(__name__)


class FeaturedMatchResponse(BaseModel):
    available: bool
    home_team: Optional[str] = None
    away_team: Optional[str] = None
    league: Optional[str] = None
    kickoff: Optional[str] = None
    pick: Optional[str] = None
    home_win_prob: Optional[float] = None
    draw_prob: Optional[float] = None
    away_win_prob: Optional[float] = None
    confidence: Optional[float] = None
    elo_diff: Optional[int] = None
    edge: Optional[float] = None
    label: Optional[str] = None


@router.get(
    "/featured-match",
    response_model=FeaturedMatchResponse,
    summary="Featured match for homepage hero card",
)
async def get_featured_match(
    db: AsyncSession = Depends(get_db),
) -> FeaturedMatchResponse:
    """
    Returns the highest-confidence upcoming prediction for the hero card.

    Selection: upcoming fixtures in next 72h, sorted by confidence DESC.
    Label "HOT" if confidence > 0.60.
    Falls back to any upcoming match with a prediction.
    """
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(hours=72)

    stmt = (
        select(Prediction)
        .join(Match, Match.id == Prediction.match_id)
        .where(
            and_(
                Match.status == MatchStatus.SCHEDULED,
                Match.scheduled_at >= now,
                Match.scheduled_at <= cutoff,
            )
        )
        .order_by(Prediction.confidence.desc())
        .limit(1)
    )

    result = await db.execute(stmt)
    prediction = result.scalar_one_or_none()

    if prediction is None:
        return FeaturedMatchResponse(available=False)

    match = prediction.match
    home_name = match.home_team.name if match and match.home_team else None
    away_name = match.away_team.name if match and match.away_team else None
    league_name = match.league.name if match and match.league else None

    # Determine pick
    probs = {
        "HOME": prediction.home_win_prob,
        "DRAW": prediction.draw_prob or 0,
        "AWAY": prediction.away_win_prob,
    }
    pick = max(probs, key=lambda k: probs[k])

    # Estimate Elo diff from raw_output if available
    elo_diff = None
    if prediction.raw_output and isinstance(prediction.raw_output, dict):
        sub_models = prediction.raw_output.get("sub_models", [])
        for sm in sub_models:
            if sm.get("model") == "EloModel" and "explanation_factors" in sm:
                ef = sm["explanation_factors"]
                elo_diff = int(ef.get("elo_difference", 0))
                break

    # Estimate edge (model prob - uniform 33%)
    max_prob = max(probs.values())
    edge = round(max_prob - (1 / 3), 4)

    label = "HOT" if prediction.confidence > 0.60 else None

    return FeaturedMatchResponse(
        available=True,
        home_team=home_name,
        away_team=away_name,
        league=league_name,
        kickoff=match.scheduled_at.isoformat() if match else None,
        pick=pick,
        home_win_prob=round(prediction.home_win_prob, 4),
        draw_prob=round(prediction.draw_prob, 4) if prediction.draw_prob else None,
        away_win_prob=round(prediction.away_win_prob, 4),
        confidence=round(prediction.confidence, 4),
        elo_diff=elo_diff,
        edge=round(edge, 4),
        label=label,
    )
