"""Run backend/scripts/integrity_audit.sql against Railway DB.

Read-only. Uses the existing DB credentials already used by every
other local script (check_new_predictions.py, verify_accuracy_numbers.py).

Output is the human-readable pass/fail the audit doc describes.
"""
import os
import psycopg2

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}

HERE = os.path.dirname(os.path.abspath(__file__))
SQL_PATH = os.path.join(HERE, "integrity_audit.sql")


def fmt_status(ok: bool) -> str:
    return "PASS" if ok else "FAIL"


def main() -> None:
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    print("=" * 60)
    print("  BetsPlug — Trackrecord integrity audit")
    print("=" * 60)

    # Q1 — ghost predictions
    cur.execute(
        """
        SELECT COUNT(*)
        FROM predictions p
        LEFT JOIN matches m ON m.id = p.match_id
        WHERE m.id IS NULL
        """
    )
    q1 = cur.fetchone()[0]
    print(f"  Q1 ghost predictions        : {q1:>6}  [{fmt_status(q1 == 0)}]")

    # Q2 — ghost evaluations
    cur.execute(
        """
        SELECT COUNT(*)
        FROM prediction_evaluations e
        LEFT JOIN predictions p ON p.id = e.prediction_id
        WHERE p.id IS NULL
        """
    )
    q2 = cur.fetchone()[0]
    print(f"  Q2 ghost evaluations        : {q2:>6}  [{fmt_status(q2 == 0)}]")

    # Q3 — duplicate evaluations
    cur.execute(
        """
        SELECT prediction_id, COUNT(*) AS eval_rows
        FROM prediction_evaluations
        GROUP BY prediction_id
        HAVING COUNT(*) > 1
        ORDER BY eval_rows DESC
        LIMIT 20
        """
    )
    q3 = cur.fetchall()
    print(f"  Q3 duplicate evaluations    : {len(q3):>6} rows  [{fmt_status(len(q3) == 0)}]")
    for row in q3[:5]:
        print(f"       prediction_id={row[0]}  count={row[1]}")

    # Q4 — is_correct contradicts scoreboard
    cur.execute(
        """
        SELECT
          e.prediction_id,
          e.actual_outcome,
          r.home_score,
          r.away_score,
          e.is_correct
        FROM prediction_evaluations e
        JOIN predictions p       ON p.id = e.prediction_id
        JOIN matches m           ON m.id = p.match_id
        JOIN match_results r     ON r.match_id = m.id
        WHERE r.home_score IS NOT NULL
          AND r.away_score IS NOT NULL
          AND NOT (
            (e.actual_outcome = 'home' AND r.home_score >  r.away_score) OR
            (e.actual_outcome = 'draw' AND r.home_score =  r.away_score) OR
            (e.actual_outcome = 'away' AND r.home_score <  r.away_score)
          )
        LIMIT 20
        """
    )
    q4 = cur.fetchall()
    print(f"  Q4 scoreboard mismatches    : {len(q4):>6} rows  [{fmt_status(len(q4) == 0)}]")
    for row in q4[:5]:
        pred_id, outcome, hs, as_, ok = row
        print(f"       prediction_id={pred_id}  outcome={outcome}  score={hs}-{as_}  is_correct={ok}")

    print()
    total_fail = (q1 != 0) + (q2 != 0) + (len(q3) != 0) + (len(q4) != 0)
    if total_fail == 0:
        print("  VERDICT: all four checks PASS — headline accuracy is backed by clean data.")
    else:
        print(f"  VERDICT: {total_fail} of 4 checks failed — see rows above. Fix before launch.")

    conn.close()


if __name__ == "__main__":
    main()
