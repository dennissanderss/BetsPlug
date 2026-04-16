"""
Herbereken tier accuracy na besluitpunten:
- Silver: top 14 (exclude J1, Ligue1, Europa, sparse)
- Gold: top 10 + check of Europa League / Ligue 1 passen met conf>=0.65
- Platinum: top 5, conservatief beeld voor "85%+" claim
- Free: alles incl. sparse

Output: samples + accuracy per tier + picks/dag schatting.
"""
import psycopg2

DB = dict(host="nozomi.proxy.rlwy.net", port=29246, user="postgres",
          password="tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq", dbname="railway")

# League-namen (UUIDs worden dynamisch opgehaald)
TOP5 = ["UEFA Champions League", "Süper Lig", "Eredivisie", "Premier League", "Saudi Pro League"]
# Note: in DB is het "UEFA Champions League" maar in output zagen we "Champions League" — check

TOP10 = TOP5 + ["Scottish Premiership", "Liga MX", "Chinese Super League", "Primeira Liga", "Bundesliga"]
TOP14 = TOP10 + ["Jupiler Pro League", "Championship", "La Liga", "Serie A"]

# Candidates om te overwegen in Gold met hogere confidence
GOLD_CANDIDATES = ["Europa League", "Ligue 1"]


def get_league_ids(cur, names):
    cur.execute("SELECT id, name FROM leagues WHERE name = ANY(%s)", (list(names),))
    return {name: str(lid) for lid, name in cur.fetchall()}


def accuracy_filtered(cur, league_names, conf_min, label):
    """Compute accuracy for predictions in given leagues with conf >= conf_min."""
    cur.execute("""
        WITH preds AS (
            SELECT p.confidence, e.is_correct, m.scheduled_at
            FROM predictions p
            JOIN prediction_evaluations e ON e.prediction_id = p.id
            JOIN matches m ON m.id = p.match_id
            JOIN leagues l ON l.id = m.league_id
            WHERE p.prediction_source IN ('batch_local_fill', 'backtest', 'live')
              AND p.created_at >= '2026-04-16 11:00:00+00'::timestamptz
              AND l.name = ANY(%s)
              AND p.confidence >= %s
        )
        SELECT
            COUNT(*) AS n, SUM(is_correct::int) AS c,
            MIN(scheduled_at)::date, MAX(scheduled_at)::date
        FROM preds
    """, (list(league_names), conf_min))
    n, c, dmin, dmax = cur.fetchone()
    acc = 100 * c / n if n else 0
    return {
        "label": label,
        "leagues": len(league_names),
        "n": n, "c": c, "acc": acc,
        "period": f"{dmin} to {dmax}"
    }


def matches_per_day_estimate(cur, league_names, conf_min, days_window=60):
    """Last-60-days matches per day within league+confidence scope."""
    cur.execute("""
        SELECT COUNT(*) FROM predictions p
        JOIN matches m ON m.id = p.match_id
        JOIN leagues l ON l.id = m.league_id
        WHERE p.prediction_source IN ('batch_local_fill', 'backtest', 'live')
          AND p.confidence >= %s
          AND l.name = ANY(%s)
          AND m.scheduled_at >= (NOW() - INTERVAL '60 days')
          AND m.scheduled_at < (NOW())
          AND m.status = 'FINISHED'
    """, (conf_min, list(league_names)))
    n = cur.fetchone()[0]
    return n / max(days_window, 1)


