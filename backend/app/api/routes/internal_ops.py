"""Internal ops endpoints — long-running maintenance tasks protected by an
API key from environment, NOT by JWT. Use cases:
  - Mass regenerate historical predictions (avoids JWT-expiry mid-run)
  - Mass backfill operations
  - Anything that runs for >10 min and shouldn't depend on a user session

Security model: the endpoint requires an ``X-Internal-Ops-Key`` header
that must match the ``INTERNAL_OPS_KEY`` env var on Railway. If the env
var isn't set, the endpoint returns 503 (refuses to run unprotected).
"""
from __future__ import annotations

import os
import time
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Body, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import and_, exists as _exists, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.prediction_filters import V81_DEPLOYMENT_CUTOFF
from app.db.session import get_db
from app.forecasting.forecast_service import ForecastService
from app.models.match import Match, MatchResult, MatchStatus
from app.models.model_version import ModelVersion
from app.models.prediction import Prediction, PredictionEvaluation


router = APIRouter()


def require_internal_ops_key(
    x_internal_ops_key: str | None = Header(default=None, alias="X-Internal-Ops-Key"),
):
    """Dependency that gates an endpoint behind a server-side env-var key."""
    expected = os.getenv("INTERNAL_OPS_KEY")
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="INTERNAL_OPS_KEY env var not configured on this deploy",
        )
    if not x_internal_ops_key or x_internal_ops_key != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid X-Internal-Ops-Key header",
        )


class RegenRequest(BaseModel):
    start: str  # YYYY-MM-DD
    end: str    # YYYY-MM-DD
    limit: int = 500


class RegenResponse(BaseModel):
    matches_found: int
    generated: int
    failed: int
    evaluated: int
    elapsed_seconds: float
    finished: bool


class ComboBackfillRequest(BaseModel):
    start: str  # YYYY-MM-DD
    end: str    # YYYY-MM-DD
    mode: str = "backtest"  # "backtest" or "live"
    force: bool = True
    limit_days: int = 200


class ComboBackfillResponse(BaseModel):
    days_replayed: int
    deleted: int
    inserted: int
    graded: int
    elapsed_seconds: float
    finished: bool


