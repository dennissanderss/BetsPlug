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


class LiveMeasurementFunnel(BaseModel):
    """Counts at each filter of the ``/trackrecord/live-measurement`` query.

    Makes it obvious which filter is responsible when the public live
    measurement shows 0/0 — typically ``pre_match_predictions`` collapses
    because the ingestion run imports a fixture after kickoff, so the
    prediction is created with ``predicted_at >= scheduled_at`` and gets
    silently dropped from the surface.
    """

    start_date: str
    now: datetime
    finished_matches_since_start: int
    finished_matches_with_any_prediction: int
    live_predictions_since_start: int
    pre_match_live_predictions: int
    pre_match_live_predictions_evaluated: int
    upcoming_matches_7d: int
    upcoming_matches_7d_with_live_pred: int
    latest_prediction_created_at: Optional[datetime]
    latest_prediction_predicted_at: Optional[datetime]
    latest_evaluation_created_at: Optional[datetime]
    sample_late_predictions: List[Dict[str, Any]]


class CacheFlushResponse(BaseModel):
    flushed: Dict[str, int]
    total: int


class JobTriggerResponse(BaseModel):
    triggered: str
    ok: bool
    detail: Optional[str] = None


class MatchStatusByDate(BaseModel):
    """One row per (date, status) — shows whether matches from a given
    day are stuck on SCHEDULED instead of transitioning to FINISHED."""

    day: str  # YYYY-MM-DD
    status: str
    count: int


class MatchStatusBreakdownResponse(BaseModel):
    """Per-day match-status counts for the last N days.

    Use this to diagnose "results page stops on day X" — if day X+1 has
    matches stuck on SCHEDULED after kickoff passed, sync_recent_results
    is failing for that league range.
    """

    days_back: int
    rows: List[MatchStatusByDate]
    totals_by_status: Dict[str, int]
    stuck_scheduled_past_kickoff: int
    last_finished_match_day: Optional[str]


class PredictionGenerationTestResponse(BaseModel):
    """Result of a single-match forecast generation attempt.

    Used to surface exceptions from the forecasting pipeline — the
    APScheduler ``job_generate_predictions`` swallows these as warnings
    so ``job_sync_data`` + ``job_generate_predictions`` can appear
    healthy while literally zero predictions are being written.
    """

    match_id: Optional[str] = None
    league: Optional[str] = None
    home_team: Optional[str] = None
    away_team: Optional[str] = None
    scheduled_at: Optional[str] = None
    ok: bool
    prediction_id: Optional[str] = None
    confidence: Optional[float] = None
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    traceback: Optional[str] = None


class IngestionDiagnosisResponse(BaseModel):
    """Per-league diagnostic for ``sync_upcoming_matches``.

    Surfaces the exact API-Football error when the sync returns zero
    matches. The scheduler's own ``job_sync_data`` swallows every
    exception (so one bad league doesn't kill the whole run), which
    is correct for production but useless for debugging. This endpoint
    runs one league synchronously and returns the full stack-trace +
    upstream errors dict on failure.
    """
    league: str
    ok: bool
    created: int
    updated: int
    errors: int
    matches_returned_by_api: int
    error_type: Optional[str] = None
    error_message: Optional[str] = None


@router.post(
    "/trigger-job",
    response_model=JobTriggerResponse,
    summary="Run an APScheduler job immediately (diagnostic / manual backfill)",
)
async def trigger_scheduler_job(
    job_id: str = Query(
        ...,
        description=(
            "One of: generate_predictions, evaluate_predictions, "
            "historical_predictions, sync_data."
        ),
    ),
) -> JobTriggerResponse:
    """Kick off a scheduler job outside its normal cadence.

    Useful for: manual backfill after a deploy, catching up on missed
    evaluations, or verifying a job actually runs without waiting up
    to 20 min for the next scheduled firing.
    """
    from app.services import scheduler as scheduler_module

    job_map = {
        "generate_predictions": scheduler_module.job_generate_predictions,
        "evaluate_predictions": scheduler_module.job_evaluate_predictions,
        "historical_predictions": scheduler_module.job_generate_historical_predictions,
        "sync_data": scheduler_module.job_sync_data,
    }
    fn = job_map.get(job_id)
    if fn is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"unknown job_id '{job_id}', expected one of {list(job_map)}",
        )
    try:
        await fn()
        return JobTriggerResponse(triggered=job_id, ok=True)
    except Exception as exc:
        return JobTriggerResponse(
            triggered=job_id, ok=False, detail=f"{type(exc).__name__}: {exc}"
        )


