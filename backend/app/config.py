"""Application configuration loaded from environment variables."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All runtime configuration.  Every field can be overridden via a
    ``DG_`` prefixed environment variable (e.g. ``DG_SECRET_KEY``)."""

    model_config = SettingsConfigDict(
        env_prefix="DG_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # General
    app_name: str = "Download Gateway"
    secret_key: str = "CHANGE-ME-ON-FIRST-RUN"
    debug: bool = False

    # Aria2 JSON-RPC
    aria2_rpc_url: str = "http://localhost:6800/jsonrpc"
    aria2_rpc_secret: str = ""

    # WireGuard / VPN
    wireguard_config_dir: str = "/etc/wireguard"
    wireguard_interface: str = "wg0"

    # Storage
    download_dir: str = "/downloads"
    database_path: str = "./data/gateway.db"

    # IP-leak detection
    ip_check_interval: int = 30
    ip_check_url: str = "https://api.ipify.org?format=json"

    # Auth
    jwt_expire_minutes: int = 1440

    # Networking
    lan_subnet: str = "192.168.1.0/24"

    # Logging
    log_level: str = "INFO"


settings = Settings()
