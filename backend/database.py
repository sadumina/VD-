import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# ✅ Load variables from .env
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

if not MONGO_URL:
    raise ValueError("❌ MONGO_URL is missing. Please set it in .env or environment variables.")
if not DB_NAME:
    raise ValueError("❌ DB_NAME is missing. Please set it in .env or environment variables.")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

def get_collection(name: str):
    return db[name]