@router.get(
    "/match-status-breakdown",
    response_model=MatchStatusBreakdownResponse,
    summary="Count matches by (date, status) over the last N days",
)
async def match_status_breakdown(
    days_back: int = Query(default=14, ge=1, le=60),
    db: AsyncSession = Depends(get_db),
) -> MatchStatusBreakdownResponse:
    """Return per-day, per-status match counts to diagnose data gaps.

    Symptom we're diagnosing: results page shows finished matches up to
    day X, then nothing. Hypothesis: day X+1 onwards has matches in DB
    but stuck on status=SCHEDULED because sync_recent_results never
    updated them. This endpoint makes that visible instantly — one glance
    shows per-day where the SCHEDULED→FINISHED transition is failing.
    """
    from datetime import timedelta
    from sqlalchemy import func, cast, Date, and_
    from app.models.match import Match, MatchStatus

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=days_back)

    # Per-day, per-status count
    stmt = (
        select(
            cast(Match.scheduled_at, Date).label("day"),
            Match.status,
            func.count(Match.id).label("n"),
        )
        .where(Match.scheduled_at >= cutoff)
        .where(Match.scheduled_at <= now + timedelta(days=1))
        .group_by(cast(Match.scheduled_at, Date), Match.status)
        .order_by(cast(Match.scheduled_at, Date).desc(), Match.status)
    )
    rows = (await db.execute(stmt)).all()

    per_day: List[MatchStatusByDate] = []
    totals: Dict[str, int] = {}
    for day, status_enum, n in rows:
        status_str = (
            status_enum.value if hasattr(status_enum, "value") else str(status_enum)
        )
        per_day.append(
            MatchStatusByDate(day=day.isoformat(), status=status_str, count=int(n))
        )
        totals[status_str] = totals.get(status_str, 0) + int(n)

    # Matches stuck on SCHEDULED past kickoff (> 3h ago = definitely started
    # by now)
    stuck_cutoff = now - timedelta(hours=3)
    stuck_stmt = select(func.count(Match.id)).where(
        and_(
            Match.status == MatchStatus.SCHEDULED,
            Match.scheduled_at <= stuck_cutoff,
            Match.scheduled_at >= cutoff,
        )
    )
    stuck = int((await db.execute(stuck_stmt)).scalar() or 0)

    # Most recent day with at least one FINISHED match
    last_fin_stmt = (
        select(func.max(cast(Match.scheduled_at, Date)))
        .where(Match.status == MatchStatus.FINISHED)
        .where(Match.scheduled_at >= cutoff)
    )
    last_fin = (await db.execute(last_fin_stmt)).scalar()
    last_fin_iso = last_fin.isoformat() if last_fin else None

    return MatchStatusBreakdownResponse(
        days_back=days_back,
        rows=per_day,
        totals_by_status=totals,
        stuck_scheduled_past_kickoff=stuck,
        last_finished_match_day=last_fin_iso,
    )


