"""Abstract base class and shared data structures for all forecast models."""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional
from uuid import UUID


@dataclass
class ForecastResult:
    """Immutable result returned by every ForecastModel.predict() call.

    Probabilities must sum to 1.0 (±floating-point tolerance).

    Attributes
    ----------
    home_win_prob:
        Probability that the home team wins (0–1).
    draw_prob:
        Probability of a draw (0–1).  For sports without draws, set to 0.0.
    away_win_prob:
        Probability that the away team wins (0–1).
    predicted_home_score:
        Expected goals / points for the home team.  None if the model does
        not produce score predictions.
    predicted_away_score:
        Expected goals / points for the away team.
    confidence:
        Overall model confidence in [0, 1].  Derived from the maximum
        probability or model-specific calibration.
    confidence_interval:
        Two-element tuple (low, high) for the dominant outcome probability,
        e.g. (0.42, 0.58).  None when not computed.
    explanation_factors:
        Human-readable key→value mapping describing the most important
        inputs to the prediction, e.g. ``{"home_elo": 1620, ...}``.
    raw_output:
        Full internal state / intermediate values for logging and debugging.
        Serialisable to JSON (values must be Python primitives / lists /
        dicts).
    """

    home_win_prob: float
    draw_prob: float
    away_win_prob: float

    predicted_home_score: Optional[float] = None
    predicted_away_score: Optional[float] = None

    confidence: float = 0.0
    confidence_interval: Optional[tuple[float, float]] = None

    explanation_factors: dict = field(default_factory=dict)
    raw_output: dict = field(default_factory=dict)

    # ------------------------------------------------------------------ #
    # Validation helpers                                                   #
    # ------------------------------------------------------------------ #

    def __post_init__(self) -> None:
        total = self.home_win_prob + self.draw_prob + self.away_win_prob
        if abs(total - 1.0) > 1e-4:
            raise ValueError(
                f"Probabilities must sum to 1.0, got {total:.6f}. "
                f"(H={self.home_win_prob}, D={self.draw_prob}, A={self.away_win_prob})"
            )
        for name, val in [
            ("home_win_prob", self.home_win_prob),
            ("draw_prob", self.draw_prob),
            ("away_win_prob", self.away_win_prob),
            ("confidence", self.confidence),
        ]:
            if not (0.0 <= val <= 1.0):
                raise ValueError(f"{name} must be in [0, 1], got {val}")

    def to_dict(self) -> dict:
        """Serialise to a JSON-compatible dict."""
        return {
            "home_win_prob": self.home_win_prob,
            "draw_prob": self.draw_prob,
            "away_win_prob": self.away_win_prob,
            "predicted_home_score": self.predicted_home_score,
            "predicted_away_score": self.predicted_away_score,
            "confidence": self.confidence,
            "confidence_interval": list(self.confidence_interval)
            if self.confidence_interval
            else None,
            "explanation_factors": self.explanation_factors,
            "raw_output": self.raw_output,
        }


class ForecastModel(ABC):
    """Abstract base class that every forecast model must implement.

    Parameters
    ----------
    model_version_id:
        UUID of the ``ModelVersion`` database row that this instance
        corresponds to.
    config:
        Hyper-parameter / configuration dictionary sourced from
        ``ModelVersion.hyperparameters``.
    """

    def __init__(self, model_version_id: UUID, config: dict) -> None:
        self.model_version_id: UUID = model_version_id
        self.config: dict = config or {}
        self._is_trained: bool = False

    # ------------------------------------------------------------------ #
    # Abstract interface                                                   #
    # ------------------------------------------------------------------ #

    @abstractmethod
    def predict(self, match_context: dict) -> ForecastResult:
        """Produce a probability forecast for a single match.

        Parameters
        ----------
        match_context:
            Rich context dict built by ``ForecastService.build_match_context``.
            Expected keys (all optional – models must handle missing data
            gracefully):

            * ``home_team_id``, ``away_team_id`` – UUID strings
            * ``home_team_name``, ``away_team_name`` – display names
            * ``home_form`` – list of last-N result dicts
            * ``away_form`` – list of last-N result dicts
            * ``h2h_matches`` – list of head-to-head result dicts
            * ``home_stats``, ``away_stats`` – season-level aggregates
            * ``home_standing``, ``away_standing`` – current league position
            * ``league_avg_goals`` – float, league average goals per game

        Returns
        -------
        ForecastResult
        """

    @abstractmethod
    def train(self, training_data: list[dict]) -> dict:
        """Fit / calibrate the model on historical match data.

        Parameters
        ----------
        training_data:
            List of dicts, each representing a completed match.  Expected
            keys: ``home_team_id``, ``away_team_id``, ``home_score``,
            ``away_score``, plus any feature keys the model requires.

        Returns
        -------
        dict
            Training metrics, e.g.
            ``{"accuracy": 0.52, "brier_score": 0.21, "n_samples": 1200}``.
        """

    @abstractmethod
    def get_feature_names(self) -> list[str]:
        """Return the ordered list of feature names used by this model."""

    # ------------------------------------------------------------------ #
    # Shared utilities                                                     #
    # ------------------------------------------------------------------ #

    @property
    def is_trained(self) -> bool:
        return self._is_trained

    @staticmethod
    def _normalise_probs(home: float, draw: float, away: float) -> tuple[float, float, float]:
        """Normalise three non-negative floats so they sum to 1."""
        total = home + draw + away
        if total <= 0:
            # Uniform fallback
            return 1 / 3, 1 / 3, 1 / 3
        return home / total, draw / total, away / total

    @staticmethod
    def _outcome_from_scores(home_score: int, away_score: int) -> str:
        """Return 'home', 'draw', or 'away'."""
        if home_score > away_score:
            return "home"
        if home_score < away_score:
            return "away"
        return "draw"

    @staticmethod
    def _compute_form_points(results: list[dict], team_id: str) -> list[float]:
        """Convert a list of result dicts to a points sequence (3/1/0).

        Each dict should have ``home_team_id``, ``away_team_id``,
        ``home_score``, ``away_score``.
        """
        points: list[float] = []
        for r in results:
            h_id = str(r.get("home_team_id", ""))
            a_id = str(r.get("away_team_id", ""))
            hs = r.get("home_score", 0)
            aws = r.get("away_score", 0)
            if str(team_id) == h_id:
                if hs > aws:
                    points.append(3.0)
                elif hs == aws:
                    points.append(1.0)
                else:
                    points.append(0.0)
            elif str(team_id) == a_id:
                if aws > hs:
                    points.append(3.0)
                elif aws == hs:
                    points.append(1.0)
                else:
                    points.append(0.0)
        return points

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}("
            f"model_version_id={self.model_version_id}, "
            f"trained={self._is_trained})"
        )
