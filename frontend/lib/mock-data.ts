// lib/mock-data.ts
// Comprehensive fake data for UI development and testing
// REPLACE with real API calls when backend is ready

import { Scan, Finding, SecurityReport, User, DashboardStats, AttackSurface } from './types';

export const MOCK_CURRENT_USER: User = {
    id: 'user-001',
    email: 'dev@vibeguard.com',
    name: 'Developer',
    createdAt: new Date('2024-01-15'),
    avatar: 'https://avatars.dicebear.com/api/avataaars/dev@vibeguard.com.svg',
};

/**
 * Mock Scans
 */
export const MOCK_SCANS: Scan[] = [
    {
        id: 'scan-001',
        userId: 'user-001',
        name: 'Pharmacy SaaS Initial Scan',
        applicationName: 'Pharmacy Management SaaS',
        applicationUrl: 'https://pharmacy-app.example.com',
        inputType: 'url',
        status: 'completed',
        securityScore: 72,
        totalFindings: 15,
        criticalCount: 2,
        highCount: 4,
        mediumCount: 6,
        lowCount: 3,
        framework: 'Next.js',
        database: 'PostgreSQL',
        authentication: 'Supabase Auth',
        dependencies: ['next', 'react', 'typescript', 'postgres', 'axios'],
        createdAt: new Date('2024-09-20'),
        completedAt: new Date('2024-09-20T14:30:00'),
        detectedTechs: [
            { name: 'Next.js 14', category: 'frontend', version: '14.0.0' },
            { name: 'TypeScript', category: 'frontend', version: '5.2.0' },
            { name: 'PostgreSQL', category: 'database', version: '15.0' },
            { name: 'Supabase Auth', category: 'auth' },
            { name: 'npm', category: 'other' },
        ],
    },
    {
        id: 'scan-002',
        userId: 'user-001',
        name: 'Finance App Deep Analysis',
        applicationName: 'Finance Management App',
        gitHubRepo: 'https://github.com/user/finance-app',
        inputType: 'github',
        status: 'completed',
        securityScore: 91,
        totalFindings: 4,
        criticalCount: 0,
        highCount: 1,
        mediumCount: 2,
        lowCount: 1,
        framework: 'Vue.js',
        database: 'MongoDB',
        authentication: 'JWT',
        dependencies: ['vue', 'axios', 'mongodb', 'express'],
        createdAt: new Date('2024-09-18'),
        completedAt: new Date('2024-09-18T10:15:00'),
        detectedTechs: [
            { name: 'Vue.js 3', category: 'frontend', version: '3.3.0' },
            { name: 'Express.js', category: 'backend', version: '4.18.0' },
            { name: 'MongoDB', category: 'database', version: '6.0' },
        ],
    },
    {
        id: 'scan-003',
        userId: 'user-001',
        name: 'E-commerce Platform',
        applicationName: 'E-commerce Shop',
        inputType: 'zip',
        status: 'completed',
        securityScore: 64,
        totalFindings: 21,
        criticalCount: 3,
        highCount: 6,
        mediumCount: 9,
        lowCount: 3,
        framework: 'Django',
        database: 'PostgreSQL',
        authentication: 'Django Auth',
        dependencies: ['django', 'djangorestframework', 'psycopg2', 'celery'],
        createdAt: new Date('2024-09-15'),
        completedAt: new Date('2024-09-15T16:45:00'),
    },
];

/**
 * Mock Findings for Pharmacy Scan
 */
