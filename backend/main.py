from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import get_collection, db
from bson import ObjectId
from datetime import datetime, timezone

app = FastAPI()

# ✅ Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # You can restrict this later to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Check MongoDB connection on startup
@app.on_event("startup")
async def startup_db_check():
    try:
        await db.command("ping")
        print("✅ MongoDB connection successful")
    except Exception as e:
        print("❌ MongoDB connection failed:", e)


# ✅ Health check API
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

    # Convert ObjectId → string for frontend
    for v in vehicles:
        v["id"] = str(v["_id"])
        del v["_id"]
    return vehicles


# ✅ Add new vehicle entry
@app.post("/api/vehicles")
async def create_vehicle(data: dict):
    collection = get_collection("vehicles")

    # 🔍 Prevent duplicates: vehicle already inside?
    existing = await collection.find_one({
        "vehicleNo": data.get("vehicleNo"),
        "status": "inside"
    })
    if existing:
        return {
            "status": "duplicate",
            "message": f"⚠️ Vehicle {data.get('vehicleNo')} is already inside."
        }

    # 🚗 New vehicle entry
    now_utc = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    vehicle = {
        "vehicleNo": data.get("vehicleNo"),
        "containerId": data.get("containerId"),
        "type": data.get("type", "Unknown"),
        "plant": data.get("plant", None),
        "inTime": now_utc,   # ✅ always UTC
        "outTime": None,
        "status": "inside",
    }

    result = await collection.insert_one(vehicle)
    return {"id": str(result.inserted_id), "status": "ok", "message": "✅ Vehicle added"}


# ✅ Mark vehicle exit
@app.put("/api/vehicles/{id}/exit")
async def mark_exit(id: str):
    collection = get_collection("vehicles")

    now_utc = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    await collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "outTime": now_utc,   # ✅ always UTC
            "status": "exited"
        }}
    )
    return {"message": "✅ Vehicle marked as exited"}
