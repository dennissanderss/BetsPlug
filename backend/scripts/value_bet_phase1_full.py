"""Fase 1 — volledige data-analyse voor value-bet engine (read-only).

Beantwoordt de 8 sub-vragen uit de Fase-1 brief:
  1.1 Odds-data inventarisatie (tabellen, bookmakers, coverage per league)
  1.2 Implied-probability methodologie (proportional vs shin vs power)
  1.3 Edge-distributie (histogram, per tier, per league)
  1.4 Kalibratie per tier + Brier score
  1.5 Threshold-backtest (3/5/8/10/15%) met Sharpe + drawdown
  1.6 Odds-range filter (1.50-2 / 2-3 / 3-5)
  1.7 Tier-filter (alle / Gold+ / Platinum)
  1.8 Conclusie-data (samenvatting)

Safe to re-run. No writes.
"""
from __future__ import annotations

import math
import statistics
from collections import defaultdict

import psycopg2

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}

# Platinum/Gold/Silver league whitelists (hardcoded from tier_leagues.py)
LEAGUES_PLATINUM = {
    "e0efa138-7f03-4c60-bcbc-c463f3842438",
    "137edd72-3ef0-4e4a-9708-63c30df6ce1e",
    "f2b51cb0-733d-4f79-863f-cd510fd17311",
    "dc5763a2-0da9-4a13-8d6c-1c0ce6b2cc4c",
    "449aa2d2-74e9-4cfb-a32a-efea876d54b9",
}
LEAGUES_GOLD = LEAGUES_PLATINUM | {
    "f71b7c32-9f4a-41d6-b5ad-8a28b670f2bc",
    "81998369-31b7-4d92-9b63-4d071190c9c5",
    "38fa627e-169e-4631-a646-ff6649ed5864",
    "c14d2d79-979f-4ddb-b8b5-8195725fe121",
    "c12726e4-bc51-45b8-9cc7-685d958c30f5",
}
LEAGUES_SILVER = LEAGUES_GOLD | {
    "43106ec3-111e-4a37-a415-9e0b20bd3590",
    "4acd5222-802e-454e-b415-e9c1af26961d",
    "00cdab5a-7846-4a6c-96d2-62d5ed12e305",
    "26d8d924-e0dd-4251-81da-82c7a0a6dce9",
}
CONF_MIN = {"free": 0.55, "silver": 0.65, "gold": 0.70, "platinum": 0.75}


def section(title: str) -> None:
    print()
    print("=" * 76)
    print(title)
    print("=" * 76)


def q(cur, sql, params=None):
    cur.execute(sql, params or ())
    return cur.fetchall()


def classify_tier(league_id: str, confidence: float) -> str | None:
    lid = str(league_id)
    if lid in LEAGUES_PLATINUM and confidence >= CONF_MIN["platinum"]:
        return "platinum"
    if lid in LEAGUES_GOLD and confidence >= CONF_MIN["gold"]:
        return "gold"
    if lid in LEAGUES_SILVER and confidence >= CONF_MIN["silver"]:
        return "silver"
    if lid in LEAGUES_SILVER and confidence >= CONF_MIN["free"]:
        return "free"
    return None


def wilson_ci(correct: int, total: int, z: float = 1.96) -> tuple[float, float]:
    if total == 0:
        return (0.0, 0.0)
    p = correct / total
    denom = 1 + z * z / total
    center = (p + z * z / (2 * total)) / denom
    margin = (z / denom) * math.sqrt(p * (1 - p) / total + z * z / (4 * total * total))
    return (max(0.0, center - margin), min(1.0, center + margin))


def max_drawdown(pnl_series: list[float]) -> float:
    """Max drawdown over cumulative P/L series."""
    if not pnl_series:
        return 0.0
    cum = 0.0
    peak = 0.0
    dd = 0.0
    for p in pnl_series:
        cum += p
        peak = max(peak, cum)
        dd = min(dd, cum - peak)
    return dd  # negative number (worst run-down in units)


