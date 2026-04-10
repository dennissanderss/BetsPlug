"""Checkout session API routes.

Endpoints
---------
POST /api/checkout-sessions
    Create or update a checkout session (called from frontend step 1).

PATCH /api/checkout-sessions/{session_id}/step
    Update the last step reached.

POST /api/checkout-sessions/{session_id}/complete
    Mark a session as completed.

GET /api/checkout-sessions/recover/{token}
    Validate a recovery token and return session data for checkout
    prefill.

GET /api/checkout-sessions/coupon/{code}
    Validate a coupon code and return discount info.

POST /api/checkout-sessions/coupon/{code}/redeem
    Redeem a coupon code.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.abandoned_checkout_service import (
    complete_checkout_session,
    create_checkout_session,
    redeem_coupon,
    update_checkout_step,
    validate_coupon,
    validate_recovery_token,
)

router = APIRouter(prefix="/checkout-sessions", tags=["checkout"])


# --------------------------------------------------------------------------- #
# Request / Response schemas
# --------------------------------------------------------------------------- #

class CreateCheckoutSessionRequest(BaseModel):
    email: EmailStr
    first_name: str | None = None
    plan_id: str = Field(..., pattern=r"^(bronze|silver|gold|platinum)$")
    billing_cycle: str = Field(..., pattern=r"^(monthly|yearly)$")
    with_trial: bool = True
    locale: str | None = Field(None, max_length=5)


class CreateCheckoutSessionResponse(BaseModel):
    session_id: str
    recovery_token: str


class UpdateStepRequest(BaseModel):
    step: int = Field(..., ge=1, le=3)


class RecoveryResponse(BaseModel):
    plan_id: str
    billing_cycle: str
    with_trial: bool
    first_name: str | None
    coupon_code: str | None


class CouponResponse(BaseModel):
    code: str
    discount_percent: float
    is_valid: bool


# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #

@router.post("", response_model=CreateCheckoutSessionResponse)
async def create_session(
    body: CreateCheckoutSessionRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create or update a checkout session.

    Called from the frontend after step 1 (email captured).
    Returns a session_id that the frontend stores and uses for
    subsequent step updates and completion.
    """
    session = await create_checkout_session(
        db,
        email=body.email,
        first_name=body.first_name,
        plan_id=body.plan_id,
        billing_cycle=body.billing_cycle,
        with_trial=body.with_trial,
        locale=body.locale,
    )
    return CreateCheckoutSessionResponse(
        session_id=str(session.id),
        recovery_token=session.recovery_token,
    )


@router.patch("/{session_id}/step")
async def update_step(
    session_id: str,
    body: UpdateStepRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update the last checkout step reached."""
    updated = await update_checkout_step(db, session_id=session_id, step=body.step)
    if not updated:
        raise HTTPException(404, "Session not found or already completed")
    return {"ok": True}


@router.post("/{session_id}/complete")
async def complete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Mark a checkout session as completed.

    Called from the frontend after successful payment/redirect.
    Prevents the abandoned-checkout email from being sent.
    """
    completed = await complete_checkout_session(db, session_id=session_id)
    if not completed:
        raise HTTPException(404, "Session not found or already completed")
    return {"ok": True}


@router.get("/recover/{token}", response_model=RecoveryResponse)
async def recover_session(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Validate a recovery token and return checkout context.

    The frontend reads the ``recovery`` query param, calls this
    endpoint, and pre-fills the checkout form with the returned data.
    """
    session = await validate_recovery_token(db, token)
    if not session:
        raise HTTPException(404, "Invalid or expired recovery link")

    return RecoveryResponse(
        plan_id=session.plan_id,
        billing_cycle=session.billing_cycle,
        with_trial=session.with_trial,
        first_name=session.first_name,
        coupon_code=session.coupon_code,
    )


@router.get("/coupon/{code}", response_model=CouponResponse)
async def check_coupon(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Check if a coupon code is valid."""
    coupon = await validate_coupon(db, code)
    if not coupon:
        raise HTTPException(404, "Coupon not found or expired")

    return CouponResponse(
        code=coupon.code,
        discount_percent=coupon.discount_percent,
        is_valid=coupon.is_valid,
    )


@router.post("/coupon/{code}/redeem", response_model=CouponResponse)
async def redeem_coupon_route(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Redeem a coupon code (increment usage count)."""
    coupon = await redeem_coupon(db, code)
    if not coupon:
        raise HTTPException(400, "Coupon not found, expired, or already redeemed")

    return CouponResponse(
        code=coupon.code,
        discount_percent=coupon.discount_percent,
        is_valid=coupon.is_valid,
    )
