import axios from "axios";

// Detect environment: "development" (local) vs "production" (deployed)
const isDev = import.meta.env.MODE === "development";

// Base API URL
const API =
  import.meta.env.VITE_API_URL || // ✅ If you define one in .env
  (isDev
    ? "http://localhost:8000/api" // 👨‍💻 Local FastAPI
    : "https://vd-new.onrender.com/api"); // 🌍 Render backend

// 🔹 Vehicle Endpoints
export const fetchVehicles = () => axios.get(`${API}/vehicles`);

export const createVehicle = (data) =>
  axios.post(`${API}/vehicles`, data);

export const markExit = (id) =>
  axios.put(`${API}/vehicles/${id}/exit`);

// 🔹 OCR Upload (Mistral OCR through FastAPI)
export const uploadOCR = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post(`${API}/ocr/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
