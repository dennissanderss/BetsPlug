"""
Fast Elo training via direct DB connection.
Uses batched inserts via execute_values.
"""
import uuid
from datetime import timedelta
import psycopg2
from psycopg2.extras import execute_values

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}

ELO_K = 20.0
ELO_HOME_ADV = 65.0
ELO_DEFAULT = 1500.0
POST_MATCH_DELAY_HOURS = 3


def main():
    print("=" * 60)
    print("  FAST Elo History Training")
    print("=" * 60)

    conn = psycopg2.connect(**DB_CONFIG, connect_timeout=30)
    cur = conn.cursor()

    # Clear old Elo history
    print("\nClearing old Elo history...")
    cur.execute("DELETE FROM team_elo_history")
    conn.commit()
    print(f"  Cleared {cur.rowcount} rows")

    # Fetch all finished matches chronologically
    print("\nLoading matches...")
    cur.execute("""
        SELECT m.id, m.home_team_id, m.away_team_id, m.scheduled_at,
               r.home_score, r.away_score
        FROM matches m
        JOIN match_results r ON r.match_id = m.id
        WHERE m.status = 'FINISHED'
        ORDER BY m.scheduled_at ASC
    """)
    matches = cur.fetchall()
    print(f"  Loaded {len(matches)} matches")

    # Walk-forward Elo computation
    print("\nComputing Elo ratings...")
    ratings = {}
    rows_to_insert = []

    for match_id, home_id, away_id, scheduled_at, hs, as_ in matches:
        h = str(home_id)
        a = str(away_id)

        r_h_before = ratings.get(h, ELO_DEFAULT)
        r_a_before = ratings.get(a, ELO_DEFAULT)

        # Expected (with home advantage)
        e_h = 1 / (1 + 10 ** ((r_a_before - (r_h_before + ELO_HOME_ADV)) / 400))
        e_a = 1 - e_h

        # Actual
        if hs > as_:
            s_h, s_a = 1.0, 0.0
        elif as_ > hs:
            s_h, s_a = 0.0, 1.0
        else:
            s_h, s_a = 0.5, 0.5

        # New ratings (post-match)
        r_h_after = r_h_before + ELO_K * (s_h - e_h)
        r_a_after = r_a_before + ELO_K * (s_a - e_a)

        ratings[h] = r_h_after
        ratings[a] = r_a_after

        # Effective timestamp: 3 hours after kickoff
        effective_at = scheduled_at + timedelta(hours=POST_MATCH_DELAY_HOURS)

        # Add insert rows for BOTH teams
        rows_to_insert.append((
            str(uuid.uuid4()), home_id, r_h_after, ELO_K,
            effective_at, match_id, 'match_update',
        ))
        rows_to_insert.append((
            str(uuid.uuid4()), away_id, r_a_after, ELO_K,
            effective_at, match_id, 'match_update',
        ))

    print(f"  Computed {len(rows_to_insert)} ratings (2 per match)")

    # Bulk insert in chunks of 5000
    print("\nBulk inserting Elo history...")
    CHUNK_SIZE = 5000
    for i in range(0, len(rows_to_insert), CHUNK_SIZE):
        chunk = rows_to_insert[i:i + CHUNK_SIZE]
        execute_values(cur, """
            INSERT INTO team_elo_history
                (id, team_id, rating, k_factor, effective_at, source_match_id, source_kind)
            VALUES %s
        """, chunk)
        conn.commit()
        print(f"  Inserted {min(i + CHUNK_SIZE, len(rows_to_insert))}/{len(rows_to_insert)}")

    print(f"\n{'=' * 60}")
    print(f"  DONE — {len(rows_to_insert)} Elo ratings stored")
    print(f"  Top 10 teams by current Elo:")
    cur.execute("""
        SELECT t.name, MAX(e.rating) as max_rating
        FROM team_elo_history e
        JOIN teams t ON t.id = e.team_id
        GROUP BY t.name
        ORDER BY max_rating DESC LIMIT 10
    """)
    for name, rating in cur.fetchall():
        print(f"    {name[:30]:30s} {rating:.0f}")
    print(f"{'=' * 60}")

    conn.close()


if __name__ == "__main__":
    main()