export const MOCK_FINDINGS: Finding[] = [
    {
        id: 'finding-001',
        scanId: 'scan-001',
        type: 'Broken Object-Level Authorization',
        severity: 'critical',
        verificationStatus: 'verified',
        title: 'API endpoints lack proper authorization checks',
        description:
            'The /api/orders/:id endpoint retrieves order data without verifying that the authenticated user owns the order. An attacker could enumerate order IDs and access other users\' sensitive information.',
        endpoint: '/api/orders/:id',
        filePath: 'app/api/orders/[id]/route.ts',
        lineNumber: 42,
        affectedComponent: 'Order API Routes',
        impact: 'HIGH: Unauthorized access to user order data, PII exposure',
        whyItMatters:
            'Any authenticated user could view another user\'s orders, prescriptions, and payment information. This is a critical compliance violation (HIPAA, GDPR).',
        evidence: {
            endpoint: 'GET /api/orders/:id',
            database: 'orders table',
            ownershipField: 'user_id',
            authorizationCheck: 'Not detected',
            testedWith: 'Test User A',
            testResult: 'Successfully retrieved User B\'s order data (200 OK)',
        },
        recommendedFix:
            'Add ownership verification before returning order data:\n\nconst userId = getAuthenticatedUserId();\nconst order = await db.orders.findUnique({\n  where: { id, userId }\n});\nif (!order) return 404;',
        remedationPriority: 9,
        createdAt: new Date('2024-09-20T14:31:00'),
    },
    {
        id: 'finding-002',
        scanId: 'scan-001',
        type: 'Exposed API Key in Source Code',
        severity: 'critical',
        verificationStatus: 'verified',
        title: 'Database connection string found in environment variables',
        description: 'API keys and database credentials were discovered in the .env file',
        filePath: '.env (detected in git history)',
        affectedComponent: 'Configuration Management',
        impact: 'CRITICAL: Complete database access',
        whyItMatters: 'Exposed database credentials allow attackers to directly query and modify all data.',
        evidence: {
            codeSnippet: 'DATABASE_URL=postgresql://admin:Password123@db.example.com:5432/pharmacy',
            testedWith: 'Git history analysis',
            testResult: 'Credentials valid and working',
        },
        recommendedFix:
            'Rotate all exposed credentials immediately. Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, or Vercel Secrets) to store sensitive data. Never commit secrets to git.',
        remedationPriority: 10,
        createdAt: new Date('2024-09-20T14:31:30'),
    },
    {
        id: 'finding-003',
        scanId: 'scan-001',
        type: 'SQL Injection Vulnerability',
        severity: 'high',
        verificationStatus: 'likely',
        title: 'User input not properly sanitized in search query',
        description:
            'The search endpoint constructs SQL queries using string concatenation instead of parameterized queries.',
        endpoint: '/api/medications/search',
        filePath: 'app/api/medications/route.ts',
        lineNumber: 156,
        affectedComponent: 'Medication Search API',
        impact: 'HIGH: Potential data extraction, modification, or deletion',
        whyItMatters: 'Attackers could inject malicious SQL to bypass authentication or steal data.',
        evidence: {
            endpoint: 'GET /api/medications/search?query=X',
            codeSnippet: 'const query = `SELECT * FROM medications WHERE name LIKE \'%${searchTerm}%\'`',
        },
        recommendedFix:
            'Use parameterized queries:\n\nconst results = await db.$queryRaw`\n  SELECT * FROM medications WHERE name ILIKE ${searchTerm}\n`',
        remedationPriority: 8,
        createdAt: new Date('2024-09-20T14:32:00'),
    },
    {
        id: 'finding-004',
        scanId: 'scan-001',
        type: 'Missing Rate Limiting',
        severity: 'high',
        verificationStatus: 'potential',
        title: 'No rate limiting on authentication endpoints',
        description: 'The /api/auth/login endpoint can be called unlimited times, enabling brute force attacks.',
        endpoint: '/api/auth/login',
        filePath: 'app/api/auth/login/route.ts',
        affectedComponent: 'Authentication Endpoints',
        impact: 'HIGH: Credential stuffing, password brute force attacks',
        whyItMatters: 'Attackers can attempt thousands of login attempts without being throttled.',
        evidence: {
            endpoint: 'POST /api/auth/login',
            testedWith: 'Rapid request testing',
        },
        recommendedFix:
            'Implement rate limiting using a library like `express-rate-limit` or Cloudflare:\n\nimport rateLimit from "express-rate-limit";\n\nconst limiter = rateLimit({\n  windowMs: 15 * 60 * 1000,\n  max: 5\n});',
        remedationPriority: 7,
        createdAt: new Date('2024-09-20T14:32:30'),
    },
    {
        id: 'finding-005',
        scanId: 'scan-001',
        type: 'Weak Password Requirements',
        severity: 'medium',
        verificationStatus: 'potential',
        title: 'Password policy allows weak passwords',
        description: 'Minimum password length is 6 characters with no complexity requirements',
        affectedComponent: 'User Authentication',
        impact: 'MEDIUM: Weak user passwords',
        whyItMatters: 'Users can set easily-guessable passwords',
        evidence: {
            codeSnippet: 'password.length >= 6',
        },
        recommendedFix:
            'Enforce strong password policy:\n- Minimum 12 characters\n- Require uppercase, lowercase, numbers, symbols\n- Check against common passwords\n- Consider ZXCVBN library for strength estimation',
        remedationPriority: 5,
        createdAt: new Date('2024-09-20T14:33:00'),
    },
    {
        id: 'finding-006',
        scanId: 'scan-001',
        type: 'Permissive CORS Policy',
        severity: 'medium',
        verificationStatus: 'verified',
        title: 'CORS allows all origins',
        description: 'Access-Control-Allow-Origin is set to *',
        affectedComponent: 'API Configuration',
        impact: 'MEDIUM: Cross-origin attacks possible',
        whyItMatters: 'Any website can make requests to your API on behalf of users',
        evidence: {
            codeSnippet: 'headers["Access-Control-Allow-Origin"] = "*"',
        },
        recommendedFix:
            'Specify allowed origins explicitly:\n\nconst allowedOrigins = ["https://pharmacy-app.com"];\nheaders["Access-Control-Allow-Origin"] = \n  allowedOrigins.includes(origin) ? origin : ""',
        remedationPriority: 6,
        createdAt: new Date('2024-09-20T14:33:30'),
    },
    {
        id: 'finding-007',
        scanId: 'scan-001',
        type: 'Outdated Dependency',
        severity: 'medium',
        verificationStatus: 'potential',
        title: 'axios 0.21.1 has known vulnerabilities',
        description: 'Dependency has 2 known CVEs (CVE-2021-41773, CVE-2021-41774)',
        affectedComponent: 'Package Dependencies',
        impact: 'MEDIUM: Potential RCE through malicious responses',
        whyItMatters: 'Known security vulnerabilities can be exploited by attackers',
        evidence: {
            codeSnippet: '"axios": "^0.21.1" in package.json',
        },
        recommendedFix: 'Update to axios >=1.3.0:\n\nnpm install axios@latest',
        remedationPriority: 6,
        createdAt: new Date('2024-09-20T14:34:00'),
    },
    {
        id: 'finding-008',
        scanId: 'scan-001',
        type: 'No HTTPS Enforcement',
        severity: 'low',
        verificationStatus: 'potential',
        title: 'Application accepts HTTP connections',
        description: 'Site does not force HTTPS redirect',
        endpoint: 'http://pharmacy-app.example.com',
        affectedComponent: 'Network Configuration',
        impact: 'LOW: Man-in-the-middle attacks possible',
        whyItMatters: 'Unencrypted connections can be intercepted',
        evidence: {
            codeSnippet: 'HTTP connections accepted',
        },
        recommendedFix:
            'Add HTTPS enforcement in next.config.js:\n\nheaders() {\n  return [{ source: "/(.*)", headers: [\n    { key: "Strict-Transport-Security", value: "max-age=31536000" }\n  ]}]\n}',
        remedationPriority: 4,
        createdAt: new Date('2024-09-20T14:34:30'),
    },
];

