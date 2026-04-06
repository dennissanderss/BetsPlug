"""Schemas for the Team resource."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class TeamBase(BaseModel):
    """Fields shared by create and response schemas."""

    league_id: uuid.UUID = Field(description="UUID of the league this team competes in.")
    name: str = Field(
        ...,
        max_length=200,
        description="Full team name, e.g. 'Manchester City'.",
    )
    slug: str = Field(
        ...,
        max_length=200,
        description="URL-safe unique identifier, e.g. 'manchester-city'.",
    )
    short_name: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Abbreviated team name, e.g. 'Man City'.",
    )
    logo_url: Optional[str] = Field(
        default=None,
        max_length=500,
        description="URL to the team crest / logo image.",
    )
    country: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Country of registration for the team.",
    )
    venue: Optional[str] = Field(
        default=None,
        max_length=300,
        description="Home stadium or venue name.",
    )
    is_active: bool = Field(
        default=True,
        description="Whether the team is currently active in the platform.",
    )


class TeamCreate(TeamBase):
    """Payload required to create a new team."""

    pass


class TeamResponse(TeamBase):
    """Standard team representation returned by list / lookup endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="Unique team identifier (UUID v4).")
    created_at: datetime = Field(description="Timestamp when the record was created (UTC).")
    updated_at: datetime = Field(description="Timestamp of the most recent update (UTC).")


# ---------------------------------------------------------------------------
# Form / stats sub-schemas used by TeamDetail
# ---------------------------------------------------------------------------


class TeamForm(BaseModel):
    """Summary of recent match results (last N games)."""

    model_config = ConfigDict(from_attributes=True)

    last_5: List[str] = Field(
        default_factory=list,
        description=(
            "Ordered result codes for the 5 most recent matches: "
            "'W' (win), 'D' (draw), 'L' (loss). Most recent last."
        ),
    )
    last_10: List[str] = Field(
        default_factory=list,
        description=(
            "Ordered result codes for the 10 most recent matches: "
            "'W' (win), 'D' (draw), 'L' (loss). Most recent last."
        ),
    )
    wins_last_5: int = Field(default=0, ge=0, description="Wins in the last 5 matches.")
    draws_last_5: int = Field(default=0, ge=0, description="Draws in the last 5 matches.")
    losses_last_5: int = Field(default=0, ge=0, description="Losses in the last 5 matches.")
    wins_last_10: int = Field(default=0, ge=0, description="Wins in the last 10 matches.")
    draws_last_10: int = Field(default=0, ge=0, description="Draws in the last 10 matches.")
    losses_last_10: int = Field(default=0, ge=0, description="Losses in the last 10 matches.")
    goals_scored_last_5: Optional[int] = Field(
        default=None, description="Goals scored in last 5 matches."
    )
    goals_conceded_last_5: Optional[int] = Field(
        default=None, description="Goals conceded in last 5 matches."
    )


class TeamStats(BaseModel):
    """Aggregated season statistics for a team."""

    model_config = ConfigDict(from_attributes=True)

    season: Optional[str] = Field(default=None, description="Season label, e.g. '2024/25'.")
    matches_played: int = Field(default=0, ge=0, description="Total matches played this season.")
    wins: int = Field(default=0, ge=0, description="Total wins.")
    draws: int = Field(default=0, ge=0, description="Total draws.")
    losses: int = Field(default=0, ge=0, description="Total losses.")
    goals_scored: int = Field(default=0, ge=0, description="Total goals scored.")
    goals_conceded: int = Field(default=0, ge=0, description="Total goals conceded.")
    goal_difference: int = Field(default=0, description="goals_scored - goals_conceded.")
    points: Optional[int] = Field(default=None, description="League points (if applicable).")
    position: Optional[int] = Field(
        default=None, ge=1, description="Current league table position."
    )
    home_wins: Optional[int] = Field(default=None, description="Wins at home venue.")
    away_wins: Optional[int] = Field(default=None, description="Wins at away venues.")
    clean_sheets: Optional[int] = Field(default=None, description="Matches with no goals conceded.")
    extra: Optional[Dict[str, float]] = Field(
        default=None,
        description="Additional sport-specific metrics (e.g. xG, possession %).",
    )


class TeamDetail(TeamResponse):
    """Enriched team response including form and statistical data."""

    recent_form: Optional[TeamForm] = Field(
        default=None, description="Summary of the team's recent match form."
    )
    stats: Optional[TeamStats] = Field(
        default=None, description="Aggregated season statistics for the team."
    )
