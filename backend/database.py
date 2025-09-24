import os
import asyncio
import logging
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

# Create async Mongo client
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

def get_collection(name: str):
    return db[name]

# ✅ Test function to verify connection
async def test_connection():
    try:
        result = await db.command("ping")
        logging.info("✅ MongoDB connection successful:", result)
        print("✅ MongoDB connection successful:", result)
    except Exception as e:
        logging.error(f"❌ MongoDB connection failed: {e}")
        print(f"❌ MongoDB connection failed: {e}")

# Run test if executed directly
if __name__ == "__main__":
    asyncio.run(test_connection())
