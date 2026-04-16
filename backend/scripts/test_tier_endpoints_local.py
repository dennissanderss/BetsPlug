"""
End-to-end test: directly execute the SQL that the 3 tier-aware endpoints
run, then validate against Pydantic response models. Simulates the full
pipeline without needing FastAPI or the full app package.

Flag TIER_SYSTEM_ENABLED is set to true before import.
"""
import asyncio
import os
import sys
import traceback

_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND = os.path.dirname(_HERE)
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

os.environ["TIER_SYSTEM_ENABLED"] = "true"


async def run_dashboard(db):
    from sqlalchemy import Integer, func, select
    from app.models.prediction import Prediction, PredictionEvaluation
    from app.models.match import Match
    from app.core.prediction_filters import v81_predictions_filter
    from app.core.tier_system import (
        PickTier, TIER_METADATA, access_filter, pick_tier_expression,
    )
    # Define local Pydantic mirrors — can't import from routes package due to
    # email/smtp deps.
    from pydantic import BaseModel, ConfigDict
    from typing import Optional, Dict
    class DashboardTierBreakdown(BaseModel):
        model_config = ConfigDict(from_attributes=True)
        total: int
        correct: int
        accuracy: float
    class DashboardMetrics(BaseModel):
        model_config = ConfigDict(from_attributes=True)
        total_forecasts: int
        evaluated_count: int
        pending_count: int
        correct_predictions: int
        accuracy: float
        avg_brier_score: float
        avg_confidence: float
        has_data: bool
        generated_at: 'datetime'
        per_tier: Optional[Dict[str, DashboardTierBreakdown]] = None
    from datetime import datetime, timezone

    user_tier = PickTier.PLATINUM
    _v81 = v81_predictions_filter()
    _tier = access_filter(user_tier)

    def _add_tier_filter(q):
        q = q.where(_v81)
        q = q.join(Match, Match.id == Prediction.match_id).where(_tier)
        return q

    total_q = _add_tier_filter(select(func.count(Prediction.id)))
    total_forecasts = int((await db.execute(total_q)).scalar_one())

    eval_count_q = _add_tier_filter(
        select(func.count(PredictionEvaluation.id))
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
    )
    evaluated_count = int((await db.execute(eval_count_q)).scalar_one())

    correct_q = _add_tier_filter(
        select(func.count(PredictionEvaluation.id))
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
        .where(PredictionEvaluation.is_correct.is_(True))
    )
    correct_predictions = int((await db.execute(correct_q)).scalar_one())

    avg_brier_q = _add_tier_filter(
        select(func.avg(PredictionEvaluation.brier_score))
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
    )
    avg_brier_raw = (await db.execute(avg_brier_q)).scalar_one()
    avg_brier = round(float(avg_brier_raw), 4) if avg_brier_raw is not None else 0.0

    avg_conf_q = _add_tier_filter(select(func.avg(Prediction.confidence)))
    avg_conf_raw = (await db.execute(avg_conf_q)).scalar_one()
    avg_conf = round(float(avg_conf_raw), 2) if avg_conf_raw is not None else 0.0

    # per_tier (FIXED — reuse single tier_expr instance for GROUP BY identity)
    tier_expr = pick_tier_expression()
    per_tier_q = (
        select(
            tier_expr,
            func.count(PredictionEvaluation.id).label("total"),
            func.sum(func.cast(PredictionEvaluation.is_correct, Integer)).label("correct"),
        )
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
        .join(Match, Match.id == Prediction.match_id)
        .where(_v81)
        .where(_tier)
        .group_by(tier_expr)
    )
    rows = (await db.execute(per_tier_q)).all()
    per_tier = {}
    for tier_int, t_total, t_correct in rows:
        if not t_total:
            continue
        t_int = int(tier_int)
        c = int(t_correct or 0)
        total_int = int(t_total)
        slug = TIER_METADATA[PickTier(t_int)]["slug"]
        per_tier[slug] = DashboardTierBreakdown(
            total=total_int,
            correct=c,
            accuracy=round(c / total_int, 4) if total_int else 0.0,
        )

    pending_count = total_forecasts - evaluated_count
    accuracy = round(correct_predictions / evaluated_count, 4) if evaluated_count else 0.0

    result = DashboardMetrics(
        total_forecasts=total_forecasts,
        evaluated_count=evaluated_count,
        pending_count=pending_count,
        correct_predictions=correct_predictions,
        accuracy=accuracy,
        avg_brier_score=avg_brier,
        avg_confidence=avg_conf,
        has_data=total_forecasts > 0,
        generated_at=datetime.now(timezone.utc),
        per_tier=per_tier,
    )
    # Force Pydantic validation + JSON serialization
    dumped = result.model_dump(mode="json")
    return dumped


