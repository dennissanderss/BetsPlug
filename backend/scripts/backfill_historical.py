"""
Backfill historical seasons (2020-2024) from API-Football Pro.
Fetches ALL 30 leagues, stores matches + results in Railway DB.

Usage:
    python scripts/backfill_historical.py

Uses ~500-700 API requests (well within 7,500/day Pro limit).
"""

import time
import uuid
import re
from datetime import date, datetime, timezone
from collections import defaultdict

import httpx
import psycopg2

# ── Config ────────────────────────────────────────────────────────────────
API_KEY = "41ac3dd6fe43bb2e79e3026bd3e9f9ea"
API_BASE = "https://v3.football.api-sports.io"

DB_CONFIG = {
    "host": "junction.proxy.rlwy.net",
    "port": 31958,
    "user": "postgres",
    "password": "iYHwNkbfwwXxqDgmpuKUHhjqQNMTfbSL",
    "dbname": "railway",
}

# All 30 leagues with API-Football IDs
LEAGUES = {
    39: "premier-league", 40: "championship",
    2: "champions-league", 3: "europa-league", 848: "conference-league",
    140: "la-liga", 141: "segunda-division",
    78: "bundesliga", 79: "2-bundesliga",
    135: "serie-a", 136: "serie-b",
    61: "ligue-1", 62: "ligue-2",
    88: "eredivisie", 94: "primeira-liga",
    203: "super-lig", 144: "jupiler-pro-league",
    179: "scottish-premiership", 207: "swiss-super-league",
    128: "liga-profesional-argentina", 71: "brasileirao-serie-a",
    262: "liga-mx", 13: "copa-libertadores",
    253: "mls", 307: "saudi-pro-league",
    188: "a-league", 98: "j1-league",
    292: "k-league-1", 169: "chinese-super-league",
}

LEAGUE_META = {
    39: ("Premier League", "England"), 40: ("Championship", "England"),
    2: ("Champions League", "Europe"), 3: ("Europa League", "Europe"),
    848: ("Conference League", "Europe"),
    140: ("La Liga", "Spain"), 141: ("Segunda Division", "Spain"),
    78: ("Bundesliga", "Germany"), 79: ("2. Bundesliga", "Germany"),
    135: ("Serie A", "Italy"), 136: ("Serie B", "Italy"),
    61: ("Ligue 1", "France"), 62: ("Ligue 2", "France"),
    88: ("Eredivisie", "Netherlands"), 94: ("Primeira Liga", "Portugal"),
    203: ("Super Lig", "Turkey"), 144: ("Jupiler Pro League", "Belgium"),
    179: ("Scottish Premiership", "Scotland"), 207: ("Swiss Super League", "Switzerland"),
    128: ("Liga Profesional Argentina", "Argentina"), 71: ("Brasileirao Serie A", "Brazil"),
    262: ("Liga MX", "Mexico"), 13: ("Copa Libertadores", "South America"),
    253: ("MLS", "USA"), 307: ("Saudi Pro League", "Saudi Arabia"),
    188: ("A-League", "Australia"), 98: ("J1 League", "Japan"),
    292: ("K League 1", "South Korea"), 169: ("Chinese Super League", "China"),
}

# Seasons to backfill (API-Football uses the START year)
SEASONS = [2020, 2021, 2022, 2023]  # = 2020-21, 2021-22, 2022-23, 2023-24


def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return re.sub(r"-+", "-", text).strip("-")


def fetch_fixtures(league_id, season, client):
    """Fetch all finished fixtures for a league + season from API-Football."""
    resp = client.get(
        f"{API_BASE}/fixtures",
        headers={"x-apisports-key": API_KEY},
        params={
            "league": league_id,
            "season": season,
            "status": "FT",  # Full Time (finished)
        },
        timeout=30,
    )
    if resp.status_code == 429:
        print("    Rate limited! Waiting 60s...")
        time.sleep(60)
        return fetch_fixtures(league_id, season, client)

    if resp.status_code != 200:
        print(f"    HTTP {resp.status_code}")
        return []

    data = resp.json()
    return data.get("response", [])


