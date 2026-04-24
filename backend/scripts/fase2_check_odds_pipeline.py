"""Check: werkt de odds-opslag pipeline voor nieuwe picks?

Drie checks:
1. Hoeveel odds_history rijen zijn er in de laatste 7 dagen bijgekomen?
2. Hoeveel live/backtest predicties van de laatste 7 dagen hebben
   closing_odds_snapshot gevuld?
3. Hoeveel matches in de komende 14 dagen zijn 'apifb_match_' (snapshot job
   verwerkt alleen die prefix) vs 'apifb_' (snapshot job skipt die)?
"""
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}


def main() -> None:
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            print("=" * 70)
            print("CHECK 1: odds_history groei laatste 7 dagen")
            print("=" * 70)
            cur.execute("""
                SELECT DATE(recorded_at) AS day,
                       COUNT(*) AS rows,
                       COUNT(DISTINCT match_id) AS unique_matches,
                       string_agg(DISTINCT market, ', ') AS markets
                FROM odds_history
                WHERE recorded_at >= NOW() - INTERVAL '7 days'
                GROUP BY DATE(recorded_at)
                ORDER BY day DESC
            """)
            for row in cur.fetchall():
                print(f"  {row['day']}  rows={row['rows']:4d}  "
                      f"matches={row['unique_matches']:4d}  markets={row['markets']}")
            print()

            print("=" * 70)
            print("CHECK 2: closing_odds_snapshot op recente predicties")
            print("=" * 70)
            cur.execute("""
                SELECT
                    DATE(p.created_at) AS day,
                    p.prediction_source,
                    COUNT(*) AS total,
                    SUM(CASE WHEN p.closing_odds_snapshot IS NOT NULL THEN 1 ELSE 0 END) AS with_snapshot
                FROM predictions p
                WHERE p.created_at >= NOW() - INTERVAL '7 days'
                GROUP BY DATE(p.created_at), p.prediction_source
                ORDER BY day DESC, p.prediction_source
            """)
            for row in cur.fetchall():
                pct = (row['with_snapshot'] / row['total'] * 100) if row['total'] else 0
                print(f"  {row['day']}  source={row['prediction_source']:20s}  "
                      f"total={row['total']:4d}  snapshot={row['with_snapshot']:4d}  "
                      f"({pct:.1f}%)")
            print()

            print("=" * 70)
            print("CHECK 3: external_id prefix op upcoming matches")
            print("=" * 70)
            cur.execute("""
                SELECT
                    CASE
                        WHEN external_id IS NULL THEN '(null)'
                        WHEN external_id LIKE 'apifb_match_%%' THEN 'apifb_match_ (scheduler OK)'
                        WHEN external_id LIKE 'apifb_%%' THEN 'apifb_ (scheduler SKIPS!)'
                        ELSE 'other'
                    END AS prefix,
                    COUNT(*) AS n
                FROM matches
                WHERE scheduled_at >= NOW()
                  AND scheduled_at <= NOW() + INTERVAL '14 days'
                GROUP BY prefix
                ORDER BY n DESC
            """)
            for row in cur.fetchall():
                print(f"  {row['prefix']:40s}  {row['n']:4d}")
            print()

            print("=" * 70)
            print("CHECK 4: laatste 5 live predicties — heeft elke pick odds?")
            print("=" * 70)
            cur.execute("""
                SELECT
                    p.id,
                    p.created_at,
                    p.prediction_source,
                    m.external_id,
                    CASE WHEN p.closing_odds_snapshot IS NOT NULL THEN 'YES' ELSE 'NO' END AS has_snap,
                    CASE WHEN p.closing_odds_snapshot IS NOT NULL
                         THEN p.closing_odds_snapshot->>'source'
                         ELSE NULL END AS snap_source
                FROM predictions p
                JOIN matches m ON m.id = p.match_id
                WHERE p.prediction_source = 'live'
                ORDER BY p.created_at DESC
                LIMIT 5
            """)
            for row in cur.fetchall():
                print(f"  {row['created_at']}  "
                      f"ext={row['external_id']}  "
                      f"snap={row['has_snap']}  src={row['snap_source']}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
