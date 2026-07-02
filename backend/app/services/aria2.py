"""Full async aria2 JSON-RPC client and WebSocket event listener."""

from __future__ import annotations

import asyncio
import base64
import json
import uuid
from typing import Any, Callable, Coroutine

import aiohttp
import structlog

from app.config import settings

log = structlog.get_logger(__name__)


class Aria2Client:
    """Thin async wrapper around the aria2 JSON-RPC interface."""

    def __init__(
        self,
        rpc_url: str = settings.aria2_rpc_url,
        secret: str = settings.aria2_rpc_secret,
    ) -> None:
        self._rpc_url = rpc_url
        self._secret = secret
        self._session: aiohttp.ClientSession | None = None

    # -- lifecycle -----------------------------------------------------------

    async def open(self) -> None:
        """Create the underlying HTTP session."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()

    async def close(self) -> None:
        """Close the HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()

    # -- low-level RPC -------------------------------------------------------

    def _token_param(self) -> str | None:
        """Return the ``token:<secret>`` string or None."""
        return f"token:{self._secret}" if self._secret else None

    async def _call(self, method: str, params: list[Any] | None = None) -> Any:
        """Issue a JSON-RPC 2.0 request and return the ``result`` field."""
        await self.open()
        assert self._session is not None

        rpc_params: list[Any] = []
        token = self._token_param()
        if token is not None:
            rpc_params.append(token)
        if params:
            rpc_params.extend(params)

        payload = {
            "jsonrpc": "2.0",
            "id": uuid.uuid4().hex[:8],
            "method": method,
            "params": rpc_params,
        }

        async with self._session.post(self._rpc_url, json=payload) as resp:
            body = await resp.json(content_type=None)

        if "error" in body:
            err = body["error"]
            log.error("aria2_rpc_error", method=method, error=err)
            raise RuntimeError(f"aria2 RPC error: {err.get('message', err)}")

        return body.get("result")

    # -- helpers -------------------------------------------------------------

    @staticmethod
    def _int(value: Any, default: int = 0) -> int:
        """Coerce aria2's string-encoded numbers to int."""
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    def _parse_status(self, raw: dict[str, Any]) -> dict[str, Any]:
        """Normalise a ``tellStatus`` response into our schema fields."""
        files = raw.get("files") or []
        first_uri = ""
        if files:
            uris = files[0].get("uris") or []
            if uris:
                first_uri = uris[0].get("uri", "")

        bt = raw.get("bittorrent") or {}
        bt_info = bt.get("info") or {}
        name = bt_info.get("name") or (
            files[0].get("path", "").rsplit("/", 1)[-1] if files else None
        )

        return {
            "gid": raw["gid"],
            "status": raw.get("status", "unknown"),
            "name": name or None,
            "total_length": self._int(raw.get("totalLength")),
            "completed_length": self._int(raw.get("completedLength")),
            "download_speed": self._int(raw.get("downloadSpeed")),
            "upload_speed": self._int(raw.get("uploadSpeed")),
            "connections": self._int(raw.get("connections")),
            "num_seeders": self._int(raw.get("numSeeders")) if "numSeeders" in raw else None,
            "dir": raw.get("dir"),
            "error_code": raw.get("errorCode"),
            "error_message": raw.get("errorMessage"),
            "added_at": None,
            "completed_at": None,
            "info_hash": raw.get("infoHash"),
            "is_torrent": bool(bt),
        }

    # -- public methods ------------------------------------------------------

    async def add_uri(
        self, uris: list[str], options: dict[str, str] | None = None
    ) -> str:
        """Add a new download by URI(s).  Returns the GID."""
        params: list[Any] = [uris]
        if options:
            params.append(options)
        return await self._call("aria2.addUri", params)

    async def add_torrent(
        self, torrent_b64: str, options: dict[str, str] | None = None
    ) -> str:
        """Add a download from a base64-encoded .torrent file."""
        params: list[Any] = [torrent_b64]
        if options:
            params.append(options)
        return await self._call("aria2.addTorrent", params)

    async def remove(self, gid: str) -> str:
        return await self._call("aria2.remove", [gid])

    async def force_remove(self, gid: str) -> str:
        return await self._call("aria2.forceRemove", [gid])

    async def pause(self, gid: str) -> str:
        return await self._call("aria2.pause", [gid])

    async def unpause(self, gid: str) -> str:
        return await self._call("aria2.unpause", [gid])

    async def pause_all(self) -> str:
        return await self._call("aria2.pauseAll")

    async def unpause_all(self) -> str:
        return await self._call("aria2.unpauseAll")

    async def tell_status(self, gid: str) -> dict[str, Any]:
        raw = await self._call("aria2.tellStatus", [gid])
        return self._parse_status(raw)

    async def tell_active(self) -> list[dict[str, Any]]:
        raw_list = await self._call("aria2.tellActive") or []
        return [self._parse_status(r) for r in raw_list]

    async def tell_waiting(
        self, offset: int = 0, num: int = 100
    ) -> list[dict[str, Any]]:
        raw_list = await self._call("aria2.tellWaiting", [offset, num]) or []
        return [self._parse_status(r) for r in raw_list]

    async def tell_stopped(
        self, offset: int = -1, num: int = 100
    ) -> list[dict[str, Any]]:
        raw_list = await self._call("aria2.tellStopped", [offset, num]) or []
        return [self._parse_status(r) for r in raw_list]

    async def get_global_stat(self) -> dict[str, int]:
        raw = await self._call("aria2.getGlobalStat")
        return {
            "download_speed": self._int(raw.get("downloadSpeed")),
            "upload_speed": self._int(raw.get("uploadSpeed")),
            "num_active": self._int(raw.get("numActive")),
            "num_waiting": self._int(raw.get("numWaiting")),
            "num_stopped": self._int(raw.get("numStopped")),
        }

    async def change_position(self, gid: str, pos: int, how: str = "POS_SET") -> int:
        return self._int(await self._call("aria2.changePosition", [gid, pos, how]))

    async def get_global_option(self) -> dict[str, str]:
        return await self._call("aria2.getGlobalOption") or {}

    async def change_global_option(self, options: dict[str, str]) -> str:
        return await self._call("aria2.changeGlobalOption", [options])

    async def get_version(self) -> dict[str, Any]:
        return await self._call("aria2.getVersion")


