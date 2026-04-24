"""Fase 2 — Echte cijfers vaststellen met context.

Connects directly to Railway PostgreSQL and computes everything the
herstructurering-plan asks for, then writes docs/echte_cijfers.md.

Usage (from repo root):
    python backend/scripts/fase2_echte_cijfers.py

The script is read-only — no writes, no inserts, no mutations. It only
SELECTs from predictions + prediction_evaluations + matches + leagues +
odds_history.

Output sections in docs/echte_cijfers.md:
  2.1 Sample size & tijdvak per tier × (all / backtest / live)
      + Wilson 95% CI on accuracy
      + picks/day, picks/week, picks/month
  2.2 Echte odds coverage per tier
  2.3 ROI (€1 stake) — alleen echte bookmaker odds
      + bootstrap 95% CI on ROI
  2.4 Gebruikers-tijdschaal: €10/pick, afgelopen 90 dagen
      → daily / weekly / monthly netto
  2.5 Consistency check vs /api/pricing/comparison etc.
"""
from __future__ import annotations

import math
import os
import sys
import random
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from statistics import mean
from typing import Any

import psycopg2
from psycopg2.extras import RealDictCursor


# ── Connection (same pattern as train_local.py) ───────────────────────────
DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}


# ── Tier thresholds (moet matchen met app/core/tier_system.py) ────────────
CONF = {"platinum": 0.75, "gold": 0.70, "silver": 0.65, "free": 0.55}
TIER_ORDER = ["free", "silver", "gold", "platinum"]

# League whitelists (from app/core/tier_leagues.py)
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
LEAGUES_FREE = LEAGUES_SILVER

LIVE_START = datetime(2026, 4, 16, 11, 0, 0, tzinfo=timezone.utc)


# ── Helpers ───────────────────────────────────────────────────────────────


def classify_tier(conf: float, league_id: str) -> str | None:
    """Match app.core.tier_system.pick_tier_expression CASE order exactly."""
    if conf >= CONF["platinum"] and league_id in LEAGUES_PLATINUM:
        return "platinum"
    if conf >= CONF["gold"] and league_id in LEAGUES_GOLD:
        return "gold"
    if conf >= CONF["silver"] and league_id in LEAGUES_SILVER:
        return "silver"
    if conf >= CONF["free"] and league_id in LEAGUES_FREE:
        return "free"
    return None  # below the free floor → not in any tier


def wilson_ci(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    """Wilson 95% CI on a Bernoulli proportion."""
    if n == 0:
        return (0.0, 0.0)
    p = successes / n
    denom = 1 + z * z / n
    center = p + z * z / (2 * n)
    spread = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    lo = (center - spread) / denom
    hi = (center + spread) / denom
    return (max(0.0, lo), min(1.0, hi))


def bootstrap_roi_ci(pnls: list[float], iterations: int = 2000) -> tuple[float, float]:
    """95% bootstrap CI on ROI% for a list of per-pick pnls (stake=1)."""
    if not pnls:
        return (0.0, 0.0)
    n = len(pnls)
    random.seed(42)  # reproducible
    roi_samples = []
    for _ in range(iterations):
        sample = [pnls[random.randrange(n)] for _ in range(n)]
        roi = (sum(sample) / n) * 100
        roi_samples.append(roi)
    roi_samples.sort()
    lo = roi_samples[int(0.025 * iterations)]
    hi = roi_samples[int(0.975 * iterations)]
    return (lo, hi)


def fmt_pct(x: float, digits: int = 1) -> str:
    return f"{x * 100:.{digits}f}%"


def fmt_eur(x: float) -> str:
    return f"€{x:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def extract_odds_from_snapshot(snap: Any, pick: str) -> float | None:
    if not isinstance(snap, dict):
        return None
    book = snap.get("bookmaker_odds")
    if not isinstance(book, dict):
        return None
    v = book.get(pick)
    if v is None:
        return None
    try:
        v = float(v)
    except (TypeError, ValueError):
        return None
    return v if v > 1.0 else None


# ── Data loading ──────────────────────────────────────────────────────────


def load_evaluated_predictions(conn) -> list[dict]:
    """Pull every pre-match evaluated prediction with everything we need.

    Filter: predicted_at < scheduled_at (pre-match lock) + has evaluation row.
    Includes closing_odds_snapshot and aggregated OddsHistory 1x2 AVG.
    """
    sql = """
        SELECT
            p.id AS pred_id,
            p.match_id,
            p.home_win_prob,
            p.draw_prob,
            p.away_win_prob,
            p.predicted_at,
            p.created_at,
            p.prediction_source,
            p.closing_odds_snapshot,
            m.scheduled_at,
            m.league_id::text AS league_id,
            pe.is_correct,
            oh_avg.home_odds_avg,
            oh_avg.draw_odds_avg,
            oh_avg.away_odds_avg
        FROM predictions p
        JOIN prediction_evaluations pe ON pe.prediction_id = p.id
        JOIN matches m ON m.id = p.match_id
        LEFT JOIN (
            SELECT
                match_id,
                AVG(home_odds) AS home_odds_avg,
                AVG(draw_odds) AS draw_odds_avg,
                AVG(away_odds) AS away_odds_avg
            FROM odds_history
            WHERE market IN ('1x2', '1X2')
            GROUP BY match_id
        ) oh_avg ON oh_avg.match_id = p.match_id
        WHERE p.predicted_at < m.scheduled_at
    """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql)
        return cur.fetchall()


