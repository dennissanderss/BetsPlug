"""Fase 2 — Odds coverage op de ECHTE 3318 predicties (trackrecord_filter).

Vorige rapporten keken naar de verkeerde dataset. Dit script gebruikt exact
hetzelfde filter als /trackrecord/summary:
    - prediction_source IN ('batch_local_fill', 'backtest', 'live')
    - created_at >= 2026-04-16 11:00 UTC
    - predicted_at <= scheduled_at

Per tier + totaal:
    1. Hoeveel picks hebben echte odds (closing_odds_snapshot OF odds_history)
    2. Hoeveel alleen via implied-odds fallback kunnen worden berekend
    3. Wat is de ROI met ALLEEN echte odds per tier
    4. Wat betekent dat voor een gebruiker op €10/pick

Output → docs/odds_coverage.md
"""
from __future__ import annotations

import math
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean
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


def extract_snapshot_odds(snap: Any, pick: str) -> float | None:
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


def pick_for(r: dict) -> str:
    probs = {
        "home": float(r["home_win_prob"] or 0),
        "draw": float(r["draw_prob"] or 0),
        "away": float(r["away_win_prob"] or 0),
    }
    return max(probs, key=lambda k: probs[k])


def wilson_ci(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return (0.0, 0.0)
    p = successes / n
    denom = 1 + z * z / n
    center = p + z * z / (2 * n)
    spread = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return (max(0.0, (center - spread) / denom), min(1.0, (center + spread) / denom))


def load_data(conn) -> list[dict]:
    """Same filter as trackrecord_filter: source-valid + v81 cutoff +
    predicted_at <= scheduled_at. JOINs in OddsHistory AVG so we get the
    real bookmaker odds per match in one pass."""
    sql = """
        SELECT
            p.id AS pred_id,
            p.match_id,
            p.home_win_prob,
            p.draw_prob,
            p.away_win_prob,
            p.confidence,
            p.predicted_at,
            p.closing_odds_snapshot,
            p.prediction_source,
            m.scheduled_at,
            m.league_id::text AS league_id,
            pe.is_correct,
            oh_avg.home_odds_avg,
            oh_avg.draw_odds_avg,
            oh_avg.away_odds_avg,
            oh_avg.bookmaker_count
        FROM predictions p
        JOIN prediction_evaluations pe ON pe.prediction_id = p.id
        JOIN matches m ON m.id = p.match_id
        LEFT JOIN (
            SELECT
                match_id,
                AVG(home_odds) AS home_odds_avg,
                AVG(draw_odds) AS draw_odds_avg,
                AVG(away_odds) AS away_odds_avg,
                COUNT(*) AS bookmaker_count
            FROM odds_history
            WHERE market IN ('1x2', '1X2')
            GROUP BY match_id
        ) oh_avg ON oh_avg.match_id = p.match_id
        WHERE p.prediction_source IN %s
          AND p.created_at >= %s
          AND p.predicted_at <= m.scheduled_at
    """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql, (V81_VALID_SOURCES, V81_CUTOFF))
        return cur.fetchall()


def analyze(rows: list[dict]) -> dict:
    buckets: dict[str, dict] = defaultdict(lambda: {
        "total": 0,
        "correct": 0,
        "has_snapshot": 0,
        "has_odds_history": 0,
        "has_any_real_odds": 0,
        "real_odds_pnls": [],       # pnl per pick, stake=1
        "real_odds_correct": 0,
        "real_odds_list": [],
    })

    for r in rows:
        conf = float(r["confidence"] or max(
            r["home_win_prob"] or 0, r["draw_prob"] or 0, r["away_win_prob"] or 0
        ))
        tier = classify_tier(conf, r["league_id"])
        if tier is None:
            continue
        pick = pick_for(r)

        snap_odds = extract_snapshot_odds(r["closing_odds_snapshot"], pick)
        oh = {
            "home": r["home_odds_avg"],
            "draw": r["draw_odds_avg"],
            "away": r["away_odds_avg"],
        }.get(pick)
        try:
            oh_val = float(oh) if oh is not None else None
        except (TypeError, ValueError):
            oh_val = None
        if oh_val is not None and oh_val <= 1.0:
            oh_val = None

        real_odds = snap_odds if snap_odds is not None else oh_val
        has_real = real_odds is not None

        for key in (tier, "all"):
            b = buckets[key]
            b["total"] += 1
            if r["is_correct"]:
                b["correct"] += 1
            if snap_odds is not None:
                b["has_snapshot"] += 1
            if oh_val is not None:
                b["has_odds_history"] += 1
            if has_real:
                b["has_any_real_odds"] += 1
                pnl = (real_odds - 1.0) if r["is_correct"] else -1.0
                b["real_odds_pnls"].append(pnl)
                b["real_odds_list"].append(real_odds)
                if r["is_correct"]:
                    b["real_odds_correct"] += 1
    return buckets


def fmt_pct(x: float) -> str:
    return f"{x * 100:.1f}%"


