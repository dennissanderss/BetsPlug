"""
Fast Historical Backfill — batched inserts via execute_values.
10-20x faster than backfill_historical.py for remote Railway DB.

Strategy:
1. Fetch all matches per league+season from API-Football
2. Collect unique teams across all matches → bulk upsert teams
3. Bulk upsert matches with ON CONFLICT DO NOTHING
4. Bulk upsert match_results with ON CONFLICT DO NOTHING

All inserts use psycopg2.extras.execute_values for single-round-trip
batch inserts (100 rows per round-trip instead of 1).
"""

import time
import uuid
import re
from datetime import date, datetime, timezone

import httpx
import psycopg2
from psycopg2.extras import execute_values

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

# All seasons to backfill (historical + current)
SEASONS = [2020, 2021, 2022, 2023, 2024, 2025]


def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return re.sub(r"-+", "-", text).strip("-")


def fetch_fixtures(league_id, season, client, status_filter="FT-AET-PEN"):
    """Fetch all finished fixtures for a league+season."""
    resp = client.get(
        f"{API_BASE}/fixtures",
        headers={"x-apisports-key": API_KEY},
        params={"league": league_id, "season": season, "status": status_filter},
        timeout=45,
    )
    if resp.status_code == 429:
        print("    429, wait 60s")
        time.sleep(60)
        return fetch_fixtures(league_id, season, client, status_filter)
    if resp.status_code != 200:
        print(f"    HTTP {resp.status_code}")
        return []
    data = resp.json()
    return data.get("response", [])


