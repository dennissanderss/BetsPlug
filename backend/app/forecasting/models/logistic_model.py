"""Logistic regression match outcome forecasting model.

Feature engineering
-------------------
The model uses the following feature groups, all derived from
``match_context``:

Form features (last 5 matches)
  * home_form_pts   – average points per game (0-3) for home team
  * away_form_pts   – average points per game for away team
  * home_form_gf    – average goals scored per game in last 5 (home side)
  * home_form_ga    – average goals conceded per game in last 5 (home side)
  * away_form_gf    – average goals scored per game in last 5 (away side)
  * away_form_ga    – average goals conceded per game in last 5 (away side)

Season record
  * home_win_rate       – wins / matches_played
  * away_win_rate
  * home_draw_rate
  * away_draw_rate
  * home_avg_scored     – season average goals scored
  * away_avg_scored
  * home_avg_conceded
  * away_avg_conceded

Head-to-head (last 10)
  * h2h_home_win_rate   – fraction of h2h where current home team won
  * h2h_draw_rate
  * h2h_away_win_rate

League standing
  * home_position_norm  – position / total_teams (0 = best, 1 = worst)
  * away_position_norm
  * home_points_per_game
  * away_points_per_game

Differential features
  * form_pts_diff       – home_form_pts - away_form_pts
  * standing_diff       – away_position_norm - home_position_norm
  * avg_scored_diff
  * avg_conceded_diff

The target is multi-class: 0 = home win, 1 = draw, 2 = away win.
Probabilities are obtained via predict_proba (sklearn LogisticRegression
uses softmax for multi-class, so output is already calibrated).
"""

from __future__ import annotations

import math
from typing import Optional
from uuid import UUID

import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from app.forecasting.base_model import ForecastModel, ForecastResult

# Class label encoding
_HOME_WIN = 0
_DRAW = 1
_AWAY_WIN = 2