async def run_trackrecord(db):
    from sqlalchemy import Integer, func, select
    from app.models.prediction import Prediction, PredictionEvaluation
    from app.models.match import Match
    from app.core.prediction_filters import v81_predictions_filter
    from app.core.tier_system import (
        PickTier, TIER_METADATA, access_filter, pick_tier_expression,
    )
    from app.schemas.trackrecord import TrackrecordSummary

    user_tier = PickTier.PLATINUM

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
        .where(access_filter(user_tier))
    )
    row = (await db.execute(q)).one()
    total = row.total or 0
    correct = int(row.correct or 0)
    accuracy = correct / total if total > 0 else 0.0

    tier_expr = pick_tier_expression()
    per_tier_q = (
        select(
            tier_expr,
            func.count(PredictionEvaluation.id).label("total"),
            func.sum(func.cast(PredictionEvaluation.is_correct, Integer)).label("correct"),
        )
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
        .join(Match, Match.id == Prediction.match_id)
        .where(v81_predictions_filter())
        .where(access_filter(user_tier))
        .group_by(tier_expr)
    )
    tier_rows = (await db.execute(per_tier_q)).all()
    per_tier = {}
    for tier_int, t_total, t_correct in tier_rows:
        total_int = int(t_total or 0)
        if not total_int:
            continue
        t_int = int(tier_int)
        t_correct_int = int(t_correct or 0)
        slug = TIER_METADATA[PickTier(t_int)]["slug"]
        per_tier[slug] = {
            "total": total_int,
            "correct": t_correct_int,
            "accuracy": float(t_correct_int / total_int) if total_int else 0.0,
        }

    result = TrackrecordSummary(
        model_version_id=None,
        total_predictions=total,
        correct_predictions=correct,
        accuracy=accuracy,
        brier_score=float(row.avg_brier or 0.0),
        log_loss=float(row.avg_log_loss) if row.avg_log_loss is not None else None,
        avg_confidence=float(row.avg_confidence or 0.0),
        period_start=row.period_start,
        period_end=row.period_end,
        per_tier=per_tier,
    )
    return result.model_dump(mode="json")


