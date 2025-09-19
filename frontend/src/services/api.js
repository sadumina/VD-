import axios from "axios";

const API = "https://haycarb-vehicle-detector.onrender.com/api";

// Get all vehicles
export const fetchVehicles = () => axios.get(`${API}/vehicles`);

// Create vehicle
export const createVehicle = (data) => axios.post(`${API}/vehicles`, data);

// Mark vehicle as exited
export const markExit = (id) => axios.put(`${API}/vehicles/${id}/exit`);
