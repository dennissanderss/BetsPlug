"""Production V8 Model — loads pre-trained XGBoost + Logistic from disk.

This model bypasses the in-memory training cache (which is lost on every
Railway restart) and instead loads the models trained on 43k matches
using `backend/scripts/train_and_save.py`.

The ensemble combines Logistic Regression (weight 0.4) and XGBoost
(weight 0.6) — the same blend validated via walk-forward on 28,838
test picks (74.4% accuracy at conf≥70%, 78.2% at conf≥75%).

Features (39 total) are computed from the `match_context` dict built
by `ForecastService.build_match_context`, enriched with extra queries
for last-10 match history (the backend normally loads only last 5).
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Optional
from uuid import UUID

import joblib
import numpy as np
import xgboost as xgb

from app.forecasting.base_model import ForecastModel, ForecastResult


logger = logging.getLogger(__name__)

# ── File paths ────────────────────────────────────────────────────────────
# backend/app/forecasting/models/production_v8_model.py
#   → backend/app/forecasting/models/   (parent)
#   → backend/app/forecasting/          (parent.parent)
#   → backend/app/                      (parent.parent.parent)
#   → backend/                          (parent.parent.parent.parent)
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
_MODEL_DIR = _BACKEND_DIR / "models"

# ── Ensemble weights from walk-forward tuning (see V8_ENGINE_REPORT.md) ──
_LR_WEIGHT = 0.4
_XGB_WEIGHT = 0.6


class ProductionV8Model(ForecastModel):
    """Pre-trained production ensemble model loaded from disk."""

    # Class-level cache so all instances share one loaded model set
    _loaded: bool = False
    _lr_model = None
    _xgb_model = None
    _scaler = None
    _feature_names: Optional[list[str]] = None
    _metadata: Optional[dict] = None

    # ------------------------------------------------------------------ #
    # Model loading                                                       #
    # ------------------------------------------------------------------ #

    @classmethod
    def load_models(cls, model_dir: Path = _MODEL_DIR) -> bool:
        """Load trained models from disk. Returns True on success."""
        if cls._loaded:
            return True

        try:
            xgb_path = model_dir / "xgboost_model.ubj"
            lr_path = model_dir / "logistic_model.pkl"
            scaler_path = model_dir / "feature_scaler.pkl"
            features_path = model_dir / "feature_names.json"
            metadata_path = model_dir / "model_metadata.json"

            missing = [p for p in [xgb_path, lr_path, scaler_path, features_path]
                       if not p.exists()]
            if missing:
                logger.warning(
                    "ProductionV8Model files missing: %s",
                    [str(p) for p in missing],
                )
                return False

            # XGBoost — load as raw Booster (version-stable across
            # xgboost/sklearn minor version mismatches).
            cls._xgb_model = xgb.Booster()
            cls._xgb_model.load_model(str(xgb_path))

            # Logistic + Scaler
            cls._lr_model = joblib.load(lr_path)
            cls._scaler = joblib.load(scaler_path)

            # Feature names
            with open(features_path, "r") as f:
                cls._feature_names = json.load(f)

            # Metadata
            if metadata_path.exists():
                with open(metadata_path, "r") as f:
                    cls._metadata = json.load(f)

            cls._loaded = True
            logger.info(
                "ProductionV8Model loaded: %d features, trained on %d samples",
                len(cls._feature_names),
                cls._metadata.get("trained_on_samples", 0) if cls._metadata else 0,
            )
            return True

        except Exception as exc:
            logger.exception("ProductionV8Model load failed: %s", exc)
            return False

    @classmethod
    def is_available(cls) -> bool:
        """Check if models are loaded or can be loaded."""
        if cls._loaded:
            return True
        return cls.load_models()

    # ------------------------------------------------------------------ #
    # ForecastModel interface                                             #
    # ------------------------------------------------------------------ #

    def __init__(self, model_version_id: UUID, config: dict) -> None:
        super().__init__(model_version_id, config or {})
        # Ensure models are loaded
        self.__class__.load_models()
        self._is_trained = self.__class__._loaded

    def predict(self, match_context: dict) -> ForecastResult:
        """Predict home/draw/away probabilities."""
        if not self.__class__._loaded:
            # Fallback to uniform prior if models not loaded
            logger.warning("ProductionV8Model not loaded, returning uniform prior")
            return ForecastResult(
                home_win_prob=1 / 3,
                draw_prob=1 / 3,
                away_win_prob=1 / 3,
                confidence=0.0,
                explanation_factors={"status": "model_not_loaded"},
                raw_output={"error": "production_v8_unavailable"},
            )

        # Build 39-feature vector from match_context
        features = self._build_feature_vector(match_context)
        X = np.array(features, dtype=float).reshape(1, -1)

        # Scale and predict with Logistic Regression
        X_scaled = self.__class__._scaler.transform(X)
        lr_probs = self.__class__._lr_model.predict_proba(X_scaled)[0]

        # XGBoost Booster API — predict_proba replaced by predict(DMatrix)
        dmat = xgb.DMatrix(X)
        xgb_probs = self.__class__._xgb_model.predict(dmat)[0]

        # Ensemble: weighted average
        ens_probs = _LR_WEIGHT * lr_probs + _XGB_WEIGHT * xgb_probs
        # LR/XGB classes are [0, 1, 2] = [home, draw, away]
        h, d, a = float(ens_probs[0]), float(ens_probs[1]), float(ens_probs[2])
        h, d, a = self._normalise_probs(h, d, a)
        confidence = max(h, d, a)

        return ForecastResult(
            home_win_prob=h,
            draw_prob=d,
            away_win_prob=a,
            confidence=confidence,
            explanation_factors={
                "model": "production_v8",
                "lr_weight": _LR_WEIGHT,
                "xgb_weight": _XGB_WEIGHT,
                "features": dict(zip(self.__class__._feature_names, features)),
            },
            raw_output={
                "lr_probs": lr_probs.tolist(),
                "xgb_probs": xgb_probs.tolist(),
                "ens_probs": ens_probs.tolist(),
            },
        )

    def train(self, training_data: list[dict]) -> dict:
        """Not supported — this is a pre-trained model. Use train_and_save.py."""
        raise NotImplementedError(
            "ProductionV8Model is pre-trained. Retrain via "
            "`backend/scripts/train_and_save.py`."
        )

    def get_feature_names(self) -> list[str]:
        self.__class__.load_models()
        return self.__class__._feature_names or []

    # ------------------------------------------------------------------ #
    # Feature builder — matches train_local.py order EXACTLY              #
    # ------------------------------------------------------------------ #

    def _build_feature_vector(self, ctx: dict) -> list[float]:
        """Build the 39-feature vector in the EXACT order as train_local.py.

        Feature order (must match feature_names.json):
          0-2:   home_elo, away_elo, elo_diff
          3-10:  h_ppg5, a_ppg5, h_gf5, a_gf5, h_ga5, a_ga5, h_wr5, a_wr5
          11-14: h_ppg10, a_ppg10, h_gd10, a_gd10
          15-16: h_ppg3, a_ppg3
          17-20: h_home_ppg, a_away_ppg, h_home_wr, a_away_wr
          21-23: h2h_home_wr, h2h_total, h2h_draw_pct
          24-29: h_mp, a_mp, h_gd_season, a_gd_season, h_swr, a_swr
          30-31: h_consistency, a_consistency
          32-33: h_cs_pct, a_cs_pct
          34-35: h_rest, a_rest
          36-38: form_diff, venue_form_diff, gd_diff
        """
        home_id = str(ctx.get("home_team_id", ""))
        away_id = str(ctx.get("away_team_id", ""))

        # Elo (3)
        home_elo = float(ctx.get("home_elo_at_kickoff") or 1500.0)
        away_elo = float(ctx.get("away_elo_at_kickoff") or 1500.0)
        elo_diff = home_elo - away_elo

        # Build per-team history from form lists.
        # v8.1 feature-parity fix: backend now loads 10 matches (_FORM_MATCHES=10)
        # to match train_local.py full-history pipeline. See
        # docs/feature_pipeline_verification.md for root cause.
        home_form = ctx.get("home_form") or []
        away_form = ctx.get("away_form") or []
        h2h = ctx.get("h2h_matches") or []

        h_hist = _form_to_history(home_form, home_id)
        a_hist = _form_to_history(away_form, away_id)

        # ── Form last 5 (8 features) ──
        h_ppg5, h_gf5, h_ga5, h_wr5, _ = _form_stats(h_hist, n=5)
        a_ppg5, a_gf5, a_ga5, a_wr5, _ = _form_stats(a_hist, n=5)

        # ── Form last 10 (4 features) — real 10-match window ──
        h_ppg10, h_gf10, h_ga10, _, _ = _form_stats(h_hist, n=10)
        a_ppg10, a_gf10, a_ga10, _, _ = _form_stats(a_hist, n=10)
        h_gd10 = h_gf10 - h_ga10
        a_gd10 = a_gf10 - a_ga10

        # ── Momentum last 3 (2 features) ──
        h_ppg3, _, _, _, _ = _form_stats(h_hist, n=3)
        a_ppg3, _, _, _, _ = _form_stats(a_hist, n=3)

        # ── Home-only / Away-only form (4 features) ──
        # Matches train_local.py: filter full history, then take last 5 of that subset.
        h_home_hist = [h for h in h_hist if h["is_home"] is True]
        a_away_hist = [h for h in a_hist if h["is_home"] is False]
        h_home_ppg, _, _, h_home_wr, _ = _form_stats(h_home_hist, n=5)
        a_away_ppg, _, _, a_away_wr, _ = _form_stats(a_away_hist, n=5)

        # ── H2H (3 features) ──
        h2h_recent = h2h[-5:] if len(h2h) >= 5 else h2h
        h2h_home_wins = 0
        h2h_away_wins = 0
        h2h_draws = 0
        for m in h2h_recent:
            hs = _dict_get(m, "home_score", 0) or 0
            as_ = _dict_get(m, "away_score", 0) or 0
            m_home = str(_dict_get(m, "home_team_id", ""))
            if hs > as_:
                if m_home == home_id:
                    h2h_home_wins += 1
                else:
                    h2h_away_wins += 1
            elif hs < as_:
                if m_home == home_id:
                    h2h_away_wins += 1
                else:
                    h2h_home_wins += 1
            else:
                h2h_draws += 1
        h2h_total = len(h2h_recent)
        h2h_home_wr = h2h_home_wins / h2h_total if h2h_total > 0 else 0.5
        h2h_draw_pct = h2h_draws / max(h2h_total, 1)

        # ── Season stats (6 features) ──
        home_stats = ctx.get("home_stats") or {}
        away_stats = ctx.get("away_stats") or {}
        h_mp = float(home_stats.get("matches_played") or 0)
        a_mp = float(away_stats.get("matches_played") or 0)
        h_gf_season = float(home_stats.get("goals_scored") or 0)
        h_ga_season = float(home_stats.get("goals_conceded") or 0)
        a_gf_season = float(away_stats.get("goals_scored") or 0)
        a_ga_season = float(away_stats.get("goals_conceded") or 0)
        # Per-game averages (train_local uses gs/mp format)
        h_sg = h_gf_season / h_mp if h_mp > 0 else 0.0
        h_cg = h_ga_season / h_mp if h_mp > 0 else 0.0
        a_sg = a_gf_season / a_mp if a_mp > 0 else 0.0
        a_cg = a_ga_season / a_mp if a_mp > 0 else 0.0
        h_gd_season = h_sg - h_cg
        a_gd_season = a_sg - a_cg
        h_swr = float(home_stats.get("win_rate") or 0)
        a_swr = float(away_stats.get("win_rate") or 0)

        # ── Consistency (2 features) — std of goals last 10 ──
        h_consistency = _goal_consistency(h_hist)
        a_consistency = _goal_consistency(a_hist)

        # ── Clean sheet % (2 features) — percent of last 10 ──
        h_cs_pct = _clean_sheet_pct(h_hist)
        a_cs_pct = _clean_sheet_pct(a_hist)

        # ── Rest days (2 features) ──
        h_rest = _days_rest(h_hist, ctx.get("scheduled_at"))
        a_rest = _days_rest(a_hist, ctx.get("scheduled_at"))

        # ── Derived (3 features) ──
        form_diff = h_ppg5 - a_ppg5
        venue_form_diff = h_home_ppg - a_away_ppg
        gd_diff = h_gd_season - a_gd_season

        return [
            # Elo (3)
            home_elo, away_elo, elo_diff,
            # Form last 5 (8)
            h_ppg5, a_ppg5, h_gf5, a_gf5, h_ga5, a_ga5, h_wr5, a_wr5,
            # Form last 10 (4)
            h_ppg10, a_ppg10, h_gd10, a_gd10,
            # Momentum last 3 (2)
            h_ppg3, a_ppg3,
            # Home/Away specific form (4)
            h_home_ppg, a_away_ppg, h_home_wr, a_away_wr,
            # H2H (3)
            h2h_home_wr, float(h2h_total), h2h_draw_pct,
            # Season stats (6)
            h_mp, a_mp, h_gd_season, a_gd_season, h_swr, a_swr,
            # Consistency (2)
            h_consistency, a_consistency,
            # Clean sheets (2)
            h_cs_pct, a_cs_pct,
            # Rest days (2)
            h_rest, a_rest,
            # Derived (3)
            form_diff, venue_form_diff, gd_diff,
        ]


# ──────────────────────────────────────────────────────────────────────────
# Helpers (pure functions, no ORM dependencies)
# ──────────────────────────────────────────────────────────────────────────


def _dict_get(obj, key, default=None):
    """Safely get attribute from dict or ORM object."""
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def _form_to_history(form: list, team_id: str) -> list[dict]:
    """Convert a form list (dicts or ORM objects) to normalized history entries.

    Each entry: {is_home, goals_for, goals_against, scheduled_at}.
    Sorted by scheduled_at ascending (oldest first), matching train_local.
    """
    history = []
    for m in form:
        m_home_id = str(_dict_get(m, "home_team_id", ""))
        m_away_id = str(_dict_get(m, "away_team_id", ""))
        hs = _dict_get(m, "home_score", 0) or 0
        as_ = _dict_get(m, "away_score", 0) or 0
        dt = _dict_get(m, "scheduled_at")

        is_home = (m_home_id == team_id)
        if is_home:
            gf, ga = hs, as_
        elif m_away_id == team_id:
            gf, ga = as_, hs
        else:
            continue

        history.append({
            "is_home": is_home,
            "goals_for": gf,
            "goals_against": ga,
            "scheduled_at": dt,
        })

    # Sort ascending by date (oldest first) — train_local assumes chronological
    def _dt_key(e):
        dt = e["scheduled_at"]
        return dt if dt else ""
    history.sort(key=_dt_key)
    return history


def _form_stats(history: list[dict], n: int):
    """Compute (ppg, avg_gf, avg_ga, win_rate, count) over the last n matches."""
    recent = history[-n:] if len(history) >= n else history
    if not recent:
        return 0.0, 0.0, 0.0, 0.0, 0
    wins = sum(1 for r in recent if r["goals_for"] > r["goals_against"])
    draws = sum(1 for r in recent if r["goals_for"] == r["goals_against"])
    goals_for = sum(r["goals_for"] for r in recent)
    goals_against = sum(r["goals_against"] for r in recent)
    cnt = len(recent)
    ppg = (wins * 3 + draws) / cnt
    gf_avg = goals_for / cnt
    ga_avg = goals_against / cnt
    wr = wins / cnt
    return ppg, gf_avg, ga_avg, wr, cnt


def _goal_consistency(history: list[dict], n: int = 10) -> float:
    recent = history[-n:] if len(history) >= n else history
    if len(recent) < 3:
        return 1.0
    goals = [r["goals_for"] for r in recent]
    return float(np.std(goals))


def _clean_sheet_pct(history: list[dict], n: int = 10) -> float:
    recent = history[-n:] if len(history) >= n else history
    if not recent:
        return 0.0
    return sum(1 for r in recent if r["goals_against"] == 0) / len(recent)


def _days_rest(history: list[dict], current_iso: Optional[str]) -> float:
    """Days since last match. Default 7.0 if no history or no date."""
    if not history or not current_iso:
        return 7.0
    last = history[-1]["scheduled_at"]
    if not last:
        return 7.0
    try:
        from datetime import datetime
        if isinstance(last, str):
            last_dt = datetime.fromisoformat(last.replace("Z", "+00:00"))
        else:
            last_dt = last
        if isinstance(current_iso, str):
            curr_dt = datetime.fromisoformat(current_iso.replace("Z", "+00:00"))
        else:
            curr_dt = current_iso
        delta = (curr_dt - last_dt).days
        return float(max(0, min(delta, 30)))
    except Exception:
        return 7.0
