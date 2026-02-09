import uvicorn
import os
import sys
from api.app.main import app

if __name__ == "__main__":
    # Ensure the script can find its dependencies when frozen
    if getattr(sys, 'frozen', False):
        # We are running in a bundle
        bundle_dir = sys._MEIPASS
    else:
        # We are running in a normal Python environment
        bundle_dir = os.path.dirname(os.path.abspath(__file__))

    print(f"Starting Synthetic DOE Lab Backend from: {bundle_dir}")
    # Run the FastAPI server
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
