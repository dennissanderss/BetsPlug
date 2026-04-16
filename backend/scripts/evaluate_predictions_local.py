"""
Bulk-evaluate predictions locally, bypassing Railway's 200-per-5-min limit.

Same approach as fill_predictions_local.py: load everything in one query,
compute is_correct / brier / log_loss in-memory, bulk-insert via
psycopg2.execute_values. Expected runtime: ~30-60s for ~19k predictions.

Uses the SAME formulas as backend/app/services/scheduler.py::job_generate_historical_predictions
so numbers are identical to what the APScheduler would produce.

Target: all predictions WHERE prediction_source='batch_local_fill' AND
NO existing prediction_evaluations row AND match is FINISHED with a score.
"""
import math
import os
import sys
import time
import uuid
from datetime import datetime, timezone

import psycopg2
from psycopg2.extras import execute_values

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}

BATCH_SIZE = 1000  # bulk insert batch size
_LOG_CLIP = 1e-15


def main():
    print("=" * 60)
    print("  BULK LOCAL EVALUATOR")
    print("=" * 60)

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # 1. Load predictions without evaluation, joined to results
    print("\nLoading predictions + results (1 query)...")
    t0 = time.time()
    cur.execute("""
        SELECT
            p.id, p.home_win_prob, p.draw_prob, p.away_win_prob,
            r.home_score, r.away_score
        FROM predictions p
        JOIN matches m ON m.id = p.match_id
        JOIN match_results r ON r.match_id = m.id
        LEFT JOIN prediction_evaluations e ON e.prediction_id = p.id
        WHERE p.prediction_source = 'batch_local_fill'
          AND m.status = 'FINISHED'
          AND r.home_score IS NOT NULL
          AND r.away_score IS NOT NULL
          AND e.id IS NULL
    """)
    rows = cur.fetchall()
    print(f"  {len(rows):,} predictions to evaluate (loaded in {time.time()-t0:.1f}s)")

    if not rows:
        print("  Nothing to do.")
        conn.close()
        return

    # 2. Compute in-memory
    print("\nComputing is_correct / brier / log_loss...")
    t0 = time.time()
    now = datetime.now(timezone.utc)
    eval_rows = []
    for pred_id, ph, pd_, pa, hs, as_ in rows:
        if hs > as_:
            actual = "home"
        elif hs < as_:
            actual = "away"
        else:
            actual = "draw"
        probs = {
            "home": float(ph or 0.0),
            "draw": float(pd_ or 0.0),
            "away": float(pa or 0.0),
        }
        predicted = max(probs, key=lambda k: probs[k])
        is_correct = (predicted == actual)
        # Brier: same formula as scheduler.py:551 (mean squared error / 3)
        brier = sum(
            (probs.get(o, 0.0) - (1.0 if o == actual else 0.0)) ** 2
            for o in ("home", "draw", "away")
        ) / 3
        log_loss_val = -math.log(max(probs.get(actual, _LOG_CLIP), _LOG_CLIP))

        eval_rows.append((
            str(uuid.uuid4()),                  # id
            str(pred_id),                       # prediction_id
            actual,                             # actual_outcome
            int(hs),                            # actual_home_score
            int(as_),                           # actual_away_score
            is_correct,                         # is_correct
            round(brier, 6),                    # brier_score
            round(log_loss_val, 6),             # log_loss
            now,                                # evaluated_at
        ))
    print(f"  Computed {len(eval_rows):,} rows in {time.time()-t0:.2f}s")

    # 3. Bulk insert
    print(f"\nBulk-inserting in batches of {BATCH_SIZE}...")
    t0 = time.time()
    total_inserted = 0
    for i in range(0, len(eval_rows), BATCH_SIZE):
        batch = eval_rows[i:i + BATCH_SIZE]
        try:
            execute_values(
                cur,
                """
                INSERT INTO prediction_evaluations (
                    id, prediction_id, actual_outcome,
                    actual_home_score, actual_away_score,
                    is_correct, brier_score, log_loss, evaluated_at
                ) VALUES %s
                ON CONFLICT (id) DO NOTHING
                """,
                batch,
                page_size=200,
            )
            conn.commit()
            total_inserted += len(batch)
            rate = total_inserted / max(time.time() - t0, 0.01)
            print(f"  Batch {i // BATCH_SIZE + 1:>3}: wrote {total_inserted:,}/{len(eval_rows):,} "
                  f"({rate:.0f}/s)")
        except Exception as exc:
            conn.rollback()
            print(f"  Batch {i // BATCH_SIZE + 1} FAILED: {exc}")

    elapsed = time.time() - t0
    print(f"\n{'=' * 60}")
    print(f"  DONE in {elapsed:.1f}s")
    print(f"  Total evaluations written: {total_inserted:,}")
    print(f"{'=' * 60}")

    # 4. Verify counts
    cur.execute("""
        SELECT COUNT(e.id)
        FROM predictions p
        JOIN prediction_evaluations e ON e.prediction_id = p.id
        WHERE p.prediction_source = 'batch_local_fill'
    """)
    total_now = cur.fetchone()[0]
    print(f"\n  batch_local_fill preds with evaluation (after): {total_now:,}")

    conn.close()


if __name__ == "__main__":
    main()
