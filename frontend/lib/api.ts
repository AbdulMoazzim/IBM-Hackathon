// lib/api.ts
// API client utilities and helper functions for calling backend

import { ApiResponse, PaginatedResponse } from './types';

/**
 * API CLIENT CONFIGURATION
 * 
 * This file handles all HTTP communication with the backend.
 * In production, update BASE_URL with your actual API server.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface RequestOptions extends RequestInit {
    params?: Record<string, string | number | boolean>;
    headers?: Record<string, string>;
}

/**
 * Generic fetch wrapper with error handling
 * Automatically includes authorization token and handles responses
 */
async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<ApiResponse<T>> {
    const { params, headers = {}, ...fetchOptions } = options;

    // Build URL with query parameters
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
        });
    }

    // Get auth token from localStorage (if exists)
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    // Build headers
    const finalHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    if (token) {
        finalHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url.toString(), {
            ...fetchOptions,
            headers: finalHeaders,
        });

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        let data;

        if (contentType?.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { success: response.ok, data: text };
        }

        // Handle authentication errors
        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }

        return {
            success: response.ok,
            data: data.data,
            error: !response.ok ? data.error : undefined,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Unknown error',
                code: 'NETWORK_ERROR',
            },
            timestamp: new Date().toISOString(),
        };
    }
}

/* ============================================================================
   SCAN ENDPOINTS
   ============================================================================ */

export const scanAPI = {
    /**
     * GET /api/scans
     * Fetch all scans for the current user
     * 
     * BACKEND INTEGRATION:
     * - Authenticate user from token
     * - Return only user's scans
     * - Filter by status, date, etc.
     * - Paginate results (default: 20 per page)
     */
    getAll: async (page = 1, limit = 20) =>
        apiRequest('/scans', {
            params: { page, limit },
        }),

    /**
     * GET /api/scans/:id
     * Fetch single scan details
     */
    getById: async (scanId: string) =>
        apiRequest(`/scans/${scanId}`),

    /**
     * POST /api/scans
     * Create a new scan
     * 
     * BACKEND INTEGRATION POINT:
     * 1. Extract scan configuration from request body
     * 2. Download/access application code:
     *    - If URL: Start live scanning with DAST tools
     *    - If GitHub: Clone repo with access token
     *    - If ZIP: Extract and analyze locally
     * 3. Run discovery phase (detect tech stack)
     * 4. Queue SAST analysis job
     * 5. Return scan ID immediately (async processing)
     * 
     * Frontend will poll /api/scans/:id to check status
     */
    create: async (scanData: {
        applicationName: string;
        inputType: 'url' | 'github' | 'zip';
        applicationUrl?: string;
        gitHubRepo?: string;
        gitHubBranch?: string;
        zipFile?: File;
    }) => {
        const formData = new FormData();
        formData.append('applicationName', scanData.applicationName);
        formData.append('inputType', scanData.inputType);

        if (scanData.applicationUrl) {
            formData.append('applicationUrl', scanData.applicationUrl);
        }
        if (scanData.gitHubRepo) {
            formData.append('gitHubRepo', scanData.gitHubRepo);
            formData.append('gitHubBranch', scanData.gitHubBranch || 'main');
        }
        if (scanData.zipFile) {
            formData.append('zipFile', scanData.zipFile);
        }

        return apiRequest('/scans', {
            method: 'POST',
            headers: { 'Content-Type': 'multipart/form-data' },
            body: formData,
        });
    },

    /**
     * POST /api/scans/:id/start
     * Start the security scan
     * 
     * BACKEND: Trigger background job for:
     * - SAST analysis
     * - Dependency scanning
     * - Secrets detection
     * - DAST (for live URLs)
     * - LLM analysis of findings
     * - Verification tests
     */
    start: async (scanId: string) =>
        apiRequest(`/scans/${scanId}/start`, { method: 'POST' }),

    /**
     * DELETE /api/scans/:id
     * Delete a scan and its results
     */
    delete: async (scanId: string) =>
        apiRequest(`/scans/${scanId}`, { method: 'DELETE' }),
};

/* ============================================================================
   FINDINGS ENDPOINTS
   ============================================================================ */

