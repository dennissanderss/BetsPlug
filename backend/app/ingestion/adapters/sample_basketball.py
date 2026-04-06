"""
Sample Basketball Adapter
=========================
A concrete ``DataSourceAdapter`` that returns realistic, hard-coded seed data
for the NBA (2025-26 season).

This adapter mirrors the structure of ``SampleFootballAdapter`` for basketball,
providing 6 teams, 15 sample matches with results, and current standings.

Statistics follow NBA conventions:
  - Scores in the 90-130 PPG range
  - Extra data carries points, rebounds, assists per match
  - Standings use wins/losses (no draws in basketball)
"""
from __future__ import annotations

from datetime import date, datetime, timezone, timedelta
from typing import Any

import httpx

from app.ingestion.base_adapter import DataSourceAdapter


# ---------------------------------------------------------------------------
# Static seed data
# ---------------------------------------------------------------------------

_SPORTS: list[dict] = [
    {
        "external_id": "sport_basketball",
        "name": "Basketball",
        "slug": "basketball",
        "icon": "🏀",
    },
]

_LEAGUES: list[dict] = [
    {
        "external_id": "league_nba",
        "sport_slug": "basketball",
        "name": "NBA",
        "slug": "nba",
        "country": "USA",
        "tier": 1,
    },
]

_TEAMS: dict[str, list[dict]] = {
    "nba": [
        {
            "external_id": "team_lakers",
            "league_slug": "nba",
            "name": "Los Angeles Lakers",
            "slug": "la-lakers",
            "short_name": "LAL",
            "country": "USA",
            "venue": "Crypto.com Arena",
            "logo_url": None,
        },
        {
            "external_id": "team_celtics",
            "league_slug": "nba",
            "name": "Boston Celtics",
            "slug": "boston-celtics",
            "short_name": "BOS",
            "country": "USA",
            "venue": "TD Garden",
            "logo_url": None,
        },
        {
            "external_id": "team_warriors",
            "league_slug": "nba",
            "name": "Golden State Warriors",
            "slug": "golden-state-warriors",
            "short_name": "GSW",
            "country": "USA",
            "venue": "Chase Center",
            "logo_url": None,
        },
        {
            "external_id": "team_heat",
            "league_slug": "nba",
            "name": "Miami Heat",
            "slug": "miami-heat",
            "short_name": "MIA",
            "country": "USA",
            "venue": "Kaseya Center",
            "logo_url": None,
        },
        {
            "external_id": "team_nuggets",
            "league_slug": "nba",
            "name": "Denver Nuggets",
            "slug": "denver-nuggets",
            "short_name": "DEN",
            "country": "USA",
            "venue": "Ball Arena",
            "logo_url": None,
        },
        {
            "external_id": "team_bucks",
            "league_slug": "nba",
            "name": "Milwaukee Bucks",
            "slug": "milwaukee-bucks",
            "short_name": "MIL",
            "country": "USA",
            "venue": "Fiserv Forum",
            "logo_url": None,
        },
    ],
}

