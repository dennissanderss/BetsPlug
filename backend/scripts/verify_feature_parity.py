"""
Feature Parity Verification
Compares train_local.py features vs ProductionV8Model features on 10 real matches.
Reports exact differences.
"""
import sys
import json
import psycopg2
import os

# Add backend dir to path so we can import app.*
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from train_local import connect, load_matches, compute_walked_elo, compute_features

# We need to simulate the backend's ProductionV8Model feature path.
# The backend builds match_context with home_form (last 5), away_form (last 5),
# then passes that to ProductionV8Model._build_feature_vector.

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}


def fetch_match_context_like_backend(conn, match_id, home_id, away_id, scheduled_at):
    """
    Replicate what the backend's build_match_context does:
    - Load last 5 finished matches for home team (form)
    - Load last 5 finished matches for away team (form)
    - Load last 10 h2h matches
    - Load season stats (current behaviour)
    """
    cur = conn.cursor()

    def get_form(team_id, n=5):
        cur.execute("""
            SELECT m.id, m.home_team_id, m.away_team_id, m.scheduled_at,
                   r.home_score, r.away_score
            FROM matches m
            JOIN match_results r ON r.match_id = m.id
            WHERE m.status = 'FINISHED'
              AND m.scheduled_at < %s
              AND (m.home_team_id = %s OR m.away_team_id = %s)
            ORDER BY m.scheduled_at DESC
            LIMIT %s
        """, (scheduled_at, team_id, team_id, n))
        rows = cur.fetchall()
        return [{
            "home_team_id": r[1], "away_team_id": r[2],
            "scheduled_at": r[3], "home_score": r[4], "away_score": r[5]
        } for r in reversed(rows)]  # oldest first

    # v8.1 fix: load last 30 form matches (match new backend _FORM_MATCHES = 30)
    # 30 gives enough home-only / away-only matches after venue filtering.
    home_form = get_form(home_id, 30)
    away_form = get_form(away_id, 30)

    # H2H
    cur.execute("""
        SELECT m.home_team_id, m.away_team_id, m.scheduled_at,
               r.home_score, r.away_score
        FROM matches m
        JOIN match_results r ON r.match_id = m.id
        WHERE m.status = 'FINISHED'
          AND m.scheduled_at < %s
          AND ((m.home_team_id = %s AND m.away_team_id = %s)
               OR (m.home_team_id = %s AND m.away_team_id = %s))
        ORDER BY m.scheduled_at DESC
        LIMIT 10
    """, (scheduled_at, home_id, away_id, away_id, home_id))
    # v8.1 fix: reverse to oldest-first (match new backend _get_h2h semantics)
    h2h = [{"home_team_id": r[0], "away_team_id": r[1], "scheduled_at": r[2],
            "home_score": r[3], "away_score": r[4]} for r in reversed(cur.fetchall())]

    # Elo at kickoff (same as backend)
    cur.execute("""
        SELECT rating FROM team_elo_history
        WHERE team_id = %s AND effective_at < %s
        ORDER BY effective_at DESC LIMIT 1
    """, (home_id, scheduled_at))
    row = cur.fetchone()
    home_elo = row[0] if row else 1500.0

    cur.execute("""
        SELECT rating FROM team_elo_history
        WHERE team_id = %s AND effective_at < %s
        ORDER BY effective_at DESC LIMIT 1
    """, (away_id, scheduled_at))
    row = cur.fetchone()
    away_elo = row[0] if row else 1500.0

    # v8.1 fix: all-history stats (match new backend _get_team_stats — no season_id filter)
    def get_season_stats(team_id, season_id):
        cur.execute("""
            SELECT COUNT(*) AS mp,
                   SUM(CASE WHEN
                     (m.home_team_id = %s AND r.home_score > r.away_score)
                     OR (m.away_team_id = %s AND r.away_score > r.home_score) THEN 1 ELSE 0 END) AS wins,
                   SUM(CASE WHEN m.home_team_id = %s THEN r.home_score ELSE r.away_score END) AS gs,
                   SUM(CASE WHEN m.home_team_id = %s THEN r.away_score ELSE r.home_score END) AS gc
            FROM matches m JOIN match_results r ON r.match_id = m.id
            WHERE m.status='FINISHED'
              AND m.scheduled_at < %s
              AND (m.home_team_id = %s OR m.away_team_id = %s)
        """, (team_id, team_id, team_id, team_id, scheduled_at, team_id, team_id))
        r = cur.fetchone()
        mp = r[0] or 0
        if mp == 0:
            return {"matches_played": 0, "goals_scored": 0, "goals_conceded": 0, "win_rate": 0.0}
        return {
            "matches_played": mp,
            "goals_scored": r[2] or 0,
            "goals_conceded": r[3] or 0,
            "win_rate": (r[1] or 0) / mp if mp > 0 else 0.0,
        }

    cur.execute("SELECT season_id FROM matches WHERE id = %s", (match_id,))
    season_id = cur.fetchone()[0]

    home_stats = get_season_stats(home_id, season_id)
    away_stats = get_season_stats(away_id, season_id)

    return {
        "home_team_id": str(home_id),
        "away_team_id": str(away_id),
        "home_elo_at_kickoff": float(home_elo),
        "away_elo_at_kickoff": float(away_elo),
        "home_form": home_form,
        "away_form": away_form,
        "h2h_matches": h2h,
        "home_stats": home_stats,
        "away_stats": away_stats,
        "scheduled_at": scheduled_at.isoformat() if scheduled_at else None,
    }


