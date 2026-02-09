
import {
    DesignConfig,
    SyntheticDataPayload,
    SPCAnalysisPayload,
    AnalysisPayload,
    EstimationRequest,
    EstimationResult,
    EffectSizeRequest,
    EffectSizeResult,
    AdvancedRequest,
    AdvancedResult,
    ARIMARequest,
    ARIMAResult,
    ProphetRequest,
    ProphetResult
} from '@/types';

const getApiBaseUrl = () => {
    // 1. If explicitly set in environment variables, use it
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // 2. Desktop/Client-side: For packaged app, always use local backend
    if (typeof window !== 'undefined') {
        return 'http://127.0.0.1:8000';
    }

    // 3. Server-side (SSR) if any: Must use absolute URL
    return 'http://127.0.0.1:8000';
};

const API_BASE_URL = getApiBaseUrl();

export const generateDesign = async (config: DesignConfig) => {
    try {
        console.log(`[API] Requesting: ${API_BASE_URL}/design`);
        const res = await fetch(`${API_BASE_URL}/design`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error(`[API] Error /design (${res.status}):`, errText);
            throw new Error(`API Error ${res.status}: ${errText}`);
        }

        return await res.json();
    } catch (error) {
        console.error("[API] Exception:", error);
        throw error;
    }
};

export const generateSyntheticData = async (payload: SyntheticDataPayload) => {
    try {
        console.log(`[API] Requesting: ${API_BASE_URL}/generate`);
        const res = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error(`[API] Error /generate (${res.status}):`, errText);
            throw new Error(`API Error ${res.status}: ${errText}`);
        }

        return await res.json();
    } catch (error) {
        console.error("[API] Exception:", error);
        throw error;
    }
};

export const performSPCAnalysis = async (payload: SPCAnalysisPayload) => {
    try {
        console.log(`[API] Requesting: ${API_BASE_URL}/spc`);
        const res = await fetch(`${API_BASE_URL}/spc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error(`[API] Error /spc (${res.status}):`, errText);
            throw new Error(`API Error ${res.status}: ${errText}`);
        }

        return await res.json();
    } catch (error) {
        console.error("[API] Exception:", error);
        throw error;
    }
};

export const generateExpertAnalysis = async (payload: AnalysisPayload) => {
    try {
        console.log(`[API] Requesting: ${API_BASE_URL}/analysis`, payload);
        const res = await fetch(`${API_BASE_URL}/analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error(`[API] Error /analysis (${res.status}):`, errText);
            throw new Error(`API Error ${res.status}: ${errText}`);
        }

        return await res.json();
    } catch (error) {
        console.error("[API] Exception:", error);
        throw error;
    }
};

export const calculateEstimation = async (payload: EstimationRequest): Promise<EstimationResult> => {
    try {
        const res = await fetch(`${API_BASE_URL}/stats/estimation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`API Error: ${await res.text()}`);
        return await res.json();
    } catch (error) {
        console.error("[API] Exception:", error);
        throw error;
    }
};

export const calculateEffectSize = async (payload: EffectSizeRequest): Promise<EffectSizeResult> => {
    try {
        const res = await fetch(`${API_BASE_URL}/stats/effect-size`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`API Error: ${await res.text()}`);
        return await res.json();
    } catch (error) {
        console.error("[API] Exception:", error);
        throw error;
    }
};

export const calculateAdvancedEstimation = async (payload: AdvancedRequest): Promise<AdvancedResult> => {
    try {
        const res = await fetch(`${API_BASE_URL}/stats/advanced`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`API Error: ${await res.text()}`);
        return await res.json();
    } catch (error) {
        console.error("[API] Exception:", error);
        throw error;
    }
};

// --- Time Series Analysis ---

export const performARIMAAnalysis = async (payload: ARIMARequest): Promise<ARIMAResult> => {
    try {
        const res = await fetch(`${API_BASE_URL}/arima`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "ARIMA 분석 실패");
        }
        return await res.json();
    } catch (error) {
        console.error("[API] ARIMA Exception:", error);
        throw error;
    }
};

export const performProphetAnalysis = async (payload: ProphetRequest): Promise<ProphetResult> => {
    try {
        const res = await fetch(`${API_BASE_URL}/prophet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "Prophet 분석 실패");
        }
        return await res.json();
    } catch (error) {
        console.error("[API] Prophet Exception:", error);
        throw error;
    }
};
