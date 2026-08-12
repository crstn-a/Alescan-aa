import io
import re
import logging
from pathlib import Path
from PIL import Image
from ultralytics import YOLO

from services.db import get_all_active_commodities, get_latest_price, log_error

logger = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────
MODEL_NAME = "yolov8s-worldv2.pt"
CONFIDENCE_THRESHOLD = 0.45

DEFAULT_COMMODITY_PROMPTS = [
    "Pork Liempo",
    "Pork Belly",
    "Whole Chicken",
    "Tilapia",
    "Bangus",
    "Milkfish",
    "Red Onion",
    "White Onion",
    "Garlic",
    "Tomato",
    "Cabbage",
    "Carrot",
    "Eggplant",
    "Egg",
    "Beef Rump",
    "Local Commercial Rice",
    "Imported Commercial Rice",
]

_model: YOLO | None = None
_active_prompts: list[str] = []


def get_model() -> YOLO:
    """Load YOLO-World model instance and set commodity text prompts."""
    global _model, _active_prompts
    if _model is None:
        logger.info(f"Loading YOLO-World model ({MODEL_NAME})...")
        try:
            _model = YOLO(MODEL_NAME)
        except Exception as e:
            logger.warning(f"Failed loading {MODEL_NAME}, attempting fallback to yolov8s-world.pt ({e})")
            _model = YOLO("yolov8s-world.pt")
        
        refresh_yolo_world_prompts()
        logger.info("YOLO-World model initialized successfully")
    return _model


def refresh_yolo_world_prompts():
    """
    Query database for all current commodity names and set custom text prompts in YOLO-World.
    Called automatically on startup and after every sheet sync.
    """
    global _model, _active_prompts
    commodities = get_all_active_commodities()

    if not commodities:
        prompts = DEFAULT_COMMODITY_PROMPTS
    else:
        prompts = commodities

    _active_prompts = prompts
    if _model is not None:
        try:
            logger.info(f"Updating YOLO-World text classes ({len(prompts)} commodities): {prompts[:5]}...")
            _model.set_classes(prompts)
        except Exception as e:
            logger.error(f"Failed to set YOLO-World classes: {e}")


def run_inference(image_bytes: bytes) -> dict:
    """
    Run YOLO-World text-conditioned open-vocabulary detection on raw image bytes.

    Returns dict with:
        commodity_name   str    — detected commodity name (e.g. 'Bangus')
        category         str    — commodity group (e.g. 'Fish Products')
        specification    str    — auto-resolved spec ('Local' over 'Imported')
        unit             str    — unit (e.g. 'kg')
        price_prevailing float  — prevailing market price
        price_low        float  — low price in range
        price_high       float  — high price in range
        price_average    float  — average price
        confidence       float  — 0.0–1.0 score
        confidence_level str    — 'High' | 'Medium' | 'Low'
    """
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise ValueError(f"Could not decode image: {e}")

    model = get_model()
    results = model(img, verbose=False)[0]

    if not results.boxes or len(results.boxes) == 0:
        logger.info("Inference: no commodity boxes detected")
        return {
            "commodity_name":   None,
            "category":         None,
            "specification":    None,
            "unit":             "kg",
            "price_prevailing": None,
            "price_low":        None,
            "price_high":       None,
            "confidence":       0.0,
            "confidence_level": "Low",
        }

    # Pick detection box with highest confidence
    best_box = max(results.boxes, key=lambda b: b.conf.item())
    class_id = int(best_box.cls.item())
    confidence = float(best_box.conf.item())

    # Map class index to prompt name
    detected_name = None
    if _active_prompts and 0 <= class_id < len(_active_prompts):
        detected_name = _active_prompts[class_id]
    elif hasattr(results, 'names') and class_id in results.names:
        detected_name = results.names[class_id]
    else:
        detected_name = f"Commodity_{class_id}"

    # Determine confidence tier rating
    conf_level = "Low"
    if confidence >= 0.70:
        conf_level = "High"
    elif confidence >= 0.50:
        conf_level = "Medium"

    logger.info(f"YOLO-World detected: {detected_name} (conf={confidence:.2%}, level={conf_level})")

    # Look up monitored price and auto-resolve spec (Local vs Imported)
    price_info = get_latest_price(detected_name)

    return {
        "commodity_name":   detected_name,
        "category":         price_info.get("category") if price_info else "General",
        "specification":    price_info.get("specification") if price_info else None,
        "unit":             price_info.get("unit", "kg") if price_info else "kg",
        "price_prevailing": float(price_info["price_prevailing"]) if price_info and price_info.get("price_prevailing") is not None else None,
        "price_low":        float(price_info["price_low"]) if price_info and price_info.get("price_low") is not None else None,
        "price_high":       float(price_info["price_high"]) if price_info and price_info.get("price_high") is not None else None,
        "price_average":    float(price_info["price_average"]) if price_info and price_info.get("price_average") is not None else None,
        "confidence":       confidence,
        "confidence_level": conf_level,
        "source":           price_info.get("source", "DA Bantay Presyo (Sheet Sync)") if price_info else "DA Bantay Presyo",
        "period_month":     price_info.get("period_month") if price_info else None,
        "period_year":      price_info.get("period_year") if price_info else None,
    }


def warmup():
    """Run dummy inference on startup to warm up PyTorch model."""
    try:
        blank = Image.new("RGB", (640, 640), color=(127, 127, 127))
        get_model()(blank, verbose=False)
        logger.info("YOLO-World warm-up complete")
    except Exception as e:
        logger.warning(f"Warm-up failed (non-fatal): {e}")