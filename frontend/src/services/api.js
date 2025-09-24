import axios from "axios";

// ✅ Detect environment (Vite uses import.meta.env.MODE)
const API_BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:8000/api" // Local FastAPI backend
    : "https://haycarb-vehicle-detector.onrender.com/api"; // Render backend

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// ✅ Vehicles API
export const fetchVehicles = () => api.get("/vehicles");
export const createVehicle = (data) => api.post("/vehicles", data);
export const markExit = (id) => api.put(`/vehicles/${id}/exit`);

// ✅ OCR Upload API
export const uploadOCR = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/ocr/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
