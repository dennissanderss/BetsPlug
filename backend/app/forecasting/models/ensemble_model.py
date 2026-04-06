"""Ensemble model combining multiple sub-models via weighted averaging.

The ensemble aggregates the 1X2 probability outputs of any number of
``ForecastModel`` sub-models.  It supports:

* **Weighted average** – each sub-model's probabilities are multiplied by a
  weight and summed, then re-normalised.
* **Confidence from agreement** – the variance across sub-model outputs is
  used to quantify how much the models agree.  Low variance → high
  confidence, high variance → lower confidence.
* **Transparency** – the explanation exposes each sub-model's individual
  forecast alongside the ensemble result.
"""

from __future__ import annotations

import math
from typing import Optional
from uuid import UUID

import numpy as np

from app.forecasting.base_model import ForecastModel, ForecastResult


class EnsembleModel(ForecastModel):
    """Weighted-average ensemble over multiple ``ForecastModel`` instances.

    Parameters
    ----------
    model_version_id:
        UUID of the ``ModelVersion`` row.
    config:
        Hyper-parameter dict (see below).
    sub_models:
        List of ``(ForecastModel, weight)`` tuples.  Weights need not sum to
        1 – they are normalised internally.

    Config keys
    -----------
    min_agreement_threshold : float
        Minimum average pairwise probability agreement required before the
        ensemble is considered "confident" (default 0.7).
    """

    def __init__(
        self,
        model_version_id: UUID,
        config: dict,
        sub_models: Optional[list[tuple[ForecastModel, float]]] = None,
    ) -> None:
        super().__init__(model_version_id, config)
        self.sub_models: list[tuple[ForecastModel, float]] = sub_models or []
        self.min_agreement_threshold: float = float(
            config.get("min_agreement_threshold", 0.7)
        )

    # ------------------------------------------------------------------ #
    # ForecastModel interface                                              #
    # ------------------------------------------------------------------ #

    def get_feature_names(self) -> list[str]:
        names: list[str] = []
        for model, _ in self.sub_models:
            for feat in model.get_feature_names():
                qualified = f"{model.__class__.__name__.lower()}_{feat}"
                if qualified not in names:
                    names.append(qualified)
        return names

    def predict(self, match_context: dict) -> ForecastResult:
        """Run all sub-models and return a weighted-average ensemble result.

        If no sub-models are registered, falls back to uniform probabilities.
        """
        if not self.sub_models:
            return ForecastResult(
                home_win_prob=1 / 3,
                draw_prob=1 / 3,
                away_win_prob=1 / 3,
                confidence=0.0,
                explanation_factors={"note": "No sub-models registered"},
                raw_output={"model_type": "ensemble", "sub_models": []},
            )

        sub_results: list[dict] = []
        home_probs: list[float] = []
        draw_probs: list[float] = []
        away_probs: list[float] = []
        weights: list[float] = []
        total_weight = 0.0

        for model, weight in self.sub_models:
            w = max(0.0, weight)
            try:
                result = model.predict(match_context)
                sub_results.append(
                    {
                        "model": model.__class__.__name__,
                        "weight": w,
                        "home_win_prob": result.home_win_prob,
                        "draw_prob": result.draw_prob,
                        "away_win_prob": result.away_win_prob,
                        "confidence": result.confidence,
                        "explanation_factors": result.explanation_factors,
                    }
                )
                home_probs.append(result.home_win_prob)
                draw_probs.append(result.draw_prob)
                away_probs.append(result.away_win_prob)
                weights.append(w)
                total_weight += w
            except Exception as exc:
                sub_results.append(
                    {
                        "model": model.__class__.__name__,
                        "weight": w,
                        "error": str(exc),
                    }
                )

        if total_weight <= 0 or not home_probs:
            return ForecastResult(
                home_win_prob=1 / 3,
                draw_prob=1 / 3,
                away_win_prob=1 / 3,
                confidence=0.0,
                explanation_factors={"note": "All sub-models failed"},
                raw_output={"model_type": "ensemble", "sub_models": sub_results},
            )

        # Normalise weights
        norm_weights = [w / total_weight for w in weights]

        # Weighted-average probabilities
        ensemble_home = float(np.dot(norm_weights, home_probs))
        ensemble_draw = float(np.dot(norm_weights, draw_probs))
        ensemble_away = float(np.dot(norm_weights, away_probs))

        # Normalise to ensure sum = 1
        ensemble_home, ensemble_draw, ensemble_away = self._normalise_probs(
            ensemble_home, ensemble_draw, ensemble_away
        )

        # ---- Agreement-based confidence ---------------------------------- #
        # Pairwise cosine similarity of the probability vectors
        agreement = self._compute_agreement(
            list(zip(home_probs, draw_probs, away_probs))
        )
        # Also factor in the dominant probability magnitude
        max_prob = max(ensemble_home, ensemble_draw, ensemble_away)
        magnitude_conf = min(1.0, max(0.0, (max_prob - 1 / 3) / (2 / 3)))
        # Agreement confidence: scale from 0 when fully disagreeing to 1 when
        # all models agree perfectly
        agreement_conf = max(0.0, (agreement - (1 / 3)) / (2 / 3))

        confidence = 0.6 * agreement_conf + 0.4 * magnitude_conf

        # Confidence interval via weighted std of sub-model home-win probs
        if len(home_probs) > 1:
            weighted_var = float(
                np.average(
                    np.array(home_probs) ** 2, weights=norm_weights
                )
                - ensemble_home ** 2
            )
            sigma = math.sqrt(max(0.0, weighted_var))
        else:
            sigma = math.sqrt(max_prob * (1 - max_prob) / 30)

        ci = (
            max(0.0, max_prob - 1.96 * sigma),
            min(1.0, max_prob + 1.96 * sigma),
        )

        explanation: dict = {
            "home_team": match_context.get("home_team_name", ""),
            "away_team": match_context.get("away_team_name", ""),
            "n_sub_models": len(sub_results),
            "model_agreement": round(agreement, 4),
            "sub_model_results": [
                {
                    "model": r["model"],
                    "weight": round(r["weight"], 4),
                    "home_win_prob": round(r.get("home_win_prob", 0.0), 4),
                    "draw_prob": round(r.get("draw_prob", 0.0), 4),
                    "away_win_prob": round(r.get("away_win_prob", 0.0), 4),
                }
                for r in sub_results
                if "error" not in r
            ],
            "failed_models": [r["model"] for r in sub_results if "error" in r],
        }

        raw: dict = {
            "model_type": "ensemble",
            "sub_models": sub_results,
            "normalised_weights": norm_weights,
            "agreement": agreement,
        }

        return ForecastResult(
            home_win_prob=round(ensemble_home, 6),
            draw_prob=round(ensemble_draw, 6),
            away_win_prob=round(ensemble_away, 6),
            confidence=round(confidence, 4),
            confidence_interval=ci,
            explanation_factors=explanation,
            raw_output=raw,
        )

    def train(self, training_data: list[dict]) -> dict:
        """Train all registered sub-models and aggregate metrics.

        Returns a combined metrics dict with per-model results under the
        key ``sub_model_metrics``.
        """
        all_metrics: dict[str, dict] = {}

        for model, weight in self.sub_models:
            model_name = f"{model.__class__.__name__}_{id(model)}"
            try:
                metrics = model.train(training_data)
                all_metrics[model_name] = metrics
            except Exception as exc:
                all_metrics[model_name] = {"error": str(exc)}

        self._is_trained = all(m.is_trained for m, _ in self.sub_models)

        return {
            "sub_model_metrics": all_metrics,
            "n_sub_models": len(self.sub_models),
            "all_trained": self._is_trained,
        }

    # ------------------------------------------------------------------ #
    # Helper                                                               #
    # ------------------------------------------------------------------ #

    def add_sub_model(self, model: ForecastModel, weight: float = 1.0) -> None:
        """Register a new sub-model at runtime."""
        self.sub_models.append((model, weight))

    @staticmethod
    def _compute_agreement(
        prob_vectors: list[tuple[float, float, float]]
    ) -> float:
        """Average pairwise cosine similarity between probability vectors.

        Returns a value in [0, 1] where 1 means all models predict
        identical distributions.
        """
        n = len(prob_vectors)
        if n == 0:
            return 0.0
        if n == 1:
            return 1.0

        vecs = np.array(prob_vectors)
        # Cosine similarity between each pair
        norms = np.linalg.norm(vecs, axis=1, keepdims=True)
        norms = np.where(norms == 0, 1e-10, norms)
        normed = vecs / norms

        sim_sum = 0.0
        count = 0
        for i in range(n):
            for j in range(i + 1, n):
                sim_sum += float(np.dot(normed[i], normed[j]))
                count += 1

        return sim_sum / count if count > 0 else 1.0
