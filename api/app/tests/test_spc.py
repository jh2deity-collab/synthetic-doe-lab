
import pytest
import pandas as pd
import numpy as np
from app.engine.spc import analyze_spc, SPCAnalysisRequest

def test_control_chart_calculation():
    """
    Test X-bar control limits calculation.
    """
    # Create synthetic stable data: Mean=10, Std=1
    np.random.seed(42)
    data = [{"Yield": x} for x in np.random.normal(10, 1, 100)]
    
    req = SPCAnalysisRequest(
        data=data,
        target_variable="Yield"
    )
    
    result = analyze_spc(req)
    
    cc = result.control_chart
    assert cc is not None
    assert 9.5 < cc["mean"] < 10.5
    assert cc["ucl"] > cc["mean"]
    assert cc["lcl"] < cc["mean"]
    assert len(cc["values"]) == 100

def test_pareto_calculation():
    """
    Test Pareto calculation logic.
    """
    data = [
        {"Defect": "Scratch"}, {"Defect": "Scratch"}, {"Defect": "Scratch"},
        {"Defect": "Dent"}, {"Defect": "Dent"},
        {"Defect": "Stain"}
    ]
    
    req = SPCAnalysisRequest(
        data=data,
        target_variable="None",
        factor_variable="Defect"
    )
    
    result = analyze_spc(req)
    
    pareto = result.pareto
    assert pareto["labels"] == ["Scratch", "Dent", "Stain"]
    assert pareto["counts"] == [3, 2, 1]
    # Cumulative: 3/6=50%, 5/6=83%, 6/6=100%
    assert pareto["cumulative"][0] == 50.0
    assert pareto["cumulative"][-1] == 100.0
