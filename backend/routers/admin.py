from fastapi import APIRouter
from services.db import get_supabase
from services.sync import run_sync

router = APIRouter()

@router.post("/sync")
def manual_sync():
    """Trigger a price sync immediately from the admin dashboard."""
    result = run_sync()
    return {"status": "triggered", "result": result}


@router.get("/logs/scan")
def scan_logs(limit: int = 50):
    """Recent scan events for the admin dashboard table."""
    data = (
        get_supabase()
        .table("scan_events")
        .select("*, products(display_name)")
        .order("scanned_at", desc=True)
        .limit(limit)
        .execute()
    )
    return data.data


@router.get("/logs/sync")
def sync_logs(limit: int = 20):
    """PDF sync history — which extractor was used, success/failure."""
    data = (
        get_supabase()
        .table("sync_logs")
        .select("*")
        .order("synced_at", desc=True)
        .limit(limit)
        .execute()
    )
    return data.data


@router.get("/logs/errors")
def error_logs(limit: int = 20):
    """System errors across all modules."""
    data = (
        get_supabase()
        .table("error_logs")
        .select("*")
        .order("occurred_at", desc=True)
        .limit(limit)
        .execute()
    )
    return data.data