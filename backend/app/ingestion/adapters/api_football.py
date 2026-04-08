"""
API-Football Adapter
====================
Fetches LIVE football data from the API-Football v3 API (api-football.com).

Free tier: 100 requests/day, covers 900+ leagues worldwide.
Requires an API key set in the adapter config as ``api_key``.

Sign up free at: https://www.api-football.com/
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

BASE_URL = "https://v3.football.api-sports.io"

# Map internal league slugs → API-Football league IDs
LEAGUE_SLUG_TO_ID: dict[str, int] = {
    "premier-league": 39,
    "la-liga": 140,
    "bundesliga": 78,
    "serie-a": 135,
    "ligue-1": 61,
    "champions-league": 2,
    "eredivisie": 88,
    "primeira-liga": 94,
    "super-lig": 203,
    "jupiler-pro-league": 144,
}

ID_TO_LEAGUE_SLUG: dict[int, str] = {v: k for k, v in LEAGUE_SLUG_TO_ID.items()}

LEAGUE_META: dict[int, dict] = {
    39:  {"name": "Premier League",      "country": "England",     "tier": 1},
    140: {"name": "La Liga",             "country": "Spain",       "tier": 1},
    78:  {"name": "Bundesliga",          "country": "Germany",     "tier": 1},
    135: {"name": "Serie A",             "country": "Italy",       "tier": 1},
    61:  {"name": "Ligue 1",             "country": "France",      "tier": 1},
    2:   {"name": "Champions League",    "country": "Europe",      "tier": None},
    88:  {"name": "Eredivisie",          "country": "Netherlands", "tier": 1},
    94:  {"name": "Primeira Liga",       "country": "Portugal",    "tier": 1},
    203: {"name": "Super Lig",           "country": "Turkey",      "tier": 1},
    144: {"name": "Jupiler Pro League",  "country": "Belgium",     "tier": 1},
}

# Free tier: 100 requests/day → be conservative
FREE_TIER_RATE_LIMIT = 1.5  # seconds between requests


def _slugify(text: str) -> str:
    """Convert a name to a URL-safe slug."""
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
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()
    except ValueError:
        return dt_str


def _map_status(raw: str | None) -> str:
    """Map API-Football status short codes to internal status vocabulary."""
    mapping = {
        # Scheduled
        "TBD": "scheduled", "NS": "scheduled",
        # Live
        "1H": "live", "HT": "live", "2H": "live", "ET": "live",
        "BT": "live", "P": "live", "SUSP": "live", "INT": "live", "LIVE": "live",
        # Finished
        "FT": "finished", "AET": "finished", "PEN": "finished",
        "WO": "finished", "AWD": "finished",
        # Postponed / Cancelled
        "PST": "postponed", "CANC": "cancelled", "ABD": "cancelled",
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


def _current_season() -> int:
    """Return the current football season year (e.g. 2024 for 2024-2025)."""
    now = datetime.now(timezone.utc)
    return now.year if now.month >= 7 else now.year - 1


# ---------------------------------------------------------------------------
# Adapter
# ---------------------------------------------------------------------------

class APIFootballAdapter(DataSourceAdapter):
    """
    Adapter for the API-Football v3 REST API.

    Config keys
    -----------
    api_key : str
        Your API-Football API key (required).
    leagues : list[str]
        List of internal league slugs to sync (default: all supported).
    rate_limit_seconds : float
        Override the per-request delay (default: 1.5s).
    season : int
        Season year to fetch (default: current season).
    """

    def __init__(self, config: dict, http_client: httpx.AsyncClient) -> None:
        super().__init__(config, http_client)
        self._api_key: str = self.config.get("api_key", "")
        self._rate_limit_seconds = float(
            self.config.get("rate_limit_seconds", FREE_TIER_RATE_LIMIT)
        )
        self._enabled_leagues: list[str] = self.config.get(
            "leagues", list(LEAGUE_SLUG_TO_ID.keys())
        )
        self._season: int = int(self.config.get("season", _current_season()))
        self._requests_today: int = 0

    # ------------------------------------------------------------------
    # Internal HTTP helper
    # ------------------------------------------------------------------

    async def _get(self, endpoint: str, params: dict | None = None) -> Any:
        """Perform a GET request against the API-Football API."""
        url = f"{BASE_URL}/{endpoint}"
        headers = {
            "x-apisports-key": self._api_key,
        }

        self.log.debug("api_football_request", url=url, params=params)
        await self.rate_limit()

        response = await self.http_client.get(url, headers=headers, params=params or {})
        self._requests_today += 1

        if response.status_code == 429:
            self.log.warning("api_football_rate_limited", url=url,
                             requests_today=self._requests_today)
            await asyncio.sleep(60)
            response = await self.http_client.get(url, headers=headers, params=params or {})
            self._requests_today += 1

        if response.status_code in (401, 403):
            self.log.error("api_football_auth_error", url=url,
                           status=response.status_code)
            raise PermissionError("API-Football: Invalid or missing API key.")

        response.raise_for_status()
        data = response.json()

        # API-Football wraps all responses in {"get": ..., "response": [...]}
        errors = data.get("errors", {})
        if errors:
            self.log.warning("api_football_api_error", url=url, errors=errors)

        self.log.debug("api_football_response", url=url,
                       results=data.get("results", 0),
                       requests_today=self._requests_today)
        return data.get("response", [])

    def _league_id(self, league_slug: str) -> int | None:
        """Resolve a league slug to an API-Football league ID."""
        return LEAGUE_SLUG_TO_ID.get(league_slug)

    # ------------------------------------------------------------------
    # DataSourceAdapter interface
    # ------------------------------------------------------------------

    async def fetch_sports(self) -> list[dict]:
        """Return the Football sport entity."""
        return [
            {
                "external_id": "apifb_sport_football",
                "name": "Football",
                "slug": "football",
                "icon": "⚽",
            }
        ]

    async def fetch_leagues(self, sport_id: str) -> list[dict]:
        """Return all supported competitions."""
        leagues = []
        for league_id, meta in LEAGUE_META.items():
            slug = ID_TO_LEAGUE_SLUG.get(league_id, _slugify(meta["name"]))
            leagues.append(
                {
                    "external_id": f"apifb_league_{league_id}",
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
        api_id = self._league_id(league_id)
        if not api_id:
            self.log.warning("api_football_unknown_league", league_id=league_id)
            return []

        data = await self._fetch_with_retry(
            self._get, "teams", {"league": api_id, "season": self._season}
        )
        if not data:
            return []

        teams = []
        for item in data:
            team = item.get("team", {})
            venue = item.get("venue", {})
            slug = _slugify(team.get("name", str(team.get("id"))))
            teams.append(
                {
                    "external_id": f"apifb_team_{team['id']}",
                    "league_slug": league_id,
                    "name": team.get("name", ""),
                    "slug": slug,
                    "short_name": team.get("code"),
                    "country": team.get("country"),
                    "venue": venue.get("name"),
                    "logo_url": team.get("logo"),
                }
            )

        self._log_fetch("teams", len(teams), league=league_id)
        return teams

    async def fetch_players(self, team_id: str) -> list[dict]:
        """Fetch squad for a team."""
        raw_id = team_id.replace("apifb_team_", "")
        data = await self._fetch_with_retry(
            self._get, "players/squads", {"team": raw_id}
        )
        if not data:
            return []

        players = []
        for squad_item in data:
            for p in squad_item.get("players", []):
                name = p.get("name", "")
                slug = _slugify(name) if name else f"player-{p.get('id', 'unknown')}"
                pos_map = {
                    "Goalkeeper": "GK", "Defender": "DEF",
                    "Midfielder": "MID", "Attacker": "FWD",
                }
                position = pos_map.get(p.get("position", ""), p.get("position"))
                players.append(
                    {
                        "external_id": f"apifb_player_{p['id']}",
                        "team_slug": _slugify(squad_item.get("team", {}).get("name", raw_id)),
                        "name": name,
                        "slug": slug,
                        "position": position,
                        "nationality": None,
                        "date_of_birth": None,
                        "jersey_number": p.get("number"),
                        "photo_url": p.get("photo"),
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
        api_id = self._league_id(league_id)
        if not api_id:
            self.log.warning("api_football_unknown_league", league_id=league_id)
            return []

        params = {
            "league": api_id,
            "season": self._season,
            "from": date_from.isoformat(),
            "to": date_to.isoformat(),
        }
        data = await self._fetch_with_retry(self._get, "fixtures", params)
        if not data:
            return []

        matches = []
        for item in data:
            fixture = item.get("fixture", {})
            teams = item.get("teams", {})
            league_info = item.get("league", {})

            home = teams.get("home", {})
            away = teams.get("away", {})
            home_slug = _slugify(home.get("name", "home"))
            away_slug = _slugify(away.get("name", "away"))

            season_year = league_info.get("season", self._season)
            season_name = f"{season_year}-{season_year + 1}"

            matches.append(
                {
                    "external_id": f"apifb_match_{fixture['id']}",
                    "league_slug": league_id,
                    "home_team_slug": home_slug,
                    "away_team_slug": away_slug,
                    "scheduled_at": _parse_iso(fixture.get("date")),
                    "status": _map_status(fixture.get("status", {}).get("short")),
                    "venue": (fixture.get("venue") or {}).get("name"),
                    "round_name": league_info.get("round"),
                    "matchday": None,
                    "season_name": season_name,
                }
            )

        self._log_fetch("matches", len(matches), league=league_id,
                        date_from=str(date_from), date_to=str(date_to))
        return matches

    async def fetch_results(self, match_ids: list[str]) -> list[dict]:
        """Fetch results for finished matches."""
        results = []
        for match_id in match_ids:
            raw_id = match_id.replace("apifb_match_", "")
            try:
                data = await self._fetch_with_retry(
                    self._get, "fixtures", {"id": raw_id}
                )
                if not data:
                    continue

                item = data[0]
                goals = item.get("goals", {})
                score = item.get("score", {})
                ht = score.get("halftime", {})
                ft = score.get("fulltime", {})

                home_score = ft.get("home") if ft.get("home") is not None else goals.get("home")
                away_score = ft.get("away") if ft.get("away") is not None else goals.get("away")

                results.append(
                    {
                        "external_match_id": match_id,
                        "home_score": home_score,
                        "away_score": away_score,
                        "home_score_ht": ht.get("home"),
                        "away_score_ht": ht.get("away"),
                        "winner": _winner(home_score, away_score),
                        "extra_data": {
                            "extratime": score.get("extratime"),
                            "penalty": score.get("penalty"),
                        },
                    }
                )
            except Exception as exc:
                self.log.warning(
                    "api_football_result_fetch_failed",
                    match_id=match_id,
                    error=str(exc),
                )

        self._log_fetch("results", len(results))
        return results

    async def fetch_standings(self, league_id: str, season_id: str) -> list[dict]:
        """Fetch current league standings."""
        api_id = self._league_id(league_id)
        if not api_id:
            self.log.warning("api_football_unknown_league", league_id=league_id)
            return []

        data = await self._fetch_with_retry(
            self._get, "standings", {"league": api_id, "season": self._season}
        )
        if not data:
            return []

        rows = []
        league_slug = league_id
        for league_data in data:
            for standing_group in league_data.get("league", {}).get("standings", []):
                for entry in standing_group:
                    team = entry.get("team", {})
                    team_slug = _slugify(team.get("name", ""))
                    all_stats = entry.get("all", {})
                    rows.append(
                        {
                            "team_slug": team_slug,
                            "league_slug": league_slug,
                            "season_name": season_id,
                            "position": entry.get("rank"),
                            "played": all_stats.get("played", 0),
                            "won": all_stats.get("win", 0),
                            "drawn": all_stats.get("draw", 0),
                            "lost": all_stats.get("lose", 0),
                            "goals_for": all_stats.get("goals", {}).get("for", 0),
                            "goals_against": all_stats.get("goals", {}).get("against", 0),
                            "goal_difference": entry.get("goalsDiff", 0),
                            "points": entry.get("points", 0),
                            "extra_data": {
                                "form": entry.get("form"),
                                "description": entry.get("description"),
                            },
                        }
                    )

        self._log_fetch("standings", len(rows), league=league_id)
        return rows

    async def fetch_team_stats(self, team_id: str, season_id: str) -> dict:
        """Fetch detailed team statistics."""
        raw_id = team_id.replace("apifb_team_", "")

        # Find the league for this team
        for slug, api_id in LEAGUE_SLUG_TO_ID.items():
            data = await self._fetch_with_retry(
                self._get, "teams/statistics",
                {"team": raw_id, "league": api_id, "season": self._season}
            )
            if not data:
                continue

            team_info = data.get("team", {})
            fixtures = data.get("fixtures", {})
            goals_for = data.get("goals", {}).get("for", {})
            goals_against = data.get("goals", {}).get("against", {})

            played = (fixtures.get("played") or {}).get("total", 0)
            wins_total = (fixtures.get("wins") or {}).get("total", 0)
            draws_total = (fixtures.get("draws") or {}).get("total", 0)
            losses_total = (fixtures.get("losses") or {}).get("total", 0)
            scored = (goals_for.get("total") or {}).get("total", 0)
            conceded = (goals_against.get("total") or {}).get("total", 0)

            return {
                "team_slug": _slugify(team_info.get("name", raw_id)),
                "season_name": season_id,
                "matches_played": played,
                "wins": wins_total,
                "draws": draws_total,
                "losses": losses_total,
                "goals_scored": scored,
                "goals_conceded": conceded,
                "home_wins": (fixtures.get("wins") or {}).get("home"),
                "away_wins": (fixtures.get("wins") or {}).get("away"),
                "avg_goals_scored": round(scored / played, 2) if played else None,
                "avg_goals_conceded": round(conceded / played, 2) if played else None,
                "extra_stats": {
                    "clean_sheets": data.get("clean_sheet", {}).get("total"),
                    "failed_to_score": data.get("failed_to_score", {}).get("total"),
                    "biggest_win_home": data.get("biggest", {}).get("wins", {}).get("home"),
                    "biggest_win_away": data.get("biggest", {}).get("wins", {}).get("away"),
                    "biggest_streak_wins": data.get("biggest", {}).get("streak", {}).get("wins"),
                },
            }

        self.log.warning("api_football_team_stats_not_found", team_id=team_id)
        return {}

    async def fetch_player_stats(self, player_id: str, season_id: str) -> dict:
        """Fetch player statistics for a season."""
        raw_id = player_id.replace("apifb_player_", "")
        data = await self._fetch_with_retry(
            self._get, "players", {"id": raw_id, "season": self._season}
        )
        if not data:
            return {}

        player = data[0]
        info = player.get("player", {})
        # Sum stats across all competitions
        total_apps = 0
        total_goals = 0
        total_assists = 0
        total_minutes = 0
        for stat in player.get("statistics", []):
            games = stat.get("games", {})
            goal_data = stat.get("goals", {})
            total_apps += games.get("appearences") or 0
            total_goals += goal_data.get("total") or 0
            total_assists += goal_data.get("assists") or 0
            total_minutes += games.get("minutes") or 0

        return {
            "player_slug": _slugify(info.get("name", raw_id)),
            "season_name": season_id,
            "appearances": total_apps,
            "goals": total_goals,
            "assists": total_assists,
            "minutes_played": total_minutes,
            "stat_type": "season_total",
            "extra_stats": {
                "nationality": info.get("nationality"),
                "age": info.get("age"),
                "height": info.get("height"),
                "weight": info.get("weight"),
            },
        }

    async def fetch_injuries(self, team_id: str) -> list[dict]:
        """Fetch current injuries for a team."""
        raw_id = team_id.replace("apifb_team_", "")
        data = await self._fetch_with_retry(
            self._get, "injuries", {"team": raw_id, "season": self._season}
        )
        if not data:
            return []

        injuries = []
        for item in data:
            player = item.get("player", {})
            team = item.get("team", {})
            injury = item.get("fixture", {})
            injuries.append(
                {
                    "player_slug": _slugify(player.get("name", "")),
                    "team_slug": _slugify(team.get("name", "")),
                    "injury_type": player.get("type", "Unknown"),
                    "severity": None,
                    "start_date": _parse_iso(injury.get("date")),
                    "expected_return": None,
                    "status": "active",
                }
            )

        self._log_fetch("injuries", len(injuries), team_id=raw_id)
        return injuries

    async def fetch_odds_history(self, match_id: str) -> list[dict]:
        """Fetch odds for a match."""
        raw_id = match_id.replace("apifb_match_", "")
        data = await self._fetch_with_retry(
            self._get, "odds", {"fixture": raw_id}
        )
        if not data:
            return []

        odds_list = []
        for item in data:
            for bookmaker in item.get("bookmakers", []):
                bk_name = bookmaker.get("name", "unknown")
                for bet in bookmaker.get("bets", []):
                    if bet.get("name") != "Match Winner":
                        continue
                    values = {v["value"]: float(v["odd"]) for v in bet.get("values", [])}
                    odds_list.append(
                        {
                            "external_match_id": match_id,
                            "source": bk_name,
                            "market": "1x2",
                            "home_odds": values.get("Home"),
                            "draw_odds": values.get("Draw"),
                            "away_odds": values.get("Away"),
                            "recorded_at": datetime.now(timezone.utc).isoformat(),
                        }
                    )

        self._log_fetch("odds", len(odds_list), match_id=raw_id)
        return odds_list
