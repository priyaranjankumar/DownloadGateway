"""Shared dependency injection modules for FastAPI."""

from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
import jwt

from app.config import settings
from app.services.auth import AuthService
from app.services.aria2 import Aria2Client

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
auth_service = AuthService()

async def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    """Decode and validate a JWT from the request header, returning the username."""
    import structlog
    l = structlog.get_logger(__name__)
    l.info("jwt_token_received", token=token)
    try:
        payload = AuthService.decode_token(token)
        username: str | None = payload.get("sub")
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_auth_service() -> AuthService:
    """Get the AuthService instance."""
    return auth_service

def get_aria2_client(request: Request) -> Aria2Client:
    """Get the active Aria2Client from application state."""
    client = getattr(request.app.state, "aria2", None)
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Aria2 client not initialized",
        )
    return client
