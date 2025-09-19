// src/api.js

import axios from "axios";

const API_BASE = "https://haycarb-vehicle-detector.onrender.com/api";

export async function fetchVehicles() {
  const res = await axios.get(`${API_BASE}/vehicles`);
  return res.data;
}

export async function createVehicle(vehicleData) {
  const res = await axios.post(`${API_BASE}/vehicles`, vehicleData, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
}

export async function markVehicleExit(vehicleId) {
  const res = await axios.put(`${API_BASE}/vehicles/${vehicleId}/exit`);
  return res.data;
}
