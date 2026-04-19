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


class SchedulerJobStatus(BaseModel):
    id: str
    name: str
    trigger: str
    next_run_time: Optional[datetime]
    pending: bool


class SchedulerStatus(BaseModel):
    running: bool
    jobs: List[SchedulerJobStatus]


class CacheFlushResponse(BaseModel):
    flushed: Dict[str, int]
    total: int


@router.post(
    "/cache-flush",
    response_model=CacheFlushResponse,
    summary="Flush v8.1-affected Redis cache patterns",
)
async def flush_v81_cache() -> CacheFlushResponse:
    """Flush every cache key whose contents depend on v8.1 filter semantics.

    Call once after each backend deploy that changes filter logic, so
    users don't see stale aggregates for up to 1h (pricing TTL).
    """
    from app.core.cache import cache_delete
    from app.core.prediction_filters import V81_FILTER_CACHE_PATTERNS

    flushed: Dict[str, int] = {}
    for pattern in V81_FILTER_CACHE_PATTERNS:
        flushed[pattern] = await cache_delete(pattern)
    return CacheFlushResponse(flushed=flushed, total=sum(flushed.values()))


@router.get(
    "/scheduler-status",
    response_model=SchedulerStatus,
    summary="Return APScheduler job state for diagnostic use",
)
async def get_scheduler_status() -> SchedulerStatus:
    """Diagnose scheduler health.

    Reports whether APScheduler is running and lists every registered job
    with its next scheduled run. Silent-failing scheduler startups would
    otherwise be invisible until user-facing aggregates (live-measurement,
    dashboard) went stale.
    """
    try:
        from app.services.scheduler import scheduler
    except Exception as exc:  # apscheduler not importable — disabled deploy
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"scheduler unavailable: {exc!s}",
        )

    jobs: List[SchedulerJobStatus] = []
    for job in scheduler.get_jobs():
        jobs.append(
            SchedulerJobStatus(
                id=str(job.id),
                name=job.name or str(job.id),
                trigger=str(job.trigger),
                next_run_time=job.next_run_time,
                pending=job.pending,
            )
        )
    return SchedulerStatus(running=scheduler.running, jobs=jobs)


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
    Run data sync directly (no Celery required).

    Syncs upcoming matches, recent results, and standings for one
    competition (rotating through all 6 top leagues).
    """
    import logging

    log = logging.getLogger(__name__)

    try:
        from app.services.data_sync_service import DataSyncService

        async with DataSyncService() as sync_service:
            # Sync upcoming matches
            matches_result = await sync_service.sync_upcoming_matches(db)
            log.info("Sync matches result: %s", matches_result)

            # Sync recent results
            results_result = await sync_service.sync_recent_results(db)
            log.info("Sync results result: %s", results_result)

            # Sync standings
            standings_result = await sync_service.sync_standings(db)
            log.info("Sync standings result: %s", standings_result)

        await db.commit()

        msg = (
            f"Sync complete. "
            f"Matches: {matches_result.get('created', 0)} new, {matches_result.get('updated', 0)} updated. "
            f"Results: {results_result.get('created_results', 0)} new. "
            f"Standings: {standings_result.get('rows_upserted', 0)} rows."
        )
        return SyncResponse(accepted=True, message=msg, task_id=None)

    except Exception as exc:
        log.error("Sync failed: %s", exc, exc_info=True)
        return SyncResponse(accepted=False, message=f"Sync failed: {str(exc)}", task_id=None)


@router.post("/batch-predictions", summary="Generate predictions for matches without one")
async def batch_predictions(
    batch_size: int = Body(default=100, embed=True),
    include_upcoming: bool = Body(
        default=False,
        embed=True,
        description=(
            "Also scan SCHEDULED matches in the next `upcoming_days` days. "
            "When False (default) only finished matches are backfilled — the "
            "original behaviour, used by the historical backfill script."
        ),
    ),
    upcoming_days: int = Body(
        default=14,
        embed=True,
        description="Days-ahead window for upcoming matches when include_upcoming=True.",
    ),
    db: AsyncSession = Depends(get_db),
):
    """Generate predictions for matches missing one. Evaluates finished ones on the way.

    Default behaviour (``include_upcoming=False``) scans FINISHED matches
    without predictions and emits both prediction + evaluation for each —
    the legacy historical-backfill pipeline used by
    ``backend/scripts/fill_predictions_safe.py``.

    Setting ``include_upcoming=True`` additionally scans SCHEDULED matches
    within the next ``upcoming_days`` days that lack a prediction. Useful
    when the Celery live-generator has fallen behind — e.g. post-deploy
    gap 2026-04-16..22 observed during round-2 audit.
    """
    import math
    from app.forecasting.forecast_service import ForecastService
    from app.models.match import Match, MatchResult, MatchStatus
    from app.models.model_version import ModelVersion
    from app.models.prediction import Prediction, PredictionEvaluation

    # Ensure model version
    mv_result = await db.execute(select(ModelVersion).where(ModelVersion.is_active.is_(True)).limit(1))
    if mv_result.scalar_one_or_none() is None:
        mv = ModelVersion(
            id=uuid.uuid4(), name="BetsPlug Ensemble v1", version="1.0.0",
            model_type="ensemble", sport_scope="all",
            hyperparameters={"weights": {"elo": 1.0, "poisson": 1.5, "logistic": 1.0}},
            training_metrics={}, trained_at=datetime.now(timezone.utc), is_active=True,
        )
        db.add(mv)
        await db.flush()

    # Find matches without predictions — finished first (fills trackrecord),
    # then upcoming if the caller opted in (fills today/soon fixture pages).
    from datetime import timedelta as _td
    from sqlalchemy import and_, or_

    status_branch: list = [Match.status == MatchStatus.FINISHED]
    if include_upcoming:
        status_branch.append(
            and_(
                Match.status == MatchStatus.SCHEDULED,
                Match.scheduled_at >= datetime.now(timezone.utc),
                Match.scheduled_at <= datetime.now(timezone.utc) + _td(days=upcoming_days),
            )
        )

    stmt = (
        select(Match).where(
            and_(
                or_(*status_branch),
                ~Match.id.in_(select(Prediction.match_id).distinct()),
            )
        ).order_by(Match.scheduled_at).limit(batch_size)
    )
    matches = (await db.execute(stmt)).scalars().all()

    # Count total remaining using the same status scope as the selection
    remaining_result = await db.execute(select(Match.id).where(
        and_(
            or_(*status_branch),
            ~Match.id.in_(select(Prediction.match_id).distinct()),
        )
    ))
    remaining = len(remaining_result.scalars().all())

    if not matches:
        return {"generated": 0, "evaluated": 0, "remaining": 0, "message": "All matches have predictions"}

    svc = ForecastService()
    generated = 0
    for m in matches:
        try:
            await svc.generate_forecast(m.id, db)
            generated += 1
        except Exception:
            pass
    await db.commit()

    # Evaluate
    eval_stmt = (
        select(Prediction, MatchResult)
        .join(Match, Match.id == Prediction.match_id)
        .join(MatchResult, MatchResult.match_id == Match.id)
        .outerjoin(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .where(and_(Match.status == MatchStatus.FINISHED, PredictionEvaluation.id.is_(None)))
        .limit(batch_size * 2)
    )
    eval_rows = (await db.execute(eval_stmt)).all()
    evaluated = 0
    for pred, result in eval_rows:
        try:
            if result.home_score > result.away_score:
                actual = "home"
            elif result.home_score < result.away_score:
                actual = "away"
            else:
                actual = "draw"
            probs = {"home": pred.home_win_prob, "draw": pred.draw_prob or 0.0, "away": pred.away_win_prob}
            predicted = max(probs, key=lambda k: probs[k])
            brier = sum((probs.get(o, 0.0) - (1.0 if o == actual else 0.0)) ** 2 for o in ["home", "draw", "away"]) / 3
            log_loss_val = -math.log(max(probs.get(actual, 1e-15), 1e-15))
            evaluation = PredictionEvaluation(
                id=uuid.uuid4(), prediction_id=pred.id,
                actual_outcome=actual, actual_home_score=result.home_score,
                actual_away_score=result.away_score, is_correct=(predicted == actual),
                brier_score=round(brier, 6), log_loss=round(log_loss_val, 6),
                evaluated_at=datetime.now(timezone.utc),
            )
            db.add(evaluation)
            evaluated += 1
        except Exception:
            pass
    await db.commit()

    return {
        "generated": generated,
        "evaluated": evaluated,
        "remaining": remaining - generated,
        "message": f"Batch done. Call again to process more. ~{(remaining - generated) // batch_size} batches left.",
    }


class FullSyncResponse(BaseModel):
    total_created: int
    total_updated: int
    total_errors: int
    leagues_synced: int
    details: List[str]


@router.post(
    "/full-sync",
    response_model=FullSyncResponse,
    status_code=status.HTTP_200_OK,
    summary="Sync ALL leagues: fixtures, results, standings",
)
async def full_sync(
    db: AsyncSession = Depends(get_db),
) -> FullSyncResponse:
    """
    Sync all 6 leagues in one call. Takes ~30 seconds.
    Syncs: upcoming matches, recent results, and standings for each league.
    """
    import asyncio
    import logging
    from app.services.data_sync_service import DataSyncService

    log = logging.getLogger(__name__)
    total_created, total_updated, total_errors = 0, 0, 0
    details: List[str] = []

    for i in range(6):
        try:
            async with DataSyncService() as svc:
                r1 = await svc.sync_upcoming_matches(db)
                details.append(f"Upcoming [{r1.get('competition', '?')}]: +{r1.get('created', 0)} new, {r1.get('updated', 0)} upd")
                total_created += r1.get("created", 0)
                total_updated += r1.get("updated", 0)
                total_errors += r1.get("errors", 0)

                await asyncio.sleep(1.5)

                r2 = await svc.sync_recent_results(db)
                details.append(f"Results [{r2.get('competition', '?')}]: {r2.get('created_results', 0)} results, {r2.get('updated_matches', r2.get('updated', 0))} upd")
                total_updated += r2.get("created_results", 0)
                total_errors += r2.get("errors", 0)

                await asyncio.sleep(1.5)

                r3 = await svc.sync_standings(db)
                details.append(f"Standings [{r3.get('competition', '?')}]: {r3.get('rows_saved', 0)} rows")
                total_updated += r3.get("rows_saved", 0)
                total_errors += r3.get("errors", 0)

                await db.commit()
                await asyncio.sleep(1.5)
        except Exception as exc:
            details.append(f"League {i+1} FAILED: {exc}")
            total_errors += 1
            log.error("Full sync league %d failed: %s", i+1, exc)

    return FullSyncResponse(
        total_created=total_created,
        total_updated=total_updated,
        total_errors=total_errors,
        leagues_synced=6,
        details=details,
    )


@router.post(
    "/regenerate-predictions",
    status_code=status.HTTP_200_OK,
    summary="Delete all predictions and regenerate with current data",
)
async def regenerate_predictions(
    days: int = Body(default=7, embed=True),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete ALL existing predictions and regenerate from scratch.
    Use after a full data sync to get predictions based on real form/standings.
    """
    import logging
    from datetime import datetime, timedelta, timezone
    from app.forecasting.forecast_service import ForecastService
    from app.models.match import Match, MatchStatus
    from app.models.model_version import ModelVersion
    from app.models.prediction import Prediction, PredictionExplanation

    log = logging.getLogger(__name__)

    # Delete all existing predictions + explanations
    del_expl = await db.execute(
        select(PredictionExplanation.id).join(
            Prediction, Prediction.id == PredictionExplanation.prediction_id
        )
    )
    expl_ids = del_expl.scalars().all()

    from sqlalchemy import delete
    if expl_ids:
        await db.execute(
            delete(PredictionExplanation).where(PredictionExplanation.id.in_(expl_ids))
        )
    await db.execute(delete(Prediction))
    await db.flush()
    log.info("Deleted all predictions for regeneration")

    # Ensure ModelVersion
    mv_result = await db.execute(
        select(ModelVersion).where(ModelVersion.is_active.is_(True)).limit(1)
    )
    if mv_result.scalar_one_or_none() is None:
        mv = ModelVersion(
            id=uuid.uuid4(),
            name="BetsPlug Ensemble v1",
            version="1.0.0",
            model_type="ensemble",
            sport_scope="all",
            description="Default ensemble: Elo + Poisson + Logistic",
            hyperparameters={"weights": {"elo": 1.0, "poisson": 1.5, "logistic": 1.0}},
            training_metrics={"note": "cold-start defaults"},
            trained_at=datetime.now(timezone.utc),
            is_active=True,
        )
        db.add(mv)
        await db.flush()

    # Generate fresh predictions
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(days=days)
    matches_result = await db.execute(
        select(Match).where(
            Match.status.in_([MatchStatus.SCHEDULED, MatchStatus.LIVE]),
            Match.scheduled_at >= now,
            Match.scheduled_at <= cutoff,
        ).order_by(Match.scheduled_at)
    )
    matches = matches_result.scalars().all()

    service = ForecastService()
    generated, errors = 0, 0
    details = []

    for match in matches:
        try:
            home = match.home_team.name if match.home_team else "?"
            away = match.away_team.name if match.away_team else "?"
            await service.generate_forecast(match.id, db)
            generated += 1
            details.append(f"OK: {home} vs {away}")
        except Exception as exc:
            errors += 1
            details.append(f"FAIL: {match.id} — {exc}")

    await db.commit()

    return {
        "deleted_old": True,
        "total_matches": len(matches),
        "predictions_generated": generated,
        "errors": errors,
        "details": details[:20],
    }


