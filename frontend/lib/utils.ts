// lib/utils.ts
// Utility functions used throughout the application

import { SeverityLevel, VerificationStatus } from './types';

/**
 * FORMATTING UTILITIES
 */

/**
 * Format date to readable string
 * @example formatDate(new Date()) => "Sep 26, 2024"
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(d);
}

/**
 * Format date with time
 * @example formatDateTime(new Date()) => "Sep 26, 2024 2:30 PM"
 */
export function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(d);
}

/**
 * Format number as percentage
 * @example formatPercent(72.5) => "72.5%"
 */
export function formatPercent(value: number): string {
    return `${Math.round(value * 10) / 10}%`;
}

/**
 * Pluralize word based on count
 * @example pluralize(5, 'finding') => "5 findings"
 * @example pluralize(1, 'finding') => "1 finding"
 */
export function pluralize(count: number, word: string): string {
    return `${count} ${count === 1 ? word : word + 's'}`;
}

/**
 * Truncate string to max length with ellipsis
 * @example truncate('This is a long string', 10) => "This is a ..."
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * SEVERITY & STATUS UTILITIES
 */

/**
 * Get color for severity level
 */
export function getSeverityColor(severity: SeverityLevel): string {
    switch (severity) {
        case 'critical':
            return 'var(--color-critical)';
        case 'high':
            return 'var(--color-high)';
        case 'medium':
            return 'var(--color-medium)';
        case 'low':
            return 'var(--color-low)';
        default:
            return 'var(--color-info)';
    }
}

/**
 * Get human-readable severity label
 */
export function getSeverityLabel(severity: SeverityLevel): string {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
}

/**
 * Get verification status label
 */
export function getVerificationStatusLabel(status: VerificationStatus): string {
    const labels: Record<VerificationStatus, string> = {
        verified: 'Verified',
        likely: 'Likely',
        potential: 'Potential',
        informational: 'Informational',
    };
    return labels[status];
}

/**
 * Get description for verification status
 */
export function getVerificationStatusDescription(status: VerificationStatus): string {
    const descriptions: Record<VerificationStatus, string> = {
        verified: 'Vulnerability has been tested and confirmed to exist',
        likely: 'Evidence strongly suggests this vulnerability exists',
        potential: 'This could be a vulnerability but requires manual verification',
        informational: 'This is informational only and not a security risk',
    };
    return descriptions[status];
}

/**
 * SECURITY SCORE UTILITIES
 */

/**
 * Get security score category
 */
export function getScoreCategory(score: number): 'critical' | 'poor' | 'fair' | 'good' | 'excellent' {
    if (score < 20) return 'critical';
    if (score < 40) return 'poor';
    if (score < 60) return 'fair';
    if (score < 85) return 'good';
    return 'excellent';
}

/**
 * Get security score description
 */
export function getScoreDescription(score: number): string {
    const category = getScoreCategory(score);
    const descriptions: Record<string, string> = {
        critical: 'Critical vulnerabilities require immediate attention',
        poor: 'Multiple high-severity issues need to be addressed',
        fair: 'Several issues should be resolved',
        good: 'Minor issues should be reviewed',
        excellent: 'Strong security posture',
    };
    return descriptions[category];
}

/**
 * Calculate average score from multiple scores
 */
export function calculateAverageScore(scores: number[]): number {
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round(sum / scores.length);
}

/**
 * VALIDATION UTILITIES
 */

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate GitHub repository URL
 */
export function isValidGitHubUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return (
            parsed.hostname === 'github.com' &&
            /^\/[\w-]+\/[\w.-]+/.test(parsed.pathname)
        );
    } catch {
        return false;
    }
}

/**
 * Validate password strength
 * Returns score 1-4 based on complexity
 */
export function validatePasswordStrength(password: string): number {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength++;

    return Math.min(4, strength);
}

/**
 * ARRAY/OBJECT UTILITIES
 */

/**
 * Deduplicate array while preserving order
 */
export function deduplicate<T>(array: T[], key?: (item: T) => any): T[] {
    const seen = new Set();
    return array.filter((item) => {
        const k = key ? key(item) : item;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: (item: T) => string): Record<string, T[]> {
    return array.reduce(
        (groups, item) => {
            const k = key(item);
            return { ...groups, [k]: [...(groups[k] || []), item] };
        },
        {} as Record<string, T[]>
    );
}

/**
 * Sort array by multiple criteria
 */
export function sortBy<T>(
    array: T[],
    ...criteria: Array<{ key: (item: T) => any; order?: 'asc' | 'desc' }>
): T[] {
    return [...array].sort((a, b) => {
        for (const { key, order = 'asc' } of criteria) {
            const aVal = key(a);
            const bVal = key(b);

            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

/**
 * CLASS & STYLE UTILITIES
 */

/**
 * Conditionally combine class names
 */
export function classNames(...classes: (string | undefined | false | null)[]): string {
    return classes.filter(Boolean).join(' ');
}

/**
 * Convert object to CSS variables inline style
 */
export function toCssVariables(obj: Record<string, string>): React.CSSProperties {
    const style: React.CSSProperties = {};
    for (const [key, value] of Object.entries(obj)) {
        (style as any)[`--${key}`] = value;
    }
    return style;
}

/**
 * LOCAL STORAGE UTILITIES
 */

/**
 * Safe localStorage getter (handles JSON parsing)
 */
export function getLocalStorage<T>(key: string, defaultValue?: T): T | null {
    if (typeof window === 'undefined') return null;

    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : (defaultValue ?? null);
    } catch {
        return defaultValue ?? null;
    }
}

/**
 * Safe localStorage setter (handles JSON stringifying)
 */
export function setLocalStorage(key: string, value: any): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Failed to set localStorage[${key}]:`, error);
    }
}

/**
 * Remove item from localStorage
 */
export function removeLocalStorage(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
}

/**
 * DELAY & TIMING
 */

/**
 * Delay execution (for testing loading states, etc.)
 */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    ms: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return function debounced(...args: Parameters<T>) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), ms);
    };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    ms: number
): (...args: Parameters<T>) => void {
    let lastCall = 0;
    let timeoutId: NodeJS.Timeout;

    return function throttled(...args: Parameters<T>) {
        const now = Date.now();

        if (now - lastCall >= ms) {
            lastCall = now;
            fn(...args);
            clearTimeout(timeoutId);
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                lastCall = Date.now();
                fn(...args);
            }, ms - (now - lastCall));
        }
    };
}