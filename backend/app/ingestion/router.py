"""Multi-provider sports API router with fallback logic.

The router abstracts away which provider serves which league.
Consumers call router methods — the router picks the right provider,
handles rate limits, and falls back to alternates on failure.

Usage
-----
    async with SportsAPIRouter() as router:
        fixtures = await router.fetch_matches("premier-league", date_from, date_to)
        standings = await router.fetch_standings("eredivisie", "2025-2026")
"""

from __future__ import annotations

import logging
from datetime import date
from typing import Optional

import httpx

from app.core.config import get_settings
from app.ingestion.base_adapter import DataSourceAdapter
from app.ingestion.adapters.api_football import APIFootballAdapter, LEAGUE_SLUG_TO_ID
from app.ingestion.adapters.football_data_org import FootballDataOrgAdapter

log = logging.getLogger(__name__)

# ── Per-league provider configuration ────────────────────────────────────────
# primary: tried first. fallback: tried in order if primary fails.
# Leagues covered by football-data.org free tier get fd as primary/fallback.
_FD_COVERED = {
    "premier-league", "la-liga", "bundesliga", "serie-a", "ligue-1",
    "eredivisie", "champions-league", "championship", "primeira-liga",
}

# Build config for ALL 30 API-Football leagues dynamically.
LEAGUE_PROVIDER_CONFIG: dict[str, dict] = {}
for _slug in LEAGUE_SLUG_TO_ID:
    if _slug in _FD_COVERED:
        LEAGUE_PROVIDER_CONFIG[_slug] = {
            "primary": "api_football",
            "fallback": ["football_data"],
        }
    else:
        LEAGUE_PROVIDER_CONFIG[_slug] = {
            "primary": "api_football",
            "fallback": [],
        }
# Override: for these fd-primary leagues, prefer fd with apifb fallback
for _slug in ("eredivisie", "championship", "primeira-liga"):
    LEAGUE_PROVIDER_CONFIG[_slug] = {
        "primary": "football_data",
        "fallback": ["api_football"],
    }

# Default for unknown leagues
_DEFAULT_CONFIG = {"primary": "api_football", "fallback": ["football_data"]}


class SportsAPIRouter:
    """Routes API calls to the correct provider with automatic fallback."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._client: Optional[httpx.AsyncClient] = None
        self._providers: dict[str, DataSourceAdapter] = {}

    async def __aenter__(self) -> "SportsAPIRouter":
        self._client = httpx.AsyncClient(timeout=30)

        if self._settings.api_football_key:
            self._providers["api_football"] = APIFootballAdapter(
                config={"api_key": self._settings.api_football_key},
                http_client=self._client,
            )

        # football-data.org adapter DISABLED (2026-04-14) — free tier
        # data was incomplete and caused engine calculation errors.
        # if self._settings.football_data_api_key:
        #     self._providers["football_data"] = FootballDataOrgAdapter(
        #         config={"api_key": self._settings.football_data_api_key},
        #         http_client=self._client,
        #     )

        log.info("SportsAPIRouter initialized with providers: %s", list(self._providers.keys()))
        return self

    async def __aexit__(self, *_) -> None:
        if self._client:
            await self._client.aclose()

    def _get_provider_order(self, league_slug: str) -> list[str]:
        """Return ordered list of provider names to try for this league."""
        config = LEAGUE_PROVIDER_CONFIG.get(league_slug, _DEFAULT_CONFIG)
        order = [config["primary"]] + config.get("fallback", [])
        # Filter to only available providers
        return [p for p in order if p in self._providers]

    async def _call_with_fallback(self, league_slug: str, method_name: str, *args, **kwargs) -> list[dict]:
        """Call a method on providers in priority order, falling back on failure."""
        providers_to_try = self._get_provider_order(league_slug)

        if not providers_to_try:
            log.error("No providers available for league %s", league_slug)
            return []

        last_error = None
        for provider_name in providers_to_try:
            provider = self._providers[provider_name]
            try:
                method = getattr(provider, method_name)
                result = await method(*args, **kwargs)
                if result:  # Non-empty result
                    log.info(
                        "Router: %s.%s for %s returned %d items",
                        provider_name, method_name, league_slug, len(result),
                    )
                    return result
                else:
                    log.warning(
                        "Router: %s.%s for %s returned empty, trying fallback",
                        provider_name, method_name, league_slug,
                    )
            except Exception as exc:
                last_error = exc
                log.warning(
                    "Router: %s.%s for %s failed: %s — trying fallback",
                    provider_name, method_name, league_slug, exc,
                )

        log.error(
            "Router: All providers failed for %s.%s. Last error: %s",
            league_slug, method_name, last_error,
        )
        return []

    # ── Public API ───────────────────────────────────────────────────────────

    async def fetch_matches(
        self, league_slug: str, date_from: date, date_to: date
    ) -> list[dict]:
        """Fetch fixtures for a league within a date range."""
        return await self._call_with_fallback(
            league_slug, "fetch_matches", league_slug, date_from, date_to
        )

    async def fetch_results(self, league_slug: str, match_ids: list[str]) -> list[dict]:
        """Fetch results for specific match IDs."""
        return await self._call_with_fallback(
            league_slug, "fetch_results", match_ids
        )

    async def fetch_standings(self, league_slug: str, season: str) -> list[dict]:
        """Fetch current standings for a league."""
        return await self._call_with_fallback(
            league_slug, "fetch_standings", league_slug, season
        )

    async def fetch_team_stats(self, league_slug: str, team_id: str, season: str) -> dict:
        """Fetch team stats."""
        results = await self._call_with_fallback(
            league_slug, "fetch_team_stats", team_id, season
        )
        return results if isinstance(results, dict) else {}

    def get_supported_leagues(self) -> list[dict]:
        """Return all leagues with their provider coverage."""
        leagues = []
        for slug, config in LEAGUE_PROVIDER_CONFIG.items():
            available = [p for p in [config["primary"]] + config.get("fallback", [])
                        if p in self._providers]
            leagues.append({
                "slug": slug,
                "primary": config["primary"],
                "fallback": config.get("fallback", []),
                "available_providers": available,
                "covered": len(available) > 0,
            })
        return leagues

    def get_provider_names(self) -> list[str]:
        """Return names of all configured providers."""
        return list(self._providers.keys())
