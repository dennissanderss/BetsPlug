"""Fase 2 — Pilot: kan API-Football echte odds leveren voor onze 3307 backtest predicties?

Haalt 50 random predicties zonder odds op, probeert voor elk via
API-Football Pro tier het /odds?fixture={id} endpoint, rapporteert de
succes-rate per tier + per league.

READ-ONLY ten opzichte van de database. Wel live API-calls (50 requests,
~0.7% van de Pro daily quota).

Usage:
    export API_FOOTBALL_KEY="your_key_here"   # Linux/macOS
    set API_FOOTBALL_KEY=your_key_here        # Windows cmd
    $env:API_FOOTBALL_KEY="your_key_here"     # PowerShell
    python backend/scripts/fase2_odds_backfill_pilot.py

Output → docs/odds_backfill_pilot.md + terminal summary
"""
from __future__ import annotations

import os
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import psycopg2
import httpx
from psycopg2.extras import RealDictCursor


# ── DB connection (same pattern as other fase2 scripts) ───────────────────
DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}

# ── API-Football ──────────────────────────────────────────────────────────
API_BASE = "https://v3.football.api-sports.io"
PILOT_SIZE = 50
REQUEST_DELAY_SECONDS = 0.5  # stay well under rate limit

# ── Tier classification ───────────────────────────────────────────────────
CONF = {"platinum": 0.75, "gold": 0.70, "silver": 0.65, "free": 0.55}

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


def load_pilot_sample(conn, size: int) -> list[dict]:
    """Random sample of predicties sans odds, with the API-Football raw id."""
    sql = """
        WITH eligible AS (
            SELECT
                p.id AS pred_id,
                p.match_id,
                p.home_win_prob,
                p.draw_prob,
                p.away_win_prob,
                p.confidence,
                m.external_id AS match_external_id,
                m.league_id::text AS league_id,
                l.name AS league_name,
                m.scheduled_at
            FROM predictions p
            JOIN prediction_evaluations pe ON pe.prediction_id = p.id
            JOIN matches m ON m.id = p.match_id
            LEFT JOIN leagues l ON l.id = m.league_id
            LEFT JOIN (
                SELECT DISTINCT match_id
                FROM odds_history
                WHERE market IN ('1x2', '1X2')
            ) oh ON oh.match_id = p.match_id
            WHERE p.prediction_source IN ('batch_local_fill', 'backtest', 'live')
              AND p.created_at >= '2026-04-16 11:00:00+00'
              AND p.predicted_at <= m.scheduled_at
              AND oh.match_id IS NULL
              AND m.external_id LIKE 'apifb_%%'
        )
        SELECT *
        FROM eligible
        ORDER BY random()
        LIMIT %s
    """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql, (size,))
        return cur.fetchall()


def call_odds_endpoint(client: httpx.Client, api_key: str, fixture_id: str) -> tuple[bool, str, dict | None]:
    """Call /odds?fixture={id}. Returns (success, reason, raw_response)."""
    try:
        resp = client.get(
            f"{API_BASE}/odds",
            headers={"x-apisports-key": api_key},
            params={"fixture": fixture_id},
            timeout=30,
        )
    except httpx.HTTPError as e:
        return False, f"http_error:{type(e).__name__}", None

    if resp.status_code == 429:
        return False, "rate_limited", None
    if resp.status_code in (401, 403):
        return False, f"auth_{resp.status_code}", None
    if resp.status_code != 200:
        return False, f"status_{resp.status_code}", None

    data = resp.json()
    response_list = data.get("response", [])
    if not response_list:
        return False, "empty_response", data

    has_1x2 = False
    for item in response_list:
        for bk in item.get("bookmakers", []):
            for bet in bk.get("bets", []):
                if bet.get("name") == "Match Winner":
                    vals = {v.get("value"): v.get("odd") for v in bet.get("values", [])}
                    if vals.get("Home") and vals.get("Draw") and vals.get("Away"):
                        has_1x2 = True
                        break
            if has_1x2:
                break
        if has_1x2:
            break

    if not has_1x2:
        return False, "no_1x2_market", data
    return True, "ok", data


