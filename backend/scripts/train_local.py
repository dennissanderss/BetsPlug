"""
Local training script for BetsPlug prediction models.
Connects directly to Railway PostgreSQL — no timeout limits.

Trains XGBoost + Logistic Regression on ALL finished matches using
point-in-time features (Elo, form, H2H, standings, goals).

Usage:
    python scripts/train_local.py
"""

import math
import sys
from collections import defaultdict
from datetime import datetime, timedelta
from uuid import UUID

import numpy as np
import psycopg2
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import StandardScaler
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, log_loss
import xgboost as xgb

# ── Railway DB Connection ─────────────────────────────────────────────────
DB_CONFIG = {
    "host": "junction.proxy.rlwy.net",
    "port": 31958,
    "user": "postgres",
    "password": "iYHwNkbfwwXxqDgmpuKUHhjqQNMTfbSL",
    "dbname": "railway",
}

# ── Elo parameters ────────────────────────────────────────────────────────
ELO_K = 20.0
ELO_HOME_ADV = 65.0
ELO_DEFAULT = 1500.0


def connect():
    return psycopg2.connect(**DB_CONFIG, connect_timeout=15)


def load_matches(conn):
    """Load ALL finished matches with results, ordered chronologically."""
    cur = conn.cursor()
    cur.execute("""
        SELECT m.id, m.home_team_id, m.away_team_id, m.league_id, m.season_id,
               m.scheduled_at, r.home_score, r.away_score,
               l.name as league_name
        FROM matches m
        JOIN match_results r ON r.match_id = m.id
        JOIN leagues l ON l.id = m.league_id
        WHERE m.status = 'FINISHED'
        ORDER BY m.scheduled_at ASC
    """)
    cols = [d[0] for d in cur.description]
    rows = [dict(zip(cols, row)) for row in cur.fetchall()]
    print(f"Loaded {len(rows)} finished matches")
    return rows


def compute_walked_elo(matches):
    """Walk-forward Elo computation. Returns {(team_id, match_idx): rating_before}."""
    ratings = {}  # team_id -> current rating
    elo_before = {}  # (team_id, match_index) -> rating before this match

    for idx, m in enumerate(matches):
        h = str(m["home_team_id"])
        a = str(m["away_team_id"])

        r_h = ratings.get(h, ELO_DEFAULT)
        r_a = ratings.get(a, ELO_DEFAULT)

        # Store pre-match ratings
        elo_before[(h, idx)] = r_h
        elo_before[(a, idx)] = r_a

        # Expected scores with home advantage
        e_h = 1 / (1 + 10 ** ((r_a - (r_h + ELO_HOME_ADV)) / 400))
        e_a = 1 - e_h

        # Actual scores
        hs, as_ = m["home_score"], m["away_score"]
        if hs > as_:
            s_h, s_a = 1.0, 0.0
        elif as_ > hs:
            s_h, s_a = 0.0, 1.0
        else:
            s_h, s_a = 0.5, 0.5

        # Update
        ratings[h] = r_h + ELO_K * (s_h - e_h)
        ratings[a] = r_a + ELO_K * (s_a - e_a)

    print(f"Computed Elo for {len(ratings)} teams")
    return elo_before, ratings


