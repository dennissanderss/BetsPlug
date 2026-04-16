"""
Compute accuracy per league × confidence tier on v8.1 evaluated predictions.

Used as source data for docs/tier_system_plan.md. No mutation; read-only.

Output:
  - leagues table: league_name, sport, country, n_total, n_evaluated,
    accuracy_overall, accuracy_silver (>=0.55), accuracy_gold (>=0.65),
    accuracy_platinum (>=0.75), picks_per_match_avg
  - sorted by platinum accuracy desc
  - also summary stats: top-5, top-10, top-20 weighted accuracy
"""
import json
import psycopg2
import sys

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}

OUT_JSON = "accuracy_per_league.json"
OUT_MD = "accuracy_per_league.md"


def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("""
        WITH preds AS (
            SELECT
                l.id AS league_id,
                l.name AS league_name,
                s.name AS sport,
                l.country AS country,
                p.confidence,
                e.is_correct,
                m.scheduled_at
            FROM predictions p
            JOIN prediction_evaluations e ON e.prediction_id = p.id
            JOIN matches m ON m.id = p.match_id
            JOIN leagues l ON l.id = m.league_id
            JOIN sports s ON s.id = l.sport_id
            WHERE p.prediction_source IN ('batch_local_fill', 'backtest', 'live')
              AND p.created_at >= '2026-04-16 11:00:00+00'::timestamptz
        )
        SELECT
            league_id, league_name, sport, country,
            COUNT(*) AS n_eval,
            SUM(is_correct::int) AS n_correct,
            COUNT(*) FILTER (WHERE confidence >= 0.55) AS n_silver,
            SUM(CASE WHEN confidence >= 0.55 AND is_correct THEN 1 ELSE 0 END) AS c_silver,
            COUNT(*) FILTER (WHERE confidence >= 0.60) AS n_botd,
            SUM(CASE WHEN confidence >= 0.60 AND is_correct THEN 1 ELSE 0 END) AS c_botd,
            COUNT(*) FILTER (WHERE confidence >= 0.65) AS n_gold,
            SUM(CASE WHEN confidence >= 0.65 AND is_correct THEN 1 ELSE 0 END) AS c_gold,
            COUNT(*) FILTER (WHERE confidence >= 0.75) AS n_plat,
            SUM(CASE WHEN confidence >= 0.75 AND is_correct THEN 1 ELSE 0 END) AS c_plat,
            MIN(scheduled_at)::date AS first_match,
            MAX(scheduled_at)::date AS last_match
        FROM preds
        GROUP BY league_id, league_name, sport, country
        HAVING COUNT(*) >= 30   -- skip micro-leagues with too little data
        ORDER BY league_id
    """)

    leagues = []
    for row in cur.fetchall():
        (lid, lname, sport, country, n_eval, n_correct,
         n_sil, c_sil, n_botd, c_botd, n_gold, c_gold, n_plat, c_plat,
         first_m, last_m) = row

        def acc(c, n):
            return round(100.0 * c / n, 1) if n > 0 else None

        leagues.append({
            "league_id": str(lid),
            "league": lname,
            "sport": sport,
            "country": country,
            "n_eval": n_eval,
            "accuracy_overall": acc(n_correct, n_eval),
            "silver": {"n": n_sil, "acc": acc(c_sil, n_sil)},
            "botd":   {"n": n_botd, "acc": acc(c_botd, n_botd)},
            "gold":   {"n": n_gold, "acc": acc(c_gold, n_gold)},
            "platinum": {"n": n_plat, "acc": acc(c_plat, n_plat)},
            "first_match": str(first_m),
            "last_match": str(last_m),
        })

    # Sort by platinum accuracy desc (leagues with >=30 platinum picks only)
    def plat_key(x):
        n = x["platinum"]["n"]
        a = x["platinum"]["acc"] or 0
        # composite: big sample first, then accuracy
        return (-n if n >= 30 else 999999, -a)

    # Separate: leagues with >= 30 platinum picks (reliable) vs less
    reliable = [L for L in leagues if L["platinum"]["n"] >= 30]
    sparse = [L for L in leagues if L["platinum"]["n"] < 30]
    reliable.sort(key=lambda x: -(x["platinum"]["acc"] or 0))
    sparse.sort(key=lambda x: -x["n_eval"])

    # Write JSON
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump({"reliable": reliable, "sparse": sparse}, f, indent=2)

    # Write MD
    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write("# Accuracy per League — v8.1 Evaluated Predictions\n\n")
        f.write(f"Total leagues: {len(leagues)} (with >=30 predictions)\n")
        f.write(f"Reliable (>=30 Platinum picks): {len(reliable)}\n")
        f.write(f"Sparse: {len(sparse)}\n\n")
        f.write("## Reliable leagues — ranked by Platinum accuracy\n\n")
        f.write("| # | League | Sport | Country | Eval | Overall | Silver (>=55%) | BOTD (>=60%) | Gold (>=65%) | **Platinum (>=75%)** |\n")
        f.write("|:-:|--------|:-----:|:-------:|:----:|:-------:|:--:|:--:|:--:|:--:|\n")
        for i, L in enumerate(reliable, 1):
            def fmt(t): return f"{t['n']}/{t['acc']}%" if t['n'] else "-"
            f.write(f"| {i} | {L['league']} | {L['sport']} | {L['country'] or ''} | "
                    f"{L['n_eval']} | {L['accuracy_overall']}% | "
                    f"{fmt(L['silver'])} | {fmt(L['botd'])} | {fmt(L['gold'])} | **{fmt(L['platinum'])}** |\n")

        f.write("\n## Sparse leagues (<30 Platinum picks) — ranked by eval count\n\n")
        f.write("| League | Sport | Country | Eval | Overall | Platinum (>=75%) |\n")
        f.write("|--------|:-:|:-:|:-:|:-:|:-:|\n")
        for L in sparse:
            f.write(f"| {L['league']} | {L['sport']} | {L['country'] or ''} | "
                    f"{L['n_eval']} | {L['accuracy_overall']}% | "
                    f"{L['platinum']['n']}/{L['platinum']['acc'] or '-'}% |\n")

    # Print compact summary to console
    print(f"Total leagues with >=30 predictions: {len(leagues)}")
    print(f"  Reliable (>=30 Platinum picks): {len(reliable)}")
    print(f"  Sparse: {len(sparse)}")
    print()
    print("TOP 20 LEAGUES BY PLATINUM ACCURACY:")
    print(f"  {'#':<3} {'League':<35} {'Plat n':>7} {'Plat acc':>9} {'Gold acc':>9} {'Eval':>7}")
    for i, L in enumerate(reliable[:20], 1):
        print(f"  {i:<3} {L['league'][:34]:<35} {L['platinum']['n']:>7} "
              f"{L['platinum']['acc']:>8}% {L['gold']['acc'] or 0:>8}% {L['n_eval']:>7}")

    # Cumulative weighted accuracy (top-N scenarios)
    print()
    print("CUMULATIEVE GEWOGEN ACCURACY (Platinum):")
    cum_n = 0
    cum_c = 0
    for i, L in enumerate(reliable, 1):
        n = L['platinum']['n']
        c = round(L['platinum']['acc'] * n / 100)
        cum_n += n
        cum_c += c
        if i in (3, 5, 10, 15, 20, 30, len(reliable)):
            acc = round(100 * cum_c / cum_n, 1)
            print(f"  Top {i:>3} leagues: cumulative {cum_n:>5} Platinum picks, {acc}% accuracy")

    # Save to DB-free file paths relative to docs
    print()
    print(f"Detailed output: accuracy_per_league.json and accuracy_per_league.md")

    conn.close()


if __name__ == "__main__":
    main()
