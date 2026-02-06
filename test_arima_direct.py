# Force module reload check
import sys
if 'api.app.engine.timeseries' in sys.modules:
    print("FOUND OLD MODULE IN CACHE")
    del sys.modules['api.app.engine.timeseries']
else:
    print("Module not in cache")

from api.app.engine.timeseries import fit_arima, ARIMARequest, TimeSeriesData

# Test ARIMA
request = ARIMARequest(
    data=TimeSeriesData(values=[10, 12, 13, 15, 14, 16, 18, 17, 19, 21]),
    p=1, d=1, q=1,
    forecast_steps=5
)

try:
    result = fit_arima(request)
    print("✅ SUCCESS!")
    print(f"AIC: {result.aic}")
    print(f"BIC: {result.bic}")
    print(f"Forecast: {result.forecast}")
except Exception as e:
    print(f"❌ ERROR: {e}")
