"""Download / aria2 schemas."""

from __future__ import annotations

from pydantic import BaseModel


class DownloadInfo(BaseModel):
    """Rich status of a single aria2 download."""

    gid: str
    status: str
    name: str | None = None
    total_length: int = 0
    completed_length: int = 0
    download_speed: int = 0
    upload_speed: int = 0
    connections: int = 0
    num_seeders: int | None = None
    dir: str | None = None
    error_code: str | None = None
    error_message: str | None = None
    added_at: str | None = None
    completed_at: str | None = None
    info_hash: str | None = None
    is_torrent: bool = False


class AddDownloadRequest(BaseModel):
    """Payload to add a new download.

    * *uris* — one or more HTTP/FTP/magnet URIs.
    * *torrent* — base64-encoded ``.torrent`` file content.
    * *options* — aria2 per-download options (``dir``, ``out``, …).
    """

    uris: list[str] | None = None
    torrent: str | None = None
    options: dict[str, str] | None = None


class GlobalStats(BaseModel):
    """Aggregate aria2 statistics."""

    download_speed: int = 0
    upload_speed: int = 0
    num_active: int = 0
    num_waiting: int = 0
    num_stopped: int = 0


class MoveRequest(BaseModel):
    """Reposition a download in the waiting queue."""

    gid: str
    position: int
    how: str = "POS_SET"


class DownloadHistoryItem(BaseModel):
    """One row from the download_history table."""

    id: int
    gid: str
    name: str
    size: int
    status: str
    download_speed: int
    completed_at: str
    uri: str | None = None
