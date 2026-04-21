# backend/routers/admin.py
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from services.db import get_supabase, log_error
from services.sync import run_sync
from services.auth import authenticate_admin, create_access_token
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# ── POST /admin/login ─────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def admin_login(body: LoginRequest):
    user = authenticate_admin(body.username, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    token = create_access_token(user["username"])
    logger.info(f"Admin login successful: {user['username']}")
    return {
        "access_token": token,
        "token_type":   "bearer",
        "username":     user["username"],
    }


# ── GET /admin/stats ──────────────────────────────────────────────────
# Returns accurate total counts for the overview dashboard.
# Uses Supabase count="exact" so numbers reflect ALL rows,
# not just the last N fetched by the log endpoints.
@router.get("/stats")
def get_stats():
    try:
        sb = get_supabase()

        # Total scan events (all time, exact count)
        scans = (
            sb.table("scan_events")
            .select("id", count="exact")
            .execute()
        )

        # Total error log entries (all time, exact count)
        errors = (
            sb.table("error_logs")
            .select("id", count="exact")
            .execute()
        )

        # Total products defined in the system
        all_products = (
            sb.table("products")
            .select("id")
            .execute()
        )

        # Products that have at least one price_record (distinct product_ids)
        price_records = (
            sb.table("price_records")
            .select("product_id")
            .execute()
        )
        products_with_prices = len({
            r["product_id"] for r in (price_records.data or [])
        })

        # Most recent sync log entry
        last_sync = (
            sb.table("sync_logs")
            .select("id, extractor_used, status, synced_at, notes")
            .order("synced_at", desc=True)
            .limit(1)
            .execute()
        )

        return {
            "total_scans":    scans.count or 0,
            "total_products": len(all_products.data or []),
            "active_prices":  products_with_prices,
            "total_errors":   errors.count or 0,
            "last_sync":      last_sync.data[0] if last_sync.data else None,
        }
    except Exception as e:
        log_error("admin", f"get_stats failed: {e}")
        raise


# ── POST /admin/sync ──────────────────────────────────────────────────
@router.post("/sync")
def manual_sync():
    logger.info("Manual sync triggered from admin dashboard")
    try:
        result = run_sync()
        return {"status": "triggered", "result": result}
    except Exception as e:
        log_error("admin", f"Manual sync failed: {e}")
        return {"status": "error", "result": {"status": "failed", "error": str(e)}}


# ── GET /admin/logs/scan ──────────────────────────────────────────────
@router.get("/logs/scan")
def scan_logs(limit: int = Query(50, ge=1, le=200)):
    try:
        data = (
            get_supabase()
            .table("scan_events")
            .select("id, confidence, price_shown, scanned_at, session_id, products(display_name, slug)")
            .order("scanned_at", desc=True)
            .limit(limit)
            .execute()
        )
        return data.data
    except Exception as e:
        log_error("admin", f"scan_logs query failed: {e}")
        raise


# ── GET /admin/logs/sync ──────────────────────────────────────────────
@router.get("/logs/sync")
def sync_logs(limit: int = Query(20, ge=1, le=100)):
    try:
        data = (
            get_supabase()
            .table("sync_logs")
            .select("id, extractor_used, status, pdf_url, synced_at, notes")
            .order("synced_at", desc=True)
            .limit(limit)
            .execute()
        )
        return data.data
    except Exception as e:
        log_error("admin", f"sync_logs query failed: {e}")
        raise


# ── GET /admin/logs/errors ────────────────────────────────────────────
@router.get("/logs/errors")
def error_logs(
    limit:  int = Query(20,   ge=1, le=100),
    module: str = Query(None),
):
    try:
        query = (
            get_supabase()
            .table("error_logs")
            .select("id, module, message, occurred_at")
            .order("occurred_at", desc=True)
            .limit(limit)
        )
        if module:
            query = query.eq("module", module)
        return query.execute().data
    except Exception as e:
        log_error("admin", f"error_logs query failed: {e}")
        raise