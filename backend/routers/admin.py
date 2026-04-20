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
# Public endpoint — no auth middleware applied (see middleware.py).
# Accepts username + password, verifies against admin_users table,
# returns a signed JWT on success.

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def admin_login(body: LoginRequest):
    user = authenticate_admin(body.username, body.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )
    token = create_access_token(user["username"])
    logger.info(f"Admin login successful: {user['username']}")
    return {
        "access_token": token,
        "token_type":   "bearer",
        "username":     user["username"],
    }


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