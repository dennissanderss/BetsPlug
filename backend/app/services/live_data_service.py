"""
Live Data Service
=================
Orchestrates real-time football data fetching from multiple free public APIs.

Priority order (highest to lowest):
  1. football-data.org   – richest data; requires free API key
  2. OpenLigaDB          – German football; always works, no key required
  3. TheSportsDB         – broad coverage; free tier key=3

The service:
- Tries adapters in priority order and falls back on failure.
- Merges + deduplicates results from multiple sources.
- Caches results in-memory with configurable TTL (5 min live, 1 h standings).
- Is completely stateless (no DB dependency) – it returns normalised dicts
  ready to be consumed by API routes or persisted by the ingestion pipeline.

Usage::

    async with httpx.AsyncClient(timeout=30) as client:
        svc = LiveDataService(http_client=client)
        matches = await svc.get_todays_matches()
"""
from __future__ import annotations

import asyncio
import time
from datetime import date, datetime, timedelta, timezone
from typing import Any

import httpx
import structlog

from app.ingestion.adapters.football_data_org import (
    FootballDataOrgAdapter,
    LEAGUE_SLUG_TO_CODE as FDORG_LEAGUES,
)
from app.ingestion.adapters.openligadb import (
    OpenLigaDBAdapter,
    LEAGUE_SLUG_TO_OLDB as OLDB_LEAGUES,
)
from app.ingestion.adapters.thesportsdb import (
    TheSportsDBAdapter,
    LEAGUE_SLUG_TO_ID as TSDB_LEAGUES,
)

logger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------

_CacheEntry = tuple[Any, float]  # (value, expiry_timestamp)


class _TTLCache:
    """Simple in-process TTL cache backed by a plain dict."""

    def __init__(self) -> None:
        self._store: dict[str, _CacheEntry] = {}

    def get(self, key: str) -> Any:
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expiry = entry
        if time.monotonic() > expiry:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl: float) -> None:
        self._store[key] = (value, time.monotonic() + ttl)

    def invalidate(self, prefix: str = "") -> None:
        if not prefix:
            self._store.clear()
            return
        keys = [k for k in self._store if k.startswith(prefix)]
        for k in keys:
            del self._store[k]


# ---------------------------------------------------------------------------
# TTL constants (seconds)
# ---------------------------------------------------------------------------

TTL_LIVE_DATA = 5 * 60      # 5 minutes for match/result data
TTL_STANDINGS = 60 * 60     # 1 hour for standings


# ---------------------------------------------------------------------------
# All supported leagues grouped by source
# ---------------------------------------------------------------------------

# Union of all leagues across all adapters
ALL_LEAGUE_SLUGS: list[str] = sorted(
    set(FDORG_LEAGUES) | set(OLDB_LEAGUES) | set(TSDB_LEAGUES)
)

