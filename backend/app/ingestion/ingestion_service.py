"""
Ingestion Service
=================
Orchestrates a full end-to-end data ingestion pipeline for a single
``DataSource``.  The service:

1. Looks up the correct adapter from the registry.
2. Creates an ``IngestionRun`` record in the database.
3. Runs the pipeline stages in order:
     sports → leagues → teams → players → matches → results → standings
4. Deduplicates every entity against existing DB rows (by slug or external_id).
5. Records counts of inserts / updates / skips on the run record.
6. Captures any per-entity errors as ``IngestionError`` rows without aborting
   the whole run.
7. Marks the run as "completed" or "failed" and returns a summary dict.

Usage
-----
::

    async with httpx.AsyncClient() as client:
        svc = IngestionService(data_source=ds, db=session, http_client=client)
        summary = await svc.run()
"""
from __future__ import annotations

import traceback
import uuid
from datetime import date, datetime, timezone
from typing import Any

import httpx
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ingestion.adapters import ADAPTER_REGISTRY
from app.ingestion.base_adapter import DataSourceAdapter
from app.models.ingestion import DataSource, IngestionError, IngestionRun
from app.models.injury import Injury
from app.models.league import League
from app.models.match import Match, MatchResult, MatchStatus
from app.models.odds import OddsHistory
from app.models.player import Player
from app.models.season import Season
from app.models.sport import Sport
from app.models.standings import StandingsSnapshot
from app.models.stats import PlayerStats, TeamStats
from app.models.team import Team

logger = structlog.get_logger(__name__)

# How far back and forward in time to fetch matches during a full ingestion.
_MATCH_WINDOW_DAYS_PAST = 365
_MATCH_WINDOW_DAYS_FUTURE = 90


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _slugify(text: str) -> str:
    """Very lightweight slug helper – replaces spaces with hyphens, lowercase."""
    import re
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text


