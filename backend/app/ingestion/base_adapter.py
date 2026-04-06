"""
Abstract base class for all data source adapters.

Every concrete adapter must implement the async methods defined here.
The base class provides:
  - Rate limiting via asyncio.sleep
  - Structured logging via structlog
  - Automatic retry with exponential back-off via tenacity
  - A consistent normalized dict contract for each entity type
"""
from __future__ import annotations

import asyncio
import traceback
from abc import ABC, abstractmethod
from datetime import date
from typing import Any

import httpx
import structlog
from tenacity import (
    AsyncRetrying,
    RetryError,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

logger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Retry policy
# ---------------------------------------------------------------------------
# Retried on transient HTTP errors and generic exceptions.  4xx client
# errors are NOT retried because they indicate a programming or config fault.
_RETRYABLE = (
    httpx.TimeoutException,
    httpx.NetworkError,
    httpx.RemoteProtocolError,
)

_RETRY_KWARGS: dict[str, Any] = dict(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type(_RETRYABLE),
    reraise=True,
)


class DataSourceAdapter(ABC):
    """
    Abstract base class for every data-source adapter.

    Subclasses must implement all abstract methods.  Each method returns a
    list of plain dicts that map to the internal schema – see the docstring
    of each method for the expected keys.

    Parameters
    ----------
    config:
        Arbitrary configuration dict taken from ``DataSource.config``.
        Adapters may pull API keys, base URLs, league filters, etc. from here.
    http_client:
        A shared ``httpx.AsyncClient`` managed by the caller (ingestion
        service).  The adapter must NOT close this client.
    """

    def __init__(self, config: dict, http_client: httpx.AsyncClient) -> None:
        self.config = config or {}
        self.http_client = http_client
        self._rate_limit_seconds: float = float(self.config.get("rate_limit_seconds", 0.25))
        self.log = structlog.get_logger(self.__class__.__name__)

    # ------------------------------------------------------------------
    # Utility helpers
    # ------------------------------------------------------------------

    async def rate_limit(self) -> None:
        """Pause execution to respect upstream rate limits."""
        if self._rate_limit_seconds > 0:
            await asyncio.sleep(self._rate_limit_seconds)

    def _log_fetch(self, entity_type: str, count: int, **extra: Any) -> None:
        """Emit a structured log line after a successful fetch."""
        self.log.info(
            "fetched_entities",
            entity_type=entity_type,
            count=count,
            adapter=self.__class__.__name__,
            **extra,
        )

    async def _fetch_with_retry(self, coro_factory, *args, **kwargs) -> Any:
        """
        Call ``coro_factory(*args, **kwargs)`` with automatic retry.

        ``coro_factory`` must be a *callable* that returns a coroutine each
        time it is called (i.e. an async function reference, not an awaited
        coroutine), so that tenacity can re-create it on each attempt.
        """
        async for attempt in AsyncRetrying(**_RETRY_KWARGS):
            with attempt:
                return await coro_factory(*args, **kwargs)

    # ------------------------------------------------------------------
    # Abstract fetch methods
    # ------------------------------------------------------------------

    @abstractmethod
    async def fetch_sports(self) -> list[dict]:
        """
        Return all sports provided by this source.

        Expected keys per item:
            external_id (str)  – source-specific identifier
            name        (str)  – human-readable name, e.g. "Football"
            slug        (str)  – URL-safe slug, e.g. "football"
            icon        (str | None)
        """

    @abstractmethod
    async def fetch_leagues(self, sport_id: str) -> list[dict]:
        """
        Return all leagues for the given sport.

        Expected keys per item:
            external_id (str)
            sport_slug  (str)  – slug of the parent sport
            name        (str)
            slug        (str)
            country     (str | None)
            tier        (int | None)  – 1 = top flight
        """

    @abstractmethod
    async def fetch_teams(self, league_id: str) -> list[dict]:
        """
        Return all teams in the given league.

        Expected keys per item:
            external_id  (str)
            league_slug  (str)
            name         (str)
            slug         (str)
            short_name   (str | None)
            country      (str | None)
            venue        (str | None)
            logo_url     (str | None)
        """

    @abstractmethod
    async def fetch_players(self, team_id: str) -> list[dict]:
        """
        Return all players for the given team.

        Expected keys per item:
            external_id    (str)
            team_slug      (str)
            name           (str)
            slug           (str)
            position       (str | None)  – GK / DEF / MID / FWD / etc.
            nationality    (str | None)
            date_of_birth  (str | None)  – ISO date "YYYY-MM-DD"
            jersey_number  (int | None)
            photo_url      (str | None)
        """

    @abstractmethod
    async def fetch_matches(
        self,
        league_id: str,
        date_from: date,
        date_to: date,
    ) -> list[dict]:
        """
        Return fixtures/matches within the date window.

        Expected keys per item:
            external_id   (str)
            league_slug   (str)
            home_team_slug (str)
            away_team_slug (str)
            scheduled_at  (str)   – ISO datetime with timezone
            status        (str)   – scheduled / live / finished / postponed / cancelled
            venue         (str | None)
            round_name    (str | None)
            matchday      (int | None)
            season_name   (str | None)  – e.g. "2024-2025"
        """

    @abstractmethod
    async def fetch_results(self, match_ids: list[str]) -> list[dict]:
        """
        Return results for the given external match IDs.

        Expected keys per item:
            external_match_id (str)
            home_score        (int)
            away_score        (int)
            home_score_ht     (int | None)  – half-time score
            away_score_ht     (int | None)
            winner            (str | None)  – "home" | "away" | "draw"
            extra_data        (dict | None)  – shots, xg, cards, etc.
        """

    @abstractmethod
    async def fetch_standings(self, league_id: str, season_id: str) -> list[dict]:
        """
        Return the current standings table for the league/season.

        Expected keys per item:
            team_slug       (str)
            league_slug     (str)
            season_name     (str)
            position        (int)
            played          (int)
            won             (int)
            drawn           (int)
            lost            (int)
            goals_for       (int)
            goals_against   (int)
            goal_difference (int)
            points          (int)
            extra_data      (dict | None)  – form, home record, etc.
        """

    @abstractmethod
    async def fetch_team_stats(self, team_id: str, season_id: str) -> dict:
        """
        Return aggregated team statistics for the season.

        Expected keys:
            team_slug         (str)
            season_name       (str)
            matches_played    (int)
            wins              (int)
            draws             (int)
            losses            (int)
            goals_scored      (int)
            goals_conceded    (int)
            home_wins         (int)
            away_wins         (int)
            avg_goals_scored  (float | None)
            avg_goals_conceded (float | None)
            extra_stats       (dict | None)
        """

    @abstractmethod
    async def fetch_player_stats(self, player_id: str, season_id: str) -> dict:
        """
        Return a player's statistics for the season.

        Expected keys:
            player_slug     (str)
            season_name     (str)
            appearances     (int)
            goals           (int)
            assists         (int)
            minutes_played  (int)
            stat_type       (str | None)  – "outfield" | "goalkeeper"
            extra_stats     (dict | None)
        """

    @abstractmethod
    async def fetch_injuries(self, team_id: str) -> list[dict]:
        """
        Return the current injury list for the team.

        Expected keys per item:
            player_slug      (str)
            team_slug        (str)
            injury_type      (str)
            severity         (str | None)  – minor / moderate / severe
            start_date       (str)         – ISO date "YYYY-MM-DD"
            expected_return  (str | None)  – ISO date
            status           (str)         – active | recovered | unknown
        """

    @abstractmethod
    async def fetch_odds_history(self, match_id: str) -> list[dict]:
        """
        Return historical odds snapshots for the match.

        Expected keys per item:
            external_match_id (str)
            source            (str)   – bookmaker / exchange name
            market            (str)   – "1x2" | "over_under_2.5" | etc.
            home_odds         (float)
            draw_odds         (float | None)
            away_odds         (float)
            recorded_at       (str)   – ISO datetime with timezone
        """
