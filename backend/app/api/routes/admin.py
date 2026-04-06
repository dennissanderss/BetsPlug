"""Admin routes: data-source health, ingestion monitoring, sync and retrain triggers."""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.ingestion import DataSource, IngestionError, IngestionRun

router = APIRouter()


# ---------------------------------------------------------------------------
# Response models (admin-specific, kept local to avoid schema proliferation)
# ---------------------------------------------------------------------------


class DataSourceHealth(BaseModel):
    id: uuid.UUID
    name: str
    adapter_type: str
    is_active: bool
    reliability_score: Optional[float]
    last_sync_at: Optional[datetime]
    status: str  # "healthy" | "degraded" | "unknown"


class IngestionRunSummary(BaseModel):
    id: uuid.UUID
    data_source_id: uuid.UUID
    job_type: str
    status: str
    records_fetched: int
    records_inserted: int
    records_updated: int
    records_skipped: int
    started_at: datetime
    completed_at: Optional[datetime]
    duration_seconds: Optional[float]


class IngestionErrorSummary(BaseModel):
    id: uuid.UUID
    ingestion_run_id: uuid.UUID
    error_type: str
    error_message: str
    created_at: datetime


class SyncResponse(BaseModel):
    accepted: bool
    message: str
    task_id: Optional[str] = None


class RetrainResponse(BaseModel):
    accepted: bool
    message: str
    task_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/data-sources",
    response_model=List[DataSourceHealth],
    summary="List data sources with health status",
)
async def list_data_sources(
    db: AsyncSession = Depends(get_db),
) -> List[DataSourceHealth]:
    """
    Return all registered data sources together with a simple health indicator.

    Health is derived from ``reliability_score``:
    - score >= 0.8  → "healthy"
    - score < 0.8   → "degraded"
    - score is None → "unknown"
    """
    result = await db.execute(
        select(DataSource).order_by(DataSource.name)
    )
    sources = result.scalars().all()

    def _health(src: DataSource) -> str:
        if src.reliability_score is None:
            return "unknown"
        return "healthy" if src.reliability_score >= 0.8 else "degraded"

    return [
        DataSourceHealth(
            id=src.id,
            name=src.name,
            adapter_type=src.adapter_type,
            is_active=src.is_active,
            reliability_score=src.reliability_score,
            last_sync_at=src.last_sync_at,
            status=_health(src),
        )
        for src in sources
    ]


@router.get(
    "/ingestion-runs",
    response_model=List[IngestionRunSummary],
    summary="List recent ingestion runs",
)
async def list_ingestion_runs(
    limit: int = Query(default=50, ge=1, le=500),
    status_filter: Optional[str] = Query(
        default=None,
        alias="status",
        description="Filter by run status: 'running', 'completed', 'failed'",
    ),
    db: AsyncSession = Depends(get_db),
) -> List[IngestionRunSummary]:
    """Return ingestion run records ordered by most recently started first."""
    q = select(IngestionRun).order_by(IngestionRun.started_at.desc()).limit(limit)
    if status_filter:
        q = q.where(IngestionRun.status == status_filter)
    result = await db.execute(q)
    runs = result.scalars().all()

    return [
        IngestionRunSummary(
            id=r.id,
            data_source_id=r.data_source_id,
            job_type=r.job_type,
            status=r.status,
            records_fetched=r.records_fetched,
            records_inserted=r.records_inserted,
            records_updated=r.records_updated,
            records_skipped=r.records_skipped,
            started_at=r.started_at,
            completed_at=r.completed_at,
            duration_seconds=r.duration_seconds,
        )
        for r in runs
    ]


@router.get(
    "/errors",
    response_model=List[IngestionErrorSummary],
    summary="List recent ingestion errors",
)
async def list_ingestion_errors(
    limit: int = Query(default=100, ge=1, le=500),
    ingestion_run_id: Optional[uuid.UUID] = Query(
        default=None, description="Filter errors by a specific ingestion run"
    ),
    db: AsyncSession = Depends(get_db),
) -> List[IngestionErrorSummary]:
    """Return ingestion errors, most recent first."""
    q = (
        select(IngestionError)
        .order_by(IngestionError.created_at.desc())
        .limit(limit)
    )
    if ingestion_run_id is not None:
        q = q.where(IngestionError.ingestion_run_id == ingestion_run_id)

    result = await db.execute(q)
    errors = result.scalars().all()

    return [
        IngestionErrorSummary(
            id=e.id,
            ingestion_run_id=e.ingestion_run_id,
            error_type=e.error_type,
            error_message=e.error_message,
            created_at=e.created_at,
        )
        for e in errors
    ]


@router.post(
    "/sync",
    response_model=SyncResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger data sync for one or all data sources",
)
async def trigger_sync(
    data_source_id: Optional[uuid.UUID] = Body(
        default=None,
        embed=True,
        description="UUID of a specific data source to sync. Omit to sync all active sources.",
    ),
    db: AsyncSession = Depends(get_db),
) -> SyncResponse:
    """
    Enqueue a data ingestion / sync task.

    If ``data_source_id`` is provided, only that source is synced.
    Otherwise all active sources are synced.

    # TODO: delegate to Celery task: sync_data_source.delay(data_source_id)
    """
    if data_source_id is not None:
        src_result = await db.execute(
            select(DataSource).where(DataSource.id == data_source_id)
        )
        if src_result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"DataSource {data_source_id} not found.",
            )
        msg = f"Sync enqueued for data source {data_source_id}."
    else:
        msg = "Sync enqueued for all active data sources."

    # TODO: task_id = sync_data_source.delay(str(data_source_id)).id
    return SyncResponse(accepted=True, message=msg, task_id=None)


@router.post(
    "/retrain",
    response_model=RetrainResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger model retraining",
)
async def trigger_retrain(
    sport_slug: Optional[str] = Body(
        default=None,
        embed=True,
        description="Sport slug to restrict retraining to. Omit for all sports.",
    ),
    config: Optional[Dict[str, Any]] = Body(
        default=None,
        embed=True,
        description="Optional hyperparameter overrides for the training run.",
    ),
    db: AsyncSession = Depends(get_db),
) -> RetrainResponse:
    """
    Enqueue a model retraining task.

    # TODO: delegate to ML pipeline Celery task: retrain_model.delay(sport_slug, config)
    """
    scope = sport_slug or "all"
    msg = f"Model retraining enqueued for sport scope='{scope}'."

    # TODO: task_id = retrain_model.delay(sport_slug, config).id
    return RetrainResponse(accepted=True, message=msg, task_id=None)
