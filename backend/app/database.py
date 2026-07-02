"""SQLite database layer (aiosqlite, no ORM)."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import aiosqlite
import structlog

from app.config import settings

log = structlog.get_logger(__name__)

_db_path: str = ""


def _resolve_db_path() -> str:
    """Return the absolute database file path, creating parent dirs."""
    global _db_path
    if _db_path:
        return _db_path
    p = Path(settings.database_path)
    if not p.is_absolute():
        p = Path(os.getcwd()) / p
    p.parent.mkdir(parents=True, exist_ok=True)
    _db_path = str(p)
    return _db_path


async def get_db() -> aiosqlite.Connection:
    """Open a new connection.  Callers are responsible for closing it."""
    db = await aiosqlite.connect(_resolve_db_path())
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db() -> None:
    """Create tables if they do not exist."""
    db = await get_db()
    try:
        await db.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                username        TEXT    UNIQUE NOT NULL,
                hashed_password TEXT    NOT NULL,
                created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS download_history (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                gid             TEXT    NOT NULL,
                name            TEXT,
                size            INTEGER DEFAULT 0,
                status          TEXT,
                download_speed  INTEGER DEFAULT 0,
                completed_at    TEXT,
                uri             TEXT
            );

            CREATE TABLE IF NOT EXISTS settings (
                key   TEXT PRIMARY KEY,
                value TEXT
            );
            """
        )
        await db.commit()
        log.info("database_initialised", path=_resolve_db_path())
    finally:
        await db.close()


async def execute_query(sql: str, params: tuple[Any, ...] = ()) -> int:
    """Execute a write query and return ``lastrowid``."""
    db = await get_db()
    try:
        cursor = await db.execute(sql, params)
        await db.commit()
        return cursor.lastrowid  # type: ignore[return-value]
    finally:
        await db.close()


async def fetch_one(sql: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    """Return a single row as a dict, or ``None``."""
    db = await get_db()
    try:
        cursor = await db.execute(sql, params)
        row = await cursor.fetchone()
        if row is None:
            return None
        return dict(row)
    finally:
        await db.close()


async def fetch_all(sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    """Return all matching rows as a list of dicts."""
    db = await get_db()
    try:
        cursor = await db.execute(sql, params)
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()
