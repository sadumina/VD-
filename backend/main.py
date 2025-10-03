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
from typing import Optional

# 🔹 Mistral OCR SDK
from mistralai import Mistral

# ============================================================
# 🔧 Configure Logging
# ============================================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

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

# ✅ CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative React port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://haycarb-vehicle-detector-frontend.vercel.app",  # Vercel
        "https://vd-x0f8.onrender.com",  # Render frontend
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

# ✅ Startup event to check DB connection
@app.on_event("startup")
async def startup_db_check():
    try:
        await client.admin.command("ping")
        logging.info("✅ Database connected successfully")
        logging.info(f"📊 Using database: {DB_NAME}")
    except Exception as e:
        logging.error(f"❌ Database connection failed: {e}")
        raise e

# ============================================================
# 🛠 Health Check Endpoint
# ============================================================
@app.get("/")
async def root():
    return {"message": "Vehicle Detector API", "status": "online"}

@app.get("/api/health")
async def health_check():
    try:
        await client.admin.command("ping")
        return JSONResponse(content={
            "status": "ok", 
            "message": "✅ Database connected successfully",
            "database": DB_NAME
        })
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"status": "error", "message": f"❌ DB connection failed: {e}"}
        )


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
        logging.info(f"📸 Processing OCR for file: {file.filename}")
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

        # ✅ FIXED: Use model_dump() instead of dict() for Pydantic v2
        try:
            ocr_data = ocr_response.model_dump()
        except AttributeError:
            # Fallback for older Pydantic versions
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
        logging.info(f"✅ OCR detected: {detected_plate}")

        return {"status": "ok", "text": detected_plate, "raw": ocr_data}

    except Exception as e:
        logging.error(f"❌ OCR failed: {e}")
        return JSONResponse(
            status_code=500, 
            content={"status": "error", "message": str(e)}
        )


# ============================================================
# 📡 Vehicle Endpoints
# ============================================================
class VehicleRequest(BaseModel):
    vehicleNo: str
    containerId: Optional[str] = None  # Fixed for Python < 3.10
    plant: str

@app.get("/api/vehicles")
async def get_vehicles():
    try:
        logging.info("📋 Fetching all vehicles")
        collection = get_collection("vehicles")
        vehicles = await collection.find().to_list(1000)  # Increased limit
        
        for v in vehicles:
            v["id"] = str(v["_id"])
            del v["_id"]
        
        logging.info(f"✅ Found {len(vehicles)} vehicles")
        return vehicles
    except Exception as e:
        logging.error(f"❌ Error fetching vehicles: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/vehicles")
async def create_vehicle(data: VehicleRequest):
    try:
        logging.info(f"➕ Creating vehicle: {data.vehicleNo}")
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
        logging.info(f"✅ Vehicle created with ID: {result.inserted_id}")
        
        return {
            "id": str(result.inserted_id), 
            "status": "ok", 
            "message": "✅ Vehicle added",
            "vehicle": {**vehicle, "id": str(result.inserted_id)}
        }
    except Exception as e:
        logging.error(f"❌ Error creating vehicle: {e}")
        raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")

@app.put("/api/vehicles/{id}/exit")
async def mark_exit(id: str):
    try:
        logging.info(f"🚪 Marking exit for vehicle: {id}")
        collection = get_collection("vehicles")
        now_utc = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

        result = await collection.update_one(
            {"_id": ObjectId(id)}, 
            {"$set": {"outTime": now_utc, "status": "exited"}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        
        logging.info(f"✅ Vehicle {id} marked as exited")
        return {"message": "✅ Vehicle marked as exited", "id": id}
    except Exception as e:
        logging.error(f"❌ Error marking exit: {e}")
        raise HTTPException(status_code=500, detail=f"Database update failed: {str(e)}")

@app.delete("/api/vehicles/{id}")
async def delete_vehicle(id: str):
    try:
        logging.info(f"🗑️ Deleting vehicle: {id}")
        collection = get_collection("vehicles")
        
        result = await collection.delete_one({"_id": ObjectId(id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        
        logging.info(f"✅ Vehicle {id} deleted")
        return {"message": "✅ Vehicle deleted", "id": id}
    except Exception as e:
        logging.error(f"❌ Error deleting vehicle: {e}")
        raise HTTPException(status_code=500, detail=f"Database delete failed: {str(e)}")