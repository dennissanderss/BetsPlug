"""
Train and save production models.

Trains XGBoost + Logistic Regression on ALL 43k historical matches
(no train/test split — walk-forward validation already done).
Saves the trained models + scaler + feature names as files that
Railway can load at startup.

Output files (in backend/models/):
    - logistic_model.pkl
    - xgboost_model.ubj
    - feature_scaler.pkl
    - feature_names.json
    - model_metadata.json
"""

import json
import os
import sys
from pathlib import Path

import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import xgboost as xgb

# Import feature-building pipeline from train_local
sys.path.insert(0, ".")
from scripts.train_local import connect, load_matches, compute_walked_elo, compute_features


OUTPUT_DIR = Path("models")


def main():
    print("=" * 60)
    print("  PRODUCTION MODEL TRAINING")
    print("  Trains on ALL 43k matches, saves to disk for Railway")
    print("=" * 60)

    OUTPUT_DIR.mkdir(exist_ok=True)

    # ── Load data ──
    print("\n[1/5] Loading matches from Railway DB...")
    conn = connect()
    matches = load_matches(conn)
    conn.close()
    print(f"      Loaded {len(matches)} matches")

    # ── Compute Elo + features ──
    print("\n[2/5] Computing walk-forward Elo ratings...")
    elo_before, final_ratings = compute_walked_elo(matches)
    print(f"      {len(final_ratings)} team ratings computed")

    print("\n[3/5] Building feature vectors...")
    X, y, meta, FEATURE_NAMES = compute_features(matches, elo_before)
    print(f"      X shape: {X.shape}, y shape: {y.shape}")
    print(f"      {len(FEATURE_NAMES)} features")
    print(f"      Class distribution: home={(y==0).mean():.1%}, "
          f"draw={(y==1).mean():.1%}, away={(y==2).mean():.1%}")

    # ── Train on ALL data ──
    print("\n[4/5] Training models on full dataset...")

    # Scaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Logistic Regression
    print("      Training Logistic Regression...")
    lr = LogisticRegression(C=1.0, max_iter=1000, solver='lbfgs', n_jobs=-1)
    lr.fit(X_scaled, y)
    lr_acc = lr.score(X_scaled, y)
    print(f"      Logistic train accuracy: {lr_acc:.1%}")

    # XGBoost
    print("      Training XGBoost...")
    xgb_model = xgb.XGBClassifier(
        n_estimators=300, max_depth=5, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, min_child_weight=5,
        reg_alpha=0.1, reg_lambda=1.0,
        objective='multi:softprob', num_class=3,
        eval_metric='mlogloss',
        random_state=42, verbosity=0, n_jobs=-1,
    )
    xgb_model.fit(X, y, verbose=False)
    xgb_acc = xgb_model.score(X, y)
    print(f"      XGBoost train accuracy: {xgb_acc:.1%}")

    # ── Save to disk ──
    print("\n[5/5] Saving models to disk...")

    logistic_path = OUTPUT_DIR / "logistic_model.pkl"
    joblib.dump(lr, logistic_path)
    lr_size = logistic_path.stat().st_size / 1024
    print(f"      {logistic_path} ({lr_size:.1f} KB)")

    xgb_path = OUTPUT_DIR / "xgboost_model.ubj"
    xgb_model.save_model(str(xgb_path))
    xgb_size = xgb_path.stat().st_size / 1024
    print(f"      {xgb_path} ({xgb_size:.1f} KB)")

    scaler_path = OUTPUT_DIR / "feature_scaler.pkl"
    joblib.dump(scaler, scaler_path)
    scaler_size = scaler_path.stat().st_size / 1024
    print(f"      {scaler_path} ({scaler_size:.1f} KB)")

    features_path = OUTPUT_DIR / "feature_names.json"
    with open(features_path, "w") as f:
        json.dump(FEATURE_NAMES, f, indent=2)
    print(f"      {features_path} ({len(FEATURE_NAMES)} features)")

    # Metadata
    metadata = {
        "version": "8.0.0",
        "trained_on_samples": int(len(X)),
        "num_features": len(FEATURE_NAMES),
        "feature_names": FEATURE_NAMES,
        "ensemble_weights": {
            "elo": 1.2,
            "logistic": 2.0,
            "xgboost": 1.0,
            "poisson": 0.3,
        },
        "classes": ["home", "draw", "away"],
        "logistic_train_accuracy": float(lr_acc),
        "xgboost_train_accuracy": float(xgb_acc),
        "walk_forward_accuracy_at_70_conf": 0.744,
        "walk_forward_accuracy_at_75_conf": 0.782,
        "elo_home_advantage": 65,
        "elo_k_factor": 20,
        "data_source": "API-Football Pro",
        "leagues": 30,
        "date_range": f"{meta[0]['date']} to {meta[-1]['date']}",
    }
    metadata_path = OUTPUT_DIR / "model_metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"      {metadata_path}")

    total_size = (lr_size + xgb_size + scaler_size) / 1024
    print(f"\n{'=' * 60}")
    print(f"  DONE. Total disk size: {total_size:.1f} MB")
    print(f"  Location: {OUTPUT_DIR.absolute()}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
