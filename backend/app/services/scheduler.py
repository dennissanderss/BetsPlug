"""Background scheduler for automated data sync and prediction generation.

Runs inside the FastAPI process using APScheduler.
No external worker or Redis required.

Jobs
----
1. sync_data        — every 6 hours: fetch new fixtures from API-Football
2. generate_preds   — every 6 hours (offset +30min): predictions for new matches
3. sync_results     — daily at 06:00 UTC: fetch results and evaluate predictions
"""

import logging
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

log = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")


async def job_sync_data():
    """Sync upcoming matches and standings from the sports API."""
    log.info("CRON: Starting data sync...")
    try:
        from app.db.session import async_session_factory
        from app.services.data_sync_service import DataSyncService

        async with DataSyncService() as svc:
            async with async_session_factory() as db:
                created, updated, errors = 0, 0, 0

                c, u, e = await svc.sync_upcoming_matches(db)
                created += c; updated += u; errors += e

                c, u, e = await svc.sync_recent_results(db)
                created += c; updated += u; errors += e

                c, u, e = await svc.sync_standings(db)
                created += c; updated += u; errors += e

                await db.commit()
                log.info(
                    "CRON: Data sync done — created=%d updated=%d errors=%d",
                    created, updated, errors,
                )
    except Exception as exc:
        log.error("CRON: Data sync failed: %s", exc, exc_info=True)


async def job_generate_predictions():
    """Generate predictions for all upcoming matches that don't have one yet."""
    log.info("CRON: Starting prediction generation...")
    try:
        import uuid
        from sqlalchemy import select
        from app.db.session import async_session_factory
        from app.forecasting.forecast_service import ForecastService
        from app.models.match import Match, MatchStatus
        from app.models.model_version import ModelVersion
        from app.models.prediction import Prediction

        async with async_session_factory() as db:
            # Ensure default model version exists
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

            # Find upcoming matches
            now = datetime.now(timezone.utc)
            cutoff = now + timedelta(days=7)
            matches_result = await db.execute(
                select(Match).where(
                    Match.status.in_([MatchStatus.SCHEDULED, MatchStatus.LIVE]),
                    Match.scheduled_at >= now,
                    Match.scheduled_at <= cutoff,
                ).order_by(Match.scheduled_at)
            )
            all_matches = matches_result.scalars().all()

            # Filter out those with predictions already
            match_ids = [m.id for m in all_matches]
            if match_ids:
                existing = await db.execute(
                    select(Prediction.match_id)
                    .where(Prediction.match_id.in_(match_ids))
                    .distinct()
                )
                existing_ids = set(existing.scalars().all())
            else:
                existing_ids = set()

            to_predict = [m for m in all_matches if m.id not in existing_ids]

            if not to_predict:
                log.info("CRON: No new matches need predictions.")
                return

            service = ForecastService()
            generated = 0
            for match in to_predict:
                try:
                    await service.generate_forecast(match.id, db)
                    generated += 1
                except Exception as exc:
                    log.warning("CRON: Prediction failed for %s: %s", match.id, exc)

            await db.commit()
            log.info("CRON: Generated %d predictions for %d new matches.", generated, len(to_predict))

    except Exception as exc:
        log.error("CRON: Prediction generation failed: %s", exc, exc_info=True)


def start_scheduler():
    """Register jobs and start the scheduler."""
    # Sync data every 6 hours
    scheduler.add_job(
        job_sync_data,
        trigger=IntervalTrigger(hours=6),
        id="sync_data",
        name="Sync sports data",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc) + timedelta(minutes=2),
    )

    # Generate predictions every 6 hours (30 min after sync)
    scheduler.add_job(
        job_generate_predictions,
        trigger=IntervalTrigger(hours=6),
        id="generate_predictions",
        name="Generate predictions",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc) + timedelta(minutes=5),
    )

    # Sync results daily at 06:00 UTC
    scheduler.add_job(
        job_sync_data,
        trigger=CronTrigger(hour=6, minute=0),
        id="daily_results_sync",
        name="Daily results sync",
        replace_existing=True,
    )

    scheduler.start()
    log.info("CRON: Scheduler started with %d jobs.", len(scheduler.get_jobs()))


def stop_scheduler():
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        log.info("CRON: Scheduler stopped.")
