"""FastAPI router for system health and resource metrics."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.schemas.system import SystemStats
from app.services.system import SystemService
from app.dependencies import get_current_user

router = APIRouter(tags=["system"])

# Instantiate the service
system_service = SystemService()

@router.get("/system", response_model=SystemStats)
def get_system_stats(username: str = Depends(get_current_user)) -> SystemStats:
    """Retrieve current system resource metrics (CPU, RAM, disk, network)."""
    return system_service.get_stats()

@router.get("/health")
def get_health() -> dict[str, str]:
    """Health check endpoint. Publicly accessible."""
    return {"status": "healthy"}
