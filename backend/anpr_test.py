from fastapi import FastAPI, File, UploadFile
import cv2
import easyocr
import numpy as np

app = FastAPI()
reader = easyocr.Reader(['en'])

@app.post("/api/scan-plate")
async def scan_plate(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    results = reader.readtext(img)
    plates = []
    for (_, text, prob) in results:
        if prob > 0.5:
            plates.append(text)

    return {"plates": plates}
