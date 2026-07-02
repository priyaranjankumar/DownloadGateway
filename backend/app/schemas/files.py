"""File-manager schemas."""

from __future__ import annotations

from pydantic import BaseModel


class FileEntry(BaseModel):
    """One entry in a directory listing."""

    name: str
    path: str
    is_dir: bool
    size: int | None = None
    modified: str | None = None
    children_count: int | None = None


class RenameRequest(BaseModel):
    """Rename a file or directory."""

    path: str
    new_name: str


class MoveFileRequest(BaseModel):
    """Move or copy a file/directory."""

    src: str
    dst: str


class CreateDirRequest(BaseModel):
    """Create a new directory inside the sandbox."""

    path: str