def write_report(
    results: list[dict],
    output_path: Path,
) -> None:
    lines = []
    lines.append("# Fase 2 — Odds Backfill Pilot\n")
    lines.append(f"*Gegenereerd {datetime.now(timezone.utc).isoformat()}Z*\n")
    lines.append("")
    lines.append(f"**Pilot grootte:** {len(results)} random predicties zonder "
                 "bestaande odds, getest tegen API-Football `/odds?fixture=` endpoint.\n")
    lines.append("")

    # ── Overall ───────────────────────────────────────────────
    ok = sum(1 for r in results if r["success"])
    n = len(results)
    rate = (ok / n * 100) if n else 0
    lines.append(f"## Totaal: **{ok}/{n} = {rate:.1f}% succes**\n")
    lines.append("")

    # ── Per tier ──────────────────────────────────────────────
    lines.append("## Per tier\n")
    lines.append("| Tier | Tested | Success | Rate |")
    lines.append("|---|---:|---:|---:|")
    per_tier: dict[str, dict] = defaultdict(lambda: {"total": 0, "ok": 0})
    for r in results:
        t = r["tier"] or "untiered"
        per_tier[t]["total"] += 1
        if r["success"]:
            per_tier[t]["ok"] += 1
    for tier in ["free", "silver", "gold", "platinum", "untiered"]:
        s = per_tier.get(tier, {"total": 0, "ok": 0})
        if s["total"] == 0:
            continue
        lines.append(f"| {tier.title()} | {s['total']} | {s['ok']} | "
                     f"{s['ok']/s['total']*100:.1f}% |")
    lines.append("")

    # ── Per league ────────────────────────────────────────────
    lines.append("## Per league\n")
    lines.append("| League | Tested | Success | Rate |")
    lines.append("|---|---:|---:|---:|")
    per_league: dict[str, dict] = defaultdict(lambda: {"total": 0, "ok": 0})
    for r in results:
        l = r.get("league_name") or "(unknown)"
        per_league[l]["total"] += 1
        if r["success"]:
            per_league[l]["ok"] += 1
    for league, s in sorted(per_league.items(), key=lambda x: -x[1]["total"]):
        lines.append(f"| {league} | {s['total']} | {s['ok']} | "
                     f"{s['ok']/s['total']*100:.1f}% |")
    lines.append("")

    # ── Failure reasons ───────────────────────────────────────
    lines.append("## Failure reasons\n")
    lines.append("| Reason | Count |")
    lines.append("|---|---:|")
    reasons: dict[str, int] = defaultdict(int)
    for r in results:
        if not r["success"]:
            reasons[r["reason"]] += 1
    for reason, count in sorted(reasons.items(), key=lambda x: -x[1]):
        lines.append(f"| `{reason}` | {count} |")
    lines.append("")

    # ── Conclusie ─────────────────────────────────────────────
    lines.append("## Conclusie\n")
    if rate >= 80:
        lines.append("✅ **Hoge dekking (≥80%).** Volledige backfill van ~3.300 "
                     "predicties is zinvol. Kost ~44% van een Pro dagquota. "
                     "Aanbeveling: backfill 's nachts draaien, daarna ROI-tool "
                     "op historische dataset herbouwen in Fase 4.")
    elif rate >= 50:
        lines.append("⚠️ **Gemengde dekking (50-80%).** Volledige backfill is "
                     "mogelijk maar zal niet alles vullen. Aanbeveling: alleen "
                     "backfill voor tiers met hoogste per-tier rate "
                     "(meestal Gold + Platinum).")
    else:
        lines.append("❌ **Lage dekking (<50%).** API-Football archief gaat niet "
                     "ver genoeg terug voor deze dataset, of de fixtures zitten "
                     "niet in jouw subscription. Backfill heeft geen zin. "
                     "Aanbeveling: accuracy-first launch zonder ROI-feature.")
    lines.append("")
    output_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    api_key = os.environ.get("API_FOOTBALL_KEY", "").strip()
    if not api_key:
        print("ERROR: API_FOOTBALL_KEY env var not set.", file=sys.stderr)
        print("", file=sys.stderr)
        print("Windows PowerShell:", file=sys.stderr)
        print('  $env:API_FOOTBALL_KEY="your_key_here"', file=sys.stderr)
        print("  python backend/scripts/fase2_odds_backfill_pilot.py", file=sys.stderr)
        print("", file=sys.stderr)
        print("Find the key in Railway → backend service → Variables → API_FOOTBALL_KEY",
              file=sys.stderr)
        sys.exit(1)

    print("Connecting to Railway PostgreSQL...", file=sys.stderr)
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        print(f"Loading {PILOT_SIZE} random predicties zonder odds...", file=sys.stderr)
        sample = load_pilot_sample(conn, PILOT_SIZE)
        print(f"  got {len(sample)} rows", file=sys.stderr)
        if not sample:
            print("No eligible predictions found — abort.", file=sys.stderr)
            return

        results = []
        with httpx.Client() as client:
            for i, row in enumerate(sample, 1):
                # Strip prefix — backtest uses 'apifb_{id}', live uses 'apifb_match_{id}'
                ext = row["match_external_id"]
                raw_id = ext.replace("apifb_match_", "").replace("apifb_", "")
                conf = float(row["confidence"] or max(
                    row["home_win_prob"] or 0,
                    row["draw_prob"] or 0,
                    row["away_win_prob"] or 0,
                ))
                tier = classify_tier(conf, row["league_id"])

                success, reason, _ = call_odds_endpoint(client, api_key, raw_id)
                results.append({
                    "pred_id": str(row["pred_id"]),
                    "fixture_id": raw_id,
                    "tier": tier,
                    "league_name": row["league_name"],
                    "scheduled_at": row["scheduled_at"].isoformat() if row["scheduled_at"] else None,
                    "success": success,
                    "reason": reason,
                })
                status = "✓" if success else "✗"
                print(f"  [{i:2d}/{len(sample)}] {status} fixture={raw_id} "
                      f"tier={tier} reason={reason}", file=sys.stderr)
                time.sleep(REQUEST_DELAY_SECONDS)

        repo_root = Path(__file__).resolve().parents[2]
        out = repo_root / "docs" / "odds_backfill_pilot.md"
        out.parent.mkdir(parents=True, exist_ok=True)
        write_report(results, out)

        ok = sum(1 for r in results if r["success"])
        print(f"\n=== PILOT RESULT: {ok}/{len(results)} success "
              f"({ok/len(results)*100:.1f}%) ===", file=sys.stderr)
        print(f"Report → {out}", file=sys.stderr)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
