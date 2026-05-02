import io
import logging
from pathlib import Path
from PIL import Image
from ultralytics import YOLO

import torch
from ultralytics.nn.tasks import DetectionModel

# 🔧 fix for PyTorch 2.6+
torch.serialization.add_safe_globals([DetectionModel])

logger = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────
WEIGHTS_PATH      = Path("weights/best.pt")
CONFIDENCE_THRESHOLD = 0.50

# Class index → slug + display name
# Order MUST match dataset.yaml:
#   0: whole_chicken
#   1: tilapia_local
#   2: pork_liempo
LABELS: dict[int, dict] = {
    0: {"slug": "pork_liempo",    "display_name": "Pork Belly Liempo"},
    1: {"slug": "tilapia_local",  "display_name": "Tilapia (Local)"},
    2: {"slug": "whole_chicken",  "display_name": "Whole Chicken"},
}

# ── Singleton model ────────────────────────────────────────────────
_model: YOLO | None = None

def get_model() -> YOLO:
    """Load model once; return cached instance on every subsequent call."""
    global _model
    if _model is None:
        if not WEIGHTS_PATH.exists():
            raise FileNotFoundError(
                f"Weights not found at {WEIGHTS_PATH}. "
                "Run Phase 5 training and copy best.pt to backend/weights/"
            )
        logger.info(f"Loading YOLO11 weights from {WEIGHTS_PATH}")
        _model = YOLO(str(WEIGHTS_PATH))
        logger.info("Model loaded successfully")
    return _model


# ── Inference ──────────────────────────────────────────────────────
def run_inference(image_bytes: bytes) -> dict:
    """
    Run YOLO11 inference on raw image bytes from the PWA scan.

    Returns a dict with:
        product_id    int   — row id in products table
        product_slug  str   — e.g. 'tilapia_local'
        display_name  str   — e.g. 'Tilapia (Local)'
        confidence    float — 0.0–1.0 (raw model score)

    Returns confidence=0.0 dict if no boxes detected at all.
    Raises on image decode failure (corrupt upload).
    """
    # Decode bytes → PIL Image (handles JPEG, PNG, WebP)
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise ValueError(f"Could not decode image: {e}")

    # Run inference (model auto-handles resize to 640px)
    results = get_model()(img, verbose=False)[0]

    # No detection at all
    if not results.boxes or len(results.boxes) == 0:
        logger.info("Inference: no boxes detected")
        return {
            "product_id":   None,
            "product_slug": None,
            "display_name": None,
            "confidence":   0.0,
        }

    # Pick the detection with the highest confidence score
    best_box = max(results.boxes, key=lambda b: b.conf.item())
    class_id  = int(best_box.cls.item())
    confidence = best_box.conf.item()

    # Guard against an out-of-range class index
    if class_id not in LABELS:
        logger.warning(f"Inference returned unknown class_id={class_id}")
        return {
            "product_id":   None,
            "product_slug": None,
            "display_name": None,
            "confidence":   confidence,
        }

    label = LABELS[class_id]
    logger.info(
        f"Inference: {label['slug']} "
        f"class={class_id} conf={confidence:.2%}"
    )

    # product_id maps 1:1 to class_id + 1 (products table uses serial 1,2,3)
    return {
        "product_id":   class_id + 1,
        "product_slug": label["slug"],
        "display_name": label["display_name"],
        "confidence":   confidence,
    }


# ── Warm-up ────────────────────────────────────────────────────────
def warmup():
    """
    Run one dummy inference on a blank image at startup.
    Prevents the first real consumer scan from taking 2–3x longer
    due to model warm-up and JIT compilation on first call.
    """
    try:
        blank = Image.new("RGB", (640, 640), color=(127, 127, 127))
        get_model()(blank, verbose=False)
        logger.info("YOLO11 warm-up complete")
    except Exception as e:
        logger.warning(f"Warm-up failed (non-fatal): {e}")