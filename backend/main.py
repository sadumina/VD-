from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import get_collection, db
from bson import ObjectId
from datetime import datetime

app = FastAPI()

# ✅ CORS setup (you can restrict origins later for security)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Run DB check at startup
@app.on_event("startup")
async def startup_db_check():
    try:
        await db.command("ping")
        print("✅ MongoDB connection successful")
    except Exception as e:
        print("❌ MongoDB connection failed:", e)

# ✅ Health check with DB status
@app.get("/api/health")
async def health_check():
    try:
        await db.command("ping")
        return {"status": "ok", "message": "Backend + DB connected 🚀"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ✅ Get all vehicles
@app.get("/api/vehicles")
async def get_vehicles():
    collection = get_collection("vehicles")
    vehicles = await collection.find().to_list(100)

    # Convert ObjectId to string for frontend compatibility
    for v in vehicles:
        v["id"] = str(v["_id"])
        del v["_id"]
    return vehicles

# ✅ Create new vehicle entry (with plant field)
@app.post("/api/vehicles")
async def create_vehicle(data: dict):
    collection = get_collection("vehicles")

    vehicle = {
        "vehicleNo": data.get("vehicleNo"),
        "containerId": data.get("containerId"),
        "type": data.get("type", "Unknown"),
        "plant": data.get("plant", None),   # ✅ Save plant
        "inTime": datetime.now().isoformat(),
        "outTime": None,
        "status": "inside",
    }

    result = await collection.insert_one(vehicle)
    return {"id": str(result.inserted_id), "message": "Vehicle added"}

# ✅ Mark vehicle as exited
@app.put("/api/vehicles/{id}/exit")
async def mark_exit(id: str):
    collection = get_collection("vehicles")
    await collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"outTime": datetime.now().isoformat(), "status": "exited"}}
    )
    return {"message": "Vehicle marked as exited"}