_PLAYERS: dict[str, list[dict]] = {
    "la-lakers": [
        {"external_id": "pl_lebron", "team_slug": "la-lakers", "name": "LeBron James", "slug": "lebron-james", "position": "SF", "nationality": "American", "date_of_birth": "1984-12-30", "jersey_number": 23, "photo_url": None},
        {"external_id": "pl_ad", "team_slug": "la-lakers", "name": "Anthony Davis", "slug": "anthony-davis", "position": "PF/C", "nationality": "American", "date_of_birth": "1993-03-11", "jersey_number": 3, "photo_url": None},
        {"external_id": "pl_reaves", "team_slug": "la-lakers", "name": "Austin Reaves", "slug": "austin-reaves", "position": "SG", "nationality": "American", "date_of_birth": "1998-05-29", "jersey_number": 15, "photo_url": None},
    ],
    "boston-celtics": [
        {"external_id": "pl_tatum", "team_slug": "boston-celtics", "name": "Jayson Tatum", "slug": "jayson-tatum", "position": "SF", "nationality": "American", "date_of_birth": "1998-03-03", "jersey_number": 0, "photo_url": None},
        {"external_id": "pl_brown_jl", "team_slug": "boston-celtics", "name": "Jaylen Brown", "slug": "jaylen-brown", "position": "SG", "nationality": "American", "date_of_birth": "1996-10-24", "jersey_number": 7, "photo_url": None},
        {"external_id": "pl_holiday", "team_slug": "boston-celtics", "name": "Jrue Holiday", "slug": "jrue-holiday", "position": "PG", "nationality": "American", "date_of_birth": "1990-06-12", "jersey_number": 4, "photo_url": None},
    ],
    "golden-state-warriors": [
        {"external_id": "pl_curry", "team_slug": "golden-state-warriors", "name": "Stephen Curry", "slug": "stephen-curry", "position": "PG", "nationality": "American", "date_of_birth": "1988-03-14", "jersey_number": 30, "photo_url": None},
        {"external_id": "pl_green_d", "team_slug": "golden-state-warriors", "name": "Draymond Green", "slug": "draymond-green", "position": "PF", "nationality": "American", "date_of_birth": "1990-03-04", "jersey_number": 23, "photo_url": None},
        {"external_id": "pl_thompson", "team_slug": "golden-state-warriors", "name": "Klay Thompson", "slug": "klay-thompson", "position": "SG", "nationality": "American", "date_of_birth": "1990-02-08", "jersey_number": 11, "photo_url": None},
    ],
    "miami-heat": [
        {"external_id": "pl_butler", "team_slug": "miami-heat", "name": "Jimmy Butler", "slug": "jimmy-butler", "position": "SF", "nationality": "American", "date_of_birth": "1989-09-14", "jersey_number": 22, "photo_url": None},
        {"external_id": "pl_adebayo", "team_slug": "miami-heat", "name": "Bam Adebayo", "slug": "bam-adebayo", "position": "C", "nationality": "American", "date_of_birth": "1997-07-18", "jersey_number": 13, "photo_url": None},
        {"external_id": "pl_herro", "team_slug": "miami-heat", "name": "Tyler Herro", "slug": "tyler-herro", "position": "SG", "nationality": "American", "date_of_birth": "2000-01-20", "jersey_number": 14, "photo_url": None},
    ],
    "denver-nuggets": [
        {"external_id": "pl_jokic", "team_slug": "denver-nuggets", "name": "Nikola Jokić", "slug": "nikola-jokic", "position": "C", "nationality": "Serbian", "date_of_birth": "1995-02-19", "jersey_number": 15, "photo_url": None},
        {"external_id": "pl_murray", "team_slug": "denver-nuggets", "name": "Jamal Murray", "slug": "jamal-murray", "position": "PG", "nationality": "Canadian", "date_of_birth": "1997-02-23", "jersey_number": 27, "photo_url": None},
        {"external_id": "pl_mpj", "team_slug": "denver-nuggets", "name": "Michael Porter Jr.", "slug": "michael-porter-jr", "position": "SF", "nationality": "American", "date_of_birth": "1998-06-29", "jersey_number": 1, "photo_url": None},
    ],
    "milwaukee-bucks": [
        {"external_id": "pl_giannis", "team_slug": "milwaukee-bucks", "name": "Giannis Antetokounmpo", "slug": "giannis-antetokounmpo", "position": "PF", "nationality": "Greek", "date_of_birth": "1994-12-06", "jersey_number": 34, "photo_url": None},
        {"external_id": "pl_lillard", "team_slug": "milwaukee-bucks", "name": "Damian Lillard", "slug": "damian-lillard", "position": "PG", "nationality": "American", "date_of_birth": "1990-07-15", "jersey_number": 0, "photo_url": None},
        {"external_id": "pl_middleton", "team_slug": "milwaukee-bucks", "name": "Khris Middleton", "slug": "khris-middleton", "position": "SF", "nationality": "American", "date_of_birth": "1991-08-12", "jersey_number": 22, "photo_url": None},
    ],
}

