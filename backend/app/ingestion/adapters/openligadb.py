"""
OpenLigaDB Adapter
==================
Fetches LIVE football data from OpenLigaDB – a completely free, open-access
API that requires NO authentication token.

Homepage : https://www.openligadb.de
API docs  : https://api.openligadb.de (Swagger UI available at root)

This adapter is the **primary fallback** in the LiveDataService: it will
always work without any configuration beyond selecting a league slug.

Supported leagues
-----------------
bl1   Bundesliga           Germany Tier 1
bl2   2. Bundesliga        Germany Tier 2
bl3   3. Liga              Germany Tier 3
dfb   DFB-Pokal            Germany Cup
msbl  Männer Super League  Switzerland

Many more are available via /getavailableleagues.
"""
from __future__ import annotations

import re
from datetime import date, datetime, timezone
from typing import Any

import httpx
import structlog

from app.ingestion.base_adapter import DataSourceAdapter

logger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BASE_URL = "https://api.openligadb.de"

# Map internal league slugs → OpenLigaDB shortNames
LEAGUE_SLUG_TO_OLDB: dict[str, str] = {
    "bundesliga":        "bl1",
    "2-bundesliga":      "bl2",
    "3-liga":            "bl3",
    "dfb-pokal":         "dfb",
}

OLDB_TO_LEAGUE_SLUG: dict[str, str] = {v: k for k, v in LEAGUE_SLUG_TO_OLDB.items()}

# OpenLigaDB league metadata (name, country, tier)
LEAGUE_META: dict[str, dict] = {
    "bl1": {"name": "Bundesliga",     "country": "Germany", "tier": 1},
    "bl2": {"name": "2. Bundesliga",  "country": "Germany", "tier": 2},
    "bl3": {"name": "3. Liga",        "country": "Germany", "tier": 3},
    "dfb": {"name": "DFB-Pokal",      "country": "Germany", "tier": None},
}

# Current season year (start year of the season, e.g. 2024 for 2024/25)
import datetime as _dt
_NOW = _dt.datetime.now(_dt.timezone.utc)
# Season starts in August; if we're before August use previous year
CURRENT_SEASON: int = _NOW.year if _NOW.month >= 8 else _NOW.year - 1


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def _parse_oldb_dt(dt_str: str | None) -> str | None:
    """Parse OpenLigaDB datetime strings to ISO 8601 UTC."""
    if not dt_str:
        return None
    try:
        # OpenLigaDB returns "2024-08-23T20:30:00" (local German time, no tz)
        # We treat as UTC for normalisation purposes.
        dt = datetime.fromisoformat(dt_str)
        if dt.tzinfo is None:
            # German football is CET/CEST; approximate as UTC+1 in winter,
            # UTC+2 in summer – but for a free no-key API we accept the
            # simplification of treating it as UTC.
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()
    except ValueError:
        return dt_str


def _map_status(m: dict) -> str:
    """Derive internal status from OpenLigaDB match dict."""
    if m.get("matchIsFinished"):
        return "finished"
    # OpenLigaDB doesn't expose live status directly; rely on date comparison
    scheduled_raw = m.get("matchDateTimeUTC") or m.get("matchDateTime")
    if scheduled_raw:
        try:
            scheduled = datetime.fromisoformat(
                scheduled_raw.replace("Z", "+00:00")
            )
            if scheduled.tzinfo is None:
                scheduled = scheduled.replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            if scheduled <= now:
                return "live"
        except ValueError:
            pass
    return "scheduled"


def _winner(home: int | None, away: int | None) -> str | None:
    if home is None or away is None:
        return None
    if home > away:
        return "home"
    if away > home:
        return "away"
    return "draw"


def _extract_score(m: dict) -> tuple[int | None, int | None, int | None, int | None]:
    """
    Return (home_ft, away_ft, home_ht, away_ht) from an OpenLigaDB match dict.
    """
    home_ft = away_ft = home_ht = away_ht = None
    for result in m.get("matchResults", []):
        result_type = result.get("resultTypeID")
        if result_type == 2:  # full time
            home_ft = result.get("pointsTeam1")
            away_ft = result.get("pointsTeam2")
        elif result_type == 1:  # half time
            home_ht = result.get("pointsTeam1")
            away_ht = result.get("pointsTeam2")
    return home_ft, away_ft, home_ht, away_ht


# ---------------------------------------------------------------------------
# Adapter
# ---------------------------------------------------------------------------

