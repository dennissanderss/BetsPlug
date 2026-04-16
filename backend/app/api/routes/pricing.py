"""Pricing-page comparison endpoint.

Returns a public, per-pick-tier breakdown of historical accuracy so the
pricing page can show users:
    Free     55%+     all leagues         conf >= 0.55
    Silver   69%      top 14              conf >= 0.65
    Gold     77%      top 10              conf >= 0.70
    Platinum 85%+     top 5  elite        conf >= 0.75

All numbers are computed from the v8.1 evaluated prediction set. No
authentication — this is marketing data.

When TIER_SYSTEM_ENABLED=false the endpoint returns 503 so the frontend
can fall back to a placeholder pricing display.
"""
from __future__ import annotations

import math
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Integer, and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.prediction_filters import v81_predictions_filter
from app.core.tier_system import (
    CONF_THRESHOLD,
    LEAGUES_GOLD,
    LEAGUES_PLATINUM,
    LEAGUES_SILVER,
    PickTier,
    TIER_METADATA,
    TIER_SYSTEM_ENABLED,
    pick_tier_expression,
)
from app.db.session import get_db
from app.models.match import Match, MatchStatus
from app.models.prediction import Prediction, PredictionEvaluation

router = APIRouter()


# ---------------------------------------------------------------------------
# Response shape
# ---------------------------------------------------------------------------
class PricingTier(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    pick_tier: str = Field(description="Tier slug: free/silver/gold/platinum")
    pick_tier_label: str = Field(description="UI label with emoji")
    pick_tier_accuracy: str = Field(description="Display accuracy claim, e.g. '85%+'")
    accuracy_pct: float = Field(ge=0.0, le=100.0, description="Point estimate (%)")
    wilson_ci_lower_pct: float = Field(ge=0.0, le=100.0)
    sample_size: int = Field(ge=0, description="Evaluated predictions used")
    confidence_threshold: float = Field(description="Minimum confidence for this tier")
    leagues_count: Optional[int] = Field(
        default=None,
        description="Number of leagues in this tier's whitelist (null for Free)",
    )
    picks_per_day_estimate: float = Field(
        ge=0.0,
        description="Average daily qualifying picks over the last 60 days",
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _wilson_lower_bound_pct(correct: int, total: int, z: float = 1.96) -> float:
    if total <= 0:
        return 0.0
    p = correct / total
    denom = 1 + z * z / total
    centre = p + z * z / (2 * total)
    adj = z * math.sqrt(p * (1 - p) / total + z * z / (4 * total * total))
    lb = (centre - adj) / denom
    return round(100.0 * lb, 1)


def _leagues_count_for_tier(tier: PickTier) -> Optional[int]:
    if tier == PickTier.PLATINUM:
        return len(LEAGUES_PLATINUM)
    if tier == PickTier.GOLD:
        return len(LEAGUES_GOLD)
    if tier == PickTier.SILVER:
        return len(LEAGUES_SILVER)
    return None  # Free has no whitelist


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
@router.get(
    "/comparison",
    response_model=List[PricingTier],
    summary="Per-pick-tier accuracy breakdown for the pricing page",
)
async def get_pricing_comparison(
    db: AsyncSession = Depends(get_db),
) -> List[PricingTier]:
    """Return a 4-row list (Free/Silver/Gold/Platinum) with accuracy numbers.

    Public endpoint — no auth, no tier filter. Cached 1 hour via Redis.
    """
    if not TIER_SYSTEM_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "tier_system_disabled",
                "message": (
                    "Tier system is not active. "
                    "The pricing comparison cannot be computed without it."
                ),
            },
        )

    from app.core.cache import cache_get, cache_set

    cached = await cache_get("pricing:comparison")
    if cached is not None:
        return [PricingTier(**row) for row in cached]

    # 1) Accuracy + sample size per pick_tier — one GROUP BY query
    # IMPORTANT: evaluate pick_tier_expression() once and reuse in SELECT + GROUP BY.
    # Two calls produce CASE-nodes with different bind parameter IDs which
    # PostgreSQL then treats as non-equivalent, triggering
    # "column ... must appear in the GROUP BY clause".
    tier_expr_agg = pick_tier_expression()
    agg_q = (
        select(
            tier_expr_agg,
            func.count(PredictionEvaluation.id).label("total"),
            func.sum(
                func.cast(PredictionEvaluation.is_correct, Integer)
            ).label("correct"),
        )
        .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
        .join(Match, Match.id == Prediction.match_id)
        .where(v81_predictions_filter())
        .group_by(tier_expr_agg)
    )
    rows = {int(t): (int(total or 0), int(correct or 0)) for t, total, correct in (await db.execute(agg_q)).all()}

    # 2) Picks-per-day estimate per tier — last 60 finished days, qualifying picks
    from datetime import datetime, timedelta, timezone
    sixty_days_ago = datetime.now(timezone.utc) - timedelta(days=60)

    tier_expr_ppd = pick_tier_expression()
    ppd_q = (
        select(
            tier_expr_ppd,
            func.count(Prediction.id).label("total"),
        )
        .join(Match, Match.id == Prediction.match_id)
        .where(v81_predictions_filter())
        .where(Match.scheduled_at >= sixty_days_ago)
        .where(Match.status == MatchStatus.FINISHED)
        .group_by(tier_expr_ppd)
    )
    ppd_rows = {int(t): int(total or 0) for t, total in (await db.execute(ppd_q)).all()}

    # 3) Compose PricingTier for each level. Cast every numeric value
    # explicitly — SUM() returns Decimal on PG which Pydantic v2 can reject
    # when the model declares `int` or `float`. Same for COUNT → bigint.
    result: List[PricingTier] = []
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

    # Cache 1 hour — static-ish, refreshed on redeploy or cache_delete("pricing:*")
    await cache_set(
        "pricing:comparison",
        [r.model_dump() for r in result],
        ttl=3600,
    )
    return result
