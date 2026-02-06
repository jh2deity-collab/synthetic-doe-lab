
from app.engine.doe import generate_design, DesignRequest, Variable
import pytest

def test_lhc_design_generation():
    """
    Test Latin Hypercube Sampling generation.
    """
    req = DesignRequest(
        strategy="lhc",
        num_samples=5,
        variables=[
            Variable(name="Pressure", min=10, max=50),
            Variable(name="Temperature", min=200, max=300)
        ]
    )
    
    res = generate_design(req)
    
    assert res.num_runs == 5
    assert res.num_factors == 2
    assert len(res.matrix) == 5
    
    # Check bounds
    for row in res.matrix:
        assert 10 <= row["Pressure"] <= 50
        assert 200 <= row["Temperature"] <= 300

def test_random_design_generation():
    """
    Test Random Sampling generation.
    """
    req = DesignRequest(
        strategy="random",
        num_samples=10,
        variables=[
            Variable(name="X1", min=0, max=1)
        ]
    )
    res = generate_design(req)
    assert res.num_runs == 10
    assert len(res.matrix[0]) == 1
