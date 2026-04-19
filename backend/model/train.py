import torch
from ultralytics import YOLO
from pathlib import Path

# ── Configuration ───────────────────────────────────────────
MODEL_VARIANT = "yolo26n.pt"   # nano: fast, small, enough for 3 classes
DATA_YAML     = "dataset.yaml"
PROJECT_NAME  = "runs"
RUN_NAME      = "alescan_v1"
IMAGE_SIZE    = 640             # standard YOLO input resolution
EPOCHS        = 60             # enough for a 3-class model to converge
BATCH_SIZE    = 16             # lower to 8 if you run out of RAM
PATIENCE      = 15             # early-stop if no improvement for 15 epochs

# ── Device selection ────────────────────────────────────────
if torch.cuda.is_available():
    device = "0"              # NVIDIA GPU (fastest)
elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
    device = "mps"            # Apple Silicon GPU
else:
    device = "cpu"            # CPU fallback — slower but works

print(f"Training on device: {device}")

# ── Load base model and train ────────────────────────────────
model = YOLO(MODEL_VARIANT)

results = model.train(
    data      = DATA_YAML,
    epochs    = EPOCHS,
    imgsz     = IMAGE_SIZE,
    batch     = BATCH_SIZE,
    patience  = PATIENCE,
    device    = device,
    project   = PROJECT_NAME,
    name      = RUN_NAME,
    exist_ok  = True,          # overwrite previous run of same name
    verbose   = True,
    plots     = True,          # saves confusion matrix + PR curve to runs/
    save      = True,          # saves best.pt and last.pt
    cache     = False,         # set True to cache images in RAM if you have 16GB+
    workers   = 2,             # dataloader workers — keep low on laptop
    rect      = False,         # rectangular training — leave off for mixed sizes
    seed      = 42,            # reproducibility
)

# ── Report final metrics ─────────────────────────────────────
best_weights = Path(PROJECT_NAME) / RUN_NAME / "weights" / "best.pt"
print(f"\nTraining complete.")
print(f"Best weights: {best_weights}")
print(f"mAP50:        {results.results_dict.get('metrics/mAP50(B)', 'N/A'):.4f}")
print(f"mAP50-95:     {results.results_dict.get('metrics/mAP50-95(B)', 'N/A'):.4f}")
print(f"\nNext step: cp {best_weights} ../backend/weights/best.pt")