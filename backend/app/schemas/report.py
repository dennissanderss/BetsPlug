"""Schemas for the ReportJob and GeneratedReport resources."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Report job schemas
# ---------------------------------------------------------------------------


class ReportJobCreate(BaseModel):
    """Payload required to enqueue a new report generation job."""

    report_type: str = Field(
        max_length=50,
        description=(
            "Category of report to generate: 'weekly', 'monthly', or 'custom'. "
            "Determines which template and date-range logic is applied."
        ),
    )
    config: Optional[Dict[str, Any]] = Field(
        default=None,
        description=(
            "Arbitrary JSON configuration for the report (e.g. date range, league filter). "
            "Shape is report-type-specific."
        ),
    )


class ReportJobResponse(BaseModel):
    """Representation of a report job returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="Unique report job identifier (UUID v4).")
    report_type: str = Field(
        description="Category of report: 'weekly', 'monthly', or 'custom'."
    )
    triggered_by: Optional[uuid.UUID] = Field(
        default=None,
        description="UUID of the user who triggered this job (None = system-triggered).",
    )
    status: str = Field(
        description=(
            "Current job status: 'pending', 'running', 'completed', or 'failed'."
        ),
    )
    config: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Configuration used when the job was created.",
    )
    started_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp when the worker picked up and started the job (UTC).",
    )
    completed_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp when the job reached a terminal state (UTC).",
    )
    error_message: Optional[str] = Field(
        default=None,
        description="Failure detail if the job status is 'failed'.",
    )
    created_at: datetime = Field(description="Timestamp when the job was enqueued (UTC).")
    updated_at: datetime = Field(description="Timestamp of the most recent status update (UTC).")


# ---------------------------------------------------------------------------
# Generated report schemas
# ---------------------------------------------------------------------------


class GeneratedReportResponse(BaseModel):
    """Metadata for a report file produced by a completed report job."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="Unique generated-report identifier (UUID v4).")
    job_id: uuid.UUID = Field(
        description="UUID of the ReportJob that produced this report."
    )
    title: str = Field(
        max_length=300,
        description="Human-readable report title, e.g. 'Weekly Performance Report — W14 2025'.",
    )
    file_path: str = Field(
        max_length=500,
        description="Server-side path or storage key where the report file is stored.",
    )
    file_format: str = Field(
        max_length=10,
        description="File extension / format: 'pdf', 'csv', or 'json'.",
    )
    file_size_bytes: Optional[int] = Field(
        default=None,
        ge=0,
        description="File size in bytes (None if not yet measured).",
    )
    summary: Optional[str] = Field(
        default=None,
        description="Auto-generated executive summary of the report's key findings.",
    )
    created_at: datetime = Field(description="Timestamp when the report file was created (UTC).")
    updated_at: datetime = Field(description="Timestamp of the most recent metadata update (UTC).")
