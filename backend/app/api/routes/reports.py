"""Reports routes."""

import logging
import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.tier import get_current_tier
from app.core.tier_system import PickTier
from app.db.session import get_db
from app.models.report import GeneratedReport, ReportJob
from app.schemas.report import GeneratedReportResponse, ReportJobCreate, ReportJobResponse

logger = logging.getLogger(__name__)

router = APIRouter()

_ALLOWED_FORMATS = {"pdf", "csv", "json"}
_ALLOWED_REPORT_TYPES = {"weekly", "monthly", "custom"}
_REPORT_TTL_HOURS = 12  # auto-delete reports older than this


async def _cleanup_old_reports(db: AsyncSession) -> int:
    """Delete generated reports (DB rows + files on disk) older than
    _REPORT_TTL_HOURS. Runs before each new generation to keep the
    database and filesystem clean. Returns number of deleted reports.
    """
    from datetime import datetime, timedelta, timezone

    cutoff = datetime.now(timezone.utc) - timedelta(hours=_REPORT_TTL_HOURS)

    # Fetch old reports so we can delete files from disk
    old_reports_result = await db.execute(
        select(GeneratedReport).where(GeneratedReport.created_at < cutoff)
    )
    old_reports = old_reports_result.scalars().all()

    deleted = 0
    for report in old_reports:
        # Delete file from disk (best-effort, file may already be gone)
        try:
            if report.file_path and os.path.isfile(report.file_path):
                os.remove(report.file_path)
        except OSError:
            pass
        await db.delete(report)
        deleted += 1

    # Also clean up orphaned ReportJob rows (completed/failed, older than cutoff)
    old_jobs_result = await db.execute(
        select(ReportJob).where(
            ReportJob.created_at < cutoff,
            ReportJob.status.in_(["completed", "failed"]),
        )
    )
    for job in old_jobs_result.scalars().all():
        await db.delete(job)

    if deleted > 0:
        await db.flush()
        logger.info("Cleaned up %d old reports (older than %dh)", deleted, _REPORT_TTL_HOURS)

    return deleted


@router.post(
    "/generate",
    response_model=ReportJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger report generation",
)
async def generate_report(
    payload: ReportJobCreate,
    db: AsyncSession = Depends(get_db),
    user_tier: PickTier = Depends(get_current_tier),
) -> ReportJobResponse:
    """Generate a report synchronously in the requested format and return the
    job record. v6.2.2 fixes the long-standing bug where the `format` field
    from the frontend was silently dropped and every report was a PDF.

    Tier-scoped (v8.2): the report only contains picks the caller has
    access to, and embeds a tier banner so users can tell which slice
    of the data the document covers.
    """
    from datetime import datetime, timezone
    from app.services.report_service import ReportService

    fmt = (payload.format or "pdf").lower()
    if fmt not in _ALLOWED_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format: {fmt!r}. Must be one of {sorted(_ALLOWED_FORMATS)}.",
        )

    report_type = (payload.report_type or "weekly").lower()
    if report_type not in _ALLOWED_REPORT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported report_type: {report_type!r}. Must be one of "
                f"{sorted(_ALLOWED_REPORT_TYPES)}."
            ),
        )

    # Carry the chosen format inside the job config so it survives a
    # restart / audit log. We don't add a dedicated `format` column on
    # ReportJob to keep the migration footprint zero.
    merged_config = dict(payload.config or {})
    merged_config["format"] = fmt
    # Persist the tier slug on the job so the generated artefact stays
    # auditable (which tier did this document describe?).
    merged_config["tier"] = user_tier.name.lower()

    # Auto-cleanup: delete reports older than 12h to keep DB + disk clean
    await _cleanup_old_reports(db)

    new_job = ReportJob(
        report_type=report_type,
        config=merged_config,
        status="running",
        started_at=datetime.now(timezone.utc),
    )
    db.add(new_job)
    await db.flush()

    try:
        service = ReportService()
        report = await service.generate(new_job, db, fmt=fmt, user_tier=user_tier)
        new_job.status = "completed"
        new_job.completed_at = datetime.now(timezone.utc)
        # Explicit commit so the GeneratedReport row is visible to the
        # frontend's immediate re-fetch of /reports/. Without this, the
        # get_db dependency commits AFTER the response is sent, which
        # creates a race condition: the client invalidates the query
        # and re-fetches before the commit lands → the new report
        # doesn't appear in the list.
        await db.commit()
    except Exception as exc:
        logger.exception(
            "Report generation failed (type=%s fmt=%s job=%s)",
            report_type,
            fmt,
            new_job.id,
        )
        new_job.status = "failed"
        new_job.error_message = str(exc)[:500]
        new_job.completed_at = datetime.now(timezone.utc)
        await db.flush()
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report generation failed: {exc}",
        )

    return ReportJobResponse.model_validate(new_job)


@router.get(
    "/",
    response_model=List[GeneratedReportResponse],
    summary="List generated reports",
)
async def list_reports(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> List[GeneratedReportResponse]:
    """Return completed report records ordered by most recently created first."""
    result = await db.execute(
        select(GeneratedReport)
        .order_by(GeneratedReport.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    reports = result.scalars().all()
    return [GeneratedReportResponse.model_validate(r) for r in reports]


@router.get(
    "/{report_id}",
    response_model=GeneratedReportResponse,
    summary="Get report detail",
)
async def get_report(
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> GeneratedReportResponse:
    """Return metadata for a single generated report."""
    result = await db.execute(
        select(GeneratedReport).where(GeneratedReport.id == report_id)
    )
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report {report_id} not found.",
        )
    return GeneratedReportResponse.model_validate(report)


@router.get(
    "/{report_id}/download",
    summary="Download report file",
)
async def download_report(
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    """
    Stream the report file to the client.

    Returns 404 if the report record or the underlying file does not exist.
    """
    result = await db.execute(
        select(GeneratedReport).where(GeneratedReport.id == report_id)
    )
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report {report_id} not found.",
        )

    file_path = report.file_path
    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report file not found on disk: {file_path}",
        )

    # Derive media type from file format
    media_type_map = {
        "pdf": "application/pdf",
        "csv": "text/csv",
        "json": "application/json",
    }
    media_type = media_type_map.get(report.file_format.lower(), "application/octet-stream")
    filename = os.path.basename(file_path)

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=filename,
    )
