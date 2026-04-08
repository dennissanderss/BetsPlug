"""
The Odds API Adapter
====================
Fetches real bookmaker odds from the-odds-api.com.

Free tier: 500 requests/month, covers all major football leagues.
Aggregates 40+ bookmakers (Pinnacle, Bet365, Betfair, William Hill, etc.)

This adapter ONLY handles odds. Fixtures/results come from other providers.
"""

import asyncio
import logging
import re
from datetime import datetime, timezone
from typing import Optional

import httpx

log = logging.getLogger(__name__)

BASE_URL = "https://api.the-odds-api.com/v4"

# Map our internal league slugs to The Odds API sport keys
LEAGUE_TO_SPORT_KEY: dict[str, str] = {
    "premier-league": "soccer_epl",
    "la-liga": "soccer_spain_la_liga",
    "bundesliga": "soccer_germany_bundesliga",
    "serie-a": "soccer_italy_serie_a",
    "ligue-1": "soccer_france_ligue_one",
    "eredivisie": "soccer_netherlands_eredivisie",
    "champions-league": "soccer_uefa_champs_league",
}

SPORT_KEY_TO_LEAGUE: dict[str, str] = {v: k for k, v in LEAGUE_TO_SPORT_KEY.items()}


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return re.sub(r"-+", "-", text).strip("-")


class TheOddsAPIAdapter:
    """Fetches odds data from The Odds API. Not a full DataSourceAdapter — odds only."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self._remaining_requests: Optional[int] = None

    async def fetch_odds_for_league(
        self,
        league_slug: str,
        client: Optional[httpx.AsyncClient] = None,
    ) -> list[dict]:
        """Fetch upcoming match odds for a league.

        Returns normalized odds dicts:
        {
            "home_team_slug": str,
            "away_team_slug": str,
            "home_team_name": str,
            "away_team_name": str,
            "commence_time": str (ISO),
            "league_slug": str,
            "bookmakers": [...],
            "best_odds": {"home": float, "draw": float, "away": float},
            "avg_odds": {"home": float, "draw": float, "away": float},
            "implied_probs": {"home": float, "draw": float, "away": float},
        }
        """
        sport_key = LEAGUE_TO_SPORT_KEY.get(league_slug)
        if not sport_key:
            log.warning("No sport key mapping for league: %s", league_slug)
            return []

        params = {
            "apiKey": self.api_key,
            "regions": "eu,uk",
            "markets": "h2h",
            "oddsFormat": "decimal",
        }

        own_client = client is None
        if own_client:
            client = httpx.AsyncClient(timeout=15)

        try:
            resp = await client.get(f"{BASE_URL}/sports/{sport_key}/odds/", params=params)

            # Track remaining quota
            self._remaining_requests = int(resp.headers.get("x-requests-remaining", -1))
            log.info(
                "TheOddsAPI: %s returned %d, remaining=%s",
                sport_key, resp.status_code, self._remaining_requests,
            )

            if resp.status_code != 200:
                log.error("TheOddsAPI error: %d %s", resp.status_code, resp.text[:200])
                return []

            data = resp.json()
            return [self._normalize(event, league_slug) for event in data]

        finally:
            if own_client:
                await client.aclose()

    def _normalize(self, event: dict, league_slug: str) -> dict:
        """Normalize a single event from The Odds API response."""
        home_name = event.get("home_team", "")
        away_name = event.get("away_team", "")

        # Collect odds from all bookmakers
        home_odds_list: list[float] = []
        draw_odds_list: list[float] = []
        away_odds_list: list[float] = []
        bookmaker_data: list[dict] = []

        for bm in event.get("bookmakers", []):
            for market in bm.get("markets", []):
                if market.get("key") != "h2h":
                    continue
                outcomes = {o["name"]: o["price"] for o in market.get("outcomes", [])}
                h = outcomes.get(home_name)
                a = outcomes.get(away_name)
                d = outcomes.get("Draw")

                if h and a:
                    home_odds_list.append(h)
                    away_odds_list.append(a)
                    if d:
                        draw_odds_list.append(d)
                    bookmaker_data.append({
                        "name": bm.get("title", bm.get("key")),
                        "home": h,
                        "draw": d,
                        "away": a,
                        "updated": bm.get("last_update"),
                    })

        # Calculate best and average odds
        best = {
            "home": max(home_odds_list) if home_odds_list else None,
            "draw": max(draw_odds_list) if draw_odds_list else None,
            "away": max(away_odds_list) if away_odds_list else None,
        }
        avg = {
            "home": round(sum(home_odds_list) / len(home_odds_list), 3) if home_odds_list else None,
            "draw": round(sum(draw_odds_list) / len(draw_odds_list), 3) if draw_odds_list else None,
            "away": round(sum(away_odds_list) / len(away_odds_list), 3) if away_odds_list else None,
        }

        # Implied probabilities from average odds (with overround removal)
        implied = {"home": None, "draw": None, "away": None}
        if avg["home"] and avg["away"]:
            raw_h = 1 / avg["home"]
            raw_d = 1 / avg["draw"] if avg["draw"] else 0
            raw_a = 1 / avg["away"]
            total = raw_h + raw_d + raw_a
            if total > 0:
                implied = {
                    "home": round(raw_h / total, 4),
                    "draw": round(raw_d / total, 4) if raw_d else None,
                    "away": round(raw_a / total, 4),
                }

        return {
            "home_team_name": home_name,
            "away_team_name": away_name,
            "home_team_slug": _slugify(home_name),
            "away_team_slug": _slugify(away_name),
            "commence_time": event.get("commence_time"),
            "league_slug": league_slug,
            "sport_key": event.get("sport_key"),
            "bookmakers_count": len(bookmaker_data),
            "bookmakers": bookmaker_data[:5],  # Top 5 bookmakers
            "best_odds": best,
            "avg_odds": avg,
            "implied_probs": implied,
        }

    @property
    def remaining_requests(self) -> Optional[int]:
        return self._remaining_requests
