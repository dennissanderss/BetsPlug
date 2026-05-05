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
