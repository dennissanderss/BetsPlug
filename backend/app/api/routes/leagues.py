"""Leagues routes."""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.league import League
from app.models.match import Match
from app.schemas.league import LeagueResponse
from app.schemas.match import MatchResponse

router = APIRouter()


@router.get(
    "/",
    response_model=List[LeagueResponse],
    summary="List leagues",
)
async def list_leagues(
    sport_id: Optional[uuid.UUID] = Query(
        default=None, description="Filter by parent sport UUID"
    ),
    db: AsyncSession = Depends(get_db),
) -> List[LeagueResponse]:
    """Return active leagues. Optionally filter by ``sport_id``."""
    q = select(League).where(League.is_active.is_(True))
    if sport_id is not None:
        q = q.where(League.sport_id == sport_id)
    q = q.order_by(League.name)
    result = await db.execute(q)
    leagues = result.scalars().all()
    return [LeagueResponse.model_validate(lg) for lg in leagues]


@router.get(
    "/{league_id}",
    response_model=LeagueResponse,
    summary="Get league detail",
)
async def get_league(
    league_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> LeagueResponse:
    """Fetch a single league by its UUID."""
    result = await db.execute(select(League).where(League.id == league_id))
    league = result.scalar_one_or_none()
    if league is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"League {league_id} not found.",
        )
    return LeagueResponse.model_validate(league)


@router.get(
    "/{league_id}/matches",
    response_model=List[MatchResponse],
    summary="List matches for a league",
)
async def list_league_matches(
    league_id: uuid.UUID,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> List[MatchResponse]:
    """Return matches belonging to a league, ordered by scheduled date descending."""
    # Verify league exists
    league_result = await db.execute(select(League).where(League.id == league_id))
    if league_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"League {league_id} not found.",
        )

    result = await db.execute(
        select(Match)
        .where(Match.league_id == league_id)
        .order_by(Match.scheduled_at.desc())
        .offset(offset)
        .limit(limit)
    )
    matches = result.scalars().all()
    return [MatchResponse.from_orm_match(m) for m in matches]
