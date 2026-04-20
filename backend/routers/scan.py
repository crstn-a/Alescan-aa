from fastapi import APIRouter, UploadFile, File, HTTPException
from services.vision import run_inference
from services.db import get_latest_price, log_scan_event, log_error

router = APIRouter()

CONFIDENCE_THRESHOLD = 0.50   # must match vision.py

@router.post("/scan")
async def scan_commodity(image: UploadFile = File(...)):
    """
    Accepts a JPEG/PNG image upload from the PWA camera.
    Runs YOLO26 inference, fetches latest SRP, logs the scan,
    and returns the result to the consumer's screen.
    """
    # ── Step 1: Decode image ──────────────────────────────────────
    try:
        image_bytes = await image.read()
    except Exception as e:
        log_error("scan", f"Image read failed: {e}")
        raise HTTPException(status_code=400, detail="Could not read uploaded image")

    # ── Step 2: Run YOLO26 inference ──────────────────────────────
    try:
        result = run_inference(image_bytes)
    except ValueError as e:
        # Corrupt or unreadable image bytes
        log_error("vision", str(e))
        raise HTTPException(status_code=400, detail="Invalid image — please retake the photo")
    except Exception as e:
        log_error("vision", str(e))
        raise HTTPException(status_code=500, detail="Vision inference error")

    # ── Step 3: Confidence gate ───────────────────────────────────
    if result["confidence"] < CONFIDENCE_THRESHOLD:
        log_scan_event(result, None)   # still log low-confidence attempts
        raise HTTPException(
            status_code=422,
            detail={
                "error":      "low_confidence",
                "confidence": round(result["confidence"] * 100, 1),
                "message":    "Point the camera closer and try again",
            }
        )

    # ── Step 4: Fetch latest official SRP ────────────────────────
    price = get_latest_price(result["product_slug"])
    if not price:
        raise HTTPException(
            status_code=404,
            detail="No SRP data available yet — ask the admin to run a sync"
        )

    # ── Step 5: Log scan event ────────────────────────────────────
    log_scan_event(result, price)

    # ── Step 6: Return result to PWA ──────────────────────────────
    return {
        "product":      result["display_name"],
        "slug":         result["product_slug"],
        "confidence":   round(result["confidence"] * 100, 1),
        "official_srp": float(price["price_per_kg"]),
        "week_of":      str(price["week_of"]),
        "source":       price["source"],
    }