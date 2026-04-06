"""
Sample Football Adapter
=======================
A concrete ``DataSourceAdapter`` that returns realistic, hard-coded seed data
for European football (Premier League, La Liga, Bundesliga, Serie A, Ligue 1).

This adapter is used to:
  1. Bootstrap the database with representative data during development / CI.
  2. Serve as a reference implementation showing the exact dict shapes every
     real adapter must produce.
  3. Allow the forecasting / evaluation pipeline to run without a paid API key.

All data is fictional in the statistical sense but uses real team names,
plausible scorelines, and match-day cadences that reflect actual league formats.
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
        "external_id": "sport_football",
        "name": "Football",
        "slug": "football",
        "icon": "⚽",
    },
]

_LEAGUES: list[dict] = [
    {
        "external_id": "league_epl",
        "sport_slug": "football",
        "name": "Premier League",
        "slug": "premier-league",
        "country": "England",
        "tier": 1,
    },
    {
        "external_id": "league_laliga",
        "sport_slug": "football",
        "name": "La Liga",
        "slug": "la-liga",
        "country": "Spain",
        "tier": 1,
    },
    {
        "external_id": "league_bundesliga",
        "sport_slug": "football",
        "name": "Bundesliga",
        "slug": "bundesliga",
        "country": "Germany",
        "tier": 1,
    },
    {
        "external_id": "league_seriea",
        "sport_slug": "football",
        "name": "Serie A",
        "slug": "serie-a",
        "country": "Italy",
        "tier": 1,
    },
    {
        "external_id": "league_ligue1",
        "sport_slug": "football",
        "name": "Ligue 1",
        "slug": "ligue-1",
        "country": "France",
        "tier": 1,
    },
]

# league_slug -> list[team dicts]
_TEAMS: dict[str, list[dict]] = {
    "premier-league": [
        {
            "external_id": "team_mancity",
            "league_slug": "premier-league",
            "name": "Manchester City",
            "slug": "manchester-city",
            "short_name": "Man City",
            "country": "England",
            "venue": "Etihad Stadium",
            "logo_url": None,
        },
        {
            "external_id": "team_arsenal",
            "league_slug": "premier-league",
            "name": "Arsenal",
            "slug": "arsenal",
            "short_name": "Arsenal",
            "country": "England",
            "venue": "Emirates Stadium",
            "logo_url": None,
        },
        {
            "external_id": "team_liverpool",
            "league_slug": "premier-league",
            "name": "Liverpool",
            "slug": "liverpool",
            "short_name": "Liverpool",
            "country": "England",
            "venue": "Anfield",
            "logo_url": None,
        },
        {
            "external_id": "team_chelsea",
            "league_slug": "premier-league",
            "name": "Chelsea",
            "slug": "chelsea",
            "short_name": "Chelsea",
            "country": "England",
            "venue": "Stamford Bridge",
            "logo_url": None,
        },
        {
            "external_id": "team_tottenham",
            "league_slug": "premier-league",
            "name": "Tottenham Hotspur",
            "slug": "tottenham-hotspur",
            "short_name": "Spurs",
            "country": "England",
            "venue": "Tottenham Hotspur Stadium",
            "logo_url": None,
        },
        {
            "external_id": "team_manutd",
            "league_slug": "premier-league",
            "name": "Manchester United",
            "slug": "manchester-united",
            "short_name": "Man Utd",
            "country": "England",
            "venue": "Old Trafford",
            "logo_url": None,
        },
    ],
    "la-liga": [
        {
            "external_id": "team_realmadrid",
            "league_slug": "la-liga",
            "name": "Real Madrid",
            "slug": "real-madrid",
            "short_name": "R. Madrid",
            "country": "Spain",
            "venue": "Santiago Bernabéu",
            "logo_url": None,
        },
        {
            "external_id": "team_barcelona",
            "league_slug": "la-liga",
            "name": "FC Barcelona",
            "slug": "fc-barcelona",
            "short_name": "Barça",
            "country": "Spain",
            "venue": "Estadi Olímpic Lluís Companys",
            "logo_url": None,
        },
        {
            "external_id": "team_atletico",
            "league_slug": "la-liga",
            "name": "Atlético de Madrid",
            "slug": "atletico-de-madrid",
            "short_name": "Atlético",
            "country": "Spain",
            "venue": "Cívitas Metropolitano",
            "logo_url": None,
        },
        {
            "external_id": "team_sevilla",
            "league_slug": "la-liga",
            "name": "Sevilla FC",
            "slug": "sevilla-fc",
            "short_name": "Sevilla",
            "country": "Spain",
            "venue": "Estadio Ramón Sánchez-Pizjuán",
            "logo_url": None,
        },
        {
            "external_id": "team_villarreal",
            "league_slug": "la-liga",
            "name": "Villarreal CF",
            "slug": "villarreal-cf",
            "short_name": "Villarreal",
            "country": "Spain",
            "venue": "Estadio de la Cerámica",
            "logo_url": None,
        },
        {
            "external_id": "team_realsociedad",
            "league_slug": "la-liga",
            "name": "Real Sociedad",
            "slug": "real-sociedad",
            "short_name": "Sociedad",
            "country": "Spain",
            "venue": "Reale Arena",
            "logo_url": None,
        },
    ],
    "bundesliga": [
        {
            "external_id": "team_bayernmunich",
            "league_slug": "bundesliga",
            "name": "Bayern München",
            "slug": "bayern-munchen",
            "short_name": "Bayern",
            "country": "Germany",
            "venue": "Allianz Arena",
            "logo_url": None,
        },
        {
            "external_id": "team_dortmund",
            "league_slug": "bundesliga",
            "name": "Borussia Dortmund",
            "slug": "borussia-dortmund",
            "short_name": "Dortmund",
            "country": "Germany",
            "venue": "Signal Iduna Park",
            "logo_url": None,
        },
        {
            "external_id": "team_leverkusen",
            "league_slug": "bundesliga",
            "name": "Bayer 04 Leverkusen",
            "slug": "bayer-04-leverkusen",
            "short_name": "Leverkusen",
            "country": "Germany",
            "venue": "BayArena",
            "logo_url": None,
        },
        {
            "external_id": "team_rb_leipzig",
            "league_slug": "bundesliga",
            "name": "RB Leipzig",
            "slug": "rb-leipzig",
            "short_name": "Leipzig",
            "country": "Germany",
            "venue": "Red Bull Arena",
            "logo_url": None,
        },
        {
            "external_id": "team_frankfurt",
            "league_slug": "bundesliga",
            "name": "Eintracht Frankfurt",
            "slug": "eintracht-frankfurt",
            "short_name": "Frankfurt",
            "country": "Germany",
            "venue": "Deutsche Bank Park",
            "logo_url": None,
        },
        {
            "external_id": "team_wolfsburg",
            "league_slug": "bundesliga",
            "name": "VfL Wolfsburg",
            "slug": "vfl-wolfsburg",
            "short_name": "Wolfsburg",
            "country": "Germany",
            "venue": "Volkswagen Arena",
            "logo_url": None,
        },
    ],
    "serie-a": [
        {
            "external_id": "team_inter",
            "league_slug": "serie-a",
            "name": "Inter Milan",
            "slug": "inter-milan",
            "short_name": "Inter",
            "country": "Italy",
            "venue": "Giuseppe Meazza",
            "logo_url": None,
        },
        {
            "external_id": "team_acmilan",
            "league_slug": "serie-a",
            "name": "AC Milan",
            "slug": "ac-milan",
            "short_name": "Milan",
            "country": "Italy",
            "venue": "Giuseppe Meazza",
            "logo_url": None,
        },
        {
            "external_id": "team_juventus",
            "league_slug": "serie-a",
            "name": "Juventus",
            "slug": "juventus",
            "short_name": "Juve",
            "country": "Italy",
            "venue": "Allianz Stadium",
            "logo_url": None,
        },
        {
            "external_id": "team_napoli",
            "league_slug": "serie-a",
            "name": "SSC Napoli",
            "slug": "ssc-napoli",
            "short_name": "Napoli",
            "country": "Italy",
            "venue": "Stadio Diego Armando Maradona",
            "logo_url": None,
        },
        {
            "external_id": "team_roma",
            "league_slug": "serie-a",
            "name": "AS Roma",
            "slug": "as-roma",
            "short_name": "Roma",
            "country": "Italy",
            "venue": "Stadio Olimpico",
            "logo_url": None,
        },
        {
            "external_id": "team_lazio",
            "league_slug": "serie-a",
            "name": "SS Lazio",
            "slug": "ss-lazio",
            "short_name": "Lazio",
            "country": "Italy",
            "venue": "Stadio Olimpico",
            "logo_url": None,
        },
    ],
    "ligue-1": [
        {
            "external_id": "team_psg",
            "league_slug": "ligue-1",
            "name": "Paris Saint-Germain",
            "slug": "paris-saint-germain",
            "short_name": "PSG",
            "country": "France",
            "venue": "Parc des Princes",
            "logo_url": None,
        },
        {
            "external_id": "team_monaco",
            "league_slug": "ligue-1",
            "name": "AS Monaco",
            "slug": "as-monaco",
            "short_name": "Monaco",
            "country": "France",
            "venue": "Stade Louis II",
            "logo_url": None,
        },
        {
            "external_id": "team_marseille",
            "league_slug": "ligue-1",
            "name": "Olympique de Marseille",
            "slug": "olympique-marseille",
            "short_name": "Marseille",
            "country": "France",
            "venue": "Orange Vélodrome",
            "logo_url": None,
        },
        {
            "external_id": "team_lyon",
            "league_slug": "ligue-1",
            "name": "Olympique Lyonnais",
            "slug": "olympique-lyonnais",
            "short_name": "Lyon",
            "country": "France",
            "venue": "Groupama Stadium",
            "logo_url": None,
        },
        {
            "external_id": "team_lille",
            "league_slug": "ligue-1",
            "name": "Lille OSC",
            "slug": "lille-osc",
            "short_name": "Lille",
            "country": "France",
            "venue": "Stade Pierre-Mauroy",
            "logo_url": None,
        },
        {
            "external_id": "team_rennes",
            "league_slug": "ligue-1",
            "name": "Stade Rennais FC",
            "slug": "stade-rennais",
            "short_name": "Rennes",
            "country": "France",
            "venue": "Roazhon Park",
            "logo_url": None,
        },
    ],
}

# Realistic players – subset per team (key = team_slug)
_PLAYERS: dict[str, list[dict]] = {
    "manchester-city": [
        {"external_id": "pl_haaland", "team_slug": "manchester-city", "name": "Erling Haaland", "slug": "erling-haaland", "position": "FWD", "nationality": "Norwegian", "date_of_birth": "2000-07-21", "jersey_number": 9, "photo_url": None},
        {"external_id": "pl_debruyne", "team_slug": "manchester-city", "name": "Kevin De Bruyne", "slug": "kevin-de-bruyne", "position": "MID", "nationality": "Belgian", "date_of_birth": "1991-06-28", "jersey_number": 17, "photo_url": None},
        {"external_id": "pl_ederson", "team_slug": "manchester-city", "name": "Ederson", "slug": "ederson", "position": "GK", "nationality": "Brazilian", "date_of_birth": "1993-08-17", "jersey_number": 31, "photo_url": None},
    ],
    "arsenal": [
        {"external_id": "pl_saka", "team_slug": "arsenal", "name": "Bukayo Saka", "slug": "bukayo-saka", "position": "MID", "nationality": "English", "date_of_birth": "2001-09-05", "jersey_number": 7, "photo_url": None},
        {"external_id": "pl_martinelli", "team_slug": "arsenal", "name": "Gabriel Martinelli", "slug": "gabriel-martinelli", "position": "FWD", "nationality": "Brazilian", "date_of_birth": "2001-06-18", "jersey_number": 11, "photo_url": None},
        {"external_id": "pl_raya", "team_slug": "arsenal", "name": "David Raya", "slug": "david-raya", "position": "GK", "nationality": "Spanish", "date_of_birth": "1995-09-15", "jersey_number": 22, "photo_url": None},
    ],
    "liverpool": [
        {"external_id": "pl_salah", "team_slug": "liverpool", "name": "Mohamed Salah", "slug": "mohamed-salah", "position": "FWD", "nationality": "Egyptian", "date_of_birth": "1992-06-15", "jersey_number": 11, "photo_url": None},
        {"external_id": "pl_virgil", "team_slug": "liverpool", "name": "Virgil van Dijk", "slug": "virgil-van-dijk", "position": "DEF", "nationality": "Dutch", "date_of_birth": "1991-07-08", "jersey_number": 4, "photo_url": None},
        {"external_id": "pl_alisson", "team_slug": "liverpool", "name": "Alisson Becker", "slug": "alisson-becker", "position": "GK", "nationality": "Brazilian", "date_of_birth": "1992-10-02", "jersey_number": 1, "photo_url": None},
    ],
    "real-madrid": [
        {"external_id": "pl_vinicius", "team_slug": "real-madrid", "name": "Vinícius Júnior", "slug": "vinicius-junior", "position": "FWD", "nationality": "Brazilian", "date_of_birth": "2000-07-12", "jersey_number": 7, "photo_url": None},
        {"external_id": "pl_bellingham", "team_slug": "real-madrid", "name": "Jude Bellingham", "slug": "jude-bellingham", "position": "MID", "nationality": "English", "date_of_birth": "2003-06-29", "jersey_number": 5, "photo_url": None},
        {"external_id": "pl_courtois", "team_slug": "real-madrid", "name": "Thibaut Courtois", "slug": "thibaut-courtois", "position": "GK", "nationality": "Belgian", "date_of_birth": "1992-05-11", "jersey_number": 1, "photo_url": None},
    ],
    "fc-barcelona": [
        {"external_id": "pl_yamal", "team_slug": "fc-barcelona", "name": "Lamine Yamal", "slug": "lamine-yamal", "position": "FWD", "nationality": "Spanish", "date_of_birth": "2007-07-13", "jersey_number": 19, "photo_url": None},
        {"external_id": "pl_pedri", "team_slug": "fc-barcelona", "name": "Pedri", "slug": "pedri", "position": "MID", "nationality": "Spanish", "date_of_birth": "2002-11-25", "jersey_number": 8, "photo_url": None},
        {"external_id": "pl_ter_stegen", "team_slug": "fc-barcelona", "name": "Marc-André ter Stegen", "slug": "marc-andre-ter-stegen", "position": "GK", "nationality": "German", "date_of_birth": "1992-04-30", "jersey_number": 1, "photo_url": None},
    ],
    "bayern-munchen": [
        {"external_id": "pl_kane", "team_slug": "bayern-munchen", "name": "Harry Kane", "slug": "harry-kane", "position": "FWD", "nationality": "English", "date_of_birth": "1993-07-28", "jersey_number": 9, "photo_url": None},
        {"external_id": "pl_musiala", "team_slug": "bayern-munchen", "name": "Jamal Musiala", "slug": "jamal-musiala", "position": "MID", "nationality": "German", "date_of_birth": "2003-02-26", "jersey_number": 42, "photo_url": None},
        {"external_id": "pl_neuer", "team_slug": "bayern-munchen", "name": "Manuel Neuer", "slug": "manuel-neuer", "position": "GK", "nationality": "German", "date_of_birth": "1986-03-27", "jersey_number": 1, "photo_url": None},
    ],
    "inter-milan": [
        {"external_id": "pl_lautaro", "team_slug": "inter-milan", "name": "Lautaro Martínez", "slug": "lautaro-martinez", "position": "FWD", "nationality": "Argentine", "date_of_birth": "1997-08-22", "jersey_number": 10, "photo_url": None},
        {"external_id": "pl_barella", "team_slug": "inter-milan", "name": "Nicolò Barella", "slug": "nicolo-barella", "position": "MID", "nationality": "Italian", "date_of_birth": "1997-02-07", "jersey_number": 23, "photo_url": None},
        {"external_id": "pl_sommer", "team_slug": "inter-milan", "name": "Yann Sommer", "slug": "yann-sommer", "position": "GK", "nationality": "Swiss", "date_of_birth": "1988-12-17", "jersey_number": 1, "photo_url": None},
    ],
    "paris-saint-germain": [
        {"external_id": "pl_dembele", "team_slug": "paris-saint-germain", "name": "Ousmane Dembélé", "slug": "ousmane-dembele", "position": "FWD", "nationality": "French", "date_of_birth": "1997-05-15", "jersey_number": 10, "photo_url": None},
        {"external_id": "pl_vitinha", "team_slug": "paris-saint-germain", "name": "Vitinha", "slug": "vitinha", "position": "MID", "nationality": "Portuguese", "date_of_birth": "2000-02-13", "jersey_number": 17, "photo_url": None},
        {"external_id": "pl_donnarumma", "team_slug": "paris-saint-germain", "name": "Gianluigi Donnarumma", "slug": "gianluigi-donnarumma", "position": "GK", "nationality": "Italian", "date_of_birth": "1999-02-25", "jersey_number": 99, "photo_url": None},
    ],
}

# Pre-built matches: (external_id, league_slug, home_slug, away_slug, kickoff_offset_days, matchday, status)
# kickoff is relative to a base date of 2025-08-16 (typical season start)
_BASE_DATE = datetime(2025, 8, 16, 15, 0, 0, tzinfo=timezone.utc)


def _ko(days: int, hour: int = 15) -> str:
    dt = _BASE_DATE + timedelta(days=days)
    return dt.replace(hour=hour).isoformat()


_MATCHES_RAW: list[tuple] = [
    # (ext_id, league, home, away, days_offset, matchday, status)
    # Premier League
    ("match_epl_001", "premier-league", "arsenal",          "manchester-city", 0,   1,  "finished"),
    ("match_epl_002", "premier-league", "liverpool",        "chelsea",          0,   1,  "finished"),
    ("match_epl_003", "premier-league", "tottenham-hotspur","manchester-united",1,   1,  "finished"),
    ("match_epl_004", "premier-league", "manchester-city",  "liverpool",        7,   2,  "finished"),
    ("match_epl_005", "premier-league", "chelsea",          "arsenal",          8,   2,  "finished"),
    ("match_epl_006", "premier-league", "manchester-united","tottenham-hotspur",14,  3,  "finished"),
    ("match_epl_007", "premier-league", "arsenal",          "liverpool",        21,  4,  "finished"),
    ("match_epl_008", "premier-league", "manchester-city",  "chelsea",          28,  5,  "finished"),
    ("match_epl_009", "premier-league", "liverpool",        "manchester-united",35,  6,  "finished"),
    ("match_epl_010", "premier-league", "tottenham-hotspur","arsenal",          210, 29, "scheduled"),
    # La Liga
    ("match_lla_001", "la-liga", "real-madrid",    "fc-barcelona",   1,   1,  "finished"),
    ("match_lla_002", "la-liga", "atletico-de-madrid","sevilla-fc",   1,   1,  "finished"),
    ("match_lla_003", "la-liga", "villarreal-cf",  "real-sociedad",  2,   1,  "finished"),
    ("match_lla_004", "la-liga", "fc-barcelona",   "atletico-de-madrid",8,2,  "finished"),
    ("match_lla_005", "la-liga", "sevilla-fc",     "real-madrid",    15,  3,  "finished"),
    ("match_lla_006", "la-liga", "real-madrid",    "villarreal-cf",  22,  4,  "finished"),
    ("match_lla_007", "la-liga", "real-sociedad",  "fc-barcelona",   205, 29, "scheduled"),
    # Bundesliga
    ("match_bun_001", "bundesliga", "bayern-munchen",      "borussia-dortmund", 1, 1, "finished"),
    ("match_bun_002", "bundesliga", "bayer-04-leverkusen", "rb-leipzig",        1, 1, "finished"),
    ("match_bun_003", "bundesliga", "eintracht-frankfurt", "vfl-wolfsburg",     2, 1, "finished"),
    ("match_bun_004", "bundesliga", "borussia-dortmund",   "bayer-04-leverkusen",8,2,"finished"),
    ("match_bun_005", "bundesliga", "rb-leipzig",          "bayern-munchen",    15, 3, "finished"),
    ("match_bun_006", "bundesliga", "bayern-munchen",      "eintracht-frankfurt",207,29,"scheduled"),
    # Serie A
    ("match_sea_001", "serie-a", "inter-milan", "ac-milan",   2,  1, "finished"),
    ("match_sea_002", "serie-a", "juventus",    "ssc-napoli", 2,  1, "finished"),
    ("match_sea_003", "serie-a", "as-roma",     "ss-lazio",   3,  1, "finished"),
    ("match_sea_004", "serie-a", "ac-milan",    "juventus",   9,  2, "finished"),
    ("match_sea_005", "serie-a", "ssc-napoli",  "inter-milan",16, 3, "finished"),
    ("match_sea_006", "serie-a", "ss-lazio",    "as-roma",    205,29,"scheduled"),
    # Ligue 1
    ("match_l1_001", "ligue-1", "paris-saint-germain","as-monaco",      2,  1, "finished"),
    ("match_l1_002", "ligue-1", "olympique-marseille","olympique-lyonnais",2,1,"finished"),
    ("match_l1_003", "ligue-1", "lille-osc",   "stade-rennais",          3,  1, "finished"),
    ("match_l1_004", "ligue-1", "as-monaco",   "olympique-marseille",    9,  2, "finished"),
    ("match_l1_005", "ligue-1", "paris-saint-germain","lille-osc",       16, 3, "finished"),
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
        "round_name": f"Matchday {r[5]}",
        "matchday": r[5],
        "season_name": "2025-2026",
    }
    for r in _MATCHES_RAW
]

# Results for finished matches (ext_match_id, home, away, home_ht, away_ht, winner, extra)
_RESULTS_RAW: list[tuple] = [
    # Premier League
    ("match_epl_001", 2, 2, 1, 1, "draw",  {"home_xg": 2.1, "away_xg": 1.9, "home_shots": 14, "away_shots": 12}),
    ("match_epl_002", 3, 1, 2, 0, "home",  {"home_xg": 2.8, "away_xg": 0.9, "home_shots": 18, "away_shots": 8}),
    ("match_epl_003", 0, 2, 0, 1, "away",  {"home_xg": 0.6, "away_xg": 1.8, "home_shots": 7,  "away_shots": 11}),
    ("match_epl_004", 1, 1, 0, 1, "draw",  {"home_xg": 1.4, "away_xg": 1.6, "home_shots": 10, "away_shots": 13}),
    ("match_epl_005", 2, 0, 1, 0, "home",  {"home_xg": 2.3, "away_xg": 0.4, "home_shots": 16, "away_shots": 5}),
    ("match_epl_006", 1, 3, 1, 1, "away",  {"home_xg": 0.8, "away_xg": 2.7, "home_shots": 9,  "away_shots": 15}),
    ("match_epl_007", 1, 0, 0, 0, "home",  {"home_xg": 1.3, "away_xg": 0.7, "home_shots": 11, "away_shots": 9}),
    ("match_epl_008", 4, 1, 2, 0, "home",  {"home_xg": 3.2, "away_xg": 0.8, "home_shots": 20, "away_shots": 7}),
    ("match_epl_009", 2, 2, 1, 0, "draw",  {"home_xg": 1.9, "away_xg": 2.0, "home_shots": 12, "away_shots": 14}),
    # La Liga
    ("match_lla_001", 3, 2, 1, 1, "home",  {"home_xg": 2.5, "away_xg": 2.1, "home_shots": 15, "away_shots": 13}),
    ("match_lla_002", 1, 0, 1, 0, "home",  {"home_xg": 1.6, "away_xg": 0.5, "home_shots": 11, "away_shots": 6}),
    ("match_lla_003", 2, 2, 1, 1, "draw",  {"home_xg": 1.7, "away_xg": 1.9, "home_shots": 10, "away_shots": 12}),
    ("match_lla_004", 1, 1, 0, 0, "draw",  {"home_xg": 1.4, "away_xg": 1.5, "home_shots": 9,  "away_shots": 10}),
    ("match_lla_005", 0, 3, 0, 2, "away",  {"home_xg": 0.4, "away_xg": 2.9, "home_shots": 5,  "away_shots": 17}),
    ("match_lla_006", 2, 0, 1, 0, "home",  {"home_xg": 2.1, "away_xg": 0.3, "home_shots": 14, "away_shots": 4}),
    # Bundesliga
    ("match_bun_001", 4, 0, 2, 0, "home",  {"home_xg": 3.8, "away_xg": 0.4, "home_shots": 22, "away_shots": 5}),
    ("match_bun_002", 2, 1, 1, 0, "home",  {"home_xg": 2.0, "away_xg": 0.9, "home_shots": 13, "away_shots": 8}),
    ("match_bun_003", 1, 1, 0, 1, "draw",  {"home_xg": 1.2, "away_xg": 1.3, "home_shots": 9,  "away_shots": 10}),
    ("match_bun_004", 2, 3, 1, 1, "away",  {"home_xg": 1.5, "away_xg": 2.6, "home_shots": 10, "away_shots": 16}),
    ("match_bun_005", 1, 2, 1, 1, "away",  {"home_xg": 0.9, "away_xg": 2.0, "home_shots": 8,  "away_shots": 13}),
    # Serie A
    ("match_sea_001", 2, 1, 0, 0, "home",  {"home_xg": 1.9, "away_xg": 0.8, "home_shots": 13, "away_shots": 7}),
    ("match_sea_002", 0, 1, 0, 0, "away",  {"home_xg": 0.5, "away_xg": 1.1, "home_shots": 6,  "away_shots": 9}),
    ("match_sea_003", 1, 1, 1, 0, "draw",  {"home_xg": 1.3, "away_xg": 1.4, "home_shots": 10, "away_shots": 11}),
    ("match_sea_004", 3, 1, 2, 0, "home",  {"home_xg": 2.6, "away_xg": 0.7, "home_shots": 17, "away_shots": 6}),
    ("match_sea_005", 0, 2, 0, 1, "away",  {"home_xg": 0.3, "away_xg": 1.8, "home_shots": 4,  "away_shots": 12}),
    # Ligue 1
    ("match_l1_001", 3, 0, 2, 0, "home",   {"home_xg": 2.7, "away_xg": 0.2, "home_shots": 19, "away_shots": 3}),
    ("match_l1_002", 1, 2, 0, 1, "away",   {"home_xg": 0.9, "away_xg": 1.8, "home_shots": 8,  "away_shots": 13}),
    ("match_l1_003", 2, 0, 1, 0, "home",   {"home_xg": 1.8, "away_xg": 0.4, "home_shots": 12, "away_shots": 5}),
    ("match_l1_004", 1, 1, 1, 1, "draw",   {"home_xg": 1.1, "away_xg": 1.2, "home_shots": 9,  "away_shots": 10}),
    ("match_l1_005", 4, 0, 2, 0, "home",   {"home_xg": 3.5, "away_xg": 0.3, "home_shots": 21, "away_shots": 4}),
]

_RESULTS: dict[str, dict] = {
    r[0]: {
        "external_match_id": r[0],
        "home_score": r[1],
        "away_score": r[2],
        "home_score_ht": r[3],
        "away_score_ht": r[4],
        "winner": r[5],
        "extra_data": r[6],
    }
    for r in _RESULTS_RAW
}

# Standings: (team_slug, league_slug, season_name, pos, P, W, D, L, GF, GA, GD, Pts, form)
_STANDINGS_RAW: dict[str, list[tuple]] = {
    "premier-league": [
        ("arsenal",          "premier-league", "2025-2026", 1, 29, 20, 6, 3, 62, 28, 34, 66, "WWDWW"),
        ("manchester-city",  "premier-league", "2025-2026", 2, 29, 19, 5, 5, 67, 32, 35, 62, "WWWLD"),
        ("liverpool",        "premier-league", "2025-2026", 3, 29, 18, 7, 4, 58, 31, 27, 61, "DWWWW"),
        ("chelsea",          "premier-league", "2025-2026", 4, 29, 14, 8, 7, 52, 40, 12, 50, "WDLWW"),
        ("tottenham-hotspur","premier-league", "2025-2026", 5, 28, 14, 5, 9, 49, 42,  7, 47, "LWWDL"),
        ("manchester-united","premier-league", "2025-2026", 6, 29,  9, 6,14, 34, 52,-18, 33, "LLDWL"),
    ],
    "la-liga": [
        ("real-madrid",       "la-liga", "2025-2026", 1, 29, 22, 4, 3, 71, 27, 44, 70, "WWWWW"),
        ("fc-barcelona",      "la-liga", "2025-2026", 2, 29, 20, 5, 4, 65, 34, 31, 65, "WWDWW"),
        ("atletico-de-madrid","la-liga", "2025-2026", 3, 29, 17, 6, 6, 48, 29, 19, 57, "WWLWW"),
        ("villarreal-cf",     "la-liga", "2025-2026", 4, 29, 13, 8, 8, 44, 39,  5, 47, "DWWDL"),
        ("real-sociedad",     "la-liga", "2025-2026", 5, 29, 12, 9, 8, 40, 37,  3, 45, "WDDLW"),
        ("sevilla-fc",        "la-liga", "2025-2026", 6, 29,  8, 7,14, 33, 54,-21, 31, "LLLWD"),
    ],
    "bundesliga": [
        ("bayer-04-leverkusen","bundesliga","2025-2026",1,29,23,4,2,77,23,54,73,"WWWWW"),
        ("bayern-munchen",     "bundesliga","2025-2026",2,29,21,4,4,78,31,47,67,"WLWWW"),
        ("borussia-dortmund",  "bundesliga","2025-2026",3,29,18,4,7,63,40,23,58,"WWDLW"),
        ("rb-leipzig",         "bundesliga","2025-2026",4,29,15,5,9,55,44,11,50,"LWWWL"),
        ("eintracht-frankfurt","bundesliga","2025-2026",5,29,13,6,10,50,48, 2,45,"WDWLD"),
        ("vfl-wolfsburg",      "bundesliga","2025-2026",6,29, 7,5,17,33,62,-29,26,"LLLDW"),
    ],
    "serie-a": [
        ("inter-milan", "serie-a","2025-2026",1,29,21,6,2,65,22,43,69,"WWWWW"),
        ("ac-milan",    "serie-a","2025-2026",2,29,19,5,5,58,33,25,62,"WWDWL"),
        ("juventus",    "serie-a","2025-2026",3,29,16,8,5,49,30,19,56,"DWDWW"),
        ("ssc-napoli",  "serie-a","2025-2026",4,29,14,7,8,47,37,10,49,"WLWDW"),
        ("as-roma",     "serie-a","2025-2026",5,29,13,5,11,42,45,-3,44,"WLDLW"),
        ("ss-lazio",    "serie-a","2025-2026",6,29,11,7,11,40,44,-4,40,"DDWLW"),
    ],
    "ligue-1": [
        ("paris-saint-germain","ligue-1","2025-2026",1,29,24,3,2,80,21,59,75,"WWWWW"),
        ("as-monaco",          "ligue-1","2025-2026",2,29,18,5,6,61,34,27,59,"WDWLW"),
        ("olympique-lyonnais", "ligue-1","2025-2026",3,29,15,8,6,52,38,14,53,"DWWWL"),
        ("olympique-marseille","ligue-1","2025-2026",4,29,14,6,9,48,42, 6,48,"WLWDW"),
        ("lille-osc",          "ligue-1","2025-2026",5,29,12,7,10,42,41, 1,43,"DWWLL"),
        ("stade-rennais",      "ligue-1","2025-2026",6,29, 9,5,15,33,55,-22,32,"LDWLL"),
    ],
}

_STANDINGS: dict[str, list[dict]] = {}
for _league_slug, _rows in _STANDINGS_RAW.items():
    _STANDINGS[_league_slug] = [
        {
            "team_slug": r[0],
            "league_slug": r[1],
            "season_name": r[2],
            "position": r[3],
            "played": r[4],
            "won": r[5],
            "drawn": r[6],
            "lost": r[7],
            "goals_for": r[8],
            "goals_against": r[9],
            "goal_difference": r[10],
            "points": r[11],
            "extra_data": {"form": r[12]},
        }
        for r in _rows
    ]

# Injury data
_INJURIES: dict[str, list[dict]] = {
    "manchester-city": [
        {"player_slug": "kevin-de-bruyne", "team_slug": "manchester-city", "injury_type": "Hamstring strain", "severity": "moderate", "start_date": "2025-12-10", "expected_return": "2026-01-15", "status": "active"},
    ],
    "arsenal": [
        {"player_slug": "gabriel-martinelli", "team_slug": "arsenal", "injury_type": "Ankle sprain", "severity": "minor", "start_date": "2026-02-20", "expected_return": "2026-03-05", "status": "recovered"},
    ],
    "real-madrid": [
        {"player_slug": "thibaut-courtois", "team_slug": "real-madrid", "injury_type": "ACL tear", "severity": "severe", "start_date": "2025-09-01", "expected_return": "2026-05-01", "status": "active"},
    ],
    "bayern-munchen": [
        {"player_slug": "manuel-neuer", "team_slug": "bayern-munchen", "injury_type": "Fractured leg", "severity": "severe", "start_date": "2025-10-15", "expected_return": "2026-04-01", "status": "active"},
    ],
    "inter-milan": [
        {"player_slug": "nicolo-barella", "team_slug": "inter-milan", "injury_type": "Muscle fatigue", "severity": "minor", "start_date": "2026-03-01", "expected_return": "2026-03-10", "status": "recovered"},
    ],
}

# Odds history – two snapshots per finished EPL match
_ODDS_HISTORY: dict[str, list[dict]] = {}
for _row in _RESULTS_RAW[:9]:  # EPL finished matches
    _mid = _row[0]
    _base_ts = _BASE_DATE + timedelta(days=7)
    _ODDS_HISTORY[_mid] = [
        {
            "external_match_id": _mid,
            "source": "Betfair Exchange",
            "market": "1x2",
            "home_odds": round(2.10 + (_row[1] * 0.05), 2),
            "draw_odds": round(3.40, 2),
            "away_odds": round(3.20 - (_row[2] * 0.05), 2),
            "recorded_at": (_base_ts - timedelta(days=3)).isoformat(),
        },
        {
            "external_match_id": _mid,
            "source": "Bet365",
            "market": "1x2",
            "home_odds": round(2.05 + (_row[1] * 0.04), 2),
            "draw_odds": round(3.50, 2),
            "away_odds": round(3.15 - (_row[2] * 0.04), 2),
            "recorded_at": (_base_ts - timedelta(hours=1)).isoformat(),
        },
    ]


# ---------------------------------------------------------------------------
# Concrete adapter
# ---------------------------------------------------------------------------

class SampleFootballAdapter(DataSourceAdapter):
    """
    Concrete adapter that returns hard-coded European football seed data.

    No HTTP calls are made; the data is in-process.  The rate_limit helper
    still fires so the ingestion pipeline can be tested end-to-end.
    """

    def __init__(self, config: dict, http_client: httpx.AsyncClient) -> None:
        super().__init__(config, http_client)
        # No rate limiting needed for in-memory data
        self._rate_limit_seconds = 0.0

    async def fetch_sports(self) -> list[dict]:
        await self.rate_limit()
        result = list(_SPORTS)
        self._log_fetch("sports", len(result))
        return result

    async def fetch_leagues(self, sport_id: str) -> list[dict]:
        await self.rate_limit()
        result = [lg for lg in _LEAGUES if lg["sport_slug"] == sport_id or sport_id == "football"]
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
        # Build stats from standings data
        all_standings = [
            row
            for rows in _STANDINGS.values()
            for row in rows
            if row["team_slug"] == team_id
        ]
        if not all_standings:
            return {}
        s = all_standings[0]
        avg_scored = round(s["goals_for"] / s["played"], 2) if s["played"] else None
        avg_conceded = round(s["goals_against"] / s["played"], 2) if s["played"] else None
        stats = {
            "team_slug": team_id,
            "season_name": s["season_name"],
            "matches_played": s["played"],
            "wins": s["won"],
            "draws": s["drawn"],
            "losses": s["lost"],
            "goals_scored": s["goals_for"],
            "goals_conceded": s["goals_against"],
            "home_wins": round(s["won"] * 0.6),
            "away_wins": round(s["won"] * 0.4),
            "avg_goals_scored": avg_scored,
            "avg_goals_conceded": avg_conceded,
            "extra_stats": {"form": s["extra_data"].get("form", "")},
        }
        self._log_fetch("team_stats", 1, team_id=team_id)
        return stats

    async def fetch_player_stats(self, player_id: str, season_id: str) -> dict:
        await self.rate_limit()
        # Simple realistic defaults keyed by player slug
        _defaults: dict[str, dict] = {
            "erling-haaland":   {"appearances": 29, "goals": 27, "assists": 6,  "minutes_played": 2480, "stat_type": "outfield"},
            "kevin-de-bruyne":  {"appearances": 22, "goals": 5,  "assists": 14, "minutes_played": 1890, "stat_type": "outfield"},
            "bukayo-saka":      {"appearances": 29, "goals": 14, "assists": 11, "minutes_played": 2520, "stat_type": "outfield"},
            "mohamed-salah":    {"appearances": 29, "goals": 22, "assists": 13, "minutes_played": 2590, "stat_type": "outfield"},
            "vinicius-junior":  {"appearances": 27, "goals": 18, "assists": 9,  "minutes_played": 2310, "stat_type": "outfield"},
            "jude-bellingham":  {"appearances": 26, "goals": 15, "assists": 8,  "minutes_played": 2250, "stat_type": "outfield"},
            "harry-kane":       {"appearances": 29, "goals": 31, "assists": 7,  "minutes_played": 2610, "stat_type": "outfield"},
            "jamal-musiala":    {"appearances": 28, "goals": 12, "assists": 10, "minutes_played": 2380, "stat_type": "outfield"},
            "lautaro-martinez": {"appearances": 27, "goals": 19, "assists": 5,  "minutes_played": 2290, "stat_type": "outfield"},
            "ousmane-dembele":  {"appearances": 26, "goals": 13, "assists": 12, "minutes_played": 2200, "stat_type": "outfield"},
        }
        base = _defaults.get(player_id, {"appearances": 20, "goals": 3, "assists": 4, "minutes_played": 1500, "stat_type": "outfield"})
        stats = {
            "player_slug": player_id,
            "season_name": "2025-2026",
            "extra_stats": None,
            **base,
        }
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
