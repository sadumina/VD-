from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime, timezone
import motor.motor_asyncio
import os
import logging
from dotenv import load_dotenv
import base64
import re

# 🔹 Mistral OCR SDK
from mistralai import Mistral

# ============================================================
# 🌍 Load environment variables
# ============================================================
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "vehicle_detector")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

if not MONGO_URL:
    raise ValueError("❌ MONGO_URL is not set. Please check your .env file.")

if not MISTRAL_API_KEY:
    raise ValueError("❌ MISTRAL_API_KEY is not set. Please check your .env file.")

# ============================================================
# 🚀 FastAPI App Setup
# ============================================================
app = FastAPI(title="Vehicle Detector API")

# ✅ Fixed CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React dev server
        "https://haycarb-vehicle-detector-frontend.vercel.app",  # Vercel prod
        "*",  # TEMP: allow all (remove in prod)
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
# 🔠 OCR Setup (Mistral)
# ============================================================
mistral_client = Mistral(api_key=MISTRAL_API_KEY)

def encode_image_bytes(file_bytes: bytes) -> str:
    """Convert raw bytes to base64 string."""
    return base64.b64encode(file_bytes).decode("utf-8")

def clean_plate_text(text: str) -> str:
    """Correct common OCR mistakes in number plates."""
    text = text.upper()
    corrections = {"O": "0", "I": "1", "S": "5", "B": "8"}
    for wrong, right in corrections.items():
        text = text.replace(wrong, right)
    return text

def format_plate(detected: list) -> str:
    """Format detected tokens into a single plate string."""
    plate = " ".join(detected).upper()
    plate = re.sub(r"\s+", " ", plate).strip()
    return plate

# ============================================================
# 📸 OCR Endpoint
# ============================================================
@app.post("/api/ocr/")
async def ocr_image(file: UploadFile = File(...)):
    try:
        img_bytes = await file.read()
        base64_image = encode_image_bytes(img_bytes)

        # Send to Mistral OCR
        ocr_response = mistral_client.ocr.process(
            model="mistral-ocr-latest",
            document={
                "type": "image_url",
                "image_url": f"data:image/jpeg;base64,{base64_image}"
            },
            include_image_base64=False
        )

        # ✅ Convert response object to dict
        ocr_data = ocr_response.dict()

        # Extract text tokens from OCR
        detected = []
        for page in ocr_data.get("pages", []):
            for block in page.get("blocks", []):
                text = block.get("text", "").strip()
                if text:
                    cleaned = re.sub(r"[^A-Z0-9 -]", "", text.upper())
                    if cleaned:
                        detected.append(clean_plate_text(cleaned))

        detected_plate = format_plate(detected)

        return {"status": "ok", "text": detected_plate, "raw": ocr_data}

    except Exception as e:
        logging.error(f"❌ OCR failed: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

# ============================================================
# 📡 Vehicle Endpoints
# ============================================================
class VehicleRequest(BaseModel):
    vehicleNo: str
    containerId: str | None = None
    plant: str

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
        logging.error(f"❌ Error fetching vehicles: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.post("/api/vehicles")
async def create_vehicle(data: VehicleRequest):
    try:
        collection = get_collection("vehicles")

        now_utc = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

        vehicle = {
            "vehicleNo": data.vehicleNo,
            "containerId": data.containerId,
            "plant": data.plant,
            "inTime": now_utc,
            "outTime": None,
            "status": "inside",
        }

        result = await collection.insert_one(vehicle)
        return {"id": str(result.inserted_id), "status": "ok", "message": "✅ Vehicle added"}
    except Exception as e:
        logging.error(f"❌ Error creating vehicle: {e}")
        raise HTTPException(status_code=500, detail="Database insert failed")

@app.put("/api/vehicles/{id}/exit")
async def mark_exit(id: str):
    try:
        collection = get_collection("vehicles")
        now_utc = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

        result = await collection.update_one(
            {"_id": ObjectId(id)}, {"$set": {"outTime": now_utc, "status": "exited"}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        return {"message": "✅ Vehicle marked as exited"}
    except Exception as e:
        logging.error(f"❌ Error marking exit: {e}")
        raise HTTPException(status_code=500, detail="Database update failed")
