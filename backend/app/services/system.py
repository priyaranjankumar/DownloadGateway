"""System resource monitoring via psutil."""

from __future__ import annotations

import time

import psutil
import structlog

from app.config import settings
from app.schemas.system import SystemStats

log = structlog.get_logger(__name__)


class SystemService:
    """Collect CPU, RAM, disk, temperature, and network statistics."""

    def __init__(self) -> None:
        # Cache the previous network counter snapshot so we can derive speed.
        self._prev_net: psutil._common.snetio | None = None
        self._prev_net_time: float = 0.0

    def get_stats(self) -> SystemStats:
        """Return a point-in-time system snapshot."""
        # CPU
        cpu_percent = psutil.cpu_percent(interval=0.1)
        cpu_count = psutil.cpu_count(logical=True) or 1

        # RAM
        mem = psutil.virtual_memory()

        # Disk — use the mount point that contains the download directory
        try:
            disk = psutil.disk_usage(settings.download_dir)
        except FileNotFoundError:
            disk = psutil.disk_usage("/")

        # Temperature — best effort
        cpu_temp: float | None = None
        try:
            temps = psutil.sensors_temperatures()
            for entries in temps.values():
                if entries:
                    cpu_temp = entries[0].current
                    break
        except (AttributeError, RuntimeError):
            pass

        # Uptime
        uptime = int(time.time() - psutil.boot_time())

        # Load average
        load_avg = list(psutil.getloadavg())

        # Network I/O + speed
        net = psutil.net_io_counters()
        now = time.monotonic()
        speed_up = 0
        speed_down = 0
        if self._prev_net is not None:
            dt = now - self._prev_net_time
            if dt > 0:
                speed_up = int((net.bytes_sent - self._prev_net.bytes_sent) / dt)
                speed_down = int((net.bytes_recv - self._prev_net.bytes_recv) / dt)
        self._prev_net = net
        self._prev_net_time = now

        return SystemStats(
            cpu_percent=cpu_percent,
            cpu_count=cpu_count,
            ram_used=mem.used,
            ram_total=mem.total,
            ram_percent=mem.percent,
            disk_used=disk.used,
            disk_total=disk.total,
            disk_percent=disk.percent,
            cpu_temp=cpu_temp,
            uptime=uptime,
            load_avg=load_avg,
            net_sent=net.bytes_sent,
            net_recv=net.bytes_recv,
            net_speed_up=speed_up,
            net_speed_down=speed_down,
        )
