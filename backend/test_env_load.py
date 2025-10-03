import os
from pathlib import Path
from dotenv import load_dotenv

# Get current directory
current_dir = Path(__file__).parent
env_file = current_dir / '.env'

print(f"Current directory: {current_dir}")
print(f"Looking for .env at: {env_file}")
print(f".env exists: {env_file.exists()}")

if env_file.exists():
    print(f".env file size: {env_file.stat().st_size} bytes")
    # Try to read it
    with open(env_file, 'r') as f:
        print("\n.env contents:")
        print(f.read())

# Load it
load_dotenv(env_file)

print(f"\nMONGO_URL loaded: {os.getenv('MONGO_URL')}")
print(f"DB_NAME loaded: {os.getenv('DB_NAME')}")