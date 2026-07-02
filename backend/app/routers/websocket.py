"""FastAPI WebSocket router for real-time state broadcasts."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any
import structlog

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.services.auth import AuthService

log = structlog.get_logger(__name__)
router = APIRouter(tags=["websocket"])

class ConnectionManager:
    """Manages active WebSocket connections for real-time updates."""

    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Accept connection and register client."""
        await websocket.accept()
        self.active_connections.append(websocket)
        log.debug("ws_client_connected", count=len(self.active_connections))

    def disconnect(self, websocket: WebSocket) -> None:
        """Unregister client."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            log.debug("ws_client_disconnected", count=len(self.active_connections))

    async def broadcast(self, event_type: str, data: Any) -> None:
        """Send a JSON payload to all connected clients."""
        payload = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        
        # Make a copy of connections to iterate safely
        targets = list(self.active_connections)
        if not targets:
            return
            
        disconnected = []
        for ws in targets:
            try:
                await ws.send_json(payload)
            except Exception:
                disconnected.append(ws)
                
        # Clean up failed connections
        for ws in disconnected:
            self.disconnect(ws)

# Global manager instance
manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
):
    """Secure WebSocket endpoint. Authenticates token before accepting."""
    # 1. Authenticate before accepting the connection
    try:
        payload = AuthService.decode_token(token)
        username = payload.get("sub")
        if not username:
            await websocket.close(code=4001, reason="Unauthorized: Missing subject")
            return
    except Exception as e:
        log.warn("ws_auth_failed", error=str(e))
        await websocket.close(code=4001, reason="Unauthorized: Invalid token")
        return

    # 2. Accept and manage connection
    await manager.connect(websocket)
    try:
        # Keep connection open and respond to client heartbeats
        while True:
            # We expect JSON messages, or we just block/ping
            data = await websocket.receive_json()
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        log.error("ws_error", error=str(e), exc_info=True)
    finally:
        manager.disconnect(websocket)
