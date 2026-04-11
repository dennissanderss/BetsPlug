"""
Data Synchronization Service
=============================
Background service that keeps the local PostgreSQL database in sync with
Football-Data.org.  Designed to run as Celery Beat tasks every few minutes
so that every API route reads ONLY from the local DB — never from an external
API inline.

Rate limiting strategy
----------------------
Football-Data.org free TIER_ONE tier: 10 requests / minute.
We deliberately fetch ONE competition per sync cycle and rotate through all
seven (PL, PD, BL1, SA, FL1, CL, DED) using an in-process counter. This keeps
us well inside the 10 req/min ceiling even when multiple tasks run
concurrently.

Public methods
--------------
    await service.sync_upcoming_matches(db)
    await service.sync_recent_results(db)
    await service.sync_standings(db)
    await service.generate_predictions_for_upcoming(db)
"""
from __future__ import annotations

import asyncio
import re
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional

import httpx
import structlog
from sqlalchemy import and_, exists, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.ingestion.adapters.api_football import (
    APIFootballAdapter,
    ID_TO_LEAGUE_SLUG as APIFB_ID_TO_SLUG,
    LEAGUE_SLUG_TO_ID as APIFB_SLUG_TO_ID,
    LEAGUE_META as APIFB_LEAGUE_META,
)
from app.ingestion.adapters.football_data_org import (
    CODE_TO_LEAGUE_SLUG,
    COMPETITION_META,
    LEAGUE_SLUG_TO_CODE,
    FootballDataOrgAdapter,
)
from app.models.league import League
from app.models.match import Match, MatchResult, MatchStatus
from app.models.prediction import Prediction
from app.models.season import Season
from app.models.sport import Sport
from app.models.standings import StandingsSnapshot
from app.models.team import Team

logger = structlog.get_logger(__name__)

_settings = get_settings()

# ── Ordered list of competition codes to rotate through ──────────────────────
# Free TIER_ONE fdorg plan covers all seven. DED (Eredivisie) was added
# 2026-04-11 after live verification that the free tier actually serves it.
_COMPETITION_ROTATION: list[str] = ["PL", "PD", "BL1", "SA", "FL1", "CL", "DED"]

# ── League slugs used by the API-Football adapter path ───────────────────────
# API-Football covers Eredivisie (id 88), so when that adapter is active the
# rotation includes it alongside the big-five + Champions League.
_LEAGUE_SLUG_ROTATION: list[str] = [
    "premier-league",
    "la-liga",
    "bundesliga",
    "serie-a",
    "ligue-1",
    "eredivisie",
    "champions-league",
]

# Simple in-process rotation counter (survives per-worker; good enough for
# round-robin when only one beat worker is running).
_rotation_index: int = 0


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def _current_season_name() -> str:
    """Return the current season string, e.g. '2024-2025'."""
    today = date.today()
    if today.month >= 8:
        return f"{today.year}-{today.year + 1}"
    return f"{today.year - 1}-{today.year}"


# ─────────────────────────────────────────────────────────────────────────────
# Service
# ─────────────────────────────────────────────────────────────────────────────


