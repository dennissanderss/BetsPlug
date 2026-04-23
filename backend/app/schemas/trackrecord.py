"""Schemas for model track-record, calibration, and segment performance reporting."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class TierBreakdown(BaseModel):
    """Per-pick-tier slice of an aggregate metric."""
    model_config = ConfigDict(from_attributes=True)
    total: int = Field(ge=0)
    correct: int = Field(ge=0)
    accuracy: float = Field(ge=0.0, le=1.0)
    wilson_ci_low: Optional[float] = Field(
        default=None, ge=0.0, le=1.0,
        description="Wilson 95% confidence interval lower bound.",
    )
    wilson_ci_high: Optional[float] = Field(
        default=None, ge=0.0, le=1.0,
        description="Wilson 95% confidence interval upper bound.",
    )


class TrackrecordSummary(BaseModel):
    """
    Aggregate performance metrics for a model version or filtered prediction set.

    All metrics are computed over predictions that have been evaluated
    (i.e., the corresponding match has finished).
    """

    model_config = ConfigDict(from_attributes=True)

    model_version_id: Optional[uuid.UUID] = Field(
        default=None,
        description="UUID of the model version these metrics belong to. None = all versions.",
    )
    model_version_label: Optional[str] = Field(
        default=None,
        description="Human-readable model version label, e.g. 'v2.3.1'.",
    )

    # Volume
    total_predictions: int = Field(
        ge=0,
        description="Total number of evaluated predictions included in this summary.",
    )
    correct_predictions: int = Field(
        ge=0,
        description="Number of predictions where the predicted outcome matched actuals.",
    )

    # Core accuracy metric
    accuracy: float = Field(
        ge=0.0,
        le=1.0,
        description=(
            "Fraction of predictions that were correct (correct / total). "
            "Higher is better; random baseline ≈ 0.45 for 3-way outcomes."
        ),
    )
    wilson_ci_low: Optional[float] = Field(
        default=None, ge=0.0, le=1.0,
        description="Wilson 95% confidence interval lower bound on accuracy.",
    )
    wilson_ci_high: Optional[float] = Field(
        default=None, ge=0.0, le=1.0,
        description="Wilson 95% confidence interval upper bound on accuracy.",
    )

    # Probabilistic scoring rules
    brier_score: float = Field(
        ge=0.0,
        le=2.0,
        description=(
            "Mean Brier score across all evaluated predictions. "
            "Lower is better; perfect calibration = 0, random ≈ 0.67."
        ),
    )
    log_loss: Optional[float] = Field(
        default=None,
        description=(
            "Mean log-loss (cross-entropy) across all evaluated predictions. "
            "Lower is better."
        ),
    )

    # Confidence
    avg_confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Mean model confidence score across all evaluated predictions.",
    )

    # Calibration
    calibration_error: Optional[float] = Field(
        default=None,
        ge=0.0,
        description=(
            "Expected Calibration Error (ECE). "
            "Measures how well predicted probabilities align with observed frequencies. "
            "Lower is better; 0 = perfectly calibrated."
        ),
    )

    # Time window
    period_start: Optional[datetime] = Field(
        default=None,
        description="Earliest prediction timestamp included in this summary (UTC).",
    )
    period_end: Optional[datetime] = Field(
        default=None,
        description="Latest prediction timestamp included in this summary (UTC).",
    )

    # v8.1 tier system — breakdown by pick_tier (only populated when enabled)
    per_tier: Optional[Dict[str, TierBreakdown]] = Field(
        default=None,
        description=(
            "Breakdown of totals/accuracy per pick_tier (platinum/gold/silver/free). "
            "Tiers with zero samples in user's access scope are omitted. "
            "Present only when TIER_SYSTEM_ENABLED."
        ),
    )


class SegmentPerformance(BaseModel):
    """
    Performance breakdown for a specific segment, e.g. a league, sport, or time window.
    """

    model_config = ConfigDict(from_attributes=True)

    segment_type: str = Field(
        description="The dimension used to slice predictions, e.g. 'league', 'sport', 'month'.",
    )
    segment_value: str = Field(
        description="The specific value of the segment, e.g. 'Premier League', '2024-11'.",
    )
    total_predictions: int = Field(ge=0, description="Predictions evaluated in this segment.")
    accuracy: float = Field(
        ge=0.0,
        le=1.0,
        description="Fraction of correct predictions within this segment.",
    )
    brier_score: float = Field(
        ge=0.0,
        le=2.0,
        description="Mean Brier score for this segment.",
    )
    log_loss: Optional[float] = Field(
        default=None,
        description="Mean log-loss for this segment.",
    )
    avg_confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Mean model confidence within this segment.",
    )


class CalibrationBucket(BaseModel):
    """
    A single bin in a calibration / reliability diagram.

    Compares predicted probability ranges against observed outcome frequencies,
    helping diagnose whether the model is over- or under-confident.
    """

    model_config = ConfigDict(from_attributes=True)

    bucket_index: int = Field(
        ge=0,
        description="Zero-based index of this calibration bucket (lowest probability first).",
    )
    lower_bound: float = Field(
        ge=0.0,
        le=1.0,
        description="Lower edge of the predicted-probability range for this bucket.",
    )
    upper_bound: float = Field(
        ge=0.0,
        le=1.0,
        description="Upper edge of the predicted-probability range for this bucket.",
    )
    predicted_avg: float = Field(
        ge=0.0,
        le=1.0,
        description="Mean predicted probability of predictions falling in this bucket.",
    )
    observed_freq: float = Field(
        ge=0.0,
        le=1.0,
        description=(
            "Observed outcome frequency for predictions in this bucket. "
            "A well-calibrated model has predicted_avg ≈ observed_freq."
        ),
    )
    count: int = Field(ge=0, description="Number of predictions in this bucket.")
    calibration_gap: float = Field(
        description=(
            "predicted_avg - observed_freq. "
            "Positive = over-confident; negative = under-confident."
        ),
    )


class CalibrationReport(BaseModel):
    """Full calibration analysis for a model version."""

    model_config = ConfigDict(from_attributes=True)

    model_version_id: uuid.UUID = Field(
        description="UUID of the model version being analysed."
    )
    model_version_label: Optional[str] = Field(
        default=None, description="Human-readable model version label."
    )
    num_buckets: int = Field(
        ge=1,
        description="Number of equal-width probability bins used in the analysis.",
    )
    buckets: List[CalibrationBucket] = Field(
        description="Per-bucket calibration statistics, ordered from lowest to highest probability."
    )
    overall_ece: float = Field(
        ge=0.0,
        description="Weighted Expected Calibration Error across all buckets (lower is better).",
    )
    generated_at: datetime = Field(
        description="Timestamp when this calibration report was generated (UTC)."
    )
