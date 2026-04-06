"""Cross-entity search route."""

import time
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.league import League
from app.models.match import Match
from app.models.sport import Sport
from app.models.team import Team
from app.schemas.search import SearchResponse, SearchResult, SearchResultGroup

router = APIRouter()

# Maximum results returned per entity type in a single search
_PER_TYPE_CAP = 50


@router.get(
    "/",
    response_model=SearchResponse,
    summary="Search across sports, leagues, teams and matches",
)
async def search(
    q: str = Query(..., min_length=1, description="Search query string"),
    sport: Optional[str] = Query(
        default=None, description="Filter results to a specific sport slug"
    ),
    limit: int = Query(default=20, ge=1, le=100, description="Max results per entity type"),
    db: AsyncSession = Depends(get_db),
) -> SearchResponse:
    """
    Perform a case-insensitive fuzzy search across sports, leagues, teams, and matches.
    Results are grouped by entity type.
    """
    started = time.monotonic()
    pattern = f"%{q}%"
    cap = min(limit, _PER_TYPE_CAP)

    groups: list[SearchResultGroup] = []
    grand_total = 0

    # ------------------------------------------------------------------
    # Sports
    # ------------------------------------------------------------------
    sports_q = select(Sport).where(
        Sport.is_active.is_(True),
        or_(Sport.name.ilike(pattern), Sport.slug.ilike(pattern)),
    ).limit(cap)
    sports_rows = (await db.execute(sports_q)).scalars().all()

    if sports_rows:
        items = [
            SearchResult(
                id=s.id,
                entity_type="sport",
                name=s.name,
                slug=s.slug,
                description=None,
                metadata={"icon": s.icon},
            )
            for s in sports_rows
        ]
        groups.append(
            SearchResultGroup(
                entity_type="sport",
                label="Sports",
                items=items,
                total_hits=len(items),
            )
        )
        grand_total += len(items)

    # ------------------------------------------------------------------
    # Leagues
    # ------------------------------------------------------------------
    leagues_q = (
        select(League)
        .join(Sport, Sport.id == League.sport_id)
        .where(
            League.is_active.is_(True),
            or_(League.name.ilike(pattern), League.slug.ilike(pattern)),
        )
    )
    if sport:
        leagues_q = leagues_q.where(Sport.slug == sport)
    leagues_q = leagues_q.limit(cap)
    leagues_rows = (await db.execute(leagues_q)).scalars().all()

    if leagues_rows:
        items = [
            SearchResult(
                id=lg.id,
                entity_type="league",
                name=lg.name,
                slug=lg.slug,
                description=f"{lg.sport.name} — {lg.country}" if lg.country else lg.sport.name,
                metadata={"country": lg.country, "tier": lg.tier},
            )
            for lg in leagues_rows
        ]
        groups.append(
            SearchResultGroup(
                entity_type="league",
                label="Leagues",
                items=items,
                total_hits=len(items),
            )
        )
        grand_total += len(items)

    # ------------------------------------------------------------------
    # Teams
    # ------------------------------------------------------------------
    teams_q = (
        select(Team)
        .join(League, League.id == Team.league_id)
        .join(Sport, Sport.id == League.sport_id)
        .where(
            Team.is_active.is_(True),
            or_(Team.name.ilike(pattern), Team.slug.ilike(pattern)),
        )
    )
    if sport:
        teams_q = teams_q.where(Sport.slug == sport)
    teams_q = teams_q.limit(cap)
    teams_rows = (await db.execute(teams_q)).scalars().all()

    if teams_rows:
        items = [
            SearchResult(
                id=t.id,
                entity_type="team",
                name=t.name,
                slug=t.slug,
                description=t.league.name if t.league else None,
                metadata={"country": t.country, "league_id": str(t.league_id)},
            )
            for t in teams_rows
        ]
        groups.append(
            SearchResultGroup(
                entity_type="team",
                label="Teams",
                items=items,
                total_hits=len(items),
            )
        )
        grand_total += len(items)

    # ------------------------------------------------------------------
    # Matches  (search on venue or team names via join)
    # ------------------------------------------------------------------
    HomeTeam = Team.__table__.alias("home_team_alias")
    AwayTeam = Team.__table__.alias("away_team_alias")

    matches_q = (
        select(Match)
        .join(League, League.id == Match.league_id)
        .join(Sport, Sport.id == League.sport_id)
        .join(HomeTeam, HomeTeam.c.id == Match.home_team_id)
        .join(AwayTeam, AwayTeam.c.id == Match.away_team_id)
        .where(
            or_(
                Match.venue.ilike(pattern),
                HomeTeam.c.name.ilike(pattern),
                AwayTeam.c.name.ilike(pattern),
            )
        )
    )
    if sport:
        matches_q = matches_q.where(Sport.slug == sport)
    matches_q = matches_q.order_by(Match.scheduled_at.desc()).limit(cap)
    matches_rows = (await db.execute(matches_q)).scalars().all()

    if matches_rows:
        items = [
            SearchResult(
                id=m.id,
                entity_type="match",
                name=(
                    f"{m.home_team.name} vs {m.away_team.name}"
                    if m.home_team and m.away_team
                    else str(m.id)
                ),
                slug=None,
                description=(
                    f"{m.league.name} — {m.scheduled_at.strftime('%Y-%m-%d')}"
                    if m.league
                    else None
                ),
                metadata={
                    "status": m.status.value,
                    "scheduled_at": m.scheduled_at.isoformat(),
                },
            )
            for m in matches_rows
        ]
        groups.append(
            SearchResultGroup(
                entity_type="match",
                label="Matches",
                items=items,
                total_hits=len(items),
            )
        )
        grand_total += len(items)

    took_ms = (time.monotonic() - started) * 1000

    return SearchResponse(
        query=q,
        groups=groups,
        total_hits=grand_total,
        took_ms=round(took_ms, 2),
    )
