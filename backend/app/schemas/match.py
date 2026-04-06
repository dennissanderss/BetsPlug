"""Schemas for the Match resource."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.prediction import PredictionResponse


# ---------------------------------------------------------------------------
# Match result sub-schema
# ---------------------------------------------------------------------------


class MatchResultSchema(BaseModel):
    """Recorded final score and outcome for a finished match."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="Unique result record identifier (UUID v4).")
    home_score: int = Field(ge=0, description="Goals / points scored by the home team.")
    away_score: int = Field(ge=0, description="Goals / points scored by the away team.")
    home_score_ht: Optional[int] = Field(
        default=None, ge=0, description="Home team score at half-time (if applicable)."
    )
    away_score_ht: Optional[int] = Field(
        default=None, ge=0, description="Away team score at half-time (if applicable)."
    )
    winner: Optional[str] = Field(
        default=None,
        description="Match winner: 'home', 'away', or 'draw'.",
    )
    extra_data: Optional[Dict[str, Any]] = Field(
        default=None, description="Additional sport-specific result data (e.g. penalties)."
    )


# ---------------------------------------------------------------------------
# Key statistics summary used in MatchAnalysis
# ---------------------------------------------------------------------------


class MatchKeyStats(BaseModel):
    """High-level pre-match statistical context for both sides."""

    model_config = ConfigDict(from_attributes=True)

    home_form: List[str] = Field(
        default_factory=list,
        description="Recent result codes for the home team ('W', 'D', 'L'), most recent last.",
    )
    away_form: List[str] = Field(
        default_factory=list,
        description="Recent result codes for the away team ('W', 'D', 'L'), most recent last.",
    )
    home_goals_avg: Optional[float] = Field(
        default=None, description="Average goals scored per game by home team (recent)."
    )
    away_goals_avg: Optional[float] = Field(
        default=None, description="Average goals scored per game by away team (recent)."
    )
    head_to_head_summary: Optional[str] = Field(
        default=None,
        description="Short prose summary of recent head-to-head history.",
    )
    extra: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional computed metrics (e.g. xG, Elo ratings).",
    )


# ---------------------------------------------------------------------------
# Base / Create / Response schemas
# ---------------------------------------------------------------------------


class MatchBase(BaseModel):
    """Fields shared across match schemas."""

    league_id: uuid.UUID = Field(description="UUID of the league this match belongs to.")
    season_id: Optional[uuid.UUID] = Field(
        default=None, description="UUID of the season this match is part of."
    )
    home_team_id: uuid.UUID = Field(description="UUID of the home team.")
    away_team_id: uuid.UUID = Field(description="UUID of the away team.")
    external_id: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Optional third-party / data-provider match identifier.",
    )
    status: str = Field(
        default="scheduled",
        description=(
            "Current match status: 'scheduled', 'live', 'finished', "
            "'postponed', or 'cancelled'."
        ),
    )
    scheduled_at: datetime = Field(description="Planned kick-off / start time (UTC).")
    venue: Optional[str] = Field(
        default=None, max_length=300, description="Stadium or venue name."
    )
    round_name: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Round label, e.g. 'Round 32' or 'Quarter-final'.",
    )
    matchday: Optional[int] = Field(
        default=None, ge=1, description="Matchday / game-week number within the season."
    )


class MatchCreate(MatchBase):
    """Payload required to create a new match record."""

    pass


class MatchResponse(MatchBase):
    """Standard match representation including denormalised team names."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="Unique match identifier (UUID v4).")
    home_team_name: Optional[str] = Field(
        default=None, description="Denormalised home team name for display convenience."
    )
    away_team_name: Optional[str] = Field(
        default=None, description="Denormalised away team name for display convenience."
    )
    created_at: datetime = Field(description="Timestamp when the record was created (UTC).")
    updated_at: datetime = Field(description="Timestamp of the most recent update (UTC).")

    @classmethod
    def from_orm_match(cls, match: Any) -> "MatchResponse":
        """Convenience factory that extracts nested team names from ORM relationships."""
        data = {
            col: getattr(match, col)
            for col in match.__table__.columns.keys()
        }
        data["home_team_name"] = match.home_team.name if match.home_team else None
        data["away_team_name"] = match.away_team.name if match.away_team else None
        return cls.model_validate(data)


class MatchDetail(MatchResponse):
    """Enriched match response including result and latest predictions."""

    result: Optional[MatchResultSchema] = Field(
        default=None,
        description="Final score and outcome; None if the match has not finished.",
    )
    predictions: List[PredictionResponse] = Field(
        default_factory=list,
        description="All model predictions made for this match.",
    )


class MatchAnalysis(BaseModel):
    """Pre-match analytical summary combining stats and the latest prediction."""

    model_config = ConfigDict(from_attributes=True)

    match: MatchResponse = Field(description="Core match information.")
    key_stats: Optional[MatchKeyStats] = Field(
        default=None, description="Pre-match statistical context for both teams."
    )
    latest_prediction: Optional[PredictionResponse] = Field(
        default=None,
        description="Most recent model prediction for this match (if available).",
    )
    narrative: Optional[str] = Field(
        default=None,
        description=(
            "Human-readable AI-generated match preview narrative. "
            "For simulation and educational purposes only."
        ),
    )
