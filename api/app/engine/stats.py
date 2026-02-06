import numpy as np
from scipy import stats
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

# --- Data Models ---

class EstimationRequest(BaseModel):
    data: List[float]
    confidence_level: float = 0.95

class EstimationResult(BaseModel):
    mean: float
    std_dev: float
    n: int
    confidence_level: float
    lower_bound: float
    upper_bound: float
    margin_of_error: float

class EffectSizeRequest(BaseModel):
    group_a: List[float]
    group_b: List[float]

class EffectSizeResult(BaseModel):
    mean_a: float
    mean_b: float
    std_pooled: float
    cohens_d: float
    interpretation: str

class AdvancedRequest(BaseModel):
    data: List[float]
    prior_mean: float
    prior_std: float

class AdvancedResult(BaseModel):
    mle_mean: float
    mle_std: float
    map_mean: float
    map_std: float # In this simple case, we might just return the updated posterior params
    kde_x: List[float]
    kde_y: List[float]

# --- Calculation Functions ---

def calculate_estimation(request: EstimationRequest) -> EstimationResult:
    data = np.array(request.data)
    n = len(data)
    if n <= 1:
        raise ValueError("Data must have at least 2 points for interval estimation.")

    mean = np.mean(data)
    std_dev = np.std(data, ddof=1) # Sample standard deviation
    
    # Calculate Confidence Interval using t-distribution
    # degrees of freedom = n - 1
    t_score = stats.t.ppf((1 + request.confidence_level) / 2, df=n-1)
    margin_of_error = t_score * (std_dev / np.sqrt(n))
    
    return EstimationResult(
        mean=float(mean),
        std_dev=float(std_dev),
        n=n,
        confidence_level=request.confidence_level,
        lower_bound=float(mean - margin_of_error),
        upper_bound=float(mean + margin_of_error),
        margin_of_error=float(margin_of_error)
    )

def calculate_effect_size(request: EffectSizeRequest) -> EffectSizeResult:
    a = np.array(request.group_a)
    b = np.array(request.group_b)
    
    n1, n2 = len(a), len(b)
    if n1 < 2 or n2 < 2:
        raise ValueError("Each group must have at least 2 data points.")

    mean_a = np.mean(a)
    mean_b = np.mean(b)
    var_a = np.var(a, ddof=1)
    var_b = np.var(b, ddof=1)
    
    # Calculate Pooled Standard Deviation
    # s_pooled = sqrt( ((n1-1)s1^2 + (n2-1)s2^2) / (n1+n2-2) )
    pooled_var = ((n1 - 1) * var_a + (n2 - 1) * var_b) / (n1 + n2 - 2)
    std_pooled = np.sqrt(pooled_var)
    
    if std_pooled == 0:
        cohens_d = 0.0 # Avoid division by zero
    else:
        cohens_d = (mean_a - mean_b) / std_pooled
        
    # Interpretation
    abs_d = abs(cohens_d)
    if abs_d < 0.2:
        interpretation = "Negligible effect"
    elif abs_d < 0.5:
        interpretation = "Small effect"
    elif abs_d < 0.8:
        interpretation = "Medium effect"
    else:
        interpretation = "Large effect"
        
    return EffectSizeResult(
        mean_a=float(mean_a),
        mean_b=float(mean_b),
        std_pooled=float(std_pooled),
        cohens_d=float(cohens_d),
        interpretation=interpretation
    )

def calculate_advanced_estimation(request: AdvancedRequest) -> AdvancedResult:
    data = np.array(request.data)
    n = len(data)
    if n < 2:
        raise ValueError("Data must have at least 2 points.")
    
    # 1. MLE (Maximum Likelihood Estimation) for Normal Distribution
    # MLE for mean is sample mean, MLE for std is sample std (usually biased, but we utilize ddof=0 or 1 depending on def)
    # For MLE proper, denominator is n, but let's stick to standard stats conventions if needed. 
    # Usually MLE Estimate for sigma^2 is sum(x-mu)^2 / n.
    mle_mean = np.mean(data)
    mle_std = np.std(data, ddof=0) # MLE standard deviation uses n, not n-1
    
    # 2. MAP (Maximum A Posteriori)
    # Model: Data ~ N(mu, sigma_data^2 known estimate), Prior ~ N(mu_0, sigma_0^2)
    # For simplicity, we assume sigma_data is fixed to the *observed* MLE sigma for this calculation step 
    # to show the "pull" of the prior on the mean.
    
    sigma_data = mle_std 
    # Avoid division by zero if perfect data
    if sigma_data == 0: sigma_data = 1e-9
    
    mu_prior = request.prior_mean
    sigma_prior = request.prior_std
    
    # MAP estimate for mean (Conjugate prior for Gaussian mean with known variance)
    # mu_map = ( (mu_prior / sigma_prior^2) + (sum(data) / sigma_data^2) ) / ( (1/sigma_prior^2) + (n/sigma_data^2) )
    # This formula balances the prior and the likelihood.
    
    # Precision (inverse variance)
    prec_prior = 1 / (sigma_prior**2)
    prec_data = n / (sigma_data**2)
    prec_posterior = prec_prior + prec_data
    
    mu_map = ((mu_prior * prec_prior) + (mle_mean * prec_data)) / prec_posterior
    sigma_map = np.sqrt(1 / prec_posterior) # Standard deviation of the posterior distribution for the mean
    
    # 3. KDE (Kernel Density Estimation)
    kde = stats.gaussian_kde(data)
    x_min = data.min() - 3 * data.std()
    x_max = data.max() + 3 * data.std()
    x_grid = np.linspace(x_min, x_max, 200)
    y_grid = kde(x_grid)
    
    return AdvancedResult(
        mle_mean=float(mle_mean),
        mle_std=float(mle_std),
        map_mean=float(mu_map),
        map_std=float(sigma_map),
        kde_x=x_grid.tolist(),
        kde_y=y_grid.tolist()
    )
