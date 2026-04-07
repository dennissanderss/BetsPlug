"""Celery application configuration and task definitions.

Beat schedule
-------------
* run_weekly_report     – every Monday at 08:00 UTC
* run_monthly_report    – 1st of every month at 08:00 UTC

Registered tasks
----------------
* sip.ingestion.run_ingestion
* sip.forecasting.run_forecast_batch
* sip.evaluation.run_evaluation_batch
* sip.backtesting.run_backtest
* sip.reporting.generate_report

Each task handles its own DB session via a synchronous session factory
(Celery workers are synchronous; async tasks use asyncio.run()).
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from celery import Celery
from celery.schedules import crontab
from celery.utils.log import get_task_logger

from app.core.config import get_settings

logger = get_task_logger(__name__)
_settings = get_settings()


# ---------------------------------------------------------------------------
# Celery app factory
# ---------------------------------------------------------------------------


def create_celery_app() -> Celery:
    """Create and configure the Celery application."""
    app = Celery(
        "sports_intelligence",
        broker=_settings.celery_broker_url,
        backend=_settings.celery_result_backend,
        include=[
            "app.tasks.celery_app",
        ],
    )

    app.conf.update(
        # Serialisation
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],
        # Timezone
        timezone="UTC",
        enable_utc=True,
        # Task behaviour
        task_acks_late=True,
        task_reject_on_worker_lost=True,
        task_track_started=True,
        task_soft_time_limit=3600,    # 1 hour
        task_time_limit=7200,         # 2 hours hard limit
        worker_prefetch_multiplier=1,
        # Result expiry: keep results for 24 hours
        result_expires=86400,
        # Beat schedule
        beat_schedule={
            # Weekly report: every Monday at 08:00 UTC
            "weekly-report-monday-0800": {
                "task": "app.tasks.celery_app.task_generate_weekly_report",
                "schedule": crontab(hour=8, minute=0, day_of_week=1),
                "options": {"queue": "reports"},
            },
            # Monthly report: 1st of every month at 08:00 UTC
            "monthly-report-1st-0800": {
                "task": "app.tasks.celery_app.task_generate_monthly_report",
                "schedule": crontab(hour=8, minute=0, day_of_month=1),
                "options": {"queue": "reports"},
            },
            # ── Daily pipeline: ingest → forecast → evaluate ──
            # Morning sync: fetch latest data at 06:00 UTC
            "daily-ingest-0600": {
                "task": "app.tasks.celery_app.task_daily_pipeline",
                "schedule": crontab(hour=6, minute=0),
                "options": {"queue": "ingestion"},
            },
            # Midday refresh: catch updates + new matches at 12:00 UTC
            "midday-refresh-1200": {
                "task": "app.tasks.celery_app.task_daily_pipeline",
                "schedule": crontab(hour=12, minute=0),
                "options": {"queue": "ingestion"},
            },
            # Evening refresh: final update before peak hours at 17:00 UTC
            "evening-refresh-1700": {
                "task": "app.tasks.celery_app.task_daily_pipeline",
                "schedule": crontab(hour=17, minute=0),
                "options": {"queue": "ingestion"},
            },
        },
    )

    return app


celery_app = create_celery_app()


# ---------------------------------------------------------------------------
# Helper: synchronous DB session for Celery tasks
# ---------------------------------------------------------------------------


def _get_sync_session():
    """Return a synchronous SQLAlchemy session for use in Celery tasks."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(
        _settings.database_url_sync,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=2,
    )
    SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
    return SessionLocal()


