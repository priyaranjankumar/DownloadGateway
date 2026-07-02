"""FastAPI router for authentication and setup."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    UserResponse,
    SetupRequest,
    ChangePasswordRequest,
)
from app.services.auth import AuthService
from app.dependencies import get_current_user, get_auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/setup-status")
async def get_setup_status(auth: AuthService = Depends(get_auth_service)):
    """Check if first-run setup is complete."""
    return {"setup_complete": await auth.is_setup_complete()}

@router.post("/setup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def setup_first_run(
    req: SetupRequest,
    auth: AuthService = Depends(get_auth_service),
):
    """First-run setup.  Creates the first admin account if none exists."""
    if await auth.is_setup_complete():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Setup already complete. Use standard login.",
        )
    user = await auth.create_user(req.username, req.password)
    return UserResponse(username=user.username, created_at=user.created_at)

@router.post("/login", response_model=TokenResponse)
async def login(
    req: LoginRequest,
    auth: AuthService = Depends(get_auth_service),
):
    """Authenticate credentials and return a access token."""
    user = await auth.authenticate(req.username, req.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = AuthService.create_token(user.username)
    return TokenResponse(access_token=token, token_type="bearer")

@router.get("/me", response_model=UserResponse)
async def get_me(
    username: str = Depends(get_current_user),
    auth: AuthService = Depends(get_auth_service),
):
    """Get the currently logged-in user profile details."""
    user = await auth.get_user(username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return UserResponse(username=user.username, created_at=user.created_at)

@router.post("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    username: str = Depends(get_current_user),
    auth: AuthService = Depends(get_auth_service),
):
    """Change the password for the current user."""
    success = await auth.change_password(
        username, req.current_password, req.new_password
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )
    return {"detail": "Password updated successfully"}
