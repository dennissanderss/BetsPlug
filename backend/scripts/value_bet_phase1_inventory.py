"""Fase 1.1 — Odds data inventarisatie (read-only).

Queries Railway DB to understand odds coverage, bookmaker sources, line
movement availability and overlap with predictions. No writes. Safe to
run repeatedly. Produces a plain-text report to stdout.
"""
from __future__ import annotations

import sys
from collections import defaultdict

import psycopg2

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}


def q(cur, sql, params=None):
    cur.execute(sql, params or ())
    return cur.fetchall()


def section(title):
    print()
    print("=" * 72)
    print(title)
    print("=" * 72)


def main():
    conn = psycopg2.connect(**DB_CONFIG, connect_timeout=20)
    conn.set_session(readonly=True, autocommit=True)
    cur = conn.cursor()

    # ── 1. TABLE SHAPES ──────────────────────────────────────────────────────
    section("1. TABEL-INVENTARISATIE")
    rows = q(cur, "SELECT count(*) FROM odds_history")
    total_odds = rows[0][0]
    print(f"odds_history rows: {total_odds:,}")

    rows = q(cur, "SELECT count(*) FROM predictions")
    total_pred = rows[0][0]
    print(f"predictions rows:  {total_pred:,}")

    rows = q(cur, "SELECT count(*) FROM prediction_evaluations")
    total_eval = rows[0][0]
    print(f"prediction_evaluations rows: {total_eval:,}")

    rows = q(cur, "SELECT count(*) FROM matches")
    total_match = rows[0][0]
    print(f"matches rows: {total_match:,}")

    # ── 2. ODDS HISTORY BREAKDOWN ────────────────────────────────────────────
    section("2. ODDS_HISTORY: sources, markets, tijd-bereik")
    rows = q(
        cur,
        """
        SELECT source, market, count(*) AS n,
               min(recorded_at) AS first_seen,
               max(recorded_at) AS last_seen
        FROM odds_history
        GROUP BY source, market
        ORDER BY n DESC
        LIMIT 40
        """,
    )
    print(f"{'source':<30} {'market':<20} {'count':>8}  first_seen -> last_seen")
    print("-" * 100)
    for source, market, n, first_seen, last_seen in rows:
        print(
            f"{(source or '-'):<30} {(market or '-'):<20} {n:>8}  "
            f"{first_seen} -> {last_seen}"
        )

    # ── 3. PREDICTIONS met closing_odds_snapshot ─────────────────────────────
    section("3. PREDICTIONS met closing_odds_snapshot (v7 honesty field)")
    rows = q(
        cur,
        """
        SELECT count(*)
          FROM predictions
         WHERE closing_odds_snapshot IS NOT NULL
           AND closing_odds_snapshot::text <> '{}'::text
        """,
    )
    snap = rows[0][0]
    pct = (snap / total_pred * 100) if total_pred else 0
    print(f"predictions MET snapshot: {snap:,} / {total_pred:,} ({pct:.1f}%)")

    rows = q(
        cur,
        """
        SELECT prediction_source, count(*)
          FROM predictions
         GROUP BY prediction_source
         ORDER BY 2 DESC
        """,
    )
    print("\nVerdeling prediction_source:")
    for src, n in rows:
        print(f"  {src or 'NULL':<12}: {n:,}")

    # ── 4. OVERLAP: predictions met 1x2 odds in odds_history ────────────────
    section("4. OVERLAP: predictions die minstens één 1x2 odds-row hebben")
    rows = q(
        cur,
        """
        SELECT count(DISTINCT p.id)
          FROM predictions p
          JOIN odds_history o ON o.match_id = p.match_id
         WHERE o.market = '1x2'
           AND o.home_odds IS NOT NULL
           AND o.draw_odds IS NOT NULL
           AND o.away_odds IS NOT NULL
        """,
    )
    overlap = rows[0][0]
    print(f"predictions met ≥1 1x2 odds-row: {overlap:,} / {total_pred:,}")

    # Predictions met odds_history row én evaluatie
    rows = q(
        cur,
        """
        SELECT count(DISTINCT p.id)
          FROM predictions p
          JOIN prediction_evaluations e ON e.prediction_id = p.id
          JOIN odds_history o ON o.match_id = p.match_id
         WHERE o.market = '1x2'
           AND o.home_odds IS NOT NULL
           AND o.draw_odds IS NOT NULL
           AND o.away_odds IS NOT NULL
        """,
    )
    backtest_pool = rows[0][0]
    print(f"EVALUATED predictions met 1x2 odds: {backtest_pool:,}  ← backtest-pool")

    # ── 5. LINE MOVEMENT CHECK ──────────────────────────────────────────────
    section("5. LIJNBEWEGING CHECK: matches met >1 snapshot per (source, market)")
    rows = q(
        cur,
        """
        SELECT
          count(*) FILTER (WHERE snap_count = 1) AS one_snap,
          count(*) FILTER (WHERE snap_count BETWEEN 2 AND 3) AS two_three,
          count(*) FILTER (WHERE snap_count BETWEEN 4 AND 10) AS four_ten,
          count(*) FILTER (WHERE snap_count > 10) AS more_ten,
          max(snap_count) AS max_snap
        FROM (
            SELECT match_id, source, market, count(*) AS snap_count
              FROM odds_history
             WHERE market = '1x2'
             GROUP BY match_id, source, market
        ) s
        """,
    )
    one, twothree, fourten, more, maxs = rows[0]
    print(f"(match,source,market) groepen met snapshot-count:")
    print(f"  1 snapshot       : {one:,}")
    print(f"  2-3 snapshots    : {twothree:,}")
    print(f"  4-10 snapshots   : {fourten:,}")
    print(f"  >10 snapshots    : {more:,}")
    print(f"  max snapshots    : {maxs}")

    # ── 6. PRE-KICKOFF CHECK ────────────────────────────────────────────────
    section("6. PRE-KICKOFF: welk % van odds-rows is VÓÓR scheduled_at?")
    rows = q(
        cur,
        """
        SELECT
          count(*) AS total,
          count(*) FILTER (WHERE o.recorded_at <= m.scheduled_at) AS pre,
          count(*) FILTER (WHERE o.recorded_at > m.scheduled_at) AS post
        FROM odds_history o
        JOIN matches m ON m.id = o.match_id
        WHERE o.market = '1x2'
        """,
    )
    tot, pre, post = rows[0]
    print(f"1x2 odds rows totaal: {tot:,}")
    print(f"  pre-kickoff : {pre:,} ({(pre/tot*100 if tot else 0):.1f}%)")
    print(f"  post-kickoff: {post:,} ({(post/tot*100 if tot else 0):.1f}%)")

    # ── 7. COVERAGE PER LEAGUE ──────────────────────────────────────────────
    section("7. COVERAGE PER LEAGUE (top-20 by evaluated-pred-with-odds)")
    rows = q(
        cur,
        """
        SELECT l.name,
               count(DISTINCT p.id) AS preds_with_odds_and_eval
          FROM predictions p
          JOIN prediction_evaluations e ON e.prediction_id = p.id
          JOIN matches m ON m.id = p.match_id
          JOIN leagues l ON l.id = m.league_id
          JOIN odds_history o ON o.match_id = p.match_id
         WHERE o.market = '1x2'
           AND o.home_odds IS NOT NULL
           AND o.draw_odds IS NOT NULL
           AND o.away_odds IS NOT NULL
         GROUP BY l.name
         ORDER BY 2 DESC
         LIMIT 20
        """,
    )
    print(f"{'league':<45} {'evaluated_with_odds':>22}")
    print("-" * 70)
    for name, n in rows:
        print(f"{(name or '-'):<45} {n:>22,}")

    # ── 8. SAMPLE: CLOSING_ODDS_SNAPSHOT STRUCTURE ──────────────────────────
    section("8. SAMPLE: structuur van closing_odds_snapshot JSONB")
    rows = q(
        cur,
        """
        SELECT closing_odds_snapshot
          FROM predictions
         WHERE closing_odds_snapshot IS NOT NULL
           AND closing_odds_snapshot::text <> '{}'::text
         LIMIT 3
        """,
    )
    for i, (snap,) in enumerate(rows, 1):
        print(f"\n[{i}] {snap}")

    conn.close()
    print()
    print("[OK] Inventarisatie klaar.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
