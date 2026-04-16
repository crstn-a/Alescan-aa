from fastapi import APIRouter, UploadFile, File, HTTPException
from services.db import get_latest_price, log_scan_event, log_error

router = APIRouter()

CONFIDENCE_THRESHOLD = 0.60

# Placeholder until YOLO26 is wired in Phase 6
def _mock_inference(image_bytes: bytes) -> dict:
    return {
        "product_id": 1,
        "product_slug": "bangus_local",
        "display_name": "Bangus (Local)",
        "confidence": 0.91
    }

@router.post("/scan")
async def scan_commodity(image: UploadFile = File(...)):
    try:
        image_bytes = await image.read()

        # Phase 6: replace _mock_inference with run_inference(image_bytes)
        from services.vision import run_inference
        result = run_inference(image_bytes)
    except ImportError:
        result = _mock_inference(image_bytes)
    except Exception as e:
        log_error("vision", str(e))
        raise HTTPException(status_code=500, detail="Vision inference failed")

    if result["confidence"] < CONFIDENCE_THRESHOLD:
        log_scan_event(result, None)
        raise HTTPException(
            status_code=422,
            detail={
                "error": "low_confidence",
                "confidence": round(result["confidence"] * 100, 1),
                "message": "Please point the camera closer and retry"
            }
        )

    price = get_latest_price(result["product_slug"])
    if not price:
        raise HTTPException(
            status_code=404,
            detail="No SRP data available. Run a sync first."
        )

    log_scan_event(result, price)

    return {
        "product":      result["display_name"],
        "slug":         result["product_slug"],
        "confidence":   round(result["confidence"] * 100, 1),
        "official_srp": price["price_per_kg"],
        "week_of":      price["week_of"],
        "source":       price["source"],
    }