
import pytest
from app.engine.generator import generator, GenerationRequest

def test_mock_generation():
    """
    Test that the generator produces output in mock mode without needing API key.
    """
    matrix = [
        {"Pressure": 10, "Temperature": 100},
        {"Pressure": 20, "Temperature": 200}
    ]
    
    req = GenerationRequest(
        matrix=matrix,
        context="Test Context",
        mock=True
    )
    
    res = generator.generate_batch(req)
    
    assert len(res.data) == 2
    assert "synthetic_output" in res.data[0]
    # Check for flattened structure
    assert "Response" in res.data[0]
    assert "Observation" in res.data[0]
    assert isinstance(res.data[0]["Response"], (int, float))
    assert res.data[0]["Pressure"] == 10 # Preserves original data logic
