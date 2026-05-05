"""Public, slug-based team & league endpoints for the marketing site.

These endpoints are consumed by ``betsplug.com`` (Astro) which must NOT see
the API-Football API key. They proxy data the backend already ingested into
Postgres (see ``app.ingestion.adapters.api_football``) and merge it with
static brand metadata (logos, colours, founded year) from
``app.core.team_branding``.

Why a separate ``/public`` namespace instead of overloading ``/api/teams``
and ``/api/leagues`` directly? Those existing routes are typed on UUID and
serve the authenticated dashboard. Reusing the same paths with a different
shape (slug-keyed JSON, no UUIDs leaked) would break the dashboard's
TanStack Query schemas. Marketing-facing endpoints get their own clean
namespace; the spec deviation is documented in the deliverable.

Caching strategy
----------------
* In-memory TTL cache (1 hour) — cheap, survives a single Railway worker
  lifetime, no Redis round-trip.
* HTTP ``Cache-Control: public, max-age=3600, s-maxage=86400`` — browsers
  cache 1h, Vercel/CDN caches 24h. Spec verbatim.

CORS
----
Already wired globally in ``app/main.py`` for ``betsplug.com``,
``www.betsplug.com``, ``marketing.betsplug.com``, and ``localhost:4321``.
"""

import re
import time
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.team_branding import (
    LEAGUE_BRANDING,
    LEAGUE_DISPLAY_ORDER,
    get_league_branding,
    get_team_branding,
)
from app.db.session import get_db
from app.models.league import League
from app.models.team import Team

router = APIRouter()

# Slug pattern: lowercase letters, digits, single hyphens. No leading/trailing
# hyphens, no consecutive hyphens. Used as a Path regex so the router rejects
# garbage before touching the DB. Mirrors the output of API-Football's
# ``_slugify`` (see app/ingestion/adapters/api_football.py).
SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"

# Cache headers per spec — 1h on client, 24h on edge/CDN.
CACHE_HEADERS = {
    "Cache-Control": "public, max-age=3600, s-maxage=86400",
}

_TTL_SECONDS = 3600.0  # 1 hour
_cache: dict[str, tuple[float, Any]] = {}


def _cache_get(key: str) -> Optional[Any]:
    entry = _cache.get(key)
    if entry is None:
        return None
    expiry, value = entry
    if expiry < time.time():
        _cache.pop(key, None)
        return None
    return value


def _cache_set(key: str, value: Any) -> None:
    _cache[key] = (time.time() + _TTL_SECONDS, value)


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class ColorsModel(BaseModel):
    primary: str
    secondary: str


class LeagueRefModel(BaseModel):
    slug: str
    name: str


class LeagueModel(BaseModel):
    slug: str
    name: str
    country: Optional[str] = None
    logo_url: Optional[str] = Field(default=None, alias="logoUrl")
    colors: Optional[ColorsModel] = None
    season: Optional[str] = None

    model_config = {"populate_by_name": True}


class TeamModel(BaseModel):
    slug: str
    name: str
    short_name: Optional[str] = Field(default=None, alias="shortName")
    country: Optional[str] = None
    league: Optional[LeagueRefModel] = None
    logo_url: Optional[str] = Field(default=None, alias="logoUrl")
    colors: Optional[ColorsModel] = None
    founded: Optional[int] = None
    venue: Optional[str] = None

    model_config = {"populate_by_name": True}


class TeamSummaryModel(BaseModel):
    """Compact team shape returned by the league-teams list endpoint."""

    slug: str
    name: str
    short_name: Optional[str] = Field(default=None, alias="shortName")
    logo_url: Optional[str] = Field(default=None, alias="logoUrl")
    colors: Optional[ColorsModel] = None

    model_config = {"populate_by_name": True}


class LeaguesEnvelopeModel(BaseModel):
    leagues: list[LeagueModel]


class LeagueTeamsEnvelopeModel(BaseModel):
    league: LeagueModel
    teams: list[TeamSummaryModel]
    count: int


class ErrorModel(BaseModel):
    error: str
    message: str


# ---------------------------------------------------------------------------
# Builders — turn ORM rows + branding config into response objects
# ---------------------------------------------------------------------------


def _build_league_payload(league: League) -> LeagueModel:
    branding = get_league_branding(league.slug)
    return LeagueModel(
        slug=league.slug,
        name=league.name,
        country=league.country,
        logoUrl=branding["logo_url"] if branding else None,
        colors=ColorsModel(**branding["colors"]) if branding else None,
        season=branding["season"] if branding else None,
    )


