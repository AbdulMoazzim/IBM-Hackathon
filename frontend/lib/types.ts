// lib/types.ts
// Centralized TypeScript types for the entire VibeGuard application

/**
 * Authentication & User Types
 */
export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    avatar?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
    refreshToken: string;
}

/**
 * Scan Types
 */
export type ScanInputType = 'url' | 'github' | 'zip';
export type ScanStatus = 'pending' | 'analyzing' | 'completed' | 'failed';
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type VerificationStatus = 'verified' | 'likely' | 'potential' | 'informational';

export interface Scan {
    id: string;
    userId: string;
    name: string;
    applicationName: string;
    applicationUrl?: string;
    gitHubRepo?: string;
    inputType: ScanInputType;
    status: ScanStatus;
    securityScore: number; // 0-100
    totalFindings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    framework?: string;
    database?: string;
    authentication?: string;
    dependencies: string[];
    createdAt: Date;
    completedAt?: Date;
    detectedTechs?: DetectedTechnology[];
}

export interface DetectedTechnology {
    name: string;
    category: 'frontend' | 'backend' | 'database' | 'auth' | 'other';
    version?: string;
}

/**
 * Finding/Vulnerability Types
 */
export interface Finding {
    id: string;
    scanId: string;
    type: string; // e.g., "Broken Authorization", "SQL Injection"
    severity: SeverityLevel;
    verificationStatus: VerificationStatus;
    title: string;
    description: string;
    endpoint?: string;
    filePath?: string;
    lineNumber?: number;
    affectedComponent?: string;
    cveId?: string;
    impact: string;
    whyItMatters: string;
    evidence: FindingEvidence;
    recommendedFix: string;
    remedationPriority: number; // 1-10, higher = more urgent
    createdAt: Date;
}

export interface FindingEvidence {
    endpoint?: string;
    database?: string;
    ownershipField?: string;
    authorizationCheck?: string;
    testedWith?: string;
    testResult?: string;
    codeSnippet?: string;
    url?: string;
}

export interface FindingFilter {
    severity?: SeverityLevel[];
    verificationStatus?: VerificationStatus[];
    category?: string[];
    searchTerm?: string;
}

/**
 * Report Types
 */
export interface SecurityReport {
    id: string;
    scanId: string;
    applicationName: string;
    securityScore: number;
    scanDate: Date;
    executiveSummary: string;
    riskSummary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    findings: Finding[];
    immediateActions: string[];
    recommendedActions: string[];
    generatedAt: Date;
}

/**
 * Attack Surface Types
 */
export interface AttackSurface {
    scanId: string;
    totalEndpoints: number;
    apiRoutes: ApiEndpoint[];
    databasePolicies: DatabasePolicy[];
    authenticatedRoutes: number;
    publicRoutes: number;
    dependencies: Dependency[];
}

export interface ApiEndpoint {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    requiresAuth: boolean;
    riskLevel?: SeverityLevel;
}

export interface DatabasePolicy {
    id: string;
    table: string;
    policyName: string;
    description: string;
    riskLevel?: SeverityLevel;
}

export interface Dependency {
    name: string;
    version: string;
    latestVersion?: string;
    hasVulnerabilities: boolean;
    vulnerabilityCount?: number;
}

/**
 * Verification Types
 */
export interface VerificationTest {
    id: string;
    findingId: string;
    testType: string;
    testUser?: string;
    targetResource?: string;
    executedAt: Date;
    result: 'passed' | 'failed' | 'inconclusive';
    responseCode?: number;
    responseBody?: string;
}

/**
 * Dashboard Types
 */
export interface DashboardStats {
    totalApplications: number;
    totalScans: number;
    openIssues: number;
    verifiedIssues: number;
    averageSecurityScore: number;
    criticalFindings: number;
}

export interface RecentScan {
    id: string;
    applicationName: string;
    securityScore: number;
    criticalCount: number;
    status: ScanStatus;
    completedAt: Date;
}

/**
 * API Response Types
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: string;
    };
    timestamp: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

/**
 * UI State Types
 */
export interface LoadingState {
    isLoading: boolean;
    error?: string;
    errorCode?: string;
}

export interface ModalState {
    isOpen: boolean;
    type?: 'success' | 'error' | 'warning' | 'info';
    message?: string;
    title?: string;
}

/**
 * Theme Types
 */
export type ThemeMode = 'dark' | 'light';

export interface ThemeConfig {
    mode: ThemeMode;
    colors: Record<string, string>;
}

/**
 * VibeGuard FastAPI backend types
 * Mirrors the Python SecurityAnalysis / AnalysisResponse Pydantic models exactly.
 */
export type VGSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type VGStatus = 'potential' | 'likely' | 'verified' | 'false_positive';
export type VGVerificationStatus = 'not_tested' | 'unverified' | 'verified';

export interface VibeGuardFinding {
    id: string;
    title: string;
    type: string;
    severity: VGSeverity;
    confidence: number;       // 0-1
    status: VGStatus;
    explanation: string;
    impact: string;
    evidence: string[];
    affected_components: string[];
    recommended_fix: string;
    verification_status: VGVerificationStatus;
}

export interface VibeGuardAnalysisResponse {
    summary: string;
    risk_level: VGSeverity;
    findings: VibeGuardFinding[];
}

/**
 * Adapt a VibeGuardFinding from the real backend into the frontend Finding shape
 * so the existing FindingCard and filters work without modification.
 */
export function adaptVibeGuardFinding(vg: VibeGuardFinding, scanId: string): Finding {
    // Map backend status → frontend verificationStatus
    const statusMap: Record<VGStatus, VerificationStatus> = {
        verified: 'verified',
        likely: 'likely',
        potential: 'potential',
        false_positive: 'informational',
    };

    // severity: backend "info" maps to frontend "info"
    const severity = vg.severity as SeverityLevel;

    return {
        id: vg.id,
        scanId,
        type: vg.type,
        severity,
        verificationStatus: statusMap[vg.status] ?? 'potential',
        title: vg.title,
        description: vg.explanation,
        affectedComponent: vg.affected_components[0] ?? undefined,
        filePath: vg.affected_components[0] ?? undefined,
        impact: vg.impact,
        whyItMatters: vg.impact,
        evidence: {
            codeSnippet: vg.evidence.join('\n'),
        },
        recommendedFix: vg.recommended_fix,
        // confidence 0-1 → remedation priority 1-10
        remedationPriority: Math.max(1, Math.round(vg.confidence * 10)),
        createdAt: new Date(),
    };
}
