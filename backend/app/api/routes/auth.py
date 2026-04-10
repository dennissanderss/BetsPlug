"""Authentication routes: login, register, verify, reset, current-user.

All timestamps are stored UTC-aware. The new endpoints added in the
April 2026 drop are:

- POST /auth/verify-email          — confirm email via token, returns JWT
- POST /auth/resend-verification   — re-issue verification link (no leak)
- POST /auth/forgot-password       — issue password reset token by email
- POST /auth/reset-password        — consume token and set new password

``POST /auth/register`` now creates users with ``email_verified=False`` and
fires a verification email; ``POST /auth/login`` refuses to issue a JWT
for unverified accounts with the machine-readable detail string
``"email_not_verified"`` so the frontend can prompt to resend.
"""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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


class RegisterResponse(BaseModel):
    """Response returned by POST /auth/register.

    The user is created but ``email_verified`` is still False. The frontend
    should show a "check your inbox" message.
    """

    user: UserResponse
    message: str


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


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------


VERIFICATION_TOKEN_TTL = timedelta(hours=24)
PASSWORD_RESET_TTL = timedelta(hours=1)


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

    Returns HTTP 403 with ``detail="email_not_verified"`` (a
    machine-readable string the frontend matches on) when the account
    exists and the password is correct but the email has not been
    verified yet.
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

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="email_not_verified",
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
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> RegisterResponse:
    """Create an inactive-until-verified user and send a verification email.

    Registration no longer logs the user in directly — they receive a
    verification email and must click the link before they can sign in.
    Email delivery failures are logged but do not break registration.
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
    )
    db.add(new_user)
    await db.flush()
    await db.refresh(new_user)

    # Fire the verification email; don't let SMTP errors fail the request.
    try:
        await send_verification_email(
            to=new_user.email,
            token=verification_token,
            username=new_user.username,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Verification email failed for %s: %s", new_user.email, exc)

    return RegisterResponse(
        user=UserResponse.model_validate(new_user),
        message="Check your email to verify your account",
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
    db: AsyncSession = Depends(get_db),
) -> AuthMessageResponse:
    """Issue a fresh verification token and re-send the email.

    Always returns 200 to avoid leaking whether an email address is
    registered. If the user does not exist, or is already verified, the
    endpoint silently returns success.
    """
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user is not None and not user.email_verified:
        user.email_verification_token = secrets.token_urlsafe(32)
        user.email_verification_sent_at = datetime.now(timezone.utc)
        await db.flush()
        try:
            await send_verification_email(
                to=user.email,
                token=user.email_verification_token,
                username=user.username,
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("Resend verification failed for %s: %s", user.email, exc)

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
    db: AsyncSession = Depends(get_db),
) -> AuthMessageResponse:
    """Issue a password-reset token (1h TTL) and email it to the user.

    Always returns 200 regardless of whether the email exists in the
    database, to avoid account-enumeration leaks.
    """
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user is not None:
        user.reset_password_token = secrets.token_urlsafe(32)
        user.reset_password_expires_at = datetime.now(timezone.utc) + PASSWORD_RESET_TTL
        await db.flush()
        try:
            await send_password_reset_email(
                to=user.email,
                token=user.reset_password_token,
                username=user.username,
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("Password reset email failed for %s: %s", user.email, exc)

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