_BASE_DATE = datetime(2025, 10, 22, 19, 30, 0, tzinfo=timezone.utc)


def _ko(days: int, hour: int = 19) -> str:
    dt = _BASE_DATE + timedelta(days=days)
    return dt.replace(hour=hour).isoformat()


# (ext_id, league, home, away, days_offset, game_number, status)
_MATCHES_RAW: list[tuple] = [
    ("match_nba_001", "nba", "boston-celtics",        "la-lakers",             0,  1,  "finished"),
    ("match_nba_002", "nba", "denver-nuggets",        "golden-state-warriors", 0,  1,  "finished"),
    ("match_nba_003", "nba", "milwaukee-bucks",       "miami-heat",            1,  1,  "finished"),
    ("match_nba_004", "nba", "la-lakers",             "denver-nuggets",        3,  2,  "finished"),
    ("match_nba_005", "nba", "golden-state-warriors", "boston-celtics",        4,  2,  "finished"),
    ("match_nba_006", "nba", "miami-heat",            "milwaukee-bucks",       4,  2,  "finished"),
    ("match_nba_007", "nba", "boston-celtics",        "denver-nuggets",        7,  3,  "finished"),
    ("match_nba_008", "nba", "la-lakers",             "miami-heat",            8,  3,  "finished"),
    ("match_nba_009", "nba", "golden-state-warriors", "milwaukee-bucks",       11, 4,  "finished"),
    ("match_nba_010", "nba", "denver-nuggets",        "boston-celtics",        14, 5,  "finished"),
    ("match_nba_011", "nba", "milwaukee-bucks",       "la-lakers",             15, 5,  "finished"),
    ("match_nba_012", "nba", "miami-heat",            "golden-state-warriors", 18, 6,  "finished"),
    ("match_nba_013", "nba", "boston-celtics",        "milwaukee-bucks",       140, 50, "scheduled"),
    ("match_nba_014", "nba", "denver-nuggets",        "miami-heat",            141, 50, "scheduled"),
    ("match_nba_015", "nba", "la-lakers",             "golden-state-warriors", 142, 51, "scheduled"),
]

_MATCHES: list[dict] = [
    {
        "external_id": r[0],
        "league_slug": r[1],
        "home_team_slug": r[2],
        "away_team_slug": r[3],
        "scheduled_at": _ko(r[4]),
        "status": r[6],
        "venue": None,
        "round_name": f"Game {r[5]}",
        "matchday": r[5],
        "season_name": "2025-2026",
    }
    for r in _MATCHES_RAW
]

