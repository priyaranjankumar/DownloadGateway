"""VPN (WireGuard) management service."""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

import structlog

from app.config import settings
from app.schemas.vpn import ServerInfo, VPNStatus
from app.utils.process import run_command

log = structlog.get_logger(__name__)

# Pattern: surfshark-<country_code>-<city>.conf  (e.g. surfshark-us-nyc.conf)
_SERVER_RE = re.compile(
    r"^(?P<provider>[a-z]+)-(?P<cc>[a-z]{2})-(?P<city>[a-z0-9-]+)\.conf$",
    re.IGNORECASE,
)


class VPNService:
    """High-level WireGuard VPN operations backed by ``wg-quick``."""

    def __init__(self) -> None:
        self._config_dir = settings.wireguard_config_dir
        self._interface = settings.wireguard_interface

    # -- public API ----------------------------------------------------------

    async def connect(self, server_id: str) -> VPNStatus:
        """Activate the VPN for *server_id*.

        1. Symlink or copy the matching config file to ``/etc/wireguard/<interface>.conf``.
        2. Bring the interface up via ``wg-quick up``.
        """
        src = self._config_path(server_id)
        if not src.exists():
            raise FileNotFoundError(f"Config not found for server {server_id!r}")

        # Ensure any existing connection is torn down first
        await self._safe_down()

        dst = Path("/etc/wireguard") / f"{self._interface}.conf"
        try:
            if dst.exists() or dst.is_symlink():
                dst.unlink()
            # Try to symlink first so resolve() works to find the original file name
            dst.symlink_to(src)
        except Exception as e:
            log.warn("vpn_symlink_failed_falling_back_to_copy", src=str(src), dst=str(dst), error=str(e))
            # Fallback to copy in python if symlinking fails
            import shutil
            shutil.copy(str(src), str(dst))

        await run_command("wg-quick", "up", self._interface, sudo=True)
        log.info("vpn_connected", server_id=server_id)
        return await self.get_status()

    async def disconnect(self) -> VPNStatus:
        """Bring the WireGuard interface down."""
        await run_command(
            "wg-quick", "down", self._interface, sudo=True, check=False,
        )
        log.info("vpn_disconnected")
        return await self.get_status()

    async def reconnect(self, server_id: str | None = None) -> VPNStatus:
        """Cycle the connection.  If *server_id* is given switch servers."""
        await self._safe_down()
        if server_id:
            return await self.connect(server_id)
        # bring the same interface back up
        await run_command("wg-quick", "up", self._interface, sudo=True)
        return await self.get_status()

    async def get_status(self) -> VPNStatus:
        """Parse ``wg show`` output into a ``VPNStatus``."""
        result = await run_command(
            "wg", "show", self._interface, sudo=True, check=False,
        )
        if result.returncode != 0 or not result.stdout.strip():
            return VPNStatus(connected=False)

        parsed = self._parse_wg_show(result.stdout)
        server = await self.get_current_server()
        return VPNStatus(
            connected=True,
            server_id=server.get("id") if server else None,
            server_name=server.get("name") if server else None,
            country=server.get("country") if server else None,
            city=server.get("city") if server else None,
            endpoint=parsed.get("endpoint"),
            connected_since=None,
            last_handshake=parsed.get("latest_handshake"),
            transfer_rx=parsed.get("transfer_rx"),
            transfer_tx=parsed.get("transfer_tx"),
        )

    async def list_servers(self) -> list[ServerInfo]:
        """Scan the config directory for ``.conf`` files and return metadata."""
        servers: list[ServerInfo] = []
        config_dir = Path(self._config_dir)
        if not config_dir.is_dir():
            return servers

        for entry in sorted(config_dir.iterdir()):
            if not entry.suffix == ".conf":
                continue
            # skip the active interface config itself
            if entry.stem == self._interface:
                continue
            m = _SERVER_RE.match(entry.name)
            if m:
                cc = m.group("cc").upper()
                city = m.group("city").replace("-", " ").title()
                sid = entry.stem
                servers.append(
                    ServerInfo(
                        id=sid,
                        name=f"{cc} – {city}",
                        country=cc,
                        city=city,
                        hostname=sid,
                        country_code=cc,
                    )
                )
            else:
                # non-standard naming — use filename as-is
                sid = entry.stem
                servers.append(
                    ServerInfo(
                        id=sid,
                        name=sid,
                        country="",
                        city="",
                        hostname=sid,
                        country_code="",
                    )
                )
        return servers

    async def get_current_server(self) -> dict[str, str] | None:
        """Determine the currently active server from the active config."""
        conf = Path("/etc/wireguard") / f"{self._interface}.conf"
        if not conf.exists() and not conf.is_symlink():
            return None
        # Try to read the actual file and match against known configs
        try:
            target = conf.resolve()
            m = _SERVER_RE.match(target.name)
            if m:
                cc = m.group("cc").upper()
                city = m.group("city").replace("-", " ").title()
                return {
                    "id": target.stem,
                    "name": f"{cc} – {city}",
                    "country": cc,
                    "city": city,
                }
        except Exception:
            pass
        return {"id": self._interface, "name": self._interface, "country": "", "city": ""}

    # -- helpers -------------------------------------------------------------

    def _config_path(self, server_id: str) -> Path:
        """Resolve a server id to a config file path, preventing traversal."""
        safe = Path(server_id).name  # strip directory components
        return Path(self._config_dir) / f"{safe}.conf"

    async def _safe_down(self) -> None:
        """Bring interface down, ignoring errors if already down."""
        await run_command(
            "wg-quick", "down", self._interface, sudo=True, check=False,
        )

    @staticmethod
    def _parse_wg_show(output: str) -> dict[str, str]:
        """Extract key fields from ``wg show`` text output."""
        data: dict[str, str] = {}
        endpoint_m = re.search(r"endpoint:\s*(\S+)", output)
        if endpoint_m:
            data["endpoint"] = endpoint_m.group(1)

        handshake_m = re.search(r"latest handshake:\s*(.+)", output)
        if handshake_m:
            data["latest_handshake"] = handshake_m.group(1).strip()

        transfer_m = re.search(
            r"transfer:\s*([\d.]+\s*\S+)\s+received,\s*([\d.]+\s*\S+)\s+sent",
            output,
        )
        if transfer_m:
            data["transfer_rx"] = transfer_m.group(1)
            data["transfer_tx"] = transfer_m.group(2)

        return data
