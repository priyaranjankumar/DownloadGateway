"""Background download scheduler service."""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any, Callable, Coroutine

import structlog

from app.database import execute_query, fetch_all
from app.services.aria2 import Aria2Client

log = structlog.get_logger(__name__)

ScheduleCallback = Callable[[dict[str, Any]], Coroutine[Any, Any, None]]


class SchedulerService:
    """Background task that checks for due scheduled downloads every 30 seconds."""

    def __init__(self, aria2: Aria2Client) -> None:
        self._aria2 = aria2
        self._task: asyncio.Task[None] | None = None
        self._callbacks: list[ScheduleCallback] = []

    def register(self, callback: ScheduleCallback) -> None:
        self._callbacks.append(callback)

    def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._tick_loop())
            log.info("scheduler_started")

    async def stop(self) -> None:
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            log.info("scheduler_stopped")

    async def _tick_loop(self) -> None:
        while True:
            try:
                await self._process_due()
            except asyncio.CancelledError:
                return
            except Exception:
                log.error("scheduler_tick_failed", exc_info=True)
            try:
                await asyncio.sleep(30)
            except asyncio.CancelledError:
                return

    async def _process_due(self) -> None:
        now = datetime.now(timezone.utc).isoformat()
        rows = await fetch_all(
            "SELECT * FROM scheduled_downloads WHERE status = 'pending' AND schedule_at <= ?",
            (now,),
        )
        for row in rows:
            await self._dispatch(row, now)

    async def _dispatch(self, row: dict[str, Any], now: str) -> None:
        try:
            uris = json.loads(row["uris"]) if row["uris"] else []
            options = json.loads(row["options"]) if row["options"] else {}

            if row["torrent_b64"]:
                gid = await self._aria2.add_torrent(row["torrent_b64"], options)
            else:
                gid = await self._aria2.add_uri(uris, options)

            await execute_query(
                "UPDATE scheduled_downloads SET status = 'dispatched', dispatched_at = ? WHERE id = ?",
                (now, row["id"]),
            )
            log.info("scheduled_download_dispatched", id=row["id"], gid=gid)

            # Notify callbacks
            for cb in self._callbacks:
                try:
                    await cb({"id": row["id"], "gid": gid, "uris": uris})
                except Exception:
                    log.error("schedule_callback_error", exc_info=True)

        except Exception as e:
            await execute_query(
                "UPDATE scheduled_downloads SET status = 'failed', error_message = ? WHERE id = ?",
                (str(e), row["id"]),
            )
            log.error("scheduled_download_failed", id=row["id"], error=str(e))