def fmt_eur(x: float) -> str:
    return f"€{x:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def write_report(rows_count: int, buckets: dict, output_path: Path) -> None:
    lines = []
    lines.append("# Fase 2 — Odds coverage & ROI (echte dataset: 3.318 picks)\n")
    lines.append(f"*Gegenereerd {datetime.now(timezone.utc).isoformat()}Z*\n")
    lines.append("")
    lines.append(f"**Dataset:** {rows_count} geëvalueerde predicties onder "
                 "`trackrecord_filter()` — exact dezelfde filter als de site gebruikt.\n")
    lines.append("")
    lines.append("---\n")
    lines.append("## 1. Odds coverage per tier\n")
    lines.append("")
    lines.append("| Tier | Picks | closing_odds_snapshot | odds_history | Échte odds (één van beide) | % dekking |")
    lines.append("|---|---:|---:|---:|---:|---:|")
    for key in [*TIER_ORDER, "all"]:
        b = buckets.get(key, {})
        n = b.get("total", 0)
        snap = b.get("has_snapshot", 0)
        oh = b.get("has_odds_history", 0)
        any_real = b.get("has_any_real_odds", 0)
        pct = (any_real / n * 100) if n else 0
        label = "**Totaal**" if key == "all" else f"**{key.title()}**"
        lines.append(f"| {label} | {n} | {snap} | {oh} | {any_real} | {pct:.1f}% |")
    lines.append("")
    lines.append("---\n")
    lines.append("## 2. ROI per tier — alleen picks met ECHTE odds (€1 stake)\n")
    lines.append("")
    lines.append("| Tier | N met echte odds | Accuracy | Gem. odds | Netto (€1/pick) | Rendement | 95% CI |")
    lines.append("|---|---:|---:|---:|---:|---:|---|")
    for key in [*TIER_ORDER, "all"]:
        b = buckets.get(key, {})
        n = b.get("has_any_real_odds", 0)
        if n == 0:
            continue
        correct = b.get("real_odds_correct", 0)
        acc = correct / n
        pnls = b["real_odds_pnls"]
        avg_odds = mean(b["real_odds_list"])
        net = sum(pnls)
        roi = (net / n) * 100
        # Bootstrap CI (2000 iters)
        import random
        random.seed(42)
        samples = []
        for _ in range(2000):
            s = [pnls[random.randrange(n)] for _ in range(n)]
            samples.append(sum(s) / n * 100)
        samples.sort()
        lo = samples[50]  # 2.5th percentile
        hi = samples[1950]  # 97.5th percentile
        label = "**Totaal**" if key == "all" else f"**{key.title()}**"
        lines.append(
            f"| {label} | {n} | {fmt_pct(acc)} | {avg_odds:.2f}x | "
            f"{net:+.2f} | {roi:+.1f}% | [{lo:+.1f}%, {hi:+.1f}%] |"
        )
    lines.append("")
    lines.append("---\n")
    lines.append("## 3. Wat betekent dit voor een gebruiker op €10 per pick\n")
    lines.append("")
    for key in [*TIER_ORDER, "all"]:
        b = buckets.get(key, {})
        n = b.get("has_any_real_odds", 0)
        if n == 0:
            continue
        correct = b.get("real_odds_correct", 0)
        pnls = b["real_odds_pnls"]
        net = sum(pnls) * 10  # scale to €10 stake
        stake_total = n * 10
        roi_pct = (sum(pnls) / n) * 100
        avg_odds = mean(b["real_odds_list"])
        label = key.title() if key != "all" else "ALLE TIERS SAMEN"
        lines.append(f"### {label}")
        lines.append("")
        lines.append(f"- **{n} picks** met echte odds, gemiddelde odds **{avg_odds:.2f}x**, "
                     f"accuracy **{fmt_pct(correct / n)}**")
        lines.append(f"- Totale inzet: {fmt_eur(stake_total)}")
        lines.append(f"- Netto resultaat: **{fmt_eur(net)}** ({roi_pct:+.1f}%)")
        lines.append("")
    lines.append("---\n")
    lines.append("## Conclusie\n")
    lines.append("")
    total = buckets.get("all", {})
    n_total = total.get("total", 0)
    n_real = total.get("has_any_real_odds", 0)
    n_snap = total.get("has_snapshot", 0)
    n_oh = total.get("has_odds_history", 0)
    lines.append(f"- Van de **{n_total} predicties** heeft **{n_real}** ({n_real/n_total*100:.1f}%) echte bookmaker odds.")
    lines.append(f"- {n_snap} uit `closing_odds_snapshot` (stored at prediction time)")
    lines.append(f"- {n_oh} uit `odds_history` (ingested from paid API)")
    lines.append(f"- **{n_total - n_real}** predicties hebben géén echte odds en zouden een implied fallback nodig hebben.")
    lines.append("")
    output_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    print("Connecting to Railway...", file=sys.stderr)
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        rows = load_data(conn)
        print(f"  loaded {len(rows)} rows under trackrecord_filter", file=sys.stderr)
        buckets = analyze(rows)
        repo_root = Path(__file__).resolve().parents[2]
        out = repo_root / "docs" / "odds_coverage.md"
        out.parent.mkdir(parents=True, exist_ok=True)
        write_report(len(rows), buckets, out)
        print(f"  report → {out}", file=sys.stderr)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
