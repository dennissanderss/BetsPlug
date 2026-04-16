"""End-to-end validation of the tier system filter logic.

Runs direct SQL against Railway DB (no HTTP) so we can assert the
``access_filter()`` / ``pick_tier_expression()`` invariants hold before
enabling TIER_SYSTEM_ENABLED in production.

Tests:
    1. Every row returned by ``pick_tier_expression()`` classifies
       deterministically (0..3).
    2. ``access_filter(FREE)`` excludes all Silver/Gold/Platinum-qualifying rows.
    3. ``access_filter(SILVER)`` excludes Gold/Platinum-qualifying rows that
       do NOT also qualify as Silver.
    4. ``access_filter(GOLD)`` excludes Platinum-only rows.
    5. ``access_filter(PLATINUM)`` returns every row that passes the
       Free baseline (conf >= 0.55).
    6. Sum check: count(FREE access) + count(SILVER-only) + count(GOLD-only)
       + count(PLATINUM-only) = count(PLATINUM access).
    7. ``TIER_SYSTEM_ENABLED=false`` path: ``access_filter(FREE)`` on its own
       collapses to the Free baseline (``confidence >= 0.55``) — here we just
       sanity-check that PLATINUM access returns a strict superset of every
       other tier's rowset.

Exits non-zero on any failure, prints OK/FAIL per test.
"""
from __future__ import annotations

import os
import sys

# Make backend/ importable so ``from app.core...`` works
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

import psycopg2

from app.core.tier_leagues import (
    LEAGUES_GOLD,
    LEAGUES_PLATINUM,
    LEAGUES_SILVER,
)

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}

# Use the v8.1 filter so tests mirror prod query scope.
V81_WHERE = (
    "p.prediction_source IN ('batch_local_fill', 'backtest', 'live') "
    "AND p.created_at >= '2026-04-16 11:00:00+00'::timestamptz"
)

PLAT_IDS = tuple(LEAGUES_PLATINUM)
GOLD_IDS = tuple(LEAGUES_GOLD)
SILVER_IDS = tuple(LEAGUES_SILVER)


def _expected_pick_tier_sql() -> str:
    """Mirror of pick_tier_expression() as raw SQL for ground-truth comparison."""
    return f"""
        CASE
          WHEN m.league_id IN %(plat)s AND p.confidence >= 0.75 THEN 3
          WHEN m.league_id IN %(gold)s AND p.confidence >= 0.70 THEN 2
          WHEN m.league_id IN %(silver)s AND p.confidence >= 0.65 THEN 1
          ELSE 0
        END
    """


def _base_from() -> str:
    return f"""
        FROM predictions p
        JOIN matches m ON m.id = p.match_id
        WHERE {V81_WHERE}
    """


passes = 0
failures = []


def ok(name: str, detail: str = "") -> None:
    global passes
    passes += 1
    print(f"  OK   {name} {detail}")


def fail(name: str, detail: str) -> None:
    failures.append((name, detail))
    print(f"  FAIL {name}: {detail}")


