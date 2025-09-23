# 🚗 Vehicle Detector (VD) – Entry/Exit Management System

A full-stack **Vehicle Entry–Exit Management System** built with **FastAPI**, **MongoDB Atlas**, and **React (Vite + Ant Design)**.  
The system is designed for **Haycarb PLC** to manage and monitor vehicle entry and exit efficiently.  

---

## ✨ Features
- 🔑 Role-based dashboard (Admin, Manager, Security, Viewer)
- 🚙 Vehicle entry and exit logging
- 🕒 Duration calculation (entry/exit times)
- 📊 Analytics dashboard (KPI cards, charts, filters)
- 📄 Export reports as **PDF/CSV**
- 📷 Container ID & vehicle type detection
- 🌐 Responsive UI with Ant Design + Tailwind styles
- ⚡ FastAPI backend with MongoDB Atlas
- 🐳 Dockerized deployment (backend + frontend)

---

## 🛠️ Tech Stack
**Frontend**
- React (Vite, Ant Design, Tailwind-like CSS)
- jsPDF + autoTable (PDF exports)
- Day.js (date/time handling)

**Backend**
- Python FastAPI
- MongoDB Atlas (Motor async driver)
- Uvicorn

**Deployment**
- Render (Backend)
- Vercel (Frontend)
- Docker Hub Images

---

## 📦 Docker Images
- **Backend:** [`sadumina/vd-backend`](https://hub.docker.com/r/sadumina/vd-backend)  
- **Frontend:** [`sadumina/vd-frontend`](https://hub.docker.com/r/sadumina/vd-frontend)

---

## 🚀 Running Locally with Docker

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/vehicle-detector.git
cd vehicle-detector
