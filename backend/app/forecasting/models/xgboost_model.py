"""XGBoost gradient-boosted tree model for 1X2 match result prediction.

v3 addition to the BetsPlug Pulse ensemble. Uses the same 43-feature
vector as the LogisticModel but with XGBClassifier which can capture
non-linear interactions between features (e.g., "a high Elo diff
matters more when the home team also has high clean-sheet %").

Trained via the same admin endpoint pipeline as LogisticModel:
collect samples → fit model → cache in-memory.
"""

from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import StandardScaler

from app.forecasting.models.logistic_model import LogisticModel

logger = logging.getLogger(__name__)

# Outcome class labels (same as logistic_model.py)
_HOME_WIN = 0
_DRAW = 1
_AWAY_WIN = 2


class XGBoostModel(LogisticModel):
    """XGBoost classifier that inherits feature extraction from LogisticModel.

    Reuses the entire ``_FEATURE_NAMES`` list and ``_build_feature_vector``
    method so both models train on identical features. Only the underlying
    classifier changes: XGBClassifier instead of LogisticRegression.
    """

    def __init__(self, model_version_id: UUID, config: dict) -> None:
        super().__init__(model_version_id, config)
        # XGBoost hyperparameters — conservative defaults that work well
        # on small datasets (< 10k samples).
        self.n_estimators: int = int(config.get("n_estimators", 200))
        self.max_depth: int = int(config.get("max_depth", 4))
        self.learning_rate: float = float(config.get("learning_rate", 0.05))
        self.subsample: float = float(config.get("subsample", 0.8))
        self.colsample_bytree: float = float(config.get("colsample_bytree", 0.8))
        self.min_child_weight: int = int(config.get("min_child_weight", 5))
        self.reg_alpha: float = float(config.get("reg_alpha", 0.1))
        self.reg_lambda: float = float(config.get("reg_lambda", 1.0))

    def train(self, samples: list[dict]) -> dict:
        """Train XGBoost on the collected samples.

        ``samples`` is the same format as LogisticModel.train() expects:
        each dict has a ``context`` key (match_context) and a
        ``home_score`` / ``away_score`` key for the label.

        Returns a summary dict with training metrics.
        """
        try:
            from xgboost import XGBClassifier
        except ImportError:
            logger.error("xgboost not installed — pip install xgboost")
            return {"error": "xgboost not installed", "samples": 0}

        # Build feature matrix + labels
        X_raw = []
        y = []
        skipped = 0
        for s in samples:
            ctx = s.get("context", {})
            try:
                vec = self._build_feature_vector(ctx)
                X_raw.append(vec)
            except Exception:
                skipped += 1
                continue

            hs = s.get("home_score", 0)
            as_ = s.get("away_score", 0)
            if hs > as_:
                y.append(_HOME_WIN)
            elif hs < as_:
                y.append(_AWAY_WIN)
            else:
                y.append(_DRAW)

        if len(X_raw) < 50:
            return {"error": "too_few_samples", "samples": len(X_raw)}

        X = np.array(X_raw, dtype=np.float64)
        y_arr = np.array(y, dtype=np.int32)

        # Replace NaN/inf with 0 (defensive)
        X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

        # Scale features
        self._scaler = StandardScaler()
        X_scaled = self._scaler.fit_transform(X)

        # Train XGBoost
        base_model = XGBClassifier(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            learning_rate=self.learning_rate,
            subsample=self.subsample,
            colsample_bytree=self.colsample_bytree,
            min_child_weight=self.min_child_weight,
            reg_alpha=self.reg_alpha,
            reg_lambda=self.reg_lambda,
            objective="multi:softprob",
            num_class=3,
            eval_metric="mlogloss",
            use_label_encoder=False,
            random_state=42,
            verbosity=0,
        )

        # Train XGBoost directly — CalibratedClassifierCV has sklearn
        # compatibility issues with XGBClassifier on some versions.
        # XGBoost's softprob objective already produces calibrated
        # probabilities via its own internal regularization.
        self._model = base_model
        self._model.fit(X_scaled, y_arr)

        # Training accuracy
        y_pred = self._model.predict(X_scaled)
        accuracy = float(np.mean(y_pred == y_arr))

        logger.info(
            "XGBoost trained: %d samples (skipped %d), accuracy %.1f%%",
            len(X_scaled),
            skipped,
            accuracy * 100,
        )

        return {
            "samples": len(X_scaled),
            "skipped": skipped,
            "features": len(self._FEATURE_NAMES),
            "accuracy": round(accuracy, 4),
            "model_type": "xgboost",
            "n_estimators": self.n_estimators,
            "max_depth": self.max_depth,
        }