def compute_features(matches, elo_before):
    """Build feature vectors for each match using only pre-match data."""
    # Accumulators for point-in-time stats
    team_results = defaultdict(list)  # team_id -> [(match_idx, is_home, gs, gc, date)]
    h2h_results = defaultdict(list)   # (home_id, away_id) -> [(match_idx, winner)]

    features = []
    labels = []
    meta = []  # for debugging

    for idx, m in enumerate(matches):
        h = str(m["home_team_id"])
        a = str(m["away_team_id"])
        hs, as_ = m["home_score"], m["away_score"]
        dt = m["scheduled_at"]

        # ── FEATURES (all point-in-time: only data before this match) ──

        # 1. Elo ratings (walked-forward)
        home_elo = elo_before.get((h, idx), ELO_DEFAULT)
        away_elo = elo_before.get((a, idx), ELO_DEFAULT)
        elo_diff = home_elo - away_elo

        # 2. Recent form (last N matches for each team)
        home_history = team_results[h]
        away_history = team_results[a]

        def form_stats(history, n, is_home_filter=None):
            """Compute form from last n matches. Optionally filter home/away only."""
            recent = history[-n:] if len(history) >= n else history
            if is_home_filter is not None:
                recent = [r for r in history if r[1] == is_home_filter][-n:]
            if not recent:
                return 0.0, 0.0, 0.0, 0.0, 0
            wins = sum(1 for _, _, gs, gc, _ in recent if gs > gc)
            draws = sum(1 for _, _, gs, gc, _ in recent if gs == gc)
            losses = sum(1 for _, _, gs, gc, _ in recent if gs < gc)
            goals_for = sum(gs for _, _, gs, gc, _ in recent)
            goals_against = sum(gc for _, _, gs, gc, _ in recent)
            n_matches = len(recent)
            ppg = (wins * 3 + draws) / n_matches if n_matches > 0 else 0
            gf_avg = goals_for / n_matches if n_matches > 0 else 0
            ga_avg = goals_against / n_matches if n_matches > 0 else 0
            wr = wins / n_matches if n_matches > 0 else 0
            return ppg, gf_avg, ga_avg, wr, n_matches

        # Overall form (last 5 and 10)
        h_ppg5, h_gf5, h_ga5, h_wr5, h_n5 = form_stats(home_history, 5)
        a_ppg5, a_gf5, a_ga5, a_wr5, a_n5 = form_stats(away_history, 5)
        h_ppg10, h_gf10, h_ga10, h_wr10, h_n10 = form_stats(home_history, 10)
        a_ppg10, a_gf10, a_ga10, a_wr10, a_n10 = form_stats(away_history, 10)

        # Home-only / Away-only form (last 5)
        h_home_ppg, h_home_gf, h_home_ga, h_home_wr, _ = form_stats(home_history, 5, is_home_filter=True)
        a_away_ppg, a_away_gf, a_away_ga, a_away_wr, _ = form_stats(away_history, 5, is_home_filter=False)

        # Last 3 matches (momentum)
        h_ppg3, _, _, _, _ = form_stats(home_history, 3)
        a_ppg3, _, _, _, _ = form_stats(away_history, 3)

        # 3. H2H history
        h2h_key = tuple(sorted([h, a]))
        h2h = h2h_results[h2h_key]
        h2h_recent = h2h[-5:] if len(h2h) >= 5 else h2h
        h2h_home_wins = sum(1 for _, w in h2h_recent if w == h)
        h2h_away_wins = sum(1 for _, w in h2h_recent if w == a)
        h2h_draws = sum(1 for _, w in h2h_recent if w == "draw")
        h2h_total = len(h2h_recent)
        h2h_home_wr = h2h_home_wins / h2h_total if h2h_total > 0 else 0.5

        # 4. Season stats (goals, win rate)
        season_id = str(m["season_id"]) if m["season_id"] else None
        def season_stats(team_id, history):
            season_matches = [r for r in history if True]  # already filtered by time
            if not season_matches:
                return 0, 0, 0, 0
            mp = len(season_matches)
            gs = sum(g for _, _, g, _, _ in season_matches)
            gc = sum(g for _, _, _, g, _ in season_matches)
            wins = sum(1 for _, _, g1, g2, _ in season_matches if g1 > g2)
            return mp, gs/mp, gc/mp, wins/mp

        h_mp, h_sg, h_cg, h_swr = season_stats(h, home_history)
        a_mp, a_sg, a_cg, a_swr = season_stats(a, away_history)

        # 5. Goal scoring consistency (std dev of goals last 10)
        def goal_consistency(history, n=10):
            recent = history[-n:] if len(history) >= n else history
            if len(recent) < 3:
                return 1.0
            goals = [gs for _, _, gs, _, _ in recent]
            return float(np.std(goals))

        h_consistency = goal_consistency(home_history)
        a_consistency = goal_consistency(away_history)

        # 6. Clean sheet %
        def clean_sheet_pct(history, n=10):
            recent = history[-n:] if len(history) >= n else history
            if not recent:
                return 0.0
            return sum(1 for _, _, _, gc, _ in recent if gc == 0) / len(recent)

        h_cs = clean_sheet_pct(home_history)
        a_cs = clean_sheet_pct(away_history)

        # 7. Days since last match (fatigue)
        def days_rest(history, current_date):
            if not history:
                return 7.0  # default
            last_date = history[-1][4]
            delta = (current_date - last_date).days if hasattr(current_date, 'date') else 7
            return max(0, min(delta, 30))

        h_rest = days_rest(home_history, dt)
        a_rest = days_rest(away_history, dt)

        # ── Assemble feature vector ──
        feat = [
            # Elo (3)
            home_elo, away_elo, elo_diff,
            # Form last 5 (8)
            h_ppg5, a_ppg5, h_gf5, a_gf5, h_ga5, a_ga5, h_wr5, a_wr5,
            # Form last 10 (4)
            h_ppg10, a_ppg10, h_gf10 - h_ga10, a_gf10 - a_ga10,
            # Momentum last 3 (2)
            h_ppg3, a_ppg3,
            # Home/Away specific form (4)
            h_home_ppg, a_away_ppg, h_home_wr, a_away_wr,
            # H2H (3)
            h2h_home_wr, h2h_total, h2h_draws / max(h2h_total, 1),
            # Season stats (6)
            h_mp, a_mp, h_sg - h_cg, a_sg - a_cg, h_swr, a_swr,
            # Consistency (2)
            h_consistency, a_consistency,
            # Clean sheets (2)
            h_cs, a_cs,
            # Rest days (2)
            h_rest, a_rest,
            # Derived (3)
            h_ppg5 - a_ppg5,  # form diff
            h_home_ppg - a_away_ppg,  # venue form diff
            (h_sg - h_cg) - (a_sg - a_cg),  # goal diff diff
        ]

        features.append(feat)

        # Label: 0=home, 1=draw, 2=away
        if hs > as_:
            labels.append(0)
        elif hs == as_:
            labels.append(1)
        else:
            labels.append(2)

        meta.append({
            "idx": idx,
            "date": str(dt)[:10],
            "league": m["league_name"],
        })

        # ── Update accumulators AFTER feature extraction ──
        team_results[h].append((idx, True, hs, as_, dt))
        team_results[a].append((idx, False, as_, hs, dt))

        winner = h if hs > as_ else (a if as_ > hs else "draw")
        h2h_results[h2h_key].append((idx, winner))

    FEATURE_NAMES = [
        "home_elo", "away_elo", "elo_diff",
        "h_ppg5", "a_ppg5", "h_gf5", "a_gf5", "h_ga5", "a_ga5", "h_wr5", "a_wr5",
        "h_ppg10", "a_ppg10", "h_gd10", "a_gd10",
        "h_ppg3", "a_ppg3",
        "h_home_ppg", "a_away_ppg", "h_home_wr", "a_away_wr",
        "h2h_home_wr", "h2h_total", "h2h_draw_pct",
        "h_mp", "a_mp", "h_gd_season", "a_gd_season", "h_swr", "a_swr",
        "h_consistency", "a_consistency",
        "h_cs_pct", "a_cs_pct",
        "h_rest", "a_rest",
        "form_diff", "venue_form_diff", "gd_diff",
    ]

    print(f"Built {len(features)} feature vectors with {len(FEATURE_NAMES)} features")
    return np.array(features), np.array(labels), meta, FEATURE_NAMES


