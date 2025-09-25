FROM python:3.11-slim

WORKDIR /app

# System dependencies for OpenCV + EasyOCR
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for caching)
COPY requirements.txt .

# ✅ Install CPU-only PyTorch + deps (lighter & faster)
RUN pip install --no-cache-dir -r requirements.txt \
    && rm -rf /root/.cache/pip /tmp/*

# Copy backend code
COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
