"""Fase 2 risico-analyse (read-only).

Runs 5 risk probes against Railway DB:
  2.1 data quality:  snapshot-to-kickoff lag, created_at vs updated_at,
                     coverage by source/market.
  2.2 kalibratie:    predicted-prob bucket vs actual hit rate per tier.
  2.3 survivorship:  populated-snapshot subset vs full population —
                     league, tier, source distribution.
  2.4 line-movement: per-match odds spread across snapshots (max-min).
  2.5 operationeel:  freshness of latest odds row, gap-days, volume.

Safe to re-run. No writes.
"""
from __future__ import annotations

import psycopg2
from collections import defaultdict

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}


def section(title):
    print()
    print("=" * 72)
    print(title)
    print("=" * 72)


def q(cur, sql, params=None):
    cur.execute(sql, params or ())
    return cur.fetchall()


def main():
    conn = psycopg2.connect(**DB_CONFIG, connect_timeout=20)
    conn.set_session(readonly=True, autocommit=True)
    cur = conn.cursor()

    # ── 2.1 DATA KWALITEIT ──────────────────────────────────────────────────
    section("2.1 DATA KWALITEIT")

    # How far pre-match is each odds row? (hours before kickoff)
    rows = q(cur, """
        SELECT
          count(*) AS n,
          round(avg(EXTRACT(EPOCH FROM (m.scheduled_at - o.recorded_at))/3600.0)::numeric, 2) AS avg_hrs,
          round(min(EXTRACT(EPOCH FROM (m.scheduled_at - o.recorded_at))/3600.0)::numeric, 2) AS min_hrs,
          round(max(EXTRACT(EPOCH FROM (m.scheduled_at - o.recorded_at))/3600.0)::numeric, 2) AS max_hrs
        FROM odds_history o
        JOIN matches m ON m.id = o.match_id
        WHERE o.market = '1x2'
    """)
    n, avg_h, min_h, max_h = rows[0]
    print(f"1x2 odds rows: n={n}")
    print(f"  lead-time (uren voor kickoff):")
    print(f"    avg  : {avg_h}")
    print(f"    min  : {min_h}   (negative = after kickoff!)")
    print(f"    max  : {max_h}")

    # How many odds rows recorded <1h pre-kickoff (closing-line proxy)
    rows = q(cur, """
        SELECT count(*) FROM odds_history o
        JOIN matches m ON m.id = o.match_id
        WHERE o.market = '1x2'
          AND o.recorded_at BETWEEN m.scheduled_at - INTERVAL '1 hour' AND m.scheduled_at
    """)
    print(f"  rows binnen 1h voor kickoff (closing-proxy): {rows[0][0]}")

    rows = q(cur, """
        SELECT count(*) FROM odds_history o
        JOIN matches m ON m.id = o.match_id
        WHERE o.market = '1x2'
          AND o.recorded_at < m.scheduled_at - INTERVAL '24 hour'
    """)
    print(f"  rows >24h voor kickoff                      : {rows[0][0]}")

    # Were predictions stamped AFTER kickoff (backtest vs live)?
    rows = q(cur, """
        SELECT prediction_source, count(*) AS n,
               avg(lead_time_hours)::numeric(10,2) AS avg_lead,
               min(lead_time_hours)::numeric(10,2) AS min_lead,
               max(lead_time_hours)::numeric(10,2) AS max_lead
          FROM predictions
         WHERE lead_time_hours IS NOT NULL
         GROUP BY prediction_source
         ORDER BY 2 DESC
    """)
    print("\nPrediction lead-time per source:")
    print(f"{'source':<20} {'n':>8} {'avg_hrs':>10} {'min_hrs':>10} {'max_hrs':>10}")
    for src, n, a, mn, mx in rows:
        print(f"{(src or '-'):<20} {n:>8,} {str(a):>10} {str(mn):>10} {str(mx):>10}")

    # ── 2.2 MODEL KALIBRATIE ────────────────────────────────────────────────
    section("2.2 MODEL KALIBRATIE — predicted prob vs actual hit rate")

    # Build buckets from the max-prob pick on evaluated predictions
    cur.execute("""
        SELECT GREATEST(p.home_win_prob, COALESCE(p.draw_prob,0), p.away_win_prob) AS max_prob,
               CASE
                 WHEN p.home_win_prob = GREATEST(p.home_win_prob, COALESCE(p.draw_prob,0), p.away_win_prob) THEN 'home'
                 WHEN p.away_win_prob = GREATEST(p.home_win_prob, COALESCE(p.draw_prob,0), p.away_win_prob) THEN 'away'
                 ELSE 'draw'
               END AS pick,
               e.actual_outcome,
               p.confidence
          FROM predictions p
          JOIN prediction_evaluations e ON e.prediction_id = p.id
          JOIN matches m ON m.id = p.match_id
         WHERE p.prediction_source IN ('live','batch_local_fill','backtest')
    """)
    buckets = defaultdict(lambda: [0, 0])  # range -> [total, correct]
    ranges = [(0.45,0.50),(0.50,0.55),(0.55,0.60),(0.60,0.65),(0.65,0.70),
              (0.70,0.75),(0.75,0.80),(0.80,0.85),(0.85,1.01)]
    for max_prob, pick, actual, conf in cur.fetchall():
        for lo, hi in ranges:
            if lo <= max_prob < hi:
                key = f"{int(lo*100)}-{int(hi*100)}"
                buckets[key][0] += 1
                if pick == actual:
                    buckets[key][1] += 1
                break

    print(f"{'bucket':<10} {'n':>7} {'hit%':>7} {'expected_hit%':>15} {'delta':>8}")
    print("-" * 55)
    for lo, hi in ranges:
        key = f"{int(lo*100)}-{int(hi*100)}"
        tot, cor = buckets[key]
        if tot == 0:
            continue
        hit = cor/tot*100
        exp = (lo+hi)/2*100  # midpoint
        delta = hit - exp
        print(f"{key:<10} {tot:>7} {hit:>6.1f}% {exp:>13.1f}% {delta:>+7.1f}")

    # Kalibratie on POPULATED-SNAPSHOT subset only (the value-bet pool)
    print("\nZelfde buckets, beperkt tot populated-snapshot pool:")
    cur.execute("""
        SELECT GREATEST(p.home_win_prob, COALESCE(p.draw_prob,0), p.away_win_prob) AS max_prob,
               CASE
                 WHEN p.home_win_prob = GREATEST(p.home_win_prob, COALESCE(p.draw_prob,0), p.away_win_prob) THEN 'home'
                 WHEN p.away_win_prob = GREATEST(p.home_win_prob, COALESCE(p.draw_prob,0), p.away_win_prob) THEN 'away'
                 ELSE 'draw'
               END AS pick,
               e.actual_outcome
          FROM predictions p
          JOIN prediction_evaluations e ON e.prediction_id = p.id
         WHERE p.closing_odds_snapshot IS NOT NULL
           AND p.closing_odds_snapshot::text NOT IN ('null','{}')
    """)
    buckets2 = defaultdict(lambda: [0, 0])
    for max_prob, pick, actual in cur.fetchall():
        for lo, hi in ranges:
            if lo <= max_prob < hi:
                key = f"{int(lo*100)}-{int(hi*100)}"
                buckets2[key][0] += 1
                if pick == actual:
                    buckets2[key][1] += 1
                break
    print(f"{'bucket':<10} {'n':>7} {'hit%':>7} {'expected%':>11} {'delta':>8}")
    print("-" * 50)
    for lo, hi in ranges:
        key = f"{int(lo*100)}-{int(hi*100)}"
        tot, cor = buckets2[key]
        if tot == 0:
            continue
        hit = cor/tot*100
        exp = (lo+hi)/2*100
        print(f"{key:<10} {tot:>7} {hit:>6.1f}% {exp:>10.1f}% {(hit-exp):>+7.1f}")

    # ── 2.3 SURVIVORSHIP ────────────────────────────────────────────────────
    section("2.3 SURVIVORSHIP — populated subset vs volledige populatie")

    # Source distribution
    rows = q(cur, """
        SELECT prediction_source,
               count(*) AS total,
               count(*) FILTER (
                 WHERE closing_odds_snapshot IS NOT NULL
                   AND closing_odds_snapshot::text NOT IN ('null','{}')
               ) AS populated
          FROM predictions
          GROUP BY prediction_source
          ORDER BY total DESC
    """)
    print("prediction_source coverage:")
    print(f"{'source':<20} {'total':>10} {'populated':>12} {'pct':>8}")
    for src, tot, pop in rows:
        pct = pop/tot*100 if tot else 0
        print(f"{(src or '-'):<20} {tot:>10,} {pop:>12,} {pct:>7.2f}%")

    # League coverage in populated subset vs total
    rows = q(cur, """
        WITH cov AS (
            SELECT l.name AS league,
                   count(*) AS total,
                   count(*) FILTER (
                     WHERE p.closing_odds_snapshot IS NOT NULL
                       AND p.closing_odds_snapshot::text NOT IN ('null','{}')
                   ) AS populated
              FROM predictions p
              JOIN matches m ON m.id = p.match_id
              JOIN leagues l ON l.id = m.league_id
              GROUP BY l.name
        )
        SELECT league, total, populated FROM cov
         WHERE populated > 0
         ORDER BY populated DESC
         LIMIT 15
    """)
    print("\nLeague coverage (populated subset, top-15):")
    print(f"{'league':<35} {'total':>8} {'populated':>11} {'pct':>7}")
    for league, tot, pop in rows:
        pct = pop/tot*100 if tot else 0
        print(f"{(league or '-'):<35} {tot:>8,} {pop:>11,} {pct:>6.1f}%")

    # ── 2.4 LINE MOVEMENT ───────────────────────────────────────────────────
    section("2.4 LINE MOVEMENT — odds spread across snapshots per match")

    rows = q(cur, """
        WITH stats AS (
            SELECT match_id,
                   count(*)         AS snap_n,
                   max(home_odds)   AS h_max, min(home_odds) AS h_min,
                   max(draw_odds)   AS d_max, min(draw_odds) AS d_min,
                   max(away_odds)   AS a_max, min(away_odds) AS a_min
              FROM odds_history
             WHERE market = '1x2'
               AND home_odds IS NOT NULL
             GROUP BY match_id
            HAVING count(*) >= 2
        )
        SELECT count(*) AS matches_with_movement,
               round(avg(h_max - h_min)::numeric, 3) AS avg_home_spread,
               round(avg(d_max - d_min)::numeric, 3) AS avg_draw_spread,
               round(avg(a_max - a_min)::numeric, 3) AS avg_away_spread,
               round(max(h_max - h_min)::numeric, 3) AS max_home_spread,
               round(max(a_max - a_min)::numeric, 3) AS max_away_spread
          FROM stats
    """)
    if rows and rows[0][0]:
        n, h, d, a, mx_h, mx_a = rows[0]
        print(f"matches met ≥2 snapshots : {n:,}")
        print(f"  avg home-odds spread   : {h}")
        print(f"  avg draw-odds spread   : {d}")
        print(f"  avg away-odds spread   : {a}")
        print(f"  max home-odds spread   : {mx_h}")
        print(f"  max away-odds spread   : {mx_a}")
        print("Interpretatie: kleine spread => live-vs-backtest gap beperkt")

    # ── 2.5 OPERATIONEEL ────────────────────────────────────────────────────
    section("2.5 OPERATIONEEL — freshness + cadence")

    rows = q(cur, """
        SELECT date_trunc('day', recorded_at) AS day,
               count(*) AS rows
          FROM odds_history
         WHERE market = '1x2'
         GROUP BY 1
         ORDER BY 1
    """)
    print("Odds-rows per dag (1x2):")
    for day, n in rows:
        print(f"  {day.date()}: {n:>5}")

    # Latest row across sources
    rows = q(cur, """
        SELECT source, max(recorded_at) AS last_row
          FROM odds_history
         GROUP BY source
         ORDER BY 2 DESC
    """)
    print("\nLatest recorded_at per source:")
    for src, last in rows:
        print(f"  {src:<25} {last}")

    # Prediction volume per day (for context)
    rows = q(cur, """
        SELECT date_trunc('day', predicted_at) AS day,
               count(*) AS n_predictions,
               count(*) FILTER (
                 WHERE closing_odds_snapshot IS NOT NULL
                   AND closing_odds_snapshot::text NOT IN ('null','{}')
               ) AS populated
          FROM predictions
         WHERE predicted_at >= '2026-04-14'
         GROUP BY 1
         ORDER BY 1
    """)
    print("\nPredictions per dag (met populated-snapshot count):")
    for day, n, pop in rows:
        print(f"  {day.date()}: {n:>5} preds   {pop:>5} populated")

    conn.close()
    print()
    print("[OK] Risico-analyse klaar.")


if __name__ == "__main__":
    main()
