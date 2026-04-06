"""
Football-Data.org Adapter
=========================
Fetches LIVE football data from the football-data.org v4 API.

Free tier: 10 requests/minute, covers top 5 European leagues + Champions League.
Requires an API key set in the adapter config as ``api_key``.

Sign up free at: https://www.football-data.org/client/register
"""
from __future__ import annotations

import asyncio
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

BASE_URL = "https://api.football-data.org/v4"

# Map internal league slugs → football-data.org competition codes
LEAGUE_SLUG_TO_CODE: dict[str, str] = {
    "premier-league": "PL",
    "la-liga": "PD",
    "bundesliga": "BL1",
    "serie-a": "SA",
    "ligue-1": "FL1",
    "champions-league": "CL",
}

# Map competition codes → internal league slugs
CODE_TO_LEAGUE_SLUG: dict[str, str] = {v: k for k, v in LEAGUE_SLUG_TO_CODE.items()}

# Map competition codes → country / display info
COMPETITION_META: dict[str, dict] = {
    "PL":  {"name": "Premier League",    "country": "England", "tier": 1},
    "PD":  {"name": "La Liga",           "country": "Spain",   "tier": 1},
    "BL1": {"name": "Bundesliga",        "country": "Germany", "tier": 1},
    "SA":  {"name": "Serie A",           "country": "Italy",   "tier": 1},
    "FL1": {"name": "Ligue 1",           "country": "France",  "tier": 1},
    "CL":  {"name": "Champions League",  "country": "Europe",  "tier": None},
}

# Free tier: 10 req/min → 1 request per 6 seconds to be safe
FREE_TIER_RATE_LIMIT = 6.5  # seconds between requests


