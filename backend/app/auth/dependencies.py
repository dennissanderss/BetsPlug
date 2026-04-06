"""FastAPI authentication and authorisation dependencies.

Usage in route handlers
-----------------------

    from app.auth.dependencies import get_current_user, require_admin, require_analyst

    @router.get("/protected")
    async def protected(user: User = Depends(get_current_user)):
        ...

    @router.post("/admin-only")
    async def admin_only(user: User = Depends(require_admin)):
        ...

    @router.get("/analyst-or-admin")
    async def analysts(user: User = Depends(require_analyst)):
        ...

    # Custom role check
    @router.get("/custom")
    async def custom(user: User = Depends(require_role(Role.ANALYST))):
        ...
"""

from __future__ import annotations

import uuid
from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import Role, User


# OAuth2 scheme – token URL must match the login endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ---------------------------------------------------------------------------
# Core dependency: resolve current user from JWT
# ---------------------------------------------------------------------------


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Resolve the authenticated User from the Bearer token.

    Parameters
    ----------
    token:
        JWT Bearer token injected by FastAPI's OAuth2PasswordBearer scheme.
    db:
        Async database session.

    Returns
    -------
    User
        The active User row corresponding to the token's subject claim.

    Raises
    ------
    HTTPException 401
        If the token is invalid, expired, or missing a ``sub`` claim.
    HTTPException 401
        If the user record is not found in the database.
    HTTPException 403
        If the user account is inactive (``is_active = False``).
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # decode_access_token raises HTTPException 401 on failure
    payload = decode_access_token(token)

    user_id_str: str | None = payload.get("sub")
    if not user_id_str:
        raise credentials_exc

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exc

    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


# ---------------------------------------------------------------------------
# Active-user guard (no role requirement)
# ---------------------------------------------------------------------------


async def get_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Return the current user; raises 403 if the account is inactive.

    This is a convenience alias that makes the intent explicit in route
    signatures.  ``get_current_user`` already enforces ``is_active``, but
    this dependency makes the requirement self-documenting.
    """
    return current_user


# ---------------------------------------------------------------------------
# Role-based authorisation factory
# ---------------------------------------------------------------------------


def require_role(*roles: Role) -> Callable:
    """Return a FastAPI dependency that enforces one of *roles*.

    Parameters
    ----------
    *roles:
        One or more ``Role`` enum values.  The authenticated user must
        have ANY ONE of these roles to pass the check.

    Returns
    -------
    Callable
        A FastAPI-compatible dependency function.

    Example
    -------
        @router.delete("/team/{id}")
        async def delete_team(user: User = Depends(require_role(Role.ADMIN))):
            ...
    """
    allowed: frozenset[Role] = frozenset(roles)

    async def _dependency(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access denied. Required role(s): "
                    f"{', '.join(r.value for r in allowed)}. "
                    f"Your role: {current_user.role.value}."
                ),
            )
        return current_user

    # Give the dependency a useful __name__ for FastAPI docs / logging
    _dependency.__name__ = f"require_role({'_or_'.join(r.value for r in roles)})"
    return _dependency


# ---------------------------------------------------------------------------
# Pre-built role shortcut dependencies
# ---------------------------------------------------------------------------


async def _require_admin_dep(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency: current user must have the ADMIN role."""
    if current_user.role != Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Admin access required. Your role: {current_user.role.value}."
            ),
        )
    return current_user


async def _require_analyst_dep(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency: current user must have ADMIN or ANALYST role."""
    if current_user.role not in {Role.ADMIN, Role.ANALYST}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Analyst or Admin access required. "
                f"Your role: {current_user.role.value}."
            ),
        )
    return current_user


#: Shortcut dependency for admin-only routes.
#: Usage: ``user: User = Depends(require_admin)``
require_admin = _require_admin_dep

#: Shortcut dependency for analyst-or-admin routes.
#: Usage: ``user: User = Depends(require_analyst)``
require_analyst = _require_analyst_dep


# ---------------------------------------------------------------------------
# Optional: token introspection (useful for debug endpoints)
# ---------------------------------------------------------------------------


async def get_token_payload(
    token: str = Depends(oauth2_scheme),
) -> dict:
    """Return the raw decoded JWT payload (for debugging)."""
    return decode_access_token(token)
