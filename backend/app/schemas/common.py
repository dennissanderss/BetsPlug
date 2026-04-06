"""Common reusable schemas: pagination, generic API response wrapper."""

from __future__ import annotations

from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated list response returned by list endpoints."""

    model_config = ConfigDict(from_attributes=True)

    items: List[T] = Field(description="The list of items for the current page.")
    total: int = Field(description="Total number of items across all pages.", ge=0)
    page: int = Field(description="Current page number (1-based).", ge=1)
    page_size: int = Field(description="Number of items per page.", ge=1)
    pages: int = Field(description="Total number of pages.", ge=0)

    @classmethod
    def from_items(
        cls,
        items: List[T],
        total: int,
        page: int,
        page_size: int,
    ) -> "PaginatedResponse[T]":
        """Convenience constructor that calculates the page count automatically."""
        pages = max(1, -(-total // page_size)) if total else 0
        return cls(items=items, total=total, page=page, page_size=page_size, pages=pages)


class ApiResponse(BaseModel, Generic[T]):
    """Uniform envelope for every API response."""

    model_config = ConfigDict(from_attributes=True)

    success: bool = Field(default=True, description="Whether the request succeeded.")
    message: Optional[str] = Field(default=None, description="Human-readable status message.")
    data: Optional[T] = Field(default=None, description="Response payload.")
    error: Optional[str] = Field(default=None, description="Error detail when success is False.")
