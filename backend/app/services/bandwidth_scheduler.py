"""Bandwidth scheduling service — applies speed limits based on time-of-day."""

from __future__ import annotations

import asyncio
from datetime import datetime

import structlog

from app.database import fetch_all
from app.services.aria2 import Aria2Client

log = structlog.get_logger(__name__)


class BandwidthScheduler:
    """Checks current time against configured bandwidth windows and applies limits."""

    def __init__(self, aria2: Aria2Client) -> None:
        self._aria2 = aria2
        self._task: asyncio.Task[None] | None = None
        self._last_applied: str | None = None  # Track which window is active

    def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._tick_loop())
            log.info("bandwidth_scheduler_started")

    async def stop(self) -> None:
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            log.info("bandwidth_scheduler_stopped")

    async def _tick_loop(self) -> None:
        while True:
            try:
                await self._apply_current_window()
            except asyncio.CancelledError:
                return
            except Exception:
                log.error("bandwidth_tick_failed", exc_info=True)
            try:
                await asyncio.sleep(300)  # Check every 5 minutes
            except asyncio.CancelledError:
                return

    async def _apply_current_window(self) -> None:
        """Read settings, determine active window, apply speed limits."""
        rows = await fetch_all("SELECT key, value FROM settings")
        settings = {r["key"]: r["value"] for r in rows}

        day_start = settings.get("bw_day_start", "08:00")
        day_end = settings.get("bw_day_end", "00:00")
        day_limit = int(settings.get("bw_day_limit", "0") or "0")
        night_limit = int(settings.get("bw_night_limit", "0") or "0")

        # If no limits configured, skip
        if day_limit == 0 and night_limit == 0:
            return

        now = datetime.now()
        current_time = now.strftime("%H:%M")

        # Determine if we're in the "day" window
        if day_end > day_start:
            is_day = day_start <= current_time < day_end
        else:
            # Overnight wrap (e.g., 08:00 -> 00:00)
            is_day = current_time >= day_start or current_time < day_end

        window_name = "day" if is_day else "night"
        limit = day_limit if is_day else night_limit

        # Only apply if window changed
        if window_name == self._last_applied:
            return

        limit_str = str(limit) if limit > 0 else "0"
        try:
            await self._aria2.change_global_option(
                {"max-overall-download-limit": limit_str}
            )
            self._last_applied = window_name
            log.info(
                "bandwidth_limit_applied",
                window=window_name,
                limit=limit_str,
            )
        except Exception:
            log.error("bandwidth_limit_apply_failed", exc_info=True)
