"""Internal user domain model."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class User:
    """Lightweight internal representation of a user row."""

    id: int
    username: str
    hashed_password: str
    created_at: str
