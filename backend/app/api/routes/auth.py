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
import time
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, Form, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, or_, select
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
    send_email,
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


def _issue_token(user: User, *, remember: bool = False) -> Token:
    """Issue a signed JWT for ``user``.

    Default lifetime is ``settings.access_token_expire_minutes`` (60 min
    today). When ``remember=True`` — i.e. the visitor ticked "Remember
    this device" on the login form — the token is instead issued with a
    30-day TTL. Both are still finite; there is no "stay signed in
    forever" mode. Other auth paths (register, oauth, refresh) keep the
    short default so a stolen device session can't outlive its window.
    """
    settings = get_settings()
    expire_minutes = (
        60 * 24 * 30 if remember else settings.access_token_expire_minutes
    )
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


class AdminPasswordResetInfo(BaseModel):
    """Admin-only view of a freshly-issued password reset token."""

    user_id: uuid.UUID
    email: EmailStr
    reset_url: str
    expires_at: datetime


class AdminUserSummary(BaseModel):
    """Compact user row used by the admin diagnostics find-users endpoint."""

    id: uuid.UUID
    email: EmailStr
    username: str
    role: str
    email_verified: bool
    is_active: bool
    created_at: datetime | None = None
    last_login_at: datetime | None = None


class AdminSMTPConfig(BaseModel):
    """Redacted view of the current SMTP config — never exposes the password."""

    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_from: str
    smtp_use_tls: bool
    effective_mode: str  # "disabled", "implicit-tls (465)", "starttls (587)", "plain"
    password_set: bool   # True if smtp_password is not empty


class TestEmailRequest(BaseModel):
    to: EmailStr


class TestEmailResponse(BaseModel):
    success: bool
    error_type: str | None = None
    error_message: str | None = None
    duration_ms: int
    config: AdminSMTPConfig


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
# starts. A slow upstream SMTP server can take several seconds per message,
# so blocking the request on it previously made /auth/register hang for
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
    remember: bool = Form(False),
    db: AsyncSession = Depends(get_db),
) -> LoginTokenResponse:
    """Authenticate with username or email + password, return JWT + user.

    Email verification is **no longer required to log in** — unverified
    users can still sign in and browse the app. The verification gate
    has been moved to ``/subscriptions/create-checkout`` so it only
    blocks the critical path (paying for a plan), not exploration.

    The ``email_verified`` flag is still returned on the ``user`` object
    so the frontend can render a "please verify" reminder banner.

    When the form field ``remember=true`` is sent, the issued JWT lives
    for 30 days instead of the default 60 minutes (see ``_issue_token``).
    The frontend wires this to the "Remember this device" checkbox on
    the login form.
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

    token = _issue_token(user, remember=remember)
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
        handshake even starts. A slow upstream SMTP handshake + TLS +
        send was previously blocking the endpoint for 1–2 minutes, which
        made the "Create account" button appear dead. Moving the send
        off the request path is the fix.
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

    The endpoint logs at WARNING level whether the user was actually
    found — so when a user complains "I clicked forgot password and
    never got a mail", operators can grep Railway logs for
    ``[FORGOT_PASSWORD]`` and immediately see if the issue is a typo
    (``user not found``) or an SMTP delivery problem (``task queued``
    but no subsequent ``[EMAIL SMTP] ✓ Sent OK``).
    """
    # Case-insensitive lookup so "Dennis@…" matches "dennis@…".
    normalized = payload.email.strip().lower()
    result = await db.execute(
        select(User).where(func.lower(User.email) == normalized)
    )
    user = result.scalar_one_or_none()

    if user is None:
        logger.warning(
            "[FORGOT_PASSWORD] No user for email=%r — silently returning 200 "
            "(account-enumeration protection). If this was *you*, check for "
            "typos: call GET /auth/admin/find-users?q=<partial> as admin.",
            payload.email,
        )
    else:
        user.reset_password_token = secrets.token_urlsafe(32)
        user.reset_password_expires_at = datetime.now(timezone.utc) + PASSWORD_RESET_TTL
        await db.flush()
        logger.warning(
            "[FORGOT_PASSWORD] User found email=%s username=%s — queued "
            "background email task. Look for '[EMAIL SMTP] ✓ Sent OK to=%s' "
            "in subsequent log lines.",
            user.email, user.username, user.email,
        )
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


