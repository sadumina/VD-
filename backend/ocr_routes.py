import warnings
warnings.filterwarnings("ignore", message=".*pin_memory.*")  # silence torch warnings

from fastapi import APIRouter, UploadFile, File
import easyocr
from PIL import Image
import numpy as np
import cv2
import io
import re
import time

router = APIRouter()

# ✅ Force EasyOCR to run on CPU only
reader = easyocr.Reader(['en'], gpu=False)


# 🔹 Step 1: Preprocess images before OCR
def preprocess_image(img: np.ndarray) -> np.ndarray:
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Equalize histogram (improve contrast)
    gray = cv2.equalizeHist(gray)

    # Gaussian blur (reduce noise)
    blur = cv2.GaussianBlur(gray, (3, 3), 0)

    # Adaptive thresholding (binarize plate area)
    thresh = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 2
    )
    return thresh


# 🔹 Step 2: Detect Sri Lankan plates / containers
def detect_plate_and_container(text: str):
    clean_text = (
        text.upper()
        .replace("O", "0")
        .replace("I", "1")
        .replace("S", "5")
        .replace("]", "F")
        .replace("-", " ")
    )

    # Remove common OCR noise words
    blacklist = ["ALAMY", "ILAMY", "ALALLY", "ZIEZSURE", "SURE"]
    for word in blacklist:
        clean_text = clean_text.replace(word, " ")

    print("🔎 Cleaned OCR Text:", clean_text)

    provinces = ["WP", "CP", "SP", "NP", "EP", "NW", "NC", "UVA", "SB"]

    plate_regexes = [
        # Modern SL plates: WP NC 9024
        r"\b(" + "|".join(provinces) + r")\s?[A-Z]{1,3}\s?\d{3,4}\b",
        # Gov/Diplomatic: WP AB CDEF
        r"\b(" + "|".join(provinces) + r")\s?[A-Z]{2,6}\b",
        # Old numeric style: 19 5678
        r"\b\d{2,3}\s?\d{3,4}\b",
        # Fallback: ABC 1234
        r"\b[A-Z]{2,3}\s?\d{3,4}\b",
    ]

    container_regex = r"\b([A-Z]{4}\s?\d{6}\s?\d)\b"

    vehicle_no, container_id = None, None

    # Vehicle plates
    for regex in plate_regexes:
        match = re.search(regex, clean_text)
        if match:
            vehicle_no = match.group(0).replace(" ", "")
            break

    # Containers
    match = re.search(container_regex, clean_text)
    if match:
        container_id = match.group(1).replace(" ", "")

    # Vehicle type
    vehicle_type = "Unknown"
    if container_id:
        vehicle_type = "Container Truck"
    elif vehicle_no:
        vehicle_type = "Car"

    return vehicle_no, container_id, vehicle_type


# 🔹 Step 3: OCR API endpoint
@router.post("/api/ocr")
async def ocr_vehicle(file: UploadFile = File(...)):
    start_time = time.time()

    # Load image
    image_bytes = await file.read()
    img = Image.open(io.BytesIO(image_bytes))
    img = np.array(img)

    # Preprocess with OpenCV
    preprocessed = preprocess_image(img)

    # Run OCR
    results = reader.readtext(preprocessed)
    detected_text = " ".join([res[1] for res in results])

    # Debug logs
    print("🔎 OCR Raw Results:", results)
    print("📝 Detected Text:", detected_text)

    # Extract structured data
    vehicle_no, container_id, vehicle_type = detect_plate_and_container(detected_text)

    elapsed = round(time.time() - start_time, 2)

    return {
        "raw_text": detected_text,
        "vehicleNo": vehicle_no,
        "containerId": container_id,
        "vehicleType": vehicle_type,
        "processingTime": f"{elapsed} sec"
    }
