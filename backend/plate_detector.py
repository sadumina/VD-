import cv2
import numpy as np
import easyocr

# Load OCR reader (English only for SL plates)
reader = easyocr.Reader(['en'], gpu=False)

def detect_plate_number(image_path: str):
    # Load image
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Preprocess
    blur = cv2.bilateralFilter(gray, 11, 17, 17)
    edges = cv2.Canny(blur, 30, 200)

    # Find contours
    contours, _ = cv2.findContours(edges.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]

    plate_img = None
    for cnt in contours:
        # Approximate contour
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)

        # License plates usually rectangular (4 points)
        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(cnt)
            aspect_ratio = w / float(h)
            if 2 < aspect_ratio < 6:  # plate ratio filter
                plate_img = img[y:y+h, x:x+w]
                break

    # If plate region found → OCR
    if plate_img is not None:
        results = reader.readtext(plate_img)
        if results:
            text = " ".join([res[1] for res in results])
            return text.upper().replace(" ", "")
    return None
