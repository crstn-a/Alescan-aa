from ultralytics import YOLO

model = YOLO("yolo26n.pt")   # nano — fast, sufficient for 3 classes
model.train(
    data="dataset.yaml",
    epochs=50,
    imgsz=640,
    batch=16,
    project="runs",
    name="alescan_v1"
)