def insert_matches(conn, fixtures, league_id, season_year):
    """Insert fixtures + results into the database."""
    cur = conn.cursor()
    slug = LEAGUES[league_id]
    name, country = LEAGUE_META[league_id]

    # Ensure sport exists
    cur.execute("SELECT id FROM sports WHERE slug = 'football'")
    row = cur.fetchone()
    if row:
        sport_id = row[0]
    else:
        sport_id = str(uuid.uuid4())
        cur.execute("INSERT INTO sports (id, name, slug, icon, is_active) VALUES (%s, 'Football', 'football', 'ball', true)", (sport_id,))

    # Ensure league exists
    cur.execute("SELECT id FROM leagues WHERE slug = %s", (slug,))
    row = cur.fetchone()
    if row:
        league_db_id = row[0]
    else:
        league_db_id = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO leagues (id, sport_id, name, slug, country, tier, is_active) VALUES (%s, %s, %s, %s, %s, 1, true)",
            (league_db_id, sport_id, name, slug, country)
        )

    # Ensure season exists
    season_name = f"{season_year}-{season_year + 1}"
    cur.execute("SELECT id FROM seasons WHERE league_id = %s AND name = %s", (league_db_id, season_name))
    row = cur.fetchone()
    if row:
        season_db_id = row[0]
    else:
        season_db_id = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO seasons (id, league_id, name, start_date, end_date, is_current) VALUES (%s, %s, %s, %s, %s, false)",
            (season_db_id, league_db_id, season_name,
             date(season_year, 7, 1), date(season_year + 1, 6, 30))
        )

    created = 0
    skipped = 0
    for fix in fixtures:
        fixture_info = fix.get("fixture", {})
        teams = fix.get("teams", {})
        goals = fix.get("goals", {})
        score = fix.get("score", {})

        ext_id = f"apifb_{fixture_info.get('id', '')}"
        home_name = teams.get("home", {}).get("name", "Unknown")
        away_name = teams.get("away", {}).get("name", "Unknown")
        home_slug = slugify(home_name)
        away_slug = slugify(away_name)
        home_score = goals.get("home")
        away_score = goals.get("away")

        if home_score is None or away_score is None:
            skipped += 1
            continue

        kickoff_str = fixture_info.get("date", "")
        try:
            kickoff = datetime.fromisoformat(kickoff_str.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            skipped += 1
            continue

        # Check if already exists
        cur.execute("SELECT id FROM matches WHERE external_id = %s", (ext_id,))
        if cur.fetchone():
            skipped += 1
            continue

        # Ensure teams exist
        for t_slug, t_name in [(home_slug, home_name), (away_slug, away_name)]:
            cur.execute("SELECT id FROM teams WHERE slug = %s", (t_slug,))
            if not cur.fetchone():
                cur.execute(
                    "INSERT INTO teams (id, league_id, name, slug, is_active) VALUES (%s, %s, %s, %s, true)",
                    (str(uuid.uuid4()), league_db_id, t_name, t_slug)
                )

        # Get team IDs
        cur.execute("SELECT id FROM teams WHERE slug = %s", (home_slug,))
        home_team_id = cur.fetchone()[0]
        cur.execute("SELECT id FROM teams WHERE slug = %s", (away_slug,))
        away_team_id = cur.fetchone()[0]

        # Insert match
        match_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO matches (id, league_id, season_id, home_team_id, away_team_id,
                                 external_id, status, scheduled_at, matchday)
            VALUES (%s, %s, %s, %s, %s, %s, 'FINISHED', %s, %s)
        """, (match_id, league_db_id, season_db_id, home_team_id, away_team_id,
              ext_id, kickoff, fixture_info.get("periods", {}).get("first")))

        # Insert result
        ht = score.get("halftime", {})
        winner = "home" if home_score > away_score else ("away" if away_score > home_score else "draw")
        cur.execute("""
            INSERT INTO match_results (id, match_id, home_score, away_score,
                                       home_score_ht, away_score_ht, winner)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (str(uuid.uuid4()), match_id, home_score, away_score,
              ht.get("home"), ht.get("away"), winner))

        created += 1

    conn.commit()
    return created, skipped


def main():
    print("=" * 60)
    print("  BetsPlug Historical Backfill")
    print("  Source: API-Football Pro (jouw betaalde key)")
    print("  Leagues: 30 | Seasons: 2020-2024")
    print("=" * 60)

    conn = psycopg2.connect(**DB_CONFIG, connect_timeout=15)
    client = httpx.Client(timeout=30)

    total_created = 0
    total_skipped = 0
    api_calls = 0

    for season in SEASONS:
        print(f"\n--- SEIZOEN {season}-{season+1} ---")
        for league_id, slug in LEAGUES.items():
            name = LEAGUE_META[league_id][0]
            print(f"  {name} ({slug})...", end=" ", flush=True)

            fixtures = fetch_fixtures(league_id, season, client)
            api_calls += 1

            if not fixtures:
                print("0 matches")
                time.sleep(0.3)  # respect rate limits
                continue

            created, skipped = insert_matches(conn, fixtures, league_id, season)
            total_created += created
            total_skipped += skipped
            print(f"{len(fixtures)} from API, {created} new, {skipped} skipped")

            time.sleep(0.3)  # 0.3s between requests = ~200 req/min (well under limit)

    client.close()
    conn.close()

    print(f"\n{'=' * 60}")
    print(f"  KLAAR!")
    print(f"  Nieuwe wedstrijden: {total_created}")
    print(f"  Overgeslagen (al in DB): {total_skipped}")
    print(f"  API calls gebruikt: {api_calls} / 7,500")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
