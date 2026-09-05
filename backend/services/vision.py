import io
import re
import yaml
import logging
from pathlib import Path
from PIL import Image
from ultralytics import YOLO

from services.db import get_all_active_commodities, get_latest_price, log_error

logger = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────
# Resolve model path relative to the backend root (parent of services/)
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = _BACKEND_ROOT / "model"
MODEL_PATH = MODEL_DIR / "best.pt"
DATA_YAML_PATH = MODEL_DIR / "data.yaml"

CONFIDENCE_THRESHOLD = 0.40

# ── Load class names from data.yaml ────────────────────────────────
def _load_class_names() -> list[str]:
    """Read the 54 commodity class names from the Roboflow data.yaml."""
    try:
        with open(DATA_YAML_PATH, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        return data.get("names", [])
    except Exception as e:
        logger.error(f"Failed to load class names from {DATA_YAML_PATH}: {e}")
        return []

CLASS_NAMES: list[str] = _load_class_names()

_model: YOLO | None = None


def get_model() -> YOLO:
    """Load the custom-trained YOLOv26 model for commodity detection."""
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            error_msg = f"YOLOv26 model weights file not found at {MODEL_PATH}. Ensure backend/model/best.pt is committed and present."
            logger.error(error_msg)
            raise RuntimeError(error_msg)

        logger.info(f"Loading YOLOv26 custom model from: {MODEL_PATH}")
        try:
            _model = YOLO(str(MODEL_PATH))
        except Exception as e:
            logger.error(f"Failed to load YOLOv26 model: {e}")
            raise RuntimeError(f"Could not load YOLOv26 model from {MODEL_PATH}: {e}")

        logger.info(f"YOLOv26 model initialized successfully ({len(CLASS_NAMES)} classes)")
    return _model


def run_inference(image_bytes: bytes) -> dict:
    """
    Run YOLOv26 custom-trained detection on raw image bytes.

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

    # Map class index to name from data.yaml
    detected_name = None
    if CLASS_NAMES and 0 <= class_id < len(CLASS_NAMES):
        detected_name = CLASS_NAMES[class_id]
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

    logger.info(f"YOLOv26 detected: {detected_name} (conf={confidence:.2%}, level={conf_level})")

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
        logger.info("YOLOv26 warm-up complete")
    except Exception as e:
        logger.warning(f"Warm-up failed (non-fatal): {e}")