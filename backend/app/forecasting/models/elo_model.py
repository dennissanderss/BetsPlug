"""Elo-rating based match outcome forecasting model.

The classic Elo system (Arpad Elo, 1978) assigns each team a numerical
rating.  After every match the winner gains points and the loser loses the
same number, so the total number of rating points in the system is conserved.

Expected score formula
----------------------
  E_A = 1 / (1 + 10^((R_B - R_A) / 400))

Win / Draw / Away breakdown
---------------------------
We split the expected score into three outcomes by modelling draws as the
region around 0.5 expected score.  Specifically, if we let δ = E_home - 0.5
(the home team's edge over a coin flip), the three probabilities are:

  P(home_win)  = E_home  × (1 - draw_factor)  +  draw_factor × max(0,  δ)
  P(away_win)  = E_away  × (1 - draw_factor)  +  draw_factor × max(0, -δ)
  P(draw)      = draw_factor × (1 - |δ|)

where *draw_factor* is calibrated per-sport (default 0.28 for football).
"""

from __future__ import annotations

import math
from typing import Optional
from uuid import UUID

from app.forecasting.base_model import ForecastModel, ForecastResult


DEFAULT_ELO = 1500.0
_ELO_SCALE = 400.0          # conventional scale parameter


class EloModel(ForecastModel):
    """Elo-rating forecast model.

    Config keys
    -----------
    k_factor : float
        How quickly ratings change after each match (default 32).
    home_advantage : float
        Elo points added to the home team's effective rating (default 100).
    default_elo : float
        Starting Elo for unseen teams (default 1500).
    draw_factor : float
        Controls how much probability mass lands on draws (default 0.28).
        Higher values produce more draws; set to 0 for win-only sports.
    """

    def __init__(self, model_version_id: UUID, config: dict) -> None:
        super().__init__(model_version_id, config)
        self.k_factor: float = float(config.get("k_factor", 32))
        self.home_advantage: float = float(config.get("home_advantage", 100))
        self.default_elo: float = float(config.get("default_elo", DEFAULT_ELO))
        self.draw_factor: float = float(config.get("draw_factor", 0.28))
        # team_id (str) → current Elo rating
        self.ratings: dict[str, float] = {}

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

    def _seed_elo_from_standings(self, team_id: str, standing: dict | None, total_teams: int) -> float:
        """Derive an initial Elo rating from standings position.

        Position 1 → ~1700 Elo, last place → ~1300 Elo.
        Falls back to default_elo (1500) if no standing is available.
        """
        if standing is None or not standing.get("position"):
            return self.default_elo

        pos = standing["position"]
        n = max(total_teams, 2)
        # Linear interpolation: position 1 = 1700, position n = 1300
        elo = 1700 - (pos - 1) * (400 / (n - 1))

        # Boost based on points and goal difference if available
        points = standing.get("points", 0)
        gd = standing.get("goal_difference", 0)
        elo += gd * 1.5  # Goal difference bonus
        elo += points * 0.5  # Points bonus

        return max(1200, min(1900, elo))

    def predict(self, match_context: dict) -> ForecastResult:
        """Predict match outcome probabilities from Elo ratings.

        Uses standings data to seed initial ratings when no training
        history is available.
        """
        home_id = str(match_context.get("home_team_id", ""))
        away_id = str(match_context.get("away_team_id", ""))
        total_teams = match_context.get("total_teams_in_league", 20)

        # Seed Elo from standings if we don't have trained ratings
        if home_id not in self.ratings:
            self.ratings[home_id] = self._seed_elo_from_standings(
                home_id, match_context.get("home_standing"), total_teams
            )
        if away_id not in self.ratings:
            self.ratings[away_id] = self._seed_elo_from_standings(
                away_id, match_context.get("away_standing"), total_teams
            )

        home_elo = self.get_rating(home_id)
        away_elo = self.get_rating(away_id)

        # Apply home-field advantage to effective ratings
        effective_home = home_elo + self.home_advantage

        home_exp, away_exp = self._expected_scores(effective_home, away_elo)

        home_prob, draw_prob, away_prob = self._split_probabilities(
            home_exp, away_exp
        )

        # Confidence: how far the dominant probability is above random (1/3)
        max_prob = max(home_prob, draw_prob, away_prob)
        confidence = min(1.0, (max_prob - 1 / 3) / (2 / 3))
        confidence = max(0.0, confidence)

        # Simple ±σ confidence interval around the dominant probability
        # Derived from binomial standard deviation: σ = sqrt(p*(1-p)/n)
        # Without n, we use a fixed "effective sample" of 30 matches
        n_effective = 30
        sigma = math.sqrt(max_prob * (1 - max_prob) / n_effective)
        ci = (max(0.0, max_prob - 1.96 * sigma), min(1.0, max_prob + 1.96 * sigma))

        explanation: dict = {
            "home_team": match_context.get("home_team_name", home_id),
            "away_team": match_context.get("away_team_name", away_id),
            "home_elo": round(home_elo, 1),
            "away_elo": round(away_elo, 1),
            "home_elo_with_advantage": round(effective_home, 1),
            "elo_difference": round(effective_home - away_elo, 1),
            "home_advantage_applied": self.home_advantage,
            "home_expected_score": round(home_exp, 4),
            "away_expected_score": round(away_exp, 4),
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
        """Process historical matches in chronological order to build ratings.

        Each item in *training_data* must have:
        * ``home_team_id``, ``away_team_id`` (str / UUID)
        * ``home_score``, ``away_score`` (int / float)

        The list must already be sorted oldest-first.

        Returns
        -------
        dict
            Training metrics including accuracy and average rating.
        """
        correct = 0
        total = 0
        brier_sum = 0.0

        for match in training_data:
            home_id = str(match["home_team_id"])
            away_id = str(match["away_team_id"])
            home_score = int(match["home_score"])
            away_score = int(match["away_score"])

            # Predict before updating
            context = {
                "home_team_id": home_id,
                "away_team_id": away_id,
            }
            result = self.predict(context)

            actual_outcome = self._outcome_from_scores(home_score, away_score)
            predicted_outcome = max(
                ("home", result.home_win_prob),
                ("draw", result.draw_prob),
                ("away", result.away_win_prob),
                key=lambda x: x[1],
            )[0]

            if predicted_outcome == actual_outcome:
                correct += 1

            # Brier score component for the correct outcome
            prob_correct = {
                "home": result.home_win_prob,
                "draw": result.draw_prob,
                "away": result.away_win_prob,
            }[actual_outcome]
            brier_sum += (1 - prob_correct) ** 2
            total += 1

            # Update ratings with actual result
            self.update_ratings(home_id, away_id, home_score, away_score)

        self._is_trained = True

        n = len(self.ratings)
        metrics: dict = {
            "n_matches_processed": total,
            "n_teams": n,
            "accuracy": round(correct / total, 4) if total > 0 else None,
            "brier_score": round(brier_sum / total, 4) if total > 0 else None,
            "avg_rating": round(
                sum(self.ratings.values()) / n, 1
            ) if n > 0 else DEFAULT_ELO,
        }
        return metrics

    # ------------------------------------------------------------------ #
    # Elo core                                                             #
    # ------------------------------------------------------------------ #

    def get_rating(self, team_id: str) -> float:
        """Return the current Elo rating for *team_id*, defaulting to 1500."""
        return self.ratings.get(team_id, self.default_elo)

    def set_rating(self, team_id: str, rating: float) -> None:
        self.ratings[team_id] = rating

    def update_ratings(
        self,
        home_id: str,
        away_id: str,
        home_score: int,
        away_score: int,
    ) -> tuple[float, float]:
        """Update Elo ratings after a completed match.

        Returns the new (home_elo, away_elo) tuple.
        """
        home_elo = self.get_rating(home_id)
        away_elo = self.get_rating(away_id)

        effective_home = home_elo + self.home_advantage
        home_exp, away_exp = self._expected_scores(effective_home, away_elo)

        # Actual score: 1 for win, 0.5 for draw, 0 for loss
        if home_score > away_score:
            home_actual, away_actual = 1.0, 0.0
        elif home_score < away_score:
            home_actual, away_actual = 0.0, 1.0
        else:
            home_actual, away_actual = 0.5, 0.5

        new_home_elo = home_elo + self.k_factor * (home_actual - home_exp)
        new_away_elo = away_elo + self.k_factor * (away_actual - away_exp)

        self.ratings[home_id] = new_home_elo
        self.ratings[away_id] = new_away_elo

        return new_home_elo, new_away_elo

    # ------------------------------------------------------------------ #
    # Internal maths                                                       #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _expected_scores(rating_a: float, rating_b: float) -> tuple[float, float]:
        """Return (E_A, E_B) expected scores using the standard Elo formula."""
        e_a = 1.0 / (1.0 + 10.0 ** ((rating_b - rating_a) / _ELO_SCALE))
        e_b = 1.0 - e_a
        return e_a, e_b

    def _split_probabilities(
        self, home_exp: float, away_exp: float
    ) -> tuple[float, float, float]:
        """Convert expected scores to (P_home, P_draw, P_away).

        Strategy
        --------
        The expected score E_home lies in (0, 1).  Values near 0.5 indicate
        closely matched teams and produce more draws.  Values far from 0.5
        produce decisive outcomes.

        We model:
          draw_prob   = draw_factor * (1 - |delta|)   where delta = home_exp - 0.5
          residual    = 1 - draw_prob
          home_prob   = residual * home_exp
          away_prob   = residual * away_exp
        """
        delta = abs(home_exp - 0.5)
        draw_prob = self.draw_factor * (1.0 - 2.0 * delta)
        draw_prob = max(0.0, draw_prob)
        residual = 1.0 - draw_prob
        home_prob = residual * home_exp
        away_prob = residual * away_exp
        # Normalise to guard against floating-point drift
        return self._normalise_probs(home_prob, draw_prob, away_prob)
