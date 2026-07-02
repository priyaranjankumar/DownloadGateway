"""FastAPI main application entrypoint."""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import Any
import structlog

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.database import init_db, execute_query, fetch_all
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
    
    # 4. Check auto-connect settings on startup
    try:
        rows = await fetch_all("SELECT key, value FROM settings")
        settings_dict = {row["key"]: row["value"] for row in rows} if rows else {}
        
        # Parse settings
        vpn_auto = settings_dict.get("vpn_auto_connect", "false").lower() == "true"
        vpn_server = settings_dict.get("vpn_auto_connect_server", "")
        ks_auto = settings_dict.get("killswitch_auto_enable", "false").lower() == "true"
        
        if vpn_auto and vpn_server:
            log.info("startup_vpn_auto_connect_trigger", server_id=vpn_server)
            from app.services.vpn import VPNService
            vpn_svc = VPNService()
            await vpn_svc.connect(vpn_server)
            
        if ks_auto:
            log.info("startup_killswitch_auto_enable_trigger")
            from app.services.killswitch import KillSwitchService
            ks_svc = KillSwitchService()
            # Detect LAN subnet dynamically
            import subprocess
            try:
                lan_sub = "192.168.1.0/24"
                out = subprocess.check_output("ip route | grep default | awk '{print $5}' | head -n1", shell=True).decode().strip()
                if out:
                    sub_out = subprocess.check_output(f"ip route | grep {out} | grep -v default | grep link | awk '{{print $1}}' | head -n1", shell=True).decode().strip()
                    if sub_out:
                        lan_sub = sub_out
                await ks_svc.enable(lan_sub, settings.wireguard_interface)
            except Exception as e:
                await ks_svc.enable(settings.lan_subnet, settings.wireguard_interface)
    except Exception as e:
        log.error("startup_auto_tasks_failed", error=str(e))
        
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
    
    @app.middleware("http")
    async def log_request_headers(request, call_next):
        if request.url.path.startswith("/api"):
            auth_header = request.headers.get("authorization")
            presence = "PRESENT" if auth_header else "MISSING"
            preview = auth_header[:25] + "..." if auth_header else ""
            log.info("incoming_api_request", path=request.url.path, auth_header_presence=presence, auth_header_preview=preview)
        return await call_next(request)

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
    
    # Serve index.html for SPA routing on any unmatched paths (excluding /api paths)
    frontend_path = "/opt/download-gateway/frontend"
    if os.path.exists(frontend_path):
        # Mount assets folder first
        assets_path = os.path.join(frontend_path, "assets")
        if os.path.exists(assets_path):
            app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
            
        @app.get("/{catchall:path}")
        async def serve_spa(catchall: str):
            if catchall.startswith("api"):
                raise HTTPException(status_code=404, detail="API route not found")
            
            # Check if file exists in frontend folder (e.g. favicon.ico, etc.)
            file_path = os.path.join(frontend_path, catchall)
            if catchall and os.path.isfile(file_path):
                return FileResponse(file_path)
                
            return FileResponse(os.path.join(frontend_path, "index.html"))
            
    return app

app_instance = create_app()
# Assign to module-level variable to import as 'app'
app = app_instance
