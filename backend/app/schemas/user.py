"""Schemas for the User resource and authentication tokens."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------------------------------------------------------------------------
# User schemas
# ---------------------------------------------------------------------------


class UserCreate(BaseModel):
    """Payload required to register a new user account."""

    email: EmailStr = Field(description="Unique email address for the account.")
    username: str = Field(
        min_length=3,
        max_length=100,
        description=(
            "Unique username for display and login. "
            "Must be 3–100 characters."
        ),
    )
    password: str = Field(
        min_length=8,
        description=(
            "Plain-text password submitted at registration. "
            "Will be hashed before storage — never persisted as-is."
        ),
    )
    full_name: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Optional display name, e.g. 'Jane Smith'.",
    )


class UserResponse(BaseModel):
    """Public user representation returned by the API (no sensitive fields)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(description="Unique user identifier (UUID v4).")
    email: EmailStr = Field(description="User's registered email address.")
    username: str = Field(description="User's unique username.")
    full_name: Optional[str] = Field(
        default=None, description="User's display name."
    )
    role: str = Field(
        description=(
            "Access role assigned to the user: 'admin', 'analyst', or 'viewer'."
        ),
    )
    is_active: bool = Field(
        description="Whether the account is currently active and able to log in."
    )
    created_at: datetime = Field(description="Timestamp when the account was created (UTC).")
    updated_at: datetime = Field(description="Timestamp of the most recent account update (UTC).")


# ---------------------------------------------------------------------------
# Authentication schemas
# ---------------------------------------------------------------------------


class UserLogin(BaseModel):
    """Credentials submitted to the login endpoint."""

    username: str = Field(
        description=(
            "Username or email address. "
            "The backend accepts either form for convenience."
        ),
    )
    password: str = Field(description="Plain-text password (transmitted over TLS only).")


class Token(BaseModel):
    """JWT access token returned after successful authentication."""

    access_token: str = Field(
        description="Signed JWT that must be supplied as a Bearer token in subsequent requests."
    )
    token_type: str = Field(
        default="bearer",
        description="OAuth2 token type — always 'bearer'.",
    )
    expires_in: Optional[int] = Field(
        default=None,
        ge=1,
        description="Token lifetime in seconds from the moment of issuance.",
    )


class TokenData(BaseModel):
    """Claims extracted from a decoded JWT (internal use only)."""

    user_id: Optional[uuid.UUID] = Field(
        default=None, description="UUID of the authenticated user."
    )
    username: Optional[str] = Field(
        default=None, description="Username claim from the token payload."
    )
    role: Optional[str] = Field(
        default=None, description="Role claim from the token payload."
    )
