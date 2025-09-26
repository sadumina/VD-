import axios from "axios";

// Base API URL (from env or default local FastAPI backend)
const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

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
