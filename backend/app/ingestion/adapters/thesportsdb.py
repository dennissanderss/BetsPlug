"""
TheSportsDB Adapter
===================
Fetches football data from TheSportsDB free tier (API key = "3").

Homepage : https://www.thesportsdb.com
API docs  : https://www.thesportsdb.com/api.php

Free tier notes
---------------
- Key "3" is the public free-tier key embedded in the URL path.
- Rate limits are not published but be courteous; adapter defaults to
  1 request per second.
- Some endpoints require a paid Patreon key (v2 / premium); this adapter
  uses only the v1/json/3 endpoints that are freely accessible.
- Known bug: league ID queries can occasionally return events from a
  different league. All fetched events are cross-checked against the
  expected ``strLeague`` value and discarded if they do not match.

Supported league IDs (TheSportsDB internal)
-------------------------------------------
4328  Premier League    England
4335  La Liga           Spain
4331  Bundesliga        Germany
4332  Serie A           Italy
4334  Ligue 1           France
4337  Eredivisie        Netherlands
4480  Champions League  Europe
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

BASE_URL = "https://www.thesportsdb.com/api/v1/json/3"

# Map internal league slugs → TheSportsDB league IDs
LEAGUE_SLUG_TO_ID: dict[str, str] = {
    "premier-league":    "4328",
    "la-liga":           "4335",
    "bundesliga":        "4331",
    "serie-a":           "4332",
    "ligue-1":           "4334",
    "eredivisie":        "4337",
    "champions-league":  "4480",
}

ID_TO_LEAGUE_SLUG: dict[str, str] = {v: k for k, v in LEAGUE_SLUG_TO_ID.items()}

LEAGUE_META: dict[str, dict] = {
    "4328": {"name": "Premier League",   "country": "England",     "tier": 1},
    "4335": {"name": "La Liga",          "country": "Spain",       "tier": 1},
    "4331": {"name": "Bundesliga",       "country": "Germany",     "tier": 1},
    "4332": {"name": "Serie A",          "country": "Italy",       "tier": 1},
    "4334": {"name": "Ligue 1",          "country": "France",      "tier": 1},
    "4337": {"name": "Eredivisie",       "country": "Netherlands", "tier": 1},
    "4480": {"name": "Champions League", "country": "Europe",      "tier": None},
}

# ---------------------------------------------------------------------------
# Known bug: TheSportsDB free-tier league ID queries sometimes return events
# that belong to a completely different league.  We cross-check the
# ``strLeague`` field returned with each event against the canonical name(s)
# we accept for every league ID.  Events that do not match are discarded and
# a warning is emitted.
#
# The mapping covers both the short display name used in LEAGUE_META and the
# full official name that TheSportsDB may return in ``strLeague``.
# ---------------------------------------------------------------------------
LEAGUE_ID_TO_EXPECTED_NAMES: dict[str, list[str]] = {
    "4328": ["English Premier League", "Premier League"],
    "4335": ["Spanish La Liga", "La Liga"],
    "4331": ["German Bundesliga", "Bundesliga"],
    "4332": ["Italian Serie A", "Serie A"],
    "4334": ["French Ligue 1", "Ligue 1"],
    "4337": ["Dutch Eredivisie", "Eredivisie"],
    "4480": ["UEFA Champions League", "Champions League"],
}


def _verify_league(events: list[dict], league_id: str, log: Any) -> list[dict]:
    """
    Guard against the TheSportsDB free-tier bug where a league ID query can
    return events that belong to a different league.

    Each event's ``strLeague`` field is compared (case-insensitively) against
    the canonical names registered for *league_id*.  Any event that does not
    match is dropped and a warning is logged.  If *all* events are discarded
    an additional warning is emitted to make the problem highly visible.

    Returns the filtered list (may be empty).
    """
    expected = LEAGUE_ID_TO_EXPECTED_NAMES.get(league_id)
    if not expected:
        # No mapping registered — pass through unchanged (unknown league)
        return events

    expected_lower = [name.lower() for name in expected]
    verified: list[dict] = []
    discarded: list[str] = []

    for event in events:
        actual = (event.get("strLeague") or "").strip()
        if actual.lower() in expected_lower:
            verified.append(event)
        else:
            discarded.append(actual or "<empty>")

    if discarded:
        log.warning(
            "thesportsdb_league_mismatch",
            league_id=league_id,
            expected=expected,
            discarded_league_names=list(set(discarded)),
            discarded_count=len(discarded),
        )

    if not verified and events:
        log.warning(
            "thesportsdb_league_all_events_discarded",
            league_id=league_id,
            total_fetched=len(events),
            message=(
                "All fetched events were discarded because strLeague did not "
                "match the expected league name. Returning empty list to avoid "
                "storing wrong data."
            ),
        )

    return verified


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def _parse_dt(date_str: str | None, time_str: str | None = None) -> str | None:
    """Build an ISO 8601 UTC datetime string from TheSportsDB date + time fields."""
    if not date_str:
        return None
    try:
        if time_str:
            combined = f"{date_str}T{time_str}"
        else:
            combined = f"{date_str}T00:00:00"
        dt = datetime.fromisoformat(combined)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()
    except ValueError:
        return date_str


def _map_status(raw: str | None) -> str:
    mapping = {
        "Not Started":    "scheduled",
        "In Progress":    "live",
        "Finished":       "finished",
        "Match Finished": "finished",
        "Postponed":      "postponed",
        "Cancelled":      "cancelled",
        "Awarded":        "finished",
        "Abandoned":      "cancelled",
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


def _safe_int(val: Any) -> int | None:
    try:
        return int(val) if val is not None and str(val).strip() != "" else None
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# Adapter
# ---------------------------------------------------------------------------

class TheSportsDBAdapter(DataSourceAdapter):
    """
    Adapter for TheSportsDB free-tier API (key=3).

    Config keys
    -----------
    leagues : list[str]
        Internal league slugs to sync (default: all supported).
    rate_limit_seconds : float
        Delay between requests (default: 1.0 s).
    """

    def __init__(self, config: dict, http_client: httpx.AsyncClient) -> None:
        super().__init__(config, http_client)
        self._rate_limit_seconds = float(self.config.get("rate_limit_seconds", 1.0))
        self._enabled_leagues: list[str] = self.config.get(
            "leagues", list(LEAGUE_SLUG_TO_ID.keys())
        )

    # ------------------------------------------------------------------
    # Internal HTTP helper
    # ------------------------------------------------------------------

    async def _get(self, path: str, params: dict | None = None) -> Any:
        url = f"{BASE_URL}{path}"
        self.log.debug("thesportsdb_request", url=url, params=params)
        await self.rate_limit()
        response = await self.http_client.get(url, params=params or {})
        response.raise_for_status()
        data = response.json()
        self.log.debug("thesportsdb_response", url=url, status=response.status_code)
        return data

    def _league_id(self, league_id: str) -> str | None:
        """Resolve slug or raw numeric ID to TheSportsDB league ID string."""
        if league_id in LEAGUE_META:
            return league_id
        return LEAGUE_SLUG_TO_ID.get(league_id)

    # ------------------------------------------------------------------
    # DataSourceAdapter interface
    # ------------------------------------------------------------------

    async def fetch_sports(self) -> list[dict]:
        """Fetch the Football sport (TSDB id=4)."""
        return [
            {
                "external_id": "tsdb_sport_football",
                "name": "Football",
                "slug": "football",
                "icon": "⚽",
            }
        ]

    async def fetch_leagues(self, sport_id: str) -> list[dict]:
        """Return supported league metadata."""
        leagues = []
        for lid, meta in LEAGUE_META.items():
            slug = ID_TO_LEAGUE_SLUG.get(lid, _slugify(meta["name"]))
            leagues.append(
                {
                    "external_id": f"tsdb_league_{lid}",
                    "sport_slug": "football",
                    "name": meta["name"],
                    "slug": slug,
                    "country": meta["country"],
                    "tier": meta["tier"],
                }
            )

        # Try to enrich from API
        try:
            data = await self._fetch_with_retry(
                self._get, "/all_leagues.php", {"s": "Soccer"}
            )
            api_leagues = (data or {}).get("leagues") or []
            known_ids = set(LEAGUE_META.keys())
            for league in api_leagues:
                lid = str(league.get("idLeague", ""))
                if lid not in known_ids:
                    continue  # only return leagues we know about
        except Exception as exc:  # noqa: BLE001
            self.log.debug("thesportsdb_leagues_enrich_failed", error=str(exc))

        self._log_fetch("leagues", len(leagues))
        return leagues

    async def fetch_teams(self, league_id: str) -> list[dict]:
        """Fetch all teams in a league."""
        lid = self._league_id(league_id)
        if not lid:
            self.log.warning("thesportsdb_unknown_league", league_id=league_id)
            return []

        league_slug = ID_TO_LEAGUE_SLUG.get(lid, league_id)
        try:
            data = await self._fetch_with_retry(
                self._get, "/lookup_all_teams.php", {"id": lid}
            )
        except Exception as exc:  # noqa: BLE001
            self.log.warning("thesportsdb_teams_fetch_failed", error=str(exc), league=lid)
            return []

        teams = []
        for t in (data or {}).get("teams") or []:
            name = t.get("strTeam", "")
            slug = _slugify(t.get("strTeamShort") or name)
            teams.append(
                {
                    "external_id": f"tsdb_team_{t.get('idTeam', slug)}",
                    "league_slug": league_slug,
                    "name": name,
                    "slug": slug,
                    "short_name": t.get("strTeamShort"),
                    "country": t.get("strCountry"),
                    "venue": t.get("strStadium"),
                    "logo_url": t.get("strTeamBadge"),
                }
            )

        self._log_fetch("teams", len(teams), league=lid)
        return teams

    async def fetch_players(self, team_id: str) -> list[dict]:
        """Fetch squad for a team."""
        raw_id = team_id.replace("tsdb_team_", "")
        try:
            data = await self._fetch_with_retry(
                self._get, "/lookup_all_players.php", {"id": raw_id}
            )
        except Exception as exc:  # noqa: BLE001
            self.log.warning("thesportsdb_players_fetch_failed", error=str(exc))
            return []

        players = []
        for p in (data or {}).get("player") or []:
            name = p.get("strPlayer", "")
            slug = _slugify(name) if name else f"player-{p.get('idPlayer')}"
            pos_raw = (p.get("strPosition") or "").lower()
            if "goalkeeper" in pos_raw:
                position = "GK"
            elif "defender" in pos_raw or "back" in pos_raw:
                position = "DEF"
            elif "midfielder" in pos_raw or "midfield" in pos_raw:
                position = "MID"
            elif "forward" in pos_raw or "striker" in pos_raw or "winger" in pos_raw:
                position = "FWD"
            else:
                position = p.get("strPosition")

            players.append(
                {
                    "external_id": f"tsdb_player_{p.get('idPlayer', slug)}",
                    "team_slug": _slugify(p.get("strTeam") or raw_id),
                    "name": name,
                    "slug": slug,
                    "position": position,
                    "nationality": p.get("strNationality"),
                    "date_of_birth": p.get("dateBorn"),
                    "jersey_number": _safe_int(p.get("strNumber")),
                    "photo_url": p.get("strThumb") or p.get("strCutout"),
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
        """
        Fetch upcoming and recent events for a league and filter by date window.

        TheSportsDB does not support arbitrary date-range queries on the free
        tier; we fetch past events + next events and combine them.
        """
        lid = self._league_id(league_id)
        if not lid:
            self.log.warning("thesportsdb_unknown_league", league_id=league_id)
            return []

        league_slug = ID_TO_LEAGUE_SLUG.get(lid, league_id)
        all_events: list[dict] = []

        # Fetch upcoming events
        try:
            data = await self._fetch_with_retry(
                self._get, "/eventsnextleague.php", {"id": lid}
            )
            all_events.extend((data or {}).get("events") or [])
        except Exception as exc:  # noqa: BLE001
            self.log.warning("thesportsdb_next_events_failed", error=str(exc), league=lid)

        # Fetch past events (last ~15 events)
        try:
            data = await self._fetch_with_retry(
                self._get, "/eventspastleague.php", {"id": lid}
            )
            all_events.extend((data or {}).get("events") or [])
        except Exception as exc:  # noqa: BLE001
            self.log.warning("thesportsdb_past_events_failed", error=str(exc), league=lid)

        # ── League verification ──────────────────────────────────────────────
        # TheSportsDB free tier has a known bug where a league ID query can
        # silently return events from a different league.  Discard any event
        # whose strLeague field does not match what we expect for this ID.
        all_events = _verify_league(all_events, lid, self.log)
        if not all_events:
            self._log_fetch("matches", 0, league=lid,
                            date_from=str(date_from), date_to=str(date_to))
            return []

        matches = []
        seen: set[str] = set()
        for e in all_events:
            event_id = str(e.get("idEvent", ""))
            if event_id in seen:
                continue
            seen.add(event_id)

            event_date_str = e.get("dateEvent", "")
            try:
                event_date = date.fromisoformat(event_date_str)
            except (ValueError, TypeError):
                continue

            if not (date_from <= event_date <= date_to):
                continue

            home_slug = _slugify(e.get("strHomeTeam") or "home")
            away_slug = _slugify(e.get("strAwayTeam") or "away")
            scheduled_at = _parse_dt(event_date_str, e.get("strTime"))

            matches.append(
                {
                    "external_id": f"tsdb_match_{event_id}",
                    "league_slug": league_slug,
                    "home_team_slug": home_slug,
                    "away_team_slug": away_slug,
                    "scheduled_at": scheduled_at,
                    "status": _map_status(e.get("strStatus")),
                    "venue": e.get("strVenue"),
                    "round_name": e.get("strRound"),
                    "matchday": _safe_int(e.get("intRound")),
                    "season_name": e.get("strSeason"),
                }
            )

        self._log_fetch("matches", len(matches), league=lid,
                        date_from=str(date_from), date_to=str(date_to))
        return matches

    async def _fetch_event(self, raw_id: str) -> dict | None:
        try:
            data = await self._fetch_with_retry(
                self._get, "/lookupevent.php", {"id": raw_id}
            )
            events = (data or {}).get("events") or []
            return events[0] if events else None
        except Exception as exc:  # noqa: BLE001
            self.log.warning("thesportsdb_event_fetch_failed", raw_id=raw_id, error=str(exc))
            return None

    async def fetch_results(self, match_ids: list[str]) -> list[dict]:
        """Fetch results for given match IDs."""
        results = []
        for match_id in match_ids:
            raw_id = match_id.replace("tsdb_match_", "")
            event = await self._fetch_event(raw_id)
            if not event:
                continue

            home_score = _safe_int(event.get("intHomeScore"))
            away_score = _safe_int(event.get("intAwayScore"))
            results.append(
                {
                    "external_match_id": match_id,
                    "home_score": home_score,
                    "away_score": away_score,
                    "home_score_ht": None,
                    "away_score_ht": None,
                    "winner": _winner(home_score, away_score),
                    "extra_data": {
                        "thumbnail": event.get("strThumb"),
                        "video": event.get("strVideo"),
                        "description": event.get("strDescriptionEN"),
                    },
                }
            )

        self._log_fetch("results", len(results))
        return results

    async def fetch_standings(self, league_id: str, season_id: str) -> list[dict]:
        """Fetch standings table for a league/season."""
        lid = self._league_id(league_id)
        if not lid:
            self.log.warning("thesportsdb_unknown_league", league_id=league_id)
            return []

        league_slug = ID_TO_LEAGUE_SLUG.get(lid, league_id)
        try:
            data = await self._fetch_with_retry(
                self._get, "/lookuptable.php", {"l": lid, "s": season_id}
            )
        except Exception as exc:  # noqa: BLE001
            self.log.warning("thesportsdb_standings_fetch_failed", error=str(exc), league=lid)
            return []

        rows = []
        for entry in (data or {}).get("table") or []:
            team_name = entry.get("strTeam", "")
            team_slug = _slugify(team_name)
            played = _safe_int(entry.get("intPlayed")) or 0
            won = _safe_int(entry.get("intWin")) or 0
            drawn = _safe_int(entry.get("intDraw")) or 0
            lost = _safe_int(entry.get("intLoss")) or 0
            gf = _safe_int(entry.get("intGoalsFor")) or 0
            ga = _safe_int(entry.get("intGoalsAgainst")) or 0
            rows.append(
                {
                    "team_slug": team_slug,
                    "league_slug": league_slug,
                    "season_name": season_id,
                    "position": _safe_int(entry.get("intRank")) or len(rows) + 1,
                    "played": played,
                    "won": won,
                    "drawn": drawn,
                    "lost": lost,
                    "goals_for": gf,
                    "goals_against": ga,
                    "goal_difference": gf - ga,
                    "points": _safe_int(entry.get("intPoints")) or 0,
                    "extra_data": {
                        "total_home": entry.get("intTotalHome"),
                        "total_away": entry.get("intTotalAway"),
                        "form": entry.get("strForm"),
                        "logo": entry.get("strTeamBadge"),
                    },
                }
            )

        self._log_fetch("standings", len(rows), league=lid, season=season_id)
        return rows

    async def fetch_team_stats(self, team_id: str, season_id: str) -> dict:
        """Derive team stats from the standings table."""
        raw_id = team_id.replace("tsdb_team_", "")
        # We need the league ID; check config or try all leagues
        league_id = self.config.get("default_league", "premier-league")
        standings = await self.fetch_standings(league_id, season_id)
        for row in standings:
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
                "home_wins": None,
                "away_wins": None,
                "avg_goals_scored": round(row["goals_for"] / played, 2) if played else None,
                "avg_goals_conceded": round(row["goals_against"] / played, 2) if played else None,
                "extra_stats": row.get("extra_data"),
            }
        return {}

    async def fetch_player_stats(self, player_id: str, season_id: str) -> dict:
        """Basic player stats lookup."""
        raw_id = player_id.replace("tsdb_player_", "")
        try:
            data = await self._fetch_with_retry(
                self._get, "/lookupplayer.php", {"id": raw_id}
            )
            players = (data or {}).get("players") or []
            if not players:
                return {}
            p = players[0]
            return {
                "player_slug": _slugify(p.get("strPlayer", raw_id)),
                "season_name": season_id,
                "appearances": None,
                "goals": None,
                "assists": None,
                "minutes_played": None,
                "stat_type": None,
                "extra_stats": {
                    "description": p.get("strDescriptionEN"),
                    "photo": p.get("strThumb"),
                },
            }
        except Exception as exc:  # noqa: BLE001
            self.log.warning("thesportsdb_player_stats_failed", error=str(exc))
            return {}

    async def fetch_injuries(self, team_id: str) -> list[dict]:
        """Not available via TheSportsDB free tier."""
        return []

    async def fetch_odds_history(self, match_id: str) -> list[dict]:
        """Not available via TheSportsDB."""
        return []

    # ------------------------------------------------------------------
    # Extra helpers (not part of base interface)
    # ------------------------------------------------------------------

    async def search_team(self, team_name: str) -> list[dict]:
        """Search for a team by name."""
        try:
            data = await self._fetch_with_retry(
                self._get, "/searchteams.php", {"t": team_name}
            )
            teams = (data or {}).get("teams") or []
            return [
                {
                    "external_id": f"tsdb_team_{t.get('idTeam')}",
                    "name": t.get("strTeam"),
                    "slug": _slugify(t.get("strTeam", "")),
                    "country": t.get("strCountry"),
                    "league": t.get("strLeague"),
                    "logo_url": t.get("strTeamBadge"),
                }
                for t in teams
            ]
        except Exception as exc:  # noqa: BLE001
            self.log.warning("thesportsdb_search_team_failed", error=str(exc))
            return []

    async def fetch_league_info(self, league_id: str) -> dict | None:
        """Fetch full league metadata."""
        lid = self._league_id(league_id)
        if not lid:
            return None
        try:
            data = await self._fetch_with_retry(
                self._get, "/lookupleague.php", {"id": lid}
            )
            leagues = (data or {}).get("leagues") or []
            return leagues[0] if leagues else None
        except Exception as exc:  # noqa: BLE001
            self.log.warning("thesportsdb_league_info_failed", error=str(exc))
            return None