def _slugify(text: str) -> str:
    """Convert a team/competition name to a URL-safe slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def _parse_iso(dt_str: str | None) -> str | None:
    """Normalise a datetime string to ISO 8601 with UTC timezone."""
    if not dt_str:
        return None
    try:
        # football-data.org returns strings like "2024-08-17T12:30:00Z"
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()
    except ValueError:
        return dt_str


def _map_status(raw: str | None) -> str:
    """Map API status values to internal status vocabulary."""
    mapping = {
        "SCHEDULED": "scheduled",
        "TIMED":     "scheduled",
        "IN_PLAY":   "live",
        "PAUSED":    "live",
        "FINISHED":  "finished",
        "SUSPENDED": "postponed",
        "POSTPONED": "postponed",
        "CANCELLED": "cancelled",
        "AWARDED":   "finished",
    }
    return mapping.get(raw or "", "scheduled")


def _winner(home: int | None, away: int | None) -> str | None:
    if home is None or away is None:
        return None
    if home > away:
        return "home"
    if away > home:
        return "away"
    return "draw"


# ---------------------------------------------------------------------------
# Adapter
# ---------------------------------------------------------------------------

class FootballDataOrgAdapter(DataSourceAdapter):
    """
    Adapter for the football-data.org v4 REST API.

    Config keys
    -----------
    api_key : str
        Your football-data.org API key (required for non-public endpoints).
    leagues : list[str]
        List of internal league slugs to sync (default: all supported).
    rate_limit_seconds : float
        Override the per-request delay (default: 6.5s for free tier).
    """

    def __init__(self, config: dict, http_client: httpx.AsyncClient) -> None:
        super().__init__(config, http_client)
        self._api_key: str = self.config.get("api_key", "")
        self._rate_limit_seconds = float(
            self.config.get("rate_limit_seconds", FREE_TIER_RATE_LIMIT)
        )
        self._enabled_leagues: list[str] = self.config.get(
            "leagues", list(LEAGUE_SLUG_TO_CODE.keys())
        )

    # ------------------------------------------------------------------
    # Internal HTTP helper
    # ------------------------------------------------------------------

    async def _get(self, path: str, params: dict | None = None) -> Any:
        """Perform a GET request against the football-data.org API."""
        url = f"{BASE_URL}{path}"
        headers: dict[str, str] = {}
        if self._api_key:
            headers["X-Auth-Token"] = self._api_key

        self.log.debug("football_data_org_request", url=url, params=params)
        await self.rate_limit()

        response = await self.http_client.get(url, headers=headers, params=params or {})

        if response.status_code == 429:
            # Rate limited – back off and retry once
            self.log.warning("football_data_org_rate_limited", url=url)
            await asyncio.sleep(60)
            response = await self.http_client.get(url, headers=headers, params=params or {})

        if response.status_code == 401:
            self.log.error("football_data_org_auth_error", url=url)
            raise PermissionError("football-data.org: Invalid or missing API key.")

        if response.status_code == 403:
            self.log.warning(
                "football_data_org_tier_limit",
                url=url,
                detail="Competition not available on free tier.",
            )
            return None

        response.raise_for_status()
        data = response.json()
        self.log.debug("football_data_org_response", url=url, status=response.status_code)
        return data

    # ------------------------------------------------------------------
    # League / competition helpers
    # ------------------------------------------------------------------

    def _competition_code(self, league_id: str) -> str | None:
        """
        Resolve a league_id (slug or competition code) to an API code.
        Returns None if the league is not supported.
        """
        if league_id.upper() in COMPETITION_META:
            return league_id.upper()
        return LEAGUE_SLUG_TO_CODE.get(league_id)

    # ------------------------------------------------------------------
    # DataSourceAdapter interface
    # ------------------------------------------------------------------

    async def fetch_sports(self) -> list[dict]:
        """Return the Football sport entity."""
        return [
            {
                "external_id": "fdorg_sport_football",
                "name": "Football",
                "slug": "football",
                "icon": "⚽",
            }
        ]

    async def fetch_leagues(self, sport_id: str) -> list[dict]:
        """Fetch all supported competitions."""
        leagues = []
        for code, meta in COMPETITION_META.items():
            slug = CODE_TO_LEAGUE_SLUG.get(code, _slugify(meta["name"]))
            leagues.append(
                {
                    "external_id": f"fdorg_league_{code.lower()}",
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
        """Fetch all teams for a competition."""
        code = self._competition_code(league_id)
        if not code:
            self.log.warning("football_data_org_unknown_league", league_id=league_id)
            return []

        data = await self._fetch_with_retry(self._get, f"/competitions/{code}/teams")
        if not data:
            return []

        league_slug = CODE_TO_LEAGUE_SLUG.get(code, _slugify(code))
        teams = []
        for t in data.get("teams", []):
            slug = _slugify(t.get("shortName") or t.get("name", str(t.get("id"))))
            teams.append(
                {
                    "external_id": f"fdorg_team_{t['id']}",
                    "league_slug": league_slug,
                    "name": t.get("name", ""),
                    "slug": slug,
                    "short_name": t.get("shortName") or t.get("tla"),
                    "country": t.get("area", {}).get("name"),
                    "venue": t.get("venue"),
                    "logo_url": t.get("crest"),
                }
            )

        self._log_fetch("teams", len(teams), league=code)
        return teams

    async def fetch_players(self, team_id: str) -> list[dict]:
        """Fetch squad for a team by external ID or raw team ID."""
        raw_id = team_id.replace("fdorg_team_", "")
        data = await self._fetch_with_retry(self._get, f"/teams/{raw_id}")
        if not data:
            return []

        team_slug = _slugify(data.get("shortName") or data.get("name", raw_id))
        players = []
        for p in data.get("squad", []):
            name = p.get("name", "")
            slug = _slugify(name) if name else f"player-{p.get('id', 'unknown')}"
            pos_map = {"Goalkeeper": "GK", "Defender": "DEF", "Midfielder": "MID", "Attacker": "FWD"}
            position = pos_map.get(p.get("position", ""), p.get("position"))
            players.append(
                {
                    "external_id": f"fdorg_player_{p['id']}",
                    "team_slug": team_slug,
                    "name": name,
                    "slug": slug,
                    "position": position,
                    "nationality": p.get("nationality"),
                    "date_of_birth": p.get("dateOfBirth"),
                    "jersey_number": p.get("shirtNumber"),
                    "photo_url": None,
                }
            )

        self._log_fetch("players", len(players), team_id=raw_id)
        return players

    async def fetch_matches(
        self,
        league_id: str,
        date_from: date,
        date_to: date,
    ) -> list[dict]:
        """Fetch fixtures within a date range for a competition."""
        code = self._competition_code(league_id)
        if not code:
            self.log.warning("football_data_org_unknown_league", league_id=league_id)
            return []

        params = {
            "dateFrom": date_from.isoformat(),
            "dateTo": date_to.isoformat(),
        }
        data = await self._fetch_with_retry(
            self._get, f"/competitions/{code}/matches", params
        )
        if not data:
            return []

        league_slug = CODE_TO_LEAGUE_SLUG.get(code, _slugify(code))
        matches = []
        for m in data.get("matches", []):
            home = m.get("homeTeam", {})
            away = m.get("awayTeam", {})
            home_slug = _slugify(home.get("shortName") or home.get("name", "home"))
            away_slug = _slugify(away.get("shortName") or away.get("name", "away"))
            season = m.get("season", {})
            season_name = None
            if season.get("startDate") and season.get("endDate"):
                y_start = season["startDate"][:4]
                y_end = season["endDate"][:4]
                season_name = f"{y_start}-{y_end}"

            matches.append(
                {
                    "external_id": f"fdorg_match_{m['id']}",
                    "league_slug": league_slug,
                    "home_team_slug": home_slug,
                    "away_team_slug": away_slug,
                    "scheduled_at": _parse_iso(m.get("utcDate")),
                    "status": _map_status(m.get("status")),
                    "venue": None,
                    "round_name": m.get("stage"),
                    "matchday": m.get("matchday"),
                    "season_name": season_name,
                }
            )

        self._log_fetch("matches", len(matches), league=code,
                        date_from=str(date_from), date_to=str(date_to))
        return matches

    async def fetch_results(self, match_ids: list[str]) -> list[dict]:
        """
        Derive results from finished matches.

        football-data.org does not have a dedicated results endpoint; results
        are embedded in match objects.  We re-fetch each match individually.
        """
        results = []
        for match_id in match_ids:
            raw_id = match_id.replace("fdorg_match_", "")
            try:
                data = await self._fetch_with_retry(self._get, f"/matches/{raw_id}")
                if not data:
                    continue
                score = data.get("score", {})
                ft = score.get("fullTime", {})
                ht = score.get("halfTime", {})
                home_score = ft.get("home")
                away_score = ft.get("away")
                results.append(
                    {
                        "external_match_id": match_id,
                        "home_score": home_score,
                        "away_score": away_score,
                        "home_score_ht": ht.get("home"),
                        "away_score_ht": ht.get("away"),
                        "winner": _winner(home_score, away_score),
                        "extra_data": {
                            "duration": score.get("duration"),
                            "winner_raw": score.get("winner"),
                        },
                    }
                )
            except Exception as exc:  # noqa: BLE001
                self.log.warning(
                    "football_data_org_result_fetch_failed",
                    match_id=match_id,
                    error=str(exc),
                )

        self._log_fetch("results", len(results))
        return results

    async def fetch_standings(self, league_id: str, season_id: str) -> list[dict]:
        """Fetch current league standings table."""
        code = self._competition_code(league_id)
        if not code:
            self.log.warning("football_data_org_unknown_league", league_id=league_id)
            return []

        data = await self._fetch_with_retry(self._get, f"/competitions/{code}/standings")
        if not data:
            return []

        league_slug = CODE_TO_LEAGUE_SLUG.get(code, _slugify(code))
        season = data.get("season", {})
        season_name = season_id
        if season.get("startDate") and season.get("endDate"):
            y_start = season["startDate"][:4]
            y_end = season["endDate"][:4]
            season_name = f"{y_start}-{y_end}"

        rows = []
        for standing_group in data.get("standings", []):
            if standing_group.get("type") != "TOTAL":
                continue
            for entry in standing_group.get("table", []):
                team = entry.get("team", {})
                team_slug = _slugify(team.get("shortName") or team.get("name", ""))
                rows.append(
                    {
                        "team_slug": team_slug,
                        "league_slug": league_slug,
                        "season_name": season_name,
                        "position": entry.get("position"),
                        "played": entry.get("playedGames", 0),
                        "won": entry.get("won", 0),
                        "drawn": entry.get("draw", 0),
                        "lost": entry.get("lost", 0),
                        "goals_for": entry.get("goalsFor", 0),
                        "goals_against": entry.get("goalsAgainst", 0),
                        "goal_difference": entry.get("goalDifference", 0),
                        "points": entry.get("points", 0),
                        "extra_data": {"form": entry.get("form")},
                    }
                )

        self._log_fetch("standings", len(rows), league=code)
        return rows

    async def fetch_team_stats(self, team_id: str, season_id: str) -> dict:
        """
        Derive team stats from the standings table.

        football-data.org does not expose a dedicated team-stats endpoint on
        the free tier, so we pull the full standings and extract the row for
        this team.
        """
        raw_team_id = team_id.replace("fdorg_team_", "")
        # Try to determine the league from team info first
        data = await self._fetch_with_retry(self._get, f"/teams/{raw_team_id}")
        if not data:
            return {}

        team_slug = _slugify(data.get("shortName") or data.get("name", raw_team_id))

        # Find running competitions for this team
        for comp in data.get("runningCompetitions", []):
            code = comp.get("code")
            if code not in COMPETITION_META:
                continue
            standings = await self.fetch_standings(code, season_id)
            for row in standings:
                if row["team_slug"] == team_slug:
                    played = row["played"]
                    return {
                        "team_slug": team_slug,
                        "season_name": row["season_name"],
                        "matches_played": played,
                        "wins": row["won"],
                        "draws": row["drawn"],
                        "losses": row["lost"],
                        "goals_scored": row["goals_for"],
                        "goals_conceded": row["goals_against"],
                        "home_wins": None,
                        "away_wins": None,
                        "avg_goals_scored": round(row["goals_for"] / played, 2) if played else None,
                        "avg_goals_conceded": round(row["goals_against"] / played, 2) if played else None,
                        "extra_stats": row.get("extra_data"),
                    }

        self.log.warning("football_data_org_team_stats_not_found", team_id=team_id)
        return {}

    async def fetch_player_stats(self, player_id: str, season_id: str) -> dict:
        """Player stats are not available on the free tier; return empty."""
        self.log.debug(
            "football_data_org_player_stats_unavailable",
            player_id=player_id,
            note="Not available on free tier",
        )
        return {}

    async def fetch_injuries(self, team_id: str) -> list[dict]:
        """Injury data is not available via football-data.org."""
        return []

    async def fetch_odds_history(self, match_id: str) -> list[dict]:
        """Odds data is not available via football-data.org."""
        return []
