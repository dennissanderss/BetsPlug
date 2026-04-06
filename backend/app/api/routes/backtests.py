"""Backtests routes."""

import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.backtest import BacktestResult, BacktestRun
from app.schemas.backtest import BacktestResultResponse, BacktestRunCreate, BacktestRunResponse

router = APIRouter()


@router.post(
    "/run",
    response_model=BacktestRunResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start a backtest run",
)
async def start_backtest(
    payload: BacktestRunCreate,
    db: AsyncSession = Depends(get_db),
) -> BacktestRunResponse:
    """
    Create a BacktestRun record and enqueue the computation.

    Returns the run record with status='running'.

    # TODO: delegate actual backtest computation to Celery task / service layer
    """
    new_run = BacktestRun(
        model_version_id=payload.model_version_id,
        name=payload.name,
        sport_slug=payload.sport_slug,
        league_slug=payload.league_slug,
        start_date=payload.start_date,
        end_date=payload.end_date,
        config=payload.config,
        status="running",
        ran_at=datetime.now(timezone.utc),
    )
    db.add(new_run)
    await db.flush()
    await db.refresh(new_run)

    # TODO: enqueue celery task: run_backtest.delay(str(new_run.id))

    return BacktestRunResponse.model_validate(new_run)


@router.get(
    "/",
    response_model=List[BacktestRunResponse],
    summary="List backtest runs",
)
async def list_backtests(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> List[BacktestRunResponse]:
    """Return backtest runs ordered by most recently created first."""
    result = await db.execute(
        select(BacktestRun)
        .order_by(BacktestRun.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    runs = result.scalars().all()
    return [BacktestRunResponse.model_validate(r) for r in runs]


@router.get(
    "/{backtest_id}",
    response_model=BacktestRunResponse,
    summary="Get backtest detail with results",
)
async def get_backtest(
    backtest_id: uuid.UUID,
    include_results: bool = Query(
        default=False,
        description="When true, include per-match result rows in the response",
    ),
    db: AsyncSession = Depends(get_db),
) -> BacktestRunResponse:
    """
    Return a BacktestRun record.

    Pass ``include_results=true`` to also fetch per-match BacktestResult rows
    (note: may be large for long date ranges).

    # TODO: expose a separate paginated endpoint for BacktestResult rows
    """
    result = await db.execute(
        select(BacktestRun).where(BacktestRun.id == backtest_id)
    )
    run = result.scalar_one_or_none()
    if run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Backtest run {backtest_id} not found.",
        )

    response = BacktestRunResponse.model_validate(run)
    return response
