'use client';

// app/(dashboard)/scan/[scanId]/report/page.tsx
// Full security report for a single scan — data from sessionStorage only.

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import { Card, Badge } from '@/components/ui';
import { useScanHistory } from '@/hooks/useScanHistory';
import { adaptVibeGuardFinding, VibeGuardAnalysisResponse } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

function getRiskBarColor(priority: number) {
  if (priority >= 9) return 'var(--color-critical)';
  if (priority >= 7) return 'var(--color-high)';
  if (priority >= 5) return 'var(--color-medium)';
  return 'var(--color-low)';
}

export default function ScanReportPage() {
  const params = useParams();
  const scanId = params?.scanId as string;
  const { scans } = useScanHistory();

  // Read the stored response directly from sessionStorage for this scan
  const stored = useMemo(() => {
    if (typeof window === 'undefined' || !scanId) return null;
    const raw = sessionStorage.getItem(`vibeguard_scan_${scanId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as VibeGuardAnalysisResponse & { appName?: string; url?: string };
    } catch {
      return null;
    }
  }, [scanId]);

  const scan = scans.find((s) => s.id === scanId);

  if (!stored || !scan) {
    return (
      <div style={{ padding: '40px', maxWidth: 960, margin: '0 auto' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Report not found.{' '}
          <Link href="/reports" style={{ color: 'var(--color-primary)' }}>
            ← Back to reports
          </Link>
        </p>
      </div>
    );
  }

  const findings = (stored.findings || [])
    .map((vgf) => adaptVibeGuardFinding(vgf, scanId))
    .sort((a, b) => (SEV_ORDER[a.severity] ?? 5) - (SEV_ORDER[b.severity] ?? 5));

  const counts = {
    critical: findings.filter((f) => f.severity === 'critical').length,
    high:     findings.filter((f) => f.severity === 'high').length,
    medium:   findings.filter((f) => f.severity === 'medium').length,
    low:      findings.filter((f) => f.severity === 'low').length,
  };

  const topActions = [...findings]
    .sort((a, b) => b.remedationPriority - a.remedationPriority)
    .slice(0, 5);

  return (
    <div style={{ padding: '40px', maxWidth: 960, margin: '0 auto' }}>

      {/* BACK LINK */}
      <Link
        href="/reports"
        style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 14 }}
      >
        ← Back to reports
      </Link>

      {/* HEADER */}
      <div style={{ marginTop: 24, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ marginBottom: 8 }}>{scan.applicationName}</h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: 14 }}>
              Scanned {formatDate(scan.createdAt)}
              {stored.url && (
                <>
                  {' · '}
                  <a
                    href={stored.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                  >
                    {stored.url}
                  </a>
                </>
              )}
            </p>
          </div>
          {/* Security Score */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 48,
              fontWeight: 700,
              color: scan.securityScore >= 85 ? '#34c759' : scan.securityScore >= 60 ? '#ffcc00' : '#ff3b30',
              lineHeight: 1,
            }}>
              {scan.securityScore}
            </div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>/ 100 security score</div>
          </div>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <Card hasBorder padding="lg" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 12 }}>Executive Summary</h2>
        <p style={{ lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: 0 }}>
          {stored.summary || `Security scan of ${scan.applicationName} completed.`}
          {findings.length > 0
            ? ` A total of ${findings.length} finding${findings.length !== 1 ? 's' : ''} were identified: ` +
              `${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, and ${counts.low} low severity.`
            : ' No security findings were detected.'}
        </p>

        {/* Risk badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
          {counts.critical > 0 && <Badge variant="critical">{counts.critical} Critical</Badge>}
          {counts.high     > 0 && <Badge variant="high">{counts.high} High</Badge>}
          {counts.medium   > 0 && <Badge variant="medium">{counts.medium} Medium</Badge>}
          {counts.low      > 0 && <Badge variant="low">{counts.low} Low</Badge>}
          {findings.length === 0 && <Badge variant="success">No findings</Badge>}
        </div>
      </Card>

      {/* IMMEDIATE ACTIONS */}
      {topActions.length > 0 && (
        <Card hasBorder padding="lg" style={{ marginBottom: 24, border: '1px solid rgba(0,255,0,0.2)' }}>
          <h2 style={{ marginBottom: 16 }}>Immediate Actions</h2>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topActions.map((f) => (
              <li key={f.id} style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--color-text-primary)' }}>{f.title}</strong>
                {' — '}
                {f.recommendedFix.split('\n')[0]}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* ALL FINDINGS */}
      {findings.length > 0 && (
        <section>
          <h2 style={{ marginBottom: 16 }}>All Findings ({findings.length})</h2>
          <div style={{ display: 'grid', gap: 16 }}>
            {findings.map((f) => (
              <Card key={f.id} hasBorder padding="lg">
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <Badge variant={f.severity as any} showDot>{f.severity.toUpperCase()}</Badge>
                    <strong style={{ fontSize: 16 }}>{f.title}</strong>
                  </div>
                  <Badge variant={
                    f.verificationStatus === 'verified' ? 'success' :
                    f.verificationStatus === 'likely'   ? 'warning' :
                    f.verificationStatus === 'potential' ? 'info' : 'default'
                  }>
                    {f.verificationStatus.charAt(0).toUpperCase() + f.verificationStatus.slice(1)}
                  </Badge>
                </div>

                {/* Description */}
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.65, margin: '0 0 12px' }}>
                  {f.description}
                </p>

                {/* Metadata grid */}
                <div style={{
                  padding: '12px 14px',
                  background: 'rgba(0,255,0,0.03)',
                  border: '1px solid rgba(0,255,0,0.1)',
                  borderRadius: 8,
                  display: 'grid',
                  gap: 8,
                  marginBottom: 12,
                }}>
                  {f.affectedComponent && (
                    <Row label="Component" value={f.affectedComponent} />
                  )}
                  {f.filePath && f.filePath !== f.affectedComponent && (
                    <Row label="File" value={f.filePath} mono />
                  )}
                  {f.endpoint && <Row label="Endpoint" value={f.endpoint} mono />}
                  <Row label="Impact" value={f.impact} />
                  {f.evidence.codeSnippet && (
                    <Row label="Evidence" value={f.evidence.codeSnippet} mono />
                  )}
                </div>

                {/* Recommended fix */}
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                    Recommended Fix
                  </p>
                  <p style={{ color: 'var(--color-text-primary)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', fontSize: 14 }}>
                    {f.recommendedFix}
                  </p>
                </div>

                {/* Priority bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                    Remediation Priority
                  </span>
                  <div style={{ flex: 1, height: 6, background: 'var(--color-surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${f.remedationPriority * 10}%`, background: getRiskBarColor(f.remedationPriority), borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                    {f.remedationPriority}/10
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12, fontSize: 13, flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.5px', color: 'var(--color-text-secondary)', minWidth: 90 }}>
        {label}
      </span>
      {mono ? (
        <code style={{ color: 'var(--color-primary)', background: 'var(--color-surface-2)', padding: '1px 6px', borderRadius: 4, flex: 1, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
          {value}
        </code>
      ) : (
        <span style={{ color: 'var(--color-text-primary)', flex: 1 }}>{value}</span>
      )}
    </div>
  );
}