# ---------------------------------------------------------------------------
# Admin diagnostics — SMTP test, user search, password-reset link
# ---------------------------------------------------------------------------
#
# These endpoints exist because SMTP failures disappear into Railway logs and
# the public ``/forgot-password`` endpoint silently returns 200 on unknown
# emails. When a user complains "I never got my mail" we need to distinguish
# between (a) typo in the email address, (b) SMTP auth failure, (c) Gmail
# silently dropping the message because betsplug.com has no SPF/DKIM. The
# endpoints below let an admin answer all three questions from the browser
# instead of SSH-ing into Railway.


def _build_smtp_config_snapshot() -> AdminSMTPConfig:
    """Build a redacted view of the current SMTP config.

    Never exposes the password — only whether it's set or not. ``effective_mode``
    summarises the port/TLS combo so operators don't have to mentally decode
    ``use_tls=True, start_tls=False`` again.
    """
    settings = get_settings()
    if not settings.smtp_host:
        mode = "disabled (dev log mode)"
    elif settings.smtp_port == 465 and settings.smtp_use_tls:
        mode = "implicit-tls (465)"
    elif settings.smtp_port != 465 and settings.smtp_use_tls:
        mode = f"starttls ({settings.smtp_port})"
    else:
        mode = f"plain ({settings.smtp_port})"
    return AdminSMTPConfig(
        smtp_host=settings.smtp_host or "(not configured)",
        smtp_port=settings.smtp_port,
        smtp_user=settings.smtp_user or "(not set)",
        smtp_from=settings.smtp_from or "(not set)",
        smtp_use_tls=settings.smtp_use_tls,
        effective_mode=mode,
        password_set=bool(settings.smtp_password),
    )


@router.get(
    "/admin/smtp-config",
    response_model=AdminSMTPConfig,
    summary="Show the current SMTP config (admin-only, redacted)",
)
async def admin_get_smtp_config(
    current_user: User = Depends(require_admin),
) -> AdminSMTPConfig:
    """Return the currently active SMTP config without exposing the password.

    Useful sanity-check before firing a test email — if ``smtp_host`` is
    ``(not configured)`` or ``password_set`` is ``False``, no amount of
    DNS tweaking will help.
    """
    return _build_smtp_config_snapshot()


@router.post(
    "/admin/test-email",
    response_model=TestEmailResponse,
    summary="Send a synchronous test email (admin-only)",
)
async def admin_test_email(
    payload: TestEmailRequest,
    current_user: User = Depends(require_admin),
) -> TestEmailResponse:
    """Try to send a minimal test email RIGHT NOW and return the real result.

    Unlike the production email paths (which queue the send in a background
    task to keep the user request fast), this endpoint awaits the full
    SMTP round-trip and captures any exception. That's exactly what's
    needed to debug "emails don't arrive" issues: the response tells you
    whether the SMTP submission succeeded, and if not, which exception
    type was raised (SMTPAuthenticationError, SMTPServerDisconnected, etc.).

    ⚠️  A successful SMTP submission does NOT guarantee inbox delivery.
    Gmail and Outlook silently drop messages from domains without SPF /
    DKIM records. If this endpoint reports success but the mail never
    arrives, check your domain's DNS records.
    """
    config = _build_smtp_config_snapshot()
    start = time.perf_counter()

    # If no SMTP host is configured, ``send_email`` takes the dev-mode
    # path that logs to stdout and returns True. That would make this
    # endpoint report a misleading "success" to the admin. Fail fast and
    # explicit instead so the diagnostics UI clearly shows the state.
    settings = get_settings()
    if not settings.smtp_host:
        return TestEmailResponse(
            success=False,
            error_type="SMTPNotConfigured",
            error_message=(
                "No SMTP_HOST is set in the backend environment. The "
                "register / verification / password-reset flows currently "
                "only log the action URL to the server logs instead of "
                "sending real email. Configure an SMTP provider (any "
                "provider — SendGrid, Mailgun, Resend, Postmark, Amazon "
                "SES, etc.) and set the SMTP_* env vars on the backend "
                "to enable real delivery."
            ),
            duration_ms=0,
            config=config,
        )

    subject = "BetsPlug SMTP test"
    html = (
        "<html><body style='font-family: sans-serif;'>"
        "<h1 style='color: #f97316;'>✅ SMTP works</h1>"
        "<p>If you're reading this, the BetsPlug backend can reach "
        f"<code>{config.smtp_host}:{config.smtp_port}</code>, authenticate "
        f"as <code>{config.smtp_user}</code>, and successfully submit mail "
        "to the queue.</p>"
        "<p>Note that successful submission does <strong>not</strong> "
        "guarantee inbox delivery — Gmail and Outlook may still drop "
        "messages from domains without SPF/DKIM records.</p>"
        f"<p><small>Triggered by: {current_user.email}</small></p>"
        "</body></html>"
    )
    text = (
        "BetsPlug SMTP test — if you're reading this, the backend can "
        "reach and authenticate against your SMTP server. Note that a "
        "successful SMTP submission does not guarantee inbox delivery: "
        "Gmail may still drop mail from domains without SPF/DKIM.\n\n"
        f"Triggered by: {current_user.email}"
    )

    try:
        await send_email(
            to=payload.to,
            subject=subject,
            html=html,
            text=text,
            raise_on_failure=True,
        )
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        logger.warning(
            "[ADMIN TEST EMAIL] ✓ %s sent test email to %s in %d ms",
            current_user.email, payload.to, elapsed_ms,
        )
        return TestEmailResponse(
            success=True,
            error_type=None,
            error_message=None,
            duration_ms=elapsed_ms,
            config=config,
        )
    except Exception as exc:  # noqa: BLE001 — surface the real error to admin
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        logger.error(
            "[ADMIN TEST EMAIL] ✗ %s test email to %s failed after %d ms: "
            "%s: %s",
            current_user.email, payload.to, elapsed_ms,
            type(exc).__name__, exc,
        )
        return TestEmailResponse(
            success=False,
            error_type=type(exc).__name__,
            error_message=str(exc) or repr(exc),
            duration_ms=elapsed_ms,
            config=config,
        )