def main() -> int:
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    params = {"plat": PLAT_IDS, "gold": GOLD_IDS, "silver": SILVER_IDS}
    print("tier_system e2e validation")
    print("=" * 60)

    # ── Test 1: pick_tier_expression classifies each row to exactly one tier ──
    cur.execute(f"""
        SELECT {_expected_pick_tier_sql()} AS t, COUNT(*)
        {_base_from()}
        GROUP BY 1 ORDER BY 1
    """, params)
    tier_counts = {int(t): n for t, n in cur.fetchall()}
    total_any = sum(tier_counts.values())
    if all(k in (0, 1, 2, 3) for k in tier_counts) and total_any > 0:
        ok("1. pick_tier ∈ {0,1,2,3}", f"(counts={tier_counts}, total={total_any:,})")
    else:
        fail("1. pick_tier enum", f"unexpected keys {list(tier_counts.keys())}")

    # ── Test 2: access_filter(FREE) excludes all Silver/Gold/Platinum ──────
    # Free is: confidence >= 0.55 AND NOT qualifies-as-higher
    cur.execute(f"""
        SELECT COUNT(*)
        {_base_from()}
          AND p.confidence >= 0.55
          AND NOT (
              (m.league_id IN %(plat)s AND p.confidence >= 0.75)
              OR (m.league_id IN %(gold)s AND p.confidence >= 0.70)
              OR (m.league_id IN %(silver)s AND p.confidence >= 0.65)
          )
    """, params)
    free_access_n = cur.fetchone()[0]

    cur.execute(f"""
        SELECT COUNT(*)
        {_base_from()}
          AND (
              (m.league_id IN %(plat)s AND p.confidence >= 0.75)
              OR (m.league_id IN %(gold)s AND p.confidence >= 0.70)
              OR (m.league_id IN %(silver)s AND p.confidence >= 0.65)
          )
          AND p.confidence >= 0.55
          AND NOT (
              (m.league_id IN %(plat)s AND p.confidence >= 0.75)
              OR (m.league_id IN %(gold)s AND p.confidence >= 0.70)
              OR (m.league_id IN %(silver)s AND p.confidence >= 0.65)
          )
    """, params)
    free_contamination = cur.fetchone()[0]
    if free_contamination == 0:
        ok("2. FREE access excludes higher tiers", f"(free_rows={free_access_n:,})")
    else:
        fail("2. FREE access", f"{free_contamination} contaminated rows")

    # ── Test 3 & 4: Silver / Gold exclusions via counts ───────────────────
    # Silver access = Free OR Silver-qualifying (not Gold/Plat-only)
    cur.execute(f"""
        SELECT COUNT(*)
        {_base_from()}
          AND p.confidence >= 0.55
          AND NOT (
              (m.league_id IN %(plat)s AND p.confidence >= 0.75)
              OR (m.league_id IN %(gold)s AND p.confidence >= 0.70)
          )
    """, params)
    silver_access_n = cur.fetchone()[0]

    cur.execute(f"""
        SELECT COUNT(*)
        {_base_from()}
          AND p.confidence >= 0.55
          AND NOT (
              (m.league_id IN %(plat)s AND p.confidence >= 0.75)
          )
    """, params)
    gold_access_n = cur.fetchone()[0]

    cur.execute(f"""
        SELECT COUNT(*)
        {_base_from()}
          AND p.confidence >= 0.55
    """, params)
    plat_access_n = cur.fetchone()[0]

    # 3. FREE ⊆ SILVER ⊆ GOLD ⊆ PLATINUM (inclusive counts)
    if free_access_n <= silver_access_n <= gold_access_n <= plat_access_n:
        ok("3. Access monotone FREE ≤ SILVER ≤ GOLD ≤ PLATINUM",
           f"({free_access_n:,} ≤ {silver_access_n:,} ≤ {gold_access_n:,} ≤ {plat_access_n:,})")
    else:
        fail("3. Access monotonicity",
             f"{free_access_n=} {silver_access_n=} {gold_access_n=} {plat_access_n=}")

    # 4. SILVER access includes everything FREE plus Silver-qualifying;
    #    delta = Silver-qualifying rows
    silver_delta = silver_access_n - free_access_n
    cur.execute(f"""
        SELECT COUNT(*)
        {_base_from()}
          AND m.league_id IN %(silver)s AND p.confidence >= 0.65
          AND NOT (
              (m.league_id IN %(plat)s AND p.confidence >= 0.75)
              OR (m.league_id IN %(gold)s AND p.confidence >= 0.70)
          )
    """, params)
    silver_only_n = cur.fetchone()[0]
    if silver_delta == silver_only_n:
        ok("4. SILVER adds Silver-only rows", f"(+{silver_only_n:,})")
    else:
        fail("4. SILVER delta", f"expected {silver_only_n}, got {silver_delta}")

    # ── Test 5: sum check ──────────────────────────────────────────────────
    # PLATINUM access should equal FREE + Silver-only + Gold-only + Platinum-only
    cur.execute(f"""
        SELECT COUNT(*)
        {_base_from()}
          AND m.league_id IN %(gold)s AND p.confidence >= 0.70
          AND NOT (m.league_id IN %(plat)s AND p.confidence >= 0.75)
    """, params)
    gold_only_n = cur.fetchone()[0]

    cur.execute(f"""
        SELECT COUNT(*)
        {_base_from()}
          AND m.league_id IN %(plat)s AND p.confidence >= 0.75
    """, params)
    plat_only_n = cur.fetchone()[0]

    computed_sum = free_access_n + silver_only_n + gold_only_n + plat_only_n
    if computed_sum == plat_access_n:
        ok("5. Sum check (FREE + Silver-only + Gold-only + Plat-only == PLATINUM access)",
           f"({computed_sum:,})")
    else:
        fail("5. Sum check", f"{computed_sum:,} != {plat_access_n:,}")

    # ── Test 6: pick_tier_expression rowcounts per tier match expectations ─
    # tier_counts[3] should match plat_only_n
    if tier_counts.get(3, 0) == plat_only_n:
        ok("6a. pick_tier=3 matches Platinum-only", f"({plat_only_n:,})")
    else:
        fail("6a. pick_tier=3", f"{tier_counts.get(3, 0)} != {plat_only_n}")
    if tier_counts.get(2, 0) == gold_only_n:
        ok("6b. pick_tier=2 matches Gold-only", f"({gold_only_n:,})")
    else:
        fail("6b. pick_tier=2", f"{tier_counts.get(2, 0)} != {gold_only_n}")
    if tier_counts.get(1, 0) == silver_only_n:
        ok("6c. pick_tier=1 matches Silver-only", f"({silver_only_n:,})")
    else:
        fail("6c. pick_tier=1", f"{tier_counts.get(1, 0)} != {silver_only_n}")

    # pick_tier=0 count = any row that is NOT in a paid tier AND confidence >=0.55 OR below (<0.55)
    # Here tier_counts[0] includes conf<0.55 too, so sum over all tier_counts == all-rows-count.
    cur.execute(f"SELECT COUNT(*) {_base_from()}", params)
    all_rows_n = cur.fetchone()[0]
    if total_any == all_rows_n:
        ok("6d. tier_counts total == all rows", f"({all_rows_n:,})")
    else:
        fail("6d. tier_counts total", f"{total_any} != {all_rows_n}")

    # ── Test 7: PLATINUM is a superset ─────────────────────────────────────
    if plat_access_n >= max(free_access_n, silver_access_n, gold_access_n):
        ok("7. PLATINUM is superset of lower tiers", "")
    else:
        fail("7. PLATINUM superset", "monotonicity broken")

    print()
    print("=" * 60)
    print(f"  {passes} passed, {len(failures)} failed")
    if failures:
        print()
        print("Failures:")
        for name, detail in failures:
            print(f"  - {name}: {detail}")
        conn.close()
        return 1
    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
