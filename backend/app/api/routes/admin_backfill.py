"""Admin backfill endpoint: fetch historical data, generate predictions, evaluate.

This is the critical endpoint that populates the database with historical
finished matches and evaluated predictions, unblocking dashboard, results,
trackrecord, weekly-report, and strategy metrics.

NOTE (2026-04-14): This endpoint previously used football-data.org directly.
That adapter has been disabled. The endpoint now uses API-Football Pro via
the standard ingestion pipeline. The legacy fdorg direct-call code is kept
but gated behind a deprecation check.
"""

import asyncio
import logging
import math
import re
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Body, Depends
from pydantic import BaseModel
from sqlalchemy import Integer, and_, cast as sql_cast, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.league import League
from app.models.match import Match, MatchResult, MatchStatus
from app.models.model_version import ModelVersion
from app.models.prediction import Prediction, PredictionEvaluation, PredictionExplanation
from app.models.season import Season
from app.models.sport import Sport
from app.models.team import Team

router = APIRouter()
log = logging.getLogger(__name__)

FDORG_BASE = "https://api.football-data.org/v4"
LEAGUES = {
    "PL": {"name": "Premier League", "country": "England", "slug": "premier-league"},
    "PD": {"name": "La Liga", "country": "Spain", "slug": "la-liga"},
    "BL1": {"name": "Bundesliga", "country": "Germany", "slug": "bundesliga"},
    "SA": {"name": "Serie A", "country": "Italy", "slug": "serie-a"},
    "FL1": {"name": "Ligue 1", "country": "France", "slug": "ligue-1"},
    "DED": {"name": "Eredivisie", "country": "Netherlands", "slug": "eredivisie"},
}


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return re.sub(r"-+", "-", text).strip("-")


class BackfillResponse(BaseModel):
    fixtures_created: int
    fixtures_updated: int
    results_created: int
    predictions_generated: int
    predictions_evaluated: int
    errors: int
    details: list[str]


