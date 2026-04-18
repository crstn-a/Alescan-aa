# backend/services/vision.py
from ultralytics import YOLO
from PIL import Image
import io

MODEL_PATH = "weights/best.pt"
LABELS = {
    0: {"slug": "whole_chicken",  "display_name": "Whole Chicken"},
    1: {"slug": "tilapia",   "display_name": "Tilapia"},
    2: {"slug": "pork_liempo",    "display_name": "Pork Belly Liempo"},
}

_model = None

def get_model():
    global _model
    if _model is None:
        _model = YOLO(MODEL_PATH)
    return _model

def run_inference(image_bytes: bytes) -> dict:
    img = Image.open(io.BytesIO(image_bytes))
    results = get_model()(img)[0]

    if not results.boxes:
        return {"confidence": 0.0}

    best_box = max(results.boxes, key=lambda b: b.conf.item())
    class_id = int(best_box.cls.item())
    confidence = best_box.conf.item()

    return {**LABELS[class_id], "confidence": confidence}