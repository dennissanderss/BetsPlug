"""One-off backfill of historical value bets.

Walks every ``live`` prediction with a populated ``closing_odds_snapshot``,
runs the ``ValueBetSelector`` over it, and inserts qualifying picks into
``value_bets`` with ``is_live = False``.

Design:
  - Idempotent: inserts are gated by the ``uq_value_bets_prediction_live``
    unique constraint on ``(prediction_id, is_live)``. Running twice is
    safe; existing rows are skipped.
  - Per-match pickup: one backfill row per prediction (not aggregated to
    one per day), because the daily-unique rule is a live-pipeline
    concern, not a historical one.
  - Evaluator: if the prediction is already evaluated
    (``prediction_evaluations`` row exists), the backfill row is
    populated with ``is_evaluated = True`` + P/L.

Usage:
  python backend/scripts/backfill_value_bets.py
  python backend/scripts/backfill_value_bets.py --limit 500 --dry-run
"""
from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path
from datetime import datetime, timezone

# Allow running as ``python backend/scripts/...`` from repo root without
# packaging gymnastics.
_here = Path(__file__).resolve().parent.parent
if str(_here) not in sys.path:
    sys.path.insert(0, str(_here))

import psycopg2
from psycopg2.extras import RealDictCursor, Json

from app.services.value_bet_service import (  # noqa: E402
    ValueBetConfig,
    ValueBetSelector,
    extract_candidate_from_snapshot,
)
from app.core.tier_leagues import (  # noqa: E402
    LEAGUES_FREE,
    LEAGUES_GOLD,
    LEAGUES_PLATINUM,
    LEAGUES_SILVER,
)
from app.core.tier_system import CONF_THRESHOLD, PickTier  # noqa: E402


DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}

log = logging.getLogger("backfill_value_bets")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


