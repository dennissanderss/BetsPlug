"""Admin user management routes."""

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

router = APIRouter()


# ---------------------------------------------------------------------------
# Response / request models
# ---------------------------------------------------------------------------


class UserSubscriptionInfo(BaseModel):
    plan: str
    status: str
    current_period_end: Optional[datetime] = None
    is_lifetime: bool


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
    query = (
        select(User, Subscription)
        .outerjoin(Subscription, User.id == Subscription.user_id)
        .order_by(User.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    rows = result.all()

    total_result = await db.execute(select(func.count()).select_from(User))
    total = total_result.scalar() or 0

    items: List[UserListItem] = []
    for user, sub in rows:
        sub_info = None
        if sub is not None:
            sub_info = UserSubscriptionInfo(
                plan=sub.plan_type.value if hasattr(sub.plan_type, "value") else str(sub.plan_type),
                status=sub.status.value if hasattr(sub.status, "value") else str(sub.status),
                current_period_end=sub.current_period_end,
                is_lifetime=sub.is_lifetime,
            )
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