# (ext_match_id, home_pts, away_pts, winner, extra)
_RESULTS_RAW: list[tuple] = [
    ("match_nba_001", 112, 108, "home", {"home_rebounds": 44, "away_rebounds": 41, "home_assists": 28, "away_assists": 24, "home_3pt": 14, "away_3pt": 11}),
    ("match_nba_002", 118, 124, "away", {"home_rebounds": 40, "away_rebounds": 43, "home_assists": 26, "away_assists": 32, "home_3pt": 10, "away_3pt": 18}),
    ("match_nba_003", 109, 101, "home", {"home_rebounds": 46, "away_rebounds": 38, "home_assists": 22, "away_assists": 20, "home_3pt": 9,  "away_3pt": 8}),
    ("match_nba_004", 105, 115, "away", {"home_rebounds": 39, "away_rebounds": 50, "home_assists": 21, "away_assists": 30, "home_3pt": 8,  "away_3pt": 13}),
    ("match_nba_005", 131, 122, "home", {"home_rebounds": 38, "away_rebounds": 42, "home_assists": 35, "away_assists": 27, "home_3pt": 21, "away_3pt": 15}),
    ("match_nba_006", 97,  113, "away", {"home_rebounds": 37, "away_rebounds": 48, "home_assists": 19, "away_assists": 29, "home_3pt": 7,  "away_3pt": 11}),
    ("match_nba_007", 119, 106, "home", {"home_rebounds": 45, "away_rebounds": 40, "home_assists": 29, "away_assists": 23, "home_3pt": 16, "away_3pt": 10}),
    ("match_nba_008", 123, 117, "home", {"home_rebounds": 41, "away_rebounds": 39, "home_assists": 27, "away_assists": 22, "home_3pt": 12, "away_3pt": 9}),
    ("match_nba_009", 127, 121, "home", {"home_rebounds": 36, "away_rebounds": 44, "home_assists": 31, "away_assists": 26, "home_3pt": 19, "away_3pt": 14}),
    ("match_nba_010", 110, 116, "away", {"home_rebounds": 43, "away_rebounds": 46, "home_assists": 25, "away_assists": 31, "home_3pt": 11, "away_3pt": 17}),
    ("match_nba_011", 108, 102, "home", {"home_rebounds": 47, "away_rebounds": 37, "home_assists": 24, "away_assists": 20, "home_3pt": 10, "away_3pt": 8}),
    ("match_nba_012", 114, 128, "away", {"home_rebounds": 35, "away_rebounds": 40, "home_assists": 23, "away_assists": 34, "home_3pt": 9,  "away_3pt": 20}),
]

_RESULTS: dict[str, dict] = {
    r[0]: {
        "external_match_id": r[0],
        "home_score": r[1],
        "away_score": r[2],
        "home_score_ht": None,   # NBA uses quarters; halftime optional
        "away_score_ht": None,
        "winner": r[3],
        "extra_data": r[4],
    }
    for r in _RESULTS_RAW
}

# Standings: (team_slug, league_slug, season_name, pos, P, W, D, L, PF, PA, PD, pts, streak)
# In basketball draws are impossible; D always 0; pts = wins (typical NBA convention)
_STANDINGS_RAW: list[tuple] = [
    ("boston-celtics",        "nba", "2025-2026", 1, 62, 46, 0, 16, 7209, 6740,  469, 46, "W5"),
    ("denver-nuggets",        "nba", "2025-2026", 2, 62, 43, 0, 19, 7143, 6810,  333, 43, "W3"),
    ("golden-state-warriors", "nba", "2025-2026", 3, 62, 40, 0, 22, 7052, 6901,  151, 40, "W2"),
    ("milwaukee-bucks",       "nba", "2025-2026", 4, 62, 38, 0, 24, 6988, 6950,   38, 38, "L1"),
    ("la-lakers",             "nba", "2025-2026", 5, 62, 35, 0, 27, 6895, 6987,  -92, 35, "W1"),
    ("miami-heat",            "nba", "2025-2026", 6, 62, 28, 0, 34, 6734, 7102, -368, 28, "L3"),
]

_STANDINGS: dict[str, list[dict]] = {
    "nba": [
        {
            "team_slug": r[0],
            "league_slug": r[1],
            "season_name": r[2],
            "position": r[3],
            "played": r[4],
            "won": r[5],
            "drawn": r[6],
            "lost": r[7],
            "goals_for": r[8],       # points scored (reusing football schema field)
            "goals_against": r[9],   # points allowed
            "goal_difference": r[10],
            "points": r[11],         # wins count as "points" in NBA context
            "extra_data": {"streak": r[12]},
        }
        for r in _STANDINGS_RAW
    ],
}

_INJURIES: dict[str, list[dict]] = {
    "la-lakers": [
        {
            "player_slug": "lebron-james",
            "team_slug": "la-lakers",
            "injury_type": "Left ankle soreness",
            "severity": "minor",
            "start_date": "2026-03-10",
            "expected_return": "2026-03-20",
            "status": "active",
        },
    ],
    "golden-state-warriors": [
        {
            "player_slug": "klay-thompson",
            "team_slug": "golden-state-warriors",
            "injury_type": "Right knee inflammation",
            "severity": "moderate",
            "start_date": "2026-02-01",
            "expected_return": "2026-03-15",
            "status": "recovered",
        },
    ],
    "milwaukee-bucks": [
        {
            "player_slug": "damian-lillard",
            "team_slug": "milwaukee-bucks",
            "injury_type": "Achilles tendinopathy",
            "severity": "moderate",
            "start_date": "2026-01-20",
            "expected_return": "2026-04-01",
            "status": "active",
        },
    ],
}

