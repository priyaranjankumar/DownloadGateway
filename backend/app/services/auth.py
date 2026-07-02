"""Authentication and authorisation service."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
import structlog
from passlib.context import CryptContext

from app.config import settings
from app.database import execute_query, fetch_all, fetch_one
from app.models.user import User

log = structlog.get_logger(__name__)

_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Manages user creation, password hashing, JWT tokens, and login."""

    # -- password helpers ----------------------------------------------------

    @staticmethod
    def hash_password(password: str) -> str:
        """Return a bcrypt hash of *password*."""
        return _pwd_ctx.hash(password)

    @staticmethod
    def verify_password(plain: str, hashed: str) -> bool:
        """Check *plain* against *hashed*."""
        return _pwd_ctx.verify(plain, hashed)

    # -- JWT -----------------------------------------------------------------

    @staticmethod
    def create_token(username: str) -> str:
        """Generate a signed JWT containing a ``sub`` claim."""
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.jwt_expire_minutes
        )
        payload: dict[str, Any] = {
            "sub": username,
            "exp": expire,
        }
        return jwt.encode(payload, settings.secret_key, algorithm="HS256")

    @staticmethod
    def decode_token(token: str) -> dict[str, Any]:
        """Decode and validate a JWT.  Raises on invalid/expired tokens."""
        return jwt.decode(token, settings.secret_key, algorithms=["HS256"])

    # -- database operations -------------------------------------------------

    async def is_setup_complete(self) -> bool:
        """Return ``True`` if at least one user exists."""
        rows = await fetch_all("SELECT id FROM users LIMIT 1")
        return len(rows) > 0

    async def create_user(self, username: str, password: str) -> User:
        """Insert a new user and return the domain model."""
        hashed = self.hash_password(password)
        now = datetime.now(timezone.utc).isoformat()
        row_id = await execute_query(
            "INSERT INTO users (username, hashed_password, created_at) VALUES (?, ?, ?)",
            (username, hashed, now),
        )
        log.info("user_created", username=username)
        return User(id=row_id, username=username, hashed_password=hashed, created_at=now)

    async def authenticate(self, username: str, password: str) -> User | None:
        """Validate credentials and return the ``User``, or ``None``."""
        row = await fetch_one(
            "SELECT id, username, hashed_password, created_at FROM users WHERE username = ?",
            (username,),
        )
        if row is None:
            return None
        if not self.verify_password(password, row["hashed_password"]):
            return None
        return User(**row)

    async def change_password(
        self, username: str, current_password: str, new_password: str
    ) -> bool:
        """Update a user's password.  Returns ``True`` on success."""
        user = await self.authenticate(username, current_password)
        if user is None:
            return False
        new_hash = self.hash_password(new_password)
        await execute_query(
            "UPDATE users SET hashed_password = ? WHERE username = ?",
            (new_hash, username),
        )
        log.info("password_changed", username=username)
        return True

    async def get_user(self, username: str) -> User | None:
        """Fetch a user by username."""
        row = await fetch_one(
            "SELECT id, username, hashed_password, created_at FROM users WHERE username = ?",
            (username,),
        )
        if row is None:
            return None
        return User(**row)