def _run_async(coro):
    """Run an async coroutine in a Celery worker (synchronous context)."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Already inside an event loop (e.g., gevent/eventlet workers)
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                future = pool.submit(asyncio.run, coro)
                return future.result()
        else:
            return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


# ---------------------------------------------------------------------------
# Task: ingestion
# ---------------------------------------------------------------------------


@celery_app.task(
    name="app.tasks.celery_app.task_run_ingestion",
    bind=True,
    max_retries=3,
    default_retry_delay=300,
    queue="ingestion",
)
def task_run_ingestion(
    self,
    sport_slug: str = "all",
    league_slug: Optional[str] = None,
) -> dict:
    """Trigger data ingestion for a sport/league.

    Parameters
    ----------
    sport_slug:
        Sport to ingest (e.g. "football").  Use "all" for all sports.
    league_slug:
        Optional specific league.
    """
    logger.info(
        "Starting ingestion task",
        extra={"sport": sport_slug, "league": league_slug},
    )
    try:
        from app.db.session import async_session_factory
        from app.ingestion.ingestion_service import IngestionService  # type: ignore[import]

        async def _run():
            async with async_session_factory() as db:
                svc = IngestionService()
                result = await svc.ingest(
                    sport_slug=sport_slug,
                    league_slug=league_slug,
                    db=db,
                )
                await db.commit()
                return result

        result = _run_async(_run())
        logger.info("Ingestion completed", extra={"result": result})
        return {"status": "success", "result": result}

    except Exception as exc:
        logger.error("Ingestion failed: %s", exc)
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# Task: forecast batch
# ---------------------------------------------------------------------------


@celery_app.task(
    name="app.tasks.celery_app.task_run_forecast_batch",
    bind=True,
    max_retries=2,
    default_retry_delay=120,
    queue="forecasting",
)
def task_run_forecast_batch(
    self,
    match_ids: Optional[list] = None,
    sport_slug: Optional[str] = None,
    hours_ahead: int = 48,
) -> dict:
    """Generate forecasts for upcoming matches.

    Parameters
    ----------
    match_ids:
        Explicit list of match UUID strings.  If None, forecasts all
        upcoming matches within *hours_ahead* hours.
    sport_slug:
        Filter by sport when *match_ids* is None.
    hours_ahead:
        How many hours ahead to look for upcoming matches.
    """
    logger.info(
        "Starting forecast batch",
        extra={"match_count": len(match_ids) if match_ids else "all", "sport": sport_slug},
    )
    try:
        from app.db.session import async_session_factory
        from app.forecasting.forecast_service import ForecastService
        from sqlalchemy import and_, select
        from app.models.match import Match, MatchStatus

        async def _run():
            async with async_session_factory() as db:
                svc = ForecastService()

                if match_ids:
                    ids = [uuid.UUID(m) for m in match_ids]
                else:
                    # Fetch upcoming unforecasted matches
                    now = datetime.now(timezone.utc)
                    cutoff = now + __import__("datetime").timedelta(hours=hours_ahead)
                    stmt = (
                        select(Match)
                        .where(
                            and_(
                                Match.status == MatchStatus.SCHEDULED,
                                Match.scheduled_at >= now,
                                Match.scheduled_at <= cutoff,
                            )
                        )
                        .order_by(Match.scheduled_at)
                    )
                    if sport_slug:
                        from app.models.league import League
                        from app.models.sport import Sport
                        stmt = (
                            stmt.join(League, League.id == Match.league_id)
                            .join(Sport, Sport.id == League.sport_id)
                            .where(Sport.slug == sport_slug)
                        )
                    rows = (await db.execute(stmt)).scalars().all()
                    ids = [m.id for m in rows]

                successes = 0
                failures = 0
                for match_id in ids:
                    try:
                        await svc.generate_forecast(match_id, db)
                        successes += 1
                    except Exception as e:
                        logger.warning("Forecast failed for match %s: %s", match_id, e)
                        failures += 1

                await db.commit()
                return {"forecasted": successes, "failed": failures, "total": len(ids)}

        result = _run_async(_run())
        logger.info("Forecast batch completed", extra=result)
        return {"status": "success", **result}

    except Exception as exc:
        logger.error("Forecast batch failed: %s", exc)
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# Task: evaluation batch
# ---------------------------------------------------------------------------


@celery_app.task(
    name="app.tasks.celery_app.task_run_evaluation_batch",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="evaluation",
)
def task_run_evaluation_batch(
    self,
    prediction_ids: Optional[list] = None,
    days_back: int = 7,
) -> dict:
    """Evaluate recent predictions against actual results.

    Parameters
    ----------
    prediction_ids:
        Explicit list of prediction UUID strings.  If None, evaluates all
        unevaluated predictions from the last *days_back* days.
    days_back:
        How many days back to look for unevaluated predictions.
    """
    logger.info("Starting evaluation batch")
    try:
        from app.db.session import async_session_factory
        from app.evaluation.evaluation_service import EvaluationService
        from sqlalchemy import and_, select, not_, exists
        from app.models.prediction import Prediction, PredictionEvaluation
        from app.models.match import Match, MatchStatus
        import datetime as dt

        async def _run():
            async with async_session_factory() as db:
                svc = EvaluationService()

                if prediction_ids:
                    ids = [uuid.UUID(p) for p in prediction_ids]
                else:
                    cutoff = datetime.now(timezone.utc) - dt.timedelta(days=days_back)
                    # Find predictions whose match is finished and not yet evaluated
                    stmt = (
                        select(Prediction.id)
                        .join(Match, Match.id == Prediction.match_id)
                        .where(
                            and_(
                                Match.status == MatchStatus.FINISHED,
                                Prediction.predicted_at >= cutoff,
                                not_(
                                    exists(
                                        select(PredictionEvaluation.id).where(
                                            PredictionEvaluation.prediction_id == Prediction.id
                                        )
                                    )
                                ),
                            )
                        )
                    )
                    rows = (await db.execute(stmt)).scalars().all()
                    ids = list(rows)

                evaluations = await svc.evaluate_batch(ids, db)
                await db.commit()
                return {"evaluated": len(evaluations), "total_candidates": len(ids)}

        result = _run_async(_run())
        logger.info("Evaluation batch completed", extra=result)
        return {"status": "success", **result}

    except Exception as exc:
        logger.error("Evaluation batch failed: %s", exc)
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# Task: backtest
# ---------------------------------------------------------------------------


@celery_app.task(
    name="app.tasks.celery_app.task_run_backtest",
    bind=True,
    max_retries=1,
    default_retry_delay=60,
    queue="backtesting",
    soft_time_limit=7200,
)
def task_run_backtest(self, config: dict) -> dict:
    """Execute a walk-forward backtest.

    Parameters
    ----------
    config : dict
        Passed verbatim to ``BacktestService.run_backtest()``.
        Required keys: model_version_id, sport_slug, start_date, end_date.
        Optional: league_slug, name.
    """
    logger.info("Starting backtest", extra={"config": config})
    try:
        from app.db.session import async_session_factory
        from app.backtesting.backtest_service import BacktestService

        async def _run():
            async with async_session_factory() as db:
                svc = BacktestService()
                run = await svc.run_backtest(config, db)
                await db.commit()
                return {
                    "run_id": str(run.id),
                    "status": run.status,
                    "total_predictions": run.total_predictions,
                    "accuracy": run.accuracy,
                    "brier_score": run.brier_score,
                }

        result = _run_async(_run())
        logger.info("Backtest completed", extra=result)
        return {"status": "success", **result}

    except Exception as exc:
        logger.error("Backtest failed: %s", exc)
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# Task: report generation
# ---------------------------------------------------------------------------


@celery_app.task(
    name="app.tasks.celery_app.task_generate_weekly_report",
    bind=True,
    max_retries=2,
    default_retry_delay=120,
    queue="reports",
)
def task_generate_weekly_report(self) -> dict:
    """Generate the weekly performance report (Beat-triggered)."""
    logger.info("Generating weekly report")
    try:
        from app.db.session import async_session_factory
        from app.reporting.report_service import ReportService

        async def _run():
            async with async_session_factory() as db:
                svc = ReportService()
                report = await svc.generate_weekly_report(db)
                await db.commit()
                return {"report_id": str(report.id), "file_path": report.file_path}

        result = _run_async(_run())
        logger.info("Weekly report generated", extra=result)
        return {"status": "success", **result}

    except Exception as exc:
        logger.error("Weekly report failed: %s", exc)
        raise self.retry(exc=exc)


@celery_app.task(
    name="app.tasks.celery_app.task_generate_monthly_report",
    bind=True,
    max_retries=2,
    default_retry_delay=120,
    queue="reports",
)
def task_generate_monthly_report(self) -> dict:
    """Generate the monthly performance report (Beat-triggered)."""
    logger.info("Generating monthly report")
    try:
        from app.db.session import async_session_factory
        from app.reporting.report_service import ReportService

        async def _run():
            async with async_session_factory() as db:
                svc = ReportService()
                report = await svc.generate_monthly_report(db)
                await db.commit()
                return {"report_id": str(report.id), "file_path": report.file_path}

        result = _run_async(_run())
        logger.info("Monthly report generated", extra=result)
        return {"status": "success", **result}

    except Exception as exc:
        logger.error("Monthly report failed: %s", exc)
        raise self.retry(exc=exc)


@celery_app.task(
    name="app.tasks.celery_app.task_generate_report",
    bind=True,
    max_retries=2,
    default_retry_delay=60,
    queue="reports",
)
def task_generate_report(self, report_type: str = "weekly") -> dict:
    """Generate a report of the specified type on demand.

    Parameters
    ----------
    report_type:
        One of ``"weekly"`` or ``"monthly"``.
    """
    if report_type == "weekly":
        return task_generate_weekly_report.apply(args=[]).get()
    elif report_type == "monthly":
        return task_generate_monthly_report.apply(args=[]).get()
    else:
        raise ValueError(f"Unknown report_type: '{report_type}'")


# ---------------------------------------------------------------------------
# Task: daily pipeline (ingest → forecast → evaluate)
# ---------------------------------------------------------------------------


@celery_app.task(
    name="app.tasks.celery_app.task_daily_pipeline",
    bind=True,
    max_retries=2,
    default_retry_delay=300,
    queue="ingestion",
)
def task_daily_pipeline(self) -> dict:
    """
    Automated daily pipeline that runs three stages in sequence:

    1. **Ingest** — Fetch today's matches + recent results from all data sources
       (football-data.org, OpenLigaDB, TheSportsDB)
    2. **Forecast** — Generate predictions for all upcoming matches (next 48h)
       that don't have predictions yet
    3. **Evaluate** — Score predictions for recently finished matches

    This task runs 3x daily (06:00, 12:00, 17:00 UTC) via Celery Beat.
    It ensures the platform always shows fresh, real-time data with predictions.
    """
    logger.info("Daily pipeline started")
    pipeline_result = {
        "started_at": datetime.now(timezone.utc).isoformat(),
        "stages": {},
    }

    try:
        # Stage 1: Data Ingestion
        logger.info("Pipeline Stage 1: Ingestion")
        try:
            ingestion_result = task_run_ingestion.apply(
                kwargs={"sport_slug": "all"}
            ).get(timeout=600)
            pipeline_result["stages"]["ingestion"] = ingestion_result
        except Exception as exc:
            logger.warning("Pipeline ingestion failed: %s", exc)
            pipeline_result["stages"]["ingestion"] = {"status": "failed", "error": str(exc)}

        # Stage 2: Forecast Generation
        logger.info("Pipeline Stage 2: Forecasting")
        try:
            forecast_result = task_run_forecast_batch.apply(
                kwargs={"hours_ahead": 48}
            ).get(timeout=1200)
            pipeline_result["stages"]["forecasting"] = forecast_result
        except Exception as exc:
            logger.warning("Pipeline forecasting failed: %s", exc)
            pipeline_result["stages"]["forecasting"] = {"status": "failed", "error": str(exc)}

        # Stage 3: Evaluation
        logger.info("Pipeline Stage 3: Evaluation")
        try:
            eval_result = task_run_evaluation_batch.apply(
                kwargs={"days_back": 3}
            ).get(timeout=600)
            pipeline_result["stages"]["evaluation"] = eval_result
        except Exception as exc:
            logger.warning("Pipeline evaluation failed: %s", exc)
            pipeline_result["stages"]["evaluation"] = {"status": "failed", "error": str(exc)}

        pipeline_result["finished_at"] = datetime.now(timezone.utc).isoformat()
        pipeline_result["status"] = "completed"
        logger.info("Daily pipeline completed", extra=pipeline_result)
        return pipeline_result

    except Exception as exc:
        logger.error("Daily pipeline failed: %s", exc)
        pipeline_result["status"] = "failed"
        pipeline_result["error"] = str(exc)
        raise self.retry(exc=exc)