# Odds for first 6 finished NBA matches
_ODDS_HISTORY: dict[str, list[dict]] = {}
_base_ts = _BASE_DATE + timedelta(days=1)
for _row in _RESULTS_RAW[:6]:
    _mid = _row[0]
    _ODDS_HISTORY[_mid] = [
        {
            "external_match_id": _mid,
            "source": "DraftKings",
            "market": "moneyline",
            "home_odds": 1.95,
            "draw_odds": None,
            "away_odds": 1.95,
            "recorded_at": (_base_ts - timedelta(days=2)).isoformat(),
        },
        {
            "external_match_id": _mid,
            "source": "FanDuel",
            "market": "moneyline",
            "home_odds": round(1.90 + (_row[1] / 1000), 2),
            "draw_odds": None,
            "away_odds": round(2.00 - (_row[2] / 1000), 2),
            "recorded_at": (_base_ts - timedelta(hours=2)).isoformat(),
        },
    ]
    _base_ts += timedelta(days=3)


class SampleBasketballAdapter(DataSourceAdapter):
    """
    Concrete adapter that returns hard-coded NBA seed data.

    Mirrors ``SampleFootballAdapter`` in structure; no HTTP calls are made.
    """

    def __init__(self, config: dict, http_client: httpx.AsyncClient) -> None:
        super().__init__(config, http_client)
        self._rate_limit_seconds = 0.0

    async def fetch_sports(self) -> list[dict]:
        await self.rate_limit()
        result = list(_SPORTS)
        self._log_fetch("sports", len(result))
        return result

    async def fetch_leagues(self, sport_id: str) -> list[dict]:
        await self.rate_limit()
        result = [
            lg for lg in _LEAGUES
            if lg["sport_slug"] == sport_id or sport_id == "basketball"
        ]
        self._log_fetch("leagues", len(result), sport_id=sport_id)
        return result

    async def fetch_teams(self, league_id: str) -> list[dict]:
        await self.rate_limit()
        result = _TEAMS.get(league_id, [])
        self._log_fetch("teams", len(result), league_id=league_id)
        return result

    async def fetch_players(self, team_id: str) -> list[dict]:
        await self.rate_limit()
        result = _PLAYERS.get(team_id, [])
        self._log_fetch("players", len(result), team_id=team_id)
        return result

    async def fetch_matches(
        self,
        league_id: str,
        date_from: date,
        date_to: date,
    ) -> list[dict]:
        await self.rate_limit()
        result = [
            m for m in _MATCHES
            if m["league_slug"] == league_id
            and date_from
            <= datetime.fromisoformat(m["scheduled_at"]).date()
            <= date_to
        ]
        self._log_fetch("matches", len(result), league_id=league_id)
        return result

    async def fetch_results(self, match_ids: list[str]) -> list[dict]:
        await self.rate_limit()
        result = [_RESULTS[mid] for mid in match_ids if mid in _RESULTS]
        self._log_fetch("results", len(result))
        return result

    async def fetch_standings(self, league_id: str, season_id: str) -> list[dict]:
        await self.rate_limit()
        result = _STANDINGS.get(league_id, [])
        self._log_fetch("standings", len(result), league_id=league_id)
        return result

    async def fetch_team_stats(self, team_id: str, season_id: str) -> dict:
        await self.rate_limit()
        all_standings = [
            row
            for rows in _STANDINGS.values()
            for row in rows
            if row["team_slug"] == team_id
        ]
        if not all_standings:
            return {}
        s = all_standings[0]
        avg_scored = round(s["goals_for"] / s["played"], 1) if s["played"] else None
        avg_conceded = round(s["goals_against"] / s["played"], 1) if s["played"] else None
        stats = {
            "team_slug": team_id,
            "season_name": s["season_name"],
            "matches_played": s["played"],
            "wins": s["won"],
            "draws": 0,
            "losses": s["lost"],
            "goals_scored": s["goals_for"],
            "goals_conceded": s["goals_against"],
            "home_wins": round(s["won"] * 0.58),
            "away_wins": round(s["won"] * 0.42),
            "avg_goals_scored": avg_scored,
            "avg_goals_conceded": avg_conceded,
            "extra_stats": {"streak": s["extra_data"].get("streak", "")},
        }
        self._log_fetch("team_stats", 1, team_id=team_id)
        return stats

    async def fetch_player_stats(self, player_id: str, season_id: str) -> dict:
        await self.rate_limit()
        _defaults: dict[str, dict] = {
            "lebron-james":          {"appearances": 55, "goals": 1474, "assists": 660, "minutes_played": 1980, "stat_type": "outfield", "extra_stats": {"rebounds": 550, "ppg": 26.8, "apg": 12.0}},
            "anthony-davis":         {"appearances": 58, "goals": 1566, "assists": 290, "minutes_played": 2088, "stat_type": "outfield", "extra_stats": {"rebounds": 812, "ppg": 27.0, "apg": 5.0}},
            "jayson-tatum":          {"appearances": 62, "goals": 1798, "assists": 446, "minutes_played": 2232, "stat_type": "outfield", "extra_stats": {"rebounds": 558, "ppg": 29.0, "apg": 7.2}},
            "jaylen-brown":          {"appearances": 60, "goals": 1620, "assists": 360, "minutes_played": 2160, "stat_type": "outfield", "extra_stats": {"rebounds": 480, "ppg": 27.0, "apg": 6.0}},
            "stephen-curry":         {"appearances": 58, "goals": 1653, "assists": 522, "minutes_played": 2088, "stat_type": "outfield", "extra_stats": {"rebounds": 290, "ppg": 28.5, "apg": 9.0}},
            "nikola-jokic":          {"appearances": 62, "goals": 1612, "assists": 775, "minutes_played": 2170, "stat_type": "outfield", "extra_stats": {"rebounds": 837, "ppg": 26.0, "apg": 12.5}},
            "giannis-antetokounmpo": {"appearances": 60, "goals": 1800, "assists": 480, "minutes_played": 2160, "stat_type": "outfield", "extra_stats": {"rebounds": 780, "ppg": 30.0, "apg": 8.0}},
            "damian-lillard":        {"appearances": 48, "goals": 1344, "assists": 528, "minutes_played": 1728, "stat_type": "outfield", "extra_stats": {"rebounds": 192, "ppg": 28.0, "apg": 11.0}},
            "jimmy-butler":          {"appearances": 52, "goals": 1196, "assists": 364, "minutes_played": 1872, "stat_type": "outfield", "extra_stats": {"rebounds": 364, "ppg": 23.0, "apg": 7.0}},
        }
        base = _defaults.get(player_id, {
            "appearances": 55, "goals": 990, "assists": 330, "minutes_played": 1980,
            "stat_type": "outfield", "extra_stats": {"ppg": 18.0},
        })
        stats = {"player_slug": player_id, "season_name": "2025-2026", **base}
        self._log_fetch("player_stats", 1, player_id=player_id)
        return stats

    async def fetch_injuries(self, team_id: str) -> list[dict]:
        await self.rate_limit()
        result = _INJURIES.get(team_id, [])
        self._log_fetch("injuries", len(result), team_id=team_id)
        return result

    async def fetch_odds_history(self, match_id: str) -> list[dict]:
        await self.rate_limit()
        result = _ODDS_HISTORY.get(match_id, [])
        self._log_fetch("odds_history", len(result), match_id=match_id)
        return result
