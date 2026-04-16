"""
Verification of the v8.1 accuracy numbers (82.5% / 71.7% / 66.9%).
Does NOT generate new data. Only audits what was reported.

Output: structured console log + docs/v8_accuracy_verification.md
"""
import os
import sys
import io
import psycopg2
import textwrap
from datetime import datetime

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}

OUT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "docs", "v8_accuracy_verification.md"
)

# Reported numbers we are verifying
REPORTED = {
    "sample_size": 19697,
    "platinum_pct": 82.5,
    "platinum_ratio": (662, 802),
    "goldplus_pct": 71.7,
    "goldplus_ratio": (1763, 2458),
    "botd_pct": 66.9,
    "botd_ratio": (2582, 3858),
}


class Tee:
    """Capture prints to both stdout and a buffer for the markdown report."""
    def __init__(self):
        self.buf = io.StringIO()

    def write(self, s):
        sys.__stdout__.write(s)
        self.buf.write(s)

    def flush(self):
        sys.__stdout__.flush()


tee = Tee()
sys.stdout = tee


def hr(c="="):
    print(c * 70)


def section(title):
    print()
    hr()
    print(f"  {title}")
    hr()


def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    print(f"V8.1 Accuracy Verification")
    print(f"Datum: {datetime.now().isoformat(timespec='seconds')}")
    print(f"Te verifieren: Platinum 82.5% / Gold+ 71.7% / BOTD 66.9% op n=19,697")

    # ----------------------------------------------------------------------
    section("1. HERTEL DE CIJFERS")
    # ----------------------------------------------------------------------

    print("\n1a. Population size vergelijking — twee filter-strategieen:\n")

    cur.execute("""
        SELECT COUNT(*) FROM predictions
        WHERE prediction_source = 'batch_local_fill'
    """)
    n_source = cur.fetchone()[0]
    print(f"    Filter prediction_source='batch_local_fill': {n_source:,}")

    cur.execute("""
        SELECT COUNT(*) FROM predictions
        WHERE created_at > '2026-04-16 11:40:00+00'::timestamptz
    """)
    n_time = cur.fetchone()[0]
    print(f"    Filter created_at > 2026-04-16 11:40 UTC:     {n_time:,}")
    print(f"    Eerder gerapporteerd:                          {REPORTED['sample_size']:,}")

    # Use prediction_source filter as authoritative (user's request)
    WHERE_CLAUSE = "p.prediction_source = 'batch_local_fill'"

    print("\n1b. Hertel per tier (ad-hoc SQL zoals in eerdere meting):\n")

    cur.execute(f"""
        WITH preds AS (
            SELECT
                p.id, p.confidence, p.home_win_prob, p.draw_prob, p.away_win_prob,
                CASE
                    WHEN p.home_win_prob >= p.draw_prob AND p.home_win_prob >= p.away_win_prob THEN 'HOME'
                    WHEN p.away_win_prob >= p.home_win_prob AND p.away_win_prob >= p.draw_prob THEN 'AWAY'
                    ELSE 'DRAW'
                END AS predicted_outcome,
                CASE
                    WHEN r.home_score > r.away_score THEN 'HOME'
                    WHEN r.home_score < r.away_score THEN 'AWAY'
                    WHEN r.home_score = r.away_score THEN 'DRAW'
                    ELSE NULL
                END AS actual_outcome
            FROM predictions p
            JOIN matches m ON m.id = p.match_id
            LEFT JOIN match_results r ON r.match_id = m.id
            WHERE {WHERE_CLAUSE}
              AND m.status='FINISHED'
              AND r.home_score IS NOT NULL
        )
        SELECT
            COUNT(*)                                                                               AS total,
            COUNT(*) FILTER (WHERE confidence >= 0.75)                                             AS plat,
            COUNT(*) FILTER (WHERE confidence >= 0.75 AND predicted_outcome = actual_outcome)      AS plat_c,
            COUNT(*) FILTER (WHERE confidence >= 0.65)                                             AS gold,
            COUNT(*) FILTER (WHERE confidence >= 0.65 AND predicted_outcome = actual_outcome)      AS gold_c,
            COUNT(*) FILTER (WHERE confidence >= 0.60)                                             AS botd,
            COUNT(*) FILTER (WHERE confidence >= 0.60 AND predicted_outcome = actual_outcome)      AS botd_c,
            COUNT(*) FILTER (WHERE confidence >= 0.55)                                             AS silver,
            COUNT(*) FILTER (WHERE confidence >= 0.55 AND predicted_outcome = actual_outcome)      AS silver_c,
            COUNT(*) FILTER (WHERE confidence < 0.55)                                              AS below,
            COUNT(*) FILTER (WHERE confidence < 0.55 AND predicted_outcome = actual_outcome)       AS below_c,
            COUNT(*) FILTER (WHERE predicted_outcome = actual_outcome)                             AS total_c
        FROM preds
    """)
    row = cur.fetchone()
    (total, plat, plat_c, gold, gold_c, botd, botd_c, silver, silver_c,
     below, below_c, total_c) = row

    def pct(c, t):
        return f"{100.0 * c / t:.1f}%" if t > 0 else "n/a"

    print(f"    {'Tier':15s} {'Count':>8s} {'Correct':>8s} {'Accuracy':>10s}")
    print(f"    {'-' * 45}")
    print(f"    {'Total':15s} {total:>8,} {total_c:>8,} {pct(total_c, total):>10s}")
    print(f"    {'Platinum >=75%':15s} {plat:>8,} {plat_c:>8,} {pct(plat_c, plat):>10s}")
    print(f"    {'Gold+ >=65%':15s} {gold:>8,} {gold_c:>8,} {pct(gold_c, gold):>10s}")
    print(f"    {'BOTD >=60%':15s} {botd:>8,} {botd_c:>8,} {pct(botd_c, botd):>10s}")
    print(f"    {'Silver >=55%':15s} {silver:>8,} {silver_c:>8,} {pct(silver_c, silver):>10s}")
    print(f"    {'Below <55%':15s} {below:>8,} {below_c:>8,} {pct(below_c, below):>10s}")

    print("\n1c. Vergelijk met gerapporteerde cijfers:\n")
    print(f"    {'Tier':15s} {'Eerder':>12s} {'Nu':>12s} {'Diff':>8s}")
    print(f"    {'-' * 55}")

    def compare(label, reported_ratio, reported_pct, now_c, now_t):
        now_pct = 100.0 * now_c / now_t if now_t > 0 else 0
        rep_str = f"{reported_ratio[0]}/{reported_ratio[1]}"
        now_str = f"{now_c}/{now_t}"
        pct_diff = now_pct - reported_pct
        flag = " OK " if abs(pct_diff) < 1.0 and reported_ratio == (now_c, now_t) else "FLAG"
        print(f"    {label:15s} {rep_str:>12s} {now_str:>12s} {pct_diff:+7.2f}pp  {flag}")

    compare("Platinum", REPORTED["platinum_ratio"], REPORTED["platinum_pct"], plat_c, plat)
    compare("Gold+",    REPORTED["goldplus_ratio"], REPORTED["goldplus_pct"], gold_c, gold)
    compare("BOTD",     REPORTED["botd_ratio"],     REPORTED["botd_pct"],     botd_c, botd)

    # ----------------------------------------------------------------------
    section("2. DUBBELE TELLINGEN + TIER OVERLAP")
    # ----------------------------------------------------------------------

    print("\n2a. Predictions per match_id binnen batch_local_fill:\n")
    cur.execute("""
        SELECT cnt, COUNT(*) FROM (
            SELECT match_id, COUNT(*) AS cnt
            FROM predictions
            WHERE prediction_source = 'batch_local_fill'
            GROUP BY match_id
        ) s GROUP BY cnt ORDER BY cnt
    """)
    for cnt, n in cur.fetchall():
        print(f"    {n:>6,} matches hebben {cnt} prediction(s) in batch_local_fill")

    print("\n2b. Matches met meerdere predictions (any source) die ook in batch zitten:\n")
    cur.execute("""
        SELECT p.match_id, COUNT(*) AS total_preds,
               SUM(CASE WHEN p.prediction_source='batch_local_fill' THEN 1 ELSE 0 END) AS batch_preds
        FROM predictions p
        WHERE p.match_id IN (
            SELECT match_id FROM predictions WHERE prediction_source='batch_local_fill'
        )
        GROUP BY p.match_id
        HAVING COUNT(*) > 1
        LIMIT 5
    """)
    rows = cur.fetchall()
    if rows:
        print(f"    Voorbeelden (eerste 5):")
        for mid, total, batch in rows:
            print(f"      match {str(mid)[:8]}: {total} preds totaal waarvan {batch} uit batch")
    else:
        print("    Geen duplicates gevonden.")

    cur.execute("""
        SELECT COUNT(*) FROM (
            SELECT match_id FROM predictions
            WHERE match_id IN (
                SELECT match_id FROM predictions WHERE prediction_source='batch_local_fill'
            )
            GROUP BY match_id HAVING COUNT(*) > 1
        ) s
    """)
    n_dup = cur.fetchone()[0]
    print(f"\n    Totaal matches in batch met >1 prediction (any source): {n_dup:,}")

    print("\n2c. Tier-inclusiviteit check:\n")
    print(f"    Platinum (>=75%) zit in Gold+ (>=65%) telling:")
    print(f"      Platinum count alleen:            {plat:,}")
    print(f"      Gold+ minus Platinum:             {gold - plat:,}")
    print(f"      Som = Gold+ totaal:               {plat + (gold - plat):,}  "
          f"{'=' if plat + (gold - plat) == gold else '!='} {gold:,}")
    print(f"    Gold+ (>=65%) zit in BOTD (>=60%) telling:")
    print(f"      BOTD minus Gold+:                 {botd - gold:,}")
    print(f"      Som = BOTD totaal:                {gold + (botd - gold):,}  "
          f"{'=' if gold + (botd - gold) == botd else '!='} {botd:,}")
    print("\n    (Tier telling is cumulatief/inclusief per design — Platinum telt ook mee in Gold+)")

    # ----------------------------------------------------------------------
    section("3. EVALUATIE-LOGICA CHECK — 20 RANDOM PREDICTIONS")
    # ----------------------------------------------------------------------

    print("\n    Elke rij: pick -> uitslag -> verwachte is_correct -> DB is_correct (indien aanwezig)\n")
    cur.execute(f"""
        SELECT
            p.id,
            p.home_win_prob, p.draw_prob, p.away_win_prob,
            p.confidence,
            r.home_score, r.away_score,
            e.is_correct AS db_is_correct,
            e.actual_outcome AS db_actual
        FROM predictions p
        JOIN matches m ON m.id = p.match_id
        LEFT JOIN match_results r ON r.match_id = m.id
        LEFT JOIN prediction_evaluations e ON e.prediction_id = p.id
        WHERE p.prediction_source = 'batch_local_fill'
          AND m.status='FINISHED'
          AND r.home_score IS NOT NULL
        ORDER BY RANDOM()
        LIMIT 20
    """)
    mismatches = 0
    total_check = 0
    print(f"    {'i':>3s} {'conf':>5s} {'H':>5s} {'D':>5s} {'A':>5s} {'pick':>6s} "
          f"{'score':>6s} {'actual':>7s} {'calc':>6s} {'db':>6s} {'match':>6s}")
    print(f"    {'-' * 76}")
    for i, (pid, ph, pd, pa, conf, hs, as_, db_is_correct, db_actual) in enumerate(cur.fetchall(), 1):
        if ph >= pd and ph >= pa:
            pick = 'HOME'
        elif pa >= ph and pa >= pd:
            pick = 'AWAY'
        else:
            pick = 'DRAW'
        if hs > as_: actual = 'HOME'
        elif hs < as_: actual = 'AWAY'
        else: actual = 'DRAW'
        calc_correct = (pick == actual)
        db_val = 'yes' if db_is_correct else 'no' if db_is_correct is not None else '-'
        if db_is_correct is not None:
            total_check += 1
            if calc_correct != db_is_correct:
                mismatches += 1
                match_str = 'FLAG'
            else:
                match_str = 'ok'
        else:
            match_str = 'n/a'
        print(f"    {i:>3d} {conf:>5.2f} {ph:>5.2f} {pd:>5.2f} {pa:>5.2f} {pick:>6s} "
              f"{hs:>2d}-{as_:<3d} {actual:>7s} {'yes' if calc_correct else 'no':>6s} "
              f"{db_val:>6s} {match_str:>6s}")
    print(f"\n    Van 20 random preds, {total_check} hadden DB-evaluatie; "
          f"{mismatches} mismatches tussen ad-hoc en DB.")

    # ----------------------------------------------------------------------
    section("4. DATA INTEGRITEIT")
    # ----------------------------------------------------------------------

    print("\n4a. Predictions zonder match_result (kunnen dus niet geevalueerd worden):\n")
    cur.execute("""
        SELECT COUNT(*)
        FROM predictions p
        JOIN matches m ON m.id = p.match_id
        LEFT JOIN match_results r ON r.match_id = m.id
        WHERE p.prediction_source = 'batch_local_fill'
          AND m.status = 'FINISHED'
          AND (r.home_score IS NULL OR r.id IS NULL)
    """)
    print(f"    FINISHED zonder score: {cur.fetchone()[0]:,}")

    cur.execute("""
        SELECT COUNT(*)
        FROM predictions p
        JOIN matches m ON m.id = p.match_id
        WHERE p.prediction_source = 'batch_local_fill'
          AND m.status != 'FINISHED'
    """)
    print(f"    Predictions op NIET-finished matches: {cur.fetchone()[0]:,}")

    print("\n4b. Null / invalid velden:\n")
    cur.execute("""
        SELECT
            COUNT(*) FILTER (WHERE confidence IS NULL) AS null_conf,
            COUNT(*) FILTER (WHERE home_win_prob IS NULL) AS null_h,
            COUNT(*) FILTER (WHERE draw_prob IS NULL) AS null_d,
            COUNT(*) FILTER (WHERE away_win_prob IS NULL) AS null_a,
            COUNT(*) FILTER (WHERE confidence < 0.33 OR confidence > 1.0) AS invalid_conf,
            COUNT(*) FILTER (WHERE ABS(home_win_prob+draw_prob+away_win_prob - 1.0) > 0.01) AS bad_probs
        FROM predictions
        WHERE prediction_source='batch_local_fill'
    """)
    nc, nh, nd, na, ic, bp = cur.fetchone()
    print(f"    NULL confidence:         {nc:,}")
    print(f"    NULL home_win_prob:      {nh:,}")
    print(f"    NULL draw_prob:          {nd:,}")
    print(f"    NULL away_win_prob:      {na:,}")
    print(f"    confidence buiten [0.33,1.0]: {ic:,}")
    print(f"    probs die niet naar 1 sommeren (tol 0.01): {bp:,}")

    print("\n4c. Batch coverage op prediction_evaluations:\n")
    cur.execute("""
        SELECT
            COUNT(*) AS preds_total,
            COUNT(e.id) AS with_eval,
            COUNT(e.id) FILTER (WHERE e.is_correct IS TRUE) AS eval_correct
        FROM predictions p
        LEFT JOIN prediction_evaluations e ON e.prediction_id = p.id
        WHERE p.prediction_source = 'batch_local_fill'
    """)
    pt, we, ec = cur.fetchone()
    print(f"    Total batch_local_fill preds:       {pt:,}")
    print(f"    Met prediction_evaluations row:     {we:,}")
    print(f"    Waarvan DB is_correct=TRUE:         {ec:,}")
    if we > 0:
        print(f"    DB-gebaseerde accuracy (alleen die {we:,}): {100*ec/we:.1f}%")

    # ----------------------------------------------------------------------
    section("5. STEEKPROEF PER TIER")
    # ----------------------------------------------------------------------

    for tier_name, cond in [
        ("Platinum (>=0.75)", "p.confidence >= 0.75"),
        ("Gold+ (>=0.65 AND <0.75)", "p.confidence >= 0.65 AND p.confidence < 0.75"),
        ("BOTD (>=0.60 AND <0.65)", "p.confidence >= 0.60 AND p.confidence < 0.65"),
    ]:
        print(f"\n5. {tier_name} — 5 random:\n")
        cur.execute(f"""
            SELECT
                p.home_win_prob, p.draw_prob, p.away_win_prob, p.confidence,
                r.home_score, r.away_score,
                str(m.id) AS match_id
            FROM predictions p
            JOIN matches m ON m.id = p.match_id
            JOIN match_results r ON r.match_id = m.id
            WHERE p.prediction_source='batch_local_fill'
              AND m.status='FINISHED'
              AND {cond}
            ORDER BY RANDOM() LIMIT 5
        """.replace("str(m.id)", "m.id::text"))
        correct = 0
        for ph, pd, pa, conf, hs, as_, mid in cur.fetchall():
            if ph >= pd and ph >= pa: pick = 'HOME'
            elif pa >= ph and pa >= pd: pick = 'AWAY'
            else: pick = 'DRAW'
            if hs > as_: actual = 'HOME'
            elif hs < as_: actual = 'AWAY'
            else: actual = 'DRAW'
            is_ok = (pick == actual)
            if is_ok: correct += 1
            mark = 'CORRECT' if is_ok else 'WRONG'
            print(f"    match {mid[:8]} conf={conf:.2f} probs={ph:.2f}/{pd:.2f}/{pa:.2f} "
                  f"pick={pick} score={hs}-{as_} actual={actual} {mark}")
        print(f"    -> {correct}/5 correct in deze steekproef")

    # ----------------------------------------------------------------------
    section("CONCLUSIE")
    # ----------------------------------------------------------------------

    # Dynamic pass/fail based on earlier comparisons
    plat_ok = abs(100.0 * plat_c / plat - REPORTED["platinum_pct"]) < 1.0 if plat > 0 else False
    gold_ok = abs(100.0 * gold_c / gold - REPORTED["goldplus_pct"]) < 1.0 if gold > 0 else False
    botd_ok = abs(100.0 * botd_c / botd - REPORTED["botd_pct"]) < 1.0 if botd > 0 else False
    ratios_match = (
        REPORTED["platinum_ratio"] == (plat_c, plat)
        and REPORTED["goldplus_ratio"] == (gold_c, gold)
        and REPORTED["botd_ratio"] == (botd_c, botd)
    )

    print(f"\n    Q1: Kloppen gerapporteerde cijfers binnen 1pp?")
    print(f"        Platinum:  {'JA' if plat_ok else 'NEE'} ({100.0*plat_c/plat:.1f}% vs 82.5%)")
    print(f"        Gold+:     {'JA' if gold_ok else 'NEE'} ({100.0*gold_c/gold:.1f}% vs 71.7%)")
    print(f"        BOTD:      {'JA' if botd_ok else 'NEE'} ({100.0*botd_c/botd:.1f}% vs 66.9%)")
    print(f"        Ratios exact gelijk: {'JA' if ratios_match else 'NEE'}")
    print(f"\n    Q2: Onlogische waarden gevonden?")
    bad = (nc + nh + nd + na + ic + bp) > 0
    print(f"        {'JA — zie sectie 4b' if bad else 'NEE'}")
    print(f"\n    Q3: Tellingsfouten?")
    tier_sum_ok = (plat + (gold - plat) == gold) and (gold + (botd - gold) == botd)
    print(f"        Tier-inclusiviteit som-check: {'OK' if tier_sum_ok else 'FLAG'}")
    print(f"        Ad-hoc vs DB is_correct: {mismatches}/{total_check} mismatches op steekproef")
    any_flag = not (plat_ok and gold_ok and botd_ok and ratios_match) or bad or mismatches > 0
    print(f"\n    ALGEHEEL: {'GEEN FLAGS — cijfers geverifieerd' if not any_flag else 'ZIE BEVINDINGEN HIERBOVEN'}")

    conn.close()

    # Save to markdown
    md = tee.buf.getvalue()
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write("# V8.1 Accuracy Cijfers — Verificatie\n\n")
        f.write(f"**Gegenereerd:** {datetime.now().isoformat(timespec='seconds')}\n")
        f.write(f"**Script:** `backend/scripts/verify_accuracy_numbers.py`\n")
        f.write(f"**Doel:** Valideer of 82.5%/71.7%/66.9% op n=19,697 echt kloppen.\n\n")
        f.write("```\n")
        f.write(md)
        f.write("```\n")
    print(f"\nReport: {OUT_PATH}")


if __name__ == "__main__":
    main()
