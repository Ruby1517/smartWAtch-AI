from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import base64
from io import BytesIO
from PIL import Image
import numpy as np
from ultralytics import YOLO

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("yolov8n.pt")  # Load model


@app.get("/")
def read_root():
    return {"message": "SmartWatch AI Backend Running"}

@app.post("/analyze-frame")
async def analyze_frame(request: Request):
    body = await request.json()
    base64_image = body.get("image").split(",")[1]

    image_data = base64.b64decode(base64_image)
    image = Image.open(BytesIO(image_data)).convert("RGB")
    np_image = np.array(image)

    results = model(np_image)
    objects = results[0].names
    boxes = results[0].boxes.xyxy.tolist()
    classes = results[0].boxes.cls.tolist()

    output = [
        {"object": objects[int(cls)], "box": box}
        for cls, box in zip(classes, boxes)
    ]

    return {"detections": output}
