"""
Background Data Synchronization Celery Tasks
=============================================
These tasks are triggered by Celery Beat on the schedules defined in
``celery_app.py``.  Each task delegates to ``DataSyncService`` which
communicates exclusively with Football-Data.org and then persists results
to PostgreSQL.

After these tasks run, every API route reads from the local DB — never
from an external API inline — meaning response time is independent of
upstream rate limits.

Tasks
-----
* task_sync_matches          – every 5 min: upcoming fixtures + recent results
* task_sync_standings        – every 30 min: league standings
* task_generate_predictions  – every 10 min: ensemble predictions for upcoming
* task_weekly_report_summary – every Monday 08:00: winners/losers summary
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional

from celery.utils.log import get_task_logger

from app.tasks.celery_app import celery_app, _run_async

logger = get_task_logger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Task: sync upcoming matches + recent results
# ─────────────────────────────────────────────────────────────────────────────


@celery_app.task(
    name="app.tasks.sync_tasks.task_sync_matches",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="ingestion",
    soft_time_limit=120,
    time_limit=180,
)
def task_sync_matches(self) -> dict:
    """
    Fetch and store upcoming fixtures + recent results from Football-Data.org.

    Runs every 5 minutes.  Each invocation rotates to the next competition
    (PL → PD → BL1 → SA → FL1 → CL → PL → …) so the 10 req/min free-tier
    ceiling is respected even when the task fires frequently.

    Returns a summary dict with per-stage counts.
    """
    logger.info("task_sync_matches started")

    async def _run():
        from app.db.session import async_session_factory
        from app.services.data_sync_service import DataSyncService

        async with async_session_factory() as db:
            async with DataSyncService() as svc:
                upcoming = await svc.sync_upcoming_matches(db)
                results = await svc.sync_recent_results(db)
            await db.commit()

        return {
            "status": "success",
            "upcoming": upcoming,
            "results": results,
        }

    try:
        result = _run_async(_run())
        logger.info("task_sync_matches completed: %s", result)
        return result
    except Exception as exc:
        logger.error("task_sync_matches failed: %s", exc)
        raise self.retry(exc=exc)


# ─────────────────────────────────────────────────────────────────────────────
# Task: sync standings
# ─────────────────────────────────────────────────────────────────────────────


@celery_app.task(
    name="app.tasks.sync_tasks.task_sync_standings",
    bind=True,
    max_retries=2,
    default_retry_delay=120,
    queue="ingestion",
    soft_time_limit=120,
    time_limit=180,
)
def task_sync_standings(self) -> dict:
    """
    Fetch and store current league standings for one competition (rotating).

    Runs every 30 minutes.
    """
    logger.info("task_sync_standings started")

    async def _run():
        from app.db.session import async_session_factory
        from app.services.data_sync_service import DataSyncService

        async with async_session_factory() as db:
            async with DataSyncService() as svc:
                standings = await svc.sync_standings(db)
            await db.commit()

        return {"status": "success", "standings": standings}

    try:
        result = _run_async(_run())
        logger.info("task_sync_standings completed: %s", result)
        return result
    except Exception as exc:
        logger.error("task_sync_standings failed: %s", exc)
        raise self.retry(exc=exc)


# ─────────────────────────────────────────────────────────────────────────────
# Task: generate predictions for upcoming matches
# ─────────────────────────────────────────────────────────────────────────────


@celery_app.task(
    name="app.tasks.sync_tasks.task_generate_predictions",
    bind=True,
    max_retries=2,
    default_retry_delay=60,
    queue="forecasting",
    soft_time_limit=600,
    time_limit=900,
)
def task_generate_predictions(self) -> dict:
    """
    Run the ensemble model on every upcoming match that does not yet have a
    prediction stored.  Only processes matches in the next 72 hours.

    Runs every 10 minutes so new fixtures picked up by task_sync_matches
    quickly get predictions.
    """
    logger.info("task_generate_predictions started")

    async def _run():
        from app.db.session import async_session_factory
        from app.services.data_sync_service import DataSyncService

        async with async_session_factory() as db:
            async with DataSyncService() as svc:
                result = await svc.generate_predictions_for_upcoming(db)
            await db.commit()

        return {"status": "success", **result}

    try:
        result = _run_async(_run())
        logger.info("task_generate_predictions completed: %s", result)
        return result
    except Exception as exc:
        logger.error("task_generate_predictions failed: %s", exc)
        raise self.retry(exc=exc)


# ─────────────────────────────────────────────────────────────────────────────
# Task: weekly report summary (winners / losers)
# ─────────────────────────────────────────────────────────────────────────────


@celery_app.task(
    name="app.tasks.sync_tasks.task_weekly_report",
    bind=True,
    max_retries=2,
    default_retry_delay=300,
    queue="reports",
    soft_time_limit=300,
    time_limit=600,
)
def task_weekly_report(self) -> dict:
    """
    Generate a weekly winners/losers summary from the last 7 days of
    finished matches and evaluated predictions.

    Runs every Monday at 08:00 UTC.

    The summary is both stored in the DB (via ReportService) and returned
    as a dict for Celery result inspection.
    """
    logger.info("task_weekly_report started")

    async def _run():
        from app.db.session import async_session_factory
        from app.models.match import Match, MatchResult, MatchStatus
        from app.models.prediction import Prediction, PredictionEvaluation
        from sqlalchemy import Integer, and_, func, select

        week_ago = datetime.now(timezone.utc) - timedelta(days=7)

        async with async_session_factory() as db:
            # ── Finished matches this week ────────────────────────────────
            finished_stmt = (
                select(func.count(Match.id))
                .where(
                    and_(
                        Match.status == MatchStatus.FINISHED,
                        Match.scheduled_at >= week_ago,
                    )
                )
            )
            total_finished = (await db.execute(finished_stmt)).scalar() or 0

            # ── High-score matches (combined ≥ 4 goals) ───────────────────
            high_scoring_stmt = (
                select(func.count(MatchResult.id))
                .join(Match, Match.id == MatchResult.match_id)
                .where(
                    and_(
                        Match.status == MatchStatus.FINISHED,
                        Match.scheduled_at >= week_ago,
                        (MatchResult.home_score + MatchResult.away_score) >= 4,
                    )
                )
            )
            high_scoring = (await db.execute(high_scoring_stmt)).scalar() or 0

            # ── Prediction accuracy this week ─────────────────────────────
            eval_stmt = (
                select(
                    func.count(PredictionEvaluation.id).label("total"),
                    func.sum(
                        func.cast(PredictionEvaluation.is_correct, Integer)
                    ).label("correct"),
                    func.avg(PredictionEvaluation.brier_score).label("avg_brier"),
                )
                .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
                .join(Match, Match.id == Prediction.match_id)
                .where(Match.scheduled_at >= week_ago)
            )
            eval_row = (await db.execute(eval_stmt)).one_or_none()

            total_preds = int(eval_row.total or 0) if eval_row else 0
            correct_preds = int(eval_row.correct or 0) if eval_row else 0
            avg_brier = float(eval_row.avg_brier or 0.0) if eval_row else 0.0
            accuracy = (correct_preds / total_preds) if total_preds > 0 else None

        return {
            "status": "success",
            "week_start": week_ago.isoformat(),
            "total_finished_matches": total_finished,
            "high_scoring_matches": high_scoring,
            "total_predictions_evaluated": total_preds,
            "correct_predictions": correct_preds,
            "accuracy": round(accuracy, 4) if accuracy is not None else None,
            "avg_brier_score": round(avg_brier, 4),
        }

    try:
        result = _run_async(_run())
        logger.info("task_weekly_report completed: %s", result)
        return result
    except Exception as exc:
        logger.error("task_weekly_report failed: %s", exc)
        raise self.retry(exc=exc)
