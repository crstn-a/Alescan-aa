from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.vision import run_inference, CONFIDENCE_THRESHOLD
from services.db import get_latest_price, log_scan_event, log_error

router = APIRouter()


@router.post("/scan")
async def scan_commodity(
    image: UploadFile = File(...),
):
    """
    Accepts a photo upload from the camera.
    Runs server-side YOLOv26 custom-trained detection,
    fetches latest monitored market prices (Prevailing, Low, High),
    logs the scan event, and returns detection results to client.
    """
    # ── Step 1: Decode image ──────────────────────────────────────
    try:
        image_bytes = await image.read()
    except Exception as e:
        log_error("scan", f"Image read failed: {e}")
        raise HTTPException(status_code=400, detail="Could not read uploaded image")

    # ── Step 2: Run YOLOv26 inference ─────────────────────────────
    try:
        result = run_inference(image_bytes)
    except ValueError as e:
        log_error("vision", str(e))
        raise HTTPException(status_code=400, detail="Invalid image — please retake the photo")
    except Exception as e:
        log_error("vision", str(e))
        raise HTTPException(status_code=500, detail=f"Vision inference error: {e}")

    # ── Step 3: Confidence gate ───────────────────────────────────
    if not result["commodity_name"] or result["confidence"] < CONFIDENCE_THRESHOLD:
        log_scan_event(result, None)
        raise HTTPException(
            status_code=422,
            detail={
                "error":            "low_confidence",
                "confidence":       round(result["confidence"] * 100, 1),
                "confidence_level": result.get("confidence_level", "Low"),
                "message":          "Item not recognized. Position the camera closer and tap scan again.",
            }
        )

    # ── Step 4: Ensure price data available ───────────────────────
    if result["price_prevailing"] is None and result["price_low"] is None:
        price_db = get_latest_price(result["commodity_name"])
        if not price_db:
            raise HTTPException(
                status_code=404,
                detail=f"No price record found for '{result['commodity_name']}' — run a sheet sync from Admin."
            )
        result["price_prevailing"] = float(price_db.get("price_prevailing", 0.0))
        result["price_low"] = float(price_db.get("price_low", 0.0))
        result["price_high"] = float(price_db.get("price_high", 0.0))
        result["unit"] = price_db.get("unit", "kg")
        result["specification"] = price_db.get("specification")
        if price_db.get("product_id"):
            result["product_id"] = price_db.get("product_id")

    # ── Step 5: Log scan event ────────────────────────────────────
    log_scan_event(result, result)

    # ── Step 6: Return result payload ─────────────────────────────
    return {
        "product":          result["commodity_name"],
        "commodity_name":   result["commodity_name"],
        "category":         result.get("category", "General"),
        "specification":    result.get("specification"),
        "unit":             result.get("unit", "kg"),
        "confidence":       round(result["confidence"] * 100, 1),
        "confidence_level": result.get("confidence_level", "High"),
        "price_prevailing": result.get("price_prevailing"),
        "price_low":        result.get("price_low"),
        "price_high":       result.get("price_high"),
        "price_average":    result.get("price_average"),
        "period_month":     result.get("period_month"),
        "period_year":      result.get("period_year"),
        "source":           result.get("source", "DA Bantay Presyo (Sheet Sync)"),
    }