"""Teams routes."""

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.match import Match, MatchResult, MatchStatus
from app.models.stats import TeamStats as TeamStatsModel
from app.models.team import Team
from app.schemas.match import MatchResponse
from app.schemas.team import TeamDetail, TeamForm, TeamResponse
from app.schemas.team import TeamStats as TeamStatsSchema

router = APIRouter()


@router.get(
    "/{team_id}",
    response_model=TeamDetail,
    summary="Get team detail",
)
async def get_team(
    team_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> TeamDetail:
    """Return full team detail including league relationship."""
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team {team_id} not found.",
        )
    return TeamDetail.model_validate(team)


@router.get(
    "/{team_id}/matches",
    response_model=List[MatchResponse],
    summary="List team matches (home or away)",
)
async def list_team_matches(
    team_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> List[MatchResponse]:
    """Return matches where the team plays at home or away, most recent first."""
    team_result = await db.execute(select(Team).where(Team.id == team_id))
    if team_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team {team_id} not found.",
        )

    result = await db.execute(
        select(Match)
        .where(
            or_(Match.home_team_id == team_id, Match.away_team_id == team_id)
        )
        .order_by(Match.scheduled_at.desc())
        .offset(offset)
        .limit(limit)
    )
    matches = result.scalars().all()
    return [MatchResponse.from_orm_match(m) for m in matches]


@router.get(
    "/{team_id}/form",
    response_model=TeamForm,
    summary="Get team recent form",
)
async def get_team_form(
    team_id: uuid.UUID,
    n: int = Query(default=10, ge=1, le=20, description="Number of recent matches to include"),
    db: AsyncSession = Depends(get_db),
) -> TeamForm:
    """
    Return the team's form over the last N finished matches.

    Each result code is 'W', 'D', or 'L' from the team's perspective.
    """
    team_result = await db.execute(select(Team).where(Team.id == team_id))
    if team_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team {team_id} not found.",
        )

    result = await db.execute(
        select(Match)
        .join(MatchResult, MatchResult.match_id == Match.id)
        .where(
            or_(Match.home_team_id == team_id, Match.away_team_id == team_id),
            Match.status == MatchStatus.FINISHED,
        )
        .order_by(Match.scheduled_at.desc())
        .limit(n)
    )
    matches = result.scalars().all()

    codes: list[str] = []
    goals_scored_last_5 = 0
    goals_conceded_last_5 = 0

    for i, m in enumerate(reversed(matches)):  # oldest → newest for display
        if m.result is None:
            continue
        if m.home_team_id == team_id:
            scored = m.result.home_score
            conceded = m.result.away_score
            winner = m.result.winner
            code = "W" if winner == "home" else ("D" if winner == "draw" else "L")
        else:
            scored = m.result.away_score
            conceded = m.result.home_score
            winner = m.result.winner
            code = "W" if winner == "away" else ("D" if winner == "draw" else "L")

        codes.append(code)
        # Accumulate goals for last 5 (codes is oldest-first so we check index)
        idx_from_end = len(matches) - 1 - i
        if idx_from_end < 5:
            goals_scored_last_5 += scored
            goals_conceded_last_5 += conceded

    last_5 = codes[-5:] if len(codes) >= 5 else codes
    last_10 = codes[-10:] if len(codes) >= 10 else codes

    return TeamForm(
        last_5=last_5,
        last_10=last_10,
        wins_last_5=last_5.count("W"),
        draws_last_5=last_5.count("D"),
        losses_last_5=last_5.count("L"),
        wins_last_10=last_10.count("W"),
        draws_last_10=last_10.count("D"),
        losses_last_10=last_10.count("L"),
        goals_scored_last_5=goals_scored_last_5,
        goals_conceded_last_5=goals_conceded_last_5,
    )


@router.get(
    "/{team_id}/stats",
    response_model=TeamStatsSchema,
    summary="Get team season statistics",
)
async def get_team_stats(
    team_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> TeamStatsSchema:
    """
    Return the most recent season stats for a team.

    # TODO: delegate to service layer for multi-season aggregation
    """
    team_result = await db.execute(select(Team).where(Team.id == team_id))
    if team_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team {team_id} not found.",
        )

    stats_result = await db.execute(
        select(TeamStatsModel)
        .where(TeamStatsModel.team_id == team_id)
        .order_by(TeamStatsModel.created_at.desc())
        .limit(1)
    )
    stats = stats_result.scalar_one_or_none()

    if stats is None:
        # Return zeroed stats when no data has been ingested yet
        return TeamStatsSchema()

    return TeamStatsSchema(
        matches_played=stats.matches_played,
        wins=stats.wins,
        draws=stats.draws,
        losses=stats.losses,
        goals_scored=stats.goals_scored,
        goals_conceded=stats.goals_conceded,
        goal_difference=stats.goals_scored - stats.goals_conceded,
        home_wins=stats.home_wins,
        away_wins=stats.away_wins,
        extra=stats.extra_stats,
    )
