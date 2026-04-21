"""Indicative edge / threshold analysis on the 184 populated snapshots.

Sample is far below the 500-minimum prescribed by the Fase 1 prompt, so
the numbers produced here are NOT publishable and must be treated as a
sanity check only. The populated predictions all share the same single
odds source (api_football_avg) and cover only 2026-04-15 -> 2026-04-21.
"""
from __future__ import annotations

import json
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

OUTCOME_KEY = {"HOME": "home", "DRAW": "draw", "AWAY": "away"}
BOOKMAKER_KEY = {"HOME": "home", "DRAW": "draw", "AWAY": "away"}


def pctl(xs, p):
    if not xs:
        return None
    xs = sorted(xs)
    k = max(0, min(len(xs) - 1, int(round(p / 100 * (len(xs) - 1)))))
    return xs[k]


def main():
    conn = psycopg2.connect(**DB_CONFIG, connect_timeout=20)
    conn.set_session(readonly=True, autocommit=True)
    cur = conn.cursor()

    # Populated snapshots that have been evaluated.
    cur.execute(
        """
        SELECT p.id,
               p.home_win_prob, p.draw_prob, p.away_win_prob, p.confidence,
               p.closing_odds_snapshot,
               e.actual_outcome, e.is_correct,
               m.scheduled_at, l.name AS league
          FROM predictions p
          JOIN prediction_evaluations e ON e.prediction_id = p.id
          JOIN matches m ON m.id = p.match_id
          JOIN leagues l ON l.id = m.league_id
         WHERE p.closing_odds_snapshot IS NOT NULL
           AND p.closing_odds_snapshot::text NOT IN ('null','{}')
           AND p.closing_odds_snapshot ? 'bookmaker_odds'
        """
    )
    rows = cur.fetchall()
    print(f"Populated + evaluated sample: n={len(rows)}")

    edges = []          # best_edge per row
    records = []        # flat per-row record for threshold sim

    for (
        pid, p_home, p_draw, p_away, conf,
        snap, actual, is_correct, sched, league,
    ) in rows:
        # snap is already a dict via psycopg2 JSONB decoding
        book = snap.get("bookmaker_odds") or {}
        fair = snap.get("implied_probs_fair") or {}
        ev = snap.get("expected_value") or {}
        edge = snap.get("model_edge") or {}

        # best edge outcome
        best_outcome = None
        best_edge = None
        best_odds = None
        best_ev = None
        for out in ("home", "draw", "away"):
            e = edge.get(out)
            o = book.get(out)
            v = ev.get(out)
            if e is None or o is None:
                continue
            if best_edge is None or e > best_edge:
                best_edge = e
                best_outcome = out
                best_odds = o
                best_ev = v
        if best_outcome is None:
            continue

        actual_low = (actual or "").lower()
        pick_correct = actual_low == best_outcome
        if pick_correct:
            pnl = best_odds - 1.0
        else:
            pnl = -1.0

        edges.append(best_edge)
        records.append({
            "edge": best_edge,
            "odds": best_odds,
            "ev": best_ev,
            "correct": pick_correct,
            "pnl": pnl,
            "league": league,
            "outcome": best_outcome,
        })

    print(f"\nBest-edge distributie (n={len(edges)}):")
    if edges:
        print(f"  mean   : {statistics.mean(edges):+.4f}")
        print(f"  median : {statistics.median(edges):+.4f}")
        print(f"  p90    : {pctl(edges, 90):+.4f}")
        print(f"  p95    : {pctl(edges, 95):+.4f}")
        print(f"  max    : {max(edges):+.4f}")
        print(f"  %>0    : {sum(1 for e in edges if e > 0)/len(edges)*100:.1f}%")

    # Threshold sim (flat 1u stake on best-edge outcome when edge >= threshold)
    print("\nIndicatieve threshold-sim (SAMPLE TE KLEIN — niet publiceerbaar):")
    print(f"{'threshold':>10} {'picks':>7} {'acc%':>6} {'avg_odds':>9} {'ROI%':>7} {'pnl_u':>8}")
    for thr in [0.00, 0.03, 0.05, 0.08, 0.10, 0.15]:
        sub = [r for r in records if r["edge"] >= thr and 1.50 <= r["odds"] <= 5.00]
        n = len(sub)
        if n == 0:
            print(f"{thr:>10.2f} {n:>7} {'—':>6} {'—':>9} {'—':>7} {'—':>8}")
            continue
        acc = sum(1 for r in sub if r["correct"]) / n * 100
        avg_odds = statistics.mean(r["odds"] for r in sub)
        total_pnl = sum(r["pnl"] for r in sub)
        roi = total_pnl / n * 100
        print(
            f"{thr:>10.2f} {n:>7} {acc:>6.1f} {avg_odds:>9.2f} {roi:>7.1f} {total_pnl:>+8.1f}"
        )

    # Odds range sim @ threshold 0.05
    print("\nIndicatieve odds-range @ edge >= 5% (ook te klein):")
    print(f"{'range':>11} {'picks':>7} {'acc%':>6} {'ROI%':>7} {'pnl_u':>8}")
    for lo, hi, label in [
        (1.50, 2.00, "1.50-2.00"),
        (2.00, 3.00, "2.00-3.00"),
        (3.00, 5.00, "3.00-5.00"),
        (5.00, 99.0, "5.00+   "),
    ]:
        sub = [r for r in records if r["edge"] >= 0.05 and lo <= r["odds"] < hi]
        n = len(sub)
        if n == 0:
            print(f"{label:>11} {n:>7} {'—':>6} {'—':>7} {'—':>8}")
            continue
        acc = sum(1 for r in sub if r["correct"]) / n * 100
        pnl = sum(r["pnl"] for r in sub)
        roi = pnl / n * 100
        print(f"{label:>11} {n:>7} {acc:>6.1f} {roi:>7.1f} {pnl:>+8.1f}")

    # Baseline: alle picks (edge >= 0)
    all_picks = [r for r in records if 1.50 <= r["odds"] <= 5.00]
    if all_picks:
        acc = sum(1 for r in all_picks if r["correct"]) / len(all_picks) * 100
        pnl = sum(r["pnl"] for r in all_picks)
        roi = pnl / len(all_picks) * 100
        print(f"\nBaseline (alle picks in 1.50-5.00 zonder edge-filter):")
        print(f"  n={len(all_picks)}  acc={acc:.1f}%  ROI={roi:+.1f}%  pnl={pnl:+.1f}u")

    conn.close()


if __name__ == "__main__":
    main()
