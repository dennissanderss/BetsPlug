"""
Live Football Data Routes
=========================
Exposes real-time football data sourced from free public APIs with no paid
key required (falls back to OpenLigaDB automatically).

Endpoints
---------
GET /live/today           – today's matches with live scores
GET /live/upcoming        – next 7 days fixtures
GET /live/results         – last 7 days results
GET /live/standings/{lg}  – current table for a league
GET /live/sync            – trigger a full data sync across all sources
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.services.live_data_service import LiveDataService, ALL_LEAGUE_SLUGS

router = APIRouter()


# ---------------------------------------------------------------------------
# Dependency: shared HTTP client + service
# ---------------------------------------------------------------------------
# We create a single AsyncClient per-request here for simplicity.
# In a production setup you would use FastAPI lifespan events to share a
# single client across all requests.

async def _get_service() -> LiveDataService:
    """Create a LiveDataService with a fresh httpx client for this request."""
    client = httpx.AsyncClient(timeout=30)
    # football-data.org disabled (2026-04-14) — API-Football Pro is sole source
    return LiveDataService(http_client=client, fdorg_api_key="")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get(
    "/today",
    summary="Today's matches",
    description=(
        "Returns all football matches scheduled for today, including live "
        "scores where available.  Data is sourced from football-data.org, "
        "OpenLigaDB, and TheSportsDB.  No API key required."
    ),
)
async def get_todays_matches() -> dict[str, Any]:
    """Fetch and return today's matches from all configured live data sources."""
    service = await _get_service()
    try:
        matches = await service.get_todays_matches()
        return {
            "status": "ok",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "count": len(matches),
            "matches": matches,
        }
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Failed to fetch today's matches: {exc}") from exc
    finally:
        await service.aclose()


@router.get(
    "/upcoming",
    summary="Upcoming fixtures",
    description="Returns fixtures for the next N days (default 7).",
)
async def get_upcoming_matches(
    days: int = Query(default=7, ge=1, le=30, description="Number of days ahead to fetch"),
) -> dict[str, Any]:
    """Fetch upcoming fixtures for the next ``days`` days."""
    service = await _get_service()
    try:
        matches = await service.get_upcoming_matches(days=days)
        return {
            "status": "ok",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "days": days,
            "count": len(matches),
            "matches": matches,
        }
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Failed to fetch upcoming matches: {exc}") from exc
    finally:
        await service.aclose()


@router.get(
    "/results",
    summary="Recent results",
    description="Returns completed match results for the last N days (default 7).",
)
async def get_recent_results(
    days: int = Query(default=7, ge=1, le=30, description="Number of days back to fetch"),
) -> dict[str, Any]:
    """Fetch completed results from the last ``days`` days."""
    service = await _get_service()
    try:
        results = await service.get_recent_results(days=days)
        return {
            "status": "ok",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "days": days,
            "count": len(results),
            "results": results,
        }
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Failed to fetch results: {exc}") from exc
    finally:
        await service.aclose()


@router.get(
    "/standings/{league}",
    summary="League standings",
    description=(
        "Returns the current standings table for the specified league.\n\n"
        "Supported league codes (case-insensitive):\n"
        "- `bundesliga` / `bl1` – Bundesliga (Germany)\n"
        "- `premier-league` / `pl` – Premier League (England)\n"
        "- `la-liga` / `pd` – La Liga (Spain)\n"
        "- `serie-a` / `sa` – Serie A (Italy)\n"
        "- `ligue-1` / `fl1` – Ligue 1 (France)\n"
        "- `champions-league` / `cl` – UEFA Champions League\n"
        "- `2-bundesliga` / `bl2` – 2. Bundesliga (Germany)\n\n"
        "The Bundesliga endpoint always works without any API key via OpenLigaDB."
    ),
)
async def get_standings(
    league: str,
    season: str = Query(
        default=None,
        description=(
            "Season start year (e.g. '2024' for 2024/25). "
            "Defaults to the current season."
        ),
    ),
) -> dict[str, Any]:
    """Fetch the current standings for the given league."""
    # Map common shorthand codes to internal slugs
    alias_map = {
        "pl":   "premier-league",
        "pd":   "la-liga",
        "bl1":  "bundesliga",
        "bl2":  "2-bundesliga",
        "sa":   "serie-a",
        "fl1":  "ligue-1",
        "cl":   "champions-league",
        "bl3":  "3-liga",
    }
    normalised = league.lower().strip()
    league_slug = alias_map.get(normalised, normalised)

    service = await _get_service()
    try:
        standings = await service.get_league_standings(league_slug)
        if not standings:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"No standings found for league '{league}'. "
                    f"Supported leagues: {', '.join(ALL_LEAGUE_SLUGS)}"
                ),
            )
        return {
            "status": "ok",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "league": league_slug,
            "count": len(standings),
            "standings": standings,
        }
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502, detail=f"Failed to fetch standings for '{league}': {exc}"
        ) from exc
    finally:
        await service.aclose()


