'use client';

// app/(dashboard)/findings/page.tsx
// Shows every finding across ALL completed scans, with scan label and filters.

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button, Badge, Card } from '@/components/ui';
import { FindingCard } from '@/components/findings/FindingCard';
import { useScanHistory } from '@/hooks/useScanHistory';
import type { SeverityLevel } from '@/lib/types';

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export default function FindingsPage() {
  const { allFindings, isEmpty, totalScans } = useScanHistory();

  const [severityFilter, setSeverityFilter] = useState<SeverityLevel[]>([]);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let f = allFindings;
    if (severityFilter.length > 0) {
      f = f.filter((x) => severityFilter.includes(x.severity));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      f = f.filter(
        (x) =>
          x.title.toLowerCase().includes(q) ||
          x.description.toLowerCase().includes(q) ||
          x.type.toLowerCase().includes(q)
      );
    }
    return [...f].sort(
      (a, b) =>
        (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5)
    );
  }, [allFindings, severityFilter, search]);

  function toggleSeverity(s: SeverityLevel) {
    setSeverityFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  if (isEmpty) {
    return (
      <div style={{ padding: '40px', maxWidth: 1200, margin: '0 auto' }}>
        <header style={{ marginBottom: 32 }}>
          <h1>Security findings</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            No scans yet — run a scan to see findings here.
          </p>
        </header>
        <div
          style={{
            textAlign: 'center',
            padding: '80px 40px',
            border: '1px dashed var(--color-border)',
            borderRadius: 12,
            color: 'var(--color-text-secondary)',
          }}
        >
          <p style={{ fontSize: 18, marginBottom: 24 }}>No findings yet.</p>
          <Link href="/scan">
            <Button variant="primary">Start a Scan</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <h1>Security findings</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
          {allFindings.length} finding{allFindings.length !== 1 ? 's' : ''} across{' '}
          {totalScans} scan{totalScans !== 1 ? 's' : ''}
        </p>
      </header>

      {/* FILTERS */}
      <Card hasBorder padding="lg" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="text"
            placeholder="Search findings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '10px 14px',
              color: 'var(--color-text-primary)',
              fontSize: 14,
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Severity:
            </span>
            {(['critical', 'high', 'medium', 'low'] as SeverityLevel[]).map((s) => (
              <button
                key={s}
                onClick={() => toggleSeverity(s)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: severityFilter.length === 0 || severityFilter.includes(s) ? 1 : 0.35,
                  padding: 0,
                }}
              >
                <Badge variant={s as any}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>
              </button>
            ))}
            {(severityFilter.length > 0 || search) && (
              <button
                onClick={() => { setSeverityFilter([]); setSearch(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  fontSize: 12,
                  textDecoration: 'underline',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* RESULTS */}
      {filtered.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)', padding: '40px 0', textAlign: 'center' }}>
          No findings match your filters.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filtered.map((finding) => (
            <FindingCard
              key={`${finding.scanId}-${finding.id}`}
              finding={finding}
              scanId={finding.scanId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
