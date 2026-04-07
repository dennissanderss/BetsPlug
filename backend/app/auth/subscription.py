"""
Subscription-based access control dependencies.

These FastAPI dependencies check whether the current user has an active
subscription before allowing access to premium features.

Free tier gets:
- Limited predictions (last 3 days, max 5 per page)
- No Bet of the Day
- No strategy/backtest access
- No advanced analytics

Paid tier gets:
- All predictions (unlimited)
- Bet of the Day
- Full strategy lab + backtesting
- Advanced analytics & API access
- PDF reports
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db


async def get_subscription_tier(
    db: AsyncSession = Depends(get_db),
) -> str:
    """
    Returns the current user's subscription tier.

    Returns one of: "free", "basic", "standard", "premium", "lifetime"

    TODO: Once auth is wired, this should extract user_id from JWT
    and query the subscriptions table. For now, returns "free" as default.
    """
    # TODO: Implement actual subscription lookup
    # user = await get_current_user(...)
    # subscription = await db.execute(
    #     select(Subscription)
    #     .where(and_(
    #         Subscription.user_id == user.id,
    #         Subscription.status == SubscriptionStatus.ACTIVE,
    #     ))
    # )
    # sub = subscription.scalar_one_or_none()
    # if sub is None:
    #     return "free"
    # return sub.plan_type.value

    return "free"


def require_subscription(min_tier: str = "basic"):
    """
    Dependency that requires at least the specified subscription tier.

    Usage:
        @router.get("/premium-data", dependencies=[Depends(require_subscription("standard"))])
        async def premium_endpoint():
            ...
    """
    tier_levels = {
        "free": 0,
        "basic": 1,
        "standard": 2,
        "premium": 3,
        "lifetime": 4,
    }

    async def _check(tier: str = Depends(get_subscription_tier)):
        user_level = tier_levels.get(tier, 0)
        required_level = tier_levels.get(min_tier, 1)

        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "subscription_required",
                    "required_tier": min_tier,
                    "current_tier": tier,
                    "message": f"This feature requires a {min_tier} subscription or higher.",
                    "upgrade_url": "/subscriptions",
                },
            )
        return tier

    return _check
