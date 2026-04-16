"""
Before/after comparison of 3 user-facing endpoints — direct SQL both ways.
Replicates the exact queries in:
  - /api/dashboard/metrics
  - /api/trackrecord/summary
  - /api/homepage/free-picks (stats block)

Prints unfiltered (legacy) vs v8.1-filtered numbers side by side.
"""
import psycopg2

DB = dict(host="nozomi.proxy.rlwy.net", port=29246, user="postgres",
          password="tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq", dbname="railway")

V81_FILTER_SQL = """
  p.prediction_source IN ('batch_local_fill', 'backtest', 'live')
  AND p.created_at >= '2026-04-16 11:00:00+00'::timestamptz
"""


def hdr(t):
    print()
    print("=" * 68)
    print(f"  {t}")
    print("=" * 68)


def main():
    c = psycopg2.connect(**DB)
    cur = c.cursor()

    # ────────────────────────────────────────────────────────────────
    hdr("1. /api/dashboard/metrics")
    # ────────────────────────────────────────────────────────────────
    for label, extra in [
        ("VOOR filter", ""),
        ("NA filter  ", f"WHERE {V81_FILTER_SQL}"),
    ]:
        cur.execute(f"""
            SELECT
                (SELECT COUNT(*) FROM predictions p {extra}) AS total,
                (SELECT COUNT(*) FROM prediction_evaluations e
                   JOIN predictions p ON p.id=e.prediction_id {extra}) AS evaluated,
                (SELECT COUNT(*) FROM prediction_evaluations e
                   JOIN predictions p ON p.id=e.prediction_id
                   WHERE e.is_correct IS TRUE
                   {"AND" if extra else ""} {V81_FILTER_SQL if extra else ""}
                   ) AS correct,
                (SELECT AVG(e.brier_score) FROM prediction_evaluations e
                   JOIN predictions p ON p.id=e.prediction_id {extra}) AS avg_brier,
                (SELECT AVG(p.confidence) FROM predictions p {extra}) AS avg_conf
        """)
        total, evald, cor, brier, conf = cur.fetchone()
        acc = (cor / evald * 100) if evald else 0
        print(f"  {label}: total={total:>6} evaluated={evald:>6} correct={cor:>6}"
              f" accuracy={acc:>5.2f}%  brier={brier or 0:.4f}  avg_conf={conf or 0:.3f}")

    # ────────────────────────────────────────────────────────────────
    hdr("2. /api/trackrecord/summary (no model_version_id, no source)")
    # ────────────────────────────────────────────────────────────────
    for label, join_filter in [
        ("VOOR filter", ""),
        ("NA filter  ", f"AND {V81_FILTER_SQL}"),
    ]:
        cur.execute(f"""
            SELECT
                COUNT(e.id) AS total,
                SUM(e.is_correct::int) AS correct,
                AVG(e.brier_score) AS avg_brier,
                AVG(e.log_loss) AS avg_log_loss,
                AVG(p.confidence) AS avg_conf,
                MIN(m.scheduled_at)::date AS p_start,
                MAX(m.scheduled_at)::date AS p_end
            FROM prediction_evaluations e
            JOIN predictions p ON p.id = e.prediction_id
            JOIN matches m ON m.id = p.match_id
            WHERE TRUE {join_filter}
        """)
        total, cor, brier, logloss, conf, p_start, p_end = cur.fetchone()
        acc = (cor / total * 100) if total else 0
        print(f"  {label}: total={total:>6} correct={cor:>6}"
              f" accuracy={acc:>5.2f}%  brier={brier or 0:.4f}  conf={conf or 0:.3f}")
        print(f"            period: {p_start} to {p_end}")

    # ────────────────────────────────────────────────────────────────
    hdr("3. /api/homepage/free-picks (30-day winrate block)")
    # ────────────────────────────────────────────────────────────────
    for label, extra in [
        ("VOOR filter", ""),
        ("NA filter  ", f"AND {V81_FILTER_SQL}"),
    ]:
        cur.execute(f"""
            SELECT
                COUNT(e.id) AS total,
                SUM(CASE WHEN e.is_correct IS TRUE THEN 1 ELSE 0 END) AS correct
            FROM prediction_evaluations e
            JOIN predictions p ON p.id = e.prediction_id
            JOIN matches m ON m.id = p.match_id
            WHERE m.scheduled_at >= (NOW() - INTERVAL '30 days')
              {extra}
        """)
        total, cor = cur.fetchone()
        total = total or 0
        cor = cor or 0
        wr = (cor / total) if total else 0
        print(f"  {label}: total={total:>6} correct={cor:>6}  winrate={wr:.4f}  ({wr*100:.1f}%)")

    # ────────────────────────────────────────────────────────────────
    hdr("BONUS: Per-tier breakdown of the v8.1 set (what users will see)")
    # ────────────────────────────────────────────────────────────────
    cur.execute(f"""
        WITH preds AS (
            SELECT p.confidence,
                e.is_correct
            FROM prediction_evaluations e
            JOIN predictions p ON p.id = e.prediction_id
            WHERE {V81_FILTER_SQL}
        )
        SELECT
            COUNT(*) FILTER (WHERE confidence >= 0.75) AS plat_n,
            COUNT(*) FILTER (WHERE confidence >= 0.75 AND is_correct) AS plat_c,
            COUNT(*) FILTER (WHERE confidence >= 0.65) AS gold_n,
            COUNT(*) FILTER (WHERE confidence >= 0.65 AND is_correct) AS gold_c,
            COUNT(*) FILTER (WHERE confidence >= 0.60) AS botd_n,
            COUNT(*) FILTER (WHERE confidence >= 0.60 AND is_correct) AS botd_c,
            COUNT(*) AS total, SUM(is_correct::int) AS total_c
        FROM preds
    """)
    pn, pc, gn, gc, bn, bc, tn, tc = cur.fetchone()
    def p(n, c):
        return f"{c}/{n} = {100*c/max(n,1):.1f}%"
    print(f"  Platinum (>=75%): {p(pn, pc)}")
    print(f"  Gold+    (>=65%): {p(gn, gc)}")
    print(f"  BOTD     (>=60%): {p(bn, bc)}")
    print(f"  Total:            {p(tn, tc)}")

    c.close()


if __name__ == "__main__":
    main()
