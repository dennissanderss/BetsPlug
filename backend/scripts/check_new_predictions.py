"""
Check how many predictions were generated after the v8.1 feature-parity fix.
Also report accuracy on the new pipeline predictions.
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

# Deploy timestamp: when commit b7270b9 went live on Railway
# Using a conservative window — anything from today UTC
DEPLOY_AFTER_UTC = "2026-04-16 11:40:00+00"  # after local fill batch


def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Total predictions
    cur.execute("SELECT COUNT(*) FROM predictions")
    total = cur.fetchone()[0]

    # Predictions created after deploy
    cur.execute(
        "SELECT COUNT(*) FROM predictions WHERE created_at > %s::timestamptz",
        (DEPLOY_AFTER_UTC,),
    )
    new_total = cur.fetchone()[0]

    # Finished matches without predictions (remaining pool)
    cur.execute(
        """
        SELECT COUNT(*)
        FROM matches m
        LEFT JOIN predictions p ON p.match_id = m.id
        WHERE m.status = 'FINISHED'
          AND p.id IS NULL
        """
    )
    missing = cur.fetchone()[0]

    print("=" * 60)
    print("  PREDICTIONS STATE")
    print("=" * 60)
    print(f"  Total predictions:            {total:>8,}")
    print(f"  Created after v8.1 fix:       {new_total:>8,}")
    print(f"  Finished matches uncovered:   {missing:>8,}")
    print()

    if new_total == 0:
        print("  No new predictions yet. Fill script may still be running.")
        conn.close()
        return

    # Accuracy on NEW-pipeline predictions
    # Predicted pick = team with highest prob; confidence = that prob
    cur.execute(
        """
        WITH new_preds AS (
            SELECT
                p.id,
                p.match_id,
                p.home_win_prob AS ph,
                p.draw_prob AS pd,
                p.away_win_prob AS pa,
                p.confidence,
                CASE
                    WHEN p.home_win_prob >= p.draw_prob AND p.home_win_prob >= p.away_win_prob THEN 'HOME'
                    WHEN p.away_win_prob >= p.home_win_prob AND p.away_win_prob >= p.draw_prob THEN 'AWAY'
                    ELSE 'DRAW'
                END AS predicted_outcome,
                CASE
                    WHEN r.home_score > r.away_score THEN 'HOME'
                    WHEN r.home_score < r.away_score THEN 'AWAY'
                    ELSE 'DRAW'
                END AS actual_outcome
            FROM predictions p
            JOIN matches m ON m.id = p.match_id
            LEFT JOIN match_results r ON r.match_id = m.id
            WHERE p.created_at > %s::timestamptz
              AND m.status = 'FINISHED'
              AND r.home_score IS NOT NULL
        )
        SELECT
            COUNT(*) AS n_total,
            SUM(CASE WHEN predicted_outcome = actual_outcome THEN 1 ELSE 0 END) AS n_correct,
            SUM(CASE WHEN confidence >= 0.75 THEN 1 ELSE 0 END) AS n_platinum,
            SUM(CASE WHEN confidence >= 0.75 AND predicted_outcome = actual_outcome THEN 1 ELSE 0 END) AS n_platinum_correct,
            SUM(CASE WHEN confidence >= 0.65 THEN 1 ELSE 0 END) AS n_goldplus,
            SUM(CASE WHEN confidence >= 0.65 AND predicted_outcome = actual_outcome THEN 1 ELSE 0 END) AS n_goldplus_correct,
            SUM(CASE WHEN confidence >= 0.60 THEN 1 ELSE 0 END) AS n_botd,
            SUM(CASE WHEN confidence >= 0.60 AND predicted_outcome = actual_outcome THEN 1 ELSE 0 END) AS n_botd_correct
        FROM new_preds
        """,
        (DEPLOY_AFTER_UTC,),
    )
    (
        n_tot,
        n_cor,
        n_plat,
        n_plat_c,
        n_gold,
        n_gold_c,
        n_botd,
        n_botd_c,
    ) = cur.fetchone()

    print("=" * 60)
    print("  ACCURACY ON NEW-PIPELINE PREDICTIONS (FINISHED ONLY)")
    print("=" * 60)
    print(f"  Sample size: {n_tot:,} predictions evaluated\n")

    if n_tot and n_tot > 0:
        print(f"  Overall accuracy:  {n_cor}/{n_tot} = {100.0*n_cor/n_tot:.1f}%")
        if n_plat:
            print(
                f"  Platinum (>=75%):  {n_plat_c}/{n_plat} = {100.0*n_plat_c/n_plat:.1f}%"
                f"  (walk-forward target: 78%)"
            )
        if n_gold:
            print(
                f"  Gold+ (>=65%):     {n_gold_c}/{n_gold} = {100.0*n_gold_c/n_gold:.1f}%"
                f"  (walk-forward target: 70%)"
            )
        if n_botd:
            print(
                f"  BOTD (>=60%):      {n_botd_c}/{n_botd} = {100.0*n_botd_c/n_botd:.1f}%"
                f"  (walk-forward target: 67%)"
            )
    else:
        print("  No finished matches predicted by new pipeline yet.")

    conn.close()


if __name__ == "__main__":
    main()
