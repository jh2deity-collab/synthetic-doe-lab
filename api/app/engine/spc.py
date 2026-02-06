
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Union
from pydantic import BaseModel

class SPCAnalysisRequest(BaseModel):
    data: List[Dict[str, Any]]
    target_variable: str # The column to analyze (e.g. "Yield", "Diameter")
    factor_variable: str = None # For Pareto/Stratification
    
class SPCResult(BaseModel):
    control_chart: Dict[str, Any] = {}
    histogram: Dict[str, Any] = {}
    pareto: Dict[str, Any] = {}
    # Scatter handled by existing logic, Fishbone by frontend structure

def calculate_control_limits(data: pd.Series, sigma: float = 3.0):
    mean = data.mean()
    std = data.std()
    ucl = mean + sigma * std
    lcl = mean - sigma * std
    return {"mean": mean, "ucl": ucl, "lcl": lcl, "values": data.tolist()}

def calculate_pareto(df: pd.DataFrame, category_col: str):
    if category_col not in df.columns:
        return {}
    counts = df[category_col].value_counts()
    cumulative = counts.cumsum() / counts.sum() * 100
    return {
        "labels": counts.index.tolist(),
        "counts": counts.tolist(),
        "cumulative": cumulative.tolist()
    }

def analyze_spc(request: SPCAnalysisRequest) -> SPCResult:
    df = pd.DataFrame(request.data)
    result = SPCResult()
    
    # 1. Control Chart (I-MR or X-bar assumption treated as individuals for synthetic)
    if request.target_variable in df.columns:
        # Assuming numeric
        try:
            series = pd.to_numeric(df[request.target_variable], errors='coerce').dropna()
            result.control_chart = calculate_control_limits(series)
            
            # 2. Histogram
            hist, bins = np.histogram(series, bins='auto')
            result.histogram = {"counts": hist.tolist(), "bins": bins.tolist()}
        except:
            pass
            
    # 3. Pareto (Requires a categorical factor or 'Defect Type')
    # If no factor provided, try to find a categorical one or user specified
    cat_col = request.factor_variable
    if cat_col and cat_col in df.columns:
         result.pareto = calculate_pareto(df, cat_col)
         
    return result
