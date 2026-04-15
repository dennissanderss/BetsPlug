"""
Retry backfill for missing seasons (2022-2023, 2023-2024) and incomplete 2021-2022.
Uses slower request pace to avoid rate limiting.
"""

import time
import uuid
import re
from datetime import date, datetime, timezone
from collections import defaultdict

import httpx
import psycopg2

API_KEY = "41ac3dd6fe43bb2e79e3026bd3e9f9ea"
API_BASE = "https://v3.football.api-sports.io"

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}

LEAGUES = {
    39: ("Premier League", "England", "premier-league"),
    40: ("Championship", "England", "championship"),
    2: ("Champions League", "Europe", "champions-league"),
    3: ("Europa League", "Europe", "europa-league"),
    848: ("Conference League", "Europe", "conference-league"),
    140: ("La Liga", "Spain", "la-liga"),
    141: ("Segunda Division", "Spain", "segunda-division"),
    78: ("Bundesliga", "Germany", "bundesliga"),
    79: ("2. Bundesliga", "Germany", "2-bundesliga"),
    135: ("Serie A", "Italy", "serie-a"),
    136: ("Serie B", "Italy", "serie-b"),
    61: ("Ligue 1", "France", "ligue-1"),
    62: ("Ligue 2", "France", "ligue-2"),
    88: ("Eredivisie", "Netherlands", "eredivisie"),
    94: ("Primeira Liga", "Portugal", "primeira-liga"),
    203: ("Super Lig", "Turkey", "super-lig"),
    144: ("Jupiler Pro League", "Belgium", "jupiler-pro-league"),
    179: ("Scottish Premiership", "Scotland", "scottish-premiership"),
    207: ("Swiss Super League", "Switzerland", "swiss-super-league"),
    128: ("Liga Profesional Argentina", "Argentina", "liga-profesional-argentina"),
    71: ("Brasileirao Serie A", "Brazil", "brasileirao-serie-a"),
    262: ("Liga MX", "Mexico", "liga-mx"),
    13: ("Copa Libertadores", "South America", "copa-libertadores"),
    253: ("MLS", "USA", "mls"),
    307: ("Saudi Pro League", "Saudi Arabia", "saudi-pro-league"),
    188: ("A-League", "Australia", "a-league"),
    98: ("J1 League", "Japan", "j1-league"),
    292: ("K League 1", "South Korea", "k-league-1"),
    169: ("Chinese Super League", "China", "chinese-super-league"),
}

SEASONS_TO_RETRY = [2021, 2022, 2023]  # retry incomplete + missing


def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return re.sub(r"-+", "-", text).strip("-")


def fetch_fixtures(league_id, season, client, retry=0):
    """Fetch with retry on empty/rate-limit responses."""
    try:
        resp = client.get(
            f"{API_BASE}/fixtures",
            headers={"x-apisports-key": API_KEY},
            params={"league": league_id, "season": season, "status": "FT"},
            timeout=30,
        )
        if resp.status_code == 429:
            print(f"    429! Waiting 120s...")
            time.sleep(120)
            return fetch_fixtures(league_id, season, client, retry+1)

        if resp.status_code != 200:
            print(f"    HTTP {resp.status_code}")
            if retry < 2:
                time.sleep(10)
                return fetch_fixtures(league_id, season, client, retry+1)
            return []

        data = resp.json()
        # Check for rate limit messages in response
        errors = data.get("errors")
        if errors:
            if isinstance(errors, dict):
                err_str = str(errors)
                if "rate" in err_str.lower() or "limit" in err_str.lower():
                    print(f"    API rate limit: {errors}. Waiting 60s...")
                    time.sleep(60)
                    if retry < 3:
                        return fetch_fixtures(league_id, season, client, retry+1)
        return data.get("response", [])
    except Exception as e:
        print(f"    Error: {e}")
        if retry < 2:
            time.sleep(10)
            return fetch_fixtures(league_id, season, client, retry+1)
        return []


