from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from .engine.doe import generate_design, DesignRequest, DesignResponse
from typing import List, Dict, Any
from dotenv import load_dotenv
import os

load_dotenv(".env.local") # Load user-preferred local env file
load_dotenv() # Fallback to .env

# Config reload trigger (Mock Updated)
app = FastAPI(
    title="Synthetic DOE Lab API",
    description="API for Smart Design of Experiments and Synthetic Data Generation",
    version="0.1.0",
    root_path="/api" if os.getenv("VERCEL") else "",  # Dynamic root_path: /api for Vercel, empty for local
    docs_url="/docs",
    openapi_url="/openapi.json",
    redirect_slashes=False  # CRITICAL: Prevent 307 redirects which change method to GET
)

from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(405)
async def custom_405_handler(request: Request, exc):
    return JSONResponse(
        status_code=405,
        content={
            "error": "Method Not Allowed",
            "detail": f"Method {request.method} not allowed for URL {request.url.path}",
            "allowed_methods": ["POST"] if request.url.path.endswith(("/design", "/generate", "/analysis", "/spc")) else ["GET"],
            "debug_info": {
                "url": str(request.url),
                "base_url": str(request.base_url),
                "method": request.method,
                "headers": dict(request.headers)
            }
        },
    )

# CORS Setup
# CORS Setup - Reverted to allow all for troubleshooting connectivity
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    """
    Health check endpoint.
    """
    return {"status": "ok", "service": "Synthetic DOE Lab Backend"}

@app.api_route("/debug_request", methods=["GET", "POST", "PUT", "DELETE"])
def debug_request(request: Request):
    return {
        "url": str(request.url),
        "base_url": str(request.base_url),
        "path": request.url.path,
        "root_path": request.scope.get("root_path"),
        "headers": dict(request.headers),
        "method": request.method
    }

@app.post("/design", response_model=DesignResponse)
def create_design(request: DesignRequest):
    """
    Generates a DOE Design Matrix based on inputs.
    """
    try:
        if not request.variables:
            raise HTTPException(status_code=400, detail="No variables provided.")
        
        result = generate_design(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from .engine.generator import generator, GenerationRequest, GenerationResponse

@app.post("/generate", response_model=GenerationResponse)
def generate_data(request: GenerationRequest):
    """
    Generates synthetic data based on the provided design matrix.
    """
    try:
        return generator.generate_batch(request)
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

class AnalysisRequest(BaseModel):
    context: str
    results: List[Dict[str, Any]]
    mock: bool = False

class AnalysisResponse(BaseModel):
    analysis_html: str

@app.post("/analysis", response_model=AnalysisResponse)
def generate_analysis_summary(request: AnalysisRequest):
    """
    Generates an expert analysis text for the report.
    """
    try:
        analysis = generator.generate_report_analysis(request.context, request.results, request.mock)
        return AnalysisResponse(analysis_html=analysis)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



from .engine.spc import analyze_spc, SPCAnalysisRequest, SPCResult

@app.post("/spc", response_model=SPCResult)
def perform_spc_analysis(request: SPCAnalysisRequest):
    """
    Performs Statistical Process Control analysis (Control Charts, Pareto, etc.)
    """
    try:
        return analyze_spc(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
