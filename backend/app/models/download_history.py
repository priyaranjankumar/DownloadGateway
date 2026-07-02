"""Internal download-history domain model."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class DownloadHistoryRecord:
    """Lightweight representation of a download_history row."""

    id: int
    gid: str
    name: str | None
    size: int
    status: str | None
    download_speed: int
    completed_at: str | None
    uri: str | None
