# YOLO Object Detection Implementation Report

## Overview

This project implements **YOLOv11** (You Only Look Once v11) for real-time object detection of specific commodities. YOLOv11 is a state-of-the-art object detection model developed by Ultralytics that provides a balance between speed and accuracy, making it ideal for production environments.

### Key Information
- **Model Used**: YOLOv11 Small (`yolo11s.pt`)
- **Purpose**: Detect and classify commodities during user scanning via the PWA frontend
- **Commodities Detected**: Whole Chicken, Tilapia (Local), Pork Belly Liempo
- **Confidence Threshold**: 50% (adjustable)

---

## Understanding YOLO

### What is YOLO?

YOLO (You Only Look Once) is a real-time object detection framework that:
- Divides an image into a grid
- Predicts bounding boxes and class probabilities for each grid cell
- Returns detections in a single forward pass (hence "only looks once")
- Achieves high speed while maintaining competitive accuracy

### Why YOLOv11?

YOLOv11 is the latest iteration offering:
- **Improved Accuracy**: Better mean Average Precision (mAP) scores
- **Faster Inference**: Reduced latency for real-time scanning
- **Lighter Models**: Available in variants (nano, small, medium, large) for different hardware
- **Better Stability**: Enhanced training pipeline with improved hyperparameter defaults

---

## Training Phase

### Architecture & Components

**Location**: `backend/model/train.py`

The training phase uses YOLOv11 Small (`yolo11s.pt`) as the base model and fine-tunes it on your custom commodity dataset.

### Training Configuration

| Parameter | Value | Purpose |
|-----------|-------|---------|
| **Model** | yolo11s.pt | Balanced speed/accuracy |
| **Image Size** | 640px | Standard YOLO input resolution |
| **Batch Size** | 16 | Process 16 images per training iteration |
| **Epochs** | 80 | Number of complete passes through dataset |
| **Learning Rate** | 0.01 | Initial learning rate with cosine scheduling |
| **Device** | GPU/MPS/CPU (auto) | Automatic device detection and selection |
| **Warmup Epochs** | 3 | Gradual learning rate increase at start |
| **Early Stopping Patience** | 20 | Stop if no improvement for 20 epochs |

### Data Augmentation Strategy

The training applies the following augmentations to improve generalization:

```
HSV Distortion:    ±1.5% hue, ±70% saturation, ±40% value
Mosaic Augmentation: 100% enabled (combines 4 images)
Mixup:             10% probability
Flip (horizontal): 50% probability
Translation:       10% shift
Scale:             50% variation
```

### Training Output

After training completes, the best model is saved to:
```
backend/model/runs/detect/runs/alescan_v1/weights/best.pt
```

**Performance Metrics Reported**:
- **mAP50**: Mean Average Precision at IoU 0.50 (higher is better, 0-1.0 scale)
- **mAP50-95**: Mean Average Precision at IoU 0.50-0.95 (more strict metric)

### Dataset Structure

**Location**: `backend/model/data/`

The dataset must follow COCO format with three splits:

```
data/
├── train/          # ~70% of data - used for learning weights
│   ├── images/
│   └── labels/     # YOLO format: class_id, x_center, y_center, width, height (normalized)
├── valid/          # ~20% of data - used for validation during training
│   ├── images/
│   └── labels/
└── test/           # ~10% of data - final evaluation
    ├── images/
    └── labels/
```

### Dataset Configuration

**File**: `backend/model/dataset.yaml`

Must specify:
- Path to train/val/test directories
- Number of classes
- Class names (in order):
  - Class 0: whole_chicken
  - Class 1: tilapia_local
  - Class 2: pork_liempo

### How to Train

```bash
# Navigate to backend directory
cd backend/

# Install dependencies
pip install -r requirements.txt

# Run training
python model/train.py
```

**Expected Duration**: 5-30 minutes depending on GPU and dataset size

---

## Verification Phase

### Pre-Deployment Testing

**Location**: `backend/model/verify.py`

Before deploying trained weights to production, verify model quality using:

```bash
python model/verify.py path/to/test_image.jpg
```

### What It Does

1. Loads trained weights from `backend/model/runs/alescan_v1/weights/best.pt`
2. Runs inference on the provided image
3. Filters detections by confidence threshold (60% default)
4. Saves annotated output showing bounding boxes
5. Reports detection results in the console

### Expected Output

```
[PASS] whole_chicken — confidence: 87.5%
[PASS] tilapia_local — confidence: 92.1%
[LOW CONF] pork_liempo — confidence: 35.2%
```

---

## Inference/Scanning Phase

### How User Scanning Works

**Location**: `backend/services/vision.py`

When a user captures an image through the PWA scanner:

1. **Image Capture**: Frontend captures image from camera
2. **Upload**: Sends raw image bytes to backend
3. **Preprocessing**: Image is decoded and resized to 640x640px
4. **Inference**: Loaded YOLO model processes the image
5. **Post-Processing**: Highest confidence detection is selected
6. **Classification**: Maps class ID to commodity name
7. **Response**: Returns product info and confidence score

### Inference Pipeline

