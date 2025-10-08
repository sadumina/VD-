import axios from "axios";

// Detect environment: "development" (local) vs "production" (deployed)
const isDev = import.meta.env.MODE === "development";

// ✅ Base API URL
const API =
  import.meta.env.VITE_API_URL || // use .env if defined
  (isDev
    ? "http://localhost:8000"        // 👨‍💻 Local FastAPI
    : "https://vd-new.onrender.com"  // 🌍 Render backend
  );

// 🔹 Vehicle Endpoints
export const fetchVehicles = () => axios.get(`${API}/vehicles`);

export const createVehicle = (data) =>
  axios.post(`${API}/vehicles`, data);

export const markExit = (id) =>
  axios.put(`${API}/vehicles/${id}/exit`);

// 🔹 OCR Upload
export const uploadOCR = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post(`${API}/ocr/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
