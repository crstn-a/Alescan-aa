# backend/routers/admin.py
from fastapi import APIRouter, Query, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from services.db import get_supabase, log_error
from services.sync import run_sync
from services.auth import authenticate_admin, create_access_token
from datetime import datetime, timedelta
import logging
from typing import Optional
import uuid
import os

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


# ── GET /admin/stats/scans ────────────────────────────────────────────
# Filtered scan stats for the overview calendar filter.
# mode: "all" | "daily" | "weekly" | "monthly"
# date: reference date string YYYY-MM-DD (defaults to today)
@router.get("/stats/scans")
def get_filtered_scan_stats(
    mode: str = Query("all"),
    date: str = Query(None),
):
    from datetime import datetime, timedelta
    try:
        sb = get_supabase()

        # Build date range based on mode
        ref = datetime.strptime(date, "%Y-%m-%d") if date else datetime.now()
        start_dt = None
        end_dt = None

        if mode == "daily":
            start_dt = ref.replace(hour=0, minute=0, second=0)
            end_dt = ref.replace(hour=23, minute=59, second=59)
        elif mode == "weekly":
            # Monday-based week
            weekday = ref.weekday()
            start_dt = (ref - timedelta(days=weekday)).replace(hour=0, minute=0, second=0)
            end_dt = (start_dt + timedelta(days=6)).replace(hour=23, minute=59, second=59)
        elif mode == "monthly":
            start_dt = ref.replace(day=1, hour=0, minute=0, second=0)
            # Last day of month
            if ref.month == 12:
                end_dt = ref.replace(year=ref.year + 1, month=1, day=1, hour=0, minute=0, second=0) - timedelta(seconds=1)
            else:
                end_dt = ref.replace(month=ref.month + 1, day=1, hour=0, minute=0, second=0) - timedelta(seconds=1)

        # Query scan count
        query = sb.table("scan_events").select("id", count="exact")
        if start_dt and end_dt:
            query = query.gte("scanned_at", start_dt.isoformat()).lte("scanned_at", end_dt.isoformat())
        count_result = query.execute()

        # Query recent scans for the list
        list_query = (
            sb.table("scan_events")
            .select("id, confidence, price_shown, scanned_at, products(display_name, slug)")
            .order("scanned_at", desc=True)
        )
        if start_dt and end_dt:
            list_query = list_query.gte("scanned_at", start_dt.isoformat()).lte("scanned_at", end_dt.isoformat())
        list_query = list_query.limit(50)
        list_result = list_query.execute()

        return {
            "count": count_result.count or 0,
            "scans": list_result.data or [],
            "range": {
                "start": start_dt.isoformat() if start_dt else None,
                "end": end_dt.isoformat() if end_dt else None,
            } if start_dt else None,
            "mode": mode,
        }
    except Exception as e:
        log_error("admin", f"get_filtered_scan_stats failed: {e}")
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





def _parse_iso(dt_str: str) -> datetime:
    if not dt_str:
        return datetime.now()
    s = dt_str.replace("Z", "+00:00")
    parts = s.split("+")
    base = parts[0]
    tz = parts[1] if len(parts) > 1 else ""
    if "." in base:
        dpart, frac = base.split(".", 1)
        frac = (frac + "000000")[:6]
        base = dpart + "." + frac
    return datetime.fromisoformat(base + ("+" + tz if tz else ""))


