"""iptables-based VPN kill switch service."""

from __future__ import annotations

import structlog

from app.utils.process import run_command

log = structlog.get_logger(__name__)

# Marker comment so we can detect our own rules in iptables-save output.
_MARKER = "DG_KILLSWITCH"


class KillSwitchService:
    """Manage iptables rules that block all traffic except through the
    WireGuard tunnel and the local LAN."""

    async def enable(
        self,
        lan_subnet: str,
        wg_interface: str,
        wg_port: int = 51820,
    ) -> None:
        """Apply restrictive iptables rules.

        Policy:
        1. Default DROP on INPUT, FORWARD, OUTPUT.
        2. Allow loopback.
        3. Allow LAN traffic.
        4. Allow WireGuard UDP to establish the tunnel.
        5. Allow all traffic through the WG interface.
        6. Allow DNS *only* through the VPN tunnel.
        7. Allow established/related connections.
        """
        # Flush first to avoid duplicates
        await self.disable()

        rules: list[tuple[str, ...]] = [
            # -- loopback
            ("-A", "INPUT", "-i", "lo", "-j", "ACCEPT", "-m", "comment", "--comment", _MARKER),
            ("-A", "OUTPUT", "-o", "lo", "-j", "ACCEPT", "-m", "comment", "--comment", _MARKER),

            # -- established / related
            ("-A", "INPUT", "-m", "conntrack", "--ctstate", "ESTABLISHED,RELATED",
             "-j", "ACCEPT", "-m", "comment", "--comment", _MARKER),
            ("-A", "OUTPUT", "-m", "conntrack", "--ctstate", "ESTABLISHED,RELATED",
             "-j", "ACCEPT", "-m", "comment", "--comment", _MARKER),

            # -- LAN
            ("-A", "INPUT", "-s", lan_subnet, "-j", "ACCEPT", "-m", "comment", "--comment", _MARKER),
            ("-A", "OUTPUT", "-d", lan_subnet, "-j", "ACCEPT", "-m", "comment", "--comment", _MARKER),

            # -- WireGuard UDP (let the tunnel establish)
            ("-A", "OUTPUT", "-p", "udp", "--dport", str(wg_port),
             "-j", "ACCEPT", "-m", "comment", "--comment", _MARKER),

            # -- all traffic through wg interface
            ("-A", "INPUT", "-i", wg_interface, "-j", "ACCEPT", "-m", "comment", "--comment", _MARKER),
            ("-A", "OUTPUT", "-o", wg_interface, "-j", "ACCEPT", "-m", "comment", "--comment", _MARKER),

            # -- DNS only through VPN
            ("-A", "OUTPUT", "-o", wg_interface, "-p", "udp", "--dport", "53",
             "-j", "ACCEPT", "-m", "comment", "--comment", _MARKER),
            ("-A", "OUTPUT", "-o", wg_interface, "-p", "tcp", "--dport", "53",
             "-j", "ACCEPT", "-m", "comment", "--comment", _MARKER),

            # -- default DROP policies (applied last via -P)
        ]

        for rule_args in rules:
            await run_command("iptables", *rule_args, sudo=True)

        # Set policies
        await run_command("iptables", "-P", "INPUT", "DROP", sudo=True)
        await run_command("iptables", "-P", "FORWARD", "DROP", sudo=True)
        await run_command("iptables", "-P", "OUTPUT", "DROP", sudo=True)

        log.info("killswitch_enabled", lan=lan_subnet, interface=wg_interface)

    async def disable(self) -> None:
        """Flush all rules and reset default policies to ACCEPT."""
        await run_command("iptables", "-P", "INPUT", "ACCEPT", sudo=True, check=False)
        await run_command("iptables", "-P", "FORWARD", "ACCEPT", sudo=True, check=False)
        await run_command("iptables", "-P", "OUTPUT", "ACCEPT", sudo=True, check=False)
        await run_command("iptables", "-F", sudo=True, check=False)
        log.info("killswitch_disabled")

    async def is_enabled(self) -> bool:
        """Check whether our kill-switch rules are currently installed."""
        result = await run_command("iptables-save", sudo=True, check=False)
        return _MARKER in result.stdout
