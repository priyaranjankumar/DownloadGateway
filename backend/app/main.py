"""FastAPI main application entrypoint."""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import Any
import structlog

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db, execute_query
from app.utils.logging import setup_logging
from app.services.aria2 import Aria2Client, Aria2EventListener
from app.services.ip_checker import IPCheckerService
from app.schemas.vpn import IPInfo

# Setup loggers
setup_logging()
log = structlog.get_logger(__name__)

# Import routers
from app.routers import (
    auth,
    vpn,
    downloads,
    system,
    files,
    logs,
    settings as settings_router,
    websocket,
)

# WebSocket manager
from app.routers.websocket import manager

async def on_aria2_event(event_type: str, event_data: dict[str, Any]) -> None:
    """Callback triggered by aria2 WebSocket notifications."""
    gid = event_data.get("gid", "")
    log.info("aria2_event_received", event=event_type, gid=gid)
    
    # Translate and broadcast to clients
    ws_type = f"download:{event_type.replace('onDownload', '').lower()}"
    if event_type == "onBtDownloadComplete":
        ws_type = "download:bt_completed"
        
    await manager.broadcast(ws_type, {"gid": gid})
    
    # Enrich and save download to history if it has finished
    if event_type in ("onDownloadComplete", "onDownloadError", "onDownloadStop"):
        try:
            # Import on-demand to avoid circular reference / startup races
            from app.main import app_instance
            client: Aria2Client = app_instance.state.aria2
            status_data = await client.tell_status(gid)
            
            # Find download URIs
            uri_val = None
            if status_data.get("files"):
                uris = status_data["files"][0].get("uris")
                if uris:
                    uri_val = uris[0].get("uri")
            
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc).isoformat()
            
            await execute_query(
                """
                INSERT INTO download_history (gid, name, size, status, download_speed, completed_at, uri)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    gid,
                    status_data.get("name"),
                    status_data.get("total_length", 0),
                    status_data.get("status"),
                    status_data.get("download_speed", 0),
                    now,
                    uri_val,
                ),
            )
            log.info("download_saved_to_history", gid=gid, name=status_data.get("name"))
        except Exception as e:
            log.error("failed_to_save_download_history", gid=gid, error=str(e), exc_info=True)

async def on_ip_changed(ip_info: IPInfo) -> None:
    """Callback triggered when public IP changes."""
    log.warning("public_ip_changed_broadcast", ip=ip_info.ip, country=ip_info.country)
    await manager.broadcast("ip:changed", ip_info.model_dump())

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events manager for database and external connections."""
    log.info("application_startup_init")
    
    # 1. Initialize DB
    await init_db()
    
    # 2. Setup aria2 client & listener
    aria2 = Aria2Client(settings.aria2_rpc_url, settings.aria2_rpc_secret)
    await aria2.open()
    app.state.aria2 = aria2
    
    listener = Aria2EventListener()
    listener.register(on_aria2_event)
    listener.start()
    app.state.aria2_listener = listener
    
    # 3. Setup IP checking service
    ip_checker = IPCheckerService()
    ip_checker.register(on_ip_changed)
    ip_checker.start()
    app.state.ip_checker = ip_checker
    
    yield
    
    log.info("application_shutdown_cleanup")
    
    # Stop background services
    await ip_checker.stop()
    await listener.stop()
    await aria2.close()

def create_app() -> FastAPI:
    """FastAPI Application Factory."""
    app = FastAPI(
        title="Download Gateway API",
        version="1.0.0",
        lifespan=lifespan,
    )
    
    # CORS setup
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Restrict in production if needed
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Mount API routers under /api
    app.include_router(auth.router, prefix="/api")
    app.include_router(vpn.router, prefix="/api")
    app.include_router(downloads.router, prefix="/api")
    app.include_router(system.router, prefix="/api")
    app.include_router(files.router, prefix="/api")
    app.include_router(logs.router, prefix="/api")
    app.include_router(settings_router.router, prefix="/api")
    
    # Mount WebSocket router
    app.include_router(websocket.router)
    
    return app

app_instance = create_app()
# Assign to module-level variable to import as 'app'
app = app_instance
