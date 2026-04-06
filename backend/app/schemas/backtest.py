"""Schemas for the BacktestRun and BacktestResult resources."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Backtest run schemas
# ---------------------------------------------------------------------------


class BacktestRunCreate(BaseModel):
    """Payload required to initiate a new backtest run."""

    model_version_id: uuid.UUID = Field(
        description="UUID of the model version to evaluate in this backtest."
    )
    name: str = Field(
        max_length=200,
        description=(
            "Human-readable name for this backtest, "
            "e.g. 'Premier League 2023/24 — XGBoost v2'."
        ),
    )
    sport_slug: str = Field(
        max_length=50,
        description="Slug of the sport to backtest against, e.g. 'football'.",
    )
    league_slug: Optional[str] = Field(
        default=None,
        max_length=200,
        description=(
            "Slug of a specific league to restrict the backtest to. "
            "None = all leagues for the sport."
        ),
    )
    start_date: datetime = Field(
        description="Start of the historical window to evaluate (UTC, inclusive)."
    )
    end_date: datetime = Field(
        description="End of the historical window to evaluate (UTC, inclusive)."
    )
    config: Optional[Dict[str, Any]] = Field(
        default=None,
        description=(
            "Additional configuration parameters for the backtest run "
            "(e.g. stake sizing, market filters)."
        ),
    )


class BacktestRunResponse(BaseModel):
    """Representation of a backtest run returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="Unique backtest run identifier (UUID v4).")
    model_version_id: uuid.UUID = Field(
        description="UUID of the model version evaluated."
    )
    name: str = Field(description="Human-readable backtest name.")
    sport_slug: str = Field(description="Sport slug used to filter historical matches.")
    league_slug: Optional[str] = Field(
        default=None,
        description="League slug filter applied (None = all leagues).",
    )
    start_date: datetime = Field(description="Start of the evaluation window (UTC).")
    end_date: datetime = Field(description="End of the evaluation window (UTC).")
    status: str = Field(
        description="Current run status: 'running', 'completed', or 'failed'."
    )
    ran_at: datetime = Field(
        description="Timestamp when the backtest run was executed (UTC)."
    )

    # Aggregate metrics — populated once status = 'completed'
    total_predictions: int = Field(
        default=0,
        ge=0,
        description="Total number of predictions evaluated in this run.",
    )
    accuracy: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Fraction of correctly predicted outcomes.",
    )
    brier_score: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=2.0,
        description="Mean Brier score (lower is better).",
    )
    log_loss: Optional[float] = Field(
        default=None,
        description="Mean log-loss (lower is better).",
    )
    calibration_error: Optional[float] = Field(
        default=None,
        ge=0.0,
        description="Expected Calibration Error (lower is better).",
    )
    config: Optional[Dict[str, Any]] = Field(
        default=None, description="Configuration parameters used for this run."
    )
    summary_metrics: Optional[Dict[str, Any]] = Field(
        default=None,
        description=(
            "Extended summary metrics dictionary (e.g. per-league breakdown, "
            "ROC-AUC, profit simulation results)."
        ),
    )
    created_at: datetime = Field(description="Timestamp when the run record was created (UTC).")
    updated_at: datetime = Field(description="Timestamp of the most recent update (UTC).")


# ---------------------------------------------------------------------------
# Individual backtest result schemas
# ---------------------------------------------------------------------------


class BacktestResultResponse(BaseModel):
    """A single match-level result record from a backtest run."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="Unique result record identifier (UUID v4).")
    backtest_run_id: uuid.UUID = Field(
        description="UUID of the parent backtest run."
    )
    match_id: uuid.UUID = Field(
        description="UUID of the match this result corresponds to."
    )

    # Probabilities assigned by the model
    home_win_prob: float = Field(
        ge=0.0,
        le=1.0,
        description="Model-assigned probability of a home win.",
    )
    draw_prob: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Model-assigned probability of a draw (None for sports without draws).",
    )
    away_win_prob: float = Field(
        ge=0.0,
        le=1.0,
        description="Model-assigned probability of an away win.",
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Model confidence score at the time of prediction.",
    )

    # Outcome
    predicted_outcome: str = Field(
        description="Most likely outcome as predicted by the model: 'home', 'draw', or 'away'."
    )
    actual_outcome: str = Field(
        description="Actual match outcome: 'home', 'draw', or 'away'."
    )
    is_correct: bool = Field(
        description="True when predicted_outcome matches actual_outcome."
    )
    brier_score: float = Field(
        ge=0.0,
        le=2.0,
        description="Brier score for this individual prediction.",
    )

    created_at: datetime = Field(description="Timestamp when the result was recorded (UTC).")
    updated_at: datetime = Field(description="Timestamp of the most recent update (UTC).")
