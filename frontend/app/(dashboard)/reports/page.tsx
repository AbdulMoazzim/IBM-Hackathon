'use client';

// app/(dashboard)/reports/page.tsx
// Lists one report card per completed scan — no mock data.

import Link from 'next/link';
import { Card, Badge } from '@/components/ui';
import { useScanHistory } from '@/hooks/useScanHistory';
import { formatDate } from '@/lib/utils';

export default function ReportsPage() {
  const { scans, allFindings, isEmpty } = useScanHistory();

  return (
    <div style={{ padding: '40px', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 32 }}>
        <h1>Security reports</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
          {isEmpty
            ? 'No scans yet — run a scan to generate a report.'
            : `${scans.length} report${scans.length !== 1 ? 's' : ''} from your completed scans.`}
        </p>
      </header>

      {isEmpty ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 40px',
            border: '1px dashed var(--color-border)',
            borderRadius: 12,
            color: 'var(--color-text-secondary)',
          }}
        >
          <p style={{ fontSize: 18, marginBottom: 24 }}>No reports yet.</p>
          <Link href="/scan" className="button button-primary button-md">
            Start a Scan
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {scans.map((scan) => {
            // Findings for this specific scan
            const scanFindings = allFindings.filter((f) => f.scanId === scan.id);
            const counts = {
              critical: scanFindings.filter((f) => f.severity === 'critical').length,
              high:     scanFindings.filter((f) => f.severity === 'high').length,
              medium:   scanFindings.filter((f) => f.severity === 'medium').length,
              low:      scanFindings.filter((f) => f.severity === 'low').length,
            };

            // Brief executive summary derived from real findings
            const topSeverity =
              counts.critical > 0 ? 'critical' :
              counts.high     > 0 ? 'high'     :
              counts.medium   > 0 ? 'medium'   :
              counts.low      > 0 ? 'low'       : null;

            const summary = topSeverity
              ? `Scan found ${scanFindings.length} finding${scanFindings.length !== 1 ? 's' : ''} ` +
                `(${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.low} low). ` +
                `Highest severity: ${topSeverity}. ` +
                `Security score: ${scan.securityScore}/100.`
              : `Scan of ${scan.applicationUrl || scan.applicationName} completed with no findings. Security score: ${scan.securityScore}/100.`;

            return (
              <Card key={scan.id} hasBorder padding="lg">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 20,
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                  }}
                >
                  <div>
                    <Badge variant="success">Ready</Badge>
                    <h2 style={{ marginTop: 12, marginBottom: 4 }}>{scan.applicationName}</h2>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: 14 }}>
                      Generated {formatDate(scan.createdAt)} · Score {scan.securityScore}/100
                      {scan.applicationUrl && (
                        <>
                          {' · '}
                          <a
                            href={scan.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                          >
                            {scan.applicationUrl}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <Link
                    href={`/scan/${scan.id}/report`}
                    className="button button-primary button-md"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    View report →
                  </Link>
                </div>

                <p style={{ marginTop: 20, lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
                  {summary}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                  {counts.critical > 0 && <Badge variant="critical">{counts.critical} critical</Badge>}
                  {counts.high     > 0 && <Badge variant="high">{counts.high} high</Badge>}
                  {counts.medium   > 0 && <Badge variant="medium">{counts.medium} medium</Badge>}
                  {counts.low      > 0 && <Badge variant="low">{counts.low} low</Badge>}
                  {scanFindings.length === 0 && <Badge variant="success">No findings</Badge>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