def source_bucket(row: dict) -> str:
    """Return 'live' or 'backtest' consistent with app routes."""
    if row["prediction_source"] == "live" and row["created_at"] >= LIVE_START:
        return "live"
    return "backtest"


def pick_for(row: dict) -> str:
    probs = {
        "home": float(row["home_win_prob"] or 0),
        "draw": float(row["draw_prob"] or 0),
        "away": float(row["away_win_prob"] or 0),
    }
    return max(probs, key=lambda k: probs[k])


def real_odds_for(row: dict, pick: str) -> float | None:
    """Snapshot first, then OddsHistory AVG. Return None if neither valid."""
    v = extract_odds_from_snapshot(row["closing_odds_snapshot"], pick)
    if v is not None:
        return v
    oh = {
        "home": row["home_odds_avg"],
        "draw": row["draw_odds_avg"],
        "away": row["away_odds_avg"],
    }.get(pick)
    if oh is None:
        return None
    try:
        oh = float(oh)
    except (TypeError, ValueError):
        return None
    return oh if oh > 1.0 else None


# ── Section builders ──────────────────────────────────────────────────────


def section_21_sample_sizes(rows: list[dict]) -> list[dict]:
    """Per tier × bucket: count, accuracy + Wilson CI, period, picks/day/week/month."""
    # Key: (tier, bucket) -> list of rows
    grouped: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for r in rows:
        conf = max(
            float(r["home_win_prob"] or 0),
            float(r["draw_prob"] or 0),
            float(r["away_win_prob"] or 0),
        )
        tier = classify_tier(conf, r["league_id"])
        if tier is None:
            continue
        bucket = source_bucket(r)
        grouped[(tier, bucket)].append(r)
        grouped[(tier, "all")].append(r)

    results = []
    for tier in TIER_ORDER:
        for bucket in ("all", "backtest", "live"):
            lst = grouped.get((tier, bucket), [])
            n = len(lst)
            correct = sum(1 for r in lst if r["is_correct"])
            acc = correct / n if n else 0
            lo, hi = wilson_ci(correct, n)
            if n > 0:
                dates = sorted(r["scheduled_at"] for r in lst)
                start, end = dates[0], dates[-1]
                days = max(1, (end - start).days + 1)
                per_day = n / days
            else:
                start = end = None
                days = 0
                per_day = 0.0
            results.append({
                "tier": tier,
                "bucket": bucket,
                "n": n,
                "correct": correct,
                "accuracy": acc,
                "ci_lo": lo,
                "ci_hi": hi,
                "start": start,
                "end": end,
                "days": days,
                "per_day": per_day,
                "per_week": per_day * 7,
                "per_month": per_day * 30,
            })
    return results


def section_22_odds_coverage(rows: list[dict]) -> list[dict]:
    """Per tier, how many picks have real odds vs only implied."""
    results = []
    by_tier: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        conf = max(
            float(r["home_win_prob"] or 0),
            float(r["draw_prob"] or 0),
            float(r["away_win_prob"] or 0),
        )
        tier = classify_tier(conf, r["league_id"])
        if tier is None:
            continue
        by_tier[tier].append(r)

    for tier in TIER_ORDER:
        lst = by_tier.get(tier, [])
        n = len(lst)
        real = sum(1 for r in lst if real_odds_for(r, pick_for(r)) is not None)
        pct = (real / n * 100) if n else 0
        results.append({
            "tier": tier,
            "total": n,
            "real_odds": real,
            "implied_only": n - real,
            "real_pct": pct,
        })
    return results