class DataSyncService:
    """
    Synchronises Football-Data.org data into the local PostgreSQL database.

    One instance is created per Celery task invocation and disposed afterwards.
    """

    def __init__(self) -> None:
        self._fdorg_key: str = _settings.football_data_api_key
        self._apifb_key: str = _settings.api_football_key
        self._client: Optional[httpx.AsyncClient] = None
        self._adapter = None  # type: ignore[assignment]
        self._adapter_name: str = ""
        self.log = structlog.get_logger(self.__class__.__name__)

    # ── Context manager ──────────────────────────────────────────────────────

    async def __aenter__(self) -> "DataSyncService":
        self._client = httpx.AsyncClient(timeout=30)
        # ── Adapter preference (v5: Pro tier) ────────────────────────────────
        # We are now on API-Football Pro which serves every season, all the
        # richer endpoints (statistics, injuries, odds, top scorers), and
        # 7 500 requests/day. API-Football is therefore the primary adapter
        # for everything except the once-a-day standings sync which we keep
        # on football-data.org for predictability.
        #
        # Fallback order, from most to least preferred:
        #   1. API-Football (Pro)
        #   2. football-data.org (free, reliable for fixtures + standings)
        #
        # If ``FORCE_FOOTBALL_DATA_PRIMARY=true`` is set we flip back to the
        # v4 behaviour (fd as primary). That's the escape hatch in case the
        # API-Football key gets rate-limited or the subscription lapses.
        import os
        force_fd = os.environ.get("FORCE_FOOTBALL_DATA_PRIMARY", "").lower() in ("1", "true", "yes")

        if self._apifb_key and not force_fd:
            self._adapter = APIFootballAdapter(
                config={"api_key": self._apifb_key},
                http_client=self._client,
            )
            self._adapter_name = "api_football"
            self.log.info(
                "data_sync_using_adapter",
                adapter="api_football",
                reason="v5_pro_primary",
            )
        elif self._fdorg_key:
            self._adapter = FootballDataOrgAdapter(
                config={"api_key": self._fdorg_key},
                http_client=self._client,
            )
            self._adapter_name = "football_data_org"
            self.log.info(
                "data_sync_using_adapter",
                adapter="football_data_org",
                reason="forced_or_no_apifb_key",
            )
        else:
            raise RuntimeError(
                "No data-source API key configured. Set either "
                "API_FOOTBALL_KEY or FOOTBALL_DATA_API_KEY."
            )
        return self

    async def __aexit__(self, *_) -> None:
        if self._client:
            await self._client.aclose()

    # ── Internal helper: get-or-create helpers ────────────────────────────────

    async def _get_or_create_sport(self, db: AsyncSession) -> Sport:
        """Ensure the 'football' Sport row exists and return it."""
        result = await db.execute(select(Sport).where(Sport.slug == "football"))
        sport = result.scalar_one_or_none()
        if sport is None:
            sport = Sport(
                id=uuid.uuid4(),
                name="Football",
                slug="football",
                icon="⚽",
                is_active=True,
            )
            db.add(sport)
            await db.flush()
            self.log.info("created_sport", slug="football")
        return sport

    async def _get_or_create_league(
        self,
        db: AsyncSession,
        sport_id: uuid.UUID,
        code: str,
    ) -> League:
        """Ensure a League row exists for *code* and return it.

        ``code`` is either a football-data.org competition code (PL, PD, …)
        when the fdorg adapter is active, or an internal league slug
        (premier-league, eredivisie, …) when the API-Football adapter is
        active. Metadata is pulled from whichever source knows the league.
        """
        slug = CODE_TO_LEAGUE_SLUG.get(code, _slugify(code))
        result = await db.execute(select(League).where(League.slug == slug))
        league = result.scalar_one_or_none()
        if league is None:
            # Try football-data.org metadata first (keyed by competition code),
            # then fall back to API-Football metadata (keyed by slug → id).
            meta = COMPETITION_META.get(code, {})
            if not meta:
                apifb_id = APIFB_SLUG_TO_ID.get(slug)
                if apifb_id is not None:
                    meta = APIFB_LEAGUE_META.get(apifb_id, {})
            league = League(
                id=uuid.uuid4(),
                sport_id=sport_id,
                name=meta.get("name", code),
                slug=slug,
                country=meta.get("country"),
                tier=meta.get("tier"),
                is_active=True,
            )
            db.add(league)
            await db.flush()
            self.log.info("created_league", slug=slug, code=code)
        return league

    async def _get_or_create_season(
        self,
        db: AsyncSession,
        league_id: uuid.UUID,
        season_name: str,
    ) -> Season:
        """Ensure a Season row exists for *league_id* + *season_name*."""
        result = await db.execute(
            select(Season).where(
                and_(
                    Season.league_id == league_id,
                    Season.name == season_name,
                )
            )
        )
        season = result.scalar_one_or_none()
        if season is None:
            # Parse years from name like "2024-2025"
            parts = season_name.split("-")
            try:
                start_year = int(parts[0])
                end_year = int(parts[1]) if len(parts) > 1 else start_year + 1
            except (ValueError, IndexError):
                start_year = date.today().year
                end_year = start_year + 1

            season = Season(
                id=uuid.uuid4(),
                league_id=league_id,
                name=season_name,
                start_date=date(start_year, 8, 1),
                end_date=date(end_year, 5, 31),
                is_current=(season_name == _current_season_name()),
            )
            db.add(season)
            await db.flush()
            self.log.info(
                "created_season", league_id=str(league_id), name=season_name
            )
        return season

    async def _get_or_create_team(
        self,
        db: AsyncSession,
        league_id: uuid.UUID,
        team_slug: str,
        team_name: str,
    ) -> Team:
        """Ensure a Team row exists for *team_slug* and return it."""
        result = await db.execute(select(Team).where(Team.slug == team_slug))
        team = result.scalar_one_or_none()
        if team is None:
            team = Team(
                id=uuid.uuid4(),
                league_id=league_id,
                name=team_name,
                slug=team_slug,
                is_active=True,
            )
            db.add(team)
            await db.flush()
            self.log.info(
                "created_team", slug=team_slug, league_id=str(league_id)
            )
        return team

    # ── Competition rotation ──────────────────────────────────────────────────

    @staticmethod
    def _next_competition_code() -> str:
        """Return the next competition code in the rotation (thread-safe enough)."""
        global _rotation_index
        code = _COMPETITION_ROTATION[_rotation_index % len(_COMPETITION_ROTATION)]
        _rotation_index += 1
        return code

    def _next_league_slug(self) -> str:
        """Return the next league slug in the rotation (adapter-agnostic)."""
        global _rotation_index
        slug = _LEAGUE_SLUG_ROTATION[_rotation_index % len(_LEAGUE_SLUG_ROTATION)]
        _rotation_index += 1
        return slug

    def _slug_for_sync(self) -> tuple[str, str]:
        """Return (competition_code, league_slug) for the next sync cycle."""
        if self._adapter_name == "api_football":
            slug = self._next_league_slug()
            return slug, slug
        else:
            code = self._next_competition_code()
            slug = CODE_TO_LEAGUE_SLUG.get(code, _slugify(code))
            return code, slug

    # ── Public sync methods ───────────────────────────────────────────────────

    async def sync_upcoming_matches(self, db: AsyncSession) -> dict:
        """
        Fetch upcoming matches for ONE competition (rotating) and upsert them.

        Called every 5 minutes.  One competition per call respects the 10 req/min
        free-tier limit across all concurrent tasks.

        Returns a summary dict with counts of created/updated records.
        """
        if not self._adapter:
            raise RuntimeError("Use DataSyncService as an async context manager.")

        code, league_slug = self._slug_for_sync()
        self.log.info("sync_upcoming_matches_start", competition=code, league=league_slug)

        today = date.today()
        date_to = today + timedelta(days=14)

        created = 0
        updated = 0
        errors = 0

        try:
            sport = await self._get_or_create_sport(db)
            league = await self._get_or_create_league(db, sport.id, code)

            raw_matches = await self._adapter.fetch_matches(league_slug, today, date_to)
        except Exception as exc:
            self.log.error(
                "sync_upcoming_fetch_failed", competition=code, error=str(exc)
            )
            return {"competition": code, "created": 0, "updated": 0, "errors": 1}

        for raw in raw_matches:
            try:
                season_name = raw.get("season_name") or _current_season_name()
                season = await self._get_or_create_season(db, league.id, season_name)

                home_slug = raw.get("home_team_slug", "unknown-home")
                away_slug = raw.get("away_team_slug", "unknown-away")
                home_name = home_slug.replace("-", " ").title()
                away_name = away_slug.replace("-", " ").title()

                home_team = await self._get_or_create_team(
                    db, league.id, home_slug, home_name
                )
                away_team = await self._get_or_create_team(
                    db, league.id, away_slug, away_name
                )

                external_id = raw.get("external_id")
                scheduled_str = raw.get("scheduled_at")
                if not scheduled_str:
                    continue
                scheduled_at = datetime.fromisoformat(
                    scheduled_str.replace("Z", "+00:00")
                )

                status_str = raw.get("status", "scheduled")
                try:
                    status = MatchStatus(status_str)
                except ValueError:
                    status = MatchStatus.SCHEDULED

                # Check if match already exists by external_id
                existing_result = await db.execute(
                    select(Match).where(Match.external_id == external_id)
                )
                existing = existing_result.scalar_one_or_none()

                if existing is None:
                    match = Match(
                        id=uuid.uuid4(),
                        league_id=league.id,
                        season_id=season.id,
                        home_team_id=home_team.id,
                        away_team_id=away_team.id,
                        external_id=external_id,
                        status=status,
                        scheduled_at=scheduled_at,
                        venue=raw.get("venue"),
                        round_name=raw.get("round_name"),
                        matchday=raw.get("matchday"),
                    )
                    db.add(match)
                    created += 1
                else:
                    # Update mutable fields
                    existing.status = status
                    existing.scheduled_at = scheduled_at
                    existing.round_name = raw.get("round_name", existing.round_name)
                    existing.matchday = raw.get("matchday", existing.matchday)
                    updated += 1

            except Exception as exc:
                self.log.warning(
                    "sync_match_row_failed",
                    external_id=raw.get("external_id"),
                    error=str(exc),
                )
                errors += 1
                continue

        await db.flush()
        summary = {
            "competition": code,
            "created": created,
            "updated": updated,
            "errors": errors,
        }
        self.log.info("sync_upcoming_matches_done", **summary)
        return summary

    async def sync_recent_results(self, db: AsyncSession) -> dict:
        """
        Fetch finished matches from the last 7 days for ONE competition
        (rotating independently) and update scores.

        Also called every 5 minutes alongside sync_upcoming_matches, so we use
        a separate rotation slot to avoid conflicting competition fetches.
        """
        if not self._adapter:
            raise RuntimeError("Use DataSyncService as an async context manager.")

        code, league_slug = self._slug_for_sync()
        self.log.info("sync_recent_results_start", competition=code, league=league_slug)

        today = date.today()
        date_from = today - timedelta(days=7)

        updated = 0
        created_results = 0
        errors = 0

        try:
            raw_matches = await self._adapter.fetch_matches(league_slug, date_from, today)
        except Exception as exc:
            self.log.error(
                "sync_results_fetch_failed", competition=code, error=str(exc)
            )
            return {"competition": code, "updated": 0, "created_results": 0, "errors": 1}

        # Filter to finished matches
        finished_raw = [
            m for m in raw_matches if m.get("status") == "finished"
        ]
        if not finished_raw:
            return {
                "competition": code,
                "updated": 0,
                "created_results": 0,
                "errors": 0,
            }

        # Fetch scores for finished matches
        external_ids = [m["external_id"] for m in finished_raw if m.get("external_id")]
        try:
            result_data = await self._adapter.fetch_results(external_ids)
        except Exception as exc:
            self.log.error(
                "sync_results_scores_failed", competition=code, error=str(exc)
            )
            return {"competition": code, "updated": 0, "created_results": 0, "errors": 1}

        result_map = {r["external_match_id"]: r for r in result_data}

        for raw in finished_raw:
            external_id = raw.get("external_id")
            if not external_id:
                continue
            try:
                # Find the match in DB
                match_result = await db.execute(
                    select(Match).where(Match.external_id == external_id)
                )
                match = match_result.scalar_one_or_none()
                if match is None:
                    # Not in DB yet — skip; it will be picked up by sync_upcoming
                    continue

                # Update match status to finished
                match.status = MatchStatus.FINISHED
                updated += 1

                # Upsert result row
                score = result_map.get(external_id)
                if score is None:
                    continue

                existing_result = await db.execute(
                    select(MatchResult).where(MatchResult.match_id == match.id)
                )
                match_result_row = existing_result.scalar_one_or_none()

                if match_result_row is None:
                    match_result_row = MatchResult(
                        id=uuid.uuid4(),
                        match_id=match.id,
                        home_score=score.get("home_score") or 0,
                        away_score=score.get("away_score") or 0,
                        home_score_ht=score.get("home_score_ht"),
                        away_score_ht=score.get("away_score_ht"),
                        winner=score.get("winner"),
                        extra_data=score.get("extra_data"),
                    )
                    db.add(match_result_row)
                    created_results += 1
                else:
                    match_result_row.home_score = score.get("home_score") or match_result_row.home_score
                    match_result_row.away_score = score.get("away_score") or match_result_row.away_score
                    match_result_row.home_score_ht = score.get("home_score_ht", match_result_row.home_score_ht)
                    match_result_row.away_score_ht = score.get("away_score_ht", match_result_row.away_score_ht)
                    match_result_row.winner = score.get("winner", match_result_row.winner)

            except Exception as exc:
                self.log.warning(
                    "sync_result_row_failed",
                    external_id=external_id,
                    error=str(exc),
                )
                errors += 1
                continue

        await db.flush()
        summary = {
            "competition": code,
            "updated_matches": updated,
            "created_results": created_results,
            "errors": errors,
        }
        self.log.info("sync_recent_results_done", **summary)
        return summary

    async def sync_standings(self, db: AsyncSession) -> dict:
        """
        Fetch current standings for ONE competition (rotating) and store a
        today's snapshot.

        Called every 30 minutes.
        """
        if not self._adapter:
            raise RuntimeError("Use DataSyncService as an async context manager.")

        code, league_slug = self._slug_for_sync()
        today = date.today()

        self.log.info("sync_standings_start", competition=code, league=league_slug)

        season_name = _current_season_name()
        rows_saved = 0
        errors = 0

        try:
            sport = await self._get_or_create_sport(db)
            league = await self._get_or_create_league(db, sport.id, code)
            season = await self._get_or_create_season(db, league.id, season_name)
            standings = await self._adapter.fetch_standings(league_slug, season_name)
        except Exception as exc:
            self.log.error(
                "sync_standings_fetch_failed", competition=code, error=str(exc)
            )
            return {"competition": code, "rows_saved": 0, "errors": 1}

        for row in standings:
            try:
                team_slug = row.get("team_slug", "")
                if not team_slug:
                    continue

                team_name = team_slug.replace("-", " ").title()
                team = await self._get_or_create_team(
                    db, league.id, team_slug, team_name
                )

                # Upsert: one snapshot per (league, season, team, date)
                existing_snap = await db.execute(
                    select(StandingsSnapshot).where(
                        and_(
                            StandingsSnapshot.league_id == league.id,
                            StandingsSnapshot.season_id == season.id,
                            StandingsSnapshot.team_id == team.id,
                            StandingsSnapshot.snapshot_date == today,
                        )
                    )
                )
                snap = existing_snap.scalar_one_or_none()

                if snap is None:
                    snap = StandingsSnapshot(
                        id=uuid.uuid4(),
                        league_id=league.id,
                        season_id=season.id,
                        team_id=team.id,
                        snapshot_date=today,
                        position=row.get("position", 0),
                        played=row.get("played", 0),
                        won=row.get("won", 0),
                        drawn=row.get("drawn", 0),
                        lost=row.get("lost", 0),
                        goals_for=row.get("goals_for", 0),
                        goals_against=row.get("goals_against", 0),
                        goal_difference=row.get("goal_difference", 0),
                        points=row.get("points", 0),
                        extra_data=row.get("extra_data"),
                    )
                    db.add(snap)
                else:
                    snap.position = row.get("position", snap.position)
                    snap.played = row.get("played", snap.played)
                    snap.won = row.get("won", snap.won)
                    snap.drawn = row.get("drawn", snap.drawn)
                    snap.lost = row.get("lost", snap.lost)
                    snap.goals_for = row.get("goals_for", snap.goals_for)
                    snap.goals_against = row.get("goals_against", snap.goals_against)
                    snap.goal_difference = row.get("goal_difference", snap.goal_difference)
                    snap.points = row.get("points", snap.points)
                    snap.extra_data = row.get("extra_data", snap.extra_data)

                rows_saved += 1

            except Exception as exc:
                self.log.warning(
                    "sync_standings_row_failed",
                    team_slug=row.get("team_slug"),
                    error=str(exc),
                )
                errors += 1
                continue

        await db.flush()
        summary = {"competition": code, "rows_saved": rows_saved, "errors": errors}
        self.log.info("sync_standings_done", **summary)
        return summary

    async def generate_predictions_for_upcoming(self, db: AsyncSession) -> dict:
        """
        For every upcoming match WITHOUT an existing prediction, run the
        ensemble model and persist the result.

        Safe to call frequently — only processes matches that have no prediction yet.
        """
        from app.forecasting.forecast_service import ForecastService

        self.log.info("generate_predictions_start")

        now = datetime.now(timezone.utc)
        cutoff = now + timedelta(hours=72)

        # Find upcoming scheduled matches that have NO prediction
        stmt = (
            select(Match.id)
            .where(
                and_(
                    Match.status == MatchStatus.SCHEDULED,
                    Match.scheduled_at >= now,
                    Match.scheduled_at <= cutoff,
                    ~exists(
                        select(Prediction.id).where(
                            Prediction.match_id == Match.id
                        )
                    ),
                )
            )
            .order_by(Match.scheduled_at)
        )
        rows = (await db.execute(stmt)).scalars().all()
        match_ids: list[uuid.UUID] = list(rows)

        if not match_ids:
            self.log.info("generate_predictions_no_candidates")
            return {"forecasted": 0, "failed": 0, "skipped": 0}

        self.log.info("generate_predictions_candidates", count=len(match_ids))

        svc = ForecastService()
        forecasted = 0
        failed = 0

        for match_id in match_ids:
            try:
                await svc.generate_forecast(match_id, db)
                forecasted += 1
            except ValueError as exc:
                # No active model version — expected in early dev, not an error
                self.log.debug(
                    "generate_prediction_skipped",
                    match_id=str(match_id),
                    reason=str(exc),
                )
                failed += 1
            except Exception as exc:
                self.log.warning(
                    "generate_prediction_failed",
                    match_id=str(match_id),
                    error=str(exc),
                )
                failed += 1

        await db.flush()
        summary = {
            "forecasted": forecasted,
            "failed": failed,
            "total_candidates": len(match_ids),
        }
        self.log.info("generate_predictions_done", **summary)
        return summary