# Leagues supported by each source
_FDORG_SUPPORTED = set(FDORG_LEAGUES.keys())
_OLDB_SUPPORTED  = set(OLDB_LEAGUES.keys())
_TSDB_SUPPORTED  = set(TSDB_LEAGUES.keys())


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class LiveDataService:
    """
    High-level service that fetches live football data from multiple free APIs.

    Parameters
    ----------
    http_client:
        A shared ``httpx.AsyncClient``.  The caller is responsible for its
        lifecycle.  If not provided, a new client is created internally (and
        must be closed via ``await service.aclose()``).
    fdorg_api_key:
        Optional football-data.org API key.  Without it only OpenLigaDB and
        TheSportsDB will be used (OpenLigaDB covers Bundesliga; TheSportsDB
        covers PL/LaLiga/BL/SerieA/Ligue1).
    fdorg_config:
        Extra config dict for the FootballDataOrgAdapter.
    oldb_config:
        Extra config dict for the OpenLigaDBAdapter.
    tsdb_config:
        Extra config dict for the TheSportsDBAdapter.
    """

    def __init__(
        self,
        http_client: httpx.AsyncClient | None = None,
        fdorg_api_key: str = "",
        fdorg_config: dict | None = None,
        oldb_config: dict | None = None,
        tsdb_config: dict | None = None,
    ) -> None:
        self._owns_client = http_client is None
        self._client: httpx.AsyncClient = http_client or httpx.AsyncClient(timeout=30)
        self._cache = _TTLCache()
        self.log = structlog.get_logger(self.__class__.__name__)

        # Build adapter instances
        fdorg_cfg = dict(fdorg_config or {})
        if fdorg_api_key:
            fdorg_cfg["api_key"] = fdorg_api_key

        self._fdorg = FootballDataOrgAdapter(fdorg_cfg, self._client)
        self._oldb  = OpenLigaDBAdapter(dict(oldb_config or {}), self._client)
        self._tsdb  = TheSportsDBAdapter(dict(tsdb_config or {}), self._client)

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    async def __aenter__(self) -> "LiveDataService":
        return self

    async def __aexit__(self, *_: Any) -> None:
        await self.aclose()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def get_todays_matches(self) -> list[dict]:
        """
        Fetch today's matches from all configured adapters.

        Returns a merged, deduplicated list sorted by scheduled_at.
        """
        cache_key = f"today:{date.today().isoformat()}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            self.log.debug("live_data_cache_hit", key=cache_key)
            return cached

        today = date.today()
        matches = await self._fetch_matches_from_all_sources(today, today)
        self._cache.set(cache_key, matches, TTL_LIVE_DATA)
        self.log.info("get_todays_matches", count=len(matches), date=str(today))
        return matches

    async def get_upcoming_matches(self, days: int = 7) -> list[dict]:
        """
        Fetch upcoming fixtures for the next ``days`` days.
        """
        today = date.today()
        date_to = today + timedelta(days=days)
        cache_key = f"upcoming:{today.isoformat()}:{days}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            self.log.debug("live_data_cache_hit", key=cache_key)
            return cached

        matches = await self._fetch_matches_from_all_sources(today, date_to)
        # Filter to only scheduled/upcoming
        matches = [m for m in matches if m.get("status") in ("scheduled", "live")]
        self._cache.set(cache_key, matches, TTL_LIVE_DATA)
        self.log.info("get_upcoming_matches", count=len(matches), days=days)
        return matches

    async def get_recent_results(self, days: int = 7) -> list[dict]:
        """
        Fetch results for the last ``days`` days.
        """
        today = date.today()
        date_from = today - timedelta(days=days)
        cache_key = f"results:{date_from.isoformat()}:{today.isoformat()}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            self.log.debug("live_data_cache_hit", key=cache_key)
            return cached

        matches = await self._fetch_matches_from_all_sources(date_from, today)
        # Only finished matches
        finished = [m for m in matches if m.get("status") == "finished"]

        # Enrich with scores where the match object doesn't already have them
        finished = await self._enrich_results(finished)

        self._cache.set(cache_key, finished, TTL_LIVE_DATA)
        self.log.info("get_recent_results", count=len(finished), days=days)
        return finished

    async def get_league_standings(self, league_code: str) -> list[dict]:
        """
        Fetch current standings for a league.

        ``league_code`` can be:
        - An internal league slug  (e.g. "bundesliga", "premier-league")
        - A football-data.org code (e.g. "BL1", "PL")
        """
        cache_key = f"standings:{league_code}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            self.log.debug("live_data_cache_hit", key=cache_key)
            return cached

        # Normalise to slug
        league_slug = league_code.lower()

        # Current season string (start year)
        season_year = date.today().year if date.today().month >= 8 else date.today().year - 1
        season_id = str(season_year)

        standings = await self._fetch_standings_with_fallback(league_slug, season_id)
        self._cache.set(cache_key, standings, TTL_STANDINGS)
        self.log.info("get_league_standings", league=league_code, rows=len(standings))
        return standings

    async def sync_all_data(self) -> dict[str, Any]:
        """
        Full sync: fetch matches (past 7 + next 7 days) and standings for all
        supported leagues from all sources.

        Returns a summary dict with counts per source.
        """
        self.log.info("sync_all_data_started")
        self._cache.invalidate()  # Clear all cached data

        today = date.today()
        date_from = today - timedelta(days=7)
        date_to   = today + timedelta(days=7)

        summary: dict[str, Any] = {
            "started_at": datetime.now(timezone.utc).isoformat(),
            "matches": {},
            "standings": {},
            "errors": [],
        }

        # -- Matches --
        total_matches: list[dict] = []
        for source_name, leagues, fetch_fn in [
            ("football_data_org", _FDORG_SUPPORTED, self._fetch_fdorg_matches),
            ("openligadb",        _OLDB_SUPPORTED,  self._fetch_oldb_matches),
            ("thesportsdb",       _TSDB_SUPPORTED,  self._fetch_tsdb_matches),
        ]:
            source_matches: list[dict] = []
            for league in sorted(leagues):
                try:
                    ms = await fetch_fn(league, date_from, date_to)
                    source_matches.extend(ms)
                except Exception as exc:  # noqa: BLE001
                    summary["errors"].append(
                        {"source": source_name, "league": league, "error": str(exc)}
                    )
            summary["matches"][source_name] = len(source_matches)
            total_matches.extend(source_matches)

        merged = _deduplicate_matches(total_matches)
        summary["matches"]["total_merged"] = len(merged)

        # -- Standings --
        for league_slug in ALL_LEAGUE_SLUGS:
            try:
                rows = await self.get_league_standings(league_slug)
                summary["standings"][league_slug] = len(rows)
            except Exception as exc:  # noqa: BLE001
                summary["errors"].append(
                    {"source": "standings", "league": league_slug, "error": str(exc)}
                )

        summary["finished_at"] = datetime.now(timezone.utc).isoformat()
        self.log.info("sync_all_data_finished", summary=summary)
        return summary

    # ------------------------------------------------------------------
    # Internal fetch helpers
    # ------------------------------------------------------------------

    async def _fetch_matches_from_all_sources(
        self, date_from: date, date_to: date
    ) -> list[dict]:
        """
        Fetch matches from all adapters in priority order (fdorg → oldb → tsdb),
        merge and deduplicate.
        """
        tasks = [
            self._fetch_all_fdorg_matches(date_from, date_to),
            self._fetch_all_oldb_matches(date_from, date_to),
            self._fetch_all_tsdb_matches(date_from, date_to),
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_matches: list[dict] = []
        source_names = ["football_data_org", "openligadb", "thesportsdb"]
        for source, result in zip(source_names, results):
            if isinstance(result, Exception):
                self.log.warning("source_fetch_failed", source=source, error=str(result))
            else:
                all_matches.extend(result)
                self.log.debug("source_fetched", source=source, count=len(result))

        merged = _deduplicate_matches(all_matches)
        merged.sort(key=lambda m: m.get("scheduled_at") or "")
        return merged

    async def _fetch_all_fdorg_matches(
        self, date_from: date, date_to: date
    ) -> list[dict]:
        """Fetch matches from football-data.org for all supported leagues."""
        return await self._fetch_fdorg_matches("all", date_from, date_to)

    async def _fetch_fdorg_matches(
        self, league: str, date_from: date, date_to: date
    ) -> list[dict]:
        matches: list[dict] = []
        leagues = list(_FDORG_SUPPORTED) if league == "all" else [league]
        for lg in leagues:
            try:
                ms = await self._fdorg.fetch_matches(lg, date_from, date_to)
                matches.extend(ms)
            except Exception as exc:  # noqa: BLE001
                self.log.debug(
                    "fdorg_league_skip", league=lg, error=str(exc)
                )
        return matches

    async def _fetch_all_oldb_matches(
        self, date_from: date, date_to: date
    ) -> list[dict]:
        return await self._fetch_oldb_matches("all", date_from, date_to)

    async def _fetch_oldb_matches(
        self, league: str, date_from: date, date_to: date
    ) -> list[dict]:
        matches: list[dict] = []
        leagues = list(_OLDB_SUPPORTED) if league == "all" else [league]
        for lg in leagues:
            try:
                ms = await self._oldb.fetch_matches(lg, date_from, date_to)
                matches.extend(ms)
            except Exception as exc:  # noqa: BLE001
                self.log.debug(
                    "oldb_league_skip", league=lg, error=str(exc)
                )
        return matches

    async def _fetch_all_tsdb_matches(
        self, date_from: date, date_to: date
    ) -> list[dict]:
        return await self._fetch_tsdb_matches("all", date_from, date_to)

    async def _fetch_tsdb_matches(
        self, league: str, date_from: date, date_to: date
    ) -> list[dict]:
        matches: list[dict] = []
        leagues = list(_TSDB_SUPPORTED) if league == "all" else [league]
        for lg in leagues:
            try:
                ms = await self._tsdb.fetch_matches(lg, date_from, date_to)
                matches.extend(ms)
            except Exception as exc:  # noqa: BLE001
                self.log.debug(
                    "tsdb_league_skip", league=lg, error=str(exc)
                )
        return matches

    async def _fetch_standings_with_fallback(
        self, league_slug: str, season_id: str
    ) -> list[dict]:
        """
        Try standings in priority order; return first non-empty result.
        Always falls back to OpenLigaDB for Bundesliga.
        """
        attempts = []
        if league_slug in _FDORG_SUPPORTED:
            attempts.append(("football_data_org", self._fdorg))
        if league_slug in _OLDB_SUPPORTED:
            attempts.append(("openligadb", self._oldb))
        if league_slug in _TSDB_SUPPORTED:
            attempts.append(("thesportsdb", self._tsdb))

        for source_name, adapter in attempts:
            try:
                rows = await adapter.fetch_standings(league_slug, season_id)
                if rows:
                    self.log.debug(
                        "standings_fetched",
                        source=source_name,
                        league=league_slug,
                        rows=len(rows),
                    )
                    return rows
            except Exception as exc:  # noqa: BLE001
                self.log.warning(
                    "standings_source_failed",
                    source=source_name,
                    league=league_slug,
                    error=str(exc),
                )

        self.log.warning("standings_all_sources_failed", league=league_slug)
        return []

    async def _enrich_results(self, matches: list[dict]) -> list[dict]:
        """
        For finished matches that lack score data, attempt to fetch it.
        Currently a pass-through; scores are usually included in match objects
        from all three sources.
        """
        # Group by source prefix to batch-fetch from correct adapter
        fdorg_ids = [m["external_id"] for m in matches if m["external_id"].startswith("fdorg_")]
        oldb_ids  = [m["external_id"] for m in matches if m["external_id"].startswith("oldb_")]
        tsdb_ids  = [m["external_id"] for m in matches if m["external_id"].startswith("tsdb_")]

        result_map: dict[str, dict] = {}

        for ids, adapter in [
            (fdorg_ids, self._fdorg),
            (oldb_ids,  self._oldb),
            (tsdb_ids,  self._tsdb),
        ]:
            if not ids:
                continue
            try:
                results = await adapter.fetch_results(ids)
                for r in results:
                    result_map[r["external_match_id"]] = r
            except Exception as exc:  # noqa: BLE001
                self.log.debug("enrich_results_failed", error=str(exc))

        # Merge score data back into match dicts
        enriched = []
        for match in matches:
            mid = match["external_id"]
            result = result_map.get(mid)
            if result:
                enriched.append(
                    {
                        **match,
                        "home_score":    result.get("home_score"),
                        "away_score":    result.get("away_score"),
                        "home_score_ht": result.get("home_score_ht"),
                        "away_score_ht": result.get("away_score_ht"),
                        "winner":        result.get("winner"),
                        "score_data":    result.get("extra_data"),
                    }
                )
            else:
                enriched.append(match)

        return enriched


# ---------------------------------------------------------------------------
# Deduplication helpers
# ---------------------------------------------------------------------------

def _match_fingerprint(match: dict) -> str:
    """
    Build a normalised key that identifies a unique fixture regardless of
    which source provided it.

    Uses league_slug + home_team_slug + away_team_slug + date (first 10 chars
    of scheduled_at).
    """
    scheduled = (match.get("scheduled_at") or "")[:10]  # "YYYY-MM-DD"
    return "|".join([
        match.get("league_slug", ""),
        match.get("home_team_slug", ""),
        match.get("away_team_slug", ""),
        scheduled,
    ]).lower()


def _deduplicate_matches(matches: list[dict]) -> list[dict]:
    """
    Deduplicate matches across sources.

    Priority: football-data.org > OpenLigaDB > TheSportsDB.
    For each fingerprint we keep the first occurrence (list is ordered by
    source priority by the caller).
    """
    seen: dict[str, dict] = {}
    for match in matches:
        fp = _match_fingerprint(match)
        if fp not in seen:
            seen[fp] = match
        else:
            # Prefer records that have score data
            existing = seen[fp]
            if existing.get("home_score") is None and match.get("home_score") is not None:
                seen[fp] = match
    return list(seen.values())
