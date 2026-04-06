"""Schemas for the cross-entity search feature."""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SearchResult(BaseModel):
    """A single item returned by a search query."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="UUID of the matching entity.")
    entity_type: str = Field(
        description=(
            "Type of the matched entity: 'sport', 'league', 'team', or 'match'."
        ),
    )
    name: str = Field(description="Primary display name of the entity.")
    slug: Optional[str] = Field(
        default=None,
        description="URL-safe slug for direct navigation (if applicable).",
    )
    description: Optional[str] = Field(
        default=None,
        description="Short contextual description, e.g. 'Premier League — England'.",
    )
    score: Optional[float] = Field(
        default=None,
        ge=0.0,
        description=(
            "Relevance score assigned by the search engine (higher = more relevant). "
            "None when results are returned in alphabetical / natural order."
        ),
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description=(
            "Extra entity-specific attributes surfaced for display, "
            "e.g. {country, tier} for leagues or {sport_name} for teams."
        ),
    )


class SearchResultGroup(BaseModel):
    """A collection of search results grouped by entity type."""

    model_config = ConfigDict(from_attributes=True)

    entity_type: str = Field(
        description=(
            "The entity type shared by all items in this group: "
            "'sport', 'league', 'team', or 'match'."
        ),
    )
    label: str = Field(
        description=(
            "Human-readable group label for display, "
            "e.g. 'Leagues', 'Teams', 'Matches'."
        ),
    )
    items: List[SearchResult] = Field(
        description="Ordered list of search results within this group.",
    )
    total_hits: int = Field(
        ge=0,
        description=(
            "Total number of matching entities for this type before truncation. "
            "May exceed len(items) when results are capped per group."
        ),
    )


class SearchResponse(BaseModel):
    """Top-level response returned by search endpoints."""

    model_config = ConfigDict(from_attributes=True)

    query: str = Field(description="The original search query string submitted by the caller.")
    groups: List[SearchResultGroup] = Field(
        description=(
            "Results partitioned by entity type. "
            "Only groups with at least one matching item are included."
        ),
    )
    total_hits: int = Field(
        ge=0,
        description="Grand total of matching entities across all entity types.",
    )
    took_ms: Optional[float] = Field(
        default=None,
        ge=0.0,
        description="Server-side search execution time in milliseconds.",
    )
