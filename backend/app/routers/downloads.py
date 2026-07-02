"""FastAPI router for managing aria2 downloads."""

from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.downloads import (
    DownloadInfo,
    AddDownloadRequest,
    GlobalStats,
    MoveRequest,
    DownloadHistoryItem,
)
from app.services.aria2 import Aria2Client
from app.dependencies import get_current_user, get_aria2_client
from app.database import fetch_all

router = APIRouter(prefix="/downloads", tags=["downloads"])

@router.get("", response_model=list[DownloadInfo])
async def list_downloads(
    client: Aria2Client = Depends(get_aria2_client),
    username: str = Depends(get_current_user),
) -> list[DownloadInfo]:
    """List all downloads (active, waiting, and stopped)."""
    try:
        active = await client.tell_active()
        waiting = await client.tell_waiting(0, 1000)
        stopped = await client.tell_stopped(0, 1000)
        
        # Combine all items
        downloads = []
        for d in active:
            downloads.append(DownloadInfo(**d))
        for d in waiting:
            downloads.append(DownloadInfo(**d))
        for d in stopped:
            downloads.append(DownloadInfo(**d))
            
        return downloads
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query aria2: {e}",
        )

@router.get("/active", response_model=list[DownloadInfo])
async def list_active_downloads(
    client: Aria2Client = Depends(get_aria2_client),
    username: str = Depends(get_current_user),
) -> list[DownloadInfo]:
    """List active downloads only."""
    try:
        active = await client.tell_active()
        return [DownloadInfo(**d) for d in active]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query aria2: {e}",
        )

@router.get("/stats", response_model=GlobalStats)
async def get_global_stats(
    client: Aria2Client = Depends(get_aria2_client),
    username: str = Depends(get_current_user),
) -> GlobalStats:
    """Get aggregate download speeds and counts."""
    try:
        stats = await client.get_global_stat()
        return GlobalStats(**stats)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get global stats: {e}",
        )

@router.get("/history", response_model=list[DownloadHistoryItem])
async def get_download_history(
    username: str = Depends(get_current_user),
) -> list[DownloadHistoryItem]:
    """Retrieve completed/failed download history records from database."""
    rows = await fetch_all(
        "SELECT id, gid, name, size, status, download_speed, completed_at, uri FROM download_history ORDER BY id DESC"
    )
    return [DownloadHistoryItem(**row) for row in rows]

@router.get("/{gid}", response_model=DownloadInfo)
async def get_download_status(
    gid: str,
    client: Aria2Client = Depends(get_aria2_client),
    username: str = Depends(get_current_user),
) -> DownloadInfo:
    """Retrieve details for a specific download."""
    try:
        d = await client.tell_status(gid)
        return DownloadInfo(**d)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Download {gid} not found in aria2: {e}",
        )

@router.post("", response_model=dict[str, str], status_code=status.HTTP_201_CREATED)
async def add_download(
    req: AddDownloadRequest,
    client: Aria2Client = Depends(get_aria2_client),
    username: str = Depends(get_current_user),
) -> dict[str, str]:
    """Add a new download from URIs, magnet, or base64 torrent upload."""
    try:
        opts = req.options or {}
        if req.torrent:
            gid = await client.add_torrent(req.torrent, opts)
            return {"gid": gid}
        elif req.uris:
            gid = await client.add_uri(req.uris, opts)
            return {"gid": gid}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Must provide either uris or torrent data",
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add download: {e}",
        )

@router.post("/{gid}/pause")
async def pause_download(
    gid: str,
    client: Aria2Client = Depends(get_aria2_client),
    username: str = Depends(get_current_user),
):
    """Pause a running download."""
    try:
        await client.pause(gid)
        return {"status": "paused", "gid": gid}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to pause download: {e}",
        )

@router.post("/{gid}/resume")
async def resume_download(
    gid: str,
    client: Aria2Client = Depends(get_aria2_client),
    username: str = Depends(get_current_user),
):
    """Resume a paused download."""
    try:
        await client.unpause(gid)
        return {"status": "active", "gid": gid}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to resume download: {e}",
        )

@router.delete("/{gid}")
async def remove_download(
    gid: str,
    client: Aria2Client = Depends(get_aria2_client),
    username: str = Depends(get_current_user),
):
    """Remove a download. Stops active downloads first."""
    try:
        # Check status first to decide which remove to call
        d = await client.tell_status(gid)
        if d["status"] in ("active", "waiting", "paused"):
            await client.remove(gid)
        else:
            await client.force_remove(gid)
        return {"status": "removed", "gid": gid}
    except Exception:
        # Fallback to force remove
        try:
            await client.force_remove(gid)
            return {"status": "removed", "gid": gid}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to remove download: {e}",
            )

@router.post("/{gid}/move")
async def move_download_position(
    gid: str,
    req: MoveRequest,
    client: Aria2Client = Depends(get_aria2_client),
    username: str = Depends(get_current_user),
):
    """Reposition download queue priority index."""
    if gid != req.gid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GID mismatch",
        )
    try:
        new_pos = await client.change_position(gid, req.position, req.how)
        return {"gid": gid, "position": new_pos}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to change download position: {e}",
        )

@router.post("/pause-all")
async def pause_all_downloads(
    client: Aria2Client = Depends(get_aria2_client),
    username: str = Depends(get_current_user),
):
    """Pause all active downloads."""
    try:
        await client.pause_all()
        return {"detail": "All downloads paused"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to pause all: {e}",
        )

@router.post("/resume-all")
async def resume_all_downloads(
    client: Aria2Client = Depends(get_aria2_client),
    username: str = Depends(get_current_user),
):
    """Resume all paused downloads."""
    try:
        await client.unpause_all()
        return {"detail": "All downloads resumed"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resume all: {e}",
        )