class OpenLigaDBAdapter(DataSourceAdapter):
    """
    Adapter for OpenLigaDB – no API key required.

    Config keys
    -----------
    leagues : list[str]
        Internal league slugs to sync (default: ["bundesliga"]).
    season : int
        Start year of the season to fetch (default: current season).
    rate_limit_seconds : float
        Delay between requests (default: 0.5 s; OpenLigaDB has no published
        rate limit but is a community resource – be polite).
    """

    def __init__(self, config: dict, http_client: httpx.AsyncClient) -> None:
        super().__init__(config, http_client)
        self._rate_limit_seconds = float(self.config.get("rate_limit_seconds", 0.5))
        self._season: int = int(self.config.get("season", CURRENT_SEASON))
        self._enabled_leagues: list[str] = self.config.get(
            "leagues", list(LEAGUE_SLUG_TO_OLDB.keys())
        )

    # ------------------------------------------------------------------
    # Internal HTTP helper
    # ------------------------------------------------------------------

    async def _get(self, path: str, params: dict | None = None) -> Any:
        url = f"{BASE_URL}{path}"
        self.log.debug("openligadb_request", url=url)
        await self.rate_limit()
        response = await self.http_client.get(url, params=params or {})
        response.raise_for_status()
        data = response.json()
        self.log.debug("openligadb_response", url=url, status=response.status_code)
        return data

    def _league_code(self, league_id: str) -> str | None:
        """Resolve league slug or raw OpenLigaDB shortname to OLDB code."""
        if league_id in LEAGUE_META:
            return league_id
        return LEAGUE_SLUG_TO_OLDB.get(league_id)

    # ------------------------------------------------------------------
    # DataSourceAdapter interface
    # ------------------------------------------------------------------

    async def fetch_sports(self) -> list[dict]:
        return [
            {
                "external_id": "oldb_sport_football",
                "name": "Football",
                "slug": "football",
                "icon": "⚽",
            }
        ]

    async def fetch_leagues(self, sport_id: str) -> list[dict]:
        """
        Fetch all available leagues from OpenLigaDB.
        Falls back to the static LEAGUE_META dict on error.
        """
        try:
            data = await self._fetch_with_retry(self._get, "/getavailableleagues")
        except Exception as exc:  # noqa: BLE001
            self.log.warning("openligadb_leagues_fetch_failed", error=str(exc))
            data = None

        leagues = []
        if data:
            for league in data:
                short = league.get("leagueShortcut", "").lower()
                meta = LEAGUE_META.get(short, {})
                slug = OLDB_TO_LEAGUE_SLUG.get(short, _slugify(league.get("leagueName", short)))
                leagues.append(
                    {
                        "external_id": f"oldb_league_{short}",
                        "sport_slug": "football",
                        "name": league.get("leagueName", short),
                        "slug": slug,
                        "country": meta.get("country"),
                        "tier": meta.get("tier"),
                    }
                )
        else:
            # Fallback to known leagues
            for code, meta in LEAGUE_META.items():
                slug = OLDB_TO_LEAGUE_SLUG.get(code, _slugify(meta["name"]))
                leagues.append(
                    {
                        "external_id": f"oldb_league_{code}",
                        "sport_slug": "football",
                        "name": meta["name"],
                        "slug": slug,
                        "country": meta["country"],
                        "tier": meta["tier"],
                    }
                )

        self._log_fetch("leagues", len(leagues))
        return leagues

    async def fetch_teams(self, league_id: str) -> list[dict]:
        """Fetch teams for a league via the season match data."""
        code = self._league_code(league_id)
        if not code:
            self.log.warning("openligadb_unknown_league", league_id=league_id)
            return []

        league_slug = OLDB_TO_LEAGUE_SLUG.get(code, league_id)
        try:
            data = await self._fetch_with_retry(
                self._get, f"/getavailableteams/{code}/{self._season}"
            )
        except Exception as exc:  # noqa: BLE001
            self.log.warning("openligadb_teams_fetch_failed", error=str(exc), league=code)
            return []

        teams = []
        if isinstance(data, list):
            for t in data:
                name = t.get("teamName", "")
                slug = _slugify(t.get("shortName") or name)
                teams.append(
                    {
                        "external_id": f"oldb_team_{t.get('teamId', slug)}",
                        "league_slug": league_slug,
                        "name": name,
                        "slug": slug,
                        "short_name": t.get("shortName"),
                        "country": LEAGUE_META.get(code, {}).get("country"),
                        "venue": None,
                        "logo_url": t.get("teamIconUrl"),
                    }
                )

        self._log_fetch("teams", len(teams), league=code)
        return teams

    async def fetch_players(self, team_id: str) -> list[dict]:
        """OpenLigaDB does not expose player rosters; return empty list."""
        self.log.debug("openligadb_players_unavailable", team_id=team_id)
        return []

    async def fetch_matches(
        self,
        league_id: str,
        date_from: date,
        date_to: date,
    ) -> list[dict]:
        """Fetch all matches for the configured season, then filter by date."""
        code = self._league_code(league_id)
        if not code:
            self.log.warning("openligadb_unknown_league", league_id=league_id)
            return []

        league_slug = OLDB_TO_LEAGUE_SLUG.get(code, league_id)
        try:
            data = await self._fetch_with_retry(
                self._get, f"/getmatchdata/{code}/{self._season}"
            )
        except Exception as exc:  # noqa: BLE001
            self.log.warning("openligadb_matches_fetch_failed", error=str(exc), league=code)
            return []

        matches = []
        season_name = f"{self._season}-{self._season + 1}"
        for m in data or []:
            scheduled_raw = m.get("matchDateTimeUTC") or m.get("matchDateTime", "")
            try:
                scheduled_dt = datetime.fromisoformat(
                    scheduled_raw.replace("Z", "+00:00")
                )
                if scheduled_dt.tzinfo is None:
                    scheduled_dt = scheduled_dt.replace(tzinfo=timezone.utc)
                match_date = scheduled_dt.date()
            except (ValueError, AttributeError):
                continue

            if not (date_from <= match_date <= date_to):
                continue

            home = m.get("team1", {})
            away = m.get("team2", {})
            home_slug = _slugify(home.get("shortName") or home.get("teamName", "home"))
            away_slug = _slugify(away.get("shortName") or away.get("teamName", "away"))
            matches.append(
                {
                    "external_id": f"oldb_match_{m['matchID']}",
                    "league_slug": league_slug,
                    "home_team_slug": home_slug,
                    "away_team_slug": away_slug,
                    "scheduled_at": _parse_oldb_dt(scheduled_raw),
                    "status": _map_status(m),
                    "venue": None,
                    "round_name": None,
                    "matchday": m.get("group", {}).get("groupOrderID"),
                    "season_name": season_name,
                }
            )

        self._log_fetch("matches", len(matches), league=code,
                        date_from=str(date_from), date_to=str(date_to))
        return matches

    async def fetch_matches_by_matchday(
        self,
        league_id: str,
        matchday: int,
    ) -> list[dict]:
        """
        Fetch matches for a specific matchday.
        Not part of the base interface but useful for targeted syncs.
        """
        code = self._league_code(league_id)
        if not code:
            return []

        league_slug = OLDB_TO_LEAGUE_SLUG.get(code, league_id)
        try:
            data = await self._fetch_with_retry(
                self._get, f"/getmatchdata/{code}/{self._season}/{matchday}"
            )
        except Exception as exc:  # noqa: BLE001
            self.log.warning("openligadb_matchday_fetch_failed", error=str(exc))
            return []

        season_name = f"{self._season}-{self._season + 1}"
        matches = []
        for m in data or []:
            scheduled_raw = m.get("matchDateTimeUTC") or m.get("matchDateTime", "")
            home = m.get("team1", {})
            away = m.get("team2", {})
            home_slug = _slugify(home.get("shortName") or home.get("teamName", "home"))
            away_slug = _slugify(away.get("shortName") or away.get("teamName", "away"))
            matches.append(
                {
                    "external_id": f"oldb_match_{m['matchID']}",
                    "league_slug": league_slug,
                    "home_team_slug": home_slug,
                    "away_team_slug": away_slug,
                    "scheduled_at": _parse_oldb_dt(scheduled_raw),
                    "status": _map_status(m),
                    "venue": None,
                    "round_name": None,
                    "matchday": matchday,
                    "season_name": season_name,
                }
            )

        self._log_fetch("matches", len(matches), league=code, matchday=matchday)
        return matches

    async def fetch_results(self, match_ids: list[str]) -> list[dict]:
        """
        Fetch results for specific matches.

        OpenLigaDB exposes results inside the match object, so we re-fetch
        each one individually.
        """
        results = []
        for match_id in match_ids:
            raw_id = match_id.replace("oldb_match_", "")
            try:
                data = await self._fetch_with_retry(self._get, f"/getmatch/{raw_id}")
                if not data:
                    continue
                home_ft, away_ft, home_ht, away_ht = _extract_score(data)
                results.append(
                    {
                        "external_match_id": match_id,
                        "home_score": home_ft,
                        "away_score": away_ft,
                        "home_score_ht": home_ht,
                        "away_score_ht": away_ht,
                        "winner": _winner(home_ft, away_ft),
                        "extra_data": {
                            "goals": [
                                {
                                    "scorer": g.get("goalGetterName"),
                                    "minute": g.get("matchMinute"),
                                    "is_own_goal": g.get("isOwnGoal", False),
                                    "is_penalty": g.get("isPenalty", False),
                                    "score_home": g.get("scoreTeam1"),
                                    "score_away": g.get("scoreTeam2"),
                                }
                                for g in data.get("goals", [])
                            ]
                        },
                    }
                )
            except Exception as exc:  # noqa: BLE001
                self.log.warning(
                    "openligadb_result_fetch_failed",
                    match_id=match_id,
                    error=str(exc),
                )

        self._log_fetch("results", len(results))
        return results

    async def fetch_standings(self, league_id: str, season_id: str) -> list[dict]:
        """Fetch the current standings table (Tabelle) from OpenLigaDB."""
        code = self._league_code(league_id)
        if not code:
            self.log.warning("openligadb_unknown_league", league_id=league_id)
            return []

        # season_id may be a full "YYYY-YYYY" string; extract start year
        season_year = season_id.split("-")[0] if "-" in str(season_id) else str(self._season)

        try:
            data = await self._fetch_with_retry(
                self._get, f"/getbltable/{code}/{season_year}"
            )
        except Exception as exc:  # noqa: BLE001
            self.log.warning("openligadb_standings_fetch_failed", error=str(exc), league=code)
            return []

        league_slug = OLDB_TO_LEAGUE_SLUG.get(code, league_id)
        season_name = f"{season_year}-{int(season_year) + 1}"
        rows = []
        for i, entry in enumerate(data or [], start=1):
            team = entry.get("teamInfoId") or {}
            team_name = entry.get("teamName") or entry.get("shortName", f"team-{i}")
            team_slug = _slugify(team_name)
            rows.append(
                {
                    "team_slug": team_slug,
                    "league_slug": league_slug,
                    "season_name": season_name,
                    "position": i,
                    "played": entry.get("matches", 0),
                    "won": entry.get("won", 0),
                    "drawn": entry.get("draw", 0),
                    "lost": entry.get("lost", 0),
                    "goals_for": entry.get("goals", 0),
                    "goals_against": entry.get("opponentGoals", 0),
                    "goal_difference": entry.get("goalDiff", 0),
                    "points": entry.get("points", 0),
                    "extra_data": {
                        "won_home": entry.get("wonHome"),
                        "won_away": entry.get("wonAway"),
                        "lost_home": entry.get("lostHome"),
                        "lost_away": entry.get("lostAway"),
                        "draw_home": entry.get("drawHome"),
                        "draw_away": entry.get("drawAway"),
                    },
                }
            )

        self._log_fetch("standings", len(rows), league=code)
        return rows

    async def fetch_team_stats(self, team_id: str, season_id: str) -> dict:
        """Derive team stats from standings; detailed stats not available."""
        # Extract league from team_id prefix convention
        raw_id = team_id.replace("oldb_team_", "")
        # We don't have a direct team→league mapping without more context;
        # fall back to Bundesliga as the primary supported league
        league_id = self.config.get("default_league", "bundesliga")
        standings = await self.fetch_standings(league_id, season_id)
        for row in standings:
            if row["team_slug"] == raw_id or raw_id.isdigit():
                played = row["played"]
                return {
                    "team_slug": row["team_slug"],
                    "season_name": row["season_name"],
                    "matches_played": played,
                    "wins": row["won"],
                    "draws": row["drawn"],
                    "losses": row["lost"],
                    "goals_scored": row["goals_for"],
                    "goals_conceded": row["goals_against"],
                    "home_wins": row.get("extra_data", {}).get("won_home"),
                    "away_wins": row.get("extra_data", {}).get("won_away"),
                    "avg_goals_scored": round(row["goals_for"] / played, 2) if played else None,
                    "avg_goals_conceded": round(row["goals_against"] / played, 2) if played else None,
                    "extra_stats": row.get("extra_data"),
                }
        return {}

    async def fetch_player_stats(self, player_id: str, season_id: str) -> dict:
        """Not available via OpenLigaDB."""
        return {}

    async def fetch_injuries(self, team_id: str) -> list[dict]:
        """Not available via OpenLigaDB."""
        return []

    async def fetch_odds_history(self, match_id: str) -> list[dict]:
        """Not available via OpenLigaDB."""
        return []
