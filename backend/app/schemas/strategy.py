"""Pydantic schemas for Strategy resources."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Rule schema (used inside strategy rules list)
# ---------------------------------------------------------------------------

class RuleSchema(BaseModel):
    """A single filter rule within a strategy."""

    feature: str = Field(
        description=(
            "Feature to evaluate. Supported: confidence, edge_home, edge_draw, "
            "edge_away, edge_pick, home_win_prob, draw_prob, away_win_prob, "
            "odds_home, odds_draw, odds_away, odds_pick, form_diff."
        )
    )
    operator: str = Field(
        description="Comparison operator: '>', '<', '>=', '<=', '==', 'between'."
    )
    value: Any = Field(
        description="Threshold value. For 'between', provide [min, max]."
    )


# ---------------------------------------------------------------------------
# Strategy schemas
# ---------------------------------------------------------------------------

class StakingSchema(BaseModel):
    """Staking configuration for a strategy."""

    type: str = Field(default="flat", description="Staking type, e.g. 'flat', 'kelly'.")
    amount: float = Field(default=1.0, description="Stake amount (units).")


class StrategyBase(BaseModel):
    """Fields shared across strategy schemas."""

    name: str = Field(max_length=200, description="Human-readable strategy name.")
    description: Optional[str] = Field(default=None, description="Optional longer description.")
    rules: List[RuleSchema] = Field(description="List of filter rules (AND logic).")
    staking: StakingSchema = Field(
        default_factory=lambda: StakingSchema(type="flat", amount=1.0),
        description="Staking configuration.",
    )
    is_active: bool = Field(default=True, description="Whether the strategy is active.")


class StrategyResponse(StrategyBase):
    """Full strategy representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="Unique strategy identifier (UUID v4).")
    created_at: datetime = Field(description="Timestamp when the record was created (UTC).")
    updated_at: datetime = Field(description="Timestamp of the most recent update (UTC).")


# ---------------------------------------------------------------------------
# Matched-prediction schema (used in the /picks endpoint)
# ---------------------------------------------------------------------------

class StrategyPickPrediction(BaseModel):
    """Prediction summary returned by the strategy picks endpoint."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="Prediction UUID.")
    match_id: uuid.UUID = Field(description="Match UUID.")
    predicted_at: datetime = Field(description="When the prediction was generated.")
    home_win_prob: float = Field(description="Home win probability.")
    draw_prob: Optional[float] = Field(default=None, description="Draw probability.")
    away_win_prob: float = Field(description="Away win probability.")
    confidence: float = Field(description="Model confidence (0-1).")
    prediction_type: str = Field(description="Type of prediction.")

    pick: Optional[str] = Field(default=None, description="Predicted outcome: HOME, DRAW, AWAY.")

    # Match context (populated from joined Match)
    home_team_name: Optional[str] = Field(default=None, description="Home team name.")
    away_team_name: Optional[str] = Field(default=None, description="Away team name.")
    scheduled_at: Optional[datetime] = Field(default=None, description="Match kickoff time.")
    league_name: Optional[str] = Field(default=None, description="League name.")

    # Evaluation (if match is finished)
    match_status: Optional[str] = Field(default=None, description="Match status.")
    actual_outcome: Optional[str] = Field(default=None, description="Actual outcome: home/draw/away.")
    is_correct: Optional[bool] = Field(default=None, description="Whether prediction was correct.")
    home_score: Optional[int] = Field(default=None, description="Actual home score.")
    away_score: Optional[int] = Field(default=None, description="Actual away score.")
    pnl: Optional[float] = Field(default=None, description="P/L in units (flat 1u stake).")


class StrategyPicksResponse(BaseModel):
    """Response envelope for strategy picks."""

    strategy: StrategyResponse = Field(description="The strategy that was applied.")
    total: int = Field(description="Total number of matching predictions.")
    picks: List[StrategyPickPrediction] = Field(description="Matching predictions.")
