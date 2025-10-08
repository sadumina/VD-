from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime, timezone
import motor.motor_asyncio
import os
import logging
from dotenv import load_dotenv
from typing import Optional
import re
# ============================================================
# 🔧 Configure Logging
# ============================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

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

# ✅ CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://vd-frontend.onrender.com",  # 👈 your Render static site frontend
        "https://your-netlify-site.netlify.app",  # 👈 if you’re using Netlify
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

# ✅ Helper to fix ObjectId
def fix_id(doc: dict) -> dict:
    """Convert MongoDB _id -> id (string)."""
    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

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
# 🛠 Health Check
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
# 📡 Vehicle Endpoints
# ============================================================
class VehicleRequest(BaseModel):
    vehicleNo: str
    containerId: Optional[str] = None
    plant: str

# 🔹 Get ALL vehicles
@app.get("/api/vehicles")
async def get_vehicles():
    try:
        collection = get_collection("vehicles")
        vehicles = await collection.find().to_list(1000)
        return [fix_id(v) for v in vehicles]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# 🔹 Get ONLY inside vehicles
@app.get("/api/vehicles/inside")
async def get_inside_vehicles():
    try:
        collection = get_collection("vehicles")
        vehicles = await collection.find({"status": "inside"}).to_list(1000)
        return [fix_id(v) for v in vehicles]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# 🔹 Get ONLY exited vehicles
@app.get("/api/vehicles/exited")
async def get_exited_vehicles():
    try:
        collection = get_collection("vehicles")
        vehicles = await collection.find({"status": "exited"}).to_list(1000)
        return [fix_id(v) for v in vehicles]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# 🔹 Create a new vehicle entry (with restriction)
@app.post("/api/vehicles")
async def create_vehicle(data: VehicleRequest):
    try:
        collection = get_collection("vehicles")

        # 1️⃣ Validate Sri Lankan vehicle number format
        plate_pattern = r"^[A-Z]{1,3}-[A-Z]{0,2}-?\d{4}$"
        if not re.match(plate_pattern, data.vehicleNo.upper()):
            return {
                "status": "error",
                "message": f"❌ Invalid vehicle number: {data.vehicleNo}. Please use a valid Sri Lankan plate format (e.g., WP-KL-2099)."
            }

        # 2️⃣ Prevent double entry if already inside
        existing = await collection.find_one({
            "vehicleNo": data.vehicleNo,
            "status": "inside"
        })
        if existing:
            return {
                "status": "error",
                "message": f"❌ Vehicle {data.vehicleNo} is already inside."
            }

        # 3️⃣ Insert if valid
        now_utc = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

        vehicle = {
            "vehicleNo": data.vehicleNo.upper(),
            "containerId": data.containerId,
            "plant": data.plant,
            "inTime": now_utc,
            "outTime": None,
            "status": "inside",
        }

        result = await collection.insert_one(vehicle)
        vehicle["_id"] = result.inserted_id

        return {
            "status": "ok",
            "message": "✅ Vehicle entered successfully",
            "vehicle": fix_id(vehicle)
        }
    except Exception as e:
        logging.error(f"❌ Error creating vehicle: {e}")
        raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")


# 🔹 Mark vehicle exit
@app.put("/api/vehicles/{id}/exit")
async def mark_exit(id: str):
    try:
        collection = get_collection("vehicles")
        now_utc = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

        result = await collection.update_one(
            {"_id": ObjectId(id), "status": "inside"},  # only inside can exit
            {"$set": {"outTime": now_utc, "status": "exited"}}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Vehicle not found or already exited")

        return {"status": "ok", "message": "✅ Vehicle marked as exited", "id": id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database update failed: {str(e)}")

# 🔹 Delete vehicle
@app.delete("/api/vehicles/{id}")
async def delete_vehicle(id: str):
    try:
        collection = get_collection("vehicles")
        result = await collection.delete_one({"_id": ObjectId(id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        return {"status": "ok", "message": "✅ Vehicle deleted", "id": id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database delete failed: {str(e)}")
