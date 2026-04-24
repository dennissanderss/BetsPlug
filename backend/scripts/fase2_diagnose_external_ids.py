"""Waarom vond de pilot maar 1 row? Diagnose external_id prefixes.

Telt per prefix hoeveel matches zonder 1x2-odds eronder vallen,
zodat we weten of/hoe we ze kunnen backfillen.
"""
from __future__ import annotations

import sys
from collections import defaultdict

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
            # 1) Hoeveel predicties onder trackrecord_filter (3318 verwacht)
            cur.execute("""
                SELECT COUNT(*) AS n
                FROM predictions p
                JOIN prediction_evaluations pe ON pe.prediction_id = p.id
                JOIN matches m ON m.id = p.match_id
                WHERE p.prediction_source IN ('batch_local_fill','backtest','live')
                  AND p.created_at >= '2026-04-16 11:00:00+00'
                  AND p.predicted_at <= m.scheduled_at
            """)
            total_filter = cur.fetchone()["n"]

            # 2) Hoeveel daarvan hebben odds_history 1x2
            cur.execute("""
                SELECT COUNT(*) AS n
                FROM predictions p
                JOIN prediction_evaluations pe ON pe.prediction_id = p.id
                JOIN matches m ON m.id = p.match_id
                JOIN (SELECT DISTINCT match_id FROM odds_history WHERE market IN ('1x2','1X2')) oh
                  ON oh.match_id = p.match_id
                WHERE p.prediction_source IN ('batch_local_fill','backtest','live')
                  AND p.created_at >= '2026-04-16 11:00:00+00'
                  AND p.predicted_at <= m.scheduled_at
            """)
            with_odds = cur.fetchone()["n"]

            # 3) Voor predicties ZONDER 1x2 odds: tel external_id prefixes
            cur.execute("""
                SELECT
                    CASE
                      WHEN m.external_id IS NULL THEN '(null)'
                      WHEN m.external_id LIKE 'apifb_match_%%' THEN 'apifb_match_'
                      WHEN m.external_id LIKE 'apifb_%%' THEN 'apifb_other'
                      WHEN m.external_id LIKE 'fd_%%' THEN 'fd_'
                      WHEN m.external_id LIKE 'tsdb_%%' THEN 'tsdb_'
                      WHEN m.external_id LIKE 'olDB_%%' THEN 'olDB_'
                      WHEN m.external_id LIKE 'sample_%%' THEN 'sample_'
                      ELSE 'other'
                    END AS prefix,
                    COUNT(*) AS n
                FROM predictions p
                JOIN prediction_evaluations pe ON pe.prediction_id = p.id
                JOIN matches m ON m.id = p.match_id
                LEFT JOIN (SELECT DISTINCT match_id FROM odds_history WHERE market IN ('1x2','1X2')) oh
                    ON oh.match_id = p.match_id
                WHERE p.prediction_source IN ('batch_local_fill','backtest','live')
                  AND p.created_at >= '2026-04-16 11:00:00+00'
                  AND p.predicted_at <= m.scheduled_at
                  AND oh.match_id IS NULL
                GROUP BY prefix
                ORDER BY n DESC
            """)
            prefixes = cur.fetchall()

            # 4) Sample 5 non-apifb matches om te zien wat er staat
            cur.execute("""
                SELECT DISTINCT m.external_id, m.scheduled_at, l.name AS league
                FROM predictions p
                JOIN prediction_evaluations pe ON pe.prediction_id = p.id
                JOIN matches m ON m.id = p.match_id
                LEFT JOIN leagues l ON l.id = m.league_id
                LEFT JOIN (SELECT DISTINCT match_id FROM odds_history WHERE market IN ('1x2','1X2')) oh
                    ON oh.match_id = p.match_id
                WHERE p.prediction_source IN ('batch_local_fill','backtest','live')
                  AND p.created_at >= '2026-04-16 11:00:00+00'
                  AND p.predicted_at <= m.scheduled_at
                  AND oh.match_id IS NULL
                  AND (m.external_id IS NULL OR m.external_id NOT LIKE 'apifb_match_%%')
                LIMIT 10
            """)
            samples = cur.fetchall()

        print(f"\nTotaal predicties onder trackrecord_filter: {total_filter}")
        print(f"Daarvan MET 1x2 odds in odds_history:        {with_odds}")
        print(f"Daarvan ZONDER 1x2 odds:                      {total_filter - with_odds}")
        print(f"\nExternal_id prefix distributie (zonder odds):")
        for row in prefixes:
            print(f"  {row['prefix']:20s} {row['n']:6d}")
        print(f"\nSample van 10 niet-apifb-matches:")
        for s in samples:
            print(f"  {s['external_id']}  {s['scheduled_at']}  {s['league']}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
