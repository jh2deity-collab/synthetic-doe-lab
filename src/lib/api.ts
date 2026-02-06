
import { DesignConfig, SyntheticDataPayload, SPCAnalysisPayload, AnalysisPayload } from '@/types';

const getApiBaseUrl = () => {
    // 1. If explicitly set in environment variables, use it
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // 2. Client-side: Use relative path (handled by Next.js Rewrites or Nginx)
    if (typeof window !== 'undefined') {
        return '';
    }

    // 3. Server-side (SSR): Must use absolute URL to localhost (Backend)
    return 'http://127.0.0.1:8000';
};

const API_BASE_URL = getApiBaseUrl();

export const generateDesign = async (config: DesignConfig) => {
    try {
        console.log(`[API] Requesting: ${API_BASE_URL}/api/design`);
        const res = await fetch(`${API_BASE_URL}/api/design`, {
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
        console.log(`[API] Requesting: ${API_BASE_URL}/api/generate`);
        const res = await fetch(`${API_BASE_URL}/api/generate`, {
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
        console.log(`[API] Requesting: ${API_BASE_URL}/api/spc`);
        const res = await fetch(`${API_BASE_URL}/api/spc`, {
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
        console.log(`[API] Requesting: ${API_BASE_URL}/api/analysis`, payload);
        const res = await fetch(`${API_BASE_URL}/api/analysis`, {
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
