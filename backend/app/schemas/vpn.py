"""VPN / WireGuard / kill-switch schemas."""

from __future__ import annotations

from pydantic import BaseModel


class VPNStatus(BaseModel):
    """Comprehensive VPN connection status."""

    connected: bool
    server_id: str | None = None
    server_name: str | None = None
    country: str | None = None
    city: str | None = None
    endpoint: str | None = None
    public_ip: str | None = None
    connected_since: str | None = None
    last_handshake: str | None = None
    transfer_rx: str | None = None
    transfer_tx: str | None = None
    protocol: str = "WireGuard"


class VPNConnectRequest(BaseModel):
    """Body for a VPN connect request."""

    server_id: str


class ServerInfo(BaseModel):
    """Metadata for one available VPN server config."""

    id: str
    name: str
    country: str
    city: str
    hostname: str
    country_code: str


class IPInfo(BaseModel):
    """Current public IP with geolocation."""

    ip: str
    country: str | None = None
    city: str | None = None
    asn: str | None = None
    provider: str | None = None


class KillSwitchStatus(BaseModel):
    """Whether the iptables kill switch is active."""

    enabled: bool
