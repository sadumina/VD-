import axios from "axios";

// ✅ Detect environment (Vite uses import.meta.env.MODE)
const API_BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:8000/api" // Local FastAPI backend
    : "https://haycarb-vehicle-detector.onrender.com/api"; // Render backend

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Get all vehicles
export const fetchVehicles = () => api.get("/vehicles");

// Create vehicle
export const createVehicle = (data) => api.post("/vehicles", data);

// Mark vehicle as exited
export const markExit = (id) => api.put(`/vehicles/${id}/exit`);
