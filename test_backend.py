#!/usr/bin/env python3
# Test script to diagnose import/routing issues
import sys
sys.path.insert(0, 'backend')

try:
    print("Testing imports...")
    from app.main import app
    print("✓ Main app imported successfully")
    
    from app.engine.generator import generator
    print(f"✓ Generator imported: {type(generator)}")
    
    from app.engine.doe import generate_design
    print("✓ DOE engine imported")
    
    from app.engine.spc import analyze_spc
    print("✓ SPC engine imported")
    
    # Test FastAPI routes
    print("\nRegistered routes:")
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            print(f"  {route.methods} {route.path}")
    
    print("\n✓ All imports successful!")
    
except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
