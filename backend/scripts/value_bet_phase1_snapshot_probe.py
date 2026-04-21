"""Probe closing_odds_snapshot JSONB structure on predictions.

The first inventory run reported 79,332 predictions "with snapshot" but
sampled three NULL rows. This script disambiguates: how many rows have
actually populated 1x2 odds inside the JSONB, what keys are in use, and
what the typical structure looks like.
"""
from __future__ import annotations

import json
import psycopg2

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}


def main():
    conn = psycopg2.connect(**DB_CONFIG, connect_timeout=20)
    conn.set_session(readonly=True, autocommit=True)
    cur = conn.cursor()

    # True NULL vs JSON-null vs empty-object vs populated
    cur.execute(
        """
        SELECT
          count(*)                                              AS total,
          count(closing_odds_snapshot)                          AS sql_not_null,
          count(*) FILTER (WHERE closing_odds_snapshot IS NOT NULL
                             AND closing_odds_snapshot::text = 'null')   AS json_null,
          count(*) FILTER (WHERE closing_odds_snapshot IS NOT NULL
                             AND closing_odds_snapshot::text = '{}')      AS empty_obj,
          count(*) FILTER (WHERE closing_odds_snapshot IS NOT NULL
                             AND closing_odds_snapshot::text NOT IN ('null','{}')
                            ) AS populated
          FROM predictions
        """
    )
    total, notnull, json_null, empty, populated = cur.fetchone()
    print(f"total predictions       : {total:,}")
    print(f"  sql-not-null          : {notnull:,}")
    print(f"  json-null             : {json_null:,}")
    print(f"  empty {{}}             : {empty:,}")
    print(f"  populated             : {populated:,}")

    # Sample a populated row
    cur.execute(
        """
        SELECT closing_odds_snapshot
          FROM predictions
         WHERE closing_odds_snapshot IS NOT NULL
           AND closing_odds_snapshot::text NOT IN ('null','{}')
         ORDER BY predicted_at DESC
         LIMIT 5
        """
    )
    rows = cur.fetchall()
    print(f"\nSample populated rows ({len(rows)}):")
    for i, (snap,) in enumerate(rows, 1):
        print(f"\n[{i}] type={type(snap).__name__}")
        print(f"    {json.dumps(snap)[:300]}")

    # Does "populated" imply usable 1x2 odds?
    cur.execute(
        """
        SELECT count(*)
          FROM predictions
         WHERE closing_odds_snapshot ? 'home_odds'
            OR closing_odds_snapshot ? 'odds_home'
            OR closing_odds_snapshot ? 'bookmaker_odds'
            OR closing_odds_snapshot ? '1x2'
        """
    )
    has_1x2 = cur.fetchone()[0]
    print(f"\npredictions met 1x2 keys in snapshot: {has_1x2:,}")

    # Check recent live predictions — they should be the ones with real odds
    cur.execute(
        """
        SELECT count(*)
          FROM predictions
         WHERE prediction_source = 'live'
           AND closing_odds_snapshot IS NOT NULL
           AND closing_odds_snapshot::text NOT IN ('null','{}')
        """
    )
    live_with_snap = cur.fetchone()[0]
    print(f"\nLIVE predictions met populated snapshot: {live_with_snap:,}")

    # For the 189 evaluated-with-odds_history: time distribution
    cur.execute(
        """
        SELECT
          min(p.predicted_at) AS first_pred,
          max(p.predicted_at) AS last_pred,
          min(m.scheduled_at) AS first_match,
          max(m.scheduled_at) AS last_match
          FROM predictions p
          JOIN prediction_evaluations e ON e.prediction_id = p.id
          JOIN matches m ON m.id = p.match_id
          JOIN odds_history o ON o.match_id = p.match_id
         WHERE o.market = '1x2'
           AND o.home_odds IS NOT NULL
           AND o.draw_odds IS NOT NULL
           AND o.away_odds IS NOT NULL
        """
    )
    first_pred, last_pred, first_match, last_match = cur.fetchone()
    print("\nBacktest-pool 189 predictions tijdbereik:")
    print(f"  predicted_at:  {first_pred}  ->  {last_pred}")
    print(f"  scheduled_at:  {first_match}  ->  {last_match}")

    conn.close()


if __name__ == "__main__":
    main()
