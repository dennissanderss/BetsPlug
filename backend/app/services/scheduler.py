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

            # Collect IDs of upcoming matches that need predictions.
            # ORDER BY scheduled_at ASC so matches closest to kickoff get
            # forecasted first — a 10-min batch that runs out of time
            # (DB contention, feature-load slow) still covers the
            # imminent matches. Previously the scheduler could be
            # halfway through a 7-day horizon when a match 30 min out
            # silently missed its pre-match lock window.
            now = datetime.now(timezone.utc)
            cutoff = now + timedelta(days=7)
            matches_result = await db.execute(
                select(Match.id).where(
                    Match.status.in_([MatchStatus.SCHEDULED, MatchStatus.LIVE]),
                    Match.scheduled_at >= now,
                    Match.scheduled_at <= cutoff,
                ).order_by(Match.scheduled_at.asc())
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

                # ── Update DB ────────────────────────────────────────
                # Find the apifb-sourced match row plus any fd_org row for
                # the same fixture. Both must be flipped to LIVE/FINISHED
                # so predictions tied to either get evaluated and counted
                # in /live-measurement per tier.
                from sqlalchemy.orm import selectinload as _selin

                external_id = f"apifb_match_{api_id}"
                rows: list = []
                apifb_row = (
                    await db.execute(
                        select(Match)
                        .options(_selin(Match.home_team), _selin(Match.away_team))
                        .where(Match.external_id == external_id)
                    )
                ).scalar_one_or_none()
                if apifb_row is not None:
                    # Apifb is authoritative when present — don't also
                    # update a fd_org duplicate (would double-count when
                    # the same match has predictions on both rows).
                    rows.append(apifb_row)
                else:
                    # No apifb row — try a fuzzy fd_org match so legacy
                    # rows still get LIVE/FINISHED + a result. Without
                    # this, predictions on those rows never evaluate and
                    # never count toward /live-measurement per tier.
                    import re as _re
                    _SX = _re.compile(r"\b(fc|cf|afc|bfc|sc|bsc|ac|sk|sv|ssc|cd|fk|fck|fcm)\b", _re.I)
                    def _fuzzy(s: str) -> str:
                        if not s:
                            return ""
                        return _re.sub(r"[^a-z0-9]", "", _SX.sub(" ", s.lower()))

                    home_fuzzy = _fuzzy(home_name)
                    away_fuzzy = _fuzzy(away_name)
                    kickoff_iso = (fixture.get("date") or "")
                    kickoff_dt = None
                    if kickoff_iso:
                        try:
                            kickoff_dt = datetime.fromisoformat(kickoff_iso.replace("Z", "+00:00"))
                        except Exception:
                            kickoff_dt = None
                    if kickoff_dt is not None and home_fuzzy and away_fuzzy:
                        win_lo = kickoff_dt - timedelta(hours=2)
                        win_hi = kickoff_dt + timedelta(hours=2)
                        candidates = (
                            await db.execute(
                                select(Match)
                                .options(_selin(Match.home_team), _selin(Match.away_team))
                                .where(
                                    and_(
                                        Match.scheduled_at >= win_lo,
                                        Match.scheduled_at <= win_hi,
                                    )
                                )
                            )
                        ).scalars().all()
                        for cand in candidates:
                            chome = _fuzzy(cand.home_team.name if cand.home_team else "")
                            caway = _fuzzy(cand.away_team.name if cand.away_team else "")
                            if chome == home_fuzzy and caway == away_fuzzy:
                                rows.append(cand)
                                break  # Take the first match only

                if not rows:
                    continue  # Match not in our DB at all — skip

                ht_home = ht.get("home")
                ht_away = ht.get("away")
                winner = None
                if match_status == MatchStatus.FINISHED and home_goals is not None and away_goals is not None:
                    if home_goals > away_goals:
                        winner = "home"
                    elif away_goals > home_goals:
                        winner = "away"
                    else:
                        winner = "draw"

                for match_row in rows:
                    if match_row.status != match_status:
                        match_row.status = match_status

                    if home_goals is None or away_goals is None:
                        continue

                    result_row = (
                        await db.execute(
                            select(MatchResult).where(
                                MatchResult.match_id == match_row.id
                            )
                        )
                    ).scalar_one_or_none()

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
# @BetsPluggs Telegram auto-poster — scheduler adapters
# ──────────────────────────────────────────────────────────────────


def _telegram_pick_job_for_tier(tier_name: str):
    """Build a tier-scoped ``publish_scheduled_slot`` adapter.

    Returned coroutine matches the no-arg signature APScheduler expects.
    Each adapter logs with the tier name so the scheduler audit trail is
    legible across multiple tier channels.
    """
    async def _job():
        log.info("CRON: Telegram — posting scheduled %s pick", tier_name)
        try:
            from app.core.tier_system import PickTier
            from app.db.session import async_session_factory
            from app.services.telegram_posting import publish_scheduled_slot

            tier = PickTier[tier_name.upper()]
            async with async_session_factory() as db:
                post = await publish_scheduled_slot(db, tier=tier)
                if post is None:
                    log.info(
                        "CRON: Telegram — no eligible %s pick, skipping slot",
                        tier_name,
                    )
                else:
                    log.info(
                        "CRON: Telegram — posted %s pick id=%s msg_id=%s",
                        tier_name, post.id, post.telegram_message_id,
                    )
        except Exception as exc:
            log.error(
                "CRON: Telegram %s scheduled pick failed: %s",
                tier_name, exc, exc_info=True,
            )
    return _job


def _telegram_summary_job_for_tier(tier_name: str):
    async def _job():
        log.info("CRON: Telegram — posting %s daily summary", tier_name)
        try:
            from app.core.tier_system import PickTier
            from app.db.session import async_session_factory
            from app.services.telegram_posting import publish_daily_summary

            tier = PickTier[tier_name.upper()]
            async with async_session_factory() as db:
                post = await publish_daily_summary(db, tier=tier)
                if post is None:
                    log.info(
                        "CRON: Telegram — no %s picks today, summary skipped",
                        tier_name,
                    )
                else:
                    log.info(
                        "CRON: Telegram — %s daily summary posted msg_id=%s",
                        tier_name, post.telegram_message_id,
                    )
        except Exception as exc:
            log.error(
                "CRON: Telegram %s daily summary failed: %s",
                tier_name, exc, exc_info=True,
            )
    return _job


def _telegram_promo_job_for_tier(tier_name: str):
    async def _job():
        log.info("CRON: Telegram — posting %s weekly promo", tier_name)
        try:
            from app.core.tier_system import PickTier
            from app.db.session import async_session_factory
            from app.services.telegram_posting import publish_promo

            tier = PickTier[tier_name.upper()]
            async with async_session_factory() as db:
                post = await publish_promo(db, tier=tier)
                if post is None:
                    log.info(
                        "CRON: Telegram — %s channel not configured, promo skipped",
                        tier_name,
                    )
                else:
                    log.info(
                        "CRON: Telegram — %s weekly promo posted msg_id=%s",
                        tier_name, post.telegram_message_id,
                    )
        except Exception as exc:
            log.error(
                "CRON: Telegram %s weekly promo failed: %s",
                tier_name, exc, exc_info=True,
            )
    return _job


# Backward-compatible Free-tier adapters — kept as module-level callables
# because some tests / older imports reference them by name.
job_telegram_post_scheduled_pick = _telegram_pick_job_for_tier("free")
job_telegram_post_daily_summary = _telegram_summary_job_for_tier("free")


async def job_telegram_update_results():
    """Sweep pick posts whose fixtures have resolved and edit in the score.

    Runs across every configured tier channel — the result-update flow
    is purely per-channel (looks up unresolved posts in
    ``telegram_posts``) so we just iterate.
    """
    try:
        from app.core.tier_system import PickTier
        from app.db.session import async_session_factory
        from app.services.telegram_posting import update_all_pending_results

        async with async_session_factory() as db:
            total = 0
            for tier in (
                PickTier.FREE, PickTier.SILVER, PickTier.GOLD, PickTier.PLATINUM
            ):
                updated = await update_all_pending_results(db, tier=tier)
                total += updated
            if total:
                log.info(
                    "CRON: Telegram — %d pick posts updated with result (all tiers)",
                    total,
                )
    except Exception as exc:
        log.error("CRON: Telegram result sweep failed: %s", exc, exc_info=True)


async def job_generate_daily_combo():
    """Daily 08:05 CET job — pick today's 3-leg combo and persist it.

    Writes to ``combo_bets`` + ``combo_bet_legs`` with ``is_live=True``.
    Idempotent: ``uq_combo_bets_date_live`` plus a same-day short-
    circuit prevents duplicate inserts when the cron re-fires.
    """
    log.info("CRON: combi-van-de-dag — starting daily live selection")
    try:
        from app.db.session import async_session_factory
        from app.services.combo_bet_service import persist_daily_combo

        today = datetime.now(timezone.utc).date()
        async with async_session_factory() as db:
            combo = await persist_daily_combo(db, today, is_live=True)
            if combo is None:
                log.info("CRON: combi-van-de-dag — no qualifying combo for %s", today)
            else:
                log.info(
                    "CRON: combi-van-de-dag — persisted combo for %s (id=%s)",
                    today, combo.id,
                )
    except Exception:
        log.exception("CRON: combi-van-de-dag — failed")


async def job_evaluate_combos():
    """Periodic combo evaluator — grades any combo whose legs are
    all evaluated. Cheap, idempotent. Runs every 30 min."""
    log.info("CRON: combi-evaluator — sweep")
    try:
        from app.db.session import async_session_factory
        from app.services.combo_bet_service import evaluate_pending_combos

        async with async_session_factory() as db:
            graded = await evaluate_pending_combos(db)
            log.info("CRON: combi-evaluator — graded %d combos", graded)
    except Exception:
        log.exception("CRON: combi-evaluator — failed")


async def job_generate_daily_value_bet():
    """Daily 08:00 CET job — pick the single best value bet for today.

    Scans ``live`` predictions with a populated ``closing_odds_snapshot``
    for matches scheduled in the next 48 h, applies the
    ``ValueBetSelector`` filters (edge >= 3%, odds 1.50-5.00, tier in
    {gold, platinum}) and writes the highest-scoring candidate to
    ``value_bets`` with ``is_live = True``.

    Idempotent: ``uq_value_bets_prediction_live`` prevents double-insert
    of the same prediction in the live population.

    No op when no candidate qualifies — logged so the admin can see the
    reason on dry days.
    """
    log.info("CRON: value-bet — starting daily live selection")
    try:
        import uuid as _uuid
        from datetime import date as _date
        from sqlalchemy import and_, select as _select

        from app.db.session import async_session_factory
        from app.models.match import Match, MatchStatus
        from app.models.prediction import Prediction
        from app.models.value_bet import ValueBet
        from app.services.value_bet_service import (
            ValueBetConfig,
            ValueBetSelector,
            extract_candidate_from_snapshot,
            line_movement_fraction,
        )
        from app.models.odds import OddsHistory
        from app.core.tier_leagues import (
            LEAGUES_FREE,
            LEAGUES_GOLD,
            LEAGUES_PLATINUM,
            LEAGUES_SILVER,
        )
        from app.core.tier_system import CONF_THRESHOLD, PickTier

        selector = ValueBetSelector(ValueBetConfig())
        now = datetime.now(timezone.utc)
        window_end = now + timedelta(hours=48)
        today = now.date()

        def _classify(league_id, conf: float):
            lid = str(league_id)
            if lid in LEAGUES_PLATINUM and conf >= CONF_THRESHOLD[PickTier.PLATINUM]:
                return "platinum"
            if lid in LEAGUES_GOLD and conf >= CONF_THRESHOLD[PickTier.GOLD]:
                return "gold"
            if lid in LEAGUES_SILVER and conf >= CONF_THRESHOLD[PickTier.SILVER]:
                return "silver"
            if lid in LEAGUES_FREE and conf >= CONF_THRESHOLD[PickTier.FREE]:
                return "free"
            return None

        async with async_session_factory() as db:
            # Short-circuit: already have a live row for today?
            already = (
                await db.execute(
                    _select(ValueBet).where(
                        and_(
                            ValueBet.bet_date == today,
                            ValueBet.is_live.is_(True),
                        )
                    ).limit(1)
                )
            ).scalar_one_or_none()
            if already is not None:
                log.info(
                    "CRON: value-bet — already have live pick for %s (vb=%s), skipping",
                    today, already.id,
                )
                return

            stmt = (
                _select(Prediction, Match)
                .join(Match, Match.id == Prediction.match_id)
                .where(
                    Prediction.prediction_source == "live",
                    Prediction.closing_odds_snapshot.is_not(None),
                    Match.scheduled_at >= now,
                    Match.scheduled_at <= window_end,
                    Match.status == MatchStatus.SCHEDULED,
                )
            )
            rows = (await db.execute(stmt)).all()

            best = None
            best_pred = None
            best_match = None
            best_score = -float("inf")
            considered = 0
            qualified = 0
            for pred, match in rows:
                considered += 1
                snap = pred.closing_odds_snapshot
                if not snap:
                    continue
                tier = _classify(match.league_id, pred.confidence)
                cand = extract_candidate_from_snapshot(
                    prediction_id=pred.id,
                    match_id=pred.match_id,
                    home_prob=pred.home_win_prob,
                    draw_prob=pred.draw_prob,
                    away_prob=pred.away_win_prob,
                    confidence=pred.confidence,
                    tier=tier,
                    snapshot=snap,
                    selector=selector,
                    scheduled_at=match.scheduled_at,
                )
                if cand is None or not selector.passes_filters(cand):
                    continue
                # Fase 2.4 — drop candidate when odds have moved too much
                # in the last 24h (late injury/news proxy). Reads a small
                # subquery per candidate; candidate set is already
                # pre-filtered to just Gold/Platinum + edge >= 3% so
                # cardinality stays tiny (typically <10 per day).
                try:
                    lm_stmt = (
                        _select(OddsHistory.home_odds, OddsHistory.draw_odds, OddsHistory.away_odds)
                        .where(
                            OddsHistory.match_id == pred.match_id,
                            OddsHistory.market == "1x2",
                            OddsHistory.recorded_at >= now - timedelta(hours=24),
                        )
                        .order_by(OddsHistory.recorded_at)
                    )
                    lm_rows = (await db.execute(lm_stmt)).all()
                    pick_col = {"home": 0, "draw": 1, "away": 2}[cand.pick]
                    readings = [r[pick_col] for r in lm_rows if r[pick_col]]
                    frac = line_movement_fraction(readings)
                    if frac is not None and frac > selector.config.max_line_movement_pct:
                        log.info(
                            "CRON: value-bet — dropping prediction %s (line moved %.1f%% > %.1f%% threshold)",
                            pred.id, frac * 100, selector.config.max_line_movement_pct * 100,
                        )
                        continue
                except Exception as exc:  # pragma: no cover — defensive
                    log.debug("line-movement check failed (non-fatal): %s", exc)
                qualified += 1
                score = selector.score(cand)
                if score > best_score:
                    best_score = score
                    best = cand
                    best_pred = pred
                    best_match = match

            if best is None:
                log.info(
                    "CRON: value-bet — no qualifying pick (considered=%d, qualified=%d)",
                    considered, qualified,
                )
                return

            vb = ValueBet(
                id=_uuid.uuid4(),
                prediction_id=best.prediction_id,
                match_id=best.match_id,
                bet_date=(best_match.scheduled_at.date() if best_match else today),
                picked_at=now,
                our_pick=best.pick,
                our_probability=best.our_probability,
                our_probability_home=best.our_prob_home,
                our_probability_draw=best.our_prob_draw,
                our_probability_away=best.our_prob_away,
                our_confidence=best.confidence,
                prediction_tier=best.tier,
                odds_source=best.odds_source,
                odds_home=best.odds_home,
                odds_draw=best.odds_draw,
                odds_away=best.odds_away,
                odds_snapshot_at=best.odds_snapshot_at,
                best_odds_for_pick=best.best_odds_for_pick,
                bookmaker_implied_home=1.0 / best.odds_home,
                bookmaker_implied_draw=(
                    1.0 / best.odds_draw if best.odds_draw else None
                ),
                bookmaker_implied_away=1.0 / best.odds_away,
                overround=best.overround,
                margin=best.margin,
                fair_implied_home=best.fair_home,
                fair_implied_draw=best.fair_draw,
                fair_implied_away=best.fair_away,
                normalization_method=selector.config.normalization_method,
                edge=best.edge,
                expected_value=best.expected_value,
                kelly_fraction=best.kelly,
                is_live=True,
                is_evaluated=False,
            )
            db.add(vb)
            try:
                await db.commit()
                log.info(
                    "CRON: value-bet — LIVE pick created id=%s pick=%s edge=%.2f%% odds=%.2f tier=%s",
                    vb.id, vb.our_pick, vb.edge * 100, vb.best_odds_for_pick, vb.prediction_tier,
                )
            except Exception as exc:
                await db.rollback()
                # Uniqueness violation = someone else inserted first; safe to ignore
                log.warning(
                    "CRON: value-bet — insert rejected (likely duplicate): %s", exc
                )
    except Exception as exc:
        log.error("CRON: value-bet daily selection failed: %s", exc, exc_info=True)


job_telegram_post_weekly_promo = _telegram_promo_job_for_tier("free")


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

    # ── @BetsPluggs Telegram auto-poster ─────────────────────────────
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
        name="Telegram @BetsPluggs — 11:00 CET pick",
        replace_existing=True,
    )
    scheduler.add_job(
        job_telegram_post_scheduled_pick,
        trigger=CronTrigger(hour=15, minute=0, timezone=_CET),
        id="telegram_pick_15_cet",
        name="Telegram @BetsPluggs — 15:00 CET pick",
        replace_existing=True,
    )
    scheduler.add_job(
        job_telegram_post_scheduled_pick,
        trigger=CronTrigger(hour=19, minute=0, timezone=_CET),
        id="telegram_pick_19_cet",
        name="Telegram @BetsPluggs — 19:00 CET pick",
        replace_existing=True,
    )
    scheduler.add_job(
        job_telegram_post_daily_summary,
        trigger=CronTrigger(hour=23, minute=0, timezone=_CET),
        id="telegram_daily_summary",
        name="Telegram @BetsPluggs — daily summary 23:00 CET",
        replace_existing=True,
    )
    scheduler.add_job(
        job_telegram_update_results,
        trigger=IntervalTrigger(minutes=15),
        id="telegram_update_results",
        name="Telegram @BetsPluggs — result-update sweep",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc) + timedelta(minutes=4),
    )
    # Daily value-bet selection — 08:00 CET so subscribers see today's
    # pick during morning coffee. Writes to value_bets with is_live=True.
    # Idempotent (uq_value_bets_prediction_live + same-day short-circuit).
    scheduler.add_job(
        job_generate_daily_value_bet,
        trigger=CronTrigger(hour=8, minute=0, timezone=_CET),
        id="value_bet_daily",
        name="Value-bet daily live selection",
        replace_existing=True,
    )

    # Daily Combi-van-de-Dag selection — 08:05 CET (5 min after the
    # single-pick value bet). Writes to combo_bets with is_live=True.
    # Idempotent (uq_combo_bets_date_live + same-day short-circuit).
    scheduler.add_job(
        job_generate_daily_combo,
        trigger=CronTrigger(hour=8, minute=5, timezone=_CET),
        id="combo_bet_daily",
        name="Combi van de Dag — daily live selection",
        replace_existing=True,
    )

    # Combi evaluator — every 30 min, grade any combo whose legs are
    # all evaluated. Cheap idempotent sweep; updates is_correct +
    # profit_loss_units when match outcomes have rolled in.
    scheduler.add_job(
        job_evaluate_combos,
        trigger=IntervalTrigger(minutes=30),
        id="combo_bet_evaluator",
        name="Combi van de Dag — evaluator sweep",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc) + timedelta(minutes=2),
    )

    # Weekly tier-comparison promo — Sunday 18:00 CET. Placed before
    # prime-time fixtures so it lands when people are actively opening
    # the app, not in the middle of the night.
    scheduler.add_job(
        job_telegram_post_weekly_promo,
        trigger=CronTrigger(day_of_week="sun", hour=18, minute=0, timezone=_CET),
        id="telegram_weekly_promo",
        name="Telegram @BetsPluggs — weekly tier promo",
        replace_existing=True,
    )

    # ── Paid-tier Telegram channels (silver / gold / platinum) ────────
    # Each tier registers the same 3 picks/day + daily summary + weekly
    # promo cadence as Free, but only when its channel env var is set.
    # That gives a clean "configure once on Railway and it lights up"
    # path for adding new channels without code changes.
    from app.core.config import get_settings as _get_settings
    import os as _os

    _settings = _get_settings()
    # Read via Pydantic Settings first, fall back to raw os.getenv. The
    # fallback covers Railway env-propagation edge cases (we observed a
    # case where Settings loaded SILVER but not GOLD/PLATINUM at boot
    # despite all three being set in Railway's Variables UI). The
    # process env still has them, so os.getenv() picks up the slack
    # without requiring further code or env-edit ceremony.
    def _resolve_tier_env(pyd_value: str, env_name: str) -> str:
        return (pyd_value or _os.getenv(env_name, "") or "").strip()

    _tier_channels: list[tuple[str, str]] = [
        (
            "silver",
            _resolve_tier_env(
                _settings.telegram_channel_silver, "TELEGRAM_CHANNEL_SILVER"
            ),
        ),
        (
            "gold",
            _resolve_tier_env(
                _settings.telegram_channel_gold, "TELEGRAM_CHANNEL_GOLD"
            ),
        ),
        (
            "platinum",
            _resolve_tier_env(
                _settings.telegram_channel_platinum,
                "TELEGRAM_CHANNEL_PLATINUM",
            ),
        ),
    ]
    for _tier_name, _channel in _tier_channels:
        if not _channel:
            log.info(
                "CRON: Telegram %s channel not set — skipping cron registration",
                _tier_name,
            )
            continue
        _pick_job = _telegram_pick_job_for_tier(_tier_name)
        _summary_job = _telegram_summary_job_for_tier(_tier_name)
        _promo_job = _telegram_promo_job_for_tier(_tier_name)
        for _hour in (11, 15, 19):
            scheduler.add_job(
                _pick_job,
                trigger=CronTrigger(hour=_hour, minute=0, timezone=_CET),
                id=f"telegram_{_tier_name}_pick_{_hour:02d}_cet",
                name=f"Telegram {_tier_name} — {_hour:02d}:00 CET pick",
                replace_existing=True,
            )
        scheduler.add_job(
            _summary_job,
            trigger=CronTrigger(hour=23, minute=0, timezone=_CET),
            id=f"telegram_{_tier_name}_daily_summary",
            name=f"Telegram {_tier_name} — daily summary 23:00 CET",
            replace_existing=True,
        )
        scheduler.add_job(
            _promo_job,
            trigger=CronTrigger(
                day_of_week="sun", hour=18, minute=0, timezone=_CET,
            ),
            id=f"telegram_{_tier_name}_weekly_promo",
            name=f"Telegram {_tier_name} — weekly promo",
            replace_existing=True,
        )
        log.info(
            "CRON: Telegram %s scheduler registered (channel=%s)",
            _tier_name, _channel,
        )

    scheduler.start()
    log.info("CRON: Scheduler started with %d jobs.", len(scheduler.get_jobs()))


def stop_scheduler():
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        log.info("CRON: Scheduler stopped.")
