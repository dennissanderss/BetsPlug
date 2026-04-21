"""Report live stats from value_bets table (read-only)."""
from __future__ import annotations

import math
import statistics
import psycopg2

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    denom = 1 + z * z / n
    center = (p + z * z / (2 * n)) / denom
    margin = (z / denom) * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return (max(0.0, center - margin), min(1.0, center + margin))


def sharpe(returns: list[float]) -> float | None:
    if len(returns) < 2:
        return None
    m = statistics.mean(returns)
    s = statistics.stdev(returns)
    if s == 0:
        return None
    return m / s * math.sqrt(len(returns))


def max_dd(pnls: list[float]) -> float:
    cum = 0.0
    peak = 0.0
    dd = 0.0
    for p in pnls:
        cum += p
        peak = max(peak, cum)
        dd = min(dd, cum - peak)
    return dd


def main():
    conn = psycopg2.connect(**DB_CONFIG, connect_timeout=20)
    conn.set_session(readonly=True, autocommit=True)
    cur = conn.cursor()

    print("=" * 70)
    print("VALUE_BETS LIVE STATS — Railway production DB")
    print("=" * 70)

    cur.execute("SELECT count(*) FROM value_bets")
    total = cur.fetchone()[0]
    print(f"\nTotal rows: {total}")

    cur.execute("""
        SELECT is_live, count(*),
               count(*) FILTER (WHERE is_evaluated) AS evaluated,
               count(*) FILTER (WHERE is_correct IS TRUE) AS correct
          FROM value_bets
         GROUP BY is_live
         ORDER BY is_live
    """)
    print(f"\n{'scope':<12} {'n':>5} {'evaluated':>10} {'correct':>8}")
    print("-" * 40)
    for is_live, n, ev, cor in cur.fetchall():
        label = "live" if is_live else "backtest"
        print(f"{label:<12} {n:>5} {ev:>10} {cor:>8}")

    # Details on all rows
    cur.execute("""
        SELECT bet_date, picked_at, our_pick, best_odds_for_pick, edge,
               expected_value, prediction_tier, is_live, is_evaluated,
               is_correct, profit_loss_units, actual_outcome
          FROM value_bets
         ORDER BY picked_at
    """)
    rows = cur.fetchall()
    print(f"\nAll {len(rows)} value-bet rows:")
    print(f"{'date':<11} {'pick':<5} {'odds':>5} {'edge%':>6} {'EV%':>6} "
          f"{'tier':<9} {'live':<5} {'eval':<5} {'correct':<8} {'pnl_u':>6}")
    print("-" * 80)
    for bd, pa, pick, odds, edge, ev, tier, il, ie, ic, pnl, actual in rows:
        pnl_str = f"{pnl:+.2f}" if pnl is not None else "-"
        ic_str = ("Y" if ic else "N") if ic is not None else "-"
        print(
            f"{bd} {pick:<5} {odds:>5.2f} {edge*100:>5.1f} {ev*100:>5.1f} "
            f"{tier:<9} {str(il):<5} {str(ie):<5} {ic_str:<8} {pnl_str:>6}"
        )

    # Aggregate stats
    print()
    print("=" * 70)
    print("AGGREGATE STATS PER SCOPE")
    print("=" * 70)
    for scope, pred in [("backtest", "is_live = false"),
                         ("live", "is_live = true"),
                         ("all", "TRUE")]:
        cur.execute(f"""
            SELECT count(*) AS n,
                   count(*) FILTER (WHERE is_evaluated) AS ev,
                   count(*) FILTER (WHERE is_correct IS TRUE) AS cor,
                   coalesce(avg(edge), 0) AS avg_edge,
                   coalesce(avg(best_odds_for_pick), 0) AS avg_odds
              FROM value_bets
             WHERE {pred}
        """)
        n, ev, cor, avg_edge, avg_odds = cur.fetchone()
        cur.execute(f"""
            SELECT profit_loss_units FROM value_bets
             WHERE {pred} AND is_evaluated AND profit_loss_units IS NOT NULL
             ORDER BY picked_at
        """)
        pnls = [float(r[0]) for r in cur.fetchall()]
        print(f"\nscope = {scope}")
        print(f"  total picks          : {n}")
        print(f"  evaluated            : {ev}")
        print(f"  correct              : {cor}")
        if ev > 0:
            acc = cor / ev
            wl, wu = wilson(cor, ev)
            print(f"  accuracy             : {acc*100:.1f}%")
            print(f"  Wilson 95% CI        : {wl*100:.1f}% - {wu*100:.1f}%")
        print(f"  avg edge             : {float(avg_edge)*100:.2f}%")
        print(f"  avg odds             : {float(avg_odds):.2f}")
        if pnls:
            total_pnl = sum(pnls)
            roi = total_pnl / len(pnls) * 100
            print(f"  total P/L            : {total_pnl:+.2f}u")
            print(f"  ROI                  : {roi:+.2f}%")
            print(f"  max drawdown         : {max_dd(pnls):+.2f}u")
            sh = sharpe(pnls)
            print(f"  Sharpe               : {sh:+.2f}" if sh is not None else "  Sharpe               : -")

    conn.close()


if __name__ == "__main__":
    main()
