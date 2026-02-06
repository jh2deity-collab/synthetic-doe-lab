
export type VariableType = 'continuous' | 'categorical' | 'discrete';

export interface Variable {
    name: string;
    type: VariableType;
    min?: number;
    max?: number;
    levels?: string | string[]; // Comma separated string for UI input or array for API
    color?: string;
}

export interface DesignConfig {
    name?: string;
    description?: string;
    strategy: string; // 'lhc' | 'factorial' | 'random'
    num_samples: number;
    variables: Variable[];
    method?: string; // legacy support if needed
    sampleSize?: number; // legacy support if needed
}

export interface SyntheticDataPayload {
    matrix?: Record<string, unknown>[]; // Added matrix
    designId?: string;
    variables?: Variable[]; // Optional now if matrix is used
    conditions?: Record<string, unknown>[];
    prompts?: {
        system?: string;
        user?: string;
    };
    context?: string; // Added context
    mock?: boolean; // Added mock
}

export interface SPCAnalysisPayload {
    data: Record<string, unknown>[] | number[]; // Support both Record array and number array
    target_variable?: string;
    specs?: {
        usl?: number;
        lsl?: number;
        target?: number;
    };
}

export interface ControlChartData {
    values: number[];
    mean: number;
    ucl: number;
    lcl: number;
}

export interface SPCResult {
    control_chart?: ControlChartData;
    histogram?: unknown;
    mean?: number;
    std_dev?: number;
    cp?: number;
    cpk?: number;
    [key: string]: unknown;
}

export interface AnalysisPayload {
    context: string;
    results: Record<string, unknown>[];
    mock: boolean;
}

// --- Statistics Types ---

export interface EstimationRequest {
    data: number[];
    confidence_level: number;
}

export interface EstimationResult {
    mean: number;
    std_dev: number;
    n: number;
    confidence_level: number;
    lower_bound: number;
    upper_bound: number;
    margin_of_error: number;
}

export interface EffectSizeRequest {
    group_a: number[];
    group_b: number[];
}

export interface EffectSizeResult {
    mean_a: number;
    mean_b: number;
    std_pooled: number;
    cohens_d: number;
    interpretation: string;
}

export interface AdvancedRequest {
    data: number[];
    prior_mean: number;
    prior_std: number;
}

export interface AdvancedResult {
    mle_mean: number;
    mle_std: number;
    map_mean: number;
    map_std: number;
    kde_x: number[];
    kde_y: number[];
}

