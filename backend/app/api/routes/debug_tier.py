"""TEMPORARY diagnostic endpoint — captures why /pricing/comparison,
/dashboard/metrics and /trackrecord/summary return 500 in production.

Runs the same core queries but each step is wrapped in try/except so
we can see exactly which statement raises and which exception type.
No auth, no side effects. DELETE THIS FILE after the root cause is
understood and fixed.

Hit it via:
    curl https://betsplug-production.up.railway.app/api/_debug/tier-smoke
"""
from __future__ import annotations

import traceback
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import Integer, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.prediction_filters import v81_predictions_filter
from app.core.tier_system import (
    CONF_THRESHOLD,
    PickTier,
    TIER_METADATA,
    TIER_SYSTEM_ENABLED,
    access_filter,
    pick_tier_expression,
)
from app.db.session import get_db
from app.models.match import Match, MatchStatus
from app.models.prediction import Prediction, PredictionEvaluation

router = APIRouter()


def _capture(label: str, thunk):
    """Run a thunk, return {ok, result|error}."""
    try:
        return {"step": label, "ok": True, "result": thunk()}
    except Exception as e:
        return {
            "step": label,
            "ok": False,
            "error_type": type(e).__name__,
            "error_msg": str(e)[:500],
            "traceback": traceback.format_exc()[-1500:],
        }


