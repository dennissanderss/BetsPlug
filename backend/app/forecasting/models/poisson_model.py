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

        **v5 rebuild:** This used to call ``_seed_from_context`` which
        in turn called ``team_seeds.get_seed_elo`` — a now-deprecated
        function that raises ``NotImplementedError``. That meant every
        Poisson ``predict`` call was silently crashing inside the
        ensemble's per-sub-model try/except, and the "ensemble"
        effectively became a pure Elo model. This version reads the
        same point-in-time ``home_form`` / ``away_form`` data the
        LogisticModel uses (provided by
        ``ForecastService.build_match_context`` with a strict
        ``before=scheduled_at`` filter) and derives attack/defence
        strengths on the fly. No history table, no seeds, no leakage.
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

        # Derive from point-in-time form data if no trained ratings.
        # ``home_form`` / ``away_form`` are lists of the last N finished
        # matches BEFORE the fixture's kickoff, already filtered by
        # ForecastService._get_team_form.
        if home_atk is None or home_def is None:
            home_atk, home_def = self._strength_from_form(
                form=match_context.get("home_form") or [],
                team_id=home_id,
                league_avg_home=league_avg_home,
                league_avg_away=league_avg_away,
            )
        if away_atk is None or away_def is None:
            away_atk, away_def = self._strength_from_form(
                form=match_context.get("away_form") or [],
                team_id=away_id,
                league_avg_home=league_avg_home,
                league_avg_away=league_avg_away,
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
    def _strength_from_form(
        form: list[dict],
        team_id: str,
        league_avg_home: float,
        league_avg_away: float,
    ) -> tuple[float, float]:
        """Derive (attack, defence) multipliers using the Dixon-Coles-
        style decomposition from the team's recent form.

        Unlike the v5.0 baseline which just averaged all matches,
        this splits each team's history into HOME games and AWAY
        games and normalises each side against the appropriate
        league average (``league_avg_home`` / ``league_avg_away``).
        This matters because teams score systematically more at home
        than away, and the Poisson lambda formula bakes in separate
        home/away league averages — so the team strength factor
        should be in the same normalisation.

        Output:
          - attack multiplier: 1.0 = league average. >1 = better than
            average at scoring (blended home + away).
          - defence multiplier: <1.0 = better than average at keeping
            goals out (blended home + away).

        No leakage: ``form`` only contains matches with kickoff
        strictly before the fixture we're predicting (enforced by
        ``ForecastService._get_team_form``).
        """
        if not form or not team_id:
            return 1.0, 1.0

        home_scored: list[float] = []
        home_conceded: list[float] = []
        away_scored: list[float] = []
        away_conceded: list[float] = []
        for m in form:
            hid = str(m.get("home_team_id", ""))
            aid = str(m.get("away_team_id", ""))
            try:
                hs = float(m.get("home_score") or 0)
                aws = float(m.get("away_score") or 0)
            except (TypeError, ValueError):
                continue
            if hid == team_id:
                # Team was at home
                home_scored.append(hs)
                home_conceded.append(aws)
            elif aid == team_id:
                # Team was away
                away_scored.append(aws)
                away_conceded.append(hs)

        n_home = len(home_scored)
        n_away = len(away_scored)
        if n_home + n_away == 0:
            return 1.0, 1.0

        avg_h_home = max(0.4, league_avg_home)
        avg_h_away = max(0.3, league_avg_away)

        # Attack: how much more than league-average does this team score
        # in each venue, weighted by sample size from that venue.
        atk_home_factor = (
            (sum(home_scored) / n_home) / avg_h_home if n_home else 1.0
        )
        atk_away_factor = (
            (sum(away_scored) / n_away) / avg_h_away if n_away else 1.0
        )
        if n_home and n_away:
            atk = (n_home * atk_home_factor + n_away * atk_away_factor) / (n_home + n_away)
        else:
            atk = atk_home_factor if n_home else atk_away_factor

        # Defence: how much more than league-average does this team
        # CONCEDE in each venue. Note: when we were AWAY, the "home
        # side's" goals are scored at their home ground → compared
        # against avg_h_home. When we were HOME, the opposing team
        # scored as an away side → compared against avg_h_away.
        def_home_factor = (
            (sum(home_conceded) / n_home) / avg_h_away if n_home else 1.0
        )
        def_away_factor = (
            (sum(away_conceded) / n_away) / avg_h_home if n_away else 1.0
        )
        if n_home and n_away:
            dfc = (n_home * def_home_factor + n_away * def_away_factor) / (n_home + n_away)
        else:
            dfc = def_home_factor if n_home else def_away_factor

        return max(0.4, min(2.5, atk)), max(0.4, min(2.5, dfc))

    # Legacy entry point kept as a thin shim so any external caller
    # that still reaches for ``_seed_from_context`` gets a sane answer
    # instead of a NotImplementedError from the deprecated team_seeds.
    @staticmethod
    def _seed_from_context(
        team_name: str,
        standing: dict | None,
        stats: dict | None,
        total_teams: int,
    ) -> tuple[float, float]:
        # Stats / standings are present-day aggregates (potentially
        # leaky), but they're our only fallback if the caller doesn't
        # supply form data. Prefer stats if available.
        if stats and stats.get("matches_played", 0) > 0:
            mp = float(stats["matches_played"])
            gf = float(stats.get("goals_scored", 0) or 0)
            ga = float(stats.get("goals_conceded", 0) or 0)
            atk = max(0.5, min(2.0, (gf / mp) / 1.35))
            dfc = max(0.5, min(2.0, (ga / mp) / 1.35))
            return atk, dfc
        if standing and standing.get("position"):
            pos = float(standing["position"])
            n = max(float(total_teams or 20), 2)
            rank_factor = (pos - 1) / (n - 1)
            atk = max(0.4, min(2.0, 1.4 - rank_factor * 0.7))
            dfc = max(0.4, min(2.0, 0.7 + rank_factor * 0.7))
            return atk, dfc
        return 1.0, 1.0

    def _poisson_grid(
        self, lambda_home: float, lambda_away: float
    ) -> tuple[float, float, float, np.ndarray]:
        """Compute P(home win), P(draw), P(away win) and the score matrix.

        **v5.1 (Dixon-Coles low-score correction)**: pure independent
        Poisson underestimates 0-0 / 1-1 / 1-0 / 0-1 scorelines
        because real football goals are weakly correlated in low-
        scoring games. Dixon & Coles (1997) proposed a multiplicative
        correction ``τ(i, j; λ_home, λ_away, ρ)`` that only affects
        the four cells below:

            τ(0, 0) = 1 - λ_home × λ_away × ρ
            τ(1, 0) = 1 + λ_away × ρ
            τ(0, 1) = 1 + λ_home × ρ
            τ(1, 1) = 1 - ρ
            τ(i, j) = 1 for all other (i, j)

        where ρ ≈ -0.15 is a constant calibrated from European top-
        five data. We apply it, then re-normalise the grid so it
        still sums to 1. The corrected grid nudges ~2-3 pp of mass
        toward draws (mostly 1-1), which matches the empirical
        draw rate in European football.

        Returns
        -------
        home_prob, draw_prob, away_prob : float
        score_matrix : ndarray of shape (max_goals+1, max_goals+1)
            score_matrix[i, j] = P(home scores i, away scores j)
        """
        g = self.max_goals

        home_pmf = poisson.pmf(np.arange(g + 1), lambda_home)
        away_pmf = poisson.pmf(np.arange(g + 1), lambda_away)

        # Independent Poisson outer product
        score_matrix = np.outer(home_pmf, away_pmf)

        # Dixon-Coles low-score correction (applied only to cells where
        # both teams score 0 or 1 — those are the low-scoring games
        # where goals are empirically correlated).
        rho = -0.15  # calibrated from European top-5, 2020-2024
        score_matrix[0, 0] *= 1 - lambda_home * lambda_away * rho
        score_matrix[1, 0] *= 1 + lambda_away * rho
        score_matrix[0, 1] *= 1 + lambda_home * rho
        score_matrix[1, 1] *= 1 - rho

        # Re-normalise so the grid sums to 1 (removes tail mass + DC drift).
        if score_matrix.sum() > 0:
            score_matrix = score_matrix / score_matrix.sum()

        # Outcome masks
        home_mask = np.tril(np.ones((g + 1, g + 1)), k=-1)
        away_mask = np.triu(np.ones((g + 1, g + 1)), k=1)
        draw_mask = np.eye(g + 1)

        home_prob = float(np.sum(score_matrix * home_mask))
        draw_prob = float(np.sum(score_matrix * draw_mask))
        away_prob = float(np.sum(score_matrix * away_mask))

        # Normalise to remove floating-point drift
        home_prob, draw_prob, away_prob = self._normalise_probs(
            home_prob, draw_prob, away_prob
        )
        return home_prob, draw_prob, away_prob, score_matrix