def ensure_sport_league_season(conn, league_id, season_year):
    """One-shot upsert: sport + league + season. Returns (league_id, season_id)."""
    name, country, slug = LEAGUES[league_id]
    cur = conn.cursor()

    # Sport
    cur.execute("""
        INSERT INTO sports (id, name, slug, icon, is_active)
        VALUES (%s, 'Football', 'football', 'ball', true)
        ON CONFLICT (slug) DO NOTHING
    """, (str(uuid.uuid4()),))
    cur.execute("SELECT id FROM sports WHERE slug = 'football'")
    sport_id = cur.fetchone()[0]

    # League
    cur.execute("""
        INSERT INTO leagues (id, sport_id, name, slug, country, tier, is_active)
        VALUES (%s, %s, %s, %s, %s, 1, true)
        ON CONFLICT (slug) DO NOTHING
    """, (str(uuid.uuid4()), sport_id, name, slug, country))
    cur.execute("SELECT id FROM leagues WHERE slug = %s", (slug,))
    league_db_id = cur.fetchone()[0]

    # Season
    season_name = f"{season_year}-{season_year + 1}"
    cur.execute("SELECT id FROM seasons WHERE league_id = %s AND name = %s",
                (league_db_id, season_name))
    row = cur.fetchone()
    if row:
        season_db_id = row[0]
    else:
        season_db_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO seasons (id, league_id, name, start_date, end_date, is_current)
            VALUES (%s, %s, %s, %s, %s, false)
        """, (season_db_id, league_db_id, season_name,
              date(season_year, 7, 1), date(season_year + 1, 6, 30)))

    conn.commit()
    return league_db_id, season_db_id


def bulk_upsert_teams(conn, league_db_id, teams_data):
    """Bulk insert teams (name, slug) using ON CONFLICT.
    Returns dict {slug: id}."""
    if not teams_data:
        return {}
    cur = conn.cursor()

    # Build rows: (id, league_id, name, slug, is_active)
    rows = []
    for slug, name in teams_data.items():
        rows.append((str(uuid.uuid4()), league_db_id, name, slug, True))

    execute_values(cur, """
        INSERT INTO teams (id, league_id, name, slug, is_active)
        VALUES %s
        ON CONFLICT (slug) DO NOTHING
    """, rows)
    conn.commit()

    # Fetch actual IDs for all slugs (existing + newly inserted)
    slugs = list(teams_data.keys())
    cur.execute("SELECT slug, id FROM teams WHERE slug = ANY(%s)", (slugs,))
    return {s: i for s, i in cur.fetchall()}


def bulk_upsert_matches_and_results(conn, fixtures, league_db_id, season_db_id, team_ids_by_slug):
    """Bulk insert matches + results. Skips already-existing (via ON CONFLICT)."""
    if not fixtures:
        return 0, 0

    cur = conn.cursor()
    match_rows = []
    result_rows = []

    for fix in fixtures:
        fi = fix.get("fixture", {})
        teams = fix.get("teams", {})
        goals = fix.get("goals", {})
        score = fix.get("score", {})

        ext_id = f"apifb_{fi.get('id', '')}"
        home_name = teams.get("home", {}).get("name", "")
        away_name = teams.get("away", {}).get("name", "")
        if not home_name or not away_name:
            continue

        home_slug = slugify(home_name)
        away_slug = slugify(away_name)
        home_id = team_ids_by_slug.get(home_slug)
        away_id = team_ids_by_slug.get(away_slug)
        if not home_id or not away_id:
            continue

        hs = goals.get("home")
        as_ = goals.get("away")
        if hs is None or as_ is None:
            continue

        try:
            kickoff = datetime.fromisoformat(fi.get("date", "").replace("Z", "+00:00"))
        except:
            continue

        match_id = str(uuid.uuid4())
        match_rows.append((
            match_id, league_db_id, season_db_id, home_id, away_id,
            ext_id, 'FINISHED', kickoff,
        ))

        ht = score.get("halftime", {})
        winner = "home" if hs > as_ else ("away" if as_ > hs else "draw")
        result_rows.append((
            str(uuid.uuid4()), match_id, hs, as_,
            ht.get("home"), ht.get("away"), winner,
        ))

    # Bulk insert matches with ON CONFLICT on external_id (skip duplicates)
    execute_values(cur, """
        INSERT INTO matches (id, league_id, season_id, home_team_id, away_team_id,
                             external_id, status, scheduled_at)
        VALUES %s
        ON CONFLICT (external_id) DO NOTHING
    """, match_rows)

    # Get the actual match IDs (existing or new) for linking results
    ext_ids = [r[5] for r in match_rows]
    cur.execute("SELECT external_id, id FROM matches WHERE external_id = ANY(%s)", (ext_ids,))
    actual_match_ids = {eid: mid for eid, mid in cur.fetchall()}

    # Rebuild result_rows with actual match IDs
    fixed_result_rows = []
    for (rid, placeholder_mid, hs, as_, hh, ah, winner), (_, _, _, _, _, ext_id, _, _) in zip(result_rows, match_rows):
        actual_mid = actual_match_ids.get(ext_id)
        if actual_mid:
            fixed_result_rows.append((rid, actual_mid, hs, as_, hh, ah, winner))

    # Bulk insert results with ON CONFLICT on match_id
    if fixed_result_rows:
        execute_values(cur, """
            INSERT INTO match_results (id, match_id, home_score, away_score,
                                       home_score_ht, away_score_ht, winner)
            VALUES %s
            ON CONFLICT (match_id) DO NOTHING
        """, fixed_result_rows)

    conn.commit()
    return len(match_rows), len(fixed_result_rows)


def backfill_league_season(conn, client, league_id, season_year):
    """Backfill one league+season. Returns (created_matches, created_results)."""
    name = LEAGUES[league_id][0]
    print(f"  {name[:25]:25s}", end=" ", flush=True)

    # Fetch from API
    fixtures = fetch_fixtures(league_id, season_year, client)
    if not fixtures:
        print(f"0 matches")
        return 0, 0

    # Ensure league + season exist
    league_db_id, season_db_id = ensure_sport_league_season(conn, league_id, season_year)

    # Collect unique teams
    teams_data = {}
    for fix in fixtures:
        for side in ["home", "away"]:
            t = fix.get("teams", {}).get(side, {})
            tn = t.get("name")
            if tn:
                teams_data[slugify(tn)] = tn

    # Bulk upsert teams (one round-trip)
    team_ids_by_slug = bulk_upsert_teams(conn, league_db_id, teams_data)

    # Bulk insert matches + results
    created, results = bulk_upsert_matches_and_results(
        conn, fixtures, league_db_id, season_db_id, team_ids_by_slug
    )
    print(f"{len(fixtures):>4} API, {created:>4} matches, {results:>4} results")
    return created, results


def main():
    print("=" * 60)
    print("  FAST Historical Backfill (batched inserts)")
    print("  Target: 30 leagues x 6 seasons (2020-21 to 2025-26)")
    print("=" * 60)

    start_time = time.time()
    conn = psycopg2.connect(**DB_CONFIG, connect_timeout=30)
    conn.set_session(autocommit=False)
    client = httpx.Client(timeout=45)

    total_matches = 0
    total_results = 0
    api_calls = 0

    try:
        for season in SEASONS:
            print(f"\n--- SEASON {season}-{season+1} ---")
            for league_id in LEAGUES.keys():
                try:
                    m, r = backfill_league_season(conn, client, league_id, season)
                    total_matches += m
                    total_results += r
                    api_calls += 1
                    time.sleep(0.5)  # rate limit
                except Exception as exc:
                    print(f"    ERROR: {type(exc).__name__}: {str(exc)[:80]}")
                    conn.rollback()
                    time.sleep(2)
    finally:
        client.close()
        conn.close()

    elapsed = time.time() - start_time
    print(f"\n{'=' * 60}")
    print(f"  DONE in {elapsed/60:.1f} min")
    print(f"  New matches: {total_matches}")
    print(f"  New results: {total_results}")
    print(f"  API calls: {api_calls}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