def classify_tier(league_id: str, confidence: float) -> str | None:
    lid = str(league_id)
    if lid in LEAGUES_PLATINUM and confidence >= CONF_THRESHOLD[PickTier.PLATINUM]:
        return "platinum"
    if lid in LEAGUES_GOLD and confidence >= CONF_THRESHOLD[PickTier.GOLD]:
        return "gold"
    if lid in LEAGUES_SILVER and confidence >= CONF_THRESHOLD[PickTier.SILVER]:
        return "silver"
    if lid in LEAGUES_FREE and confidence >= CONF_THRESHOLD[PickTier.FREE]:
        return "free"
    return None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dry-run", action="store_true",
        help="No writes; just report how many rows would be inserted.",
    )
    parser.add_argument(
        "--limit", type=int, default=None,
        help="Max predictions to consider (default: all).",
    )
    args = parser.parse_args()

    selector = ValueBetSelector(ValueBetConfig())

    conn = psycopg2.connect(**DB_CONFIG, connect_timeout=20)
    conn.autocommit = False
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT p.id AS prediction_id,
                   p.match_id,
                   p.home_win_prob,
                   p.draw_prob,
                   p.away_win_prob,
                   p.confidence,
                   p.closing_odds_snapshot,
                   p.predicted_at,
                   m.scheduled_at,
                   m.league_id,
                   e.actual_outcome,
                   e.is_correct,
                   e.evaluated_at
              FROM predictions p
              JOIN matches m ON m.id = p.match_id
              LEFT JOIN prediction_evaluations e ON e.prediction_id = p.id
             WHERE p.prediction_source = 'live'
               AND p.closing_odds_snapshot IS NOT NULL
               AND p.closing_odds_snapshot::text NOT IN ('null','{}')
               AND p.closing_odds_snapshot ? 'bookmaker_odds'
             ORDER BY p.predicted_at
            """
        )
        rows = cur.fetchall()
        if args.limit:
            rows = rows[: args.limit]
        log.info("Found %d candidate predictions", len(rows))

        considered = 0
        qualified = 0
        inserted = 0
        skipped_existing = 0

        write_cur = conn.cursor()
        for r in rows:
            considered += 1
            tier = classify_tier(r["league_id"], r["confidence"])
            cand = extract_candidate_from_snapshot(
                prediction_id=r["prediction_id"],
                match_id=r["match_id"],
                home_prob=r["home_win_prob"],
                draw_prob=r["draw_prob"],
                away_prob=r["away_win_prob"],
                confidence=r["confidence"],
                tier=tier,
                snapshot=r["closing_odds_snapshot"],
                selector=selector,
                scheduled_at=r["scheduled_at"],
            )
            if cand is None or not selector.passes_filters(cand):
                continue
            qualified += 1
            if args.dry_run:
                continue

            # Determine bet_date = match scheduled_at (date part UTC)
            sched: datetime = r["scheduled_at"]
            bet_date = sched.date()
            picked_at: datetime = r["predicted_at"]

            pnl = None
            is_correct = None
            actual_out = None
            evaluated_at = r.get("evaluated_at")
            is_evaluated = bool(r.get("evaluated_at"))
            if is_evaluated:
                actual_out = (r["actual_outcome"] or "").lower() or None
                is_correct = bool(
                    actual_out == cand.pick if actual_out else False
                )
                pnl = (cand.best_odds_for_pick - 1.0) if is_correct else -1.0

            params = {
                "id": _new_uuid_str(),
                "prediction_id": str(r["prediction_id"]),
                "match_id": str(r["match_id"]),
                "bet_date": bet_date,
                "picked_at": picked_at,
                "our_pick": cand.pick,
                "our_probability": cand.our_probability,
                "our_probability_home": cand.our_prob_home,
                "our_probability_draw": cand.our_prob_draw,
                "our_probability_away": cand.our_prob_away,
                "our_confidence": cand.confidence,
                "prediction_tier": cand.tier,
                "odds_source": cand.odds_source,
                "odds_home": cand.odds_home,
                "odds_draw": cand.odds_draw,
                "odds_away": cand.odds_away,
                "odds_snapshot_at": cand.odds_snapshot_at,
                "best_odds_for_pick": cand.best_odds_for_pick,
                "bookmaker_implied_home": 1.0 / cand.odds_home,
                "bookmaker_implied_draw": (
                    1.0 / cand.odds_draw if cand.odds_draw else None
                ),
                "bookmaker_implied_away": 1.0 / cand.odds_away,
                "overround": cand.overround,
                "margin": cand.margin,
                "fair_implied_home": cand.fair_home,
                "fair_implied_draw": cand.fair_draw,
                "fair_implied_away": cand.fair_away,
                "normalization_method": selector.config.normalization_method,
                "edge": cand.edge,
                "expected_value": cand.expected_value,
                "kelly_fraction": cand.kelly,
                "is_live": False,
                "is_evaluated": is_evaluated,
                "is_correct": is_correct,
                "actual_outcome": actual_out,
                "profit_loss_units": pnl,
                "evaluated_at": evaluated_at,
            }
            try:
                write_cur.execute(
                    """
                    INSERT INTO value_bets (
                        id, prediction_id, match_id, bet_date, picked_at,
                        our_pick, our_probability, our_probability_home,
                        our_probability_draw, our_probability_away, our_confidence,
                        prediction_tier,
                        odds_source, odds_home, odds_draw, odds_away,
                        odds_snapshot_at, best_odds_for_pick,
                        bookmaker_implied_home, bookmaker_implied_draw,
                        bookmaker_implied_away, overround, margin,
                        fair_implied_home, fair_implied_draw, fair_implied_away,
                        normalization_method, edge, expected_value, kelly_fraction,
                        is_live, is_evaluated, is_correct, actual_outcome,
                        profit_loss_units, evaluated_at
                    ) VALUES (
                        %(id)s, %(prediction_id)s, %(match_id)s, %(bet_date)s, %(picked_at)s,
                        %(our_pick)s, %(our_probability)s, %(our_probability_home)s,
                        %(our_probability_draw)s, %(our_probability_away)s, %(our_confidence)s,
                        %(prediction_tier)s,
                        %(odds_source)s, %(odds_home)s, %(odds_draw)s, %(odds_away)s,
                        %(odds_snapshot_at)s, %(best_odds_for_pick)s,
                        %(bookmaker_implied_home)s, %(bookmaker_implied_draw)s,
                        %(bookmaker_implied_away)s, %(overround)s, %(margin)s,
                        %(fair_implied_home)s, %(fair_implied_draw)s, %(fair_implied_away)s,
                        %(normalization_method)s, %(edge)s, %(expected_value)s, %(kelly_fraction)s,
                        %(is_live)s, %(is_evaluated)s, %(is_correct)s, %(actual_outcome)s,
                        %(profit_loss_units)s, %(evaluated_at)s
                    )
                    ON CONFLICT ON CONSTRAINT uq_value_bets_prediction_live DO NOTHING
                    """,
                    params,
                )
                if write_cur.rowcount == 1:
                    inserted += 1
                else:
                    skipped_existing += 1
            except Exception as exc:
                log.warning(
                    "insert failed for prediction %s: %s", r["prediction_id"], exc
                )
                conn.rollback()
                continue

        if args.dry_run:
            log.info(
                "[dry-run] considered=%d qualified=%d "
                "(would insert up to %d rows)",
                considered, qualified, qualified,
            )
        else:
            conn.commit()
            log.info(
                "considered=%d qualified=%d inserted=%d skipped_existing=%d",
                considered, qualified, inserted, skipped_existing,
            )
    finally:
        conn.close()


def _new_uuid_str() -> str:
    import uuid
    return str(uuid.uuid4())


if __name__ == "__main__":
    main()
