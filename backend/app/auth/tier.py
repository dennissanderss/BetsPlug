"""Tier-resolution dependencies.

Provides the FastAPI dependency ``get_current_tier`` used by every user-facing
endpoint that applies tier filtering. Also provides ``get_current_user_optional``
which returns the authenticated user or ``None`` (vs ``get_current_user`` which
raises 401 on missing auth — not suitable for public/Free endpoints).

Behaviour of ``get_current_tier``:

    TIER_SYSTEM_ENABLED=false : always return ``PickTier.PLATINUM``
        (disables all filtering; endpoints behave as before the system)

    Authenticated user with active paid subscription:
        plan_type ``basic``     -> ``PickTier.GOLD``      (Bronze trial = 7-day Gold)
        plan_type ``standard``  -> ``PickTier.SILVER``    (Silver plan)
        plan_type ``premium``   -> ``PickTier.GOLD``      (Gold plan)
        plan_type ``lifetime``  -> ``PickTier.PLATINUM``  (Platinum lifetime)

    The PlanType enum values are legacy names. Current checkout slugs
    (bronze/silver/gold/platinum) are aliased to these enum values via
    ``subscriptions.py`` PLAN_ALIASES + plan_map. The mapping table
    above reflects the **current product promise** per the pricing
    page — Bronze grants 7-day Gold trial access, not Silver.

    Authenticated admin with ``?tier=<slug>`` query param:
        returns that tier (for debugging / impersonation)

    All other cases (no auth, inactive sub, unknown plan) -> ``PickTier.FREE``
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Query, Request
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

from app.auth.dependencies import get_current_user, oauth2_scheme
from app.core.security import decode_access_token
from app.core.tier_system import PickTier, TIER_SYSTEM_ENABLED
from app.db.session import get_db
from app.models.subscription import (
    PlanType,
    Subscription,
    SubscriptionStatus,
)
from app.models.user import Role, User


# ---------------------------------------------------------------------------
# Plan-to-tier mapping
# ---------------------------------------------------------------------------
# Subscription plan types (from models/subscription.py) mapped to PickTier.
#
# The enum values are legacy internal names; the keys below document what
# the user actually checked out for given today's pricing page:
#   BASIC    <- bronze checkout slug (7-day Gold trial, €0,01)
#   STANDARD <- silver checkout slug (monthly/yearly Silver)
#   PREMIUM  <- gold   checkout slug (monthly/yearly Gold)
#   LIFETIME <- platinum checkout slug (one-time Platinum)
#
# Access semantics follow the pricing-page promise, not the enum name.
PLAN_TO_TIER: dict[PlanType, PickTier] = {
    PlanType.BASIC: PickTier.GOLD,
    PlanType.STANDARD: PickTier.SILVER,
    PlanType.PREMIUM: PickTier.GOLD,
    PlanType.LIFETIME: PickTier.PLATINUM,
}

# Subscription statuses that count as "active access"
_ACTIVE_STATUSES: frozenset[SubscriptionStatus] = frozenset({
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.TRIALING,
})


# ---------------------------------------------------------------------------
# Optional-user resolver (no 401 on missing auth)
# ---------------------------------------------------------------------------
async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Return the current user if authenticated, otherwise ``None``.

    Unlike :func:`app.auth.dependencies.get_current_user`, this does NOT
    raise HTTPException 401 when the Authorization header is missing or
    invalid. That makes it suitable for public endpoints that need to know
    "who is this, if anyone?" (e.g. homepage, pricing) so they can show
    tier-appropriate content.

    Returns ``None`` on any error path: missing header, invalid token,
    user not found, inactive account.
    """
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        return None

    token = auth_header.split(None, 1)[1].strip()
    if not token:
        return None

    try:
        payload = decode_access_token(token)
    except Exception:
        return None

    user_id_str: str | None = payload.get("sub")
    if not user_id_str:
        return None

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        return None

    try:
        result = await db.execute(select(User).where(User.id == user_id))
        user: User | None = result.scalar_one_or_none()
    except Exception:
        return None

    if user is None or not user.is_active:
        return None

    return user


# ---------------------------------------------------------------------------
# Internal: subscription lookup -> PickTier
# ---------------------------------------------------------------------------
async def _resolve_user_tier(user: User, db: AsyncSession) -> PickTier:
    """Look up the user's active subscription and map to a PickTier.

    Returns ``PickTier.FREE`` if:
      - no Subscription row exists
      - the subscription is not in ACTIVE or TRIALING status
      - the plan_type is not in :data:`PLAN_TO_TIER`
    """
    try:
        stmt = (
            select(Subscription)
            .where(
                and_(
                    Subscription.user_id == user.id,
                    Subscription.status.in_(_ACTIVE_STATUSES),
                )
            )
            .order_by(Subscription.updated_at.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        sub: Subscription | None = result.scalar_one_or_none()
    except Exception:
        # DB error -> degrade gracefully to Free, don't break the request
        return PickTier.FREE

    if sub is None:
        return PickTier.FREE

    # Honour trial / period expiry. Lifetime plans never expire (Stripe
    # doesn't send expiry events for them), so they skip this check.
    # Recurring plans have ``current_period_end`` rolled forward by
    # Stripe's invoice.* webhooks; Bronze one-time trials set it at
    # checkout (see subscriptions.py). If the timestamp is past, we
    # treat the user as Free regardless of the stored status value —
    # the tier resolver is the final enforcement gate.
    if not sub.is_lifetime and sub.current_period_end is not None:
        end = sub.current_period_end
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        if end < datetime.now(timezone.utc):
            return PickTier.FREE

    return PLAN_TO_TIER.get(sub.plan_type, PickTier.FREE)


# ---------------------------------------------------------------------------
# Main dependency
# ---------------------------------------------------------------------------
async def get_current_tier(
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
    tier_override: Optional[str] = Query(
        default=None,
        alias="tier",
        description="Admin-only: impersonate a tier slug (free/silver/gold/platinum).",
        include_in_schema=False,
    ),
) -> PickTier:
    """Resolve the caller's :class:`PickTier`.

    See module docstring for the full decision table.
    """
    # Feature flag disabled -> bypass, treat everyone as Platinum so the
    # access_filter() in queries is a no-op and the endpoint behaves as
    # it did before the tier system existed.
    if not TIER_SYSTEM_ENABLED:
        return PickTier.PLATINUM

    # Unauthenticated: always Free
    if user is None:
        return PickTier.FREE

    # Admin override via ?tier=... — debug / support / QA tool.
    if tier_override:
        if user.role == Role.ADMIN:
            slug = tier_override.strip().upper()
            try:
                return PickTier[slug]
            except KeyError:
                logger.warning(
                    "tier_override_invalid_slug user=%s slug=%s",
                    user.email, tier_override,
                )
        else:
            # Non-admin passing ?tier= is ignored, but we log it so
            # abuse / confused-UI attempts can be traced. The fall-
            # through to normal resolution keeps the security posture
            # identical to before — no user ever escalates via the
            # query string.
            logger.warning(
                "tier_override_denied user=%s role=%s slug=%s",
                user.email, user.role, tier_override,
            )

    return await _resolve_user_tier(user, db)


__all__ = [
    "PLAN_TO_TIER",
    "get_current_user_optional",
    "get_current_tier",
]
