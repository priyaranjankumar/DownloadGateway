"""FastAPI router for scheduled downloads."""

from __future__ import annotations

import json
from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.schedules import CreateScheduleRequest, ScheduledDownload
from app.database import execute_query, fetch_all, fetch_one
from app.dependencies import get_current_user

router = APIRouter(prefix="/schedules", tags=["schedules"])


@router.get("", response_model=list[ScheduledDownload])
async def list_scheduled(
    username: str = Depends(get_current_user),
) -> list[ScheduledDownload]:
    """List all scheduled downloads."""
    rows = await fetch_all(
        "SELECT * FROM scheduled_downloads ORDER BY schedule_at ASC"
    )
    return [ScheduledDownload(**row) for row in rows]


@router.post("", response_model=ScheduledDownload, status_code=status.HTTP_201_CREATED)
async def create_scheduled(
    req: CreateScheduleRequest,
    username: str = Depends(get_current_user),
) -> ScheduledDownload:
    """Schedule a download for a future time."""
    if not req.uris and not req.torrent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either uris or torrent data",
        )

    uris_json = json.dumps(req.uris or [])
    options_json = json.dumps(req.options or {})

    row_id = await execute_query(
        """
        INSERT INTO scheduled_downloads (uris, torrent_b64, options, schedule_at)
        VALUES (?, ?, ?, ?)
        """,
        (uris_json, req.torrent, options_json, req.schedule_at),
    )

    row = await fetch_one(
        "SELECT * FROM scheduled_downloads WHERE id = ?", (row_id,)
    )
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create schedule")
    return ScheduledDownload(**row)


@router.delete("/{schedule_id}")
async def cancel_scheduled(
    schedule_id: int,
    username: str = Depends(get_current_user),
) -> dict[str, str]:
    """Cancel a pending scheduled download."""
    row = await fetch_one(
        "SELECT * FROM scheduled_downloads WHERE id = ?", (schedule_id,)
    )
    if not row:
        raise HTTPException(status_code=404, detail="Schedule not found")
    if row["status"] != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel schedule in '{row['status']}' state",
        )

    await execute_query(
        "UPDATE scheduled_downloads SET status = 'cancelled' WHERE id = ?",
        (schedule_id,),
    )
    return {"status": "cancelled", "id": str(schedule_id)}