def run_production_features(ctx):
    """Replicate ProductionV8Model._build_feature_vector."""
    from app.forecasting.models.production_v8_model import ProductionV8Model
    model = ProductionV8Model.__new__(ProductionV8Model)
    return model._build_feature_vector(ctx)


def main():
    print("=" * 60)
    print("  FEATURE PARITY VERIFICATION")
    print("  train_local.py vs ProductionV8Model")
    print("=" * 60)

    # Load matches with local pipeline
    conn = connect()
    matches = load_matches(conn)

    # Only use matches from later in the dataset so they have form history
    sample_matches = matches[-200:]  # last 200
    # Pick 10 evenly spaced
    indices = [int(i * len(sample_matches) / 10) for i in range(10)]
    sample = [sample_matches[i] for i in indices]

    print("\nComputing local features on full dataset...")
    elo_before, _ = compute_walked_elo(matches)
    X_local, y_local, meta_local, FEATURE_NAMES = compute_features(matches, elo_before)

    # Map back to find the sample indices
    full_len = len(matches)
    sample_offsets = []
    for sm in sample:
        for i, m in enumerate(matches):
            if m["id"] == sm["id"]:
                sample_offsets.append(i)
                break

    print(f"\n{'='*60}")
    print(f"  Testing {len(sample_offsets)} matches")
    print(f"{'='*60}\n")

    max_diffs_per_feature = {name: 0.0 for name in FEATURE_NAMES}
    mismatch_count = {name: 0 for name in FEATURE_NAMES}

    for idx, match_idx in enumerate(sample_offsets):
        m = matches[match_idx]
        match_id = m["id"]
        date = str(m["scheduled_at"])[:10]

        local_features = X_local[match_idx]

        # Build production-like context
        ctx = fetch_match_context_like_backend(
            conn, match_id, m["home_team_id"], m["away_team_id"], m["scheduled_at"]
        )

        prod_features = run_production_features(ctx)
        prod_features = list(prod_features)

        print(f"\nMatch {idx+1}: {str(m['home_team_id'])[:8]} vs {str(m['away_team_id'])[:8]} ({date})")

        match_diffs = []
        for i, name in enumerate(FEATURE_NAMES):
            lv = float(local_features[i])
            pv = float(prod_features[i])
            diff = abs(lv - pv)
            if diff > 1e-6:
                match_diffs.append((name, lv, pv, diff))
                mismatch_count[name] += 1
                max_diffs_per_feature[name] = max(max_diffs_per_feature[name], diff)

        if match_diffs:
            print(f"  {len(match_diffs)}/39 features DIFFER:")
            for name, lv, pv, diff in sorted(match_diffs, key=lambda x: -x[3])[:5]:
                print(f"    {name:25s} local={lv:.3f} prod={pv:.3f} diff={diff:.3f}")
        else:
            print("  ALL 39 features IDENTICAL")

    print(f"\n{'='*60}")
    print(f"  SAMENVATTING OVER 10 MATCHES")
    print(f"{'='*60}")
    total_mismatches = sum(1 for c in mismatch_count.values() if c > 0)
    print(f"  Features met verschillen: {total_mismatches}/39")
    print(f"\n  Per feature mismatches (matches waar anders):")
    for name in FEATURE_NAMES:
        if mismatch_count[name] > 0:
            print(f"    {name:25s}  {mismatch_count[name]}/10 matches, max diff = {max_diffs_per_feature[name]:.4f}")

    conn.close()


if __name__ == "__main__":
    main()
