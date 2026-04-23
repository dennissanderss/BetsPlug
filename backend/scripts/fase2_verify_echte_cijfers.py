"""Fase 2 verificatie — vergelijk drie filter-niveaus naast elkaar.

Verifieert waar de "3.318 voorspellingen / 68% accuracy" op de site
vandaan komen en waarom mijn earlier script "190" gaf. Geen van beide
is fout — ze meten verschillende dingen. Dit script maakt dat expliciet.

Usage:
    python backend/scripts/fase2_verify_echte_cijfers.py

Output → docs/echte_cijfers_verify.md
"""
from __future__ import annotations

import math
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import psycopg2
from psycopg2.extras import RealDictCursor


DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}

V81_CUTOFF = datetime(2026, 4, 16, 11, 0, 0, tzinfo=timezone.utc)
V81_VALID_SOURCES = ("batch_local_fill", "backtest", "live")

CONF = {"platinum": 0.75, "gold": 0.70, "silver": 0.65, "free": 0.55}
TIER_ORDER = ["free", "silver", "gold", "platinum"]

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


def classify_tier(conf: float, league_id: str) -> str | None:
    if conf >= CONF["platinum"] and league_id in LEAGUES_PLATINUM:
        return "platinum"
    if conf >= CONF["gold"] and league_id in LEAGUES_GOLD:
        return "gold"
    if conf >= CONF["silver"] and league_id in LEAGUES_SILVER:
        return "silver"
    if conf >= CONF["free"] and league_id in LEAGUES_FREE:
        return "free"
    return None


def wilson_ci(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return (0.0, 0.0)
    p = successes / n
    denom = 1 + z * z / n
    center = p + z * z / (2 * n)
    spread = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return (max(0.0, (center - spread) / denom), min(1.0, (center + spread) / denom))


def load_rows(conn) -> list[dict]:
    """Load every evaluated v8.1 prediction — no pre-match filter applied here,
    we apply filters in-memory below so we can report all three side by side."""
    sql = """
        SELECT
            p.id AS pred_id,
            p.match_id,
            p.home_win_prob,
            p.draw_prob,
            p.away_win_prob,
            p.confidence,
            p.predicted_at,
            p.created_at,
            p.prediction_source,
            m.scheduled_at,
            m.league_id::text AS league_id,
            pe.is_correct
        FROM predictions p
        JOIN prediction_evaluations pe ON pe.prediction_id = p.id
        JOIN matches m ON m.id = p.match_id
    """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql)
        return cur.fetchall()


def apply_filter(rows: list[dict], name: str) -> list[dict]:
    """Three filter levels, matching backend/app/core/prediction_filters.py."""
    out = []
    for r in rows:
        if r["prediction_source"] not in V81_VALID_SOURCES:
            continue
        if r["created_at"] < V81_CUTOFF:
            continue
        if name == "v81":
            out.append(r)
        elif name == "trackrecord":
            if r["predicted_at"] <= r["scheduled_at"]:
                out.append(r)
        elif name == "strict_prematch":
            if r["predicted_at"] < r["scheduled_at"]:
                out.append(r)
    return out


def stats_per_tier(rows: list[dict]) -> dict[str, dict]:
    buckets: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        conf = float(r["confidence"] or max(
            r["home_win_prob"] or 0, r["draw_prob"] or 0, r["away_win_prob"] or 0
        ))
        tier = classify_tier(conf, r["league_id"])
        if tier is None:
            continue
        buckets[tier].append(r)
        buckets["all"].append(r)

    result = {}
    for key in [*TIER_ORDER, "all"]:
        lst = buckets.get(key, [])
        n = len(lst)
        correct = sum(1 for r in lst if r["is_correct"])
        acc = correct / n if n else 0
        lo, hi = wilson_ci(correct, n)
        result[key] = {
            "n": n,
            "correct": correct,
            "accuracy": acc,
            "ci_lo": lo,
            "ci_hi": hi,
        }
    return result