def insert_matches(conn, fixtures, league_id, season_year):
    cur = conn.cursor()
    name, country, slug = LEAGUES[league_id]

    cur.execute("SELECT id FROM sports WHERE slug = 'football'")
    row = cur.fetchone()
    sport_id = row[0] if row else None
    if not sport_id:
        sport_id = str(uuid.uuid4())
        cur.execute("INSERT INTO sports (id, name, slug, icon, is_active) VALUES (%s, 'Football', 'football', 'ball', true)", (sport_id,))

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
        fi = fix.get("fixture", {})
        teams = fix.get("teams", {})
        goals = fix.get("goals", {})
        score = fix.get("score", {})

        ext_id = f"apifb_{fi.get('id', '')}"
        home_name = teams.get("home", {}).get("name", "Unknown")
        away_name = teams.get("away", {}).get("name", "Unknown")
        home_slug = slugify(home_name)
        away_slug = slugify(away_name)
        hs = goals.get("home")
        as_ = goals.get("away")

        if hs is None or as_ is None:
            skipped += 1
            continue

        try:
            kickoff = datetime.fromisoformat(fi.get("date", "").replace("Z", "+00:00"))
        except:
            skipped += 1
            continue

        cur.execute("SELECT id FROM matches WHERE external_id = %s", (ext_id,))
        if cur.fetchone():
            skipped += 1
            continue

        for t_slug, t_name in [(home_slug, home_name), (away_slug, away_name)]:
            cur.execute("SELECT id FROM teams WHERE slug = %s", (t_slug,))
            if not cur.fetchone():
                cur.execute(
                    "INSERT INTO teams (id, league_id, name, slug, is_active) VALUES (%s, %s, %s, %s, true)",
                    (str(uuid.uuid4()), league_db_id, t_name, t_slug)
                )

        cur.execute("SELECT id FROM teams WHERE slug = %s", (home_slug,))
        home_id = cur.fetchone()[0]
        cur.execute("SELECT id FROM teams WHERE slug = %s", (away_slug,))
        away_id = cur.fetchone()[0]

        match_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO matches (id, league_id, season_id, home_team_id, away_team_id,
                                 external_id, status, scheduled_at)
            VALUES (%s, %s, %s, %s, %s, %s, 'FINISHED', %s)
        """, (match_id, league_db_id, season_db_id, home_id, away_id, ext_id, kickoff))

        ht = score.get("halftime", {})
        winner = "home" if hs > as_ else ("away" if as_ > hs else "draw")
        cur.execute("""
            INSERT INTO match_results (id, match_id, home_score, away_score,
                                       home_score_ht, away_score_ht, winner)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (str(uuid.uuid4()), match_id, hs, as_, ht.get("home"), ht.get("away"), winner))
        created += 1

    conn.commit()
    return created, skipped


def main():
    print("="*60)
    print("  Retry Backfill: missing seasons")
    print("="*60)

    conn = psycopg2.connect(**DB_CONFIG, connect_timeout=15)
    client = httpx.Client(timeout=30)

    total_created = 0
    zero_count = 0
    api_calls = 0

    for season in SEASONS_TO_RETRY:
        # Check what's already in DB for this season
        cur = conn.cursor()
        cur.execute("""
            SELECT DISTINCT l.slug FROM matches m
            JOIN seasons s ON s.id = m.season_id
            JOIN leagues l ON l.id = m.league_id
            WHERE s.name = %s
        """, (f"{season}-{season+1}",))
        existing_slugs = {r[0] for r in cur.fetchall()}

        print(f"\n--- SEIZOEN {season}-{season+1} (al in DB: {len(existing_slugs)} leagues) ---")

        for league_id, (name, country, slug) in LEAGUES.items():
            if slug in existing_slugs:
                print(f"  {name}: al compleet, skip")
                continue

            print(f"  {name}...", end=" ", flush=True)

            # 3 attempts with increasing delays
            fixtures = []
            for attempt in range(3):
                fixtures = fetch_fixtures(league_id, season, client)
                api_calls += 1
                if fixtures:
                    break
                if attempt < 2:
                    print(f"retry {attempt+1}...", end=" ", flush=True)
                    time.sleep(15 + attempt * 15)  # 15s, 30s delays

            if not fixtures:
                print("0 matches (gave up)")
                zero_count += 1
                time.sleep(2)
                continue

            created, skipped = insert_matches(conn, fixtures, league_id, season)
            total_created += created
            print(f"{len(fixtures)} API, {created} nieuw")
            time.sleep(1.5)  # slower pace to avoid rate limits

    client.close()
    conn.close()

    print(f"\n{'='*60}")
    print(f"  Retry klaar!")
    print(f"  Nieuwe wedstrijden: {total_created}")
    print(f"  0-responses: {zero_count}")
    print(f"  API calls: {api_calls}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