async def run_pricing(db):
    import math
    from datetime import datetime, timedelta, timezone
    from sqlalchemy import Integer, func, select
    from app.models.prediction import Prediction, PredictionEvaluation
    from app.models.match import Match, MatchStatus
    from app.core.prediction_filters import v81_predictions_filter
    from app.core.tier_system import (
        CONF_THRESHOLD, PickTier, TIER_METADATA, pick_tier_expression,
    )
    from app.core.tier_leagues import (
        LEAGUES_GOLD, LEAGUES_PLATINUM, LEAGUES_SILVER,
    )
    from pydantic import BaseModel, ConfigDict, Field
    from typing import Optional as Opt

    class PricingTier(BaseModel):
        model_config = ConfigDict(from_attributes=True)
        pick_tier: str
        pick_tier_label: str
        pick_tier_accuracy: str
        accuracy_pct: float
        wilson_ci_lower_pct: float
        sample_size: int
        confidence_threshold: float
        leagues_count: Opt[int] = None
        picks_per_day_estimate: float

    def _wilson(correct, total, z=1.96):
        if total <= 0: return 0.0
        p = correct / total
        denom = 1 + z*z/total
        centre = p + z*z/(2*total)
        adj = z * math.sqrt(p*(1-p)/total + z*z/(4*total*total))
        return round(100.0 * (centre - adj) / denom, 1)

    def _leagues_count(tier):
        if tier == PickTier.PLATINUM: return len(LEAGUES_PLATINUM)
        if tier == PickTier.GOLD: return len(LEAGUES_GOLD)
        if tier == PickTier.SILVER: return len(LEAGUES_SILVER)
        return None

    from app.core.tier_system import CONF_THRESHOLD, access_filter as _access_filter
    tier_expr_agg = pick_tier_expression()
    agg_q = (
        select(
            tier_expr_agg,
            func.count(PredictionEvaluation.id).label("total"),
            func.sum(func.cast(PredictionEvaluation.is_correct, Integer)).label("correct"),
        )
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
        .join(Match, Match.id == Prediction.match_id)
        .where(v81_predictions_filter())
        .where(Prediction.confidence >= CONF_THRESHOLD[PickTier.FREE])
        .group_by(tier_expr_agg)
    )
    rows = {int(t): (int(total or 0), int(correct or 0))
            for t, total, correct in (await db.execute(agg_q)).all() if t is not None}

    sixty_days_ago = datetime.now(timezone.utc) - timedelta(days=60)
    # Inclusive picks-per-day
    ppd_base = (
        select(
            func.count(Prediction.id).filter(_access_filter(PickTier.FREE)).label("free"),
            func.count(Prediction.id).filter(_access_filter(PickTier.SILVER)).label("silver"),
            func.count(Prediction.id).filter(_access_filter(PickTier.GOLD)).label("gold"),
            func.count(Prediction.id).filter(_access_filter(PickTier.PLATINUM)).label("platinum"),
        )
        .join(Match, Match.id == Prediction.match_id)
        .where(v81_predictions_filter())
        .where(Match.scheduled_at >= sixty_days_ago)
        .where(Match.status == MatchStatus.FINISHED)
    )
    ppd_row = (await db.execute(ppd_base)).one()
    ppd_rows = {
        int(PickTier.FREE): int(ppd_row.free or 0),
        int(PickTier.SILVER): int(ppd_row.silver or 0),
        int(PickTier.GOLD): int(ppd_row.gold or 0),
        int(PickTier.PLATINUM): int(ppd_row.platinum or 0),
    }
    _wilson_lower_bound_pct = _wilson
    _leagues_count_for_tier = _leagues_count

    result = []
    for tier in (PickTier.FREE, PickTier.SILVER, PickTier.GOLD, PickTier.PLATINUM):
        total, correct = rows.get(int(tier), (0, 0))
        total = int(total or 0)
        correct = int(correct or 0)
        meta = TIER_METADATA[tier]
        acc_pct = float(round(100.0 * correct / total, 1)) if total > 0 else 0.0
        lb = float(_wilson_lower_bound_pct(correct, total))
        ppd_count = int(ppd_rows.get(int(tier), 0))
        ppd = float(round(ppd_count / 60.0, 2))

        result.append(PricingTier(
            pick_tier=str(meta["slug"]),
            pick_tier_label=str(meta["label"]),
            pick_tier_accuracy=str(meta["accuracy_claim"]),
            accuracy_pct=acc_pct,
            wilson_ci_lower_pct=lb,
            sample_size=total,
            confidence_threshold=float(CONF_THRESHOLD[tier]),
            leagues_count=_leagues_count_for_tier(tier),
            picks_per_day_estimate=ppd,
        ))
    return [r.model_dump(mode="json") for r in result]


async def _run(name, coro):
    import json
    print(f"=== {name} ===")
    try:
        result = await coro
        print("  RESULT OK")
        print("  " + json.dumps(result, default=str, indent=2)[:700].replace("\n", "\n  "))
    except Exception as e:
        print(f"  EXCEPTION: {type(e).__name__}: {e}")
        for line in traceback.format_exc().splitlines()[-10:]:
            print("    " + line)
    print()


async def main():
    # Use raw asyncpg engine so we avoid the full app initialisation
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

    url = (
        "postgresql+asyncpg://postgres:tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq"
        "@nozomi.proxy.rlwy.net:29246/railway"
    )
    engine = create_async_engine(url, pool_pre_ping=True)
    maker = async_sessionmaker(engine, expire_on_commit=False)

    from app.core.tier_system import TIER_SYSTEM_ENABLED
    print(f"TIER_SYSTEM_ENABLED = {TIER_SYSTEM_ENABLED}")

    async with maker() as db:
        await _run("dashboard", run_dashboard(db))
        await _run("trackrecord", run_trackrecord(db))
        await _run("pricing", run_pricing(db))

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
