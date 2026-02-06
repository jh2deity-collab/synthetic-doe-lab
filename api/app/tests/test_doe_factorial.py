
import pytest
from app.engine.doe import generate_design, DesignRequest, Variable

def test_full_factorial_basic():
    """
    Test a simple 2^2 factorial design.
    """
    req = DesignRequest(
        strategy="factorial",
        num_samples=10, # Should be ignored for factorial
        variables=[
            Variable(name="A", type="continuous", min=10, max=20),
            Variable(name="B", type="categorical", levels=["Red", "Blue"])
        ]
    )
    
    res = generate_design(req)
    
    assert res.strategy == "factorial"
    assert res.num_factors == 2
    # 2 levels for A (10, 20) * 2 levels for B (Red, Blue) = 4 runs
    assert res.num_runs == 4
    
    # Check content
    matrix = res.matrix
    # Check if (10, Red) exists
    assert any(d['A'] == 10 and d['B'] == "Red" for d in matrix)
    assert any(d['A'] == 20 and d['B'] == "Blue" for d in matrix)
