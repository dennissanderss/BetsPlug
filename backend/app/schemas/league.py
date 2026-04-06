"""Schemas for the League resource."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class LeagueBase(BaseModel):
    """Fields shared by create and response schemas."""

    sport_id: uuid.UUID = Field(description="UUID of the parent sport this league belongs to.")
    name: str = Field(
        ...,
        max_length=150,
        description="Full league name, e.g. 'Premier League'.",
    )
    slug: str = Field(
        ...,
        max_length=150,
        description="URL-safe unique identifier, e.g. 'premier-league'.",
    )
    country: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Country or region the league is associated with, e.g. 'England'.",
    )
    tier: Optional[int] = Field(
        default=None,
        ge=1,
        description="Competitive tier within the sport (1 = top flight).",
    )
    is_active: bool = Field(
        default=True,
        description="Whether the league is actively tracked.",
    )


class LeagueCreate(LeagueBase):
    """Payload required to create a new league."""

    pass


class LeagueResponse(LeagueBase):
    """Full league representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="Unique league identifier (UUID v4).")
    created_at: datetime = Field(description="Timestamp when the record was created (UTC).")
    updated_at: datetime = Field(description="Timestamp of the most recent update (UTC).")
