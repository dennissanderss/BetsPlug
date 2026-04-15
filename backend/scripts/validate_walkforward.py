"""
Walk-forward validation: test the model on MULTIPLE time periods.
Each fold trains on all data before the test window, then tests on the next chunk.
This gives much more reliable accuracy numbers.
"""
import sys
from collections import defaultdict

import numpy as np
import psycopg2
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score
import xgboost as xgb

# Import the feature/data loading from train_local
sys.path.insert(0, ".")
from scripts.train_local import connect, load_matches, compute_walked_elo, compute_features

def walk_forward_validate(X, y, meta, n_folds=5):
    """Walk-forward: train on everything before fold, test on fold."""
    n = len(X)
    fold_size = n // (n_folds + 1)  # reserve first portion for minimum training
    min_train = fold_size * 2  # at least 2 folds of training data

    all_preds = []
    all_true = []
    all_probs = []
    all_meta = []

    print(f"Total samples: {n}, Fold size: ~{fold_size}, Min training: {min_train}")
    print(f"Running {n_folds} walk-forward folds...\n")

    for fold in range(n_folds):
        test_start = min_train + fold * fold_size
        test_end = min(test_start + fold_size, n)
        if test_start >= n:
            break

        X_train = X[:test_start]
        y_train = y[:test_start]
        X_test = X[test_start:test_end]
        y_test = y[test_start:test_end]
        meta_test = meta[test_start:test_end]

        if len(X_test) == 0:
            break

        # Scale
        scaler = StandardScaler()
        X_train_s = scaler.fit_transform(X_train)
        X_test_s = scaler.transform(X_test)

        # Logistic
        lr = LogisticRegression(C=1.0, max_iter=1000, solver='lbfgs')
        lr.fit(X_train_s, y_train)
        lr_prob = lr.predict_proba(X_test_s)

        # XGBoost
        xgb_model = xgb.XGBClassifier(
            n_estimators=300, max_depth=5, learning_rate=0.05,
            subsample=0.8, colsample_bytree=0.8, min_child_weight=5,
            reg_alpha=0.1, reg_lambda=1.0,
            objective='multi:softprob', num_class=3,
            random_state=42, verbosity=0,
        )
        xgb_model.fit(X_train, y_train, verbose=False)
        xgb_prob = xgb_model.predict_proba(X_test)

        # Ensemble
        ens_prob = 0.4 * lr_prob + 0.6 * xgb_prob
        ens_pred = ens_prob.argmax(axis=1)

        acc = accuracy_score(y_test, ens_pred)
        period = f"{meta_test[0]['date']} to {meta_test[-1]['date']}"
        print(f"  Fold {fold+1}: train={len(X_train)}, test={len(X_test)}, "
              f"period={period}, acc={acc:.1%}")

        all_preds.extend(ens_pred)
        all_true.extend(y_test)
        all_probs.extend(ens_prob)
        all_meta.extend(meta_test)

    all_preds = np.array(all_preds)
    all_true = np.array(all_true)
    all_probs = np.array(all_probs)

    print(f"\n{'='*60}")
    print(f"WALK-FORWARD RESULTATEN (alle {len(all_true)} test-picks)")
    print(f"{'='*60}")

    overall_acc = accuracy_score(all_true, all_preds)
    print(f"\nOverall accuracy: {overall_acc:.1%} ({len(all_true)} picks)")

    # Confidence filtering
    max_probs = all_probs.max(axis=1)
    print(f"\n{'-'*50}")
    print(f"  CONFIDENCE FILTERING (dit is het belangrijkste!)")
    print(f"{'-'*50}")
    for threshold in [0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75]:
        mask = max_probs >= threshold
        if mask.sum() > 0:
            hc_acc = accuracy_score(all_true[mask], all_preds[mask])
            pct = mask.sum() / len(all_true) * 100
            per_day = mask.sum() / ((len(all_true) / 6211) * 365) * 365 / len(all_true) * mask.sum()
            print(f"  >={threshold:.0%} conf: {mask.sum():>4} picks ({pct:4.1f}%), "
                  f"accuracy = {hc_acc:.1%}")

    # Per predicted outcome at high confidence
    print(f"\n{'-'*50}")
    print(f"  PER UITKOMST (>=60% confidence)")
    print(f"{'-'*50}")
    mask60 = max_probs >= 0.60
    if mask60.sum() > 0:
        for cls, name in [(0, "Home"), (1, "Draw"), (2, "Away")]:
            pred_mask = (all_preds == cls) & mask60
            if pred_mask.sum() > 0:
                cls_acc = (all_true[pred_mask] == cls).mean()
                print(f"  {name}: {pred_mask.sum()} picks, {cls_acc:.1%} accuracy")

    # Per-league at >=60%
    print(f"\n{'-'*50}")
    print(f"  PER LEAGUE (>=60% confidence)")
    print(f"{'-'*50}")
    league_stats = defaultdict(lambda: {"correct": 0, "total": 0})
    for i in range(len(all_true)):
        if max_probs[i] >= 0.60:
            league_stats[all_meta[i]["league"]]["total"] += 1
            if all_preds[i] == all_true[i]:
                league_stats[all_meta[i]["league"]]["correct"] += 1
    for league, stats in sorted(league_stats.items(), key=lambda x: -x[1]["total"]):
        if stats["total"] >= 10:
            acc = stats["correct"] / stats["total"]
            print(f"  {league}: {stats['total']} picks, {acc:.1%}")

    # Monthly breakdown at >=60%
    print(f"\n{'-'*50}")
    print(f"  PER MAAND (>=60% confidence)")
    print(f"{'-'*50}")
    month_stats = defaultdict(lambda: {"correct": 0, "total": 0})
    for i in range(len(all_true)):
        if max_probs[i] >= 0.60:
            month = all_meta[i]["date"][:7]
            month_stats[month]["total"] += 1
            if all_preds[i] == all_true[i]:
                month_stats[month]["correct"] += 1
    for month, stats in sorted(month_stats.items()):
        if stats["total"] >= 5:
            acc = stats["correct"] / stats["total"]
            print(f"  {month}: {stats['total']} picks, {acc:.1%}")


if __name__ == "__main__":
    print("="*60)
    print("  BetsPlug Walk-Forward Validation")
    print("  Getest op MEERDERE periodes voor betrouwbare cijfers")
    print("="*60)

    conn = connect()
    matches = load_matches(conn)
    conn.close()

    elo_before, _ = compute_walked_elo(matches)
    X, y, meta, _ = compute_features(matches, elo_before)

    walk_forward_validate(X, y, meta, n_folds=5)
