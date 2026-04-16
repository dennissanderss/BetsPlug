"""
Fill predictions LOCALLY using train_local.py features + pickled models.
Skips HTTP roundtrip — direct Railway DB writes via execute_values.

Target rate: 500-1000 predictions/min (10x faster than HTTP parallel fill).

Steps:
1. Load all matches + compute walk-forward Elo + 39-feature vectors (train_local)
2. Find matches that have no prediction in DB
3. Run LR + XGB ensemble locally on feature vectors
4. Batch-write predictions to Railway via execute_values (500 per batch)
"""
import json
import os
import pickle
import sys
import time
import uuid

import joblib
import numpy as np
import psycopg2
from psycopg2.extras import execute_values, Json
import xgboost as xgb

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from train_local import connect, load_matches, compute_walked_elo, compute_features

DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "port": 29246,
    "user": "postgres",
    "password": "tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq",
    "dbname": "railway",
}

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")

# Ensemble weights from ProductionV8Model
LR_WEIGHT = 0.4
XGB_WEIGHT = 0.6

BATCH_SIZE = 500  # predictions written per execute_values call


def load_models():
    """Load scaler, LR, XGB from backend/models/ dir (joblib format)."""
    print("Loading local models...")
    scaler = joblib.load(os.path.join(MODELS_DIR, "feature_scaler.pkl"))
    lr = joblib.load(os.path.join(MODELS_DIR, "logistic_model.pkl"))
    xgb_model = xgb.Booster()
    xgb_model.load_model(os.path.join(MODELS_DIR, "xgboost_model.ubj"))
    print(f"  scaler: {type(scaler).__name__}")
    print(f"  LR: {type(lr).__name__}")
    print(f"  XGB: {type(xgb_model).__name__}")
    return scaler, lr, xgb_model


def get_missing_match_ids(conn, match_ids):
    """Filter match_ids to those WITHOUT a prediction in DB."""
    cur = conn.cursor()
    # Batch query in chunks of 5000 to avoid parameter limits
    missing = set()
    match_id_set = set(str(m) for m in match_ids)
    # Get all predictions' match_ids
    cur.execute("SELECT DISTINCT match_id FROM predictions")
    have = {str(r[0]) for r in cur.fetchall()}
    missing = match_id_set - have
    return missing


def get_active_model_version_id(conn):
    """Find the active production_v8 ModelVersion record."""
    cur = conn.cursor()
    cur.execute("""
        SELECT id FROM model_versions
        WHERE is_active = TRUE
        ORDER BY created_at DESC
        LIMIT 1
    """)
    row = cur.fetchone()
    if row:
        return row[0]
    # Fallback: pick any production_v8
    cur.execute("""
        SELECT id FROM model_versions WHERE model_type = 'production_v8' LIMIT 1
    """)
    row = cur.fetchone()
    if not row:
        raise RuntimeError("No production_v8 ModelVersion in DB")
    return row[0]


def batch_predict(X_batch, scaler, lr, xgb_model):
    """Run ensemble on a batch of feature vectors. Returns [h, d, a] probs."""
    X_scaled = scaler.transform(X_batch)
    lr_probs = lr.predict_proba(X_scaled)  # shape (N, 3)
    dmat = xgb.DMatrix(X_batch)
    xgb_probs = xgb_model.predict(dmat)  # shape (N, 3)
    ens = LR_WEIGHT * lr_probs + XGB_WEIGHT * xgb_probs
    # Normalize
    ens = ens / ens.sum(axis=1, keepdims=True)
    return ens


def build_feature_snapshot(match, feature_names, feat_vec):
    """Build a minimal features_snapshot dict for the prediction record.
    Store the 39 feature values by name — enough to reproduce."""
    return {
        "match_id": str(match["id"]),
        "features": {name: float(val) for name, val in zip(feature_names, feat_vec)},
        "source": "fill_predictions_local.py",
    }


def build_raw_output(ens_probs, lr_probs, xgb_probs):
    return {
        "ensemble": {
            "home": float(ens_probs[0]),
            "draw": float(ens_probs[1]),
            "away": float(ens_probs[2]),
        },
        "lr": {
            "home": float(lr_probs[0]),
            "draw": float(lr_probs[1]),
            "away": float(lr_probs[2]),
        },
        "xgb": {
            "home": float(xgb_probs[0]),
            "draw": float(xgb_probs[1]),
            "away": float(xgb_probs[2]),
        },
        "weights": {"lr": LR_WEIGHT, "xgb": XGB_WEIGHT},
    }


