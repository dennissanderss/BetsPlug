"""User-facing Telegram routes.

Currently exposes a single endpoint, ``/api/telegram/my-invite``, which
returns the calling user's personal single-use invite link for their
active paid tier (Silver / Gold / Platinum). Free-tier users are sent
to the public channel instead — they don't need a per-user link.

Authorisation flow:
    1. ``get_current_tier`` resolves the user's actual subscription
       state (active Stripe subscription → PickTier). No auth → FREE.
    2. The endpoint then checks "did the user actually pay for the
       requested tier?". A user with a Silver sub asking for Gold gets
       a 403, regardless of what tier they pass on the wire — no
       privilege escalation through the URL.
    3. Only then we touch the Bot API to mint or recycle the invite.

This is intentionally separate from ``admin_telegram.py``: the admin
router is gated behind ``require_admin`` for operator tooling, while
this router serves logged-in subscribers and applies tier-aware
gating per request.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.tier import get_current_tier
from app.core.tier_system import PickTier, TIER_METADATA
from app.db.session import get_db
from app.models.user import User
from app.services.telegram_invites import get_or_create_invite
from app.services.telegram_service import TelegramError

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------


class InviteResponse(BaseModel):
    tier: str = Field(..., description="Tier slug: silver | gold | platinum.")
    tier_label: str = Field(..., description="Human-readable tier label.")
    invite_link: str = Field(
        ..., description="https://t.me/+<unique> — single-use, do not share."
    )
    used_at: Optional[datetime] = Field(
        None,
        description=(
            "When the user joined via this link. NULL = link still spendable."
        ),
    )
    expire_date: Optional[datetime] = Field(
        None,
        description=(
            "Optional Bot-API expiry; we currently leave links open-ended."
        ),
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _parse_tier(value: str) -> PickTier:
    try:
        return PickTier[value.strip().upper()]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail="Unknown tier — expected silver, gold or platinum.",
        )


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.get(
    "/my-invite/{tier}",
    response_model=InviteResponse,
    summary="Get a personal single-use Telegram invite link for a paid tier",
)
async def get_my_invite(
    tier: str = Path(
        ..., description="Tier slug: silver | gold | platinum."
    ),
    user: User = Depends(get_current_user),
    user_tier: PickTier = Depends(get_current_tier),
    db: AsyncSession = Depends(get_db),
) -> InviteResponse:
    """Return the calling user's personal invite link for ``tier``.

    Authorisation:
        - Must be authenticated (otherwise 401 from ``get_current_user``).
        - User's active subscription tier must be ``>= tier`` —
          a Silver subscriber gets Silver, a Gold subscriber gets
          Silver+Gold, a Platinum subscriber gets all three. Asking
          for a tier the user hasn't paid for returns 403.
    """
    requested = _parse_tier(tier)

    if requested == PickTier.FREE:
        raise HTTPException(
            status_code=400,
            detail=(
                "Free is a public channel — no invite link needed. "
                "See the marketing page for the @handle."
            ),
        )

    # Pay-wall: the user must actually have access to the requested tier.
    # This is the *single* gate — no other backdoor exists. The check
    # uses ``get_current_tier`` which already accounts for active Stripe
    # subs, trial expiry, and the admin override. A non-paying user
    # asking for /my-invite/silver gets a clean 403.
    if user_tier < requested:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Active subscription does not cover {requested.name.title()}. "
                "Upgrade your plan to receive an invite link for this channel."
            ),
        )

    try:
        invite = await get_or_create_invite(db, user, requested)
    except TelegramError as e:
        logger.error(
            "telegram_invites: bot API failure for user=%s tier=%s: %s",
            user.id, requested.name, e,
        )
        raise HTTPException(
            status_code=502,
            detail=f"Telegram Bot API error: {e}",
        )

    if invite is None:
        # Channel env var not set on Railway. Surface a 409 so the
        # frontend can show a friendly "channel not ready yet" message
        # instead of a generic 500. Operator action needed.
        raise HTTPException(
            status_code=409,
            detail=(
                f"The {requested.name.title()} Telegram channel is not "
                "configured yet. The team has been notified — try again later."
            ),
        )

    meta = TIER_METADATA.get(requested, {})
    return InviteResponse(
        tier=meta.get("slug", requested.name.lower()),
        tier_label=meta.get("label", requested.name.title()),
        invite_link=invite.invite_link,
        used_at=invite.used_at,
        expire_date=invite.expire_date,
    )


__all__ = ["router"]