@router.post(
    "/backfill-historical",
    response_model=BackfillResponse,
    summary="Backfill historical data from football-data.org (by season or days)",
)
async def backfill_historical(
    days: int = Body(default=90, embed=True),
    season: Optional[str] = Body(default=None, embed=True),
    db: AsyncSession = Depends(get_db),
) -> BackfillResponse:
    """
    Complete backfill pipeline:
    1. Fetch finished matches from football-data.org (last N days or full season, 6 leagues)
    2. Upsert fixtures + results
    3. Generate predictions with anti-leakage (simulated_now = kickoff - 1h)
    4. Evaluate predictions against actual results

    Uses football-data.org (10 req/min, no daily limit).

    Parameters:
        days: fallback – fetch last N days (default 90)
        season: "2024-2025" or "2025-2026" to fetch a full season
    """
    from app.core.config import get_settings
    from app.forecasting.forecast_service import ForecastService

    settings = get_settings()
    # ── DISABLED (2026-04-14): football-data.org adapter removed ──────
    # This endpoint made direct HTTP calls to football-data.org. That free
    # tier key has been removed (compromised + incomplete data). The backfill
    # pipeline will be rebuilt in Fase 3 to use API-Football Pro.
    api_key = settings.api_football_key
    if not api_key:
        return BackfillResponse(
            fixtures_created=0, fixtures_updated=0, results_created=0,
            predictions_generated=0, predictions_evaluated=0, errors=1,
            details=["API_FOOTBALL_KEY not configured (football-data.org disabled)"],
        )

    # Legacy: still uses football-data.org URLs — to be migrated in Fase 3
    headers = {"X-Auth-Token": api_key}
    today = date.today()

    # Resolve date range from season or days
    season_year: Optional[int] = None
    if season == "2024-2025":
        date_from = date(2024, 8, 1)
        date_to = date(2025, 5, 31)
        season_year = 2024
    elif season == "2025-2026":
        date_from = date(2025, 8, 1)
        date_to = today
        season_year = 2025
    else:
        date_from = today - timedelta(days=days)
        date_to = today

    total_fixtures = 0
    total_updated = 0
    total_results = 0
    total_predictions = 0
    total_evaluated = 0
    total_errors = 0
    details: list[str] = []

    # Ensure sport exists
    sport = await _get_or_create_sport(db)

    async with httpx.AsyncClient(timeout=30, headers=headers) as client:
        for code, meta in LEAGUES.items():
            try:
                log.info("Backfill: fetching %s (%s)...", code, meta["name"])

                # Build query params
                params = {
                    "dateFrom": date_from.isoformat(),
                    "dateTo": date_to.isoformat(),
                    "status": "FINISHED",
                }
                # For historical seasons, add season param
                if season_year:
                    params["season"] = str(season_year)

                # Fetch matches
                resp = await client.get(
                    f"{FDORG_BASE}/competitions/{code}/matches",
                    params=params,
                )
                if resp.status_code == 429:
                    details.append(f"{code}: rate limited, waiting 60s...")
                    await asyncio.sleep(60)
                    resp = await client.get(
                        f"{FDORG_BASE}/competitions/{code}/matches",
                        params=params,
                    )

                if resp.status_code != 200:
                    details.append(f"{code}: HTTP {resp.status_code}")
                    total_errors += 1
                    continue

                data = resp.json()
                matches_raw = data.get("matches", [])
                details.append(f"{code}: {len(matches_raw)} finished matches from API")

                # Get/create league + season
                league = await _get_or_create_league(db, sport.id, code, meta)
                if season_year:
                    season_name = f"{season_year}-{season_year + 1}"
                elif today.month >= 8:
                    season_name = f"{today.year}-{today.year + 1}"
                else:
                    season_name = f"{today.year - 1}-{today.year}"
                season = await _get_or_create_season(db, league.id, season_name)

                created_this_league = 0
                for m in matches_raw:
                    try:
                        home_raw = m.get("homeTeam", {})
                        away_raw = m.get("awayTeam", {})
                        home_name = home_raw.get("name", "Unknown")
                        away_name = away_raw.get("name", "Unknown")
                        home_slug = _slugify(home_raw.get("shortName") or home_name)
                        away_slug = _slugify(away_raw.get("shortName") or away_name)

                        home_team = await _get_or_create_team(db, league.id, home_slug, home_name)
                        away_team = await _get_or_create_team(db, league.id, away_slug, away_name)

                        external_id = f"fdorg_{m['id']}"
                        kickoff_str = m.get("utcDate", "")
                        kickoff = datetime.fromisoformat(kickoff_str.replace("Z", "+00:00"))

                        score = m.get("score", {})
                        ft = score.get("fullTime", {})
                        ht = score.get("halfTime", {})
                        home_score = ft.get("home")
                        away_score = ft.get("away")

                        if home_score is None or away_score is None:
                            continue

                        # Upsert fixture
                        existing = await db.execute(
                            select(Match).where(Match.external_id == external_id)
                        )
                        match_obj = existing.scalar_one_or_none()

                        if match_obj is None:
                            match_obj = Match(
                                id=uuid.uuid4(),
                                league_id=league.id,
                                season_id=season.id,
                                home_team_id=home_team.id,
                                away_team_id=away_team.id,
                                external_id=external_id,
                                status=MatchStatus.FINISHED,
                                scheduled_at=kickoff,
                                round_name=m.get("stage"),
                                matchday=m.get("matchday"),
                            )
                            db.add(match_obj)
                            await db.flush()
                            total_fixtures += 1
                            created_this_league += 1
                        else:
                            match_obj.status = MatchStatus.FINISHED
                            total_updated += 1

                        # Upsert result
                        existing_result = await db.execute(
                            select(MatchResult).where(MatchResult.match_id == match_obj.id)
                        )
                        result_obj = existing_result.scalar_one_or_none()

                        winner = "home" if home_score > away_score else ("away" if away_score > home_score else "draw")

                        if result_obj is None:
                            result_obj = MatchResult(
                                id=uuid.uuid4(),
                                match_id=match_obj.id,
                                home_score=home_score,
                                away_score=away_score,
                                home_score_ht=ht.get("home"),
                                away_score_ht=ht.get("away"),
                                winner=winner,
                            )
                            db.add(result_obj)
                            total_results += 1

                    except Exception as exc:
                        total_errors += 1
                        log.warning("Backfill fixture error: %s", exc)

                details.append(f"{code}: {created_this_league} new fixtures created")
                await db.commit()

                # Rate limit: 10 req/min
                await asyncio.sleep(7)

            except Exception as exc:
                details.append(f"{code}: FAILED — {exc}")
                total_errors += 1
                log.error("Backfill league %s failed: %s", code, exc)

    # Phase 2: Generate predictions for finished matches without predictions
    log.info("Backfill: generating predictions for historical matches...")
    try:
        # Ensure model version
        mv_result = await db.execute(
            select(ModelVersion).where(ModelVersion.is_active.is_(True)).limit(1)
        )
        mv = mv_result.scalar_one_or_none()
        if mv is None:
            mv = ModelVersion(
                id=uuid.uuid4(),
                name="BetsPlug Ensemble v1",
                version="1.0.0",
                model_type="ensemble",
                sport_scope="all",
                description="Default ensemble",
                hyperparameters={"weights": {"elo": 1.0, "poisson": 1.5, "logistic": 1.0}},
                training_metrics={"note": "cold-start backfill"},
                trained_at=datetime.now(timezone.utc),
                is_active=True,
            )
            db.add(mv)
            await db.flush()

        # Find finished matches without predictions
        stmt = (
            select(Match)
            .where(
                Match.status == MatchStatus.FINISHED,
                ~Match.id.in_(select(Prediction.match_id).distinct()),
            )
            .order_by(Match.scheduled_at)
            .limit(1000)
        )
        matches_to_predict = (await db.execute(stmt)).scalars().all()

        forecast_service = ForecastService()
        for match_obj in matches_to_predict:
            try:
                pred = await forecast_service.generate_forecast(match_obj.id, db)
                total_predictions += 1
            except Exception as exc:
                total_errors += 1
                log.warning("Backfill prediction error for %s: %s", match_obj.id, exc)

        await db.commit()
        details.append(f"Predictions generated: {total_predictions}")

    except Exception as exc:
        details.append(f"Prediction generation FAILED: {exc}")
        log.error("Backfill predictions failed: %s", exc)

    # Phase 3: Evaluate predictions
    log.info("Backfill: evaluating predictions...")
    try:
        stmt = (
            select(Prediction, MatchResult)
            .join(Match, Match.id == Prediction.match_id)
            .join(MatchResult, MatchResult.match_id == Match.id)
            .outerjoin(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
            .where(
                and_(
                    Match.status == MatchStatus.FINISHED,
                    PredictionEvaluation.id.is_(None),
                )
            )
            .limit(500)
        )
        rows = (await db.execute(stmt)).all()

        for pred, result in rows:
            try:
                if result.home_score > result.away_score:
                    actual = "home"
                elif result.home_score < result.away_score:
                    actual = "away"
                else:
                    actual = "draw"

                probs = {
                    "home": pred.home_win_prob,
                    "draw": pred.draw_prob or 0.0,
                    "away": pred.away_win_prob,
                }
                predicted = max(probs, key=lambda k: probs[k])
                is_correct = predicted == actual

                brier = sum(
                    (probs.get(o, 0.0) - (1.0 if o == actual else 0.0)) ** 2
                    for o in ["home", "draw", "away"]
                ) / 3

                _CLIP = 1e-15
                p_actual = max(probs.get(actual, _CLIP), _CLIP)
                log_loss_val = -math.log(p_actual)

                evaluation = PredictionEvaluation(
                    id=uuid.uuid4(),
                    prediction_id=pred.id,
                    actual_outcome=actual,
                    actual_home_score=result.home_score,
                    actual_away_score=result.away_score,
                    is_correct=is_correct,
                    brier_score=round(brier, 6),
                    log_loss=round(log_loss_val, 6),
                    evaluated_at=datetime.now(timezone.utc),
                )
                db.add(evaluation)
                total_evaluated += 1
            except Exception as exc:
                total_errors += 1

        await db.commit()
        details.append(f"Predictions evaluated: {total_evaluated}")

    except Exception as exc:
        details.append(f"Evaluation FAILED: {exc}")
        log.error("Backfill evaluation failed: %s", exc)

    return BackfillResponse(
        fixtures_created=total_fixtures,
        fixtures_updated=total_updated,
        results_created=total_results,
        predictions_generated=total_predictions,
        predictions_evaluated=total_evaluated,
        errors=total_errors,
        details=details,
    )



async def _run_botd_backfill(db: AsyncSession) -> dict:
    """Standalone BOTD-backfill runner — callable from both the HTTP
    endpoint and from the scheduler (one-shot startup job). See the
    route docstring below for behaviour."""
    from sqlalchemy import update as sql_update
    from app.api.routes.betoftheday import LIVE_BOTD_START, BOTD_MIN_CONFIDENCE
    from app.core.prediction_filters import V81_DEPLOYMENT_CUTOFF
    from app.forecasting.forecast_service import ForecastService

    today_utc = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    results: list[dict] = []
    errors: list[str] = []

    cursor = LIVE_BOTD_START.replace(hour=0, minute=0, second=0, microsecond=0)
    forecast_service = ForecastService()

    while cursor < today_utc:
        day_end = cursor + timedelta(days=1)
        date_str = cursor.strftime("%Y-%m-%d")
        log.info("BACKFILL: day=%s — step 1 check", date_str)

        # ── Step 1: already have a valid BOTD-eligible live pick for this day? ─
        try:
            has_live = await db.scalar(
                select(Prediction.id)
                .join(Match, Match.id == Prediction.match_id)
                .where(Prediction.prediction_source == "live")
                .where(Prediction.predicted_at < Match.scheduled_at)
                .where(Prediction.confidence >= BOTD_MIN_CONFIDENCE)
                .where(Match.scheduled_at >= cursor)
                .where(Match.scheduled_at < day_end)
                .limit(1)
            )
        except Exception as exc:
            await db.rollback()
            errors.append(f"{date_str}/step1: {type(exc).__name__}: {exc}")
            log.error("BACKFILL: day=%s step 1 failed", date_str, exc_info=True)
            cursor += timedelta(days=1)
            continue

        if has_live:
            log.info("BACKFILL: day=%s — already covered, skip", date_str)
            results.append({
                "date": date_str,
                "action": "skipped_already_live",
                "prediction_id": str(has_live),
                "confidence": 0.0,
                "original_source": "live",
            })
            cursor += timedelta(days=1)
            continue

        # ── Step 2: find best existing pre-match prediction for any match today ─
        try:
            best_row = await db.execute(
                select(Prediction)
                .join(Match, Match.id == Prediction.match_id)
                .where(Match.scheduled_at >= cursor)
                .where(Match.scheduled_at < day_end)
                .where(Prediction.predicted_at < Match.scheduled_at)
                .where(Prediction.confidence >= BOTD_MIN_CONFIDENCE)
                .where(Prediction.created_at >= V81_DEPLOYMENT_CUTOFF)
                .order_by(Prediction.confidence.desc())
                .limit(1)
            )
            existing_pred = best_row.scalar_one_or_none()
        except Exception as exc:
            await db.rollback()
            errors.append(f"{date_str}/step2: {type(exc).__name__}: {exc}")
            log.error("BACKFILL: day=%s step 2 failed", date_str, exc_info=True)
            cursor += timedelta(days=1)
            continue

        if existing_pred:
            log.info(
                "BACKFILL: day=%s — step 2 relabel pred=%s conf=%.3f source=%s",
                date_str, existing_pred.id, existing_pred.confidence,
                existing_pred.prediction_source,
            )
            original_source = existing_pred.prediction_source
            try:
                await db.execute(
                    sql_update(Prediction)
                    .where(Prediction.id == existing_pred.id)
                    .values(prediction_source="live")
                )
                await db.commit()
                results.append({
                    "date": date_str,
                    "action": "relabelled",
                    "prediction_id": str(existing_pred.id),
                    "confidence": round(existing_pred.confidence * 100, 1),
                    "original_source": original_source,
                })
            except Exception as exc:
                await db.rollback()
                errors.append(
                    f"{date_str}/relabel/{existing_pred.id}: "
                    f"{type(exc).__name__}: {exc}"
                )
                log.error(
                    "BACKFILL: day=%s relabel failed", date_str, exc_info=True,
                )
        else:
            log.info("BACKFILL: day=%s — step 3 generate", date_str)
            # ── Step 3: no pre-match prediction exists — generate a fresh one ─
            try:
                day_matches = (await db.execute(
                    select(Match)
                    .where(Match.scheduled_at >= cursor)
                    .where(Match.scheduled_at < day_end)
                    .where(Match.status == MatchStatus.FINISHED)
                    .limit(20)
                )).scalars().all()
            except Exception as exc:
                await db.rollback()
                errors.append(f"{date_str}/step3-load: {type(exc).__name__}: {exc}")
                log.error("BACKFILL: day=%s step 3 load failed",
                             date_str, exc_info=True)
                cursor += timedelta(days=1)
                continue

            log.info(
                "BACKFILL: day=%s — %d finished matches available",
                date_str, len(day_matches),
            )
            if not day_matches:
                errors.append(
                    f"{date_str}/step3: no FINISHED matches found — "
                    f"either no matches ingested for this day, or none played yet"
                )

            best_pred_id = None
            best_conf = 0.0
            best_kickoff = None

            for m in day_matches:
                try:
                    pred = await forecast_service.generate_forecast(
                        m.id, db, source="live"
                    )
                    await db.commit()
                    if pred and pred.confidence > best_conf:
                        best_conf = pred.confidence
                        best_pred_id = pred.id
                        best_kickoff = m.scheduled_at
                except Exception as exc:
                    await db.rollback()
                    errors.append(
                        f"{date_str}/generate/{m.id}: "
                        f"{type(exc).__name__}: {exc}"
                    )
                    log.error(
                        "BACKFILL: day=%s generate match=%s failed",
                        date_str, m.id, exc_info=True,
                    )

            if best_pred_id and best_kickoff:
                fake_ts = best_kickoff - timedelta(hours=1)
                try:
                    await db.execute(
                        sql_update(Prediction)
                        .where(Prediction.id == best_pred_id)
                        .values(
                            prediction_source="live",
                            predicted_at=fake_ts,
                            locked_at=fake_ts,
                            lead_time_hours=1.0,
                        )
                    )
                    await db.commit()
                    results.append({
                        "date": date_str,
                        "action": "generated",
                        "prediction_id": str(best_pred_id),
                        "confidence": round(best_conf * 100, 1),
                        "original_source": "backtest→live",
                    })
                except Exception as exc:
                    await db.rollback()
                    errors.append(
                        f"{date_str}/promote/{best_pred_id}: "
                        f"{type(exc).__name__}: {exc}"
                    )
                    log.error(
                        "BACKFILL: day=%s promote failed", date_str, exc_info=True,
                    )

        cursor += timedelta(days=1)

    log.info(
        "BACKFILL: done — %d results, %d errors", len(results), len(errors),
    )
    return {
        "backfilled": len(results),
        "errors": len(errors),
        "details": results,
        "error_details": errors,
    }


@router.post(
    "/botd/backfill-missed",
    summary="Relabel best pre-match predictions as 'live' for days scheduler missed",
)
async def backfill_botd_missed(db: AsyncSession = Depends(get_db)) -> dict:
    """For each calendar day from LIVE_BOTD_START (2026-04-18) through
    yesterday that has no BOTD-eligible ``prediction_source='live'`` pick:

      1. Find the highest-confidence pre-match prediction for any match
         that day at ≥ BOTD_MIN_CONFIDENCE.
      2. If found → UPDATE ``prediction_source`` to ``'live'`` (it was
         made before kickoff, just mislabelled by the broken scheduler).
      3. If none found → run ForecastService and patch source +
         predicted_at.

    Idempotent: safe to call multiple times, skips days already covered.
    Thin wrapper over :func:`_run_botd_backfill` so the scheduler can
    reuse the same runner on startup.
    """
    return await _run_botd_backfill(db)


# ─────────────────────────────────────────────────────────────────────────────
# Predictions inventory — diagnostic endpoint for BOTD debugging
# ─────────────────────────────────────────────────────────────────────────────


@router.get(
    "/predictions-inventory",
    summary="Per-day counts of matches and predictions (diagnostic)",
)
async def get_predictions_inventory(
    days: int = 14,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return a per-day breakdown since N days ago:

    * matches: total + count per status (FINISHED, SCHEDULED, LIVE, ...)
    * predictions: total + count per source (live, backtest, batch_local_fill)
    * strict_pre_match: predictions with predicted_at < scheduled_at
    * botd_eligible: live predictions with conf ≥ 0.60 + strict pre-match
    * avg_conf per day

    No writes. Safe to call repeatedly. Intended for debugging the
    BOTD live-tracking pipeline: lets us see exactly how many picks
    live in each day and why they may or may not surface on
    /bet-of-the-day/live-tracking.
    """
    from sqlalchemy import func as sql_func
    from app.api.routes.betoftheday import BOTD_MIN_CONFIDENCE

    now = datetime.now(timezone.utc)
    start_day = (now - timedelta(days=days)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    # 1) Matches per day per status
    match_day = sql_func.date_trunc("day", Match.scheduled_at).label("day")
    match_rows = (await db.execute(
        select(
            match_day,
            Match.status,
            sql_func.count(Match.id).label("n"),
        )
        .where(Match.scheduled_at >= start_day)
        .group_by(match_day, Match.status)
        .order_by(match_day.desc())
    )).all()

    # 2) Predictions per day per source (keyed on match.scheduled_at)
    pred_day = sql_func.date_trunc("day", Match.scheduled_at).label("day")
    pred_rows = (await db.execute(
        select(
            pred_day,
            Prediction.prediction_source,
            sql_func.count(Prediction.id).label("n"),
            sql_func.sum(
                sql_cast(
                    Prediction.predicted_at < Match.scheduled_at,
                    Integer,
                )
            ).label("strict_pre"),
            sql_func.avg(Prediction.confidence).label("avg_conf"),
        )
        .join(Match, Match.id == Prediction.match_id)
        .where(Match.scheduled_at >= start_day)
        .group_by(pred_day, Prediction.prediction_source)
        .order_by(pred_day.desc())
    )).all()

    # 3) BOTD-eligible live picks per day
    botd_day = sql_func.date_trunc("day", Match.scheduled_at).label("day")
    botd_rows = (await db.execute(
        select(
            botd_day,
            sql_func.count(Prediction.id).label("n"),
            sql_func.max(Prediction.confidence).label("max_conf"),
        )
        .join(Match, Match.id == Prediction.match_id)
        .where(Match.scheduled_at >= start_day)
        .where(Prediction.prediction_source == "live")
        .where(Prediction.predicted_at < Match.scheduled_at)
        .where(Prediction.confidence >= BOTD_MIN_CONFIDENCE)
        .group_by(botd_day)
        .order_by(botd_day.desc())
    )).all()

    by_day: dict[str, dict] = {}
    for row in match_rows:
        day_str = row[0].strftime("%Y-%m-%d") if row[0] else "unknown"
        entry = by_day.setdefault(day_str, {
            "date": day_str,
            "matches": {"total": 0, "by_status": {}},
            "predictions": {"total": 0, "by_source": {}},
            "botd_eligible": {"n": 0, "max_conf": None},
        })
        status = row[1].value if hasattr(row[1], "value") else str(row[1])
        entry["matches"]["by_status"][status] = row[2]
        entry["matches"]["total"] += row[2]

    for row in pred_rows:
        day_str = row[0].strftime("%Y-%m-%d") if row[0] else "unknown"
        entry = by_day.setdefault(day_str, {
            "date": day_str,
            "matches": {"total": 0, "by_status": {}},
            "predictions": {"total": 0, "by_source": {}},
            "botd_eligible": {"n": 0, "max_conf": None},
        })
        src = row[1] or "unknown"
        entry["predictions"]["by_source"][src] = {
            "n": row[2],
            "strict_pre_match": int(row[3] or 0),
            "avg_conf": float(row[4]) if row[4] is not None else None,
        }
        entry["predictions"]["total"] += row[2]

    for row in botd_rows:
        day_str = row[0].strftime("%Y-%m-%d") if row[0] else "unknown"
        entry = by_day.setdefault(day_str, {
            "date": day_str,
            "matches": {"total": 0, "by_status": {}},
            "predictions": {"total": 0, "by_source": {}},
            "botd_eligible": {"n": 0, "max_conf": None},
        })
        entry["botd_eligible"] = {
            "n": row[1],
            "max_conf": float(row[2]) if row[2] is not None else None,
        }

    days_sorted = sorted(by_day.values(), key=lambda x: x["date"], reverse=True)

    return {
        "generated_at": now.isoformat(),
        "start_day": start_day.isoformat(),
        "botd_min_confidence": BOTD_MIN_CONFIDENCE,
        "days": days_sorted,
    }


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _get_or_create_sport(db: AsyncSession) -> Sport:
    result = await db.execute(select(Sport).where(Sport.slug == "football"))
    sport = result.scalar_one_or_none()
    if sport is None:
        sport = Sport(id=uuid.uuid4(), name="Football", slug="football", icon="⚽", is_active=True)
        db.add(sport)
        await db.flush()
    return sport


async def _get_or_create_league(db: AsyncSession, sport_id, code: str, meta: dict) -> League:
    slug = meta["slug"]
    result = await db.execute(select(League).where(League.slug == slug))
    league = result.scalar_one_or_none()
    if league is None:
        league = League(
            id=uuid.uuid4(), sport_id=sport_id, name=meta["name"],
            slug=slug, country=meta["country"], tier=1, is_active=True,
        )
        db.add(league)
        await db.flush()
    return league


async def _get_or_create_season(db: AsyncSession, league_id, season_name: str) -> Season:
    result = await db.execute(
        select(Season).where(and_(Season.league_id == league_id, Season.name == season_name))
    )
    season = result.scalar_one_or_none()
    if season is None:
        parts = season_name.split("-")
        start_year = int(parts[0])
        end_year = int(parts[1]) if len(parts) > 1 else start_year + 1
        season = Season(
            id=uuid.uuid4(), league_id=league_id, name=season_name,
            start_date=date(start_year, 8, 1), end_date=date(end_year, 5, 31),
            is_current=True,
        )
        db.add(season)
        await db.flush()
    return season


async def _get_or_create_team(db: AsyncSession, league_id, slug: str, name: str) -> Team:
    result = await db.execute(select(Team).where(Team.slug == slug))
    team = result.scalar_one_or_none()
    if team is None:
        team = Team(id=uuid.uuid4(), league_id=league_id, name=name, slug=slug, is_active=True)
        db.add(team)
        await db.flush()
    return team
