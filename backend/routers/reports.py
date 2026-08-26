# backend/routers/reports.py
"""
Public-facing endpoints for user registration, login, and vendor report submission.
All /api/reports/* routes are public (no admin auth required).
Report submission and retrieval require a valid user JWT.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Header
from pydantic import BaseModel
from services.db import get_supabase, log_error
from services.user_auth import (
    register_user, authenticate_user,
    create_user_token, decode_user_token,
)
from typing import Optional
import logging
import uuid

router = APIRouter(prefix="/api/reports")
logger = logging.getLogger(__name__)


def _get_current_user(authorization: str = Header(None)) -> dict:
    """Extract and validate the user JWT from the Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    user = decode_user_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


# ── POST /api/reports/register ────────────────────────────────────────
class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    phone: str | None = None

@router.post("/register")
def user_register(body: RegisterRequest):
    try:
        user = register_user(
            first_name=body.first_name,
            last_name=body.last_name,
            email=body.email,
            password=body.password,
            phone=body.phone,
        )
        # Auto-login: return token immediately
        token = create_user_token(user["id"], user["email"])
        logger.info(f"User registered: {user['email']}")
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "email": user["email"],
            },
        }
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        log_error("reports", f"user_register failed: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")


# ── POST /api/reports/login ───────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def user_login(body: LoginRequest):
    user = authenticate_user(body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_user_token(user["id"], user["email"])
    logger.info(f"User login: {user['email']}")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "email": user["email"],
        },
    }


# ── POST /api/reports/submit ─────────────────────────────────────────
@router.post("/submit")
async def submit_report(
    vendor_name: str = Form(...),
    store_number: str = Form(...),
    commodity_name: str = Form(...),
    price_seen: float = Form(...),
    complaint_description: str = Form(...),
    image: Optional[UploadFile] = File(None),
    authorization: str = Header(None),
):
    user = _get_current_user(authorization)
    
    try:
        sb = get_supabase()
        
        # Handle image upload if provided
        image_url = None
        if image:
            file_extension = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
            unique_filename = f"reports/{uuid.uuid4()}.{file_extension}"
            file_content = await image.read()
            
            sb.storage.from_("violation-images").upload(
                unique_filename,
                file_content,
                file_options={"content-type": image.content_type}
            )
            image_url = sb.storage.from_("violation-images").get_public_url(unique_filename)
        
        # Insert report
        report_data = {
            "user_id": user["user_id"],
            "vendor_name": vendor_name,
            "store_number": store_number,
            "commodity_name": commodity_name,
            "price_seen": price_seen,
            "complaint_description": complaint_description,
            "image_url": image_url,
            "status": "pending",
        }
        
        result = sb.table("vendor_reports").insert(report_data).execute()
        
        if not result.data:
            raise RuntimeError("Failed to insert report")
        
        report = result.data[0]
        logger.info(f"Report submitted by user {user['user_id']}: vendor={vendor_name}, commodity={commodity_name}")
        
        return {
            "status": "success",
            "data": report,
            "ticket_number": f"RPT-{report['id']:05d}",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        log_error("reports", f"submit_report failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /api/reports/my-reports ───────────────────────────────────────
@router.get("/my-reports")
def my_reports(authorization: str = Header(None)):
    user = _get_current_user(authorization)
    
    try:
        sb = get_supabase()
        result = (
            sb.table("vendor_reports")
            .select("id, vendor_name, store_number, commodity_name, price_seen, complaint_description, image_url, status, officer_notes, created_at, updated_at")
            .eq("user_id", user["user_id"])
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
        
        reports = []
        for r in (result.data or []):
            r["ticket_number"] = f"RPT-{r['id']:05d}"
            reports.append(r)
        
        return reports
        
    except Exception as e:
        log_error("reports", f"my_reports failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
