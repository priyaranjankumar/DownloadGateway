"""User-facing application settings schema."""

from __future__ import annotations

from pydantic import BaseModel


class AppSettings(BaseModel):
    """All user-configurable application settings.

    Persisted in the ``settings`` table as key/value pairs.
    """

    download_dir: str | None = None
    max_concurrent_downloads: int | None = None
    max_download_speed: int | None = None          # bytes/sec, 0 = unlimited
    max_upload_speed: int | None = None             # bytes/sec, 0 = unlimited
    aria2_rpc_secret: str | None = None
    vpn_auto_connect: bool | None = None
    vpn_auto_connect_server: str | None = None
    killswitch_auto_enable: bool | None = None
    ip_check_interval: int | None = None
    theme: str | None = None                        # "light" / "dark" / "system"
    notification_download_complete: bool | None = None
    notification_download_error: bool | None = None
    notification_vpn_disconnect: bool | None = None
