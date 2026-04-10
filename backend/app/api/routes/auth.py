"""Authentication routes: login, register, verify, reset, current-user.

All timestamps are stored UTC-aware. The new endpoints added in the
April 2026 drop are:

- POST /auth/verify-email          — confirm email via token, returns JWT
- POST /auth/resend-verification   — re-issue verification link (no leak)
- POST /auth/forgot-password       — issue password reset token by email
- POST /auth/reset-password        — consume token and set new password

``POST /auth/register`` creates users with ``email_verified=False`` and
fires a verification email in the background, but **immediately issues a
JWT** so the user can start browsing without waiting for email delivery
(Critical: SMTP sometimes isn't configured / lands in spam / etc.). The
verification requirement is instead enforced at **subscription purchase
time** by ``/subscriptions/create-checkout``, which returns 403 with
``detail="email_not_verified"`` until the user has clicked the link.

Admin helper endpoints (added because SMTP delivery is unreliable):

- GET /auth/admin/verification-link/{email}  — copy the verification URL
- POST /auth/admin/verify-user/{email}       — force-verify out-of-band
"""

from __future__ import annotations

import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_admin
from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    oauth2_scheme,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserResponse
from app.services.email import (
    send_password_reset_email,
    send_verification_email,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Local get_current_user (kept for backward compatibility with any routes
# that still import it from app.api.routes.auth). New code should import
# the version in app.auth.dependencies.
# ---------------------------------------------------------------------------


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Decode the JWT and return the corresponding User ORM object."""
    payload = decode_access_token(token)
    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
    return user


# ---------------------------------------------------------------------------
# Helper: build the standard login response (JWT + UserResponse)
# ---------------------------------------------------------------------------


def _issue_token(user: User) -> Token:
    settings = get_settings()
    expire_minutes = settings.access_token_expire_minutes
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "username": user.username,
            "role": user.role.value,
        },
        expires_delta=timedelta(minutes=expire_minutes),
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=expire_minutes * 60,
    )


# ---------------------------------------------------------------------------
# Request / response schemas for the new endpoints
# ---------------------------------------------------------------------------


class VerifyEmailRequest(BaseModel):
    token: str = Field(min_length=10, max_length=128)


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=10, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class AuthMessageResponse(BaseModel):
    message: str


class LoginTokenResponse(Token):
    """Login response — the JWT + the user object (shape reused by verify)."""

    user: UserResponse


class RegisterTokenResponse(LoginTokenResponse):
    """Register response — same shape as login + a human-readable message.

    The message tells the user that a verification email was sent (so the
    frontend can show a subtle reminder), but the client should treat this
    exactly like a login response and store the token immediately.
    """

    message: str


class AdminVerificationInfo(BaseModel):
    """Admin-only view of a user's verification state."""

    user_id: uuid.UUID
    email: EmailStr
    email_verified: bool
    verification_url: str | None = None
    verification_sent_at: datetime | None = None


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------


VERIFICATION_TOKEN_TTL = timedelta(hours=24)
PASSWORD_RESET_TTL = timedelta(hours=1)


# ---------------------------------------------------------------------------
# Background-task wrappers — NEVER let SMTP failures crash the worker
# ---------------------------------------------------------------------------
#
# These helpers are added to a FastAPI ``BackgroundTasks`` instance so the
# HTTP response is returned to the user **before** the SMTP handshake even
# starts. On Hostinger (or any slow upstream SMTP) the send can take several
# seconds, so blocking the request on it made /auth/register hang for
# 1–2 minutes and left the user staring at a spinner. The email delivery
# itself is unchanged; only *when* it runs moves.
#
# Every task is wrapped in a broad try/except so an SMTP outage, DNS
# failure, or bad credentials cannot kill the background worker with an
# unhandled exception. Errors are logged at ERROR level so they are still
# visible in Railway logs.


async def _send_verification_email_safe(
    to: str, token: str, username: str
) -> None:
    """Background wrapper around ``send_verification_email`` that logs
    but never raises. Used by :func:`register`, :func:`resend_verification`
    and :func:`admin_resend_verification`.
    """
    try:
        await send_verification_email(to=to, token=token, username=username)
    except Exception as exc:  # noqa: BLE001 — must never crash the worker
        logger.error(
            "Background verification email failed to=%s err=%s", to, exc
        )


async def _send_password_reset_email_safe(
    to: str, token: str, username: str
) -> None:
    """Background wrapper around ``send_password_reset_email`` that logs
    but never raises. Used by :func:`forgot_password`.
    """
    try:
        await send_password_reset_email(to=to, token=token, username=username)
    except Exception as exc:  # noqa: BLE001 — must never crash the worker
        logger.error(
            "Background password reset email failed to=%s err=%s", to, exc
        )


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------


@router.post(
    "/login",
    response_model=LoginTokenResponse,
    summary="OAuth2 password login",
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> LoginTokenResponse:
    """Authenticate with username or email + password, return JWT + user.

    Email verification is **no longer required to log in** — unverified
    users can still sign in and browse the app. The verification gate
    has been moved to ``/subscriptions/create-checkout`` so it only
    blocks the critical path (paying for a plan), not exploration.

    The ``email_verified`` flag is still returned on the ``user`` object
    so the frontend can render a "please verify" reminder banner.
    """
    # Support login by username OR email
    result = await db.execute(
        select(User).where(
            (User.username == form_data.username)
            | (User.email == form_data.username)
        )
    )
    user = result.scalar_one_or_none()

    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    user.last_login_at = datetime.now(timezone.utc)
    await db.flush()

    token = _issue_token(user)
    return LoginTokenResponse(
        access_token=token.access_token,
        token_type=token.token_type,
        expires_in=token.expires_in,
        user=UserResponse.model_validate(user),
    )


# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------


@router.post(
    "/register",
    response_model=RegisterTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    payload: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> RegisterTokenResponse:
    """Create a new user and immediately log them in.

    Design:
      • User is created with ``email_verified=False`` and a verification
        token is generated + stored.
      • A verification email is queued as a **FastAPI background task**,
        so the HTTP response is returned to the user *before* the SMTP
        handshake even starts. Hostinger's SMTP handshake + TLS + send
        was previously blocking the endpoint for 1–2 minutes, which made
        the "Create account" button appear dead. Moving the send off the
        request path is the fix.
      • The response includes a valid JWT so the frontend can store the
        token and the user can start browsing immediately — no "check
        your inbox, then come back to log in" friction loop.
      • Email verification is still enforced at subscription purchase
        time (``/subscriptions/create-checkout`` returns 403 with
        ``detail="email_not_verified"`` if ``email_verified`` is False),
        so the critical money path is still protected.

    This is the tradeoff that matters: users who can't receive their
    verification email (spam, wrong address, SMTP outage) can still use
    the free parts of the app and only get blocked when they try to
    pay — at which point admin can force-verify them via the admin
    endpoint below.
    """
    existing = await db.execute(
        select(User).where(
            (User.email == payload.email) | (User.username == payload.username)
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with that email or username already exists.",
        )

    verification_token = secrets.token_urlsafe(32)

    new_user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        is_active=True,
        email_verified=False,
        email_verification_token=verification_token,
        email_verification_sent_at=datetime.now(timezone.utc),
        last_login_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    await db.flush()
    await db.refresh(new_user)

    # Queue the verification email as a background task. The request
    # returns immediately with a valid JWT; the SMTP send happens after
    # the response has been flushed to the client. ``_send_verification_email_safe``
    # swallows and logs any errors so an SMTP outage cannot crash the worker.
    background_tasks.add_task(
        _send_verification_email_safe,
        new_user.email,
        verification_token,
        new_user.username,
    )

    token = _issue_token(new_user)
    return RegisterTokenResponse(
        access_token=token.access_token,
        token_type=token.token_type,
        expires_in=token.expires_in,
        user=UserResponse.model_validate(new_user),
        message=(
            "Account created. We've sent a verification email — you can "
            "explore the app now, but you'll need to verify before you "
            "can subscribe."
        ),
    )


# ---------------------------------------------------------------------------
# POST /auth/verify-email
# ---------------------------------------------------------------------------


@router.post(
    "/verify-email",
    response_model=LoginTokenResponse,
    summary="Confirm email verification via token",
)
async def verify_email(
    payload: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
) -> LoginTokenResponse:
    """Consume a verification token, mark email verified, issue a JWT.

    Returns 400 ``invalid_or_expired_token`` on unknown or stale (>24h) tokens.
    """
    result = await db.execute(
        select(User).where(User.email_verification_token == payload.token)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_or_expired_token",
        )

    # Stale check — tokens expire 24h after being issued.
    sent_at = user.email_verification_sent_at
    if sent_at is not None:
        # Make sure comparison is aware
        if sent_at.tzinfo is None:
            sent_at = sent_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) - sent_at > VERIFICATION_TOKEN_TTL:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="invalid_or_expired_token",
            )

    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_sent_at = None
    user.last_login_at = datetime.now(timezone.utc)
    await db.flush()

    token = _issue_token(user)
    return LoginTokenResponse(
        access_token=token.access_token,
        token_type=token.token_type,
        expires_in=token.expires_in,
        user=UserResponse.model_validate(user),
    )


# ---------------------------------------------------------------------------
# POST /auth/resend-verification
# ---------------------------------------------------------------------------


@router.post(
    "/resend-verification",
    response_model=AuthMessageResponse,
    summary="Resend the email verification link",
)
async def resend_verification(
    payload: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> AuthMessageResponse:
    """Issue a fresh verification token and re-send the email.

    Always returns 200 to avoid leaking whether an email address is
    registered. If the user does not exist, or is already verified, the
    endpoint silently returns success. The email send is performed in
    a background task so the user does not wait for the SMTP round-trip.
    """
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user is not None and not user.email_verified:
        user.email_verification_token = secrets.token_urlsafe(32)
        user.email_verification_sent_at = datetime.now(timezone.utc)
        await db.flush()
        background_tasks.add_task(
            _send_verification_email_safe,
            user.email,
            user.email_verification_token,
            user.username,
        )

    return AuthMessageResponse(
        message="If that account exists, a new verification email has been sent."
    )


# ---------------------------------------------------------------------------
# POST /auth/forgot-password
# ---------------------------------------------------------------------------


@router.post(
    "/forgot-password",
    response_model=AuthMessageResponse,
    summary="Request a password reset link",
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> AuthMessageResponse:
    """Issue a password-reset token (1h TTL) and email it to the user.

    Always returns 200 regardless of whether the email exists in the
    database, to avoid account-enumeration leaks. The email send runs
    in a background task so slow SMTP cannot hang this endpoint.
    """
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user is not None:
        user.reset_password_token = secrets.token_urlsafe(32)
        user.reset_password_expires_at = datetime.now(timezone.utc) + PASSWORD_RESET_TTL
        await db.flush()
        background_tasks.add_task(
            _send_password_reset_email_safe,
            user.email,
            user.reset_password_token,
            user.username,
        )

    return AuthMessageResponse(
        message="If that email exists, a password reset link has been sent."
    )


# ---------------------------------------------------------------------------
# POST /auth/reset-password
# ---------------------------------------------------------------------------


@router.post(
    "/reset-password",
    response_model=AuthMessageResponse,
    summary="Consume a reset token and set a new password",
)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthMessageResponse:
    """Set a new password if the token is valid and not expired."""
    result = await db.execute(
        select(User).where(User.reset_password_token == payload.token)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_or_expired_token",
        )

    expires_at = user.reset_password_expires_at
    if expires_at is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_or_expired_token",
        )
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid_or_expired_token",
        )

    user.hashed_password = hash_password(payload.new_password)
    user.reset_password_token = None
    user.reset_password_expires_at = None
    await db.flush()

    return AuthMessageResponse(message="Password has been reset successfully.")


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return the profile of the currently authenticated user."""
    return UserResponse.model_validate(current_user)


# ---------------------------------------------------------------------------
# Admin helpers — used when SMTP delivery is unreliable
# ---------------------------------------------------------------------------


@router.get(
    "/admin/verification-link/{email}",
    response_model=AdminVerificationInfo,
    summary="Copy the verification URL for a user (admin-only)",
)
async def admin_get_verification_link(
    email: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> AdminVerificationInfo:
    """Return the verification URL for a user so admin can share it manually.

    Useful when SMTP is down, lands in spam, or the user typoed their
    email. Returns ``verification_url=None`` if the user is already
    verified or no token has been issued.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    settings = get_settings()
    verification_url: str | None = None
    if user.email_verification_token:
        base = (settings.frontend_url or "http://localhost:3000").rstrip("/")
        verification_url = (
            f"{base}/auth/verify-email?token={user.email_verification_token}"
        )

    return AdminVerificationInfo(
        user_id=user.id,
        email=user.email,
        email_verified=user.email_verified,
        verification_url=verification_url,
        verification_sent_at=user.email_verification_sent_at,
    )


@router.post(
    "/admin/verify-user/{email}",
    response_model=UserResponse,
    summary="Force-verify a user's email (admin-only)",
)
async def admin_force_verify_user(
    email: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> UserResponse:
    """Mark a user's email as verified, bypassing the token flow.

    Safety hatch for support cases: user reports they can't receive
    their verification email → admin verifies them out-of-band →
    they can buy a subscription. The old token is cleared so it can
    no longer be used.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_sent_at = None
    await db.flush()
    await db.refresh(user)
    logger.info(
        "Admin %s force-verified user %s", current_user.email, user.email
    )
    return UserResponse.model_validate(user)


@router.post(
    "/admin/resend-verification/{email}",
    response_model=AuthMessageResponse,
    summary="Re-send verification email from admin (admin-only)",
)
async def admin_resend_verification(
    email: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> AuthMessageResponse:
    """Issue a fresh verification token and re-send the email as admin.

    Unlike the public ``/resend-verification`` endpoint, this returns a
    404 if the user doesn't exist so admin can tell right away whether
    the account is registered. The actual email send runs in a
    background task so this endpoint never hangs on a slow SMTP server.
    Admin can look at Railway logs (``grep 'Background verification'``)
    to confirm delivery, or use ``GET /auth/admin/verification-link/{email}``
    to copy the URL directly without relying on SMTP at all.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.email_verified:
        return AuthMessageResponse(message="User is already verified.")

    user.email_verification_token = secrets.token_urlsafe(32)
    user.email_verification_sent_at = datetime.now(timezone.utc)
    await db.flush()

    background_tasks.add_task(
        _send_verification_email_safe,
        user.email,
        user.email_verification_token,
        user.username,
    )

    return AuthMessageResponse(
        message=f"Verification email queued for {user.email}."
    )