@router.post(
    "/test-prediction-generation",
    response_model=PredictionGenerationTestResponse,
    summary="Generate one prediction synchronously and return the exact error on failure",
)
async def test_prediction_generation(
    db: AsyncSession = Depends(get_db),
) -> PredictionGenerationTestResponse:
    """Pick the first upcoming match without a LIVE prediction and try to
    generate one synchronously. Returns the full traceback on failure.

    APScheduler's ``job_generate_predictions`` wraps every forecast call
    in a ``try/except`` that logs a warning and moves on. When every
    forecast raises (feature-pipeline bug, missing model, schema drift)
    the scheduler LOOKS healthy but writes zero rows — that's exactly
    how a 5-day prediction gap hides behind a green scheduler dashboard.

    Use this endpoint to get the actual exception.
    """
    import traceback as _tb
    from datetime import timedelta
    from sqlalchemy import and_
    from app.models.match import Match, MatchStatus
    from app.models.prediction import Prediction

    now = datetime.now(timezone.utc)

    # Find the first upcoming match without a 'live' prediction
    sub = select(Prediction.match_id).where(
        Prediction.prediction_source == "live"
    ).subquery()
    stmt = (
        select(Match)
        .where(
            and_(
                Match.status.in_([MatchStatus.SCHEDULED, MatchStatus.LIVE]),
                Match.scheduled_at >= now,
                Match.scheduled_at <= now + timedelta(days=7),
                ~Match.id.in_(select(sub.c.match_id)),
            )
        )
        .order_by(Match.scheduled_at)
        .limit(1)
    )
    match = (await db.execute(stmt)).scalar_one_or_none()

    if match is None:
        return PredictionGenerationTestResponse(
            ok=False,
            error_type="NoMatchAvailable",
            error_message=(
                "No upcoming match without a live prediction found in the "
                "next 7 days. Either every upcoming match already has a "
                "live prediction (generator is working) or the match "
                "ingestion has produced nothing for this week."
            ),
        )

    from app.forecasting.forecast_service import ForecastService

    try:
        service = ForecastService()
        prediction = await service.generate_forecast(match.id, db, source="live")
        await db.commit()
        return PredictionGenerationTestResponse(
            match_id=str(match.id),
            league=(
                match.league.slug if getattr(match, "league", None) else None
            ),
            home_team=(
                match.home_team.name if getattr(match, "home_team", None) else None
            ),
            away_team=(
                match.away_team.name if getattr(match, "away_team", None) else None
            ),
            scheduled_at=match.scheduled_at.isoformat(),
            ok=True,
            prediction_id=str(prediction.id),
            confidence=float(prediction.confidence or 0),
        )
    except Exception as exc:
        await db.rollback()
        return PredictionGenerationTestResponse(
            match_id=str(match.id),
            league=(
                match.league.slug if getattr(match, "league", None) else None
            ),
            home_team=(
                match.home_team.name if getattr(match, "home_team", None) else None
            ),
            away_team=(
                match.away_team.name if getattr(match, "away_team", None) else None
            ),
            scheduled_at=match.scheduled_at.isoformat(),
            ok=False,
            error_type=type(exc).__name__,
            error_message=str(exc),
            traceback=_tb.format_exc(),
        )