```
User Camera Input (JPG/PNG/WebP)
         ↓
    Decode to RGB
         ↓
  Resize to 640×640px
         ↓
  Run YOLO11 Forward Pass
         ↓
  Extract Bounding Boxes
         ↓
  Select Highest Confidence Detection
         ↓
  Map Class ID to Commodity
         ↓
  Return Result to Frontend
```

### Model Loading (Singleton Pattern)

The model is loaded once on first inference and cached:
- **Benefit**: Avoid expensive reload on every scan
- **Performance**: First scan takes ~500ms, subsequent scans take ~100-200ms

### Output Format

Each scan returns:

```json
{
  "product_id": 1,
  "product_slug": "whole_chicken",
  "display_name": "Whole Chicken",
  "confidence": 0.875
}
```

| Field | Type | Range | Notes |
|-------|------|-------|-------|
| **product_id** | int | 1-3 | Maps to products table |
| **product_slug** | string | - | URL-friendly identifier |
| **display_name** | string | - | User-facing name |
| **confidence** | float | 0.0-1.0 | Detection confidence score |

### Confidence Score Interpretation

- **0.90-1.00**: Very high confidence - reliable classification
- **0.70-0.89**: Good confidence - generally reliable
- **0.50-0.69**: Moderate confidence - may have false positives
- **< 0.50**: Low confidence - unreliable (may indicate out-of-distribution image)

### Class Mapping

| Class ID | Commodity | Slug | Product ID |
|----------|-----------|------|------------|
| 0 | Whole Chicken | whole_chicken | 1 |
| 1 | Tilapia (Local) | tilapia_local | 2 |
| 2 | Pork Belly Liempo | pork_liempo | 3 |

---

## Technical Architecture

### Directory Structure

```
backend/
├── model/
│   ├── train.py              # Training script
│   ├── verify.py             # Verification script
│   ├── dataset.yaml          # Dataset configuration
│   ├── yolo11s.pt            # Base pretrained weights
│   ├── runs/
│   │   └── detect/alescan_v1/
│   │       ├── weights/
│   │       │   ├── best.pt   # Best trained model
│   │       │   └── last.pt   # Last checkpoint
│   │       └── metrics/      # Training plots & stats
│   └── data/
│       ├── train/images      # Training images
│       ├── valid/images      # Validation images
│       └── test/images       # Test images
├── services/
│   └── vision.py             # Inference service
├── routers/
│   └── scan.py               # Scan endpoint
└── requirements.txt
```

### Dependencies

- **ultralytics**: YOLO implementation and utilities
- **torch/torchvision**: Deep learning framework
- **PIL/Pillow**: Image processing
- **FastAPI**: Web framework (for inference endpoints)
- **numpy**: Numerical computations

### Hardware Requirements

In our training process I use a CPU inference

(CPU inference):
- CPU: Intel i5 or equivalent
- RAM: 8GB
- Inference time: ~1-2 seconds per image

---

## Key Features

### 1. Real-Time Detection
- GPU acceleration enables sub-200ms inference
- Suitable for mobile scanning experience

### 2. High Accuracy
- Fine-tuned on custom commodity dataset
- mAP50 typically 0.85+ for well-labeled data

### 3. Robustness
- Data augmentation improves generalization
- Handles various lighting, angles, and backgrounds

### 4. Scalability
- Lightweight small model (yolo11s) uses minimal memory
- Easy to swap for larger models if needed

### 5. Reliability Metrics
- Confidence scores indicate prediction reliability
- Threshold filtering prevents low-quality detections

---

## Performance Optimization Tips

### During Training
- Use GPU for faster training cycles
- Adjust batch size based on available VRAM
- Enable mixed precision training if GPU supports it

### During Inference
- Load model once and reuse (singleton pattern - already implemented)
- Batch multiple images if possible
- Use smallest variant (nano/small) if latency is critical

### Dataset Quality
- Ensure high-quality labels (proper bounding boxes)
- Balance classes to avoid bias
- Include diverse backgrounds and lighting conditions

---

## Troubleshooting

### Training Issues

**Problem**: Out of memory during training
- **Solution**: Reduce `BATCH_SIZE` in `train.py` (e.g., 16 → 8)

**Problem**: Model not converging (loss not decreasing)
- **Solution**: Verify dataset labels are correct; try training longer; adjust learning rate

**Problem**: Training very slow
- **Solution**: Use GPU; ensure CUDA is properly installed; reduce `IMAGE_SIZE` to 512

### Inference Issues

**Problem**: Low confidence scores
- **Solution**: Retrain on more diverse dataset; verify image quality; check if commodity is in training data

**Problem**: Model not loading
- **Solution**: Verify path to `best.pt` exists; run training if weights are missing

**Problem**: Inconsistent results
- **Solution**: Ensure consistent image quality; verify model input preprocessing

---

## File References

| File | Purpose |
|------|---------|
| [train.py](backend/model/train.py) | Training script with hyperparameters |
| [verify.py](backend/model/verify.py) | Model verification utility |
| [vision.py](backend/services/vision.py) | Inference service for scanning |
| [dataset.yaml](backend/model/dataset.yaml) | Dataset configuration |
| [scan.py](backend/routers/scan.py) | FastAPI endpoint for scanning |

---

## Conclusion

This YOLO implementation provides a robust, fast, and accurate commodity detection system suitable for production use. The architecture supports both training and inference phases with built-in optimization for mobile and web deployment.
