import os
import sys
from fastapi import FastAPI, Request

# Add api directory to Python path
current_dir = os.path.dirname(__file__)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Try to import the FastAPI app
try:
    from app.main import app
    print("✓ Successfully imported app")
except Exception as e:
    print(f"✗ Import failed: {e}")
    # Create fallback app with error details
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    
    app = FastAPI()
    
    # Add CORS to fallback app so browser can read the error
    from fastapi.middleware.cors import CORSMiddleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def error_handler(path: str, request: Request):
        return JSONResponse({
            "error": "Backend import failed",
            "detail": str(e),
            "type": type(e).__name__,
            "sys_path": sys.path,
            "cwd": os.getcwd(),
            "path_requested": path,
            "method": request.method
        }, status_code=500)

# CRITICAL: Export handler for Vercel
from mangum import Mangum
handler = Mangum(app, lifespan="off")
