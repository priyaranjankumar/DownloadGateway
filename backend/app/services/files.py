"""Sandboxed file-manager service."""

from __future__ import annotations

import os
import shutil
from datetime import datetime, timezone
from pathlib import Path

import structlog

from app.config import settings
from app.schemas.files import FileEntry

log = structlog.get_logger(__name__)


class FileService:
    """CRUD operations on files and directories, sandboxed under
    ``settings.download_dir``."""

    def __init__(self) -> None:
        self._root = Path(settings.download_dir).resolve()

    # -- public API ----------------------------------------------------------

    def list_dir(self, rel_path: str = "") -> list[FileEntry]:
        """Return the contents of *rel_path* under the sandbox root."""
        target = self._resolve_path(rel_path)
        if not target.is_dir():
            raise FileNotFoundError(f"Not a directory: {rel_path}")

        entries: list[FileEntry] = []
        for child in sorted(target.iterdir()):
            try:
                stat = child.stat()
                modified = datetime.fromtimestamp(
                    stat.st_mtime, tz=timezone.utc
                ).isoformat()
            except OSError:
                modified = None
                stat = None

            is_dir = child.is_dir()
            entries.append(
                FileEntry(
                    name=child.name,
                    path=str(child.relative_to(self._root)),
                    is_dir=is_dir,
                    size=stat.st_size if stat and not is_dir else None,
                    modified=modified,
                    children_count=(
                        sum(1 for _ in child.iterdir()) if is_dir else None
                    ),
                )
            )
        return entries

    def rename(self, rel_path: str, new_name: str) -> FileEntry:
        """Rename a file or directory (same parent)."""
        source = self._resolve_path(rel_path)
        if not source.exists():
            raise FileNotFoundError(rel_path)

        # new_name must be a bare name, not a path
        safe_name = Path(new_name).name
        destination = source.parent / safe_name
        self._assert_inside_sandbox(destination)
        source.rename(destination)
        log.info("file_renamed", src=rel_path, dst=safe_name)
        return self._file_entry(destination)

    def delete(self, rel_path: str) -> None:
        """Delete a file or directory (recursively)."""
        target = self._resolve_path(rel_path)
        if not target.exists():
            raise FileNotFoundError(rel_path)
        if target == self._root:
            raise PermissionError("Cannot delete the download root")

        if target.is_dir():
            shutil.rmtree(target)
        else:
            target.unlink()
        log.info("file_deleted", path=rel_path)

    def move(self, src: str, dst: str) -> FileEntry:
        """Move *src* to *dst* (both relative to sandbox)."""
        source = self._resolve_path(src)
        destination = self._resolve_path(dst)
        if not source.exists():
            raise FileNotFoundError(src)

        # If destination is an existing directory, move *into* it
        if destination.is_dir():
            destination = destination / source.name

        self._assert_inside_sandbox(destination)
        shutil.move(str(source), str(destination))
        log.info("file_moved", src=src, dst=str(destination.relative_to(self._root)))
        return self._file_entry(destination)

    def create_dir(self, rel_path: str) -> FileEntry:
        """Create a directory (including parents)."""
        target = self._resolve_path(rel_path)
        target.mkdir(parents=True, exist_ok=True)
        log.info("dir_created", path=rel_path)
        return self._file_entry(target)

    # -- helpers -------------------------------------------------------------

    def _resolve_path(self, rel_path: str) -> Path:
        """Resolve *rel_path* to an absolute path that is within the sandbox.

        Raises ``PermissionError`` on traversal attempts.
        """
        if not rel_path or rel_path in (".", "/"):
            return self._root

        # Join onto root and resolve symlinks / ".." components
        resolved = (self._root / rel_path).resolve()
        self._assert_inside_sandbox(resolved)
        return resolved

    def _assert_inside_sandbox(self, path: Path) -> None:
        """Raise if *path* escapes the download root."""
        try:
            path.relative_to(self._root)
        except ValueError:
            raise PermissionError(
                f"Path {path} is outside the sandbox {self._root}"
            )

    def _file_entry(self, path: Path) -> FileEntry:
        """Build a ``FileEntry`` for an existing path."""
        stat = path.stat()
        is_dir = path.is_dir()
        return FileEntry(
            name=path.name,
            path=str(path.relative_to(self._root)),
            is_dir=is_dir,
            size=stat.st_size if not is_dir else None,
            modified=datetime.fromtimestamp(
                stat.st_mtime, tz=timezone.utc
            ).isoformat(),
            children_count=(
                sum(1 for _ in path.iterdir()) if is_dir else None
            ),
        )
