"""Poisson-based score prediction model.

Theory
------
The Dixon-Coles (1997) approach models the number of goals scored by each
team in a match as independent Poisson random variables:

  X_home ~ Poisson(λ_home)
  X_away ~ Poisson(λ_away)

where the expected goal rates (λ) are decomposed into:

  λ_home = attack_home × defence_away × league_avg_home × home_adv
  λ_away = attack_away × defence_home × league_avg_away

``attack`` and ``defence`` are team-level multiplicative factors relative to
the league average (so a team with attack_strength = 1.2 scores 20 % more
than average).

Score probabilities are computed over a grid of 0…MAX_GOALS for each team.
These are then summed to produce 1X2 outcome probabilities.
"""

from __future__ import annotations

import math
from collections import defaultdict
from typing import Optional
from uuid import UUID

import numpy as np
from scipy.stats import poisson

from app.forecasting.base_model import ForecastModel, ForecastResult

# Maximum number of goals considered per team in the probability grid
MAX_GOALS = 7
# Clip lambda to avoid numerical issues
_MIN_LAMBDA = 0.1
_MAX_LAMBDA = 10.0


class PoissonModel(ForecastModel):
    """Poisson goal-model forecast.

    Config keys
    -----------
    home_advantage : float
        Multiplicative boost to λ_home (default 1.15 ≈ +15 % expected goals).
    league_avg_home : float
        Default league-average home goals if not in training data (default 1.5).
    league_avg_away : float
        Default league-average away goals (default 1.2).
    max_goals : int
        Upper bound of goal grid (default 7).
    """

    def __init__(self, model_version_id: UUID, config: dict) -> None:
        super().__init__(model_version_id, config)
        self.home_advantage: float = float(config.get("home_advantage", 1.15))
        self.default_league_avg_home: float = float(config.get("league_avg_home", 1.5))
        self.default_league_avg_away: float = float(config.get("league_avg_away", 1.2))
        self.max_goals: int = int(config.get("max_goals", MAX_GOALS))

        # Populated by train()
        # team_id → multiplicative attack rating (1.0 = league average)
        self.attack_ratings: dict[str, float] = {}
        # team_id → multiplicative defence rating (< 1.0 = strong defence)
        self.defence_ratings: dict[str, float] = {}
        self.league_avg_home: float = self.default_league_avg_home
        self.league_avg_away: float = self.default_league_avg_away

    # ------------------------------------------------------------------ #
    # ForecastModel interface                                              #
    # ------------------------------------------------------------------ #

    def get_feature_names(self) -> list[str]:
        return [
            "home_attack_strength",
            "home_defence_strength",
            "away_attack_strength",
            "away_defence_strength",
            "lambda_home",
            "lambda_away",
            "league_avg_home",
            "league_avg_away",
            "home_advantage_factor",
        ]

    def predict(self, match_context: dict) -> ForecastResult:
        """Compute 1X2 probabilities via a Poisson goal grid.

        Parameters
        ----------
        match_context:
            Expects ``home_team_id``, ``away_team_id`` (str / UUID).
            Optionally ``league_avg_goals`` to override the league average.
        """
        home_id = str(match_context.get("home_team_id", ""))
        away_id = str(match_context.get("away_team_id", ""))

        # Override league averages from context if available
        league_avg = float(match_context.get("league_avg_goals", 0.0))
        if league_avg > 0:
            # Assume ~55 % of goals are scored at home
            league_avg_home = league_avg * 0.55
            league_avg_away = league_avg * 0.45
        else:
            league_avg_home = self.league_avg_home
            league_avg_away = self.league_avg_away

        home_atk = self.attack_ratings.get(home_id, None)
        home_def = self.defence_ratings.get(home_id, None)
        away_atk = self.attack_ratings.get(away_id, None)
        away_def = self.defence_ratings.get(away_id, None)

        # Seed from team seeds / standings / stats if no trained ratings
        if home_atk is None:
            home_atk, home_def = self._seed_from_context(
                str(match_context.get("home_team_name", "")),
                match_context.get("home_standing"),
                match_context.get("home_stats"),
                match_context.get("total_teams_in_league", 20),
            )
        if away_atk is None:
            away_atk, away_def = self._seed_from_context(
                str(match_context.get("away_team_name", "")),
                match_context.get("away_standing"),
                match_context.get("away_stats"),
                match_context.get("total_teams_in_league", 20),
            )

        lambda_home = np.clip(
            home_atk * away_def * league_avg_home * self.home_advantage,
            _MIN_LAMBDA,
            _MAX_LAMBDA,
        )
        lambda_away = np.clip(
            away_atk * home_def * league_avg_away,
            _MIN_LAMBDA,
            _MAX_LAMBDA,
        )

        home_prob, draw_prob, away_prob, score_matrix = self._poisson_grid(
            float(lambda_home), float(lambda_away)
        )

        # Most-likely scoreline
        flat_idx = int(np.argmax(score_matrix))
        ml_home, ml_away = divmod(flat_idx, self.max_goals + 1)

        max_prob = max(home_prob, draw_prob, away_prob)
        confidence = min(1.0, max(0.0, (max_prob - 1 / 3) / (2 / 3)))

        n_eff = 30
        sigma = math.sqrt(max_prob * (1 - max_prob) / n_eff)
        ci = (max(0.0, max_prob - 1.96 * sigma), min(1.0, max_prob + 1.96 * sigma))

        explanation: dict = {
            "home_team": match_context.get("home_team_name", home_id),
            "away_team": match_context.get("away_team_name", away_id),
            "home_attack_strength": round(home_atk, 4),
            "home_defence_strength": round(home_def, 4),
            "away_attack_strength": round(away_atk, 4),
            "away_defence_strength": round(away_def, 4),
            "lambda_home": round(float(lambda_home), 4),
            "lambda_away": round(float(lambda_away), 4),
            "home_advantage_factor": self.home_advantage,
            "most_likely_score": f"{ml_home}-{ml_away}",
            "most_likely_score_prob": round(float(score_matrix[ml_home, ml_away]), 4),
        }

        raw: dict = {
            "model_type": "poisson",
            "lambda_home": float(lambda_home),
            "lambda_away": float(lambda_away),
            "league_avg_home": league_avg_home,
            "league_avg_away": league_avg_away,
            "max_goals_grid": self.max_goals,
        }

        return ForecastResult(
            home_win_prob=round(home_prob, 6),
            draw_prob=round(draw_prob, 6),
            away_win_prob=round(away_prob, 6),
            predicted_home_score=round(float(lambda_home), 3),
            predicted_away_score=round(float(lambda_away), 3),
            confidence=round(confidence, 4),
            confidence_interval=ci,
            explanation_factors=explanation,
            raw_output=raw,
        )

    def train(self, training_data: list[dict]) -> dict:
        """Compute attack and defence ratings from historical data.

        Uses iterative proportional fitting (a simplified Dixon-Coles
        approach without the low-scoring correction).

        Each match dict must have:
        * ``home_team_id``, ``away_team_id``
        * ``home_score``, ``away_score``
        """
        if not training_data:
            self._is_trained = True
            return {"n_matches": 0}

        # Aggregate raw goal data per team
        home_goals_scored: dict[str, list[float]] = defaultdict(list)
        home_goals_conceded: dict[str, list[float]] = defaultdict(list)
        away_goals_scored: dict[str, list[float]] = defaultdict(list)
        away_goals_conceded: dict[str, list[float]] = defaultdict(list)

        total_home_goals = 0
        total_away_goals = 0

        for m in training_data:
            h_id = str(m["home_team_id"])
            a_id = str(m["away_team_id"])
            hs = float(m["home_score"])
            aws = float(m["away_score"])

            home_goals_scored[h_id].append(hs)
            home_goals_conceded[h_id].append(aws)
            away_goals_scored[a_id].append(aws)
            away_goals_conceded[a_id].append(hs)
            total_home_goals += hs
            total_away_goals += aws

        n = len(training_data)
        self.league_avg_home = total_home_goals / n if n > 0 else self.default_league_avg_home
        self.league_avg_away = total_away_goals / n if n > 0 else self.default_league_avg_away

        all_team_ids = set(home_goals_scored) | set(away_goals_scored)

        # ---- Iterative proportional fitting --------------------------------
        # Initialise all factors to 1.0
        attack: dict[str, float] = {t: 1.0 for t in all_team_ids}
        defence: dict[str, float] = {t: 1.0 for t in all_team_ids}

        for _ in range(50):  # iterate to convergence
            new_attack: dict[str, float] = {}
            new_defence: dict[str, float] = {}

            for t in all_team_ids:
                # Attack rating: actual home goals / expected home goals (based on opponent defence)
                # Simplified: attack_t = avg(home_goals_scored_t) / league_avg_home
                avg_scored_home = (
                    sum(home_goals_scored[t]) / len(home_goals_scored[t])
                    if home_goals_scored[t]
                    else self.league_avg_home
                )
                avg_scored_away = (
                    sum(away_goals_scored[t]) / len(away_goals_scored[t])
                    if away_goals_scored[t]
                    else self.league_avg_away
                )
                # Combine home and away attack, normalised to league averages
                if self.league_avg_home > 0 and self.league_avg_away > 0:
                    atk = (
                        avg_scored_home / self.league_avg_home
                        + avg_scored_away / self.league_avg_away
                    ) / 2
                else:
                    atk = 1.0
                new_attack[t] = max(0.2, min(3.0, atk))

                # Defence rating: league_avg / actual_conceded  (lower is better)
                avg_conceded_home = (
                    sum(home_goals_conceded[t]) / len(home_goals_conceded[t])
                    if home_goals_conceded[t]
                    else self.league_avg_away
                )
                avg_conceded_away = (
                    sum(away_goals_conceded[t]) / len(away_goals_conceded[t])
                    if away_goals_conceded[t]
                    else self.league_avg_home
                )
                if avg_conceded_home > 0 and avg_conceded_away > 0:
                    def_rating = (
                        self.league_avg_away / avg_conceded_home
                        + self.league_avg_home / avg_conceded_away
                    ) / 2
                else:
                    def_rating = 1.0
                new_defence[t] = max(0.2, min(3.0, def_rating))

            attack = new_attack
            defence = new_defence

        # Normalise so the mean of each factor equals 1.0
        if attack:
            atk_mean = sum(attack.values()) / len(attack)
            attack = {t: v / atk_mean for t, v in attack.items()}
        if defence:
            def_mean = sum(defence.values()) / len(defence)
            defence = {t: v / def_mean for t, v in defence.items()}

        self.attack_ratings = attack
        self.defence_ratings = defence
        self._is_trained = True

        # Evaluate on training set
        correct, brier_sum = 0, 0.0
        for m in training_data:
            res = self.predict({
                "home_team_id": m["home_team_id"],
                "away_team_id": m["away_team_id"],
            })
            actual = self._outcome_from_scores(int(m["home_score"]), int(m["away_score"]))
            predicted = max(
                ("home", res.home_win_prob),
                ("draw", res.draw_prob),
                ("away", res.away_win_prob),
                key=lambda x: x[1],
            )[0]
            if predicted == actual:
                correct += 1
            brier_sum += (
                1 - {"home": res.home_win_prob, "draw": res.draw_prob, "away": res.away_win_prob}[actual]
            ) ** 2

        return {
            "n_matches": n,
            "n_teams": len(all_team_ids),
            "league_avg_home": round(self.league_avg_home, 4),
            "league_avg_away": round(self.league_avg_away, 4),
            "accuracy": round(correct / n, 4) if n > 0 else None,
            "brier_score": round(brier_sum / n, 4) if n > 0 else None,
        }

    # ------------------------------------------------------------------ #
    # Poisson grid computation                                             #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _seed_from_context(
        team_name: str,
        standing: dict | None,
        stats: dict | None,
        total_teams: int,
    ) -> tuple[float, float]:
        """Derive attack/defence ratings from seed data, standings, or stats.

        Returns (attack_rating, defence_rating) where 1.0 = league average.
        """
        # Try hardcoded seed Elo first → derive attack/defence from it
        from app.forecasting.team_seeds import get_seed_elo
        slug = team_name.lower().replace(" ", "-")
        seed_elo = get_seed_elo(slug)
        if seed_elo is not None:
            # Convert Elo (1200-1800) to attack/defence ratings
            # 1500 = 1.0/1.0, 1800 = 1.5/0.6, 1200 = 0.6/1.5
            strength = (seed_elo - 1500) / 300  # -1.0 to +1.0
            atk = 1.0 + strength * 0.5   # 0.5 to 1.5
            dfc = 1.0 - strength * 0.4   # 1.4 to 0.6
            return max(0.4, min(2.0, atk)), max(0.4, min(2.0, dfc))

        atk = 1.0
        dfc = 1.0

        if stats and stats.get("matches_played", 0) > 0:
            mp = stats["matches_played"]
            gf = stats.get("goals_scored", 0)
            ga = stats.get("goals_conceded", 0)
            # Avg goals per game relative to ~1.35 (typical league avg per team)
            atk = max(0.5, min(2.0, (gf / mp) / 1.35))
            dfc = max(0.5, min(2.0, (ga / mp) / 1.35))
            return atk, dfc

        if standing and standing.get("position"):
            pos = standing["position"]
            n = max(total_teams, 2)
            # Position 1 → atk=1.4, def=0.7 | Last → atk=0.7, def=1.4
            rank_factor = (pos - 1) / (n - 1)  # 0.0 (top) → 1.0 (bottom)
            atk = 1.4 - rank_factor * 0.7   # 1.4 → 0.7
            dfc = 0.7 + rank_factor * 0.7   # 0.7 → 1.4

            # Use goal difference for fine-tuning
            gd = standing.get("goal_difference", 0)
            atk += gd * 0.005
            dfc -= gd * 0.003

            atk = max(0.4, min(2.0, atk))
            dfc = max(0.4, min(2.0, dfc))

        return atk, dfc

    def _poisson_grid(
        self, lambda_home: float, lambda_away: float
    ) -> tuple[float, float, float, np.ndarray]:
        """Compute P(home win), P(draw), P(away win) and the score matrix.

        Returns
        -------
        home_prob, draw_prob, away_prob : float
        score_matrix : ndarray of shape (max_goals+1, max_goals+1)
            score_matrix[i, j] = P(home scores i, away scores j)
        """
        g = self.max_goals
        score_matrix = np.zeros((g + 1, g + 1))

        home_pmf = poisson.pmf(np.arange(g + 1), lambda_home)
        away_pmf = poisson.pmf(np.arange(g + 1), lambda_away)

        # Outer product gives joint probability
        score_matrix = np.outer(home_pmf, away_pmf)

        # Ensure everything sums to 1 by accounting for truncated tail
        tail_mass = 1.0 - score_matrix.sum()
        # Distribute tail mass proportionally (small correction)
        if score_matrix.sum() > 0:
            score_matrix = score_matrix / score_matrix.sum()

        # Mask for outcomes
        home_mask = np.tril(np.ones((g + 1, g + 1)), k=-1)   # home_goals > away_goals → lower triangle
        away_mask = np.triu(np.ones((g + 1, g + 1)), k=1)    # away_goals > home_goals → upper triangle
        draw_mask = np.eye(g + 1)

        home_prob = float(np.sum(score_matrix * home_mask))
        draw_prob = float(np.sum(score_matrix * draw_mask))
        away_prob = float(np.sum(score_matrix * away_mask))

        # Normalise to remove floating-point drift
        home_prob, draw_prob, away_prob = self._normalise_probs(
            home_prob, draw_prob, away_prob
        )
        return home_prob, draw_prob, away_prob, score_matrix
