import sys
import os

# Add project root to path for imports (Vercel cwd is root)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import your FastAPI app
from backend.app.main import app

# Vercel expects 'app' exported for ASGI
