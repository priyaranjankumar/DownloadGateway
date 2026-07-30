"""Scheduled download schemas."""

from __future__ import annotations
from pydantic import BaseModel

class CreateScheduleRequest(BaseModel):
    """Payload to create a scheduled download."""
    uris: list[str] | None = None
    torrent: str | None = None
    options: dict[str, str] | None = None
    schedule_at: str  # ISO8601 UTC timestamp, e.g. "2026-08-01T02:00:00Z"

class ScheduledDownload(BaseModel):
    """A scheduled download record."""
    id: int
    uris: str
    torrent_b64: str | None = None
    options: str | None = None
    schedule_at: str
    status: str  # pending | dispatched | failed | cancelled
    created_at: str
    dispatched_at: str | None = None
    error_message: str | None = None
