"""System / hardware monitoring schemas."""

from __future__ import annotations

from pydantic import BaseModel


class SystemStats(BaseModel):
    """Snapshot of system resource usage."""

    cpu_percent: float
    cpu_count: int
    ram_used: int
    ram_total: int
    ram_percent: float
    disk_used: int
    disk_total: int
    disk_percent: float
    cpu_temp: float | None = None
    uptime: int
    load_avg: list[float]
    net_sent: int
    net_recv: int
    net_speed_up: int
    net_speed_down: int
