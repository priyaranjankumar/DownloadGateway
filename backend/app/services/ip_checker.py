"""On-demand IP lookup service with in-memory cache."""

from __future__ import annotations

import asyncio
from typing import Any, Callable, Coroutine

import aiohttp
import structlog

from app.schemas.vpn import IPInfo

log = structlog.get_logger(__name__)

IPChangeCallback = Callable[[IPInfo], Coroutine[Any, Any, None]]


class IPCheckerService:
    """On-demand IP lookup with in-memory cache. No polling."""

    def __init__(self) -> None:
        self._current: IPInfo | None = None
        self._callbacks: list[IPChangeCallback] = []
        self._session: aiohttp.ClientSession | None = None

    # -- public API ----------------------------------------------------------

    def register(self, callback: IPChangeCallback) -> None:
        """Register a coroutine to be called whenever the public IP changes."""
        self._callbacks.append(callback)

    def get_current_ip(self) -> IPInfo | None:
        """Return the cached IP info."""
        return self._current

    async def refresh(self) -> IPInfo | None:
        """Fetch fresh IP info, update cache, notify if changed."""
        ip_info = await self._fetch_ip()
        if ip_info:
            old_ip = self._current.ip if self._current else None
            self._current = ip_info
            if old_ip is not None and old_ip != ip_info.ip:
                log.warning("ip_changed", old=old_ip, new=ip_info.ip)
                await self._notify(ip_info)
        return ip_info

    async def close(self) -> None:
        """Close the shared HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()
            log.info("ip_checker_session_closed")

    # -- internals -----------------------------------------------------------

    async def _get_session(self) -> aiohttp.ClientSession:
        """Reuse a single session with DNS caching."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                connector=aiohttp.TCPConnector(ttl_dns_cache=300)
            )
        return self._session

    async def _fetch_ip(self) -> IPInfo | None:
        """Single HTTP call to ip-api.com (returns IP + geo in one response)."""
        try:
            session = await self._get_session()
            async with session.get(
                "http://ip-api.com/json/",
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                if resp.status != 200:
                    return None
                geo = await resp.json(content_type=None)
                return IPInfo(
                    ip=geo.get("query", ""),
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
