"""FastAPI router for managing application settings."""

from __future__ import annotations

import json
from typing import Any
from fastapi import APIRouter, Depends, status

from app.schemas.settings import AppSettings
from app.database import execute_query, fetch_all
from app.dependencies import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])

def _parse_val(val: str, field_type: Any) -> Any:
    """Parse string database value back to target Python type."""
    if val is None:
        return None
    if field_type == bool or field_type == bool | None:
        return val.lower() == "true"
    if field_type == int or field_type == int | None:
        try:
            return int(val)
        except ValueError:
            return None
    return val

@router.get("", response_model=AppSettings)
async def get_settings(username: str = Depends(get_current_user)) -> AppSettings:
    """Retrieve all current application settings."""
    rows = await fetch_all("SELECT key, value FROM settings")
    settings_dict = {row["key"]: row["value"] for row in rows}
    
    parsed_settings: dict[str, Any] = {}
    for field_name, field_info in AppSettings.model_fields.items():
        val = settings_dict.get(field_name)
        if val is not None:
            parsed_settings[field_name] = _parse_val(val, field_info.annotation)
            
    return AppSettings(**parsed_settings)

@router.put("", response_model=AppSettings)
async def update_settings(
    req: AppSettings,
    username: str = Depends(get_current_user),
) -> AppSettings:
    """Update application settings. Only updates fields that are provided."""
    # We update database for fields that are explicitly set (non-None or all)
    update_data = req.model_dump(exclude_unset=True)
    
    for key, val in update_data.items():
        if val is None:
            db_val = ""
        else:
            db_val = str(val)
        await execute_query(
            "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?",
            (key, db_val, db_val),
        )
        
    return await get_settings(username=username)
