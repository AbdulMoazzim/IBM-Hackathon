'use client';

// app/(dashboard)/dashboard/page.tsx

import Link from 'next/link';
import { Card, Button, StatCard, Badge } from '@/components/ui';
import ScanCard from '@/components/scan/ScanCard';
import { useScanHistory } from '@/hooks/useScanHistory';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const {
    scans,
    allFindings,
    totalScans,
    openIssues,
    criticalFindings,
    highFindings,
    mediumFindings,
    lowFindings,
    isEmpty,
  } = useScanHistory();

  const recentScans = scans.slice(0, 3);

  // Top recommended actions = highest-priority findings across all scans
  const topActions = [...allFindings]
    .sort((a, b) => b.remedationPriority - a.remedationPriority)
    .slice(0, 4);

  return (
    <div className={styles.page}>
      {/* PAGE HEADER */}
      <div className={styles.header}>
        <div>
          <h1>Dashboard</h1>
          <p className={styles.subtitle}>Live results from your VibeGuard security scans</p>
        </div>
        <Link href="/scan">
          <Button variant="primary" size="lg">+ New Scan</Button>
        </Link>
      </div>

      {/* STATS */}
      <section className={styles.statsGrid}>
        <StatCard label="Total Scans" value={totalScans} icon={<ScanIcon />} />
        <StatCard label="Open Issues" value={openIssues} icon={<IssueIcon />} />
        <StatCard label="Critical" value={criticalFindings} icon={<AlertIcon />} />
        <StatCard label="High" value={highFindings} icon={<ShieldIcon />} />
        <StatCard label="Medium" value={mediumFindings} icon={<CheckIcon />} />
        <StatCard label="Low" value={lowFindings} icon={<AppIcon />} />
      </section>

      {/* SEVERITY OVERVIEW */}
      {!isEmpty && (
        <section className={styles.section}>
          <Card hasBorder padding="lg">
            <div className={styles.chartHeader}>
              <h2>Severity Breakdown</h2>
              <p className={styles.chartSubtitle}>
                Findings across {totalScans} scan{totalScans !== 1 ? 's' : ''}
              </p>
            </div>
            <div className={styles.chartContainer}>
              <div className={styles.chartItem}>
                <div className={styles.chartBar}>
                  {criticalFindings > 0 && (
                    <div
                      className={styles.barSegment}
                      style={{
                        backgroundColor: 'var(--color-critical)',
                        flex: criticalFindings,
                      }}
                      title={`${criticalFindings} Critical`}
                    />
                  )}
                  {highFindings > 0 && (
                    <div
                      className={styles.barSegment}
                      style={{ backgroundColor: 'var(--color-high)', flex: highFindings }}
                      title={`${highFindings} High`}
                    />
                  )}
                  {mediumFindings > 0 && (
                    <div
                      className={styles.barSegment}
                      style={{ backgroundColor: 'var(--color-medium)', flex: mediumFindings }}
                      title={`${mediumFindings} Medium`}
                    />
                  )}
                  {lowFindings > 0 && (
                    <div
                      className={styles.barSegment}
                      style={{ backgroundColor: 'var(--color-low)', flex: lowFindings }}
                      title={`${lowFindings} Low`}
                    />
                  )}
                  {openIssues === 0 && (
                    <div
                      className={styles.barSegment}
                      style={{ backgroundColor: 'var(--color-surface-3)', flex: 1 }}
                    />
                  )}
                </div>
              </div>
              <div className={styles.chartLegend}>
                {criticalFindings > 0 && (
                  <div className={styles.legendItem}>
                    <Badge variant="critical">{criticalFindings} Critical</Badge>
                  </div>
                )}
                {highFindings > 0 && (
                  <div className={styles.legendItem}>
                    <Badge variant="high">{highFindings} High</Badge>
                  </div>
                )}
                {mediumFindings > 0 && (
                  <div className={styles.legendItem}>
                    <Badge variant="medium">{mediumFindings} Medium</Badge>
                  </div>
                )}
                {lowFindings > 0 && (
                  <div className={styles.legendItem}>
                    <Badge variant="low">{lowFindings} Low</Badge>
                  </div>
                )}
                {openIssues === 0 && (
                  <div className={styles.legendItem}>
                    <Badge variant="success">No issues found</Badge>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* RECENT SCANS */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Recent Scans</h2>
          <Link href="/scans" className={styles.viewAllLink}>View All →</Link>
        </div>

        {isEmpty ? (
          <Card hasBorder padding="lg">
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-secondary)' }}>
              <p style={{ marginBottom: 16 }}>No scans yet. Run your first scan to see results here.</p>
              <Link href="/scan">
                <Button variant="primary">Start a Scan</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className={styles.scansGrid}>
            {recentScans.map((scan) => (
              <ScanCard key={scan.id} scan={scan} />
            ))}
          </div>
        )}
      </section>

      {/* TOP RECOMMENDED ACTIONS — from real findings */}
      {topActions.length > 0 && (
        <section className={styles.section}>
          <Card hasBorder padding="lg" className={styles.recommendedCard}>
            <h2 className={styles.recommendedTitle}>Recommended Actions</h2>
            <ul className={styles.recommendedList}>
              {topActions.map((f, i) => (
                <li key={f.id}>
                  <span className={styles.badge}>{i + 1}</span>
                  <span>
                    <strong>{f.title}</strong>
                    {' — '}
                    <Link
                      href={`/scan/${f.scanId}/findings`}
                      style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                    >
                      View findings →
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}

function AppIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function ScanIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function IssueIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