@router.post(
    "/diagnose-ingestion",
    response_model=IngestionDiagnosisResponse,
    summary="Run a single-league sync_upcoming_matches and surface the exact error",
)
async def diagnose_ingestion(
    league_slug: str = Query(
        default="premier-league",
        description=(
            "Internal league slug to test (default: premier-league). "
            "Available: premier-league, la-liga, bundesliga, serie-a, "
            "ligue-1, eredivisie, etc."
        ),
    ),
    db: AsyncSession = Depends(get_db),
) -> IngestionDiagnosisResponse:
    """Execute ``sync_upcoming_matches`` for ONE league and return the raw
    outcome — including the upstream API-Football errors payload if any.

    This bypasses ``job_sync_data``'s blanket exception handler, so an
    invalid plan / quota / token failure shows up with its exact message
    instead of being logged-and-forgotten. Use this when the scheduler
    says it ran successfully but no new matches land in the database.
    """
    from app.services.data_sync_service import DataSyncService

    try:
        async with DataSyncService() as svc:
            result = await svc.sync_upcoming_matches_for_slug(db, league_slug)
            await db.commit()
        return IngestionDiagnosisResponse(
            league=league_slug,
            ok=result.get("errors", 0) == 0,
            created=result.get("created", 0),
            updated=result.get("updated", 0),
            errors=result.get("errors", 0),
            matches_returned_by_api=result.get("api_returned", 0),
            error_type=result.get("error_type"),
            error_message=result.get("error_message"),
        )
    except Exception as exc:
        return IngestionDiagnosisResponse(
            league=league_slug,
            ok=False,
            created=0,
            updated=0,
            errors=1,
            matches_returned_by_api=0,
            error_type=type(exc).__name__,
            error_message=str(exc),
        )


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
    "/live-measurement-funnel",
    response_model=LiveMeasurementFunnel,
    summary="Diagnose why /trackrecord/live-measurement shows 0/0",
)
async def live_measurement_funnel(
    db: AsyncSession = Depends(get_db),
) -> LiveMeasurementFunnel:
    """Return the drop-off at every filter of the live-measurement query.

    The public surface applies four cumulative filters and stays at 0/0 if
    any one collapses. This endpoint reports the row count at each step so
    we can tell at a glance whether the issue is: no finished matches yet
    (paasperiode / end-of-season), the scheduler not running on Railway,
    fixtures imported after kickoff (``predicted_at >= scheduled_at``), or
    the evaluation job lagging behind final whistle.
    """
    from datetime import timedelta
    from sqlalchemy import and_, func

    from app.api.routes.trackrecord import LIVE_MEASUREMENT_START
    from app.models.match import Match, MatchStatus
    from app.models.prediction import Prediction, PredictionEvaluation

    now = datetime.now(timezone.utc)
    seven_days_ahead = now + timedelta(days=7)

    finished_since_start = (
        await db.execute(
            select(func.count(Match.id)).where(
                Match.status == MatchStatus.FINISHED,
                Match.scheduled_at >= LIVE_MEASUREMENT_START,
            )
        )
    ).scalar_one()

    finished_with_any_pred = (
        await db.execute(
            select(func.count(func.distinct(Match.id)))
            .select_from(Match)
            .join(Prediction, Prediction.match_id == Match.id)
            .where(
                Match.status == MatchStatus.FINISHED,
                Match.scheduled_at >= LIVE_MEASUREMENT_START,
            )
        )
    ).scalar_one()

    live_preds_since_start = (
        await db.execute(
            select(func.count(Prediction.id)).where(
                Prediction.prediction_source == "live",
                Prediction.created_at >= LIVE_MEASUREMENT_START,
            )
        )
    ).scalar_one()

    pre_match_live = (
        await db.execute(
            select(func.count(Prediction.id))
            .join(Match, Match.id == Prediction.match_id)
            .where(
                Prediction.prediction_source == "live",
                Prediction.created_at >= LIVE_MEASUREMENT_START,
                Prediction.predicted_at < Match.scheduled_at,
            )
        )
    ).scalar_one()

    pre_match_live_evaluated = (
        await db.execute(
            select(func.count(PredictionEvaluation.id))
            .select_from(PredictionEvaluation)
            .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
            .join(Match, Match.id == Prediction.match_id)
            .where(
                Prediction.prediction_source == "live",
                Prediction.created_at >= LIVE_MEASUREMENT_START,
                Prediction.predicted_at < Match.scheduled_at,
            )
        )
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

    upcoming_with_live = (
        await db.execute(
            select(func.count(func.distinct(Match.id)))
            .select_from(Match)
            .join(Prediction, Prediction.match_id == Match.id)
            .where(
                Match.status == MatchStatus.SCHEDULED,
                Match.scheduled_at >= now,
                Match.scheduled_at <= seven_days_ahead,
                Prediction.prediction_source == "live",
            )
        )
    ).scalar_one()

    latest_pred_created = (
        await db.execute(select(func.max(Prediction.created_at)))
    ).scalar_one()
    latest_pred_predicted = (
        await db.execute(select(func.max(Prediction.predicted_at)))
    ).scalar_one()
    latest_eval_created = (
        await db.execute(select(func.max(PredictionEvaluation.created_at)))
    ).scalar_one()

    # Up to 5 recent 'live' predictions that were created AFTER kickoff —
    # if this list is non-empty it confirms the ingestion window is the
    # cause of the empty live measurement.
    late_stmt = (
        select(
            Prediction.id,
            Prediction.match_id,
            Prediction.predicted_at,
            Match.scheduled_at,
            Match.status,
        )
        .join(Match, Match.id == Prediction.match_id)
        .where(
            Prediction.prediction_source == "live",
            Prediction.created_at >= LIVE_MEASUREMENT_START,
            Prediction.predicted_at >= Match.scheduled_at,
        )
        .order_by(Prediction.created_at.desc())
        .limit(5)
    )
    late_rows = (await db.execute(late_stmt)).all()
    sample_late = [
        {
            "prediction_id": str(r.id),
            "match_id": str(r.match_id),
            "predicted_at": r.predicted_at.isoformat() if r.predicted_at else None,
            "scheduled_at": r.scheduled_at.isoformat() if r.scheduled_at else None,
            "minutes_late": (
                int((r.predicted_at - r.scheduled_at).total_seconds() // 60)
                if (r.predicted_at and r.scheduled_at)
                else None
            ),
            "match_status": r.status.value if r.status else None,
        }
        for r in late_rows
    ]

    return LiveMeasurementFunnel(
        start_date=LIVE_MEASUREMENT_START.date().isoformat(),
        now=now,
        finished_matches_since_start=int(finished_since_start or 0),
        finished_matches_with_any_prediction=int(finished_with_any_pred or 0),
        live_predictions_since_start=int(live_preds_since_start or 0),
        pre_match_live_predictions=int(pre_match_live or 0),
        pre_match_live_predictions_evaluated=int(pre_match_live_evaluated or 0),
        upcoming_matches_7d=int(upcoming_total or 0),
        upcoming_matches_7d_with_live_pred=int(upcoming_with_live or 0),
        latest_prediction_created_at=latest_pred_created,
        latest_prediction_predicted_at=latest_pred_predicted,
        latest_evaluation_created_at=latest_eval_created,
        sample_late_predictions=sample_late,
    )


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

        # Surface the per-league errors message when the adapter
        # rejected the upstream call — otherwise admins only see
        # "0 new, 0 updated" and assume everything is healthy.
        upcoming_err = matches_result.get("error_message")
        league = matches_result.get("competition", "?")

        if upcoming_err:
            msg = (
                f"League {league}: {upcoming_err}. "
                f"Results: {results_result.get('created_results', 0)} new. "
                f"Standings: {standings_result.get('rows_upserted', 0)} rows."
            )
            return SyncResponse(accepted=False, message=msg, task_id=None)

        msg = (
            f"League {league}: "
            f"{matches_result.get('created', 0)} new, "
            f"{matches_result.get('updated', 0)} updated "
            f"(API returned {matches_result.get('api_returned', 0)} fixtures). "
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


# ---------------------------------------------------------------------------
# Regenerate v8.1 historical predictions on Railway's internal network
# ---------------------------------------------------------------------------
# Executes the same logic as backend/scripts/regenerate_historical_predictions.py
# but synchronously inside the Railway-deployed FastAPI process. Local script
# was bottlenecked at ~6 matches/min by Railway proxy round-trip latency
# (~150-200ms × ~10 RTTs per match). Inside Railway the latency is ~1ms,
# yielding 50-100 matches/min. 16k matches process in under 30 minutes
# instead of ~46 hours.
#
# Use a generous batch size (500-2000) per call. The endpoint returns when
# the batch is done. Idempotent — re-running picks up where the last batch
# left off. Long-running but FastAPI has no built-in timeout; the proxy
# might cut at 10 min (Railway default).


class RegenV81Request(BaseModel):
    start: str  # YYYY-MM-DD
    end: str    # YYYY-MM-DD
    limit: int = 1000


class RegenV81Response(BaseModel):
    matches_found: int
    generated: int
    failed: int
    evaluated: int
    elapsed_seconds: float
    finished: bool  # True when no more matches left in window


@router.post(
    "/regenerate-v81-historical",
    response_model=RegenV81Response,
    summary="Regenerate v8.1-clean predictions for finished matches in a date window",
)
async def regenerate_v81_historical(
    body: RegenV81Request,
    db: AsyncSession = Depends(get_db),
):
    """Run the v8.1 regenerate logic inside Railway. Internal-network speed.

    Body params:
      - start: YYYY-MM-DD inclusive (match scheduled_at)
      - end: YYYY-MM-DD inclusive
      - limit: max matches to process this call (default 1000)

    The call is synchronous — it processes up to ``limit`` matches and
    returns. Set Railway's request timeout high or call repeatedly with
    smaller limits if needed. ``finished=true`` when fewer matches than
    ``limit`` were found (= window is empty).
    """
    import time
    from datetime import date as _date, datetime as _dt, timedelta as _td
    from sqlalchemy import and_, exists as _exists
    from app.core.prediction_filters import V81_DEPLOYMENT_CUTOFF
    from app.forecasting.forecast_service import ForecastService
    from app.models.match import Match, MatchResult, MatchStatus
    from app.models.model_version import ModelVersion
    from app.models.prediction import Prediction, PredictionEvaluation

    t0 = time.monotonic()
    try:
        start_d = _dt.strptime(body.start, "%Y-%m-%d").date()
        end_d = _dt.strptime(body.end, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Bad date format: {exc}")

    start_dt = _dt.combine(start_d, _dt.min.time(), tzinfo=timezone.utc)
    end_dt = _dt.combine(end_d + _td(days=1), _dt.min.time(), tzinfo=timezone.utc)

    # Active model version required
    mv = (await db.execute(
        select(ModelVersion).where(ModelVersion.is_active.is_(True)).limit(1)
    )).scalar_one_or_none()
    if mv is None:
        raise HTTPException(status_code=500, detail="No active ModelVersion in DB")

    v81_pred_exists = _exists().where(
        and_(
            Prediction.match_id == Match.id,
            Prediction.created_at >= V81_DEPLOYMENT_CUTOFF,
            Prediction.predicted_at <= Match.scheduled_at,
        )
    )
    match_q = (
        select(Match.id, Match.scheduled_at)
        .where(
            Match.status == MatchStatus.FINISHED,
            Match.scheduled_at >= start_dt,
            Match.scheduled_at <= end_dt,
            ~v81_pred_exists,
        )
        .order_by(Match.scheduled_at)
        .limit(body.limit)
    )
    targets = (await db.execute(match_q)).all()

    svc = ForecastService()
    generated = 0
    failed = 0

    for match_id, scheduled_at in targets:
        try:
            pred = await svc.generate_forecast(match_id, db, source="backtest")
            pred.predicted_at = scheduled_at
            pred.match_scheduled_at = scheduled_at
            pred.lead_time_hours = 0.0
            pred.locked_at = None
            generated += 1
            if generated % 50 == 0:
                await db.commit()
        except Exception:
            failed += 1
    await db.commit()

    # Evaluate any new predictions in the window
    eval_stmt = (
        select(Prediction, MatchResult)
        .join(Match, Match.id == Prediction.match_id)
        .join(MatchResult, MatchResult.match_id == Match.id)
        .outerjoin(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .where(
            Prediction.created_at >= V81_DEPLOYMENT_CUTOFF,
            Prediction.predicted_at <= Match.scheduled_at,
            PredictionEvaluation.id.is_(None),
            Match.scheduled_at >= start_dt,
            Match.scheduled_at <= end_dt,
        )
    )
    eval_rows = (await db.execute(eval_stmt)).all()
    evaluated = 0
    for pred, result in eval_rows:
        try:
            hs, as_ = result.home_score, result.away_score
            actual = "home" if hs > as_ else ("away" if as_ > hs else "draw")
            probs = {
                "home": pred.home_win_prob or 0.0,
                "draw": pred.draw_prob or 0.0,
                "away": pred.away_win_prob or 0.0,
            }
            pick = max(probs, key=probs.get)
            is_correct = pick == actual
            actual_vec = {"home": 0, "draw": 0, "away": 0, actual: 1}
            brier = sum(
                (probs[k] - actual_vec[k]) ** 2 for k in ("home", "draw", "away")
            ) / 3
            db.add(PredictionEvaluation(
                prediction_id=pred.id,
                actual_outcome=actual,
                is_correct=is_correct,
                brier_score=brier,
                evaluated_at=datetime.now(timezone.utc),
            ))
            evaluated += 1
        except Exception:
            pass
    await db.commit()

    elapsed = round(time.monotonic() - t0, 2)
    return RegenV81Response(
        matches_found=len(targets),
        generated=generated,
        failed=failed,
        evaluated=evaluated,
        elapsed_seconds=elapsed,
        finished=len(targets) < body.limit,
    )