class LogisticModel(ForecastModel):
    """Logistic regression 1X2 forecast model.

    Config keys
    -----------
    C : float
        Inverse of regularisation strength (default 1.0).
    max_iter : int
        Maximum solver iterations (default 1000).
    calibration_method : str
        ``'sigmoid'`` or ``'isotonic'`` for post-hoc calibration
        (default ``'sigmoid'``).  Set to ``'none'`` to skip.
    n_form_matches : int
        How many recent matches to use for form features (default 5).
    """

    # Feature names in the exact order they are assembled in
    # _build_feature_vector. v5.2 additions: Elo difference + match
    # statistics averages from the team's recent form (shots on
    # target, possession, corners).
    _FEATURE_NAMES: list[str] = [
        "home_form_pts",
        "away_form_pts",
        "home_form_gf",
        "home_form_ga",
        "away_form_gf",
        "away_form_ga",
        "home_win_rate",
        "away_win_rate",
        "home_draw_rate",
        "away_draw_rate",
        "home_avg_scored",
        "away_avg_scored",
        "home_avg_conceded",
        "away_avg_conceded",
        "h2h_home_win_rate",
        "h2h_draw_rate",
        "h2h_away_win_rate",
        "home_position_norm",
        "away_position_norm",
        "home_points_per_game",
        "away_points_per_game",
        "form_pts_diff",
        "standing_diff",
        "avg_scored_diff",
        "avg_conceded_diff",
        # v5.2 additions
        "elo_diff",                       # home_elo_at_kickoff - away_elo_at_kickoff
        "home_form_shots_on_target",
        "away_form_shots_on_target",
        "home_form_possession_pct",
        "away_form_possession_pct",
        "home_form_corners",
        "away_form_corners",
        "shots_on_target_diff",
        "possession_diff",
        # v3 additions — derived from existing form data, zero API calls
        "home_clean_sheets_pct",
        "away_clean_sheets_pct",
        "home_scoring_consistency",
        "away_scoring_consistency",
        "home_goals_first_half",
        "away_goals_first_half",
        "home_ppg_last5",
        "away_ppg_last5",
        "league_position_diff",
        "match_importance",
    ]

    def __init__(self, model_version_id: UUID, config: dict) -> None:
        super().__init__(model_version_id, config)
        self.C: float = float(config.get("C", 1.0))
        self.max_iter: int = int(config.get("max_iter", 1000))
        self.calibration_method: str = config.get("calibration_method", "sigmoid")
        self.n_form_matches: int = int(config.get("n_form_matches", 5))

        self._scaler: StandardScaler = StandardScaler()
        self._model: Optional[LogisticRegression | CalibratedClassifierCV] = None
        self._classes: list[int] = [_HOME_WIN, _DRAW, _AWAY_WIN]

    # ------------------------------------------------------------------ #
    # ForecastModel interface                                              #
    # ------------------------------------------------------------------ #

    def get_feature_names(self) -> list[str]:
        return list(self._FEATURE_NAMES)

    def predict(self, match_context: dict) -> ForecastResult:
        """Generate calibrated 1X2 probabilities.

        If the model has not been trained yet (e.g. cold start), falls back
        to uniform prior with low confidence.
        """
        features = self._build_feature_vector(match_context)
        features_dict = dict(zip(self._FEATURE_NAMES, features))

        if self._model is None:
            # Cold-start: uniform probabilities
            home_p, draw_p, away_p = 1 / 3, 1 / 3, 1 / 3
            confidence = 0.0
            coef_explanation: dict = {"note": "Model not yet trained – uniform prior"}
        else:
            x = self._scaler.transform([features])
            proba = self._model.predict_proba(x)[0]

            # Map class indices to outcome labels
            class_order = list(self._model.classes_)
            prob_map = dict(zip(class_order, proba))
            home_p = float(prob_map.get(_HOME_WIN, 1 / 3))
            draw_p = float(prob_map.get(_DRAW, 1 / 3))
            away_p = float(prob_map.get(_AWAY_WIN, 1 / 3))
            home_p, draw_p, away_p = self._normalise_probs(home_p, draw_p, away_p)

            max_p = max(home_p, draw_p, away_p)
            confidence = min(1.0, max(0.0, (max_p - 1 / 3) / (2 / 3)))

            # Extract feature importances from base logistic regression.
            # For CalibratedClassifierCV the fitted sub-estimators are in
            # calibrated_classifiers_; we use the first fold's inner LR.
            if isinstance(self._model, CalibratedClassifierCV):
                try:
                    base_lr = self._model.calibrated_classifiers_[0].estimator
                except (AttributeError, IndexError):
                    base_lr = self._model.estimator  # fallback (unfitted)
            else:
                base_lr = self._model
            coef_explanation = self._extract_coefficients(base_lr, features_dict)

        max_prob = max(home_p, draw_p, away_p)
        n_eff = 30
        sigma = math.sqrt(max_prob * (1 - max_prob) / n_eff)
        ci = (max(0.0, max_prob - 1.96 * sigma), min(1.0, max_prob + 1.96 * sigma))

        explanation: dict = {
            "home_team": match_context.get("home_team_name", ""),
            "away_team": match_context.get("away_team_name", ""),
            "features": {k: round(v, 4) for k, v in features_dict.items()},
            **coef_explanation,
        }

        raw: dict = {
            "model_type": "logistic",
            "feature_vector": [round(float(v), 6) for v in features],
            "is_trained": self._is_trained,
        }

        return ForecastResult(
            home_win_prob=round(home_p, 6),
            draw_prob=round(draw_p, 6),
            away_win_prob=round(away_p, 6),
            confidence=round(confidence, 4),
            confidence_interval=ci,
            explanation_factors=explanation,
            raw_output=raw,
        )

    def train(self, training_data: list[dict]) -> dict:
        """Fit the logistic regression model.

        Each item in *training_data* must contain the same keys expected by
        ``build_match_context`` PLUS ``home_score`` and ``away_score``.
        """
        if not training_data:
            self._is_trained = True
            return {"n_samples": 0}

        X: list[list[float]] = []
        y: list[int] = []

        for match in training_data:
            features = self._build_feature_vector(match)
            X.append(features)

            hs = int(match.get("home_score", 0))
            aws = int(match.get("away_score", 0))
            if hs > aws:
                y.append(_HOME_WIN)
            elif hs < aws:
                y.append(_AWAY_WIN)
            else:
                y.append(_DRAW)

        X_arr = np.array(X)
        y_arr = np.array(y)

        X_scaled = self._scaler.fit_transform(X_arr)

        base_lr = LogisticRegression(
            C=self.C,
            max_iter=self.max_iter,
            solver="lbfgs",
            random_state=42,
        )

        if self.calibration_method != "none" and len(training_data) >= 20:
            model: LogisticRegression | CalibratedClassifierCV = CalibratedClassifierCV(
                base_lr, method=self.calibration_method, cv=5
            )
        else:
            model = base_lr

        model.fit(X_scaled, y_arr)
        self._model = model
        self._is_trained = True

        # Training metrics
        y_pred = model.predict(X_scaled)
        accuracy = float(np.mean(y_pred == y_arr))

        proba = model.predict_proba(X_scaled)
        class_order = list(model.classes_)
        brier_sum = 0.0
        for i, true_label in enumerate(y_arr):
            true_idx = class_order.index(true_label)
            brier_sum += sum(
                (int(j == true_idx) - proba[i, j]) ** 2
                for j in range(len(class_order))
            )

        return {
            "n_samples": len(training_data),
            "accuracy": round(float(accuracy), 4),
            "brier_score": round(float(brier_sum) / len(training_data), 4),
            "n_features": len(self._FEATURE_NAMES),
        }

    # ------------------------------------------------------------------ #
    # Feature engineering                                                  #
    # ------------------------------------------------------------------ #

    def _build_feature_vector(self, ctx: dict) -> list[float]:
        """Extract a fixed-length feature vector from *ctx*."""
        n = self.n_form_matches

        # --- Form features ---
        home_form = ctx.get("home_form", [])[-n:]
        away_form = ctx.get("away_form", [])[-n:]

        home_id = str(ctx.get("home_team_id", ""))
        away_id = str(ctx.get("away_team_id", ""))

        home_form_pts = self._form_avg_points(home_form, home_id)
        away_form_pts = self._form_avg_points(away_form, away_id)
        home_form_gf = self._form_avg_goals_scored(home_form, home_id)
        home_form_ga = self._form_avg_goals_conceded(home_form, home_id)
        away_form_gf = self._form_avg_goals_scored(away_form, away_id)
        away_form_ga = self._form_avg_goals_conceded(away_form, away_id)

        # --- Season stats ---
        hs = ctx.get("home_stats", {}) or {}
        aws = ctx.get("away_stats", {}) or {}

        def safe_rate(wins_or_draws: float, played: float) -> float:
            return wins_or_draws / played if played > 0 else 0.5

        home_played = float(hs.get("matches_played", 0) or 0)
        away_played = float(aws.get("matches_played", 0) or 0)

        home_win_rate = safe_rate(float(hs.get("wins", 0) or 0), home_played)
        away_win_rate = safe_rate(float(aws.get("wins", 0) or 0), away_played)
        home_draw_rate = safe_rate(float(hs.get("draws", 0) or 0), home_played)
        away_draw_rate = safe_rate(float(aws.get("draws", 0) or 0), away_played)
        home_avg_scored = float(hs.get("avg_goals_scored") or 0) or (
            float(hs.get("goals_scored", 0) or 0) / home_played if home_played > 0 else 1.3
        )
        away_avg_scored = float(aws.get("avg_goals_scored") or 0) or (
            float(aws.get("goals_scored", 0) or 0) / away_played if away_played > 0 else 1.1
        )
        home_avg_conceded = float(hs.get("avg_goals_conceded") or 0) or (
            float(hs.get("goals_conceded", 0) or 0) / home_played if home_played > 0 else 1.2
        )
        away_avg_conceded = float(aws.get("avg_goals_conceded") or 0) or (
            float(aws.get("goals_conceded", 0) or 0) / away_played if away_played > 0 else 1.4
        )

        # --- Head-to-head ---
        h2h = ctx.get("h2h_matches", [])
        h2h_home_win_rate, h2h_draw_rate, h2h_away_win_rate = self._h2h_rates(
            h2h, home_id, away_id
        )

        # --- League standing ---
        home_std = ctx.get("home_standing", {}) or {}
        away_std = ctx.get("away_standing", {}) or {}
        total_teams = float(ctx.get("total_teams_in_league", 20) or 20)

        home_position_norm = (float(home_std.get("position", total_teams / 2) or total_teams / 2) - 1) / max(
            total_teams - 1, 1
        )
        away_position_norm = (float(away_std.get("position", total_teams / 2) or total_teams / 2) - 1) / max(
            total_teams - 1, 1
        )

        home_std_played = float(home_std.get("played", 1) or 1)
        away_std_played = float(away_std.get("played", 1) or 1)
        home_points_per_game = float(home_std.get("points", 0) or 0) / home_std_played
        away_points_per_game = float(away_std.get("points", 0) or 0) / away_std_played

        # --- Differential features ---
        form_pts_diff = home_form_pts - away_form_pts
        standing_diff = away_position_norm - home_position_norm
        avg_scored_diff = home_avg_scored - away_avg_scored
        avg_conceded_diff = home_avg_conceded - away_avg_conceded

        # --- v5.2 Elo diff from context ---
        home_elo = float(ctx.get("home_elo_at_kickoff") or 1500.0)
        away_elo = float(ctx.get("away_elo_at_kickoff") or 1500.0)
        elo_diff = (home_elo - away_elo) / 100.0  # scale to units of 100 Elo

        # --- v5.2 Match statistics averages from recent form ---
        # ``form_stats`` is populated by ForecastService.build_match_context
        # with per-team averages over their last N finished matches.
        form_stats = ctx.get("form_stats", {}) or {}
        h_stats = (form_stats.get("home") or {})
        a_stats = (form_stats.get("away") or {})

        def _fs(d: dict, key: str, default: float) -> float:
            v = d.get(key)
            try:
                return float(v) if v is not None else default
            except (TypeError, ValueError):
                return default

        home_form_sot = _fs(h_stats, "shots_on_target", 4.0)
        away_form_sot = _fs(a_stats, "shots_on_target", 4.0)
        home_form_pos = _fs(h_stats, "possession_pct", 50.0)
        away_form_pos = _fs(a_stats, "possession_pct", 50.0)
        home_form_cor = _fs(h_stats, "corners", 5.0)
        away_form_cor = _fs(a_stats, "corners", 5.0)

        shots_on_target_diff = home_form_sot - away_form_sot
        possession_diff = home_form_pos - away_form_pos

        return [
            home_form_pts,
            away_form_pts,
            home_form_gf,
            home_form_ga,
            away_form_gf,
            away_form_ga,
            home_win_rate,
            away_win_rate,
            home_draw_rate,
            away_draw_rate,
            home_avg_scored,
            away_avg_scored,
            home_avg_conceded,
            away_avg_conceded,
            h2h_home_win_rate,
            h2h_draw_rate,
            h2h_away_win_rate,
            home_position_norm,
            away_position_norm,
            home_points_per_game,
            away_points_per_game,
            form_pts_diff,
            standing_diff,
            avg_scored_diff,
            avg_conceded_diff,
            # v5.2
            elo_diff,
            home_form_sot,
            away_form_sot,
            home_form_pos,
            away_form_pos,
            home_form_cor,
            away_form_cor,
            shots_on_target_diff,
            possession_diff,
            # v3: derived features from existing form data
            float(ctx.get("home_clean_sheets_pct", 0.0) or 0.0),
            float(ctx.get("away_clean_sheets_pct", 0.0) or 0.0),
            float(ctx.get("home_scoring_consistency", 0.0) or 0.0),
            float(ctx.get("away_scoring_consistency", 0.0) or 0.0),
            float(ctx.get("home_goals_first_half", 0.0) or 0.0),
            float(ctx.get("away_goals_first_half", 0.0) or 0.0),
            float(ctx.get("home_ppg_last5", 0.0) or 0.0),
            float(ctx.get("away_ppg_last5", 0.0) or 0.0),
            float(ctx.get("league_position_diff", 0.0) or 0.0),
            float(ctx.get("match_importance", 0.5) or 0.5),
        ]

    # ------------------------------------------------------------------ #
    # Feature helpers                                                      #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _form_avg_points(form: list[dict], team_id: str) -> float:
        if not form:
            return 1.0  # neutral prior
        pts: list[float] = []
        for m in form:
            h_id = str(m.get("home_team_id", ""))
            a_id = str(m.get("away_team_id", ""))
            hs = int(m.get("home_score", 0))
            aws = int(m.get("away_score", 0))
            if team_id == h_id:
                pts.append(3.0 if hs > aws else (1.0 if hs == aws else 0.0))
            elif team_id == a_id:
                pts.append(3.0 if aws > hs else (1.0 if hs == aws else 0.0))
        return sum(pts) / len(pts) if pts else 1.0

    @staticmethod
    def _form_avg_goals_scored(form: list[dict], team_id: str) -> float:
        if not form:
            return 1.3
        goals: list[float] = []
        for m in form:
            h_id = str(m.get("home_team_id", ""))
            a_id = str(m.get("away_team_id", ""))
            if team_id == h_id:
                goals.append(float(m.get("home_score", 0)))
            elif team_id == a_id:
                goals.append(float(m.get("away_score", 0)))
        return sum(goals) / len(goals) if goals else 1.3

    @staticmethod
    def _form_avg_goals_conceded(form: list[dict], team_id: str) -> float:
        if not form:
            return 1.3
        goals: list[float] = []
        for m in form:
            h_id = str(m.get("home_team_id", ""))
            a_id = str(m.get("away_team_id", ""))
            if team_id == h_id:
                goals.append(float(m.get("away_score", 0)))
            elif team_id == a_id:
                goals.append(float(m.get("home_score", 0)))
        return sum(goals) / len(goals) if goals else 1.3

    @staticmethod
    def _h2h_rates(
        h2h: list[dict], home_id: str, away_id: str
    ) -> tuple[float, float, float]:
        """Return (home_win_rate, draw_rate, away_win_rate) from h2h history."""
        if not h2h:
            return 1 / 3, 1 / 3, 1 / 3
        home_wins = draws = away_wins = 0
        for m in h2h:
            h_id = str(m.get("home_team_id", ""))
            a_id = str(m.get("away_team_id", ""))
            hs = int(m.get("home_score", 0))
            aws = int(m.get("away_score", 0))
            # Determine which side is "home" vs "away" for this forecast
            if h_id == home_id:
                if hs > aws:
                    home_wins += 1
                elif hs == aws:
                    draws += 1
                else:
                    away_wins += 1
            elif h_id == away_id:
                # Roles are flipped in this h2h match
                if hs > aws:
                    away_wins += 1
                elif hs == aws:
                    draws += 1
                else:
                    home_wins += 1
        total = home_wins + draws + away_wins
        if total == 0:
            return 1 / 3, 1 / 3, 1 / 3
        return home_wins / total, draws / total, away_wins / total

    # ------------------------------------------------------------------ #
    # Coefficient explanation                                              #
    # ------------------------------------------------------------------ #

    def _extract_coefficients(
        self,
        lr: LogisticRegression,
        features_dict: dict[str, float],
    ) -> dict:
        """Return top positive/negative feature contributions for the predicted class."""
        try:
            coef = lr.coef_  # shape (n_classes, n_features)
            feature_names = self._FEATURE_NAMES
            result: dict = {}
            class_labels = ["home_win", "draw", "away_win"]
            for cls_idx, label in enumerate(class_labels):
                if cls_idx >= len(coef):
                    break
                contributions = {
                    name: round(float(coef[cls_idx, i] * features_dict.get(name, 0)), 4)
                    for i, name in enumerate(feature_names)
                }
                sorted_contribs = sorted(
                    contributions.items(), key=lambda x: abs(x[1]), reverse=True
                )
                result[f"top_factors_{label}"] = dict(sorted_contribs[:5])
            return {"coefficient_contributions": result}
        except Exception:
            return {}
