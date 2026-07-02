"""Authentication request/response schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Credentials submitted on the login form."""

    username: str = Field(..., min_length=1, max_length=64)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    """JWT token returned after successful authentication."""

    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Public-facing user information."""

    username: str
    created_at: str


class SetupRequest(BaseModel):
    """First-run admin account creation payload."""

    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    """Payload for an authenticated password change."""

    current_password: str
    new_password: str = Field(..., min_length=8)