def train_and_evaluate(X, y, meta):
    """Train XGBoost + Logistic with walk-forward validation."""
    n = len(X)
    # Use last 25% as test (temporal split — NO future leakage)
    split_idx = int(n * 0.75)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    meta_test = meta[split_idx:]

    print(f"\nTrain: {len(X_train)} | Test: {len(X_test)}")
    print(f"Train period: {meta[0]['date']} to {meta[split_idx-1]['date']}")
    print(f"Test period:  {meta[split_idx]['date']} to {meta[-1]['date']}")

    # ── Scale features ──
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    # ── Logistic Regression ──
    print("\n=== LOGISTIC REGRESSION ===")
    lr = LogisticRegression(C=1.0, max_iter=1000, solver='lbfgs')
    lr.fit(X_train_s, y_train)
    lr_pred = lr.predict(X_test_s)
    lr_prob = lr.predict_proba(X_test_s)
    lr_acc = accuracy_score(y_test, lr_pred)
    lr_ll = log_loss(y_test, lr_prob)
    print(f"  Accuracy: {lr_acc:.4f} ({lr_acc*100:.1f}%)")
    print(f"  Log loss: {lr_ll:.4f}")

    # Per-class accuracy
    for cls, name in [(0, "Home"), (1, "Draw"), (2, "Away")]:
        mask = y_test == cls
        if mask.sum() > 0:
            cls_acc = (lr_pred[mask] == cls).mean()
            print(f"  {name}: {cls_acc:.1%} ({mask.sum()} samples)")

    # ── XGBoost ──
    print("\n=== XGBOOST ===")
    xgb_model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=5,
        reg_alpha=0.1,
        reg_lambda=1.0,
        objective='multi:softprob',
        num_class=3,
        eval_metric='mlogloss',
        random_state=42,
        verbosity=0,
    )
    xgb_model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )
    xgb_pred = xgb_model.predict(X_test)
    xgb_prob = xgb_model.predict_proba(X_test)
    xgb_acc = accuracy_score(y_test, xgb_pred)
    xgb_ll = log_loss(y_test, xgb_prob)
    print(f"  Accuracy: {xgb_acc:.4f} ({xgb_acc*100:.1f}%)")
    print(f"  Log loss: {xgb_ll:.4f}")

    for cls, name in [(0, "Home"), (1, "Draw"), (2, "Away")]:
        mask = y_test == cls
        if mask.sum() > 0:
            cls_acc = (xgb_pred[mask] == cls).mean()
            print(f"  {name}: {cls_acc:.1%} ({mask.sum()} samples)")

    # ── Ensemble (weighted average) ──
    print("\n=== ENSEMBLE (LR 0.4 + XGB 0.6) ===")
    ens_prob = 0.4 * lr_prob + 0.6 * xgb_prob
    ens_pred = ens_prob.argmax(axis=1)
    ens_acc = accuracy_score(y_test, ens_pred)
    ens_ll = log_loss(y_test, ens_prob)
    print(f"  Accuracy: {ens_acc:.4f} ({ens_acc*100:.1f}%)")
    print(f"  Log loss: {ens_ll:.4f}")

    for cls, name in [(0, "Home"), (1, "Draw"), (2, "Away")]:
        mask = y_test == cls
        if mask.sum() > 0:
            cls_acc = (ens_pred[mask] == cls).mean()
            print(f"  {name}: {cls_acc:.1%} ({mask.sum()} samples)")

    # ── High confidence subset ──
    print("\n=== HIGH CONFIDENCE PICKS ===")
    max_probs = ens_prob.max(axis=1)
    for threshold in [0.50, 0.55, 0.60, 0.65, 0.70]:
        mask = max_probs >= threshold
        if mask.sum() > 0:
            hc_acc = accuracy_score(y_test[mask], ens_pred[mask])
            print(f"  >={threshold:.0%} confidence: {mask.sum()} picks, {hc_acc:.1%} accuracy")

    # ── Feature importance ──
    print("\n=== TOP 15 FEATURES (XGBoost) ===")
    importances = xgb_model.feature_importances_
    top_idx = np.argsort(importances)[::-1][:15]
    for i in top_idx:
        print(f"  {FEATURE_NAMES[i]}: {importances[i]:.4f}")

    # ── Per-league accuracy (test set) ──
    print("\n=== PER-LEAGUE ACCURACY (test set) ===")
    league_stats = defaultdict(lambda: {"correct": 0, "total": 0})
    for i, m in enumerate(meta_test):
        league_stats[m["league"]]["total"] += 1
        if ens_pred[i] == y_test[i]:
            league_stats[m["league"]]["correct"] += 1
    for league, stats in sorted(league_stats.items(), key=lambda x: -x[1]["total"]):
        if stats["total"] >= 20:
            acc = stats["correct"] / stats["total"]
            print(f"  {league}: {stats['total']} picks, {acc:.1%}")

    return lr, xgb_model, scaler, ens_acc


if __name__ == "__main__":
    print("="*60)
    print("  BetsPlug Local Training Pipeline")
    print("  Data source: Railway PostgreSQL (API-Football data)")
    print("="*60)

    conn = connect()
    matches = load_matches(conn)
    conn.close()

    elo_before, final_ratings = compute_walked_elo(matches)
    X, y, meta, FEATURE_NAMES = compute_features(matches, elo_before)

    # Class distribution
    print(f"\nClass distribution:")
    print(f"  Home wins: {(y==0).sum()} ({(y==0).mean():.1%})")
    print(f"  Draws:     {(y==1).sum()} ({(y==1).mean():.1%})")
    print(f"  Away wins: {(y==2).sum()} ({(y==2).mean():.1%})")

    lr_model, xgb_model, scaler, ensemble_acc = train_and_evaluate(X, y, meta)

    print("\n" + "="*60)
    print(f"  ENSEMBLE ACCURACY: {ensemble_acc*100:.1f}%")
    print("="*60)
