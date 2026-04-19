"""
Verify trained YOLO26 weights before handing off to FastAPI.
Usage: python verify.py path/to/test_image.jpg
"""
import sys
from pathlib import Path
from ultralytics import YOLO

WEIGHTS   = Path("runs/detect/runs/alescan_v1/weights/best.pt")
THRESHOLD = 0.60
LABELS    = {0: "whole_chicken", 1: "tilapia_local", 2: "pork_liempo"}

def verify(image_path: str):
    if not WEIGHTS.exists():
        print(f"Weights not found at {WEIGHTS} — did training complete?")
        sys.exit(1)

    model = YOLO(str(WEIGHTS))
    results = model(image_path)[0]

    print(f"\nModel: {WEIGHTS}")
    print(f"Image: {image_path}")
    print(f"Detections: {len(results.boxes)}")
    print("-" * 40)

    if not results.boxes:
        print("No detections. Try a clearer image or check your labels.")
        return

    for box in results.boxes:
        cls_id = int(box.cls.item())
        conf   = box.conf.item()
        label  = LABELS.get(cls_id, "unknown")
        status = "PASS" if conf >= THRESHOLD else "LOW CONF"
        print(f"[{status}] {label} — confidence: {conf:.2%}")

    # Save annotated image in a 'verified' directory for visual inspection
    verified_dir = Path("verified")
    verified_dir.mkdir(parents=True, exist_ok=True)
    out_path = verified_dir / "verify_output.jpg"
    results.save(filename=str(out_path))
    print(f"\nAnnotated image saved to: {out_path}")
    print("Open it to visually confirm bounding boxes are correct.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify.py path/to/image.jpg")
        sys.exit(1)
    verify(sys.argv[1])