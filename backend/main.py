from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from bson import ObjectId
from database import get_collection, db

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Startup: Check MongoDB connection ---
@app.on_event("startup")
async def startup_db_check():
    try:
        await db.command("ping")
        print("✅ MongoDB connection established")
    except Exception as e:
        print("❌ MongoDB connection failed:", e)

# --- Serializer for MongoDB documents ---
def serialize(vehicle):
    return {
        "id": str(vehicle.get("_id")),
        "vehicleNo": vehicle.get("vehicleNo", "N/A"),  # 👈 fallback
        "type": vehicle.get("type", "Unknown"),
        "inTime": vehicle.get("inTime"),
        "outTime": vehicle.get("outTime"),
        "status": vehicle.get("status", "unknown"),
    }

# --- Routes ---
@app.get("/api/vehicles")
async def get_vehicles():
    col = get_collection("vehicles")
    vehicles = await col.find().to_list(1000)
    return [serialize(v) for v in vehicles]

@app.post("/api/vehicles")
async def create_vehicle(data: dict):
    if "vehicleNo" not in data:
        return {"error": "Vehicle number is required"}

    col = get_collection("vehicles")
    exists = await col.find_one({"vehicleNo": data["vehicleNo"], "status": "inside"})
    if exists:
        return {"error": "Vehicle already inside"}

    doc = {
        "vehicleNo": data["vehicleNo"],
        "type": data.get("type", "Unknown"),
        "inTime": datetime.now().isoformat(),
        "outTime": None,
        "status": "inside",
    }
    result = await col.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "✅ Vehicle entered"}

@app.put("/api/vehicles/{id}/exit")
async def mark_exit(id: str):
    col = get_collection("vehicles")
    await col.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"outTime": datetime.now().isoformat(), "status": "exited"}},
    )
    return {"message": "🚪 Vehicle exited"}

# --- Health Check ---
@app.get("/api/health")
async def health_check():
    try:
        count = await db["vehicles"].count_documents({})
        return {"status": "ok", "message": "API running", "vehicle_count": count}
    except Exception as e:
        return {"status": "error", "message": str(e)}