def sharpe(returns: list[float]) -> float | None:
    if len(returns) < 2:
        return None
    m = statistics.mean(returns)
    s = statistics.stdev(returns)
    if s == 0:
        return None
    return m / s * math.sqrt(len(returns))


def main():
    conn = psycopg2.connect(**DB_CONFIG, connect_timeout=20)
    conn.set_session(readonly=True, autocommit=True)
    cur = conn.cursor()

    # ── 1.1 ODDS INVENTARISATIE ─────────────────────────────────────────────
    section("1.1 ODDS-DATA INVENTARISATIE")

    # Bookmaker-lijst
    rows = q(cur, """
        SELECT source,
               count(*) AS n_rows,
               min(recorded_at) AS first_seen,
               max(recorded_at) AS last_seen
          FROM odds_history
         WHERE market = '1x2'
         GROUP BY source
    """)
    print(f"{'bookmaker':<25} {'n_rows':>8} {'first':<25} {'last':<25}")
    for src, n, fst, lst in rows:
        print(f"{src:<25} {n:>8} {str(fst):<25} {str(lst):<25}")

    # Coverage top-5 / top-10 / top-14
    cur.execute("""
        SELECT count(DISTINCT p.id)
          FROM predictions p
          JOIN matches m ON m.id = p.match_id
          JOIN odds_history o ON o.match_id = p.match_id
         WHERE o.market = '1x2'
           AND o.home_odds IS NOT NULL
           AND m.league_id::text = ANY(%s)
    """, (list(LEAGUES_PLATINUM),))
    plat = cur.fetchone()[0]
    cur.execute("""
        SELECT count(DISTINCT p.id)
          FROM predictions p
          JOIN matches m ON m.id = p.match_id
          JOIN odds_history o ON o.match_id = p.match_id
         WHERE o.market = '1x2'
           AND m.league_id::text = ANY(%s)
    """, (list(LEAGUES_GOLD),))
    gold = cur.fetchone()[0]
    cur.execute("""
        SELECT count(DISTINCT p.id)
          FROM predictions p
          JOIN matches m ON m.id = p.match_id
          JOIN odds_history o ON o.match_id = p.match_id
         WHERE o.market = '1x2'
           AND m.league_id::text = ANY(%s)
    """, (list(LEAGUES_SILVER),))
    silv = cur.fetchone()[0]
    print()
    print(f"predictions met 1x2 odds in top-5 (Platinum):  {plat}")
    print(f"predictions met 1x2 odds in top-10 (Gold+):   {gold}")
    print(f"predictions met 1x2 odds in top-14 (Silver+): {silv}")

    # ── 1.2 IMPLIED METHODOLOGIE — per-bookmaker marge ──────────────────────
    section("1.2 BOOKMAKER MARGES (proportional normalization voorbeeld)")

    rows = q(cur, """
        SELECT source,
               avg(1.0/home_odds + 1.0/draw_odds + 1.0/away_odds - 1.0) AS avg_margin,
               percentile_disc(0.5) WITHIN GROUP (
                 ORDER BY 1.0/home_odds + 1.0/draw_odds + 1.0/away_odds - 1.0
               ) AS median_margin,
               percentile_disc(0.95) WITHIN GROUP (
                 ORDER BY 1.0/home_odds + 1.0/draw_odds + 1.0/away_odds - 1.0
               ) AS p95_margin,
               count(*) AS n
          FROM odds_history
         WHERE market = '1x2'
           AND home_odds > 1 AND draw_odds > 1 AND away_odds > 1
         GROUP BY source
    """)
    print(f"{'bookmaker':<25} {'avg_margin':>11} {'median':>8} {'p95':>8} {'n':>6}")
    for src, avg_m, med_m, p95_m, n in rows:
        print(
            f"{src:<25} {avg_m*100:>10.2f}% {med_m*100:>7.2f}% "
            f"{p95_m*100:>7.2f}% {n:>6}"
        )

    # Normalisatie-keuze: check of proportional en shin-like methods
    # verschillen geven in fair prob op een sample van 200 rijen.
    cur.execute("""
        SELECT home_odds, draw_odds, away_odds
          FROM odds_history
         WHERE market = '1x2'
           AND home_odds > 1 AND draw_odds > 1 AND away_odds > 1
         LIMIT 200
    """)
    props, shins = [], []
    for ho, do, ao in cur.fetchall():
        rh, rd, ra = 1/ho, 1/do, 1/ao
        ov = rh + rd + ra
        # Proportional
        ph = rh / ov
        # Shin (simplified — single-stage approx)
        # z approximation: z = overround - 1
        z = ov - 1
        # Shin-adjusted fair prob (for 1X2 approx):
        sh = (math.sqrt(z*z + 4 * (1 - z) * rh * rh / ov) - z) / (2 * (1 - z)) if z < 1 else ph
        props.append(ph)
        shins.append(sh if 0 < sh < 1 else ph)
    diff = [abs(p - s) for p, s in zip(props, shins)]
    print()
    print(f"Proportional vs Shin verschil op n=200 rijen:")
    print(f"  mean |diff|  : {statistics.mean(diff)*100:.3f}%")
    print(f"  max  |diff|  : {max(diff)*100:.3f}%")
    print("  -> Proportional is praktisch voldoende bij de gemeten marges")

    # ── 1.4 KALIBRATIE PER TIER + BRIER ─────────────────────────────────────
    section("1.4 KALIBRATIE PER TIER (incl. Brier score)")

    cur.execute("""
        SELECT p.home_win_prob, p.draw_prob, p.away_win_prob, p.confidence,
               m.league_id, e.actual_outcome, e.is_correct, e.brier_score
          FROM predictions p
          JOIN prediction_evaluations e ON e.prediction_id = p.id
          JOIN matches m ON m.id = p.match_id
         WHERE p.prediction_source IN ('live','batch_local_fill','backtest')
           AND e.brier_score IS NOT NULL
    """)
    by_tier_bucket = defaultdict(lambda: defaultdict(lambda: [0, 0, []]))
    # key: tier -> bucket -> [total, correct, brier_list]
    for hp, dp, ap, conf, lid, actual, is_correct, brier in cur.fetchall():
        tier = classify_tier(lid, conf)
        if tier is None:
            continue
        probs = {"home": hp, "draw": dp or 0, "away": ap}
        pick = max(probs, key=probs.get)
        max_prob = probs[pick]
        bucket = None
        for lo in [0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85]:
            if lo <= max_prob < lo + 0.05:
                bucket = f"{int(lo*100)}-{int((lo+0.05)*100)}"
                break
        if max_prob >= 0.90:
            bucket = "90+"
        if bucket is None:
            continue
        by_tier_bucket[tier][bucket][0] += 1
        if pick == actual:
            by_tier_bucket[tier][bucket][1] += 1
        by_tier_bucket[tier][bucket][2].append(float(brier))

    for tier in ("platinum", "gold", "silver", "free"):
        if tier not in by_tier_bucket:
            continue
        print(f"\nTier: {tier.upper()}")
        print(f"{'bucket':<10} {'n':>6} {'hit%':>6} {'expected':>10} {'drift':>6} {'avg_brier':>11}")
        total_n, total_c, all_briers = 0, 0, []
        for bucket in ("50-55", "55-60", "60-65", "65-70", "70-75", "75-80", "80-85", "85-90", "90+"):
            if bucket not in by_tier_bucket[tier]:
                continue
            n, c, briers = by_tier_bucket[tier][bucket]
            hit = c / n * 100 if n else 0
            lo = int(bucket.split("-")[0]) / 100 if "-" in bucket else 0.92
            hi = int(bucket.split("-")[1]) / 100 if "-" in bucket else 0.96
            exp = (lo + hi) / 2 * 100
            avg_brier = statistics.mean(briers) if briers else 0
            print(
                f"{bucket:<10} {n:>6} {hit:>5.1f}% {exp:>9.1f}% "
                f"{(hit-exp):>+5.1f} {avg_brier:>11.4f}"
            )
            total_n += n
            total_c += c
            all_briers.extend(briers)
        tier_acc = total_c / total_n * 100 if total_n else 0
        tier_brier = statistics.mean(all_briers) if all_briers else 0
        print(f"  overall: n={total_n}  acc={tier_acc:.1f}%  Brier={tier_brier:.4f}")

    # ── 1.3 EDGE DISTRIBUTIE (histogram) ────────────────────────────────────
    section("1.3 EDGE-DISTRIBUTIE op populated snapshots")

    cur.execute("""
        SELECT p.closing_odds_snapshot, p.confidence, m.league_id,
               e.is_correct, e.actual_outcome
          FROM predictions p
          JOIN prediction_evaluations e ON e.prediction_id = p.id
          JOIN matches m ON m.id = p.match_id
         WHERE p.closing_odds_snapshot IS NOT NULL
           AND p.closing_odds_snapshot::text NOT IN ('null','{}')
           AND p.closing_odds_snapshot ? 'bookmaker_odds'
           AND p.prediction_source = 'live'
    """)
    hist_buckets = defaultdict(int)
    records = []  # flat records for 1.5/1.6/1.7 sims
    for snap, conf, lid, is_correct, actual in cur.fetchall():
        edge = snap.get("model_edge") or {}
        book = snap.get("bookmaker_odds") or {}
        # pick the outcome with best edge
        best_out, best_e, best_odds = None, None, None
        for out in ("home", "draw", "away"):
            e_val = edge.get(out)
            o_val = book.get(out)
            if e_val is None or o_val is None:
                continue
            if best_e is None or e_val > best_e:
                best_e, best_out, best_odds = e_val, out, o_val
        if best_out is None:
            continue
        # bucket
        for lo, hi in [(-1.0, 0.0), (0.0, 0.02), (0.02, 0.05), (0.05, 0.10),
                        (0.10, 0.15), (0.15, 1.0)]:
            if lo <= best_e < hi:
                key = f"{int(lo*100)}-{int(hi*100)}"
                hist_buckets[key] += 1
                break
        tier = classify_tier(lid, conf)
        correct = (actual or "").lower() == best_out
        pnl = (best_odds - 1) if correct else -1.0
        records.append({
            "edge": best_e, "odds": best_odds, "correct": correct,
            "pnl": pnl, "tier": tier, "outcome": best_out, "conf": conf,
        })

    total = sum(hist_buckets.values())
    print(f"Sample: n={total} (live + populated snapshot, geëvalueerd)")
    for key in ["-100-0", "0-2", "2-5", "5-10", "10-15", "15-100"]:
        n = hist_buckets[key]
        pct = n / total * 100 if total else 0
        print(f"  edge {key:>8}%: {n:>4}  ({pct:>5.1f}%)")

    # ── 1.5 THRESHOLD BACKTEST ──────────────────────────────────────────────
    section("1.5 THRESHOLD BACKTEST (flat 1u stake, 1.50<=odds<=5.00)")

    print(f"{'thr':>5} {'picks':>6} {'acc%':>6} {'avg_odds':>9} "
          f"{'roi%':>6} {'pnl_u':>8} {'max_dd':>7} {'sharpe':>7}")
    for thr in [0.00, 0.03, 0.05, 0.08, 0.10, 0.15]:
        sub = [r for r in records if r["edge"] >= thr and 1.50 <= r["odds"] <= 5.00]
        n = len(sub)
        if n == 0:
            print(f"{thr:>5.2f} {n:>6} {'-':>6} {'-':>9} {'-':>6} {'-':>8} {'-':>7} {'-':>7}")
            continue
        acc = sum(1 for r in sub if r["correct"]) / n * 100
        avg_odds = statistics.mean(r["odds"] for r in sub)
        pnls = [r["pnl"] for r in sub]
        roi = sum(pnls) / n * 100
        dd = max_drawdown(pnls)
        sh = sharpe(pnls)
        sh_str = f"{sh:+.2f}" if sh is not None else "-"
        print(
            f"{thr:>5.2f} {n:>6} {acc:>5.1f}% {avg_odds:>9.2f} {roi:>+5.1f}% "
            f"{sum(pnls):>+7.1f}u {dd:>+6.1f}u {sh_str:>7}"
        )

    # ── 1.6 ODDS-RANGE (met threshold 5%) ──────────────────────────────────
    section("1.6 ODDS-RANGE FILTER @ edge>=5%")

    print(f"{'range':>11} {'picks':>6} {'acc%':>6} {'roi%':>7} {'pnl_u':>8} {'sharpe':>7}")
    for lo, hi, label in [
        (1.50, 2.00, "1.50-2.00"), (2.00, 3.00, "2.00-3.00"),
        (3.00, 5.00, "3.00-5.00"), (1.50, 5.00, "1.50-5.00"),
    ]:
        sub = [r for r in records if r["edge"] >= 0.05 and lo <= r["odds"] < hi]
        n = len(sub)
        if n == 0:
            print(f"{label:>11} {n:>6} {'-':>6} {'-':>7} {'-':>8} {'-':>7}")
            continue
        acc = sum(1 for r in sub if r["correct"]) / n * 100
        pnls = [r["pnl"] for r in sub]
        roi = sum(pnls) / n * 100
        sh = sharpe(pnls)
        sh_str = f"{sh:+.2f}" if sh is not None else "-"
        print(
            f"{label:>11} {n:>6} {acc:>5.1f}% {roi:>+6.1f}% "
            f"{sum(pnls):>+7.1f}u {sh_str:>7}"
        )

    # ── 1.7 TIER FILTER (met threshold 5%, 1.50-5.00) ──────────────────────
    section("1.7 TIER-FILTER @ edge>=5% & 1.50<=odds<=5.00")

    print(f"{'tier_filter':>18} {'picks':>6} {'acc%':>6} {'roi%':>7} {'pnl_u':>8} {'sharpe':>7}")
    for label, tier_set in [
        ("all", {"free", "silver", "gold", "platinum"}),
        ("silver+", {"silver", "gold", "platinum"}),
        ("gold+", {"gold", "platinum"}),
        ("platinum only", {"platinum"}),
    ]:
        sub = [
            r for r in records
            if r["edge"] >= 0.05
            and 1.50 <= r["odds"] <= 5.00
            and r["tier"] in tier_set
        ]
        n = len(sub)
        if n == 0:
            print(f"{label:>18} {n:>6} {'-':>6} {'-':>7} {'-':>8} {'-':>7}")
            continue
        acc = sum(1 for r in sub if r["correct"]) / n * 100
        pnls = [r["pnl"] for r in sub]
        roi = sum(pnls) / n * 100
        sh = sharpe(pnls)
        sh_str = f"{sh:+.2f}" if sh is not None else "-"
        print(
            f"{label:>18} {n:>6} {acc:>5.1f}% {roi:>+6.1f}% "
            f"{sum(pnls):>+7.1f}u {sh_str:>7}"
        )

    # ── 1.8 SUMMARY FOR GO/NO-GO ────────────────────────────────────────────
    section("1.8 SAMENVATTING")

    print(f"Total populated & evaluated records (live only): n={len(records)}")
    print(f"Minimum uit brief: 500+. Actual: {len(records)}.")
    if len(records) >= 500:
        print("-> data voldoende voor betrouwbare backtest.")
    else:
        gap = 500 - len(records)
        print(f"-> data TE KLEIN (gap={gap}). Brief-criterium niet gehaald.")

    conn.close()
    print()
    print("[OK] Fase 1 volledige analyse klaar.")


if __name__ == "__main__":
    main()
