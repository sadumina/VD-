from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from bson import ObjectId
from datetime import datetime, timezone
import motor.motor_asyncio
import os
import logging
from dotenv import load_dotenv

# 🔹 OCR imports
import easyocr
import numpy as np
from PIL import Image
import io
import cv2
import re

# ============================================================
# 🌍 Load environment variables
# ============================================================
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "vehicle_detector")

if not MONGO_URL:
    raise ValueError("❌ MONGO_URL is not set. Please check your .env file.")

# ============================================================
# 🚀 FastAPI App Setup
# ============================================================
app = FastAPI(title="Vehicle Detector API")

# ✅ Explicit CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # React dev
        "https://haycarb-vehicle-detector-frontend.vercel.app",  # Vercel prod
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# 🔗 MongoDB Connection
# ============================================================
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

def get_collection(name: str):
    return db[name]

# ============================================================
# 🔠 OCR Setup
# ============================================================
reader = easyocr.Reader(['en'], gpu=False)  # CPU-based OCR

# ✅ Helper function to fix common OCR mistakes
def clean_plate_text(text: str) -> str:
    text = text.upper()
    corrections = {
        "O": "0",  # O → 0
        "I": "1",  # I → 1
        "S": "5",  # S → 5
        "B": "8",  # B → 8
    }
    for wrong, right in corrections.items():
        text = text.replace(wrong, right)
    return text

# ✅ Format Sri Lankan plate style
def format_plate(detected: list) -> str:
    """
    Merge OCR chunks into a valid Sri Lankan plate format.
    """
    plate = " ".join(detected).upper()
    plate = re.sub(r"\s+", " ", plate).strip()
    plate = plate.replace("  ", " ").replace(" -", "-").replace("- ", "-")
    return plate

# ============================================================
# 📸 OCR Endpoint
# ============================================================
@app.post("/api/ocr/")
async def ocr_image(file: UploadFile = File(...)):
    """
    Accept an image upload and return detected Sri Lankan number plate text.
    """
    try:
        img_bytes = await file.read()
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img_np = np.array(image)

        # ✅ Preprocess: grayscale + resize + denoise
        gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
        gray = cv2.GaussianBlur(gray, (3, 3), 0)
        _, thresh = cv2.threshold(
            gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )

        # ✅ Run OCR
        results = reader.readtext(thresh, detail=1)

        detected = []
        for (_, text, _) in results:
            cleaned = re.sub(r"[^A-Z0-9 -]", "", text.upper())
            if cleaned:
                detected.append(clean_plate_text(cleaned))

        # ✅ Format into full plate
        detected_plate = format_plate(detected)

        return {"status": "ok", "text": detected_plate}
    except Exception as e:
        logging.error(f"❌ OCR failed: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"OCR failed: {str(e)}"},
        )

# ============================================================
# 📡 Vehicle API Routes
# ============================================================

@app.on_event("startup")
async def startup_event():
    """Ping DB on startup and log/print a success message."""
    try:
        await db.command("ping")
        logging.info("✅ MongoDB connection established successfully 🚀")
        print("✅ MongoDB connection established successfully 🚀")
    except Exception as e:
        logging.error(f"❌ MongoDB connection failed: {e}")
        print(f"❌ MongoDB connection failed: {e}")
    logging.info("🚀 Vehicle Detector API started successfully")

# ✅ Health check
@app.get("/api/health")
async def health_check():
    try:
        await db.command("ping")
        return {
            "status": "ok",
            "message": "✅ Backend + Database connected successfully 🚀",
            "database": DB_NAME,
        }
    except Exception as e:
        return {"status": "error", "message": f"❌ DB connection failed: {e}"}

# ✅ Get all vehicles
@app.get("/api/vehicles")
async def get_vehicles():
    try:
        collection = get_collection("vehicles")
        vehicles = await collection.find().to_list(100)
        for v in vehicles:
            v["id"] = str(v["_id"])
            del v["_id"]
        return vehicles
    except Exception as e:
        logging.error(f"❌ Error in get_vehicles: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)},
        )

# ✅ Add vehicle entry
@app.post("/api/vehicles")
async def create_vehicle(data: dict):
    try:
        collection = get_collection("vehicles")

        existing = await collection.find_one(
            {"vehicleNo": data.get("vehicleNo"), "status": "inside"}
        )
        if existing:
            return {
                "status": "duplicate",
                "message": f"⚠️ Vehicle {data.get('vehicleNo')} already inside.",
            }

        now_utc = (
            datetime.now(timezone.utc)
            .replace(microsecond=0)
            .isoformat()
            .replace("+00:00", "Z")
        )

        vehicle = {
            "vehicleNo": data.get("vehicleNo"),
            "containerId": data.get("containerId"),
            "type": data.get("type", "Unknown"),
            "plant": data.get("plant"),
            "inTime": now_utc,
            "outTime": None,
            "status": "inside",
        }

        result = await collection.insert_one(vehicle)
        return {
            "id": str(result.inserted_id),
            "status": "ok",
            "message": "✅ Vehicle added",
        }
    except Exception as e:
        logging.error(f"❌ Error in create_vehicle: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)},
        )

# ✅ Mark exit
@app.put("/api/vehicles/{id}/exit")
async def mark_exit(id: str):
    try:
        collection = get_collection("vehicles")
        now_utc = (
            datetime.now(timezone.utc)
            .replace(microsecond=0)
            .isoformat()
            .replace("+00:00", "Z")
        )

        await collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"outTime": now_utc, "status": "exited"}},
        )
        return {"message": "✅ Vehicle marked as exited"}
    except Exception as e:
        logging.error(f"❌ Error in mark_exit: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)},
        )
