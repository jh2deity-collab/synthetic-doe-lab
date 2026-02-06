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
# FastAPI backend for Synthetic DOE Lab
# Version: 2024-02-06-v2 (ARIMA fix applied)
app = FastAPI(
    title="Synthetic DOE Lab API",
    description="API for Smart Design of Experiments and Synthetic Data Generation",
    version="0.1.0",
    # root_path="/api" if os.getenv("VERCEL") else "",  # Commented out to debug raw path handling
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
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def debug_middleware(request: Request, call_next):
    # CRITICAL Debugging: Intercept specific path to show what the server sees
    if request.url.path.endswith("/debug_probe"):
        return JSONResponse({
            "scope_path": request.scope.get("path"),
            "scope_root_path": request.scope.get("root_path"),
            "method": request.method,
            "headers": dict(request.headers),
            "fastapi_root_path": app.root_path,
        })
    
    # Handle CORS preflight manually if needed (Double safety)
    if request.method == "OPTIONS":
        response = JSONResponse(content={"message": "CORS Preflight Allowed"})
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "POST, GET, DELETE, PUT, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

    try:
        response = await call_next(request)
        return response
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "Middleware Exception", "detail": str(e)})

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

# --- Statistical Analysis Endpoints ---
from .engine.stats import (
    calculate_estimation, EstimationRequest, EstimationResult,
    calculate_effect_size, EffectSizeRequest, EffectSizeResult,
    calculate_advanced_estimation, AdvancedRequest, AdvancedResult
)

@app.post("/stats/estimation", response_model=EstimationResult)
def get_estimation(request: EstimationRequest):
    """
    Calculates Point & Interval Estimation (Confidence Interval).
    """
    try:
        return calculate_estimation(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stats/effect-size", response_model=EffectSizeResult)
def get_effect_size(request: EffectSizeRequest):
    """
    Calculates Effect Size (Cohen's d).
    """
    try:
        return calculate_effect_size(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stats/advanced", response_model=AdvancedResult)
def get_advanced_estimation(request: AdvancedRequest):
    """
    Calculates MLE, MAP, and KDE for advanced parameter estimation.
    """
    try:
        return calculate_advanced_estimation(request)
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

@app.options("/spc")
def spc_options():
    """
    Explicit OPTIONS handler for SPC endpoint to avoid 405.
    """
    return {"status": "ok", "allowed": ["POST", "OPTIONS"]}

    """
    Debug GET handler for SPC endpoint.
    """
    return {"status": "debug", "message": "SPC endpoint is reachable. Use POST to perform analysis."}

# Time Series Analysis Endpoints
from .engine.timeseries import (
    fit_arima, fit_prophet,
    ARIMARequest, ARIMAResponse,
    ProphetRequest, ProphetResponse
)

@app.post("/arima", response_model=ARIMAResponse)
def perform_arima_analysis(request: ARIMARequest):
    """
    Performs ARIMA time series analysis and forecasting.
    """
    try:
        return fit_arima(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/prophet", response_model=ProphetResponse)
def perform_prophet_analysis(request: ProphetRequest):
    """
    Performs Prophet time series analysis and forecasting.
    """
    try:
        return fit_prophet(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
