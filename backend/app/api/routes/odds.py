"""Odds endpoints — real bookmaker odds from The Odds API."""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

router = APIRouter()
log = logging.getLogger(__name__)


class OddsResponse(BaseModel):
    league: str
    matches: list[dict]
    bookmakers_count: int
    source: str = "the_odds_api"


@router.get(
    "/upcoming",
    response_model=list[dict],
    summary="Get upcoming match odds for a league",
)
async def get_upcoming_odds(
    league: str = Query(default="premier-league", description="League slug"),
):
    """Fetch real bookmaker odds for upcoming matches in a league."""
    from app.core.config import get_settings
    from app.ingestion.adapters.the_odds_api import TheOddsAPIAdapter

    settings = get_settings()
    key = getattr(settings, "the_odds_api_key", "")
    if not key:
        return []

    adapter = TheOddsAPIAdapter(api_key=key)
    odds = await adapter.fetch_odds_for_league(league)
    return odds


@router.get(
    "/match",
    response_model=dict,
    summary="Get odds for a specific match by team names",
)
async def get_match_odds(
    home: str = Query(description="Home team name"),
    away: str = Query(description="Away team name"),
    league: str = Query(default="premier-league"),
):
    """Find odds for a specific match."""
    from app.core.config import get_settings
    from app.ingestion.adapters.the_odds_api import TheOddsAPIAdapter

    settings = get_settings()
    key = getattr(settings, "the_odds_api_key", "")
    if not key:
        return {"found": False, "reason": "THE_ODDS_API_KEY not configured"}

    adapter = TheOddsAPIAdapter(api_key=key)
    odds = await adapter.fetch_odds_for_league(league)

    home_lower = home.lower()
    away_lower = away.lower()
    for match_odds in odds:
        if (home_lower in match_odds["home_team_name"].lower() and
            away_lower in match_odds["away_team_name"].lower()):
            return {"found": True, **match_odds}

    return {"found": False, "reason": f"No odds found for {home} vs {away}"}
