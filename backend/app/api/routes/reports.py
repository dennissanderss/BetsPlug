"""Reports routes."""

import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.report import GeneratedReport, ReportJob
from app.schemas.report import GeneratedReportResponse, ReportJobCreate, ReportJobResponse

router = APIRouter()


@router.post(
    "/generate",
    response_model=ReportJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger report generation",
)
async def generate_report(
    payload: ReportJobCreate,
    db: AsyncSession = Depends(get_db),
) -> ReportJobResponse:
    """
    Enqueue a report generation job and return the pending job record.

    # TODO: delegate report rendering to Celery task / reporting service
    """
    new_job = ReportJob(
        report_type=payload.report_type,
        config=payload.config,
        status="pending",
    )
    db.add(new_job)
    await db.flush()
    await db.refresh(new_job)

    # TODO: enqueue celery task: generate_report.delay(str(new_job.id))

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
