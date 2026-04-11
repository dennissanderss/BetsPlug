"""Elo-rating based match outcome forecasting model (v5).

Unlike v4, this model is **purely a read** of state prepared upstream.
The forecast service pre-fetches point-in-time Elo ratings from
``team_elo_history`` and stuffs them into ``match_context`` under the
keys ``home_elo_at_kickoff`` and ``away_elo_at_kickoff``. ``predict``
uses those values verbatim — there is no hardcoded seed table, no
in-memory ratings dict, and no implicit "seed from standings" path.

If ``match_context`` does not contain the pre-fetched ratings, the
model falls back to ``DEFAULT_ELO`` for both sides. That's fine for
cold-start teams (no history) and for sanity-test calls that don't
bother to build a full context.

The expected score formula and draw split are unchanged from v4.
"""

from __future__ import annotations

import math
from typing import Optional
from uuid import UUID

from app.forecasting.base_model import ForecastModel, ForecastResult


DEFAULT_ELO = 1500.0
_ELO_SCALE = 400.0


class EloModel(ForecastModel):
    """Elo-rating forecast model.

    Config keys
    -----------
    k_factor : float
        Legacy knob, unused in predict (history is read-only) but kept
        so v4 config blobs still load without schema errors.
    home_advantage : float
        Elo points added to the home team's effective rating (default
        65 — v5 tightening from the v4 value of 100 after empirical
        analysis of European top-five home-win rates).
    default_elo : float
        Fallback rating for teams with no history (default 1500).
    draw_factor : float
        Controls how much probability mass lands on draws (default 0.28).
    """

    def __init__(self, model_version_id: UUID, config: dict) -> None:
        super().__init__(model_version_id, config)
        self.k_factor: float = float(config.get("k_factor", 20.0))
        self.home_advantage: float = float(config.get("home_advantage", 65.0))
        self.default_elo: float = float(config.get("default_elo", DEFAULT_ELO))
        self.draw_factor: float = float(config.get("draw_factor", 0.28))

    # ------------------------------------------------------------------ #
    # ForecastModel interface                                              #
    # ------------------------------------------------------------------ #

    def get_feature_names(self) -> list[str]:
        return [
            "home_elo",
            "away_elo",
            "elo_difference",
            "home_advantage",
            "home_expected_score",
            "away_expected_score",
        ]

    def predict(self, match_context: dict) -> ForecastResult:
        """Predict 1X2 probabilities from point-in-time Elo ratings.

        Reads ``home_elo_at_kickoff`` / ``away_elo_at_kickoff`` from the
        pre-built ``match_context``. Those values are expected to be
        populated by ``ForecastService.build_match_context``, which
        queries :mod:`app.forecasting.elo_history` with the fixture's
        kickoff timestamp and runs the anti-leakage assertion.
        """
        home_elo = float(
            match_context.get("home_elo_at_kickoff", self.default_elo)
        )
        away_elo = float(
            match_context.get("away_elo_at_kickoff", self.default_elo)
        )

        effective_home = home_elo + self.home_advantage
        home_exp, away_exp = self._expected_scores(effective_home, away_elo)

        home_prob, draw_prob, away_prob = self._split_probabilities(
            home_exp, away_exp
        )

        max_prob = max(home_prob, draw_prob, away_prob)
        confidence = max(0.0, min(1.0, (max_prob - 1 / 3) / (2 / 3)))

        n_effective = 30
        sigma = math.sqrt(max_prob * (1 - max_prob) / n_effective)
        ci = (
            max(0.0, max_prob - 1.96 * sigma),
            min(1.0, max_prob + 1.96 * sigma),
        )

        home_elo_source = match_context.get("home_elo_source", "default")
        away_elo_source = match_context.get("away_elo_source", "default")

        explanation: dict = {
            "home_team": match_context.get("home_team_name", ""),
            "away_team": match_context.get("away_team_name", ""),
            "home_elo": round(home_elo, 1),
            "away_elo": round(away_elo, 1),
            "home_elo_with_advantage": round(effective_home, 1),
            "elo_difference": round(effective_home - away_elo, 1),
            "home_advantage_applied": self.home_advantage,
            "home_expected_score": round(home_exp, 4),
            "away_expected_score": round(away_exp, 4),
            "home_elo_source": home_elo_source,
            "away_elo_source": away_elo_source,
        }

        raw: dict = {
            "model_type": "elo",
            "home_elo_raw": home_elo,
            "away_elo_raw": away_elo,
            "effective_home_elo": effective_home,
            "draw_factor": self.draw_factor,
            "k_factor": self.k_factor,
        }

        return ForecastResult(
            home_win_prob=round(home_prob, 6),
            draw_prob=round(draw_prob, 6),
            away_win_prob=round(away_prob, 6),
            predicted_home_score=None,
            predicted_away_score=None,
            confidence=round(confidence, 4),
            confidence_interval=ci,
            explanation_factors=explanation,
            raw_output=raw,
        )

    def train(self, training_data: list[dict]) -> dict:
        """Training is a no-op for the v5 model.

        Historical Elo backfill is owned by
        :class:`app.forecasting.elo_history.EloHistoryService`. Calling
        ``train`` on the model itself is a legacy entry point kept only
        so existing code paths don't crash; it returns a summary dict
        with ``n_matches_processed=0``.
        """
        self._is_trained = True
        return {
            "n_matches_processed": 0,
            "note": "EloModel.train is a no-op in v5; use EloHistoryService.reset_and_backfill instead.",
        }

    # ------------------------------------------------------------------ #
    # Internal maths                                                       #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _expected_scores(
        rating_a: float, rating_b: float
    ) -> tuple[float, float]:
        e_a = 1.0 / (1.0 + 10.0 ** ((rating_b - rating_a) / _ELO_SCALE))
        return e_a, 1.0 - e_a

    def _split_probabilities(
        self, home_exp: float, away_exp: float
    ) -> tuple[float, float, float]:
        delta = abs(home_exp - 0.5)
        draw_prob = self.draw_factor * (1.0 - 2.0 * delta)
        draw_prob = max(0.0, draw_prob)
        residual = 1.0 - draw_prob
        home_prob = residual * home_exp
        away_prob = residual * away_exp
        return self._normalise_probs(home_prob, draw_prob, away_prob)
