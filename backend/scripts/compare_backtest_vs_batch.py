"""
Compare 5 random 'backtest' post-deploy predictions against train_local features.
Check if Railway backend's feature pipeline matches train_local on these specific
matches.
"""
import os, sys
import psycopg2

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from train_local import connect, load_matches, compute_walked_elo, compute_features

DB_CONFIG = {"host":"nozomi.proxy.rlwy.net","port":29246,"user":"postgres",
             "password":"tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq","dbname":"railway"}

def main():
    raw = psycopg2.connect(**DB_CONFIG)
    cur = raw.cursor()
    cur.execute("""
        SELECT p.match_id, p.features_snapshot, p.confidence, p.home_win_prob,
               p.draw_prob, p.away_win_prob, m.scheduled_at
        FROM predictions p JOIN matches m ON m.id=p.match_id
        LEFT JOIN match_results r ON r.match_id=m.id
        WHERE p.prediction_source='backtest'
          AND p.created_at BETWEEN '2026-04-16 11:40:00+00'::timestamptz
                               AND '2026-04-16 11:48:00+00'::timestamptz
          AND m.status='FINISHED' AND r.home_score IS NOT NULL
        ORDER BY RANDOM() LIMIT 5
    """)
    samples = cur.fetchall()
    raw.close()

    print("Loading train_local feature pipeline...")
    conn = connect()
    matches = load_matches(conn)
    elo_before, _ = compute_walked_elo(matches)
    X_all, y_all, meta_all, FEATURE_NAMES = compute_features(matches, elo_before)
    conn.close()

    from app.forecasting.models.production_v8_model import ProductionV8Model
    model = ProductionV8Model.__new__(ProductionV8Model)

    print()
    print("=" * 60)
    print("  5 RANDOM 'backtest' post-deploy preds vs train_local")
    print("=" * 60)

    for mid, feat_snap, conf, ph, pd_, pa, sched in samples:
        print(f"\nMatch {str(mid)[:8]} {str(sched)[:10]} conf={conf:.3f} H/D/A={ph:.3f}/{pd_:.3f}/{pa:.3f}")
        local_vec = None
        for i, m in enumerate(matches):
            if str(m["id"]) == str(mid):
                local_vec = X_all[i]
                break
        if local_vec is None:
            print("  Niet in local dataset")
            continue
        if not feat_snap:
            print("  Geen features_snapshot")
            continue

        try:
            prod_vec = model._build_feature_vector(feat_snap)
        except Exception as e:
            print(f"  Build failed: {e}")
            continue

        diffs = []
        for i, name in enumerate(FEATURE_NAMES):
            lv, pv = float(local_vec[i]), float(prod_vec[i])
            if abs(lv - pv) > 1e-4:
                diffs.append((name, lv, pv, abs(lv - pv)))

        if not diffs:
            print("  ALLE 39 features matchen train_local")
        else:
            print(f"  {len(diffs)}/39 features verschillen:")
            for name, lv, pv, d in sorted(diffs, key=lambda x: -x[3])[:8]:
                print(f"    {name:25s} local={lv:.3f} prod={pv:.3f} diff={d:.3f}")


if __name__ == "__main__":
    main()
