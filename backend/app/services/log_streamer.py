"""Log streaming and tailing service."""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Callable, Coroutine, Any

import structlog

from app.utils.process import run_command

log = structlog.get_logger(__name__)

# Map logical source names to file paths or journalctl units.
_LOG_SOURCES: dict[str, dict[str, str]] = {
    "aria2": {"type": "file", "path": "/var/log/aria2/aria2.log"},
    "backend": {"type": "file", "path": ""},  # filled at runtime
    "wireguard": {"type": "journal", "unit": "wg-quick@wg0"},
    "system": {"type": "journal", "unit": ""},
}

TailCallback = Callable[[str, str], Coroutine[Any, Any, None]]


class LogStreamer:
    """Read and tail log files or journalctl output."""

    async def get_log_lines(
        self, source: str, num_lines: int = 100
    ) -> list[str]:
        """Return the last *num_lines* from *source*."""
        cfg = _LOG_SOURCES.get(source)
        if cfg is None:
            raise ValueError(f"Unknown log source: {source!r}")

        if cfg["type"] == "file":
            return await self._tail_file(cfg["path"], num_lines)

        # journal
        return await self._journal_lines(cfg.get("unit", ""), num_lines)

    async def tail_log(
        self,
        source: str,
        callback: TailCallback,
    ) -> asyncio.Task[None]:
        """Start an async task that streams new lines to *callback*.

        Returns the task handle so the caller can cancel it.
        """
        cfg = _LOG_SOURCES.get(source)
        if cfg is None:
            raise ValueError(f"Unknown log source: {source!r}")

        if cfg["type"] == "file":
            task = asyncio.create_task(
                self._follow_file(source, cfg["path"], callback)
            )
        else:
            task = asyncio.create_task(
                self._follow_journal(source, cfg.get("unit", ""), callback)
            )
        return task

    # -- file helpers --------------------------------------------------------

    @staticmethod
    async def _tail_file(path: str, num_lines: int) -> list[str]:
        """Read the last *num_lines* from a regular file."""
        try:
            p = Path(path)
            if not p.is_file():
                return [f"[Log file not found: {path}]"]
            text = p.read_text(errors="replace")
            lines = text.splitlines()
            return lines[-num_lines:]
        except Exception as exc:
            return [f"[Error reading log: {exc}]"]

    @staticmethod
    async def _follow_file(
        source: str, path: str, callback: TailCallback
    ) -> None:
        """Tail a file by polling for new content every second."""
        try:
            p = Path(path)
            if not p.is_file():
                await callback(source, f"[Log file not found: {path}]")
                return
            offset = p.stat().st_size
            while True:
                await asyncio.sleep(1)
                current_size = p.stat().st_size
                if current_size > offset:
                    with open(p, "r", errors="replace") as fh:
                        fh.seek(offset)
                        new_data = fh.read()
                    offset = current_size
                    for line in new_data.splitlines():
                        await callback(source, line)
                elif current_size < offset:
                    # file was truncated / rotated
                    offset = 0
        except asyncio.CancelledError:
            return
        except Exception:
            log.error("tail_file_error", source=source, exc_info=True)

    # -- journalctl helpers --------------------------------------------------

    @staticmethod
    async def _journal_lines(unit: str, num_lines: int) -> list[str]:
        """Read the last *num_lines* from journalctl."""
        args = ["--no-pager", "-n", str(num_lines), "--output", "short-iso"]
        if unit:
            args.extend(["-u", unit])
        try:
            result = await run_command("journalctl", *args, sudo=True, check=False)
            return result.stdout.splitlines()
        except Exception as exc:
            return [f"[Error reading journal: {exc}]"]

    @staticmethod
    async def _follow_journal(
        source: str, unit: str, callback: TailCallback
    ) -> None:
        """Follow journalctl output in real time."""
        args: list[str] = ["/usr/bin/journalctl", "--no-pager", "-f", "--output", "short-iso"]
        if unit:
            args.extend(["-u", unit])

        try:
            proc = await asyncio.create_subprocess_exec(
                *args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
            )
            assert proc.stdout is not None
            async for raw_line in proc.stdout:
                line = raw_line.decode(errors="replace").rstrip()
                await callback(source, line)
        except asyncio.CancelledError:
            proc.terminate()  # type: ignore[union-attr]
        except Exception:
            log.error("follow_journal_error", source=source, exc_info=True)
