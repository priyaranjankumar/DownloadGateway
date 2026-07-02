"""FastAPI router for retrieving historical logs."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.services.log_streamer import LogStreamer
from app.dependencies import get_current_user

router = APIRouter(prefix="/logs", tags=["logs"])

# Instantiate the service
log_streamer = LogStreamer()

@router.get("/{source}", response_model=list[str])
async def get_logs(
    source: str,
    lines: int = Query(100, ge=1, le=1000, description="Number of lines to retrieve"),
    username: str = Depends(get_current_user),
) -> list[str]:
    """Retrieve the last N lines of logs from a specific log source.
    
    Allowed sources: aria2, backend, wireguard, system
    """
    try:
        return await log_streamer.get_log_lines(source, lines)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve logs: {e}",
        )
