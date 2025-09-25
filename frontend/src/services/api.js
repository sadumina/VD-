import axios from "axios";

// ✅ Detect environment (Vite provides import.meta.env.MODE)
const API_BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:8000/api" // Local FastAPI backend
    : "https://haycarb-vehicle-detector.onrender.com/api"; // Production backend (Render/Vercel)

// ✅ Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
});

// ============================================================
// 🚗 Vehicle API
// ============================================================

// Get all vehicles
export const fetchVehicles = () => api.get("/vehicles");

// Add vehicle entry
export const createVehicle = (data) => api.post("/vehicles", data);

// Mark vehicle exit
export const markExit = (id) => api.put(`/vehicles/${id}/exit`);

// ============================================================
// 🔠 OCR API
// ============================================================

// Upload image for OCR
export const uploadOCR = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/ocr/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