export const findingsAPI = {
    /**
     * GET /api/scans/:id/findings
     * Get all findings for a scan
     * 
     * BACKEND: Return findings with all metadata:
     * - Severity classification (critical/high/medium/low)
     * - Verification status (verified/likely/potential/informational)
     * - Evidence and proof of vulnerability
     * - Recommended fixes with code examples
     */
    getByScanId: async (scanId: string, filters?: any) =>
        apiRequest(`/scans/${scanId}/findings`, {
            params: filters,
        }),

    /**
     * GET /api/scans/:id/findings/:findingId
     * Get detailed finding information
     */
    getById: async (scanId: string, findingId: string) =>
        apiRequest(`/scans/${scanId}/findings/${findingId}`),

    /**
     * POST /api/scans/:id/findings/:findingId/verify
     * Run verification test for a finding
     * 
     * BACKEND: Execute safe, non-destructive tests:
     * - Try accessing protected endpoint with test account
     * - Attempt SQL injection with harmless payload
     * - Check for exposed secrets in responses
     * - Verify authorization bypass
     * 
     * Return test results with evidence
     */
    verify: async (scanId: string, findingId: string) =>
        apiRequest(`/scans/${scanId}/findings/${findingId}/verify`, {
            method: 'POST',
        }),

    /**
     * PATCH /api/scans/:id/findings/:findingId
     * Update finding status (mark as fixed, false positive, etc.)
     */
    update: async (
        scanId: string,
        findingId: string,
        updates: { status?: string; notes?: string }
    ) =>
        apiRequest(`/scans/${scanId}/findings/${findingId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        }),
};

/* ============================================================================
   REPORT ENDPOINTS
   ============================================================================ */

export const reportAPI = {
    /**
     * GET /api/scans/:id/report
     * Get security report for scan
     * 
     * BACKEND: Generate report with:
     * - Executive summary
     * - Risk breakdown by severity
     * - All findings with details
     * - Immediate action items
     * - Recommended improvements
     * - Remediation timeline
     */
    getByScanId: async (scanId: string) =>
        apiRequest(`/scans/${scanId}/report`),

    /**
     * GET /api/scans/:id/report/pdf
     * Download report as PDF
     */
    downloadPdf: async (scanId: string) => {
        const response = await fetch(`${BASE_URL}/scans/${scanId}/report/pdf`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        });
        return response.blob();
    },

    /**
     * GET /api/scans/:id/report/export
     * Export report as JSON or CSV
     */
    export: async (scanId: string, format: 'json' | 'csv') =>
        apiRequest(`/scans/${scanId}/report/export`, {
            params: { format },
        }),
};

/* ============================================================================
   AUTHENTICATION ENDPOINTS
   ============================================================================ */

export const authAPI = {
    /**
     * POST /api/auth/login
     * Authenticate user with email/password
     */
    login: async (email: string, password: string) =>
        apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    /**
     * POST /api/auth/register
     * Create new user account
     */
    register: async (data: { email: string; password: string; name: string }) =>
        apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * POST /api/auth/logout
     * Logout current user
     */
    logout: async () =>
        apiRequest('/auth/logout', { method: 'POST' }),

    /**
     * POST /api/auth/refresh
     * Refresh expired authentication token
     */
    refreshToken: async () =>
        apiRequest('/auth/refresh', { method: 'POST' }),
};

/* ============================================================================
   VIBEGUARD BACKEND API
   Routes proxied through Next.js to the FastAPI backend at /vibeguard/*
   ============================================================================ */

export const vibeGuardAPI = {
    /**
     * POST /vibeguard/scan
     * Run a DAST scan against a URL and return AnalysisResponse from FastAPI.
     */
    scan: async (url: string): Promise<import('./types').VibeGuardAnalysisResponse> => {
        const response = await fetch('/vibeguard/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input_type: 'url', url }),
        });

        if (!response.ok) {
            let detail = `HTTP ${response.status}`;
            try {
                const err = await response.json();
                detail = err.detail || detail;
            } catch {
                // ignore parse error
            }
            throw new Error(detail);
        }

        return response.json() as Promise<import('./types').VibeGuardAnalysisResponse>;
    },
};

/* ============================================================================
   UTILITY HELPERS
   ============================================================================ */

/**
 * Poll scan status until completion
 * Useful for watching scan progress in real-time
 */
export async function pollScanStatus(
    scanId: string,
    maxAttempts = 60,
    intervalMs = 2000
): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
        const response = await scanAPI.getById(scanId);

        if (response.data?.status === 'completed' || response.data?.status === 'failed') {
            return response.data;
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error('Scan polling timeout');
}

/**
 * Retry failed API calls with exponential backoff
 */
export async function retryApiCall<T>(
    fn: () => Promise<ApiResponse<T>>,
    maxRetries = 3,
    delayMs = 1000
): Promise<ApiResponse<T>> {
    for (let i = 0; i < maxRetries; i++) {
        const result = await fn();
        if (result.success) return result;

        if (i < maxRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, i)));
        }
    }

    return await fn(); // Last attempt
}