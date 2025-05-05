from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
import base64
from io import BytesIO
from PIL import Image
import numpy as np
import cv2

app = FastAPI()

# Enable CORS - allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO('yolov8n.pt')  # we can use 'yolov8s.pt', 'yolov8m.pt' etc. dependeing on our need

@app.get("/")
def read_root():
    return {"message": "SmartWatch AI Backend Running"}


class FrameInput(BaseModel):
    image:str


@app.post("/process_frame")
def process_frame(data: FrameInput):
    try:
        image_data = base64.b64decode(data.image.split(",")[1])
        pil_image = Image.open(BytesIO(image_data)).convert('RGB')
        img = np.array(pil_image)

        # Run detection
        results = model(img)[0] #first result (YOLOv8 returns list of results)

        # print(f"Received image size: {img.shape}")
        # print(f"Detection results: {results.boxes}")

        detections = []
        for box in results.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            label = model.names[cls]
           
            detections.append({
                "label": label, 
                "confidence": conf,
                "bbox": [round(coord, 2) for coord in box.xyxy[0].tolist()]
                })

       
        return {"detections": detections }
    except Exception as e:
        return {"error": str(e)}