def section_23_roi_real_odds(rows: list[dict]) -> list[dict]:
    """Per tier + bucket, ROI on €1 stake using ONLY real bookmaker odds."""
    grouped: dict[tuple[str, str], list[float]] = defaultdict(list)
    correct_groups: dict[tuple[str, str], int] = defaultdict(int)
    odds_groups: dict[tuple[str, str], list[float]] = defaultdict(list)

    for r in rows:
        conf = max(
            float(r["home_win_prob"] or 0),
            float(r["draw_prob"] or 0),
            float(r["away_win_prob"] or 0),
        )
        tier = classify_tier(conf, r["league_id"])
        if tier is None:
            continue
        pick = pick_for(r)
        odds = real_odds_for(r, pick)
        if odds is None:
            continue
        bucket = source_bucket(r)
        for b in (bucket, "all"):
            pnl = (odds - 1.0) if r["is_correct"] else -1.0
            grouped[(tier, b)].append(pnl)
            odds_groups[(tier, b)].append(odds)
            if r["is_correct"]:
                correct_groups[(tier, b)] += 1

    results = []
    for tier in TIER_ORDER:
        for bucket in ("all", "backtest", "live"):
            pnls = grouped.get((tier, bucket), [])
            n = len(pnls)
            correct = correct_groups.get((tier, bucket), 0)
            avg_odds = mean(odds_groups.get((tier, bucket), [])) if odds_groups.get((tier, bucket)) else 0
            total_pnl = sum(pnls)
            roi = (total_pnl / n * 100) if n else 0
            ci_lo, ci_hi = bootstrap_roi_ci(pnls) if n >= 30 else (float("nan"), float("nan"))
            reliable = n >= 100
            results.append({
                "tier": tier,
                "bucket": bucket,
                "n": n,
                "correct": correct,
                "accuracy": (correct / n) if n else 0,
                "avg_odds": avg_odds,
                "total_staked": float(n),
                "total_return": float(n) + total_pnl,
                "net_profit": total_pnl,
                "roi_pct": roi,
                "ci_lo": ci_lo,
                "ci_hi": ci_hi,
                "reliable": reliable,
            })
    return results


def section_24_user_scale(rows: list[dict]) -> list[dict]:
    """Per tier, afgelopen 90 dagen, €10 stake, alleen echte odds.

    Als live periode korter is dan 90 dagen: gebruikt de hele live periode.
    Daarbij ook een losse 'full_period' berekening.
    """
    STAKE = 10.0
    now = datetime.now(timezone.utc)
    cutoff_90d = now - timedelta(days=90)

    def stats_for(tier: str, rows_subset: list[dict], start: datetime, end: datetime):
        pnls = []
        correct = 0
        for r in rows_subset:
            pick = pick_for(r)
            odds = real_odds_for(r, pick)
            if odds is None:
                continue
            pnl = STAKE * ((odds - 1.0) if r["is_correct"] else -1.0)
            pnls.append(pnl)
            if r["is_correct"]:
                correct += 1
        n = len(pnls)
        if n == 0:
            return None
        days = max(1, (end - start).days + 1)
        net = sum(pnls)
        return {
            "tier": tier,
            "period_start": start,
            "period_end": end,
            "n": n,
            "correct": correct,
            "accuracy": correct / n,
            "days": days,
            "picks_per_day": n / days,
            "daily_stake": (n / days) * STAKE,
            "daily_net": net / days,
            "weekly_net": net / days * 7,
            "monthly_net": net / days * 30,
            "monthly_stake": (n / days) * STAKE * 30,
            "monthly_roi_pct": (net / days * 30) / ((n / days) * STAKE * 30) * 100 if n > 0 else 0,
            "total_stake": n * STAKE,
            "total_net": net,
            "total_roi_pct": net / (n * STAKE) * 100 if n > 0 else 0,
        }

    by_tier: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        conf = max(
            float(r["home_win_prob"] or 0),
            float(r["draw_prob"] or 0),
            float(r["away_win_prob"] or 0),
        )
        tier = classify_tier(conf, r["league_id"])
        if tier is None:
            continue
        by_tier[tier].append(r)

    results = []
    for tier in TIER_ORDER:
        lst = by_tier.get(tier, [])
        if not lst:
            continue

        recent = [r for r in lst if r["scheduled_at"] >= cutoff_90d]
        s90 = stats_for(tier, recent, cutoff_90d, now) if recent else None
        if s90:
            s90["label"] = "Afgelopen 90 dagen"
            results.append(s90)

        dates = [r["scheduled_at"] for r in lst]
        full = stats_for(tier, lst, min(dates), max(dates))
        if full:
            full["label"] = "Hele periode"
            results.append(full)
    return results