class GeneratePredictionsResponse(BaseModel):
    total_matches: int
    predictions_generated: int
    errors: int
    details: List[str]


@router.post(
    "/generate-predictions",
    response_model=GeneratePredictionsResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate predictions for all upcoming matches without one",
)
async def generate_predictions(
    days: int = Body(default=7, embed=True, description="Days ahead to look for matches"),
    db: AsyncSession = Depends(get_db),
) -> GeneratePredictionsResponse:
    """
    Batch-generate predictions for all upcoming matches that don't have one yet.
    Creates a default ModelVersion (ensemble) if none exists.
    """
    import logging
    from datetime import datetime, timedelta, timezone

    from app.forecasting.forecast_service import ForecastService
    from app.models.match import Match, MatchStatus
    from app.models.model_version import ModelVersion
    from app.models.prediction import Prediction

    log = logging.getLogger(__name__)

    # --- Ensure a default ModelVersion exists ----------------------------- #
    mv_result = await db.execute(
        select(ModelVersion).where(ModelVersion.is_active.is_(True)).limit(1)
    )
    model_version = mv_result.scalar_one_or_none()

    if model_version is None:
        log.info("No active ModelVersion found — creating default ensemble.")
        model_version = ModelVersion(
            id=uuid.uuid4(),
            name="BetsPlug Ensemble v1",
            version="1.0.0",
            model_type="ensemble",
            sport_scope="all",
            description="Default ensemble: Elo + Poisson + Logistic weighted average",
            hyperparameters={
                "weights": {"elo": 1.0, "poisson": 1.5, "logistic": 1.0},
            },
            training_metrics={"note": "cold-start defaults, no trained weights"},
            trained_at=datetime.now(timezone.utc),
            is_active=True,
        )
        db.add(model_version)
        await db.flush()

    # --- Find upcoming matches without predictions ------------------------ #
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(days=days)

    # Get matches that are scheduled and within range
    matches_result = await db.execute(
        select(Match)
        .where(
            Match.status.in_([MatchStatus.SCHEDULED, MatchStatus.LIVE]),
            Match.scheduled_at >= now,
            Match.scheduled_at <= cutoff,
        )
        .order_by(Match.scheduled_at)
    )
    all_matches = matches_result.scalars().all()

    # Filter out matches that already have predictions
    match_ids = [m.id for m in all_matches]
    if match_ids:
        existing_result = await db.execute(
            select(Prediction.match_id).where(Prediction.match_id.in_(match_ids)).distinct()
        )
        existing_match_ids = set(existing_result.scalars().all())
    else:
        existing_match_ids = set()

    matches_to_predict = [m for m in all_matches if m.id not in existing_match_ids]

    # --- Generate predictions ---------------------------------------------- #
    service = ForecastService()
    generated = 0
    errors = 0
    details: List[str] = []

    for match in matches_to_predict:
        try:
            home_name = match.home_team.name if match.home_team else "?"
            away_name = match.away_team.name if match.away_team else "?"
            await service.generate_forecast(match.id, db)
            generated += 1
            details.append(f"OK: {home_name} vs {away_name}")
        except Exception as exc:
            errors += 1
            details.append(f"FAIL: {match.id} — {exc}")
            log.warning("Prediction failed for match %s: %s", match.id, exc)

    await db.commit()

    return GeneratePredictionsResponse(
        total_matches=len(all_matches),
        predictions_generated=generated,
        errors=errors,
        details=details,
    )


