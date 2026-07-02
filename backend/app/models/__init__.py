"""Internal domain models (plain dataclasses — Pydantic schemas live in schemas/)."""

from app.models.user import User
from app.models.download_history import DownloadHistoryRecord

__all__ = ["User", "DownloadHistoryRecord"]