@router.get(
    "/sync",
    summary="Trigger full data sync",
    description=(
        "Triggers a full synchronisation across all configured data sources "
        "for the past 7 days and next 7 days, plus standings for all leagues. "
        "Clears the in-memory cache.  Returns a summary of what was fetched."
    ),
)
async def sync_all(
    confirm: bool = Query(
        default=False,
        description="Set to true to actually run the sync (safety guard).",
    ),
) -> dict[str, Any]:
    """Run a full data sync from all sources."""
    if not confirm:
        return {
            "status": "dry_run",
            "message": (
                "Pass ?confirm=true to actually run the sync. "
                "This will make many HTTP requests to external APIs."
            ),
            "supported_leagues": ALL_LEAGUE_SLUGS,
        }

    service = await _get_service()
    try:
        summary = await service.sync_all_data()
        return {
            "status": "ok",
            "summary": summary,
        }
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Sync failed: {exc}") from exc
    finally:
        await service.aclose()


@router.get(
    "/sources",
    summary="List data sources",
    description="Returns metadata about all configured live data sources.",
)
async def list_sources() -> dict[str, Any]:
    """Return information about the configured live data adapters."""
    return {
        "status": "ok",
        "sources": [
            {
                "name": "football_data_org",
                "description": "football-data.org v4 API – top 5 European leagues + Champions League",
                "requires_key": True,
                "key_env_var": "FOOTBALL_DATA_ORG_API_KEY",
                "sign_up_url": "https://www.football-data.org/client/register",
                "free_tier_limits": "10 requests/minute",
                "leagues": sorted(_FDORG_LEAGUES()),
            },
            {
                "name": "openligadb",
                "description": "OpenLigaDB – German football leagues, completely free",
                "requires_key": False,
                "free_tier_limits": "No published limits – be polite",
                "leagues": sorted(_OLDB_LEAGUES()),
            },
            {
                "name": "thesportsdb",
                "description": "TheSportsDB – broad European coverage, free tier key=3",
                "requires_key": False,
                "free_tier_limits": "Unofficial; use at ~1 req/s",
                "leagues": sorted(_TSDB_LEAGUES()),
            },
        ],
        "supported_leagues": ALL_LEAGUE_SLUGS,
    }


# ---------------------------------------------------------------------------
# Lazy imports for /sources endpoint helpers
# ---------------------------------------------------------------------------

def _FDORG_LEAGUES() -> list[str]:
    from app.ingestion.adapters.football_data_org import LEAGUE_SLUG_TO_CODE
    return list(LEAGUE_SLUG_TO_CODE.keys())

def _OLDB_LEAGUES() -> list[str]:
    from app.ingestion.adapters.openligadb import LEAGUE_SLUG_TO_OLDB
    return list(LEAGUE_SLUG_TO_OLDB.keys())

def _TSDB_LEAGUES() -> list[str]:
    from app.ingestion.adapters.thesportsdb import LEAGUE_SLUG_TO_ID
    return list(LEAGUE_SLUG_TO_ID.keys())
