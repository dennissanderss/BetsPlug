"""Admin user management routes."""

import logging
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.models.subscription import Subscription

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


class UserListItem(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    role: str
    is_active: bool
    created_at: datetime
    subscription: Optional[UserSubscriptionInfo] = None


class UserListResponse(BaseModel):
    items: List[UserListItem]
    total: int


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserStatusResponse(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    is_active: bool
    message: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/", response_model=UserListResponse)
async def list_users(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List all users with pagination, including subscription info."""
    total_result = await db.execute(select(func.count()).select_from(User))
    total = total_result.scalar() or 0

    # Try the JOIN query first; if the subscriptions table doesn't exist
    # yet (e.g. migrations haven't run), fall back to users-only.
    rows_with_subs: list | None = None
    try:
        query = (
            select(User, Subscription)
            .outerjoin(Subscription, User.id == Subscription.user_id)
            .order_by(User.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await db.execute(query)
        rows_with_subs = result.all()
    except Exception:
        logger.warning("Failed to join subscriptions — falling back to users only", exc_info=True)
        await db.rollback()
        rows_with_subs = None

    items: List[UserListItem] = []

    if rows_with_subs is not None:
        for user, sub in rows_with_subs:
            # Safe subscription extraction
            sub_info = None
            if sub is not None:
                try:
                    sub_info = UserSubscriptionInfo(
                        plan=sub.plan_type.value if sub.plan_type else None,
                        status=sub.status.value if sub.status else None,
                        current_period_end=sub.current_period_end if sub.current_period_end else None,
                        is_lifetime=sub.is_lifetime if hasattr(sub, "is_lifetime") else False,
                    )
                except Exception:
                    logger.warning("Failed to parse subscription for user %s", user.id, exc_info=True)
                    sub_info = None
            items.append(
                UserListItem(
                    id=user.id,
                    email=user.email,
                    username=user.username,
                    role=user.role.value if hasattr(user.role, "value") else str(user.role),
                    is_active=user.is_active,
                    created_at=user.created_at,
                    subscription=sub_info,
                )
            )
    else:
        # Fallback: query users without subscription data
        fallback_query = (
            select(User)
            .order_by(User.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        fallback_result = await db.execute(fallback_query)
        for user in fallback_result.scalars().all():
            items.append(
                UserListItem(
                    id=user.id,
                    email=user.email,
                    username=user.username,
                    role=user.role.value if hasattr(user.role, "value") else str(user.role),
                    is_active=user.is_active,
                    created_at=user.created_at,
                    subscription=None,
                )
            )

    return UserListResponse(items=items, total=total)


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
