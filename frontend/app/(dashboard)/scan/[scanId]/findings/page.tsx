// app/(dashboard)/scan/[scanId]/findings/page.tsx
// Scan Findings Page - Displays all vulnerabilities found during scan
// Shows filtering, sorting, and detailed finding cards

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { MOCK_FINDINGS, simulateApiDelay } from '@/lib/mock-data';
import { Finding, FindingFilter, VibeGuardAnalysisResponse, adaptVibeGuardFinding } from '@/lib/types';
import { Card, Button, Badge } from '@/components/ui';
import { FindingCard } from '@/components/findings/FindingCard';
import styles from './findings.module.css';

/**
 * SCAN FINDINGS PAGE
 * 
 * This page demonstrates:
 * - Loading data from API with error handling
 * - Complex filtering and search
 * - Pagination
 * - Responsive grid layout
 * - Professional UI with dark theme
 * 
 * BACKEND INTEGRATION:
 * Replace MOCK_FINDINGS with actual API call to /api/scans/:id/findings
 */
export default function FindingsPage() {
  const params = useParams();
  const scanId = params?.scanId as string;

  // STATE MANAGEMENT
  const [findings, setFindings] = useState<Finding[]>([]);
  const [filteredFindings, setFilteredFindings] = useState<Finding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FILTERS
  const [filters, setFilters] = useState<FindingFilter>({
    severity: [],
    verificationStatus: [],
    searchTerm: '',
  });

  // PAGINATION
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Load findings on mount
  useEffect(() => {
    loadFindings();
  }, [scanId]);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [findings, filters]);

  /**
   * Load findings — real data for VibeGuard scans (vg-* IDs), mock for demo scans.
   */
  const loadFindings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (scanId?.startsWith('vg-')) {
        // Real scan: read AnalysisResponse stored by the scan page
        const raw = sessionStorage.getItem(`vibeguard_scan_${scanId}`);
        if (!raw) {
          throw new Error('Scan result not found. Please run a new scan.');
        }
        const stored = JSON.parse(raw) as VibeGuardAnalysisResponse & { appName?: string; url?: string };
        if (!stored.findings || stored.findings.length === 0) {
          throw new Error('No findings were returned for this scan.');
        }
        const adapted = stored.findings.map((vgf) => adaptVibeGuardFinding(vgf, scanId));
        setFindings(adapted);
      } else {
        // Demo scan: use mock data as before
        await simulateApiDelay(600);
        setFindings(MOCK_FINDINGS);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load findings');
      console.error('Failed to load findings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Apply filters to findings
   */
  const applyFilters = () => {
    let filtered = [...findings];

    // Filter by severity
    if (filters.severity && filters.severity.length > 0) {
      filtered = filtered.filter((f) => filters.severity!.includes(f.severity));
    }

    // Filter by verification status
    if (filters.verificationStatus && filters.verificationStatus.length > 0) {
      filtered = filtered.filter((f) =>
        filters.verificationStatus!.includes(f.verificationStatus)
      );
    }

    // Search in title and description
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.title.toLowerCase().includes(searchLower) ||
          f.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort by severity (critical → high → medium → low)
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    filtered.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );

    setFilteredFindings(filtered);
    setPage(1); // Reset to first page
  };

  /**
   * Handle severity filter toggle
   */
  const toggleSeverityFilter = useCallback(
    (severity: string) => {
      setFilters((prev) => {
        const severities = prev.severity || [];
        const newSeverities = severities.includes(severity as any)
          ? severities.filter((s) => s !== severity)
          : [...severities, severity as any];

        return {
          ...prev,
          severity: newSeverities.length > 0 ? newSeverities : undefined,
        };
      });
    },
    []
  );

  /**
   * Handle verification status filter toggle
   */
  const toggleStatusFilter = useCallback(
    (status: string) => {
      setFilters((prev) => {
        const statuses = prev.verificationStatus || [];
        const newStatuses = statuses.includes(status as any)
          ? statuses.filter((s) => s !== status)
          : [...statuses, status as any];

        return {
          ...prev,
          verificationStatus: newStatuses.length > 0 ? newStatuses : undefined,
        };
      });
    },
    []
  );

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({ severity: [], verificationStatus: [], searchTerm: '' });
  };

  // PAGINATION
  const totalPages = Math.ceil(filteredFindings.length / itemsPerPage);
  const startIdx = (page - 1) * itemsPerPage;
  const paginatedFindings = filteredFindings.slice(
    startIdx,
    startIdx + itemsPerPage
  );

  // LOADING STATE
  if (isLoading) {
    return (
      <div className={styles.page}>
        <FindingsPageSkeleton />
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorContainer}>
          <h2>Failed to Load Findings</h2>
          <p>{error}</p>
          <Button onClick={loadFindings} variant="primary">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* PAGE HEADER */}
      <div className={styles.header}>
        <div>
          <h1>Security Findings</h1>
          <p className={styles.subtitle}>
            {filteredFindings.length} vulnerabilities found
          </p>
        </div>
      </div>

      {/* FILTER SECTION */}
      <Card hasBorder padding="lg" className={styles.filterCard}>
        <div className={styles.filterHeader}>
          <h3>Filters</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            disabled={
              !filters.severity?.length &&
              !filters.verificationStatus?.length &&
              !filters.searchTerm
            }
          >
            Clear All
          </Button>
        </div>

        {/* SEARCH */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>Search</label>
          <input
            type="text"
            placeholder="Search findings..."
            value={filters.searchTerm || ''}
            onChange={(e) =>
              setFilters({ ...filters, searchTerm: e.target.value })
            }
            className={styles.searchInput}
          />
        </div>

        {/* SEVERITY FILTER */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>Severity</label>
          <div className={styles.badgeGroup}>
            {['critical', 'high', 'medium', 'low'].map((sev) => (
              <button
                key={sev}
                className={`${styles.filterBadge} ${
                  filters.severity?.includes(sev as any)
                    ? styles.filterBadgeActive
                    : ''
                }`}
                onClick={() => toggleSeverityFilter(sev)}
              >
                <Badge variant={sev as any}>
                  {sev.charAt(0).toUpperCase() + sev.slice(1)}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* STATUS FILTER */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>Verification Status</label>
          <div className={styles.badgeGroup}>
            {['verified', 'likely', 'potential', 'informational'].map((st) => (
              <button
                key={st}
                className={`${styles.filterBadge} ${
                  filters.verificationStatus?.includes(st as any)
                    ? styles.filterBadgeActive
                    : ''
                }`}
                onClick={() => toggleStatusFilter(st)}
              >
                <Badge>
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* RESULTS SECTION */}
      {filteredFindings.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No findings match your filters</p>
          <Button onClick={clearFilters} variant="secondary">
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          {/* FINDINGS LIST */}
          <div className={styles.findingsList}>
            {paginatedFindings.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                scanId={scanId}
              />
            ))}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <Button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                variant="outline"
              >
                ← Previous
              </Button>

              <div className={styles.pageInfo}>
                Page {page} of {totalPages} ({filteredFindings.length} total)
              </div>

              <Button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                variant="outline"
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * SKELETON LOADING COMPONENT
 * Shows while data is being fetched
 */
function FindingsPageSkeleton() {
  return (
    <div className={styles.skeletonPage}>
      <div className={styles.skeletonHeader} />
      <div className={styles.skeletonFilterCard} />
      <div className={styles.skeletonFindings}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
    </div>
  );
}
