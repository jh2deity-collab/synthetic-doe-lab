
from typing import List, Dict, Union, Literal
import numpy as np
import pandas as pd
from scipy.stats import qmc
from pydantic import BaseModel, Field

class Variable(BaseModel):
    """
    Defines an input variable for the experiment.
    """
    name: str
    type: Literal['continuous', 'categorical', 'discrete'] = 'continuous'
    min: float = 0.0
    max: float = 1.0
    # For categorical/discrete
    levels: Union[List[str], List[float]] = []

class DesignRequest(BaseModel):
    """
    Request model for generating a design matrix.
    """
    strategy: Literal['lhc', 'factorial', 'random'] = 'lhc'
    num_samples: int = Field(10, ge=1, description="Number of samples for Space-Filling algorithms")
    variables: List[Variable]
    
class DesignResponse(BaseModel):
    """
    Response model containing the design matrix.
    """
    strategy: str
    num_factors: int
    num_runs: int
    matrix: List[Dict[str, Union[float, str]]] # Records format

def generate_design(request: DesignRequest) -> DesignResponse:
    """
    Generates a Design of Experiments (DOE) matrix based on the strategy.
    
    Args:
        request: The design configuration including variables and strategy.
        
    Returns:
        DesignResponse with the populated matrix.
    """
    variables = request.variables
    n_vars = len(variables)
    
    # 1. Continuous Variables Handling
    continuous_vars = [v for v in variables if v.type == 'continuous']
    # Simplified MVP: Handling continuous variables primarily for LHC
    
    bounds_min = [v.min for v in continuous_vars]
    bounds_max = [v.max for v in continuous_vars]
    names = [v.name for v in continuous_vars]
    
    df = pd.DataFrame()

    if request.strategy == 'lhc':
        # Latin Hypercube Sampling (Space-Filling)
        sampler = qmc.LatinHypercube(d=len(continuous_vars))
        sample = sampler.random(n=request.num_samples)
        
        # Scale samples to bounds
        scaled_sample = qmc.scale(sample, bounds_min, bounds_max)
        
        df = pd.DataFrame(scaled_sample, columns=names)

    elif request.strategy == 'random':
        # Simple Random Sampling
        data = {}
        for i, var in enumerate(continuous_vars):
            data[var.name] = np.random.uniform(var.min, var.max, request.num_samples)
        df = pd.DataFrame(data)

    elif request.strategy == 'factorial':
        import itertools
        
        # Prepare levels for each variable
        factors = []
        factor_names = []
        
        for var in variables:
            factor_names.append(var.name)
            if var.type == 'continuous':
                # 2-level factorial (Min/Max)
                factors.append([var.min, var.max])
            elif var.levels:
                # Use defined levels for categorical/discrete
                factors.append(var.levels)
            else:
                # Fallback for empty categorical
                factors.append(["Level_A", "Level_B"])
                
        # Generate all combinations
        combinations = list(itertools.product(*factors))
        df = pd.DataFrame(combinations, columns=factor_names)

    # Rounding for cleanliness
    # Only round numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].round(4)
    
    return DesignResponse(
        strategy=request.strategy,
        num_factors=n_vars,
        num_runs=len(df),
        matrix=df.to_dict(orient='records')
    )