def main():
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    # Alle league-namen checken (voor exact matching)
    cur.execute("""
        SELECT DISTINCT l.name, COUNT(p.id) AS n
        FROM leagues l JOIN matches m ON m.league_id = l.id
        JOIN predictions p ON p.match_id = m.id
        JOIN prediction_evaluations e ON e.prediction_id = p.id
        WHERE p.prediction_source IN ('batch_local_fill', 'backtest', 'live')
          AND p.created_at >= '2026-04-16 11:00:00+00'::timestamptz
        GROUP BY l.name ORDER BY n DESC
    """)
    db_leagues = cur.fetchall()
    print("LEAGUES IN DB:")
    for name, n in db_leagues:
        print(f"  {name:<30} {n:>6}")
    print()

    # Nu: herberekenen per tier met echte namen uit DB
    print("=" * 70)
    print("  TIER SAMPLE HERBEREKENING")
    print("=" * 70)

    # Top 5 = Platinum
    plat_conf_075 = accuracy_filtered(cur, TOP5, 0.75, "Platinum (top5, conf>=0.75)")
    plat_all_scopes = accuracy_filtered(cur, TOP5, 0.65, "Top5 all >=0.65")
    print(f"\nPLATINUM scope (top 5):")
    print(f"  conf>=0.75: n={plat_conf_075['n']:>4}, correct={plat_conf_075['c']}, acc={plat_conf_075['acc']:.1f}%")
    print(f"  conf>=0.65: n={plat_all_scopes['n']:>4}, correct={plat_all_scopes['c']}, acc={plat_all_scopes['acc']:.1f}%")
    print(f"  Period: {plat_conf_075['period']}")

    # Gold = top 10 + eventueel Europa League / Ligue 1
    gold_065 = accuracy_filtered(cur, TOP10, 0.65, "Gold (top10, conf>=0.65)")
    print(f"\nGOLD scope (top 10):")
    print(f"  conf>=0.65: n={gold_065['n']:>4}, correct={gold_065['c']}, acc={gold_065['acc']:.1f}%")

    # Check: Europa League en Ligue 1 op conf>=0.65
    print(f"\n  Europa League / Ligue 1 — check if they pass Gold target (>=70%):")
    for L in GOLD_CANDIDATES:
        r = accuracy_filtered(cur, [L], 0.65, L)
        status = "PASS" if r['acc'] >= 70 else "FAIL"
        print(f"    {L}: n={r['n']:>3}, acc={r['acc']:.1f}% [{status}]")

    # Silver = top 14 (J1 Ligue1 Europa al uitgesloten)
    silver_060 = accuracy_filtered(cur, TOP14, 0.60, "Silver (top14, conf>=0.60)")
    print(f"\nSILVER scope (top 14):")
    print(f"  conf>=0.60: n={silver_060['n']:>4}, correct={silver_060['c']}, acc={silver_060['acc']:.1f}%")

    # Free = alles + sparse
    cur.execute("""
        WITH preds AS (
            SELECT p.confidence, e.is_correct
            FROM predictions p
            JOIN prediction_evaluations e ON e.prediction_id = p.id
            WHERE p.prediction_source IN ('batch_local_fill', 'backtest', 'live')
              AND p.created_at >= '2026-04-16 11:00:00+00'::timestamptz
              AND p.confidence >= 0.60
        )
        SELECT COUNT(*), SUM(is_correct::int) FROM preds
    """)
    fn, fc = cur.fetchone()
    free_acc = 100 * fc / fn if fn else 0
    print(f"\nFREE scope (all leagues, conf>=0.60):")
    print(f"  conf>=0.60: n={fn:>4}, correct={fc}, acc={free_acc:.1f}%")

    # Picks-per-day estimate (last 60 finished days)
    print("\n" + "=" * 70)
    print("  PICKS PER DAG (laatste 60 dagen finished matches)")
    print("=" * 70)
    for label, leagues, conf in [
        ("Platinum", TOP5, 0.75),
        ("Gold", TOP10, 0.65),
        ("Silver", TOP14, 0.60),
    ]:
        per_day = matches_per_day_estimate(cur, leagues, conf)
        print(f"  {label:<10} (top {len(leagues)} @ conf>={conf}): {per_day:.2f} picks/dag")
    cur.execute("""
        SELECT COUNT(*) FROM predictions p
        JOIN matches m ON m.id = p.match_id
        WHERE p.prediction_source IN ('batch_local_fill', 'backtest', 'live')
          AND p.confidence >= 0.60
          AND m.scheduled_at >= (NOW() - INTERVAL '60 days')
          AND m.status = 'FINISHED'
    """)
    free_n = cur.fetchone()[0]
    print(f"  Free       (all @ conf>=0.60): {free_n/60:.2f} picks/dag")

    # Conservatieve Platinum "85%+" check
    print("\n" + "=" * 70)
    print("  PLATINUM 85%+ CLAIM VALIDATIE")
    print("=" * 70)
    # Wilson 95% lower bound
    import math
    def wilson_lower(p, n, z=1.96):
        if n == 0: return 0
        denom = 1 + z*z/n
        centre = p + z*z/(2*n)
        adj = z * math.sqrt(p*(1-p)/n + z*z/(4*n*n))
        return (centre - adj) / denom * 100
    p = plat_conf_075['acc'] / 100
    n = plat_conf_075['n']
    wlb = wilson_lower(p, n)
    print(f"  Platinum point estimate: {plat_conf_075['acc']:.1f}% on n={n}")
    print(f"  Wilson 95% lower bound:  {wlb:.1f}%")
    print(f"  Conservative claim '85%+': {'DEFENSIBLE' if wlb >= 85 else 'NOT defensible (LB below 85)'}")

    conn.close()


if __name__ == "__main__":
    main()
