"""
Pick a NEW-pipeline prediction (created after v8.1 deploy) and verify
that the features stored / used match what train_local.py would compute.
"""
import sys
import os
import psycopg2

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from train_local import connect, load_matches, compute_walked_elo, compute_features

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}

DEPLOY_AFTER_UTC = "2026-04-16 11:28:00+00"  # after win_rate fix


def main():
    raw = psycopg2.connect(**DB_CONFIG)
    cur = raw.cursor()

    # Pick 5 NEW-pipeline predictions for finished matches
    cur.execute(
        """
        SELECT p.match_id, p.features_snapshot, p.confidence,
               p.home_win_prob, p.draw_prob, p.away_win_prob,
               m.scheduled_at, m.home_team_id, m.away_team_id
        FROM predictions p
        JOIN matches m ON m.id = p.match_id
        WHERE p.created_at > %s::timestamptz
          AND m.status='FINISHED'
        ORDER BY RANDOM()
        LIMIT 5
        """,
        (DEPLOY_AFTER_UTC,),
    )
    samples = cur.fetchall()
    raw.close()

    print("=" * 60)
    print("  Verify NEW-pipeline predictions match train_local")
    print("=" * 60)

    # Compute train_local features on full dataset
    print("\nLoading all matches + computing train_local features...")
    conn = connect()
    matches = load_matches(conn)
    elo_before, _ = compute_walked_elo(matches)
    X_local, y_local, meta_local, FEATURE_NAMES = compute_features(matches, elo_before)
    conn.close()

    # Build production features from stored context
    from app.forecasting.models.production_v8_model import ProductionV8Model
    model = ProductionV8Model.__new__(ProductionV8Model)

    for sample in samples:
        match_id, feat_snap, conf, ph, pd, pa, sched, h_id, a_id = sample
        sched_str = str(sched)[:10]

        print(f"\n--- Match {str(match_id)[:8]} {sched_str} ---")
        print(f"  Stored conf: {conf:.3f}, probs H/D/A: {ph:.3f}/{pd:.3f}/{pa:.3f}")

        # Find train_local feature vector
        local_vec = None
        for i, m in enumerate(matches):
            if str(m["id"]) == str(match_id):
                local_vec = X_local[i]
                break

        if local_vec is None:
            print("  Match not in local dataset, skipping")
            continue

        # Build production feature vector from stored context
        if not feat_snap:
            print("  No features_snapshot, skipping")
            continue

        # features_snapshot is a dict — pass it to _build_feature_vector
        # It needs: home_team_id, away_team_id, home_elo_at_kickoff, away_elo_at_kickoff,
        #          home_form, away_form, h2h_matches, home_stats, away_stats
        ctx = feat_snap if isinstance(feat_snap, dict) else {}

        try:
            prod_vec = model._build_feature_vector(ctx)
        except Exception as e:
            print(f"  Failed to rebuild vector: {e}")
            continue

        # Compare
        diffs = []
        for i, name in enumerate(FEATURE_NAMES):
            lv = float(local_vec[i])
            pv = float(prod_vec[i])
            diff = abs(lv - pv)
            if diff > 1e-4:
                diffs.append((name, lv, pv, diff))

        if not diffs:
            print("  ALL 39 features match train_local")
        else:
            print(f"  {len(diffs)}/39 features DIFFER:")
            for name, lv, pv, diff in sorted(diffs, key=lambda x: -x[3])[:10]:
                print(f"    {name:25s} local={lv:.3f} prod={pv:.3f} diff={diff:.3f}")


if __name__ == "__main__":
    main()
