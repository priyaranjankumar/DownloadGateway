"""FastAPI router for sandboxed file operations."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.schemas.files import (
    FileEntry,
    RenameRequest,
    MoveFileRequest,
    CreateDirRequest,
)
from app.services.files import FileService
from app.dependencies import get_current_user

router = APIRouter(prefix="/files", tags=["files"])

# Instantiate the service
file_service = FileService()

@router.get("", response_model=list[FileEntry])
def list_directory(
    path: str = Query("", description="Relative path under sandbox root"),
    username: str = Depends(get_current_user),
) -> list[FileEntry]:
    """List directory contents under the sandboxed download folder."""
    try:
        return file_service.list_dir(path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.post("/rename", response_model=FileEntry)
def rename_file(
    req: RenameRequest,
    username: str = Depends(get_current_user),
) -> FileEntry:
    """Rename a file or folder inside the sandbox."""
    try:
        return file_service.rename(req.path, req.new_name)
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.post("/move", response_model=FileEntry)
def move_file(
    req: MoveFileRequest,
    username: str = Depends(get_current_user),
) -> FileEntry:
    """Move or copy a file/directory inside the sandbox."""
    try:
        return file_service.move(req.src, req.dst)
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.post("/mkdir", response_model=FileEntry)
def create_directory(
    req: CreateDirRequest,
    username: str = Depends(get_current_user),
) -> FileEntry:
    """Create a new folder path under the download sandbox root."""
    try:
        return file_service.create_dir(req.path)
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.delete("")
def delete_file(
    path: str = Query(..., description="Relative path of file/directory to delete"),
    username: str = Depends(get_current_user),
):
    """Recursively delete a file or directory inside the sandbox."""
    try:
        file_service.delete(path)
        return {"detail": "File deleted successfully"}
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