# ---------------------------------------------------------------------------
# WebSocket event listener
# ---------------------------------------------------------------------------

EventCallback = Callable[[str, dict[str, Any]], Coroutine[Any, Any, None]]


class Aria2EventListener:
    """Connect to aria2's WebSocket notification channel and dispatch
    events to registered callbacks."""

    EVENT_NAMES = (
        "aria2.onDownloadStart",
        "aria2.onDownloadPause",
        "aria2.onDownloadStop",
        "aria2.onDownloadComplete",
        "aria2.onDownloadError",
        "aria2.onBtDownloadComplete",
    )

    def __init__(self, ws_url: str | None = None) -> None:
        self._ws_url = ws_url or settings.aria2_rpc_url.replace("http", "ws", 1)
        self._callbacks: list[EventCallback] = []
        self._task: asyncio.Task[None] | None = None

    def register(self, callback: EventCallback) -> None:
        """Register a coroutine to be called on every event."""
        self._callbacks.append(callback)

    async def _listen(self) -> None:
        """Long-running loop that reconnects on failure."""
        while True:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.ws_connect(self._ws_url) as ws:
                        log.info("aria2_ws_connected", url=self._ws_url)
                        async for msg in ws:
                            if msg.type == aiohttp.WSMsgType.TEXT:
                                await self._dispatch(msg.data)
                            elif msg.type in (
                                aiohttp.WSMsgType.CLOSED,
                                aiohttp.WSMsgType.ERROR,
                            ):
                                break
            except asyncio.CancelledError:
                log.info("aria2_ws_cancelled")
                return
            except Exception:
                log.warning("aria2_ws_error", exc_info=True)
            # back off before reconnect
            await asyncio.sleep(5)

    async def _dispatch(self, raw: str) -> None:
        """Parse one JSON-RPC notification and fan out to callbacks."""
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return
        method = data.get("method", "")
        params = data.get("params", [{}])
        event_data = params[0] if params else {}
        short_name = method.replace("aria2.", "")
        for cb in self._callbacks:
            try:
                await cb(short_name, event_data)
            except Exception:
                log.error("aria2_event_callback_error", event=short_name, exc_info=True)

    def start(self) -> None:
        """Start listening in the background."""
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._listen())

    async def stop(self) -> None:
        """Cancel the background listener."""
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