def breakdown_predicted_vs_scheduled(rows: list[dict]) -> dict:
    """How many rows have predicted_at BEFORE vs EQUAL vs AFTER scheduled_at?"""
    before = 0
    equal = 0
    after = 0
    for r in rows:
        if r["prediction_source"] not in V81_VALID_SOURCES:
            continue
        if r["created_at"] < V81_CUTOFF:
            continue
        if r["predicted_at"] < r["scheduled_at"]:
            before += 1
        elif r["predicted_at"] == r["scheduled_at"]:
            equal += 1
        else:
            after += 1
    return {"before_kickoff": before, "exactly_at_kickoff": equal, "after_kickoff": after}


def breakdown_by_source(rows: list[dict]) -> dict:
    counts: dict[str, int] = defaultdict(int)
    for r in rows:
        if r["prediction_source"] not in V81_VALID_SOURCES:
            continue
        if r["created_at"] < V81_CUTOFF:
            continue
        counts[r["prediction_source"] or "null"] += 1
    return dict(counts)


def fmt_pct(x: float) -> str:
    return f"{x * 100:.1f}%"


def write_report(
    total_raw: int,
    timing: dict,
    by_source: dict,
    levels: dict[str, dict],
    output_path: Path,
) -> None:
    lines = []
    lines.append("# Fase 2 — Verificatie: Drie Filter-niveaus Naast Elkaar\n")
    lines.append(f"*Gegenereerd {datetime.now(timezone.utc).isoformat()}Z*\n")
    lines.append("")
    lines.append(f"Totaal geëvalueerde predicties in DB (ruwe JOIN, geen filter): **{total_raw}**\n")
    lines.append("")
    lines.append("## Timing breakdown — `predicted_at` vs `scheduled_at`\n")
    lines.append("(Na v8.1 cutoff + valid-source filter)\n")
    lines.append("")
    lines.append("| Situatie | Aantal |")
    lines.append("|---|---:|")
    lines.append(f"| `predicted_at < scheduled_at` (echt pre-match) | {timing['before_kickoff']} |")
    lines.append(f"| `predicted_at = scheduled_at` (batch simulation @ kickoff) | {timing['exactly_at_kickoff']} |")
    lines.append(f"| `predicted_at > scheduled_at` (retroactieve backfill) | {timing['after_kickoff']} |")
    lines.append("")
    lines.append("## Source breakdown\n")
    lines.append("| prediction_source | Aantal |")
    lines.append("|---|---:|")
    for k, v in sorted(by_source.items(), key=lambda x: -x[1]):
        lines.append(f"| {k} | {v} |")
    lines.append("")
    lines.append("---\n")
    lines.append("## Accuracy per tier — drie filter-niveaus\n")
    lines.append("")
    lines.append("Filter A = **v81_predictions_filter** (source + cutoff)\n")
    lines.append("Filter B = **trackrecord_filter** (A + `predicted_at ≤ scheduled_at`) — **dit is wat de site toont**\n")
    lines.append("Filter C = **strict pre-match** (A + `predicted_at < scheduled_at`) — de echte pre-match lock\n")
    lines.append("")
    lines.append("| Tier | A (v81) N | A Acc | B (site) N | B Acc | C (strict) N | C Acc |")
    lines.append("|---|---:|---:|---:|---:|---:|---:|")
    for tier in [*TIER_ORDER, "all"]:
        a = levels["v81"][tier]
        b = levels["trackrecord"][tier]
        c = levels["strict_prematch"][tier]
        label = "**Totaal**" if tier == "all" else f"**{tier.title()}**"
        lines.append(
            f"| {label} | {a['n']} | "
            f"{fmt_pct(a['accuracy']) if a['n'] else '—'} | "
            f"{b['n']} | {fmt_pct(b['accuracy']) if b['n'] else '—'} | "
            f"{c['n']} | {fmt_pct(c['accuracy']) if c['n'] else '—'} |"
        )
    lines.append("")
    lines.append("## Wilson 95% CI per tier onder Filter B (site-weergave)\n")
    lines.append("| Tier | N | Accuracy | 95% CI |")
    lines.append("|---|---:|---:|---|")
    for tier in [*TIER_ORDER, "all"]:
        b = levels["trackrecord"][tier]
        ci = f"[{fmt_pct(b['ci_lo'])}, {fmt_pct(b['ci_hi'])}]" if b["n"] else "—"
        label = "**Totaal**" if tier == "all" else f"**{tier.title()}**"
        lines.append(f"| {label} | {b['n']} | {fmt_pct(b['accuracy']) if b['n'] else '—'} | {ci} |")
    lines.append("")
    lines.append("## Wilson 95% CI per tier onder Filter C (strict pre-match)\n")
    lines.append("| Tier | N | Accuracy | 95% CI |")
    lines.append("|---|---:|---:|---|")
    for tier in [*TIER_ORDER, "all"]:
        c = levels["strict_prematch"][tier]
        ci = f"[{fmt_pct(c['ci_lo'])}, {fmt_pct(c['ci_hi'])}]" if c["n"] else "—"
        label = "**Totaal**" if tier == "all" else f"**{tier.title()}**"
        lines.append(f"| {label} | {c['n']} | {fmt_pct(c['accuracy']) if c['n'] else '—'} | {ci} |")
    lines.append("")
    lines.append("---\n")
    lines.append("## Conclusie\n")
    lines.append("")
    a_total = levels["v81"]["all"]["n"]
    b_total = levels["trackrecord"]["all"]["n"]
    c_total = levels["strict_prematch"]["all"]["n"]
    lines.append(f"- **{a_total}** predicties na v8.1-source + cutoff filter.")
    lines.append(f"- **{b_total}** daarvan heeft `predicted_at ≤ scheduled_at` — dit is wat de site toont.")
    lines.append(f"- **{c_total}** daarvan is écht pre-match (`predicted_at < scheduled_at`, strict kleiner).")
    lines.append(f"- **{b_total - c_total}** predicties hebben `predicted_at = scheduled_at` (batch-simulatie op kickoff-tijd).")
    lines.append("")
    lines.append("### Welk getal is 'waar'?")
    lines.append("- Filter B is **historische modelvalidatie**: hoe goed het model zou hebben voorspeld met alleen pre-kickoff data, in batch geëvalueerd.")
    lines.append("- Filter C is **honest engine**: alleen picks die strikt vóór aftrap zijn vastgelegd (live + een paar vroeg-gescheduled backtests).")
    lines.append("- Beide zijn legitiem, afhankelijk van welke claim je maakt.")
    lines.append("- Marketing-claim 'wat het model kan' → Filter B acceptabel.")
    lines.append("- Marketing-claim 'wat wij voorspellen vóór de wedstrijd' → Filter C is de enige eerlijke optie.")
    lines.append("")
    output_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    print("Connecting to Railway PostgreSQL...", file=sys.stderr)
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        rows = load_rows(conn)
        print(f"  loaded {len(rows)} raw evaluated predictions", file=sys.stderr)

        timing = breakdown_predicted_vs_scheduled(rows)
        by_source = breakdown_by_source(rows)

        levels = {}
        for name in ("v81", "trackrecord", "strict_prematch"):
            subset = apply_filter(rows, name)
            levels[name] = stats_per_tier(subset)
            print(f"  filter '{name}': {len(subset)} rows", file=sys.stderr)

        repo_root = Path(__file__).resolve().parents[2]
        out = repo_root / "docs" / "echte_cijfers_verify.md"
        out.parent.mkdir(parents=True, exist_ok=True)
        write_report(len(rows), timing, by_source, levels, out)
        print(f"\nReport → {out}", file=sys.stderr)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