# ── GET /admin/prices ───────────────────────────────────────────────
@router.get("/prices")
def get_admin_prices(limit: int = Query(100, ge=1, le=500)):
    """Fetch price records for Admin dashboard with category, low, high, average, prevailing."""
    try:
        sb = get_supabase()
        res = (
            sb.table("price_records")
            .select("id, price_per_kg, source, week_of, created_at, products(id, name, display_name, slug)")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        formatted = []
        for r in (res.data or []):
            prod = r.get("products") or {}
            comm_name = prod.get("display_name") or prod.get("name") or "Commodity"
            price_val = float(r.get("price_prevailing") or r.get("price_per_kg") or 0.0)
            formatted.append({
                "id": r.get("id"),
                "commodity_name": r.get("commodity_name") or comm_name,
                "product": comm_name,
                "category": r.get("category", "General"),
                "specification": r.get("specification"),
                "unit": r.get("unit", "kg"),
                "price_prevailing": price_val,
                "price_low": float(r.get("price_low") if r.get("price_low") is not None else price_val),
                "price_high": float(r.get("price_high") if r.get("price_high") is not None else price_val),
                "price_average": float(r.get("price_average") if r.get("price_average") is not None else price_val),
                "price_per_kg": price_val,
                "source": r.get("source", "DA Bantay Presyo (Sheet Sync)"),
                "period_month": r.get("period_month"),
                "period_year": r.get("period_year"),
                "created_at": r.get("created_at"),
            })
        return formatted
    except Exception as e:
        log_error("admin", f"get_admin_prices failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /admin/logs/sync ──────────────────────────────────────────────
@router.get("/logs/sync")
def sync_logs(limit: int = Query(20, ge=1, le=100)):
    try:
        sb = get_supabase()
        logs_res = (
            sb
            .table("sync_logs")
            .select("id, extractor_used, status, pdf_url, synced_at, notes")
            .order("synced_at", desc=True)
            .limit(limit)
            .execute()
        )
        logs = logs_res.data or []

        for log in logs:
            if log.get("notes"):
                log["notes"] = log["notes"].replace("Upserted", "Inserted").replace("upserted", "inserted")

            if log.get("status") == "success" and log.get("synced_at"):
                try:
                    dt = _parse_iso(log["synced_at"])
                    t_start = (dt - timedelta(minutes=2)).isoformat()
                    t_end = (dt + timedelta(minutes=2)).isoformat()
                    recs = (
                        sb.table("price_records")
                        .select("id, price_per_kg, created_at, products(display_name, name)")
                        .gte("created_at", t_start)
                        .lte("created_at", t_end)
                        .order("created_at", desc=False)
                        .execute()
                    )
                    details = []
                    for r in (recs.data or []):
                        prod = r.get("products") or {}
                        prod_name = prod.get("display_name") or prod.get("name") or "Commodity"
                        prev_val = float(r.get("price_prevailing") or r.get("price_per_kg") or 0.0)
                        details.append({
                            "product": prod_name,
                            "category": r.get("category", "General"),
                            "price_to": prev_val,
                            "price_high": r.get("price_high"),
                        })
                    log["details"] = details
                except Exception as ex:
                    logger.warning(f"Could not compute sync details for log {log.get('id')}: {ex}")
                    log["details"] = []
            else:
                log["details"] = []

        return logs
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


# ── VIOLATIONS ENDPOINTS ──────────────────────────────────────────────

class ViolationRequest(BaseModel):
    name: str
    store_number: str
    complaint_description: str

@router.post("/violations")
async def create_violation(
    name: str = Form(...),
    store_number: str = Form(...),
    complaint_description: str = Form(...),
    image: Optional[UploadFile] = File(None)
):
    try:
        sb = get_supabase()
        
        # Handle image upload if provided
        image_url = None
        if image:
            # Generate unique filename
            file_extension = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
            unique_filename = f"violations/{uuid.uuid4()}.{file_extension}"
            
            # Read file content
            file_content = await image.read()
            
            # Upload to Supabase storage (raises on failure in supabase-py v2)
            sb.storage.from_("violation-images").upload(
                unique_filename,
                file_content,
                file_options={"content-type": image.content_type}
            )
            # get_public_url returns a plain string in supabase-py v2
            image_url = sb.storage.from_("violation-images").get_public_url(unique_filename)
        
        # Insert violation record with "submitted" status
        violation_data = {
            "name": name,
            "store_number": store_number,
            "complaint_description": complaint_description,
            "image_url": image_url,
            "status": "submitted",
            "created_at": "now()"
        }
        
        result = sb.table("violations").insert(violation_data).execute()
        
        logger.info(f"Violation created: {name} - Store {store_number}")
        return {"status": "success", "data": result.data[0]}
        
    except Exception as e:
        log_error("admin", f"create_violation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/violations")
def get_violations(limit: int = Query(50, ge=1, le=200)):
    try:
        data = (
            get_supabase()
            .table("violations")
            .select("id, name, store_number, complaint_description, image_url, created_at, status")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return data.data
    except Exception as e:
        log_error("admin", f"get_violations query failed: {e}")
        raise

@router.put("/violations/{violation_id}")
async def update_violation(
    violation_id: int,
    name: str = Form(...),
    store_number: str = Form(...),
    complaint_description: str = Form(...),
    status: str = Form(...),
    image: Optional[UploadFile] = File(None)
):
    try:
        sb = get_supabase()
        
        # Get existing violation to preserve image if no new one uploaded
        existing = (
            sb.table("violations")
            .select("image_url")
            .eq("id", violation_id)
            .single()
            .execute()
        )
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Violation not found")
        
        image_url = existing.data["image_url"]  # Keep existing image by default
        
        # Handle new image upload if provided
        if image:
            # Generate unique filename
            file_extension = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
            unique_filename = f"violations/{uuid.uuid4()}.{file_extension}"
            
            # Read file content
            file_content = await image.read()
            
            # Upload to Supabase storage (raises on failure in supabase-py v2)
            sb.storage.from_("violation-images").upload(
                unique_filename,
                file_content,
                file_options={"content-type": image.content_type}
            )
            # get_public_url returns a plain string in supabase-py v2
            image_url = sb.storage.from_("violation-images").get_public_url(unique_filename)
        
        # Update violation record
        violation_data = {
            "name": name,
            "store_number": store_number,
            "complaint_description": complaint_description,
            "image_url": image_url,
            "status": status
        }
        
        result = (
            sb.table("violations")
            .update(violation_data)
            .eq("id", violation_id)
            .execute()
        )
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Violation not found")
            
        logger.info(f"Violation {violation_id} updated: {name} - Store {store_number} - Status: {status}")
        return {"status": "success", "data": result.data[0]}
        
    except Exception as e:
        log_error("admin", f"update_violation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/violations/{violation_id}/status")
def update_violation_status(violation_id: int, status: str = Form(...)):
    try:
        sb = get_supabase()
        result = (
            sb.table("violations")
            .update({"status": status})
            .eq("id", violation_id)
            .execute()
        )
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Violation not found")
            
        logger.info(f"Violation {violation_id} status updated to: {status}")
        return {"status": "success", "data": result.data[0]}
        
    except Exception as e:
        log_error("admin", f"update_violation_status failed: {e}")
        raise

# ── ANALYTICS ENDPOINTS ────────────────────────────────────────────────
from services.analytics import get_analytics_prices, get_analytics_scans, get_analytics_evaluations, get_daily_volume

@router.get("/analytics/prices")
def analytics_prices():
    return get_analytics_prices()

@router.get("/analytics/scans")
def analytics_scans():
    return get_analytics_scans()

@router.get("/analytics/evaluations")
def analytics_evaluations():
    return get_analytics_evaluations()

@router.get("/analytics/daily-volume")
def analytics_daily_volume(
    start_date: str = Query(..., description="Start date YYYY-MM-DD"),
    end_date: str = Query(..., description="End date YYYY-MM-DD"),
):
    return get_daily_volume(start_date, end_date)
