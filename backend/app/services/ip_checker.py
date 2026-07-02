"""Background IP-leak checker service."""

from __future__ import annotations

import asyncio
from typing import Any, Callable, Coroutine

import aiohttp
import structlog

from app.config import settings
from app.schemas.vpn import IPInfo

log = structlog.get_logger(__name__)

IPChangeCallback = Callable[[IPInfo], Coroutine[Any, Any, None]]


class IPCheckerService:
    """Periodically polls a public IP API and notifies on changes."""

    def __init__(self) -> None:
        self._interval = settings.ip_check_interval
        self._ip_url = settings.ip_check_url
        self._current: IPInfo | None = None
        self._callbacks: list[IPChangeCallback] = []
        self._task: asyncio.Task[None] | None = None

    # -- public API ----------------------------------------------------------

    def register(self, callback: IPChangeCallback) -> None:
        """Register a coroutine to be called whenever the public IP changes."""
        self._callbacks.append(callback)

    def get_current_ip(self) -> IPInfo | None:
        """Return the last observed IP info (may be *None* before first poll)."""
        return self._current

    def start(self) -> None:
        """Begin the background polling loop."""
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._poll_loop())
            log.info("ip_checker_started", interval=self._interval)

    async def stop(self) -> None:
        """Cancel the background task."""
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            log.info("ip_checker_stopped")

    # -- internals -----------------------------------------------------------

    async def _poll_loop(self) -> None:
        """Long-running loop — fetch the public IP, then sleep."""
        while True:
            try:
                ip_info = await self._fetch_ip()
                if ip_info:
                    old_ip = self._current.ip if self._current else None
                    self._current = ip_info
                    if old_ip is not None and old_ip != ip_info.ip:
                        log.warning(
                            "ip_changed", old=old_ip, new=ip_info.ip
                        )
                        await self._notify(ip_info)
            except asyncio.CancelledError:
                return
            except Exception:
                log.error("ip_check_failed", exc_info=True)

            try:
                await asyncio.sleep(self._interval)
            except asyncio.CancelledError:
                return

    async def _fetch_ip(self) -> IPInfo | None:
        """Hit the public IP API + geo lookup."""
        try:
            async with aiohttp.ClientSession() as session:
                # 1. Get the raw IP
                async with session.get(self._ip_url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status != 200:
                        return None
                    data = await resp.json(content_type=None)
                    ip = data.get("ip") or data.get("query") or str(data)

                # 2. Geo enrich
                geo: dict[str, Any] = {}
                try:
                    async with session.get(
                        f"http://ip-api.com/json/{ip}",
                        timeout=aiohttp.ClientTimeout(total=10),
                    ) as geo_resp:
                        if geo_resp.status == 200:
                            geo = await geo_resp.json(content_type=None)
                except Exception:
                    pass

                return IPInfo(
                    ip=ip,
                    country=geo.get("country"),
                    city=geo.get("city"),
                    asn=geo.get("as"),
                    provider=geo.get("isp"),
                )
        except Exception:
            log.debug("ip_fetch_error", exc_info=True)
            return None

    async def _notify(self, info: IPInfo) -> None:
        """Fan out to all registered callbacks."""
        for cb in self._callbacks:
            try:
                await cb(info)
            except Exception:
                log.error("ip_change_callback_error", exc_info=True)
