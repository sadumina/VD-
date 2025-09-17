import asyncio
from database import get_collection

async def test():
    col = get_collection("vehicles")
    # Insert a test document
    doc = await col.insert_one({"check": "ping"})
    print("✅ Inserted:", doc.inserted_id)

    # Find it back
    result = await col.find_one({"_id": doc.inserted_id})
    print("✅ Found:", result)

asyncio.run(test())
