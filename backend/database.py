import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def test_connection():
    mongo_url = os.getenv("MONGO_URL")
    print(f"Testing connection to: {mongo_url}\n")
    
    try:
        client = AsyncIOMotorClient(mongo_url)
        # Test the connection
        await client.admin.command('ping')
        print("✅ Successfully connected to MongoDB!")
        
        # List databases
        dbs = await client.list_database_names()
        print(f"\nAvailable databases: {dbs}")
        
        client.close()
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())