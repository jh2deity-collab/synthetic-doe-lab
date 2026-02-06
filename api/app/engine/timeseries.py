"""
Time Series Analysis Engine for ARIMA and Prophet models
"""
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from pydantic import BaseModel


class TimeSeriesData(BaseModel):
    """Time series data input"""
    dates: Optional[List[str]] = None  # ISO format dates (optional for ARIMA)
    values: List[float]  # Time series values


class ARIMARequest(BaseModel):
    """Request model for ARIMA analysis"""
    data: TimeSeriesData
    p: int = 1  # AR order
    d: int = 1  # Differencing order
    q: int = 1  # MA order
    forecast_steps: int = 10  # Number of steps to forecast


class ARIMAResponse(BaseModel):
    """Response model for ARIMA analysis"""
    model_params: Dict[str, Any]
    aic: float
    bic: float
    forecast: List[float]
    forecast_ci_lower: List[float]
    forecast_ci_upper: List[float]
    residuals: List[float]
    fitted_values: List[float]


class ProphetRequest(BaseModel):
    """Request model for Prophet analysis"""
    data: TimeSeriesData
    forecast_periods: int = 30  # Number of periods to forecast
    seasonality_mode: str = 'additive'  # 'additive' or 'multiplicative'
    yearly_seasonality: bool = True
    weekly_seasonality: bool = True
    daily_seasonality: bool = False


class ProphetResponse(BaseModel):
    """Response model for Prophet analysis"""
    forecast: List[float]
    forecast_lower: List[float]
    forecast_upper: List[float]
    trend: List[float]
    dates: List[str]
    components: Dict[str, List[float]]


def fit_arima(request: ARIMARequest) -> ARIMAResponse:
    """
    Fit ARIMA model and generate forecasts
    """
    try:
        from statsmodels.tsa.arima.model import ARIMA
        
        # Prepare data
        values = np.array(request.data.values)
        
        # Fit ARIMA model
        model = ARIMA(values, order=(request.p, request.d, request.q))
        fitted_model = model.fit()
        
        # Generate forecast
        forecast_result = fitted_model.forecast(steps=request.forecast_steps)
        forecast_values = forecast_result.tolist() if hasattr(forecast_result, 'tolist') else [forecast_result]
        
        # Get confidence intervals
        forecast_obj = fitted_model.get_forecast(steps=request.forecast_steps)
        forecast_ci = forecast_obj.conf_int()
        
        # Get residuals and fitted values
        residuals = fitted_model.resid.tolist()
        fitted_values = fitted_model.fittedvalues.tolist()
        
        return ARIMAResponse(
            model_params={
                'ar_params': fitted_model.arparams.tolist() if len(fitted_model.arparams) > 0 else [],
                'ma_params': fitted_model.maparams.tolist() if len(fitted_model.maparams) > 0 else [],
                'sigma2': float(fitted_model.sigma2)
            },
            aic=float(fitted_model.aic),
            bic=float(fitted_model.bic),
            forecast=forecast_values,
            forecast_ci_lower=forecast_ci.iloc[:, 0].tolist(),
            forecast_ci_upper=forecast_ci.iloc[:, 1].tolist(),
            residuals=residuals,
            fitted_values=fitted_values
        )
    except Exception as e:
        raise ValueError(f"ARIMA fitting failed: {str(e)}")


def fit_prophet(request: ProphetRequest) -> ProphetResponse:
    """
    Fit Prophet model and generate forecasts
    """
    try:
        from prophet import Prophet
        
        # Prepare data in Prophet format
        if request.data.dates:
            df = pd.DataFrame({
                'ds': pd.to_datetime(request.data.dates),
                'y': request.data.values
            })
        else:
            # Generate sequential dates if not provided
            df = pd.DataFrame({
                'ds': pd.date_range(start='2020-01-01', periods=len(request.data.values), freq='D'),
                'y': request.data.values
            })
        
        # Initialize and fit Prophet model
        model = Prophet(
            seasonality_mode=request.seasonality_mode,
            yearly_seasonality=request.yearly_seasonality,
            weekly_seasonality=request.weekly_seasonality,
            daily_seasonality=request.daily_seasonality
        )
        model.fit(df)
        
        # Create future dataframe
        future = model.make_future_dataframe(periods=request.forecast_periods)
        
        # Generate forecast
        forecast = model.predict(future)
        
        # Extract components
        components = {}
        if 'trend' in forecast.columns:
            components['trend'] = forecast['trend'].tail(request.forecast_periods).tolist()
        if 'yearly' in forecast.columns:
            components['yearly'] = forecast['yearly'].tail(request.forecast_periods).tolist()
        if 'weekly' in forecast.columns:
            components['weekly'] = forecast['weekly'].tail(request.forecast_periods).tolist()
        
        # Get forecast values (only future periods)
        forecast_data = forecast.tail(request.forecast_periods)
        
        return ProphetResponse(
            forecast=forecast_data['yhat'].tolist(),
            forecast_lower=forecast_data['yhat_lower'].tolist(),
            forecast_upper=forecast_data['yhat_upper'].tolist(),
            trend=forecast_data['trend'].tolist(),
            dates=forecast_data['ds'].dt.strftime('%Y-%m-%d').tolist(),
            components=components
        )
    except Exception as e:
        raise ValueError(f"Prophet fitting failed: {str(e)}")