class PipelineHealthResponse(BaseModel):
    """Diagnostic snapshot of the prediction pipeline.

    Renders a single verdict (``diagnosis``) plus the raw counters that led
    to it, so an admin can tell in one glance whether the
    ``generate-predictions-every-10m`` Celery-beat task is actually
    producing pre-match forecasts or has silently fallen behind.
    """

    diagnosis: str  # "healthy" | "no_model" | "stale" | "partial" | "filtered_out" | "unknown"
    message: str
    active_model_versions: int
    predictions_last_1h: int
    predictions_last_24h: int
    latest_predicted_at: Optional[datetime]
    # Raw coverage (any prediction row, no filter)
    upcoming_matches_7d: int
    upcoming_with_prediction: int
    recent_finished_2d: int
    recent_finished_with_prediction: int
    # User-visible coverage (after trackrecord_filter — same as the public
    # endpoints /fixtures/results, /bet-of-the-day, /trackrecord/summary)
    upcoming_visible: int
    recent_finished_visible: int
    # Prediction-source breakdown over last 24h (live, backtest, batch_local_fill, ...)
    source_breakdown_24h: Dict[str, int]
    # Post-kickoff predictions in last 24h: filtered out by trackrecord_filter
    post_kickoff_24h: int
    pre_kickoff_24h: int