# ── Report writer ─────────────────────────────────────────────────────────


def write_markdown_report(
    rows_count: int,
    section21: list[dict],
    section22: list[dict],
    section23: list[dict],
    section24: list[dict],
    output_path: Path,
) -> None:
    lines = []
    lines.append("# Fase 2 — Echte Cijfers\n")
    lines.append(f"*Gegenereerd op {datetime.now(timezone.utc).isoformat()}Z*\n")
    lines.append(f"**Dataset:** {rows_count} geëvalueerde pre-match predicties "
                 f"(Prediction.predicted_at < Match.scheduled_at, join met "
                 f"PredictionEvaluation).\n")
    lines.append("")
    lines.append("---\n")

    # ─── 2.1 ─────────────────────────────────────────────────────────────
    lines.append("## 2.1 Sample size en tijdvak per tier\n")
    lines.append("Wilson 95% CI op accuracy. Periode = eerste → laatste "
                 "geëvalueerde pick. Picks/dag = totaal ÷ dagen in periode.\n")
    lines.append("")
    lines.append("| Tier | Bucket | N | Correct | Accuracy | 95% CI | Periode | Picks/dag | Picks/week | Picks/maand |")
    lines.append("|---|---|---:|---:|---:|---|---|---:|---:|---:|")
    for r in section21:
        period = (
            f"{r['start'].date()} → {r['end'].date()} ({r['days']}d)"
            if r["start"] else "—"
        )
        ci = (
            f"[{fmt_pct(r['ci_lo'])}, {fmt_pct(r['ci_hi'])}]"
            if r["n"] > 0 else "—"
        )
        lines.append(
            f"| **{r['tier'].title()}** | {r['bucket']} | {r['n']} | {r['correct']} | "
            f"{fmt_pct(r['accuracy'])} | {ci} | {period} | "
            f"{r['per_day']:.2f} | {r['per_week']:.1f} | {r['per_month']:.0f} |"
        )
    lines.append("")

    # ─── 2.2 ─────────────────────────────────────────────────────────────
    lines.append("## 2.2 Echte odds coverage per tier\n")
    lines.append("Hoeveel van de picks hebben **echte bookmaker odds** (uit "
                 "closing_odds_snapshot of odds_history)? De rest kan alleen "
                 "via implied-odds fallback, wat we in Fase 4 niet meer gaan "
                 "gebruiken.\n")
    lines.append("")
    lines.append("| Tier | Totaal picks | Met echte odds | Alleen implied | % echte odds |")
    lines.append("|---|---:|---:|---:|---:|")
    for r in section22:
        lines.append(
            f"| **{r['tier'].title()}** | {r['total']} | {r['real_odds']} | "
            f"{r['implied_only']} | {r['real_pct']:.1f}% |"
        )
    lines.append("")

    # ─── 2.3 ─────────────────────────────────────────────────────────────
    lines.append("## 2.3 ROI — uitsluitend echte odds (€1 stake normalisatie)\n")
    lines.append("Per tier × bucket. Alleen picks waarvoor we echte bookmaker "
                 "odds hebben. Bootstrap 95% CI (n ≥ 30). Gemarkeerd als "
                 "**onbetrouwbaar** bij n < 100.\n")
    lines.append("")
    lines.append("| Tier | Bucket | N (real odds) | Accuracy | Gem. odds | Netto (€1/pick) | ROI | 95% CI | Betrouwbaar? |")
    lines.append("|---|---|---:|---:|---:|---:|---:|---|---|")
    for r in section23:
        if r["n"] == 0:
            continue
        ci = (
            f"[{r['ci_lo']:+.1f}%, {r['ci_hi']:+.1f}%]"
            if not math.isnan(r["ci_lo"]) else "n/a"
        )
        rel = "✅" if r["reliable"] else "⚠️ te klein (<100)"
        lines.append(
            f"| **{r['tier'].title()}** | {r['bucket']} | {r['n']} | "
            f"{fmt_pct(r['accuracy'])} | {r['avg_odds']:.2f}x | "
            f"{r['net_profit']:+.2f} | {r['roi_pct']:+.1f}% | {ci} | {rel} |"
        )
    lines.append("")

    # ─── 2.4 ─────────────────────────────────────────────────────────────
    lines.append("## 2.4 Gebruikers-tijdschaal — €10 per pick\n")
    lines.append("**Dit is het getal dat een gebruiker snapt.** Voor elk "
                 "tier: als je €10 per pick inzet op alle picks van dat tier, "
                 "wat is dan het gemiddelde per dag/week/maand? Alleen echte "
                 "odds (geen implied fallback).\n")
    lines.append("")
    for r in section24:
        lines.append(f"### {r['tier'].title()} — {r['label']}")
        lines.append("")
        lines.append(f"- Periode: {r['period_start'].date()} → {r['period_end'].date()} "
                     f"({r['days']} dagen)")
        lines.append(f"- Picks met echte odds: **{r['n']}** (accuracy: "
                     f"{fmt_pct(r['accuracy'])})")
        lines.append(f"- Gemiddeld **{r['picks_per_day']:.2f} picks per dag** → "
                     f"**{fmt_eur(r['daily_stake'])}** inzet per dag")
        lines.append("")
        lines.append(f"- **Dagelijks netto resultaat: {fmt_eur(r['daily_net'])}** "
                     f"({'winst' if r['daily_net'] > 0 else 'verlies'})")
        lines.append(f"- **Wekelijks netto: {fmt_eur(r['weekly_net'])}**")
        lines.append(f"- **Maandelijks netto: {fmt_eur(r['monthly_net'])}** "
                     f"op {fmt_eur(r['monthly_stake'])} inzet "
                     f"({r['monthly_roi_pct']:+.1f}%)")
        lines.append("")
        lines.append(f"- Totale periode: {fmt_eur(r['total_net'])} netto op "
                     f"{fmt_eur(r['total_stake'])} inzet ({r['total_roi_pct']:+.1f}%)")
        lines.append("")

    # ─── 2.5 ─────────────────────────────────────────────────────────────
    lines.append("## 2.5 Consistency check\n")
    lines.append("Vergelijk de cijfers hierboven met:\n")
    lines.append("- `/api/pricing/comparison` response — welke accuracy-claims "
                 "per tier?")
    lines.append("- Homepage hero copy — staat daar een percentage?")
    lines.append("- `/engine` pagina — statische claims of dynamic?")
    lines.append("- Pricing page — tier descriptions met accuracy-nummers")
    lines.append("")
    lines.append("**Handmatig uit te voeren** (script kan dit niet zonder "
                 "deployed staging-URL op te vragen). Noteer per pagina: "
                 "welke getallen staan er, matchen ze met sectie 2.1 boven?")
    lines.append("")
    lines.append("---\n")
    lines.append(f"*Einde rapport — gegenereerd door `fase2_echte_cijfers.py`.*\n")

    output_path.write_text("\n".join(lines), encoding="utf-8")


# ── Main ──────────────────────────────────────────────────────────────────


def main() -> None:
    print("Connecting to Railway PostgreSQL...", file=sys.stderr)
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        print("Loading evaluated pre-match predictions...", file=sys.stderr)
        rows = load_evaluated_predictions(conn)
        print(f"  loaded {len(rows)} rows.", file=sys.stderr)

        print("Computing 2.1 sample sizes + Wilson CI...", file=sys.stderr)
        s21 = section_21_sample_sizes(rows)

        print("Computing 2.2 odds coverage...", file=sys.stderr)
        s22 = section_22_odds_coverage(rows)

        print("Computing 2.3 ROI (real odds only) + bootstrap CI...", file=sys.stderr)
        s23 = section_23_roi_real_odds(rows)

        print("Computing 2.4 user-scale daily/weekly/monthly...", file=sys.stderr)
        s24 = section_24_user_scale(rows)

        repo_root = Path(__file__).resolve().parents[2]
        output_path = repo_root / "docs" / "echte_cijfers.md"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        write_markdown_report(len(rows), s21, s22, s23, s24, output_path)
        print(f"\nReport written → {output_path}", file=sys.stderr)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
