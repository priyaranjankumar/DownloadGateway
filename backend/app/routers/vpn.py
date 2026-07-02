"""FastAPI router for VPN (WireGuard) and Kill Switch management."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.schemas.vpn import (
    VPNStatus,
    VPNConnectRequest,
    ServerInfo,
    IPInfo,
    KillSwitchStatus,
)
from app.services.vpn import VPNService
from app.services.killswitch import KillSwitchService
from app.services.ip_checker import IPCheckerService
from app.dependencies import get_current_user
from app.config import settings

router = APIRouter(prefix="/vpn", tags=["vpn"])

# Instantiate services
vpn_service = VPNService()
killswitch_service = KillSwitchService()

def get_ip_checker(request: Request) -> IPCheckerService:
    """Get the IP checker service from app state."""
    checker = getattr(request.app.state, "ip_checker", None)
    if checker is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="IP Checker service not initialized",
        )
    return checker

@router.get("", response_model=VPNStatus)
async def get_vpn_status(
    request: Request,
    username: str = Depends(get_current_user),
    checker: IPCheckerService = Depends(get_ip_checker),
) -> VPNStatus:
    """Get comprehensive VPN status, including exit IP if connected."""
    status_obj = await vpn_service.get_status()
    ip_info = checker.get_current_ip()
    if status_obj.connected and ip_info:
        status_obj.public_ip = ip_info.ip
        status_obj.country = ip_info.country or status_obj.country
        status_obj.city = ip_info.city or status_obj.city
    return status_obj

@router.post("/connect", response_model=VPNStatus)
async def connect_vpn(
    req: VPNConnectRequest,
    request: Request,
    username: str = Depends(get_current_user),
    checker: IPCheckerService = Depends(get_ip_checker),
) -> VPNStatus:
    """Connect to a specific VPN server."""
    try:
        status_obj = await vpn_service.connect(req.server_id)
        # Trigger an immediate check of IP
        await checker._fetch_ip()
        return await get_vpn_status(request, username=username, checker=checker)
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/disconnect", response_model=VPNStatus)
async def disconnect_vpn(
    request: Request,
    username: str = Depends(get_current_user),
    checker: IPCheckerService = Depends(get_ip_checker),
) -> VPNStatus:
    """Disconnect from the VPN."""
    try:
        status_obj = await vpn_service.disconnect()
        # Trigger an immediate check of IP
        await checker._fetch_ip()
        return await get_vpn_status(request, username=username, checker=checker)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/reconnect", response_model=VPNStatus)
async def reconnect_vpn(
    request: Request,
    server_id: str | None = None,
    username: str = Depends(get_current_user),
    checker: IPCheckerService = Depends(get_ip_checker),
) -> VPNStatus:
    """Cycle the VPN connection or switch to a new server."""
    try:
        status_obj = await vpn_service.reconnect(server_id)
        await checker._fetch_ip()
        return await get_vpn_status(request, username=username, checker=checker)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/servers", response_model=list[ServerInfo])
async def list_vpn_servers(username: str = Depends(get_current_user)) -> list[ServerInfo]:
    """Retrieve available WireGuard configurations."""
    return await vpn_service.list_servers()

@router.get("/ip", response_model=IPInfo)
async def get_public_ip(
    username: str = Depends(get_current_user),
    checker: IPCheckerService = Depends(get_ip_checker),
) -> IPInfo:
    """Get the current public IP with geolocation detail."""
    ip_info = checker.get_current_ip()
    if not ip_info:
        # Fallback fetch
        info = await checker._fetch_ip()
        if not info:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to fetch public IP",
            )
        return info
    return ip_info

@router.get("/killswitch", response_model=KillSwitchStatus)
async def get_killswitch_status(username: str = Depends(get_current_user)) -> KillSwitchStatus:
    """Check if the kill switch is currently enabled."""
    enabled = await killswitch_service.is_enabled()
    return KillSwitchStatus(enabled=enabled)

@router.post("/killswitch/enable", response_model=KillSwitchStatus)
async def enable_killswitch(username: str = Depends(get_current_user)) -> KillSwitchStatus:
    """Enable the iptables kill switch rules."""
    try:
        # Resolve config parameters
        lan_subnet = settings.lan_subnet
        wg_interface = settings.wireguard_interface
        # Default port is 51820
        await killswitch_service.enable(lan_subnet=lan_subnet, wg_interface=wg_interface)
        return KillSwitchStatus(enabled=True)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/killswitch/disable", response_model=KillSwitchStatus)
async def disable_killswitch(username: str = Depends(get_current_user)) -> KillSwitchStatus:
    """Disable the iptables kill switch rules."""
    try:
        await killswitch_service.disable()
        return KillSwitchStatus(enabled=False)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