@router.get(
    "/pipeline-health",
    response_model=PipelineHealthResponse,
    summary="Snapshot of the prediction pipeline (models, recent output, coverage)",
)
async def pipeline_health(
    db: AsyncSession = Depends(get_db),
) -> PipelineHealthResponse:
    """Return a one-glance diagnosis of whether predictions are flowing.

    Checks, in order:

    1. Is there an active ``ModelVersion`` row? If not → ``no_model`` (the
       ``generate_forecast`` path raises ``ValueError`` and every
       Celery-beat fire counts as a silent failure).
    2. How many predictions have been inserted in the last hour / 24h?
       A live pipeline should produce at least a handful per day during
       European football hours.
    3. What fraction of the next 7 days of scheduled matches already has
       a prediction? Below ~50% is suspicious.
    4. What fraction of the last 2 days of finished matches had one?
       Near-zero means the Celery job missed its pre-match window.

    Verdict:

    - ``healthy``  — active model + coverage ≥50% both sides
    - ``no_model`` — no active ModelVersion row
    - ``stale``    — active model but 0 predictions in the last 24 h
    - ``partial``  — active model, some recent output, but coverage <50%
    - ``unknown``  — none of the above (e.g. no matches in range)
    """
    from datetime import timedelta
    from sqlalchemy import func

    from app.core.prediction_filters import trackrecord_filter
    from app.models.match import Match, MatchStatus
    from app.models.model_version import ModelVersion
    from app.models.prediction import Prediction

    now = datetime.now(timezone.utc)
    one_hour_ago = now - timedelta(hours=1)
    one_day_ago = now - timedelta(hours=24)
    seven_days_ahead = now + timedelta(days=7)
    two_days_ago = now - timedelta(days=2)

    active_mv_count = (
        await db.execute(
            select(func.count(ModelVersion.id)).where(ModelVersion.is_active.is_(True))
        )
    ).scalar_one()

    pred_1h = (
        await db.execute(
            select(func.count(Prediction.id)).where(Prediction.created_at >= one_hour_ago)
        )
    ).scalar_one()

    pred_24h = (
        await db.execute(
            select(func.count(Prediction.id)).where(Prediction.created_at >= one_day_ago)
        )
    ).scalar_one()

    latest_pa = (
        await db.execute(select(func.max(Prediction.predicted_at)))
    ).scalar_one()

    upcoming_total = (
        await db.execute(
            select(func.count(Match.id)).where(
                Match.status == MatchStatus.SCHEDULED,
                Match.scheduled_at >= now,
                Match.scheduled_at <= seven_days_ahead,
            )
        )
    ).scalar_one()

    upcoming_with_pred = (
        await db.execute(
            select(func.count(func.distinct(Match.id)))
            .select_from(Match)
            .join(Prediction, Prediction.match_id == Match.id)
            .where(
                Match.status == MatchStatus.SCHEDULED,
                Match.scheduled_at >= now,
                Match.scheduled_at <= seven_days_ahead,
            )
        )
    ).scalar_one()

    # Same query but with the public trackrecord_filter applied — this is what
    # the user-facing endpoints actually see.
    upcoming_visible = (
        await db.execute(
            select(func.count(func.distinct(Match.id)))
            .select_from(Match)
            .join(Prediction, Prediction.match_id == Match.id)
            .where(
                Match.status == MatchStatus.SCHEDULED,
                Match.scheduled_at >= now,
                Match.scheduled_at <= seven_days_ahead,
                trackrecord_filter(),
            )
        )
    ).scalar_one()

    recent_finished = (
        await db.execute(
            select(func.count(Match.id)).where(
                Match.status == MatchStatus.FINISHED,
                Match.scheduled_at >= two_days_ago,
                Match.scheduled_at <= now,
            )
        )
    ).scalar_one()

    recent_finished_with_pred = (
        await db.execute(
            select(func.count(func.distinct(Match.id)))
            .select_from(Match)
            .join(Prediction, Prediction.match_id == Match.id)
            .where(
                Match.status == MatchStatus.FINISHED,
                Match.scheduled_at >= two_days_ago,
                Match.scheduled_at <= now,
            )
        )
    ).scalar_one()

    recent_finished_visible = (
        await db.execute(
            select(func.count(func.distinct(Match.id)))
            .select_from(Match)
            .join(Prediction, Prediction.match_id == Match.id)
            .where(
                Match.status == MatchStatus.FINISHED,
                Match.scheduled_at >= two_days_ago,
                Match.scheduled_at <= now,
                trackrecord_filter(),
            )
        )
    ).scalar_one()

    # Source breakdown over last 24h
    source_rows = (
        await db.execute(
            select(
                func.coalesce(Prediction.prediction_source, "__null__"),
                func.count(Prediction.id),
            )
            .where(Prediction.created_at >= one_day_ago)
            .group_by(Prediction.prediction_source)
        )
    ).all()
    source_breakdown: Dict[str, int] = {str(label): int(n) for label, n in source_rows}

    # Pre- vs post-kickoff split over last 24h
    pre_kickoff_24h = (
        await db.execute(
            select(func.count(Prediction.id))
            .select_from(Prediction)
            .join(Match, Match.id == Prediction.match_id)
            .where(
                Prediction.created_at >= one_day_ago,
                Prediction.predicted_at <= Match.scheduled_at,
            )
        )
    ).scalar_one()

    post_kickoff_24h = (
        await db.execute(
            select(func.count(Prediction.id))
            .select_from(Prediction)
            .join(Match, Match.id == Prediction.match_id)
            .where(
                Prediction.created_at >= one_day_ago,
                Prediction.predicted_at > Match.scheduled_at,
            )
        )
    ).scalar_one()

    raw_upcoming_pct = (upcoming_with_pred / upcoming_total) if upcoming_total else None
    raw_recent_pct = (recent_finished_with_pred / recent_finished) if recent_finished else None
    vis_upcoming_pct = (upcoming_visible / upcoming_total) if upcoming_total else None
    vis_recent_pct = (recent_finished_visible / recent_finished) if recent_finished else None

    if active_mv_count == 0:
        diagnosis = "no_model"
        message = (
            "No active ModelVersion row. generate_forecast() raises "
            "ValueError on every call, so the Celery-beat task silently "
            "fails. Seed a model via POST /admin/generate-predictions or "
            "re-activate the v8.1 row."
        )
    elif pred_24h == 0:
        diagnosis = "stale"
        message = (
            "Active model present, but 0 predictions in the last 24h. "
            "Likely causes: Celery-beat is not running on Railway, the "
            "'forecasting' queue has no worker, or the task is erroring "
            "silently. Check Railway logs for 'task_generate_predictions'."
        )
    elif (
        (raw_upcoming_pct is not None and raw_upcoming_pct >= 0.5)
        or (raw_recent_pct is not None and raw_recent_pct >= 0.5)
    ) and (
        (vis_upcoming_pct is not None and vis_upcoming_pct < 0.1)
        and (vis_recent_pct is not None and vis_recent_pct < 0.1)
    ):
        # Raw rows exist but the public filter is throwing almost all of them
        # away. Build an explanation pointing at the exact reason.
        reasons = []
        if post_kickoff_24h > 0 and post_kickoff_24h >= pre_kickoff_24h:
            reasons.append(
                f"{post_kickoff_24h} of {pre_kickoff_24h + post_kickoff_24h} predictions "
                "in the last 24h were made AFTER kickoff (predicted_at > "
                "scheduled_at) and are excluded from user-facing aggregates"
            )
        bad_sources = [
            k for k in source_breakdown
            if k not in ("live", "backtest", "batch_local_fill")
        ]
        if bad_sources:
            reasons.append(
                f"prediction_source values outside the allowlist: {bad_sources}"
            )
        diagnosis = "filtered_out"
        message = (
            "Predictions ARE being generated but the public track record "
            "filter rejects them. " + (" ; ".join(reasons) if reasons else "")
        )
    else:
        if (raw_upcoming_pct is None or raw_upcoming_pct >= 0.5) and (
            raw_recent_pct is None or raw_recent_pct >= 0.5
        ):
            diagnosis = "healthy"
            message = "Pipeline is producing forecasts on schedule."
        elif upcoming_total == 0 and recent_finished == 0:
            diagnosis = "unknown"
            message = (
                "No matches in either window — nothing to score. "
                "Re-check in a few hours once the ingestion cron has run."
            )
        else:
            diagnosis = "partial"
            message = (
                f"Coverage: {upcoming_with_pred}/{upcoming_total} upcoming, "
                f"{recent_finished_with_pred}/{recent_finished} recent finished. "
                "Pipeline is running but missing its pre-match window for "
                "most matches — check the cron cadence vs. ingestion timing."
            )

    return PipelineHealthResponse(
        diagnosis=diagnosis,
        message=message,
        active_model_versions=active_mv_count,
        predictions_last_1h=pred_1h,
        predictions_last_24h=pred_24h,
        latest_predicted_at=latest_pa,
        upcoming_matches_7d=upcoming_total,
        upcoming_with_prediction=upcoming_with_pred,
        recent_finished_2d=recent_finished,
        recent_finished_with_prediction=recent_finished_with_pred,
        upcoming_visible=upcoming_visible,
        recent_finished_visible=recent_finished_visible,
        source_breakdown_24h=source_breakdown,
        post_kickoff_24h=post_kickoff_24h,
        pre_kickoff_24h=pre_kickoff_24h,
    )


class SeedStrategiesResponse(BaseModel):
    strategies: List[Dict[str, Any]]
    message: str


@router.post(
    "/seed-strategies",
    response_model=SeedStrategiesResponse,
    status_code=status.HTTP_200_OK,
    summary="Seed default betting strategies",
)
async def seed_strategies(
    db: AsyncSession = Depends(get_db),
) -> SeedStrategiesResponse:
    """
    Insert the four default betting strategies if they don't already exist.
    Idempotent: safe to call multiple times.
    """
    from seed.seed_strategies import seed_strategies_async

    results = await seed_strategies_async(db)
    created = sum(1 for r in results if r["status"] == "created")
    skipped = sum(1 for r in results if r["status"] == "exists")

    return SeedStrategiesResponse(
        strategies=results,
        message=f"Seed complete: {created} created, {skipped} already existed.",
    )


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
