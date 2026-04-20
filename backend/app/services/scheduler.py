"""Background scheduler for automated data sync and prediction generation.

Runs inside the FastAPI process using APScheduler.
No external worker or Redis required.

Jobs
----
1. sync_data        — every 6 hours: fetch new fixtures from API-Football
2. generate_preds   — every 6 hours (offset +30min): predictions for new matches
3. sync_results     — daily at 06:00 UTC: fetch results and evaluate predictions
"""

import gc
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

        # Number of league-batch iterations per scheduled run. Each iteration
        # performs 3 sync method calls (upcoming + results + standings), each
        # advancing the rotation by 1. With 30 API-Football leagues and 3
        # calls/iteration we need ceil(30/3) = 10 iterations minimum to cover
        # every league once per run. Using the rotation list length directly
        # ensures we always scale automatically when leagues are added.
        from app.services.data_sync_service import _LEAGUE_SLUG_ROTATION
        iterations = max(len(_LEAGUE_SLUG_ROTATION) // 3 + 1, 7)
        for i in range(iterations):
            # Each league gets its own client + session, closed before the next
            async with DataSyncService() as svc:
                async with async_session_factory() as db:
                    r1 = await svc.sync_upcoming_matches(db)
                    total_created += r1.get("created", 0)
                    total_updated += r1.get("updated", 0)
                    total_errors += r1.get("errors", 0)
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
                    db.expire_all()
                    await asyncio.sleep(2)
            # Explicit cleanup: drop references and force GC between leagues
            del svc
            gc.collect()
            log.debug("CRON: League batch %d/%d synced, memory released.", i + 1, iterations)

        log.info("CRON: Full sync done — created=%d updated=%d errors=%d",
                 total_created, total_updated, total_errors)

        # Chain: if any new matches were ingested, trigger prediction
        # generation immediately so freshly imported fixtures get their
        # pre-match 'live' lock without waiting for the next 10-min cycle.
        # Failures are non-fatal — the interval job will catch up on its
        # next run anyway.
        if total_created > 0:
            try:
                log.info("CRON: Chaining generate_predictions after sync (created=%d).", total_created)
                await job_generate_predictions()
            except Exception as chain_exc:
                log.warning("CRON: Chained generate_predictions failed: %s", chain_exc)
    except Exception as exc:
        log.error("CRON: Data sync failed: %s", exc, exc_info=True)


async def job_generate_predictions():
    """Generate predictions for all upcoming matches that don't have one yet.

    Processes in batches of 50 to limit peak memory usage.
    """
    log.info("CRON: Starting prediction generation...")
    try:
        import uuid
        from sqlalchemy import select
        from app.db.session import async_session_factory
        from app.forecasting.forecast_service import ForecastService
        from app.models.match import Match, MatchStatus
        from app.models.model_version import ModelVersion
        from app.models.prediction import Prediction

        BATCH_SIZE = 50

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
                await db.commit()
                db.expire_all()

            # Collect IDs of upcoming matches that need predictions
            now = datetime.now(timezone.utc)
            cutoff = now + timedelta(days=7)
            matches_result = await db.execute(
                select(Match.id).where(
                    Match.status.in_([MatchStatus.SCHEDULED, MatchStatus.LIVE]),
                    Match.scheduled_at >= now,
                    Match.scheduled_at <= cutoff,
                ).order_by(Match.scheduled_at)
            )
            all_match_ids = [row[0] for row in matches_result.all()]

            if all_match_ids:
                # Only skip matches that already have a LIVE-source prediction.
                # Upcoming matches with only a 'batch_local_fill' / 'backtest'
                # row need a fresh live pick alongside — otherwise the public
                # live-measurement surface never grows past 0/0 because every
                # finished match was prefilled by the batch job before the
                # scheduler could lock its pre-match window.
                existing = await db.execute(
                    select(Prediction.match_id)
                    .where(Prediction.match_id.in_(all_match_ids))
                    .where(Prediction.prediction_source == "live")
                    .distinct()
                )
                existing_ids = set(existing.scalars().all())
            else:
                existing_ids = set()

            ids_to_predict = [mid for mid in all_match_ids if mid not in existing_ids]

            if not ids_to_predict:
                log.info("CRON: No new matches need predictions.")
                return

            log.info("CRON: %d matches need predictions, processing in batches of %d.",
                     len(ids_to_predict), BATCH_SIZE)

            # Process in batches of BATCH_SIZE
            service = ForecastService()
            generated = 0
            failed = 0
            for batch_start in range(0, len(ids_to_predict), BATCH_SIZE):
                batch_ids = ids_to_predict[batch_start:batch_start + BATCH_SIZE]
                for match_id in batch_ids:
                    try:
                        await service.generate_forecast(match_id, db, source="live")
                        # Commit per-match so a later failure doesn't roll
                        # back earlier successes in the same batch, and a
                        # flush-error on this match doesn't poison the
                        # shared session for the next 49. Before this fix
                        # one bad match caused PendingRollbackError on
                        # every subsequent iteration — invisible because
                        # the except-branch logged them all as identical
                        # "Prediction failed" warnings.
                        await db.commit()
                        generated += 1
                    except Exception as exc:
                        # Rollback so the session is usable for the next
                        # match instead of raising PendingRollbackError
                        # on the first query. And log with exc_info=True
                        # so the Railway log has the full traceback —
                        # the previous warning-only output hid which
                        # line in generate_forecast was actually raising.
                        await db.rollback()
                        failed += 1
                        log.error(
                            "CRON: Prediction failed for %s: %s",
                            match_id, exc, exc_info=True,
                        )

                db.expire_all()
                gc.collect()
                log.debug("CRON: Prediction batch done (%d-%d).",
                          batch_start, batch_start + len(batch_ids))

            log.info(
                "CRON: Generated %d predictions for %d new matches (%d failed).",
                generated, len(ids_to_predict), failed,
            )

    except Exception as exc:
        log.error("CRON: Prediction generation failed: %s", exc, exc_info=True)


async def job_evaluate_predictions():
    """Evaluate predictions for finished matches that haven't been scored yet.

    Processes up to 200 at a time with session cleanup after commit.
    """
    log.info("CRON: Starting prediction evaluation...")
    try:
        import uuid
        import math
        from sqlalchemy import and_, select
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
            db.expire_all()
            log.info("CRON: Evaluated %d predictions.", evaluated)

    except Exception as exc:
        log.error("CRON: Prediction evaluation failed: %s", exc, exc_info=True)


async def job_sync_live_fixtures():
    """Fetch live scores from API-Football every 60s during match hours.

    v6.3: Rewritten to use API-Football's /fixtures?live=all endpoint
    which returns ALL currently live matches in a SINGLE API call.
    Scores are written to both:
      1. Redis cache (30s TTL) — for instant reads by the /fixtures/live endpoint
      2. DB (MatchResult + Match.status) — for persistence + trackrecord

    Cost: 1 API call per minute × 12 hours = 720 calls/day (fits easily
    in the Pro tier's 7,500/day limit). User count doesn't matter because
    all users read from the same cache.
    """
    now = datetime.now(timezone.utc)

    # Only run during match hours (11:00-23:59 UTC covers European football)
    if now.hour < 11:
        return

    # ── Cleanup stale LIVE matches ───────────────────────────────────
    # Matches stuck on LIVE status for 4+ hours are almost certainly
    # finished — API-Football may not have returned them in the last
    # /fixtures?live=all call. Force them to FINISHED.
    try:
        from sqlalchemy import and_, select
        from app.db.session import async_session_factory
        from app.models.match import Match, MatchStatus

        stale_cutoff = now - timedelta(hours=4)
        async with async_session_factory() as db:
            stale = (await db.execute(
                select(Match).where(
                    and_(
                        Match.status == MatchStatus.LIVE,
                        Match.scheduled_at < stale_cutoff,
                    )
                )
            )).scalars().all()

            if stale:
                for m in stale:
                    m.status = MatchStatus.FINISHED
                await db.commit()
                log.info("CRON: Cleaned up %d stale LIVE matches → FINISHED", len(stale))
    except Exception as exc:
        log.error("CRON: Stale LIVE cleanup failed: %s", exc)

    try:
        import json as _json
        import uuid
        from sqlalchemy import and_, select
        from app.db.session import async_session_factory
        from app.models.match import Match, MatchResult, MatchStatus
        from app.core.config import get_settings
        from app.core.cache import cache_set, cache_get

        settings = get_settings()
        api_key = settings.api_football_key
        if not api_key:
            return  # No API key configured — skip silently

        # ── 1. Single API call: fetch all live fixtures ──────────────
        import httpx
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                "https://v3.football.api-sports.io/fixtures",
                params={"live": "all"},
                headers={"x-apisports-key": api_key},
            )
            if resp.status_code != 200:
                log.warning("CRON: Live scores API returned %d", resp.status_code)
                return
            data = resp.json().get("response", [])

        if not data:
            # No live matches right now — cache empty list so frontend
            # doesn't hit DB needlessly.
            await cache_set("live:fixtures", [], ttl=45)
            return

        log.info("CRON: %d live fixtures from API-Football", len(data))

        # ── 2. Build a clean cache payload + update DB ───────────────
        live_cache = []  # list of dicts for Redis

        async with async_session_factory() as db:
            for item in data:
                fixture = item.get("fixture", {}) or {}
                teams = item.get("teams", {}) or {}
                goals = item.get("goals", {}) or {}
                score = item.get("score", {}) or {}
                league_info = item.get("league", {}) or {}

                api_id = fixture.get("id")
                if not api_id:
                    continue

                home_goals = goals.get("home")  # int or None
                away_goals = goals.get("away")
                status_short = (fixture.get("status") or {}).get("short", "")
                elapsed = (fixture.get("status") or {}).get("elapsed")  # minutes

                # Determine match status
                finished_codes = {"FT", "AET", "PEN", "WO", "AWD"}
                halftime_codes = {"HT"}
                live_codes = {"1H", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"}

                if status_short in finished_codes:
                    match_status = MatchStatus.FINISHED
                elif status_short in live_codes or status_short in halftime_codes:
                    match_status = MatchStatus.LIVE
                else:
                    match_status = MatchStatus.SCHEDULED

                # Build cache entry (for Redis → frontend)
                home_name = (teams.get("home") or {}).get("name", "?")
                away_name = (teams.get("away") or {}).get("name", "?")
                league_name = league_info.get("name", "")
                ht = score.get("halftime", {}) or {}

                live_cache.append({
                    "api_football_id": api_id,
                    "home_team": home_name,
                    "away_team": away_name,
                    "home_goals": home_goals,
                    "away_goals": away_goals,
                    "elapsed": elapsed,
                    "status": status_short,
                    "league": league_name,
                    "halftime_home": ht.get("home"),
                    "halftime_away": ht.get("away"),
                })

                # ── Update DB: find the match by apifb external_id ───
                external_id = f"apifb_match_{api_id}"
                match_row = (
                    await db.execute(
                        select(Match).where(Match.external_id == external_id)
                    )
                ).scalar_one_or_none()

                if match_row is None:
                    continue  # Match not in our DB — skip

                # Update status
                if match_row.status != match_status:
                    match_row.status = match_status

                # Upsert live score into MatchResult
                if home_goals is not None and away_goals is not None:
                    result_row = (
                        await db.execute(
                            select(MatchResult).where(
                                MatchResult.match_id == match_row.id
                            )
                        )
                    ).scalar_one_or_none()

                    ht_home = ht.get("home")
                    ht_away = ht.get("away")
                    winner = None
                    if match_status == MatchStatus.FINISHED:
                        if home_goals > away_goals:
                            winner = "home"
                        elif away_goals > home_goals:
                            winner = "away"
                        else:
                            winner = "draw"

                    if result_row is None:
                        result_row = MatchResult(
                            id=uuid.uuid4(),
                            match_id=match_row.id,
                            home_score=home_goals,
                            away_score=away_goals,
                            home_score_ht=ht_home,
                            away_score_ht=ht_away,
                            winner=winner,
                        )
                        db.add(result_row)
                    else:
                        result_row.home_score = home_goals
                        result_row.away_score = away_goals
                        if ht_home is not None:
                            result_row.home_score_ht = ht_home
                        if ht_away is not None:
                            result_row.away_score_ht = ht_away
                        if winner:
                            result_row.winner = winner

            await db.commit()

        # ── 3. Cache the live data for 45s (frontend reads this) ─────
        await cache_set("live:fixtures", live_cache, ttl=45)
        log.info("CRON: Cached %d live scores", len(live_cache))

    except Exception as exc:
        log.error("CRON: Live fixture sync failed: %s", exc, exc_info=True)


async def job_generate_historical_predictions():
    """Generate predictions for finished matches that don't have one yet.

    Runs in batches of 100 with session cleanup after each commit.
    """
    log.info("CRON: Generating historical predictions (batch)...")
    try:
        import uuid as _uuid
        import math as _math
        from sqlalchemy import and_, select
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
                await db.commit()
                db.expire_all()

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

            # Collect IDs so we can drop the full ORM objects
            match_ids = [m.id for m in matches]
            del matches

            svc = ForecastService()
            generated = 0
            for match_id in match_ids:
                try:
                    await svc.generate_forecast(match_id, db, source="backtest")
                    generated += 1
                except Exception as exc:
                    log.warning("CRON: Historical prediction failed for %s: %s", match_id, exc)

            await db.commit()
            db.expire_all()
            gc.collect()

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
            db.expire_all()
            gc.collect()
            log.info("CRON: Generated %d predictions, evaluated %d.", generated, evaluated)

    except Exception as exc:
        log.error("CRON: Historical prediction generation failed: %s", exc, exc_info=True)


async def job_backfill_results():
    """One-time backfill: find all matches past their kickoff that aren't finished and try to update."""
    log.info("CRON: Running results backfill...")
    try:
        import asyncio
        from sqlalchemy import and_, select
        from app.db.session import async_session_factory
        from app.models.match import Match, MatchStatus
        from app.services.data_sync_service import DataSyncService

        now = datetime.now(timezone.utc)

        async with async_session_factory() as db:
            # Find all matches that should be finished (kickoff > 3h ago, still scheduled/live)
            cutoff = now - timedelta(hours=3)
            stmt = (
                select(Match.id)
                .where(
                    and_(
                        Match.scheduled_at < cutoff,
                        Match.status.in_([MatchStatus.SCHEDULED, MatchStatus.LIVE]),
                    )
                )
            )
            stale_ids = [row[0] for row in (await db.execute(stmt)).all()]

            if not stale_ids:
                log.info("CRON: No stale matches to backfill.")
                return

            log.info("CRON: Found %d stale matches to backfill.", len(stale_ids))

            # Try to sync results -- one DataSyncService per league iteration
            for i in range(6):
                async with DataSyncService() as svc:
                    r = await svc.sync_recent_results(db)
                    log.debug("CRON: Backfill league %d/6: %s", i + 1, r)
                del svc
                await db.commit()
                db.expire_all()
                gc.collect()
                await asyncio.sleep(2)

            # Now evaluate any newly finished predictions
            await job_evaluate_predictions()

    except Exception as exc:
        log.error("CRON: Backfill failed: %s", exc, exc_info=True)


async def job_process_abandoned_checkouts():
    """Find abandoned checkouts and send a single reminder email with a 5% coupon.

    Runs every 30 minutes. A checkout is considered abandoned when:
      - status = STARTED
      - abandoned_email_sent_at IS NULL
      - checkout_started_at < now() - ABANDONED_CHECKOUT_DELAY_MINUTES

    Idempotent: only processes sessions that haven't received an email yet.
    """
    log.info("CRON: Starting abandoned checkout processing...")
    try:
        import asyncio
        from app.services.abandoned_checkout_service import process_abandoned_checkouts_sync

        # Run the synchronous DB + SMTP work in a thread so we don't
        # block the asyncio event loop.
        loop = asyncio.get_running_loop()
        stats = await loop.run_in_executor(None, process_abandoned_checkouts_sync)
        log.info("CRON: Abandoned checkout result: %s", stats)
    except Exception as exc:
        log.error("CRON: Abandoned checkout processing failed: %s", exc, exc_info=True)


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


async def job_snapshot_upcoming_odds():
    """v5 daily odds-snapshot cron.

    For every scheduled fixture in the next 14 days sourced via
    API-Football, call ``/odds?fixture=<id>`` and write rows into
    ``odds_history``. Skips fixtures that already got a row today so
    it's safe to run multiple times per day. Caps at 400 fixtures per
    run to stay comfortably inside the Pro budget (~400 calls / day
    ≈ 5.3% of the 7 500 limit).

    This is the single biggest long-term investment for honest
    strategy ROI — real odds snapshots accumulate naturally over
    time and replace the hardcoded 1.90 fallback in roi_calculator.
    """
    import httpx
    import uuid as _uuid
    from datetime import date as _date
    from sqlalchemy import and_, select

    from app.core.config import get_settings
    from app.db.session import async_session_factory
    from app.ingestion.adapters.api_football import APIFootballAdapter
    from app.models.match import Match, MatchStatus
    from app.models.odds import OddsHistory
    from app.services.api_usage_tracker import record_api_call

    settings = get_settings()
    if not settings.api_football_key:
        log.warning("CRON: snapshot_upcoming_odds skipped — no API_FOOTBALL_KEY")
        return

    log.info("CRON: Starting v5 odds snapshot...")
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(days=14)
    today_start = datetime.combine(
        _date.today(), datetime.min.time()
    ).replace(tzinfo=timezone.utc)

    client = httpx.AsyncClient(timeout=30)
    adapter = APIFootballAdapter(
        config={"api_key": settings.api_football_key, "rate_limit_seconds": 0.3},
        http_client=client,
    )

    try:
        async with async_session_factory() as db:
            already_stmt = select(OddsHistory.match_id).where(
                and_(
                    OddsHistory.market.in_(["1x2", "1X2"]),
                    OddsHistory.recorded_at >= today_start,
                )
            )
            already = {row[0] for row in (await db.execute(already_stmt)).all()}

            targets_stmt = (
                select(Match.id, Match.external_id)
                .where(
                    and_(
                        Match.status == MatchStatus.SCHEDULED,
                        Match.scheduled_at >= now,
                        Match.scheduled_at <= cutoff,
                        Match.external_id.is_not(None),
                        Match.external_id.like("apifb_match_%"),
                    )
                )
                .order_by(Match.scheduled_at.asc())
                .limit(800)
            )
            rows = (await db.execute(targets_stmt)).all()
            targets = [(mid, ext) for mid, ext in rows if mid not in already][:400]

            inserted = 0
            for match_id, external_id in targets:
                raw_id = external_id.replace("apifb_match_", "")
                try:
                    t0 = datetime.now(timezone.utc)
                    odds = await adapter.fetch_pre_match_odds_raw(raw_id)
                    await record_api_call(
                        "api_football",
                        "/odds",
                        200,
                        int((datetime.now(timezone.utc) - t0).total_seconds() * 1000),
                    )
                except Exception as exc:
                    log.warning(
                        "CRON: snapshot_odds fetch failed match=%s err=%s",
                        match_id, exc,
                    )
                    continue
                if not odds:
                    continue
                recorded_at = datetime.now(timezone.utc)
                if odds.get("home_odds") and odds.get("away_odds"):
                    db.add(OddsHistory(
                        id=_uuid.uuid4(),
                        match_id=match_id,
                        source="api_football_avg",
                        market="1x2",
                        home_odds=odds.get("home_odds"),
                        draw_odds=odds.get("draw_odds"),
                        away_odds=odds.get("away_odds"),
                        recorded_at=recorded_at,
                    ))
                    inserted += 1
                if odds.get("over_odds") and odds.get("under_odds"):
                    db.add(OddsHistory(
                        id=_uuid.uuid4(),
                        match_id=match_id,
                        source="api_football_avg",
                        market="over_under_2_5",
                        over_odds=odds.get("over_odds"),
                        under_odds=odds.get("under_odds"),
                        total_line=2.5,
                        recorded_at=recorded_at,
                    ))
                    inserted += 1
                if odds.get("btts_yes_odds") and odds.get("btts_no_odds"):
                    db.add(OddsHistory(
                        id=_uuid.uuid4(),
                        match_id=match_id,
                        source="api_football_avg",
                        market="btts",
                        btts_yes_odds=odds.get("btts_yes_odds"),
                        btts_no_odds=odds.get("btts_no_odds"),
                        recorded_at=recorded_at,
                    ))
                    inserted += 1
                if inserted % 40 == 0:
                    await db.commit()
            await db.commit()
            log.info(
                "CRON: snapshot_upcoming_odds done — fixtures=%d rows=%d",
                len(targets), inserted,
            )
    except Exception as exc:
        log.error("CRON: snapshot_upcoming_odds failed: %s", exc, exc_info=True)
    finally:
        try:
            await client.aclose()
        except Exception:
            pass


# ──────────────────────────────────────────────────────────────────
# @BetsPlug Telegram auto-poster — scheduler adapters
# ──────────────────────────────────────────────────────────────────


async def job_telegram_post_scheduled_pick():
    """Post the best available Free-tier pick to @BetsPlug.

    Wraps ``publish_scheduled_slot`` with DB session management + a
    broad try/except so one bad post never blows up the scheduler
    (which would block every other cron on the process).
    """
    log.info("CRON: Telegram — posting scheduled Free pick")
    try:
        from app.db.session import async_session_factory
        from app.services.telegram_posting import publish_scheduled_slot

        async with async_session_factory() as db:
            post = await publish_scheduled_slot(db)
            if post is None:
                log.info("CRON: Telegram — no eligible pick, skipping slot")
            else:
                log.info(
                    "CRON: Telegram — posted pick id=%s msg_id=%s",
                    post.id, post.telegram_message_id,
                )
    except Exception as exc:
        log.error("CRON: Telegram scheduled pick failed: %s", exc, exc_info=True)


async def job_telegram_post_daily_summary():
    """Post the bilingual daily summary for today (CET)."""
    log.info("CRON: Telegram — posting daily summary")
    try:
        from app.db.session import async_session_factory
        from app.services.telegram_posting import publish_daily_summary

        async with async_session_factory() as db:
            post = await publish_daily_summary(db)
            if post is None:
                log.info("CRON: Telegram — no picks today, summary skipped")
            else:
                log.info(
                    "CRON: Telegram — daily summary posted msg_id=%s",
                    post.telegram_message_id,
                )
    except Exception as exc:
        log.error("CRON: Telegram daily summary failed: %s", exc, exc_info=True)


async def job_telegram_update_results():
    """Sweep pick posts whose fixtures have resolved and edit in the score."""
    try:
        from app.db.session import async_session_factory
        from app.services.telegram_posting import update_all_pending_results

        async with async_session_factory() as db:
            updated = await update_all_pending_results(db)
            if updated:
                log.info("CRON: Telegram — %d pick posts updated with result", updated)
    except Exception as exc:
        log.error("CRON: Telegram result sweep failed: %s", exc, exc_info=True)


async def job_telegram_post_weekly_promo():
    """Post the bilingual tier-comparison promo to the public channel."""
    log.info("CRON: Telegram — posting weekly promo")
    try:
        from app.db.session import async_session_factory
        from app.services.telegram_posting import publish_promo

        async with async_session_factory() as db:
            post = await publish_promo(db)
            log.info(
                "CRON: Telegram — weekly promo posted msg_id=%s",
                post.telegram_message_id,
            )
    except Exception as exc:
        log.error("CRON: Telegram weekly promo failed: %s", exc, exc_info=True)


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

    # Generate predictions every 10 minutes so newly ingested fixtures get
    # a pre-match 'live' lock quickly. Previous cadence (6h) meant matches
    # imported between cycles missed their pre-match window entirely,
    # leaving /trackrecord/live-measurement permanently near-empty.
    scheduler.add_job(
        job_generate_predictions,
        trigger=IntervalTrigger(minutes=10),
        id="generate_predictions",
        name="Generate predictions",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc) + timedelta(minutes=5),
    )

    # Evaluate predictions every 20 minutes so finished matches surface in
    # dashboards within ~20 min of final whistle. Previous cadence (6h)
    # caused visible lag on /dashboard and /trackrecord.
    scheduler.add_job(
        job_evaluate_predictions,
        trigger=IntervalTrigger(minutes=20),
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

    # v5: Snapshot upcoming-fixture odds from API-Football once a day.
    # Accumulates real historical odds over time — after 2 weeks every
    # fixture has a 14-row odds history, after a month it's 30. That's
    # what finally unblocks honest strategy ROI.
    scheduler.add_job(
        job_snapshot_upcoming_odds,
        trigger=CronTrigger(hour=5, minute=30),
        id="snapshot_upcoming_odds",
        name="v5 daily snapshot of upcoming odds",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc) + timedelta(minutes=8),
    )

    # Sync results daily at 06:00 UTC
    scheduler.add_job(
        job_sync_data,
        trigger=CronTrigger(hour=6, minute=0),
        id="daily_results_sync",
        name="Daily results sync",
        replace_existing=True,
    )

    # Historical predictions: generate batch of 100 every 5 min until all done
    scheduler.add_job(
        job_generate_historical_predictions,
        trigger=IntervalTrigger(minutes=5),
        id="historical_predictions",
        name="Generate historical predictions (batch 100)",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc) + timedelta(minutes=1),
    )

    # Abandoned checkout emails every 30 minutes
    scheduler.add_job(
        job_process_abandoned_checkouts,
        trigger=IntervalTrigger(minutes=30),
        id="abandoned_checkout_emails",
        name="Process abandoned checkout emails",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc) + timedelta(minutes=20),
    )

    # One-time backfill on startup
    scheduler.add_job(
        job_backfill_results,
        trigger=None,
        id="backfill_results",
        name="Backfill stale results",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc) + timedelta(minutes=3),
    )

    # ── @BetsPlug Telegram auto-poster ─────────────────────────────
    # Three Free-tier picks per day at 11 / 15 / 19 CET, one daily
    # summary at 23 CET, plus a result-update sweep every 15 minutes
    # so posted picks flip to ✅/❌ within ~15 min of final whistle.
    # CronTrigger timezone is Europe/Amsterdam so CEST/CET transitions
    # are handled automatically.
    from zoneinfo import ZoneInfo as _ZI
    _CET = _ZI("Europe/Amsterdam")

    scheduler.add_job(
        job_telegram_post_scheduled_pick,
        trigger=CronTrigger(hour=11, minute=0, timezone=_CET),
        id="telegram_pick_11_cet",
        name="Telegram @BetsPlug — 11:00 CET pick",
        replace_existing=True,
    )
    scheduler.add_job(
        job_telegram_post_scheduled_pick,
        trigger=CronTrigger(hour=15, minute=0, timezone=_CET),
        id="telegram_pick_15_cet",
        name="Telegram @BetsPlug — 15:00 CET pick",
        replace_existing=True,
    )
    scheduler.add_job(
        job_telegram_post_scheduled_pick,
        trigger=CronTrigger(hour=19, minute=0, timezone=_CET),
        id="telegram_pick_19_cet",
        name="Telegram @BetsPlug — 19:00 CET pick",
        replace_existing=True,
    )
    scheduler.add_job(
        job_telegram_post_daily_summary,
        trigger=CronTrigger(hour=23, minute=0, timezone=_CET),
        id="telegram_daily_summary",
        name="Telegram @BetsPlug — daily summary 23:00 CET",
        replace_existing=True,
    )
    scheduler.add_job(
        job_telegram_update_results,
        trigger=IntervalTrigger(minutes=15),
        id="telegram_update_results",
        name="Telegram @BetsPlug — result-update sweep",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc) + timedelta(minutes=4),
    )
    # Weekly tier-comparison promo — Sunday 18:00 CET. Placed before
    # prime-time fixtures so it lands when people are actively opening
    # the app, not in the middle of the night.
    scheduler.add_job(
        job_telegram_post_weekly_promo,
        trigger=CronTrigger(day_of_week="sun", hour=18, minute=0, timezone=_CET),
        id="telegram_weekly_promo",
        name="Telegram @BetsPlug — weekly tier promo",
        replace_existing=True,
    )

    scheduler.start()
    log.info("CRON: Scheduler started with %d jobs.", len(scheduler.get_jobs()))


def stop_scheduler():
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        log.info("CRON: Scheduler stopped.")
