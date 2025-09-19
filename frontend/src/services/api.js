import axios from "axios";

// Make sure this matches backend port
const API = "https://haycarb-vehicle-detector.onrender.com";

export const fetchVehicles = () => axios.get(`${API}/vehicles`);
export const createVehicle = (data) => axios.post(`${API}/vehicles`, data);
export const markExit = (id) => axios.put(`${API}/vehicles/${id}/exit`);