/**
 * Mock Dashboard Statistics
 */
export const MOCK_DASHBOARD_STATS: DashboardStats = {
    totalApplications: 8,
    totalScans: 24,
    openIssues: 17,
    verifiedIssues: 6,
    averageSecurityScore: 75,
    criticalFindings: 5,
};

/**
 * Mock Security Report
 */
export const MOCK_SECURITY_REPORT: SecurityReport = {
    id: 'report-001',
    scanId: 'scan-001',
    applicationName: 'Pharmacy Management SaaS',
    securityScore: 72,
    scanDate: new Date('2024-09-20'),
    executiveSummary: `A comprehensive security analysis of the Pharmacy Management SaaS identified 15 vulnerabilities ranging from critical to low severity. The most critical issue involves broken object-level authorization that could allow unauthorized access to sensitive patient data. Immediate remediation is required for all critical findings.`,
    riskSummary: {
        critical: 2,
        high: 4,
        medium: 6,
        low: 3,
    },
    findings: MOCK_FINDINGS,
    immediateActions: [
        'Fix broken authorization in /api/orders/:id endpoint',
        'Rotate and secure exposed database credentials',
        'Implement rate limiting on authentication endpoints',
    ],
    recommendedActions: [
        'Update axios to latest version',
        'Implement HTTPS enforcement',
        'Establish comprehensive security testing in CI/CD pipeline',
    ],
    generatedAt: new Date('2024-09-20T15:00:00'),
};

/**
 * Mock Attack Surface
 */
export const MOCK_ATTACK_SURFACE: AttackSurface = {
    scanId: 'scan-001',
    totalEndpoints: 17,
    apiRoutes: [
        { id: '1', method: 'GET', path: '/api/orders', requiresAuth: true },
        { id: '2', method: 'GET', path: '/api/orders/:id', requiresAuth: true },
        { id: '3', method: 'POST', path: '/api/orders', requiresAuth: true },
        { id: '4', method: 'DELETE', path: '/api/orders/:id', requiresAuth: true },
        { id: '5', method: 'GET', path: '/api/medications', requiresAuth: false },
        { id: '6', method: 'GET', path: '/api/medications/search', requiresAuth: false },
        { id: '7', method: 'POST', path: '/api/auth/login', requiresAuth: false },
        { id: '8', method: 'POST', path: '/api/auth/logout', requiresAuth: true },
        { id: '9', method: 'POST', path: '/api/auth/register', requiresAuth: false },
        { id: '10', method: 'GET', path: '/api/users/profile', requiresAuth: true },
        { id: '11', method: 'PUT', path: '/api/users/profile', requiresAuth: true },
        { id: '12', method: 'POST', path: '/api/users/password-reset', requiresAuth: false },
    ],
    databasePolicies: [
        { id: '1', table: 'users', policyName: 'Authenticated users can view own profile', description: '' },
        {
            id: '2',
            table: 'orders',
            policyName: 'Users can only see their own orders',
            description: '',
        },
        { id: '3', table: 'medications', policyName: 'Public read access', description: '' },
    ],
    authenticatedRoutes: 8,
    publicRoutes: 5,
    dependencies: [
        { name: 'next', version: '14.0.0', latestVersion: '14.0.0', hasVulnerabilities: false },
        {
            name: 'axios',
            version: '0.21.1',
            latestVersion: '1.3.0',
            hasVulnerabilities: true,
            vulnerabilityCount: 2,
        },
        {
            name: 'pg',
            version: '8.8.0',
            latestVersion: '8.11.0',
            hasVulnerabilities: false,
        },
    ],
};

/**
 * Helper function: Simulate backend delay
 * REMOVE when connecting to real API
 */
export const simulateApiDelay = (ms: number = 1000) =>
    new Promise((resolve) => setTimeout(resolve, ms));