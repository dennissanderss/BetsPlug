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


async def job_evaluate_predictions():
    """Evaluate predictions for finished matches that haven't been scored yet."""
    log.info("CRON: Starting prediction evaluation...")
    try:
        import math
        from sqlalchemy import and_
        from app.db.session import async_session_factory
        from app.models.match import Match, MatchResult, MatchStatus
        from app.models.prediction import Prediction, PredictionEvaluation

        async with async_session_factory() as db:
            # Find predictions for finished matches without evaluations
            stmt = (
                select(Prediction, MatchResult)
                .join(Match, Match.id == Prediction.match_id)
                .join(MatchResult, MatchResult.match_id == Match.id)
                .outerjoin(
                    PredictionEvaluation,
                    PredictionEvaluation.prediction_id == Prediction.id,
                )
                .where(
                    and_(
                        Match.status == MatchStatus.FINISHED,
                        PredictionEvaluation.id.is_(None),
                    )
                )
                .limit(200)
            )
            rows = (await db.execute(stmt)).all()

            if not rows:
                log.info("CRON: No predictions to evaluate.")
                return

            evaluated = 0
            for pred, result in rows:
                # Determine actual outcome
                if result.home_score > result.away_score:
                    actual = "home"
                elif result.home_score < result.away_score:
                    actual = "away"
                else:
                    actual = "draw"

                # Check if prediction was correct
                probs = {"home": pred.home_win_prob, "draw": pred.draw_prob or 0.0, "away": pred.away_win_prob}
                predicted = max(probs, key=lambda k: probs[k])
                is_correct = predicted == actual

                # Brier score
                brier = sum(
                    (probs.get(o, 0.0) - (1.0 if o == actual else 0.0)) ** 2
                    for o in ["home", "draw", "away"]
                ) / 3

                # Log loss
                _CLIP = 1e-15
                p_actual = max(probs.get(actual, _CLIP), _CLIP)
                log_loss = -math.log(p_actual)

                evaluation = PredictionEvaluation(
                    id=uuid.uuid4(),
                    prediction_id=pred.id,
                    actual_outcome=actual,
                    actual_home_score=result.home_score,
                    actual_away_score=result.away_score,
                    is_correct=is_correct,
                    brier_score=round(brier, 6),
                    log_loss=round(log_loss, 6),
                    evaluated_at=datetime.now(timezone.utc),
                )
                db.add(evaluation)
                evaluated += 1

            await db.commit()
            log.info("CRON: Evaluated %d predictions.", evaluated)

    except Exception as exc:
        log.error("CRON: Prediction evaluation failed: %s", exc, exc_info=True)


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

    # Evaluate predictions every 6 hours (1 hour after sync)
    scheduler.add_job(
        job_evaluate_predictions,
        trigger=IntervalTrigger(hours=6),
        id="evaluate_predictions",
        name="Evaluate predictions",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc) + timedelta(minutes=10),
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