@router.get("/tier-smoke")
async def tier_smoke(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """Run the core tier-aggregate queries step by step and report which
    step (if any) raises."""
    steps: list[dict[str, Any]] = []

    # Step 1: flag
    steps.append({"step": "flag", "TIER_SYSTEM_ENABLED": TIER_SYSTEM_ENABLED})

    # Step 2: GROUP BY pick_tier with conf>=0.55 filter (pricing.py pattern)
    async def group_by_with_conf_filter():
        tier_expr = pick_tier_expression()
        q = (
            select(
                tier_expr,
                func.count(PredictionEvaluation.id).label("total"),
                func.sum(func.cast(PredictionEvaluation.is_correct, Integer)).label("correct"),
            )
            .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
            .join(Match, Match.id == Prediction.match_id)
            .where(v81_predictions_filter())
            .where(Prediction.confidence >= CONF_THRESHOLD[PickTier.FREE])
            .group_by(tier_expr)
        )
        rows = (await db.execute(q)).all()
        return {
            "row_count": len(rows),
            "rows": [
                {"tier": (int(t) if t is not None else None), "total": int(tot or 0), "correct": int(c or 0)}
                for t, tot, c in rows
            ],
        }

    try:
        steps.append({"step": "group_by_conf_filter", "ok": True, "result": await group_by_with_conf_filter()})
    except Exception as e:
        steps.append({
            "step": "group_by_conf_filter",
            "ok": False,
            "error_type": type(e).__name__,
            "error_msg": str(e)[:500],
            "traceback": traceback.format_exc()[-1500:],
        })

    # Step 3: GROUP BY pick_tier WITHOUT conf filter (dashboard/trackrecord per_tier pattern)
    async def group_by_no_conf_filter():
        tier_expr = pick_tier_expression()
        q = (
            select(
                tier_expr,
                func.count(PredictionEvaluation.id).label("total"),
                func.sum(func.cast(PredictionEvaluation.is_correct, Integer)).label("correct"),
            )
            .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
            .join(Match, Match.id == Prediction.match_id)
            .where(v81_predictions_filter())
            .group_by(tier_expr)
        )
        rows = (await db.execute(q)).all()
        return {
            "row_count": len(rows),
            "rows": [
                {"tier": (int(t) if t is not None else None), "total": int(tot or 0), "correct": int(c or 0)}
                for t, tot, c in rows
            ],
        }

    try:
        steps.append({"step": "group_by_no_conf_filter", "ok": True, "result": await group_by_no_conf_filter()})
    except Exception as e:
        steps.append({
            "step": "group_by_no_conf_filter",
            "ok": False,
            "error_type": type(e).__name__,
            "error_msg": str(e)[:500],
            "traceback": traceback.format_exc()[-1500:],
        })

    # Step 4: picks-per-day inclusive (pricing.py pattern)
    async def ppd_inclusive():
        sixty_days_ago = datetime.now(timezone.utc) - timedelta(days=60)
        q = (
            select(
                func.count(Prediction.id).filter(access_filter(PickTier.FREE)).label("free"),
                func.count(Prediction.id).filter(access_filter(PickTier.SILVER)).label("silver"),
                func.count(Prediction.id).filter(access_filter(PickTier.GOLD)).label("gold"),
                func.count(Prediction.id).filter(access_filter(PickTier.PLATINUM)).label("platinum"),
            )
            .join(Match, Match.id == Prediction.match_id)
            .where(v81_predictions_filter())
            .where(Match.scheduled_at >= sixty_days_ago)
            .where(Match.status == MatchStatus.FINISHED)
        )
        row = (await db.execute(q)).one()
        return {"free": int(row.free or 0), "silver": int(row.silver or 0), "gold": int(row.gold or 0), "platinum": int(row.platinum or 0)}

    try:
        steps.append({"step": "ppd_inclusive", "ok": True, "result": await ppd_inclusive()})
    except Exception as e:
        steps.append({
            "step": "ppd_inclusive",
            "ok": False,
            "error_type": type(e).__name__,
            "error_msg": str(e)[:500],
            "traceback": traceback.format_exc()[-1500:],
        })

    # Step 4b: picks-per-day with explicit select_from(Prediction) — tentative fix
    async def ppd_inclusive_fixed():
        sixty_days_ago = datetime.now(timezone.utc) - timedelta(days=60)
        q = (
            select(
                func.count(Prediction.id).filter(access_filter(PickTier.FREE)).label("free"),
                func.count(Prediction.id).filter(access_filter(PickTier.SILVER)).label("silver"),
                func.count(Prediction.id).filter(access_filter(PickTier.GOLD)).label("gold"),
                func.count(Prediction.id).filter(access_filter(PickTier.PLATINUM)).label("platinum"),
            )
            .select_from(Prediction)
            .join(Match, Match.id == Prediction.match_id)
            .where(v81_predictions_filter())
            .where(Match.scheduled_at >= sixty_days_ago)
            .where(Match.status == MatchStatus.FINISHED)
        )
        row = (await db.execute(q)).one()
        return {"free": int(row.free or 0), "silver": int(row.silver or 0), "gold": int(row.gold or 0), "platinum": int(row.platinum or 0)}

    try:
        steps.append({"step": "ppd_inclusive_fixed", "ok": True, "result": await ppd_inclusive_fixed()})
    except Exception as e:
        steps.append({
            "step": "ppd_inclusive_fixed",
            "ok": False,
            "error_type": type(e).__name__,
            "error_msg": str(e)[:500],
        })

    # Step 4c: dashboard total_q pattern — count from Prediction, .where + .join
    async def dashboard_total_pattern():
        total_q = select(func.count(Prediction.id))
        total_q = total_q.where(v81_predictions_filter())
        total_q = total_q.join(Match, Match.id == Prediction.match_id).where(access_filter(PickTier.FREE))
        return int((await db.execute(total_q)).scalar_one())

    try:
        steps.append({"step": "dashboard_total_pattern", "ok": True, "result": await dashboard_total_pattern()})
    except Exception as e:
        steps.append({
            "step": "dashboard_total_pattern",
            "ok": False,
            "error_type": type(e).__name__,
            "error_msg": str(e)[:500],
            "traceback": traceback.format_exc()[-1500:],
        })

    # Step 4d: dashboard total_q with explicit select_from
    async def dashboard_total_fixed():
        total_q = (
            select(func.count(Prediction.id))
            .select_from(Prediction)
            .join(Match, Match.id == Prediction.match_id)
            .where(v81_predictions_filter())
            .where(access_filter(PickTier.FREE))
        )
        return int((await db.execute(total_q)).scalar_one())

    try:
        steps.append({"step": "dashboard_total_fixed", "ok": True, "result": await dashboard_total_fixed()})
    except Exception as e:
        steps.append({
            "step": "dashboard_total_fixed",
            "ok": False,
            "error_type": type(e).__name__,
            "error_msg": str(e)[:500],
        })

    # Step 5: trackrecord /summary core query
    async def trackrecord_core():
        q = (
            select(
                func.count(PredictionEvaluation.id).label("total"),
                func.sum(func.cast(PredictionEvaluation.is_correct, Integer)).label("correct"),
                func.avg(PredictionEvaluation.brier_score).label("avg_brier"),
                func.avg(PredictionEvaluation.log_loss).label("avg_log_loss"),
                func.avg(Prediction.confidence).label("avg_confidence"),
                func.min(Match.scheduled_at).label("period_start"),
                func.max(Match.scheduled_at).label("period_end"),
            )
            .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
            .join(Match, Match.id == Prediction.match_id)
            .where(v81_predictions_filter())
            .where(access_filter(PickTier.FREE))
        )
        row = (await db.execute(q)).one()
        return {
            "total": int(row.total or 0),
            "correct": int(row.correct or 0),
            "avg_brier": float(row.avg_brier or 0.0),
        }

    try:
        steps.append({"step": "trackrecord_core", "ok": True, "result": await trackrecord_core()})
    except Exception as e:
        steps.append({
            "step": "trackrecord_core",
            "ok": False,
            "error_type": type(e).__name__,
            "error_msg": str(e)[:500],
            "traceback": traceback.format_exc()[-1500:],
        })

    # Step 6: call the REAL pricing endpoint function directly and capture error
    try:
        from app.api.routes.pricing import get_pricing_comparison
        result = await get_pricing_comparison(db=db)
        steps.append({"step": "real_pricing_fn", "ok": True, "result": f"returned {len(result)} rows"})
    except Exception as e:
        steps.append({
            "step": "real_pricing_fn",
            "ok": False,
            "error_type": type(e).__name__,
            "error_msg": str(e)[:500],
            "traceback": traceback.format_exc()[-2000:],
        })

    # Step 7: call the REAL dashboard/metrics endpoint function directly
    try:
        from app.api.routes.dashboard import get_dashboard_metrics
        result = await get_dashboard_metrics(db=db, user_tier=PickTier.FREE)
        steps.append({"step": "real_dashboard_fn", "ok": True, "result": f"accuracy={result.accuracy}, total={result.total_forecasts}"})
    except Exception as e:
        steps.append({
            "step": "real_dashboard_fn",
            "ok": False,
            "error_type": type(e).__name__,
            "error_msg": str(e)[:500],
            "traceback": traceback.format_exc()[-2000:],
        })

    # Step 8: call the REAL trackrecord/summary endpoint function directly
    try:
        from app.api.routes.trackrecord import get_trackrecord_summary
        result = await get_trackrecord_summary(
            model_version_id=None, source=None, pick_tier=None, db=db, user_tier=PickTier.FREE
        )
        steps.append({"step": "real_trackrecord_fn", "ok": True, "result": f"accuracy={result.accuracy}, total={result.total_predictions}"})
    except Exception as e:
        steps.append({
            "step": "real_trackrecord_fn",
            "ok": False,
            "error_type": type(e).__name__,
            "error_msg": str(e)[:500],
            "traceback": traceback.format_exc()[-2000:],
        })

    return {"ok": all(s.get("ok", True) for s in steps if "ok" in s), "steps": steps}