@router.post(
    "/combo-backfill",
    response_model=ComboBackfillResponse,
    summary="Backfill combo_bets in chunks (env-var key auth)",
    dependencies=[Depends(require_internal_ops_key)],
)
async def combo_backfill(
    body: ComboBackfillRequest,
    db: AsyncSession = Depends(get_db),
):
    """Backfill combo_bets over a date range — chunked to fit Railway's
    proxy timeout. Same selector + persistence as
    backfill_live_combos.py but inside Railway = ~20× faster."""
    from sqlalchemy import and_, delete, select as _select
    from app.models.combo_bet import ComboBet
    from app.services.combo_bet_service import (
        persist_daily_combo,
        evaluate_pending_combos,
    )

    t0 = time.monotonic()
    try:
        start_d = datetime.strptime(body.start, "%Y-%m-%d").date()
        end_d = datetime.strptime(body.end, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Bad date format: {exc}")

    is_live_mode = body.mode == "live"

    deleted = 0
    if body.force:
        del_stmt = delete(ComboBet).where(
            and_(
                ComboBet.is_live.is_(is_live_mode),
                ComboBet.bet_date >= start_d,
                ComboBet.bet_date <= end_d,
            )
        )
        res = await db.execute(del_stmt)
        await db.commit()
        deleted = res.rowcount or 0

    existing_dates_q = _select(ComboBet.bet_date).where(
        and_(
            ComboBet.is_live.is_(is_live_mode),
            ComboBet.bet_date >= start_d,
            ComboBet.bet_date <= end_d,
        )
    )
    existing_dates = set(
        (await db.execute(existing_dates_q)).scalars().all()
    )

    cursor = start_d
    inserted = 0
    days_replayed = 0
    while cursor <= end_d and days_replayed < body.limit_days:
        if cursor in existing_dates:
            cursor += timedelta(days=1)
            continue
        result = await persist_daily_combo(db, cursor, is_live=is_live_mode)
        if result is not None and result.created_at and (
            datetime.now(timezone.utc) - result.created_at
        ).total_seconds() < 60:
            inserted += 1
        days_replayed += 1
        cursor += timedelta(days=1)

    graded = await evaluate_pending_combos(db)

    finished = cursor > end_d
    elapsed = round(time.monotonic() - t0, 2)
    return ComboBackfillResponse(
        days_replayed=days_replayed,
        deleted=deleted,
        inserted=inserted,
        graded=graded,
        elapsed_seconds=elapsed,
        finished=finished,
    )


@router.post(
    "/regenerate-v81",
    response_model=RegenResponse,
    summary="Regenerate v8.1 predictions (env-var key auth, no JWT)",
    dependencies=[Depends(require_internal_ops_key)],
)
async def regenerate_v81(
    body: RegenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Same logic as /admin/regenerate-v81-historical but auth via
    X-Internal-Ops-Key header instead of JWT bearer. Lets long-running
    multi-hour batch loops keep working without token expiry."""
    t0 = time.monotonic()
    try:
        start_d = datetime.strptime(body.start, "%Y-%m-%d").date()
        end_d = datetime.strptime(body.end, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Bad date format: {exc}")

    start_dt = datetime.combine(start_d, datetime.min.time(), tzinfo=timezone.utc)
    end_dt = datetime.combine(end_d + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)

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
    return RegenResponse(
        matches_found=len(targets),
        generated=generated,
        failed=failed,
        evaluated=evaluated,
        elapsed_seconds=elapsed,
        finished=len(targets) < body.limit,
    )


# ---------------------------------------------------------------------------
# Sync teams from API-Football into Postgres for the marketing-site endpoints.
# Triggered manually after deploys when the launch-league teams DB has gaps.
# ---------------------------------------------------------------------------


class SyncTeamsRequest(BaseModel):
    league_slugs: list[str]


class SyncTeamsLeagueResult(BaseModel):
    league_slug: str
    fetched: int
    inserted: int
    updated: int
    error: str | None = None


class SyncTeamsResponse(BaseModel):
    leagues: list[SyncTeamsLeagueResult]
    total_fetched: int
    total_inserted: int
    total_updated: int
    elapsed_seconds: float


@router.post(
    "/sync-teams",
    response_model=SyncTeamsResponse,
    summary="Sync team rosters from API-Football for the given league slugs",
    dependencies=[Depends(require_internal_ops_key)],
)
async def sync_teams(
    body: SyncTeamsRequest,
    db: AsyncSession = Depends(get_db),
):
    """Refresh the ``teams`` table for one or more leagues by re-running
    ``APIFootballAdapter.fetch_teams`` and upserting by slug. Used to fill
    gaps that block /api/public/teams/{slug} from returning 200.
    """
    import httpx

    from app.core.config import get_settings
    from app.ingestion.adapters.api_football import APIFootballAdapter
    from app.models.league import League
    from app.models.team import Team
    from sqlalchemy import select

    t0 = time.monotonic()
    settings = get_settings()
    if not settings.api_football_key:
        raise HTTPException(status_code=500, detail="API_FOOTBALL_KEY not set on this deploy")

    results: list[SyncTeamsLeagueResult] = []
    total_fetched = total_inserted = total_updated = 0

    async with httpx.AsyncClient(timeout=30.0) as http_client:
        adapter = APIFootballAdapter(
            config={"api_key": settings.api_football_key},
            http_client=http_client,
        )

        for league_slug in body.league_slugs:
            league = (await db.execute(
                select(League).where(League.slug == league_slug)
            )).scalar_one_or_none()
            if league is None:
                results.append(SyncTeamsLeagueResult(
                    league_slug=league_slug, fetched=0, inserted=0, updated=0,
                    error="league_not_in_db",
                ))
                continue

            try:
                raw_teams = await adapter.fetch_teams(league_slug)
            except Exception as exc:
                results.append(SyncTeamsLeagueResult(
                    league_slug=league_slug, fetched=0, inserted=0, updated=0,
                    error=f"fetch_failed: {exc}",
                ))
                continue

            inserted = updated = 0
            for raw in raw_teams:
                slug = raw.get("slug")
                if not slug:
                    continue
                existing = (await db.execute(
                    select(Team).where(Team.slug == slug)
                )).scalar_one_or_none()
                if existing is None:
                    db.add(Team(
                        league_id=league.id,
                        name=raw.get("name", slug),
                        slug=slug,
                        short_name=raw.get("short_name"),
                        country=raw.get("country"),
                        venue=raw.get("venue"),
                        logo_url=raw.get("logo_url"),
                        is_active=True,
                    ))
                    inserted += 1
                else:
                    # Update mutable fields that may have shifted on API-Football's side.
                    existing.name = raw.get("name", existing.name)
                    existing.short_name = raw.get("short_name") or existing.short_name
                    existing.country = raw.get("country") or existing.country
                    existing.venue = raw.get("venue") or existing.venue
                    existing.logo_url = raw.get("logo_url") or existing.logo_url
                    existing.league_id = league.id
                    updated += 1

            await db.commit()
            results.append(SyncTeamsLeagueResult(
                league_slug=league_slug,
                fetched=len(raw_teams),
                inserted=inserted,
                updated=updated,
            ))
            total_fetched += len(raw_teams)
            total_inserted += inserted
            total_updated += updated

    # Drop the in-memory cache used by /api/public/* so the next request
    # sees fresh DB rows instead of pre-sync responses.
    try:
        from app.api.routes.public_teams import cache_clear as _public_cache_clear
        _public_cache_clear()
    except Exception:
        pass

    return SyncTeamsResponse(
        leagues=results,
        total_fetched=total_fetched,
        total_inserted=total_inserted,
        total_updated=total_updated,
        elapsed_seconds=round(time.monotonic() - t0, 2),
    )
