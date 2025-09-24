from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from datetime import datetime, timezone
import easyocr
from PIL import Image
import numpy as np
import cv2
import io
import re

app = FastAPI()

# ✅ Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # ⚠️ Restrict later to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ EasyOCR (CPU only)
reader = easyocr.Reader(['en'], gpu=False)

# 🔹 Drop-in Improved OCR Function
def extract_plate_text(image_bytes: bytes) -> dict:
    """Preprocess, OCR, and regex cleanup for vehicleNo + containerId"""

    npimg = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    # --- Step 1: Preprocess ---
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Sharpen
    kernel = np.array([[0, -1, 0], [-1, 5,-1], [0, -1, 0]])
    gray = cv2.filter2D(gray, -1, kernel)

    # Adaptive threshold
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 35, 11
    )

    # Morphological cleanup
    kernel = np.ones((3,3), np.uint8)
    morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

    # --- Step 2: OCR ---
    results = reader.readtext(morph)
    print("🔍 EasyOCR raw results:", results)   # Debug full OCR output

    raw_text = " ".join([res[1] for res in results]).strip()
    if not raw_text:
        raw_text = "NO TEXT FOUND"

    # --- Step 3: Regex filters (more lenient) ---
    vehicleNo = None
    containerId = None

    # Sri Lanka plate formats (relaxed: allow spaces, optional hyphens)
    plate_patterns = [
        r"[A-Z]{1,3}\s?-?\s?\d{3,4}",        # e.g. WP 1234, WP-1234, KL4455
        r"[A-Z]{2}\s?-?\s?[A-Z]{2}\s?-?\s?\d{4}",  # WP-CA-1234
    ]
    for pattern in plate_patterns:
        match = re.findall(pattern, raw_text.upper())
        if match:
            vehicleNo = match[0].replace(" ", "").replace("--", "-")
            break

    # Container ID format: 4 letters + 7 digits (ISO 6346)
    cont_pattern = r"[A-Z]{4}\d{7}"
    match = re.findall(cont_pattern, raw_text.upper())
    if match:
        containerId = match[0]

    return {
        "vehicleNo": vehicleNo,
        "containerId": containerId,
        "raw": raw_text
    }


# ✅ Health check
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
    for v in vehicles:
        v["id"] = str(v["_id"])
        del v["_id"]
    return vehicles


# ✅ Add vehicle entry
@app.post("/api/vehicles")
async def create_vehicle(data: dict):
    collection = get_collection("vehicles")

    existing = await collection.find_one({
        "vehicleNo": data.get("vehicleNo"),
        "status": "inside"
    })
    if existing:
        return {"status": "duplicate", "message": f"⚠️ Vehicle {data.get('vehicleNo')} already inside."}

    now_utc = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    vehicle = {
        "vehicleNo": data.get("vehicleNo"),
        "containerId": data.get("containerId"),
        "type": data.get("type", "Unknown"),
        "plant": data.get("plant", None),
        "inTime": now_utc,
        "outTime": None,
        "status": "inside",
    }

    result = await collection.insert_one(vehicle)
    return {"id": str(result.inserted_id), "status": "ok", "message": "✅ Vehicle added"}


# ✅ Mark exit
@app.put("/api/vehicles/{id}/exit")
async def mark_exit(id: str):
    collection = get_collection("vehicles")

    now_utc = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    await collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"outTime": now_utc, "status": "exited"}}
    )
    return {"message": "✅ Vehicle marked as exited"}