def main():
    print("=" * 60)
    print("  LOCAL PREDICTION FILL")
    print("=" * 60)

    scaler, lr, xgb_model = load_models()

    # Load features
    print("\nLoading matches + computing features (this takes a few min)...")
    t0 = time.time()
    conn_local = connect()
    matches = load_matches(conn_local)
    conn_local.close()
    elo_before, _ = compute_walked_elo(matches)
    X_all, y_all, meta_all, FEATURE_NAMES = compute_features(matches, elo_before)
    print(f"  Built {len(X_all):,} feature vectors in {time.time()-t0:.1f}s")

    # Connect to Railway DB
    conn = psycopg2.connect(**DB_CONFIG)
    model_version_id = get_active_model_version_id(conn)
    print(f"\nActive model_version_id: {model_version_id}")

    # Find matches without predictions
    print("Fetching existing predictions to filter...")
    match_ids_all = [m["id"] for m in matches]
    missing = get_missing_match_ids(conn, match_ids_all)
    print(f"  {len(missing):,} matches missing predictions")

    # Build to-process list (index, match, feature_vec)
    to_process = []
    for i, m in enumerate(matches):
        if str(m["id"]) in missing:
            to_process.append((i, m, X_all[i]))
    print(f"  {len(to_process):,} matches ready to predict")

    if not to_process:
        print("Nothing to do.")
        conn.close()
        return

    # Run predictions in batches + write to DB
    print(f"\nPredicting + writing in batches of {BATCH_SIZE}...")
    t0 = time.time()
    total_written = 0
    cur = conn.cursor()

    for batch_start in range(0, len(to_process), BATCH_SIZE):
        batch = to_process[batch_start : batch_start + BATCH_SIZE]
        X_batch = np.array([b[2] for b in batch], dtype=float)

        # Predict
        X_scaled = scaler.transform(X_batch)
        lr_probs = lr.predict_proba(X_scaled)
        dmat = xgb.DMatrix(X_batch)
        xgb_probs = xgb_model.predict(dmat)
        ens = LR_WEIGHT * lr_probs + XGB_WEIGHT * xgb_probs
        ens = ens / ens.sum(axis=1, keepdims=True)

        # Build rows for bulk insert
        rows = []
        now_sql = "NOW()"
        for idx, (_, m, feat_vec) in enumerate(batch):
            h, d, a = float(ens[idx][0]), float(ens[idx][1]), float(ens[idx][2])
            conf = max(h, d, a)
            feat_snap = build_feature_snapshot(m, FEATURE_NAMES, feat_vec)
            raw_out = build_raw_output(
                ens[idx], lr_probs[idx], xgb_probs[idx]
            )
            rows.append(
                (
                    str(uuid.uuid4()),                # id
                    str(m["id"]),                      # match_id
                    str(model_version_id),             # model_version_id
                    m["scheduled_at"],                 # predicted_at (use match time)
                    "pre_match",                       # prediction_type
                    h, d, a,                           # probs
                    None, None,                        # predicted_home/away_score
                    conf,                              # confidence
                    None, None,                        # confidence_interval_low/high
                    Json(feat_snap),                   # features_snapshot
                    Json(raw_out),                     # raw_output
                    True,                              # is_simulation
                    "batch_local_fill",                # prediction_source
                    None,                              # locked_at
                    m["scheduled_at"],                 # match_scheduled_at
                    None,                              # lead_time_hours
                    None,                              # closing_odds_snapshot
                )
            )

        # Bulk insert
        try:
            execute_values(
                cur,
                """
                INSERT INTO predictions (
                    id, match_id, model_version_id, predicted_at, prediction_type,
                    home_win_prob, draw_prob, away_win_prob,
                    predicted_home_score, predicted_away_score,
                    confidence, confidence_interval_low, confidence_interval_high,
                    features_snapshot, raw_output, is_simulation,
                    prediction_source, locked_at, match_scheduled_at,
                    lead_time_hours, closing_odds_snapshot
                ) VALUES %s
                ON CONFLICT (id) DO NOTHING
                """,
                rows,
                page_size=100,
            )
            conn.commit()
            total_written += len(rows)

            elapsed = time.time() - t0
            rate = total_written / max(elapsed, 1) * 60  # per minute
            remaining = len(to_process) - total_written
            eta = remaining / max(rate, 1) if rate > 0 else 0
            print(
                f"  Batch {batch_start // BATCH_SIZE + 1:>3}: "
                f"written {total_written:>6,}/{len(to_process):,} "
                f"| rate={rate:.0f}/min | ETA={eta:.1f} min"
            )
        except Exception as e:
            print(f"  Batch {batch_start // BATCH_SIZE + 1} FAILED: {e}")
            conn.rollback()

    conn.close()

    elapsed_min = (time.time() - t0) / 60
    print(f"\n{'=' * 60}")
    print(f"  DONE in {elapsed_min:.1f} min")
    print(f"  Total written: {total_written:,}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
