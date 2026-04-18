"""Read-only pipeline health probe.

Reports:
- last prediction timestamp (overall + per source)
- last evaluation timestamp
- upcoming matches with / without predictions
- finished matches (last 7 days) with / without predictions
- finished matches without evaluations

Used to diagnose why /fixtures/today or /fixtures/results show 0 predictions.
"""
import psycopg2
from datetime import datetime, timezone

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}


def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    print("=" * 60)
    print("  PIPELINE STATUS — read-only probe")
    print("=" * 60)

    cur.execute("SELECT NOW() AT TIME ZONE 'UTC'")
    now_utc = cur.fetchone()[0]
    print(f"  DB wall clock (UTC):          {now_utc}")

    cur.execute(
        "SELECT prediction_source, COUNT(*), MAX(predicted_at), MAX(created_at) "
        "FROM predictions GROUP BY prediction_source ORDER BY COUNT(*) DESC"
    )
    print("\n  Predictions by source:")
    for src, n, pa_max, ca_max in cur.fetchall():
        print(f"    {src or '(null)':<20} {n:>8,}  pred_at<={pa_max}  created<={ca_max}")

    cur.execute("SELECT MAX(evaluated_at), COUNT(*) FROM prediction_evaluations")
    eval_max, n_eval = cur.fetchone()
    print(f"\n  Evaluations: {n_eval:,} total, last at {eval_max}")

    cur.execute(
        """
        SELECT COUNT(*)
        FROM matches m
        WHERE m.status = 'scheduled' AND m.scheduled_at >= NOW()
        """
    )
    upcoming = cur.fetchone()[0]
    cur.execute(
        """
        SELECT COUNT(DISTINCT m.id)
        FROM matches m
        JOIN predictions p ON p.match_id = m.id
        WHERE m.status = 'scheduled' AND m.scheduled_at >= NOW()
        """
    )
    upcoming_with_pred = cur.fetchone()[0]
    print(
        f"\n  Upcoming scheduled matches:   {upcoming:>8,}  "
        f"with prediction: {upcoming_with_pred:,}"
    )

    cur.execute(
        """
        SELECT DATE(m.scheduled_at) AS d,
               COUNT(DISTINCT m.id) AS total,
               COUNT(DISTINCT p.match_id) AS with_pred,
               COUNT(DISTINCT pe.prediction_id) AS evaluated
        FROM matches m
        LEFT JOIN predictions p ON p.match_id = m.id
        LEFT JOIN prediction_evaluations pe ON pe.prediction_id = p.id
        WHERE m.status = 'finished'
          AND m.scheduled_at >= NOW() - INTERVAL '8 days'
        GROUP BY DATE(m.scheduled_at)
        ORDER BY d
        """
    )
    print("\n  Finished matches, last 8 days:")
    print(f"    {'date':<12} {'total':>6} {'with_pred':>10} {'evaluated':>10}")
    for d, total, wp, ev in cur.fetchall():
        print(f"    {str(d):<12} {total:>6} {wp:>10} {ev:>10}")

    cur.execute(
        """
        SELECT COUNT(*) FROM predictions p
        JOIN matches m ON m.id = p.match_id
        WHERE m.status = 'finished'
          AND NOT EXISTS (
            SELECT 1 FROM prediction_evaluations pe WHERE pe.prediction_id = p.id
          )
        """
    )
    unevaluated = cur.fetchone()[0]
    print(f"\n  Predictions on finished matches without evaluation: {unevaluated:,}")

    # Pre-match vs post-match lock split for last 3 days finished matches
    cur.execute(
        """
        SELECT
            SUM(CASE WHEN p.predicted_at <= m.scheduled_at THEN 1 ELSE 0 END) AS pre_match,
            SUM(CASE WHEN p.predicted_at > m.scheduled_at THEN 1 ELSE 0 END) AS post_match
        FROM predictions p
        JOIN matches m ON m.id = p.match_id
        WHERE m.status = 'finished'
          AND m.scheduled_at >= NOW() - INTERVAL '3 days'
        """
    )
    pre_match, post_match = cur.fetchone()
    print(f"\n  Last 3d finished match predictions — pre-match locked: {pre_match or 0:,}  "
          f"post-match (backtest): {post_match or 0:,}")

    conn.close()


if __name__ == "__main__":
    main()
