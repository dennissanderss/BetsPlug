"""Schemas for the Sport resource."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SportBase(BaseModel):
    """Fields shared by create and response schemas."""

    name: str = Field(
        ...,
        max_length=100,
        description="Human-readable sport name, e.g. 'Football'.",
    )
    slug: str = Field(
        ...,
        max_length=100,
        description="URL-safe unique identifier, e.g. 'football'.",
    )
    icon: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Path or URL to the sport's icon asset.",
    )
    is_active: bool = Field(
        default=True,
        description="Whether the sport is visible and in active use.",
    )


class SportCreate(SportBase):
    """Payload required to create a new sport."""

    pass


class SportResponse(SportBase):
    """Full sport representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="Unique sport identifier (UUID v4).")
    created_at: datetime = Field(description="Timestamp when the record was created (UTC).")
    updated_at: datetime = Field(description="Timestamp of the most recent update (UTC).")
