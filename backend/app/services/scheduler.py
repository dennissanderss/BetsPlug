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
    """Sync ALL leagues: upcoming matches, recent results, and standings."""
    log.info("CRON: Starting full data sync (all leagues)...")
    try:
        import asyncio
        from app.db.session import async_session_factory
        from app.services.data_sync_service import DataSyncService

        total_created, total_updated, total_errors = 0, 0, 0

        # Sync all 6 leagues sequentially (respects rate limits)
        for i in range(6):
            async with DataSyncService() as svc:
                async with async_session_factory() as db:
                    # Each call rotates to next league
                    r1 = await svc.sync_upcoming_matches(db)
                    total_created += r1.get("created", 0)
                    total_updated += r1.get("updated", 0)
                    total_errors += r1.get("errors", 0)

                    # Rate limit pause between API calls
                    await asyncio.sleep(2)

                    r2 = await svc.sync_recent_results(db)
                    total_created += r2.get("created_results", 0)
                    total_updated += r2.get("updated_matches", r2.get("updated", 0))
                    total_errors += r2.get("errors", 0)

                    await asyncio.sleep(2)

                    r3 = await svc.sync_standings(db)
                    total_updated += r3.get("rows_saved", 0)
                    total_errors += r3.get("errors", 0)

                    await db.commit()
                    await asyncio.sleep(2)

        log.info(
            "CRON: Full sync done — created=%d updated=%d errors=%d",
            total_created, total_updated, total_errors,
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


async def job_sync_live_fixtures():
    """Sync live fixtures every 60s during match hours (12:00-24:00 UTC)."""
    now = datetime.now(timezone.utc)

    # Only run during match hours
    if now.hour < 12:
        return

    try:
        from sqlalchemy import and_
        from app.db.session import async_session_factory
        from app.models.match import Match, MatchResult, MatchStatus
        from app.services.data_sync_service import DataSyncService

        async with async_session_factory() as db:
            # Find matches that should be live (kickoff in last 3 hours, not finished)
            cutoff_start = now - timedelta(hours=3)
            stmt = (
                select(Match)
                .where(
                    and_(
                        Match.scheduled_at >= cutoff_start,
                        Match.scheduled_at <= now,
                        Match.status.in_([MatchStatus.SCHEDULED, MatchStatus.LIVE]),
                    )
                )
            )
            matches = (await db.execute(stmt)).scalars().all()

            if not matches:
                return  # No matches to check, save API calls

            log.info("CRON: Checking %d potentially live matches...", len(matches))

            async with DataSyncService() as svc:
                # Sync results for the leagues of these matches
                r = await svc.sync_recent_results(db)
                log.info("CRON: Live sync results: %s", r)

            await db.commit()

    except Exception as exc:
        log.error("CRON: Live fixture sync failed: %s", exc, exc_info=True)


async def job_generate_historical_predictions():
    """Generate predictions for finished matches that don't have one yet. Runs in batches."""
    log.info("CRON: Generating historical predictions (batch)...")
    try:
        import uuid as _uuid
        import math as _math
        from sqlalchemy import and_
        from app.db.session import async_session_factory
        from app.models.match import Match, MatchResult, MatchStatus
        from app.models.prediction import Prediction, PredictionEvaluation
        from app.models.model_version import ModelVersion
        from app.forecasting.forecast_service import ForecastService

        async with async_session_factory() as db:
            # Ensure model version exists
            mv_result = await db.execute(
                select(ModelVersion).where(ModelVersion.is_active.is_(True)).limit(1)
            )
            if mv_result.scalar_one_or_none() is None:
                mv = ModelVersion(
                    id=_uuid.uuid4(), name="BetsPlug Ensemble v1", version="1.0.0",
                    model_type="ensemble", sport_scope="all",
                    hyperparameters={"weights": {"elo": 1.0, "poisson": 1.5, "logistic": 1.0}},
                    training_metrics={}, trained_at=datetime.now(timezone.utc), is_active=True,
                )
                db.add(mv)
                await db.flush()

            # Find finished matches without predictions (batch of 100)
            stmt = (
                select(Match)
                .where(
                    and_(
                        Match.status == MatchStatus.FINISHED,
                        ~Match.id.in_(select(Prediction.match_id).distinct()),
                    )
                )
                .order_by(Match.scheduled_at)
                .limit(100)
            )
            matches = (await db.execute(stmt)).scalars().all()

            if not matches:
                log.info("CRON: No historical matches need predictions.")
                return

            log.info("CRON: Generating predictions for %d historical matches...", len(matches))

            svc = ForecastService()
            generated = 0
            for match in matches:
                try:
                    await svc.generate_forecast(match.id, db)
                    generated += 1
                except Exception as exc:
                    log.warning("CRON: Historical prediction failed for %s: %s", match.id, exc)

            await db.commit()

            # Now evaluate them
            eval_stmt = (
                select(Prediction, MatchResult)
                .join(Match, Match.id == Prediction.match_id)
                .join(MatchResult, MatchResult.match_id == Match.id)
                .outerjoin(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
                .where(and_(Match.status == MatchStatus.FINISHED, PredictionEvaluation.id.is_(None)))
                .limit(200)
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
                    _CLIP = 1e-15
                    log_loss_val = -_math.log(max(probs.get(actual, _CLIP), _CLIP))

                    evaluation = PredictionEvaluation(
                        id=_uuid.uuid4(), prediction_id=pred.id,
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
            log.info("CRON: Generated %d predictions, evaluated %d.", generated, evaluated)

    except Exception as exc:
        log.error("CRON: Historical prediction generation failed: %s", exc, exc_info=True)


async def job_backfill_results():
    """One-time backfill: find all matches past their kickoff that aren't finished and try to update."""
    log.info("CRON: Running results backfill...")
    try:
        import math
        from sqlalchemy import and_
        from app.db.session import async_session_factory
        from app.models.match import Match, MatchResult, MatchStatus
        from app.models.prediction import Prediction, PredictionEvaluation
        from app.services.data_sync_service import DataSyncService

        now = datetime.now(timezone.utc)

        async with async_session_factory() as db:
            # Find all matches that should be finished (kickoff > 3h ago, still scheduled/live)
            cutoff = now - timedelta(hours=3)
            stmt = (
                select(Match)
                .where(
                    and_(
                        Match.scheduled_at < cutoff,
                        Match.status.in_([MatchStatus.SCHEDULED, MatchStatus.LIVE]),
                    )
                )
            )
            stale_matches = (await db.execute(stmt)).scalars().all()

            if not stale_matches:
                log.info("CRON: No stale matches to backfill.")
                return

            log.info("CRON: Found %d stale matches to backfill.", len(stale_matches))

            # Try to sync results
            async with DataSyncService() as svc:
                for _ in range(6):  # Rotate through all leagues
                    r = await svc.sync_recent_results(db)
                    import asyncio
                    await asyncio.sleep(2)

            await db.commit()

            # Now evaluate any newly finished predictions
            await job_evaluate_predictions()

    except Exception as exc:
        log.error("CRON: Backfill failed: %s", exc, exc_info=True)


async def job_sync_odds():
    """Sync bookmaker odds from The Odds API every 2 hours for upcoming matches."""
    log.info("CRON: Starting odds sync...")
    try:
        from app.core.config import get_settings
        from app.ingestion.adapters.the_odds_api import TheOddsAPIAdapter, LEAGUE_TO_SPORT_KEY

        settings = get_settings()
        key = getattr(settings, "the_odds_api_key", "")
        if not key:
            log.info("CRON: THE_ODDS_API_KEY not set, skipping odds sync.")
            return

        adapter = TheOddsAPIAdapter(api_key=key)
        leagues = ["premier-league", "la-liga", "bundesliga", "serie-a", "ligue-1", "eredivisie"]
        total = 0

        import httpx
        async with httpx.AsyncClient(timeout=15) as client:
            for league in leagues:
                try:
                    odds = await adapter.fetch_odds_for_league(league, client=client)
                    total += len(odds)
                    log.info("CRON: Odds %s: %d matches", league, len(odds))
                    # Rate limit between calls
                    import asyncio
                    await asyncio.sleep(1)
                except Exception as exc:
                    log.warning("CRON: Odds %s failed: %s", league, exc)

        remaining = adapter.remaining_requests
        log.info("CRON: Odds sync done — %d matches, %s requests remaining.", total, remaining)

    except Exception as exc:
        log.error("CRON: Odds sync failed: %s", exc, exc_info=True)


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

    # Live fixture sync every 60 seconds during match hours
    scheduler.add_job(
        job_sync_live_fixtures,
        trigger=IntervalTrigger(seconds=60),
        id="sync_live_fixtures",
        name="Live fixture sync",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc) + timedelta(seconds=30),
    )

    # Sync odds every 2 hours (The Odds API, 500 req/month budget)
    scheduler.add_job(
        job_sync_odds,
        trigger=IntervalTrigger(hours=2),
        id="sync_odds",
        name="Sync bookmaker odds",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc) + timedelta(minutes=15),
    )

    # Sync results daily at 06:00 UTC
    scheduler.add_job(
        job_sync_data,
        trigger=CronTrigger(hour=6, minute=0),
        id="daily_results_sync",
        name="Daily results sync",
        replace_existing=True,
    )

    # Historical predictions: generate 100 per run until all done
    scheduler.add_job(
        job_generate_historical_predictions,
        trigger=IntervalTrigger(minutes=5),
        id="historical_predictions",
        name="Generate historical predictions (batch 100)",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc) + timedelta(minutes=1),
    )

    # One-time backfill on startup (3 min after start)
    scheduler.add_job(
        job_backfill_results,
        trigger=None,  # run once
        id="backfill_results",
        name="Backfill stale results",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc) + timedelta(minutes=3),
    )

    scheduler.start()
    log.info("CRON: Scheduler started with %d jobs.", len(scheduler.get_jobs()))


def stop_scheduler():
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        log.info("CRON: Scheduler stopped.")