class IngestionService:
    """
    Full ingestion pipeline for one ``DataSource``.

    Parameters
    ----------
    data_source:
        The ORM ``DataSource`` instance (already loaded from the DB).
    db:
        An open async SQLAlchemy session.  The caller is responsible for
        committing / rolling back after the run completes.
    http_client:
        Optional shared ``httpx.AsyncClient``.  If not provided, a new one is
        created and closed after the run.
    date_from / date_to:
        Window for fetching matches.  Defaults to ±365/90 days from today.
    """

    def __init__(
        self,
        data_source: DataSource,
        db: AsyncSession,
        http_client: httpx.AsyncClient | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> None:
        self.data_source = data_source
        self.db = db
        self._owned_client = http_client is None
        self._http_client = http_client or httpx.AsyncClient(timeout=30.0)
        today = date.today()
        self.date_from = date_from or date(today.year - 1, today.month, today.day)
        self.date_to = date_to or date(today.year, today.month, today.day).__class__(
            today.year + (1 if today.month > 6 else 0),
            ((today.month - 1 + 3) % 12) + 1,
            1,
        )
        self.log = structlog.get_logger(
            self.__class__.__name__,
            data_source=data_source.name,
            adapter_type=data_source.adapter_type,
        )
        # Counters (reset per run)
        self._fetched = 0
        self._inserted = 0
        self._updated = 0
        self._skipped = 0
        self._run: IngestionRun | None = None

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    async def run(self) -> dict[str, Any]:
        """
        Execute the full ingestion pipeline.

        Returns a summary dict with keys:
            run_id, status, fetched, inserted, updated, skipped, errors,
            duration_seconds, started_at, completed_at
        """
        if self._owned_client:
            pass  # will be closed in finally

        started_at = _now()
        self._run = await self._create_run(started_at)
        error_count = 0

        try:
            adapter = self._build_adapter()
            self.log.info("ingestion_started", run_id=str(self._run.id))

            # --- Pipeline stages ---
            sports = await self._ingest_sports(adapter)
            for sport_rec in sports:
                leagues = await self._ingest_leagues(adapter, sport_rec)
                for league_rec in leagues:
                    teams = await self._ingest_teams(adapter, league_rec)
                    season_rec = await self._ensure_season(league_rec)
                    for team_rec in teams:
                        await self._ingest_players(adapter, team_rec)
                        await self._ingest_injuries(adapter, team_rec)
                        await self._ingest_team_stats(adapter, team_rec, season_rec)
                    matches = await self._ingest_matches(
                        adapter, league_rec, season_rec, teams
                    )
                    finished_external_ids = [
                        m.external_id
                        for m in matches
                        if m.status == MatchStatus.FINISHED and m.external_id
                    ]
                    if finished_external_ids:
                        await self._ingest_results(adapter, matches)
                    await self._ingest_standings(adapter, league_rec, season_rec, teams)
                    await self._ingest_odds(adapter, matches)

            status = "completed"
            self.log.info(
                "ingestion_completed",
                run_id=str(self._run.id),
                inserted=self._inserted,
                updated=self._updated,
                skipped=self._skipped,
            )

        except Exception as exc:  # noqa: BLE001
            status = "failed"
            error_count += 1
            await self._record_error(
                error_type="pipeline_fatal",
                message=str(exc),
                context={"stage": "pipeline"},
            )
            self.log.exception("ingestion_failed", run_id=str(self._run.id), error=str(exc))

        finally:
            if self._owned_client:
                await self._http_client.aclose()

        completed_at = _now()
        duration = (completed_at - started_at).total_seconds()
        await self._finalise_run(status, completed_at, duration)

        return {
            "run_id": str(self._run.id),
            "status": status,
            "fetched": self._fetched,
            "inserted": self._inserted,
            "updated": self._updated,
            "skipped": self._skipped,
            "error_count": error_count,
            "duration_seconds": round(duration, 2),
            "started_at": started_at.isoformat(),
            "completed_at": completed_at.isoformat(),
        }

    # ------------------------------------------------------------------
    # Adapter instantiation
    # ------------------------------------------------------------------

    def _build_adapter(self) -> DataSourceAdapter:
        adapter_cls = ADAPTER_REGISTRY.get(self.data_source.adapter_type)
        if adapter_cls is None:
            raise ValueError(
                f"Unknown adapter_type '{self.data_source.adapter_type}'. "
                f"Registered: {list(ADAPTER_REGISTRY)}"
            )
        config: dict = dict(self.data_source.config or {})
        if self.data_source.base_url:
            config.setdefault("base_url", self.data_source.base_url)
        return adapter_cls(config=config, http_client=self._http_client)

    # ------------------------------------------------------------------
    # Run record helpers
    # ------------------------------------------------------------------

    async def _create_run(self, started_at: datetime) -> IngestionRun:
        run = IngestionRun(
            data_source_id=self.data_source.id,
            job_type="full_ingestion",
            status="running",
            started_at=started_at,
        )
        self.db.add(run)
        await self.db.flush()
        return run

    async def _finalise_run(
        self,
        status: str,
        completed_at: datetime,
        duration: float,
    ) -> None:
        assert self._run is not None
        self._run.status = status
        self._run.records_fetched = self._fetched
        self._run.records_inserted = self._inserted
        self._run.records_updated = self._updated
        self._run.records_skipped = self._skipped
        self._run.completed_at = completed_at
        self._run.duration_seconds = duration
        await self.db.flush()

        # Update last_sync_at on the DataSource
        self.data_source.last_sync_at = completed_at
        await self.db.flush()

    async def _record_error(
        self,
        error_type: str,
        message: str,
        context: dict | None = None,
    ) -> None:
        assert self._run is not None
        err = IngestionError(
            ingestion_run_id=self._run.id,
            error_type=error_type,
            error_message=message[:2000],
            stack_trace=traceback.format_exc()[:5000],
            context=context,
        )
        self.db.add(err)
        try:
            await self.db.flush()
        except Exception:  # noqa: BLE001
            pass  # don't let error recording crash the run

    # ------------------------------------------------------------------
    # Generic DB helpers
    # ------------------------------------------------------------------

    async def _get_or_create_sport(self, slug: str, defaults: dict) -> tuple[Sport, bool]:
        """Return (Sport, created)."""
        result = await self.db.execute(select(Sport).where(Sport.slug == slug))
        existing = result.scalar_one_or_none()
        if existing:
            return existing, False
        sport = Sport(slug=slug, **defaults)
        self.db.add(sport)
        await self.db.flush()
        return sport, True

    async def _get_or_create_league(
        self, slug: str, sport_id: uuid.UUID, defaults: dict
    ) -> tuple[League, bool]:
        result = await self.db.execute(select(League).where(League.slug == slug))
        existing = result.scalar_one_or_none()
        if existing:
            return existing, False
        league = League(slug=slug, sport_id=sport_id, **defaults)
        self.db.add(league)
        await self.db.flush()
        return league, True

    async def _get_or_create_team(
        self, slug: str, league_id: uuid.UUID, defaults: dict
    ) -> tuple[Team, bool]:
        result = await self.db.execute(select(Team).where(Team.slug == slug))
        existing = result.scalar_one_or_none()
        if existing:
            return existing, False
        team = Team(slug=slug, league_id=league_id, **defaults)
        self.db.add(team)
        await self.db.flush()
        return team, True

    async def _get_or_create_player(
        self, slug: str, team_id: uuid.UUID, defaults: dict
    ) -> tuple[Player, bool]:
        result = await self.db.execute(select(Player).where(Player.slug == slug))
        existing = result.scalar_one_or_none()
        if existing:
            return existing, False
        player = Player(slug=slug, team_id=team_id, **defaults)
        self.db.add(player)
        await self.db.flush()
        return player, True

    async def _get_match_by_external_id(self, external_id: str) -> Match | None:
        result = await self.db.execute(
            select(Match).where(Match.external_id == external_id)
        )
        return result.scalar_one_or_none()

    # ------------------------------------------------------------------
    # Pipeline stages
    # ------------------------------------------------------------------

    async def _ingest_sports(self, adapter: DataSourceAdapter) -> list[Sport]:
        raw_list: list[dict] = []
        try:
            raw_list = await adapter.fetch_sports()
        except Exception as exc:  # noqa: BLE001
            await self._record_error("fetch_sports", str(exc))
            return []

        self._fetched += len(raw_list)
        sport_records: list[Sport] = []
        for raw in raw_list:
            try:
                slug = raw["slug"]
                sport, created = await self._get_or_create_sport(
                    slug,
                    defaults={
                        "name": raw["name"],
                        "icon": raw.get("icon"),
                        "is_active": True,
                    },
                )
                if created:
                    self._inserted += 1
                else:
                    self._skipped += 1
                sport_records.append(sport)
            except Exception as exc:  # noqa: BLE001
                await self._record_error(
                    "upsert_sport", str(exc), context={"slug": raw.get("slug")}
                )
        return sport_records

    async def _ingest_leagues(
        self, adapter: DataSourceAdapter, sport: Sport
    ) -> list[League]:
        raw_list: list[dict] = []
        try:
            raw_list = await adapter.fetch_leagues(sport.slug)
        except Exception as exc:  # noqa: BLE001
            await self._record_error("fetch_leagues", str(exc), context={"sport": sport.slug})
            return []

        self._fetched += len(raw_list)
        league_records: list[League] = []
        for raw in raw_list:
            try:
                slug = raw["slug"]
                league, created = await self._get_or_create_league(
                    slug,
                    sport_id=sport.id,
                    defaults={
                        "name": raw["name"],
                        "country": raw.get("country"),
                        "tier": raw.get("tier"),
                        "is_active": True,
                    },
                )
                if created:
                    self._inserted += 1
                else:
                    self._skipped += 1
                league_records.append(league)
            except Exception as exc:  # noqa: BLE001
                await self._record_error(
                    "upsert_league", str(exc), context={"slug": raw.get("slug")}
                )
        return league_records

    async def _ingest_teams(
        self, adapter: DataSourceAdapter, league: League
    ) -> list[Team]:
        raw_list: list[dict] = []
        try:
            raw_list = await adapter.fetch_teams(league.slug)
        except Exception as exc:  # noqa: BLE001
            await self._record_error("fetch_teams", str(exc), context={"league": league.slug})
            return []

        self._fetched += len(raw_list)
        team_records: list[Team] = []
        for raw in raw_list:
            try:
                slug = raw["slug"]
                team, created = await self._get_or_create_team(
                    slug,
                    league_id=league.id,
                    defaults={
                        "name": raw["name"],
                        "short_name": raw.get("short_name"),
                        "country": raw.get("country"),
                        "venue": raw.get("venue"),
                        "logo_url": raw.get("logo_url"),
                        "is_active": True,
                    },
                )
                if created:
                    self._inserted += 1
                else:
                    self._skipped += 1
                team_records.append(team)
            except Exception as exc:  # noqa: BLE001
                await self._record_error(
                    "upsert_team", str(exc), context={"slug": raw.get("slug")}
                )
        return team_records

    async def _ensure_season(self, league: League) -> Season:
        """Return the current season for the league, creating it if absent."""
        result = await self.db.execute(
            select(Season)
            .where(Season.league_id == league.id, Season.is_current == True)  # noqa: E712
        )
        existing = result.scalar_one_or_none()
        if existing:
            return existing

        today = date.today()
        if today.month >= 8:
            season_name = f"{today.year}-{today.year + 1}"
            start = date(today.year, 8, 1)
            end = date(today.year + 1, 6, 30)
        else:
            season_name = f"{today.year - 1}-{today.year}"
            start = date(today.year - 1, 8, 1)
            end = date(today.year, 6, 30)

        season = Season(
            league_id=league.id,
            name=season_name,
            start_date=start,
            end_date=end,
            is_current=True,
        )
        self.db.add(season)
        await self.db.flush()
        self._inserted += 1
        return season

    async def _ingest_players(
        self, adapter: DataSourceAdapter, team: Team
    ) -> list[Player]:
        raw_list: list[dict] = []
        try:
            raw_list = await adapter.fetch_players(team.slug)
        except Exception as exc:  # noqa: BLE001
            await self._record_error("fetch_players", str(exc), context={"team": team.slug})
            return []

        self._fetched += len(raw_list)
        player_records: list[Player] = []
        for raw in raw_list:
            try:
                slug = raw["slug"]
                dob_raw = raw.get("date_of_birth")
                dob = (
                    date.fromisoformat(dob_raw) if dob_raw else None
                )
                player, created = await self._get_or_create_player(
                    slug,
                    team_id=team.id,
                    defaults={
                        "name": raw["name"],
                        "position": raw.get("position"),
                        "nationality": raw.get("nationality"),
                        "date_of_birth": dob,
                        "jersey_number": raw.get("jersey_number"),
                        "photo_url": raw.get("photo_url"),
                    },
                )
                if created:
                    self._inserted += 1
                else:
                    self._skipped += 1
                player_records.append(player)
            except Exception as exc:  # noqa: BLE001
                await self._record_error(
                    "upsert_player", str(exc), context={"slug": raw.get("slug")}
                )
        return player_records

    async def _ingest_injuries(
        self, adapter: DataSourceAdapter, team: Team
    ) -> None:
        raw_list: list[dict] = []
        try:
            raw_list = await adapter.fetch_injuries(team.slug)
        except Exception as exc:  # noqa: BLE001
            await self._record_error("fetch_injuries", str(exc), context={"team": team.slug})
            return

        self._fetched += len(raw_list)
        for raw in raw_list:
            try:
                # Look up the player
                player_slug = raw.get("player_slug", "")
                p_result = await self.db.execute(
                    select(Player).where(Player.slug == player_slug)
                )
                player = p_result.scalar_one_or_none()
                if player is None:
                    self._skipped += 1
                    continue

                # Check for existing active injury of the same type
                existing_result = await self.db.execute(
                    select(Injury).where(
                        Injury.player_id == player.id,
                        Injury.injury_type == raw["injury_type"],
                        Injury.start_date == date.fromisoformat(raw["start_date"]),
                    )
                )
                if existing_result.scalar_one_or_none():
                    self._skipped += 1
                    continue

                expected_return_raw = raw.get("expected_return")
                injury = Injury(
                    player_id=player.id,
                    team_id=team.id,
                    injury_type=raw["injury_type"],
                    severity=raw.get("severity"),
                    start_date=date.fromisoformat(raw["start_date"]),
                    expected_return=(
                        date.fromisoformat(expected_return_raw) if expected_return_raw else None
                    ),
                    status=raw.get("status", "active"),
                )
                self.db.add(injury)
                await self.db.flush()
                self._inserted += 1
            except Exception as exc:  # noqa: BLE001
                await self._record_error(
                    "upsert_injury", str(exc), context={"team": team.slug, "raw": raw}
                )

    async def _ingest_team_stats(
        self, adapter: DataSourceAdapter, team: Team, season: Season
    ) -> None:
        try:
            raw = await adapter.fetch_team_stats(team.slug, season.name)
        except Exception as exc:  # noqa: BLE001
            await self._record_error("fetch_team_stats", str(exc), context={"team": team.slug})
            return

        if not raw:
            return
        self._fetched += 1

        try:
            # Dedup: one stats record per team+season
            existing_result = await self.db.execute(
                select(TeamStats).where(
                    TeamStats.team_id == team.id,
                    TeamStats.season_id == season.id,
                )
            )
            existing = existing_result.scalar_one_or_none()
            if existing:
                # Update in place
                existing.matches_played = raw.get("matches_played", existing.matches_played)
                existing.wins = raw.get("wins", existing.wins)
                existing.draws = raw.get("draws", existing.draws)
                existing.losses = raw.get("losses", existing.losses)
                existing.goals_scored = raw.get("goals_scored", existing.goals_scored)
                existing.goals_conceded = raw.get("goals_conceded", existing.goals_conceded)
                existing.home_wins = raw.get("home_wins", existing.home_wins)
                existing.away_wins = raw.get("away_wins", existing.away_wins)
                existing.avg_goals_scored = raw.get("avg_goals_scored")
                existing.avg_goals_conceded = raw.get("avg_goals_conceded")
                existing.extra_stats = raw.get("extra_stats")
                await self.db.flush()
                self._updated += 1
            else:
                stats = TeamStats(
                    team_id=team.id,
                    season_id=season.id,
                    matches_played=raw.get("matches_played", 0),
                    wins=raw.get("wins", 0),
                    draws=raw.get("draws", 0),
                    losses=raw.get("losses", 0),
                    goals_scored=raw.get("goals_scored", 0),
                    goals_conceded=raw.get("goals_conceded", 0),
                    home_wins=raw.get("home_wins", 0),
                    away_wins=raw.get("away_wins", 0),
                    avg_goals_scored=raw.get("avg_goals_scored"),
                    avg_goals_conceded=raw.get("avg_goals_conceded"),
                    extra_stats=raw.get("extra_stats"),
                )
                self.db.add(stats)
                await self.db.flush()
                self._inserted += 1
        except Exception as exc:  # noqa: BLE001
            await self._record_error(
                "upsert_team_stats", str(exc), context={"team": team.slug}
            )

    async def _ingest_matches(
        self,
        adapter: DataSourceAdapter,
        league: League,
        season: Season,
        teams: list[Team],
    ) -> list[Match]:
        raw_list: list[dict] = []
        try:
            raw_list = await adapter.fetch_matches(league.slug, self.date_from, self.date_to)
        except Exception as exc:  # noqa: BLE001
            await self._record_error("fetch_matches", str(exc), context={"league": league.slug})
            return []

        self._fetched += len(raw_list)
        team_map: dict[str, Team] = {t.slug: t for t in teams}
        match_records: list[Match] = []

        for raw in raw_list:
            try:
                ext_id = raw["external_id"]
                existing = await self._get_match_by_external_id(ext_id)
                home = team_map.get(raw["home_team_slug"])
                away = team_map.get(raw["away_team_slug"])

                if home is None or away is None:
                    self.log.warning(
                        "match_team_not_found",
                        ext_id=ext_id,
                        home=raw.get("home_team_slug"),
                        away=raw.get("away_team_slug"),
                    )
                    self._skipped += 1
                    continue

                scheduled_at = datetime.fromisoformat(raw["scheduled_at"])
                status_raw = raw.get("status", "scheduled")
                try:
                    status = MatchStatus(status_raw)
                except ValueError:
                    status = MatchStatus.SCHEDULED

                if existing:
                    # Update mutable fields
                    existing.status = status
                    existing.scheduled_at = scheduled_at
                    existing.venue = raw.get("venue")
                    existing.round_name = raw.get("round_name")
                    existing.matchday = raw.get("matchday")
                    await self.db.flush()
                    self._updated += 1
                    match_records.append(existing)
                else:
                    match = Match(
                        league_id=league.id,
                        season_id=season.id,
                        home_team_id=home.id,
                        away_team_id=away.id,
                        external_id=ext_id,
                        status=status,
                        scheduled_at=scheduled_at,
                        venue=raw.get("venue"),
                        round_name=raw.get("round_name"),
                        matchday=raw.get("matchday"),
                    )
                    self.db.add(match)
                    await self.db.flush()
                    self._inserted += 1
                    match_records.append(match)
            except Exception as exc:  # noqa: BLE001
                await self._record_error(
                    "upsert_match",
                    str(exc),
                    context={"external_id": raw.get("external_id")},
                )
        return match_records

    async def _ingest_results(
        self, adapter: DataSourceAdapter, matches: list[Match]
    ) -> None:
        finished = [
            m for m in matches
            if m.status == MatchStatus.FINISHED and m.external_id
        ]
        if not finished:
            return

        external_ids = [m.external_id for m in finished]  # type: ignore[misc]
        raw_list: list[dict] = []
        try:
            raw_list = await adapter.fetch_results(external_ids)
        except Exception as exc:  # noqa: BLE001
            await self._record_error("fetch_results", str(exc))
            return

        self._fetched += len(raw_list)
        ext_id_to_match: dict[str, Match] = {m.external_id: m for m in finished}  # type: ignore[misc]

        for raw in raw_list:
            try:
                ext_match_id = raw["external_match_id"]
                match = ext_id_to_match.get(ext_match_id)
                if match is None:
                    self._skipped += 1
                    continue

                # Check for existing result
                existing_result = await self.db.execute(
                    select(MatchResult).where(MatchResult.match_id == match.id)
                )
                existing = existing_result.scalar_one_or_none()

                home_score = raw["home_score"]
                away_score = raw["away_score"]
                winner = raw.get("winner")
                if winner is None:
                    if home_score > away_score:
                        winner = "home"
                    elif away_score > home_score:
                        winner = "away"
                    else:
                        winner = "draw"

                if existing:
                    existing.home_score = home_score
                    existing.away_score = away_score
                    existing.home_score_ht = raw.get("home_score_ht")
                    existing.away_score_ht = raw.get("away_score_ht")
                    existing.winner = winner
                    existing.extra_data = raw.get("extra_data")
                    await self.db.flush()
                    self._updated += 1
                else:
                    result = MatchResult(
                        match_id=match.id,
                        home_score=home_score,
                        away_score=away_score,
                        home_score_ht=raw.get("home_score_ht"),
                        away_score_ht=raw.get("away_score_ht"),
                        winner=winner,
                        extra_data=raw.get("extra_data"),
                    )
                    self.db.add(result)
                    await self.db.flush()
                    self._inserted += 1
            except Exception as exc:  # noqa: BLE001
                await self._record_error(
                    "upsert_result",
                    str(exc),
                    context={"external_match_id": raw.get("external_match_id")},
                )

    async def _ingest_standings(
        self,
        adapter: DataSourceAdapter,
        league: League,
        season: Season,
        teams: list[Team],
    ) -> None:
        raw_list: list[dict] = []
        try:
            raw_list = await adapter.fetch_standings(league.slug, season.name)
        except Exception as exc:  # noqa: BLE001
            await self._record_error(
                "fetch_standings", str(exc), context={"league": league.slug}
            )
            return

        self._fetched += len(raw_list)
        team_map: dict[str, Team] = {t.slug: t for t in teams}
        today = date.today()

        for raw in raw_list:
            try:
                team = team_map.get(raw["team_slug"])
                if team is None:
                    self._skipped += 1
                    continue

                # Dedup on (league, season, team, snapshot_date)
                existing_result = await self.db.execute(
                    select(StandingsSnapshot).where(
                        StandingsSnapshot.league_id == league.id,
                        StandingsSnapshot.season_id == season.id,
                        StandingsSnapshot.team_id == team.id,
                        StandingsSnapshot.snapshot_date == today,
                    )
                )
                existing = existing_result.scalar_one_or_none()

                if existing:
                    existing.position = raw["position"]
                    existing.played = raw["played"]
                    existing.won = raw["won"]
                    existing.drawn = raw["drawn"]
                    existing.lost = raw["lost"]
                    existing.goals_for = raw["goals_for"]
                    existing.goals_against = raw["goals_against"]
                    existing.goal_difference = raw["goal_difference"]
                    existing.points = raw["points"]
                    existing.extra_data = raw.get("extra_data")
                    await self.db.flush()
                    self._updated += 1
                else:
                    snapshot = StandingsSnapshot(
                        league_id=league.id,
                        season_id=season.id,
                        team_id=team.id,
                        snapshot_date=today,
                        position=raw["position"],
                        played=raw["played"],
                        won=raw["won"],
                        drawn=raw["drawn"],
                        lost=raw["lost"],
                        goals_for=raw["goals_for"],
                        goals_against=raw["goals_against"],
                        goal_difference=raw["goal_difference"],
                        points=raw["points"],
                        extra_data=raw.get("extra_data"),
                    )
                    self.db.add(snapshot)
                    await self.db.flush()
                    self._inserted += 1
            except Exception as exc:  # noqa: BLE001
                await self._record_error(
                    "upsert_standings",
                    str(exc),
                    context={"team": raw.get("team_slug")},
                )

    async def _ingest_odds(
        self, adapter: DataSourceAdapter, matches: list[Match]
    ) -> None:
        for match in matches:
            if not match.external_id:
                continue
            raw_list: list[dict] = []
            try:
                raw_list = await adapter.fetch_odds_history(match.external_id)
            except Exception as exc:  # noqa: BLE001
                await self._record_error(
                    "fetch_odds_history",
                    str(exc),
                    context={"match_external_id": match.external_id},
                )
                continue

            self._fetched += len(raw_list)
            for raw in raw_list:
                try:
                    recorded_at = datetime.fromisoformat(raw["recorded_at"])
                    # Dedup by (match, source, market, recorded_at)
                    existing_result = await self.db.execute(
                        select(OddsHistory).where(
                            OddsHistory.match_id == match.id,
                            OddsHistory.source == raw["source"],
                            OddsHistory.market == raw["market"],
                            OddsHistory.recorded_at == recorded_at,
                        )
                    )
                    if existing_result.scalar_one_or_none():
                        self._skipped += 1
                        continue

                    odds = OddsHistory(
                        match_id=match.id,
                        source=raw["source"],
                        market=raw["market"],
                        home_odds=raw["home_odds"],
                        draw_odds=raw.get("draw_odds"),
                        away_odds=raw["away_odds"],
                        recorded_at=recorded_at,
                    )
                    self.db.add(odds)
                    await self.db.flush()
                    self._inserted += 1
                except Exception as exc:  # noqa: BLE001
                    await self._record_error(
                        "upsert_odds",
                        str(exc),
                        context={"match_external_id": match.external_id},
                    )
