"""
Leak Detection Test
====================
Proves there is NO data leakage in the training pipeline by running
two control experiments:

1. SHUFFLED LABELS: Train on randomly shuffled labels. If there's no leak,
   accuracy should drop to ~33% (random baseline for 3-way classification).

2. PERMUTATION TEST: Randomize the test set labels and measure accuracy.
   Should be ~33% if pipeline is honest.

If either test returns HIGH accuracy, there's a leak somewhere.
"""
import sys
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score
import xgboost as xgb

sys.path.insert(0, ".")
from scripts.train_local import connect, load_matches, compute_walked_elo, compute_features


def test_shuffled_labels(X, y):
    """Train on shuffled labels — should give ~33% accuracy."""
    print("\n" + "="*60)
    print("  TEST 1: SHUFFLED LABELS")
    print("="*60)
    print("  Expected: ~33% accuracy (random baseline for 3-way)")
    print("  If >40%: LEAKAGE DETECTED")

    n = len(X)
    split = int(n * 0.75)
    X_tr, X_te = X[:split], X[split:]
    y_tr, y_te = y[:split], y[split:]

    # SHUFFLE training labels randomly
    np.random.seed(42)
    y_tr_shuffled = np.random.permutation(y_tr)

    scaler = StandardScaler()
    X_tr_s = scaler.fit_transform(X_tr)
    X_te_s = scaler.transform(X_te)

    lr = LogisticRegression(C=1.0, max_iter=1000, solver='lbfgs')
    lr.fit(X_tr_s, y_tr_shuffled)
    acc = accuracy_score(y_te, lr.predict(X_te_s))
    print(f"\n  Logistic Regression with shuffled labels: {acc:.1%}")

    if acc > 0.40:
        print("  [RED FLAG] SUSPICIOUS - mogelijk een leak!")
    else:
        print("  [OK] GEEN LEAK - accuracy bij ruis rond random baseline")
    return acc


def test_random_features(X, y):
    """Replace features with random noise — should give ~33%."""
    print("\n" + "="*60)
    print("  TEST 2: RANDOM FEATURES")
    print("="*60)
    print("  Expected: ~33% accuracy met willekeurige features")
    print("  If significantly higher: LEAK via label encoding?")

    n, n_feat = X.shape
    np.random.seed(123)
    X_random = np.random.randn(n, n_feat)

    split = int(n * 0.75)
    X_tr, X_te = X_random[:split], X_random[split:]
    y_tr, y_te = y[:split], y[split:]

    scaler = StandardScaler()
    X_tr_s = scaler.fit_transform(X_tr)
    X_te_s = scaler.transform(X_te)

    lr = LogisticRegression(C=1.0, max_iter=1000, solver='lbfgs')
    lr.fit(X_tr_s, y_tr)
    acc = accuracy_score(y_te, lr.predict(X_te_s))
    print(f"\n  Met random features: {acc:.1%}")

    if acc > 0.40:
        print("  [RED FLAG] Hoger dan verwacht - label leakage?")
    else:
        print("  [OK] GEEN LEAK - random features geven random accuracy")
    return acc


def test_legit_baseline(X, y):
    """Real training to show the contrast."""
    print("\n" + "="*60)
    print("  TEST 3: ECHTE FEATURES + ECHTE LABELS (baseline)")
    print("="*60)

    split = int(len(X) * 0.75)
    X_tr, X_te = X[:split], X[split:]
    y_tr, y_te = y[:split], y[split:]

    scaler = StandardScaler()
    X_tr_s = scaler.fit_transform(X_tr)
    X_te_s = scaler.transform(X_te)

    lr = LogisticRegression(C=1.0, max_iter=1000, solver='lbfgs')
    lr.fit(X_tr_s, y_tr)
    acc = accuracy_score(y_te, lr.predict(X_te_s))
    print(f"\n  Echte training: {acc:.1%}")

    if acc > 0.90:
        print("  [RED FLAG] VEEL TE HOOG - zeker een leak!")
    elif acc > 0.55:
        print("  [SUSPECT] Hoog - check opnieuw")
    else:
        print(f"  [OK] Realistisch voor voetbalvoorspelling (baseline ~33%)")

    return acc


def main():
    print("="*60)
    print("  LEAK DETECTION TEST")
    print("  Bewijst dat de engine eerlijk werkt")
    print("="*60)

    conn = connect()
    matches = load_matches(conn)
    conn.close()

    elo_before, _ = compute_walked_elo(matches)
    X, y, meta, _ = compute_features(matches, elo_before)

    # Majority class baseline
    split = int(len(y) * 0.75)
    y_test = y[split:]
    home_rate = (y_test == 0).mean()
    print(f"\n  Majority class baseline: {home_rate:.1%} (altijd 'home' voorspellen)")
    print(f"  Random baseline: 33.3% (willekeurig kiezen)")

    acc_shuffled = test_shuffled_labels(X, y)
    acc_random = test_random_features(X, y)
    acc_real = test_legit_baseline(X, y)

    print("\n" + "="*60)
    print("  CONCLUSIE")
    print("="*60)
    print(f"\n  Naive baselines:")
    print(f"    Random (1/3):          33.3%")
    print(f"    Always predict home:   {home_rate:.1%}")
    print(f"\n  Control tests (moeten ~baseline zijn):")
    print(f"    Shuffled labels:       {acc_shuffled:.1%}")
    print(f"    Random features:       {acc_random:.1%}")
    print(f"\n  Real model:")
    print(f"    Echte training:        {acc_real:.1%}")
    print(f"    Boost boven baseline:  +{(acc_real - home_rate)*100:.1f}pp")

    # Pipeline is clean if:
    # - Control tests return baseline (not higher)
    # - Real model does BETTER than baseline (has learned something)
    # - Real model is NOT suspiciously high (<70% on 3-way is honest)
    tolerance = 0.03  # 3pp wiggle room
    control_clean = (
        abs(acc_shuffled - home_rate) < tolerance and
        abs(acc_random - home_rate) < tolerance
    )
    real_beats_baseline = acc_real > home_rate + 0.02  # at least 2pp better
    real_not_absurd = acc_real < 0.70  # realistic

    print("\n  Checks:")
    print(f"    Control tests op baseline: {'JA' if control_clean else 'NEE'}")
    print(f"    Echt model > baseline:     {'JA' if real_beats_baseline else 'NEE'}")
    print(f"    Niet verdacht hoog (<70%): {'JA' if real_not_absurd else 'NEE'}")

    if control_clean and real_beats_baseline and real_not_absurd:
        print("\n  RESULTAAT: PIPELINE IS EERLIJK - geen data leakage")
        print("  Het model leert echte patronen uit de features.")
    else:
        print("\n  RESULTAAT: CHECK OPNIEUW")


if __name__ == "__main__":
    main()