def _build_team_payload(team: Team) -> TeamModel:
    branding = get_team_branding(team.slug) or {}
    league_ref: Optional[LeagueRefModel] = None
    if team.league is not None:
        league_ref = LeagueRefModel(slug=team.league.slug, name=team.league.name)
    return TeamModel(
        slug=team.slug,
        name=team.name,
        shortName=team.short_name,
        country=team.country,
        league=league_ref,
        logoUrl=team.logo_url,
        colors=(
            ColorsModel(**branding["colors"]) if "colors" in branding else None
        ),
        founded=branding.get("founded"),
        venue=team.venue,
    )


def _build_team_summary(team: Team) -> TeamSummaryModel:
    branding = get_team_branding(team.slug) or {}
    return TeamSummaryModel(
        slug=team.slug,
        name=team.name,
        shortName=team.short_name,
        logoUrl=team.logo_url,
        colors=(
            ColorsModel(**branding["colors"]) if "colors" in branding else None
        ),
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/leagues",
    response_model=LeaguesEnvelopeModel,
    summary="List supported leagues with logos + brand colours",
)
async def list_leagues(
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> LeaguesEnvelopeModel:
    """Return the 10 launch-supported leagues, ordered by display priority.

    Source-of-truth for *which* leagues are supported is
    ``LEAGUE_BRANDING`` (static); the DB row is used to fill in country
    and confirm the league actually exists in our system. If a branded
    league has no DB row yet (fresh deploy, ingestion hasn't run) it is
    still returned with ``country=None`` rather than dropped.
    """
    response.headers.update(CACHE_HEADERS)

    cache_key = "public:leagues:v1"
    cached = _cache_get(cache_key)
    if cached is not None:
        return LeaguesEnvelopeModel.model_validate(cached)

    result = await db.execute(
        select(League).where(League.slug.in_(LEAGUE_DISPLAY_ORDER))
    )
    db_leagues = {lg.slug: lg for lg in result.scalars().all()}

    leagues_out: list[LeagueModel] = []
    for slug in LEAGUE_DISPLAY_ORDER:
        branding = LEAGUE_BRANDING.get(slug)
        if branding is None:
            continue
        db_lg = db_leagues.get(slug)
        leagues_out.append(
            LeagueModel(
                slug=slug,
                name=db_lg.name if db_lg else slug.replace("-", " ").title(),
                country=db_lg.country if db_lg else None,
                logoUrl=branding["logo_url"],
                colors=ColorsModel(**branding["colors"]),
                season=branding["season"],
            )
        )

    payload = LeaguesEnvelopeModel(leagues=leagues_out)
    _cache_set(cache_key, payload.model_dump(by_alias=True))
    return payload


@router.get(
    "/leagues/{slug}/teams",
    response_model=LeagueTeamsEnvelopeModel,
    responses={404: {"model": ErrorModel}},
    summary="List teams in a league with logos + brand colours",
)
async def list_league_teams(
    response: Response,
    slug: str = Path(..., pattern=SLUG_PATTERN),
    db: AsyncSession = Depends(get_db),
) -> LeagueTeamsEnvelopeModel:
    response.headers.update(CACHE_HEADERS)

    cache_key = f"public:league-teams:v1:{slug}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return LeagueTeamsEnvelopeModel.model_validate(cached)

    branding = get_league_branding(slug)
    if branding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "league_not_found",
                "message": f"League with slug '{slug}' not supported",
            },
        )

    result = await db.execute(
        select(League).where(League.slug == slug)
    )
    league = result.scalar_one_or_none()
    if league is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "league_not_found",
                "message": f"League with slug '{slug}' not found",
            },
        )

    teams_result = await db.execute(
        select(Team)
        .where(Team.league_id == league.id, Team.is_active.is_(True))
        .order_by(Team.name)
    )
    teams = teams_result.scalars().all()

    league_payload = LeagueModel(
        slug=league.slug,
        name=league.name,
        country=league.country,
        logoUrl=branding["logo_url"],
        colors=ColorsModel(**branding["colors"]),
        season=branding["season"],
    )
    payload = LeagueTeamsEnvelopeModel(
        league=league_payload,
        teams=[_build_team_summary(t) for t in teams],
        count=len(teams),
    )
    _cache_set(cache_key, payload.model_dump(by_alias=True))
    return payload


@router.get(
    "/teams/{slug}",
    response_model=TeamModel,
    responses={404: {"model": ErrorModel}},
    summary="Get team detail by slug (logo, colours, league, venue)",
)
async def get_team(
    response: Response,
    slug: str = Path(..., pattern=SLUG_PATTERN),
    db: AsyncSession = Depends(get_db),
) -> TeamModel:
    response.headers.update(CACHE_HEADERS)

    cache_key = f"public:team:v1:{slug}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return TeamModel.model_validate(cached)

    result = await db.execute(
        select(Team)
        .options(selectinload(Team.league))
        .where(Team.slug == slug)
    )
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "team_not_found",
                "message": f"Team with slug '{slug}' not found",
            },
        )

    payload = _build_team_payload(team)
    _cache_set(cache_key, payload.model_dump(by_alias=True))
    return payload
