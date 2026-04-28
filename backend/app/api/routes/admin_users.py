"""Admin user management routes."""

import logging
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import delete, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.session import get_db
from app.models.user import Role, User
from app.models.subscription import Payment, Subscription

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Response / request models
# ---------------------------------------------------------------------------


class UserSubscriptionInfo(BaseModel):
    plan: Optional[str] = None
    status: Optional[str] = None
    current_period_end: Optional[datetime] = None
    is_lifetime: bool = False
    cancel_at_period_end: bool = False
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None


class UserPaymentInfo(BaseModel):
    last_amount: Optional[float] = None
    currency: Optional[str] = None
    last_payment_at: Optional[datetime] = None
    last_payment_status: Optional[str] = None
    total_paid: float = 0.0
    payments_count: int = 0


class AdminUserItem(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    email_verified: bool = False
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    subscription: Optional[UserSubscriptionInfo] = None
    payment: Optional[UserPaymentInfo] = None


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserStatusResponse(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    is_active: bool
    message: str


class UserDeleteResponse(BaseModel):
    id: uuid.UUID
    email: str
    deleted_subscriptions: int
    deleted_payments: int
    message: str


class UserCreateRequest(BaseModel):
    """Admin-only user creation payload.

    Bypasses the /register → verify-email → trial checkout path. Used
    for seeding test accounts and creating staff users without making
    them click a verify-email link.
    """
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)
    username: Optional[str] = None
    full_name: Optional[str] = None
    role: str = Field(default="viewer")
    email_verified: bool = True
    # If False (default), a second POST with the same email errors
    # with 409. If True, we update the password + flags of the
    # existing row and return it — useful for "reset this test user".
    upsert: bool = False


class UserCreateResponse(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    role: str
    is_active: bool
    email_verified: bool
    created: bool  # True if we inserted; False if upsert updated
    message: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/",
    response_model=UserCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_user(
    body: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: create (or optionally upsert) a user.

    Bypasses the /register → verify-email → trial-checkout flow so an
    admin can seed staff accounts or test rows without forcing a
    real signup. The caller must already be authenticated as an
    admin (router is mounted with ``_ADMIN_AUTH`` in routes/__init__).

    Behaviour
    ---------
    - Fresh email: create user, return 201 with ``created=True``.
    - Existing email + ``upsert=False``: 409 Conflict.
    - Existing email + ``upsert=True``: update hashed_password,
      email_verified and is_active on the existing row; 201 with
      ``created=False``. Role / username are left untouched so this
      doesn't accidentally demote a user.
    - Username collision on create: auto-suffix (``foo``, ``foo1``,
      ``foo2``, …) so the request never 409s on username alone.

    Does NOT send a verification email by default (``email_verified``
    defaults to True). Set ``email_verified=False`` to leave the
    user in the "needs verification" state — useful if you want to
    test the verify-email flow end-to-end.
    """
    # Validate role
    try:
        role_enum = Role(body.role.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role {body.role!r}. "
                   f"Must be one of: {', '.join(r.value for r in Role)}.",
        )

    email_lower = body.email.lower()

    # Existing-email branch
    existing = (
        await db.execute(select(User).where(User.email == email_lower))
    ).scalar_one_or_none()

    if existing is not None:
        if not body.upsert:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A user with email {email_lower!r} already exists. "
                       f"Set upsert=true to update the existing row.",
            )
        existing.hashed_password = hash_password(body.password)
        existing.email_verified = body.email_verified
        existing.is_active = True
        await db.flush()
        await db.refresh(existing)
        logger.info(
            "[ADMIN_CREATE_USER] Upserted existing user id=%s email=%s",
            existing.id, existing.email,
        )
        return UserCreateResponse(
            id=existing.id,
            email=existing.email,
            username=existing.username,
            role=existing.role.value if hasattr(existing.role, "value") else str(existing.role),
            is_active=existing.is_active,
            email_verified=existing.email_verified,
            created=False,
            message="Existing user updated (password reset).",
        )

    # Fresh create branch — resolve username, auto-suffix on collision.
    base_username = (body.username or email_lower.split("@")[0]).strip()
    if not base_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="username must be a non-empty string when supplied.",
        )
    username = base_username
    suffix = 1
    while (
        await db.execute(select(User).where(User.username == username))
    ).scalar_one_or_none() is not None:
        username = f"{base_username}{suffix}"
        suffix += 1
        if suffix > 999:
            # Defensive ceiling — in practice never reached.
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not resolve a free username suffix.",
            )

    new_user = User(
        email=email_lower,
        username=username,
        full_name=body.full_name,
        hashed_password=hash_password(body.password),
        role=role_enum,
        is_active=True,
        email_verified=body.email_verified,
    )
    db.add(new_user)
    await db.flush()
    await db.refresh(new_user)

    logger.info(
        "[ADMIN_CREATE_USER] Created user id=%s email=%s role=%s verified=%s",
        new_user.id, new_user.email, new_user.role.value, new_user.email_verified,
    )

    return UserCreateResponse(
        id=new_user.id,
        email=new_user.email,
        username=new_user.username,
        role=new_user.role.value,
        is_active=new_user.is_active,
        email_verified=new_user.email_verified,
        created=True,
        message="User created successfully.",
    )


@router.get("/", response_model=List[AdminUserItem])
async def list_users(
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    verified_only: bool = Query(
        True,
        description=(
            "Hide users that haven't confirmed their email. Defaults to True "
            "so the admin panel filters out the bot/throwaway noise — set "
            "to False to inspect unverified rows (e.g. when debugging the "
            "verify-email flow)."
        ),
    ),
    db: AsyncSession = Depends(get_db),
):
    """List users with subscription + payment summary, newest first.

    By default only verified users are returned: the public signup flow
    forces every real user through an email confirmation, so unverified
    rows are almost always abandoned signups or scripted bots and just
    pollute the admin view. Pass ``verified_only=false`` to see them.
    """
    # 1. Fetch users (paginated)
    user_query = select(User)
    if verified_only:
        user_query = user_query.where(User.email_verified.is_(True))
    user_query = (
        user_query.order_by(User.created_at.desc()).limit(limit).offset(offset)
    )
    user_result = await db.execute(user_query)
    users = list(user_result.scalars().all())
    if not users:
        return []

    user_ids = [u.id for u in users]

    # 2. Fetch subscriptions for these users (best-effort: tolerate missing table)
    subs_by_user: dict[uuid.UUID, Subscription] = {}
    try:
        sub_query = select(Subscription).where(Subscription.user_id.in_(user_ids))
        sub_result = await db.execute(sub_query)
        for sub in sub_result.scalars().all():
            existing = subs_by_user.get(sub.user_id)
            # Prefer the newest / most relevant subscription per user
            if existing is None or (sub.created_at and (existing.created_at is None or sub.created_at > existing.created_at)):
                subs_by_user[sub.user_id] = sub
    except Exception:
        logger.warning("Failed to load subscriptions for users", exc_info=True)
        await db.rollback()

    # 3. Fetch payments aggregated per user (best-effort)
    payments_by_user: dict[uuid.UUID, list[Payment]] = {}
    try:
        pay_query = (
            select(Payment)
            .where(Payment.user_id.in_(user_ids))
            .order_by(Payment.created_at.desc())
        )
        pay_result = await db.execute(pay_query)
        for payment in pay_result.scalars().all():
            payments_by_user.setdefault(payment.user_id, []).append(payment)
    except Exception:
        logger.warning("Failed to load payments for users", exc_info=True)
        await db.rollback()

    # 4. Compose response
    items: List[AdminUserItem] = []
    for user in users:
        sub_info: Optional[UserSubscriptionInfo] = None
        sub = subs_by_user.get(user.id)
        if sub is not None:
            try:
                sub_info = UserSubscriptionInfo(
                    plan=sub.plan_type.value if sub.plan_type else None,
                    status=sub.status.value if sub.status else None,
                    current_period_end=sub.current_period_end,
                    is_lifetime=bool(getattr(sub, "is_lifetime", False)),
                    cancel_at_period_end=bool(getattr(sub, "cancel_at_period_end", False)),
                    stripe_customer_id=getattr(sub, "stripe_customer_id", None),
                    stripe_subscription_id=getattr(sub, "stripe_subscription_id", None),
                )
            except Exception:
                logger.warning("Failed to parse subscription for user %s", user.id, exc_info=True)

        pay_info: Optional[UserPaymentInfo] = None
        user_payments = payments_by_user.get(user.id, [])
        if user_payments:
            try:
                latest = user_payments[0]  # already sorted desc
                succeeded = [
                    p for p in user_payments
                    if (p.status.value if hasattr(p.status, "value") else str(p.status)) == "succeeded"
                ]
                total = sum(float(p.amount or 0) for p in succeeded)
                pay_info = UserPaymentInfo(
                    last_amount=float(latest.amount) if latest.amount is not None else None,
                    currency=latest.currency,
                    last_payment_at=latest.created_at,
                    last_payment_status=(
                        latest.status.value if hasattr(latest.status, "value") else str(latest.status)
                    ),
                    total_paid=round(total, 2),
                    payments_count=len(user_payments),
                )
            except Exception:
                logger.warning("Failed to parse payments for user %s", user.id, exc_info=True)

        items.append(
            AdminUserItem(
                id=user.id,
                email=user.email,
                username=user.username,
                full_name=getattr(user, "full_name", None),
                role=user.role.value if hasattr(user.role, "value") else str(user.role),
                is_active=user.is_active,
                email_verified=bool(getattr(user, "email_verified", False)),
                last_login_at=getattr(user, "last_login_at", None),
                created_at=user.created_at,
                updated_at=user.updated_at,
                subscription=sub_info,
                payment=pay_info,
            )
        )

    return items


@router.put("/{user_id}/status", response_model=UserStatusResponse)
async def update_user_status(
    user_id: uuid.UUID,
    body: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Activate or suspend a user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.is_active = body.is_active
    await db.flush()
    await db.refresh(user)

    action = "activated" if body.is_active else "suspended"
    return UserStatusResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        is_active=user.is_active,
        message=f"User '{user.username}' has been {action}.",
    )


@router.delete("/{user_id}", response_model=UserDeleteResponse)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently delete a user and their related billing rows.

    Cascade order (subscriptions/payments have non-null FK to users.id and
    no DB-level cascade defined, so we delete them manually first):
        1. payments
        2. subscriptions
        3. user
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    email = user.email

    # Count + delete payments
    deleted_payments = 0
    try:
        pay_count_result = await db.execute(
            select(func.count()).select_from(Payment).where(Payment.user_id == user_id)
        )
        deleted_payments = int(pay_count_result.scalar() or 0)
        if deleted_payments:
            await db.execute(delete(Payment).where(Payment.user_id == user_id))
    except Exception:
        logger.warning("Failed to delete payments for user %s", user_id, exc_info=True)
        await db.rollback()
        # Re-fetch the user since rollback dropped session state
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Count + delete subscriptions
    deleted_subscriptions = 0
    try:
        sub_count_result = await db.execute(
            select(func.count()).select_from(Subscription).where(Subscription.user_id == user_id)
        )
        deleted_subscriptions = int(sub_count_result.scalar() or 0)
        if deleted_subscriptions:
            await db.execute(delete(Subscription).where(Subscription.user_id == user_id))
    except Exception:
        logger.warning("Failed to delete subscriptions for user %s", user_id, exc_info=True)
        await db.rollback()
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Finally delete the user
    await db.execute(delete(User).where(User.id == user_id))
    await db.flush()

    return UserDeleteResponse(
        id=user_id,
        email=email,
        deleted_subscriptions=deleted_subscriptions,
        deleted_payments=deleted_payments,
        message=f"User '{email}' deleted along with {deleted_subscriptions} subscription(s) and {deleted_payments} payment(s).",
    )