@router.get(
    "/admin/find-users",
    response_model=list[AdminUserSummary],
    summary="Search users by partial email or username (admin-only)",
)
async def admin_find_users(
    q: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> list[AdminUserSummary]:
    """Case-insensitive partial match on email and username, up to 25 results.

    Primary use case: a user says "I registered with dennissanders1002@…"
    but can't log in — admin searches ``dennissan`` and sees whether it's
    actually ``dennissanders`` (single s) or ``dennissanderss`` (double s)
    or ``dennissanders1002`` vs ``dennisanders1002``, etc.
    """
    stripped = q.strip()
    if len(stripped) < 2:
        raise HTTPException(
            status_code=400,
            detail="Query must be at least 2 characters.",
        )
    pattern = f"%{stripped.lower()}%"
    result = await db.execute(
        select(User)
        .where(
            or_(
                func.lower(User.email).like(pattern),
                func.lower(User.username).like(pattern),
            )
        )
        .limit(25)
    )
    users = list(result.scalars().all())
    logger.info(
        "[ADMIN FIND USERS] %s searched q=%r found=%d",
        current_user.email, stripped, len(users),
    )
    return [
        AdminUserSummary(
            id=u.id,
            email=u.email,
            username=u.username,
            role=u.role.value,
            email_verified=u.email_verified,
            is_active=u.is_active,
            created_at=getattr(u, "created_at", None),
            last_login_at=u.last_login_at,
        )
        for u in users
    ]


@router.get(
    "/admin/password-reset-link/{email}",
    response_model=AdminPasswordResetInfo,
    summary="Issue and return a password-reset URL (admin-only)",
)
async def admin_get_password_reset_link(
    email: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> AdminPasswordResetInfo:
    """Issue a fresh password-reset token and return the URL directly.

    Bypasses SMTP entirely so admin can hand the reset link to a user
    via chat/support while the email delivery issue is being fixed.
    Every call rotates the token (the previous reset link, if any, is
    invalidated) so it is safe to call repeatedly.
    """
    normalized = email.strip().lower()
    result = await db.execute(
        select(User).where(func.lower(User.email) == normalized)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=404, detail=f"User not found: {email}"
        )

    user.reset_password_token = secrets.token_urlsafe(32)
    user.reset_password_expires_at = datetime.now(timezone.utc) + PASSWORD_RESET_TTL
    await db.flush()

    settings = get_settings()
    base = (settings.frontend_url or "http://localhost:3000").rstrip("/")
    reset_url = f"{base}/auth/reset-password?token={user.reset_password_token}"

    logger.warning(
        "[ADMIN PASSWORD RESET LINK] %s issued reset link for %s",
        current_user.email, user.email,
    )

    return AdminPasswordResetInfo(
        user_id=user.id,
        email=user.email,
        reset_url=reset_url,
        expires_at=user.reset_password_expires_at,
    )
