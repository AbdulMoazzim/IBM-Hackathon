'use client';

// app/(dashboard)/scans/page.tsx

import Link from 'next/link';
import { Button } from '@/components/ui';
import ScanCard from '@/components/scan/ScanCard';
import { useScanHistory } from '@/hooks/useScanHistory';

export default function ScansPage() {
  const { scans, isEmpty } = useScanHistory();

  return (
    <div style={{ padding: '40px', maxWidth: 1400, margin: '0 auto' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 20,
          marginBottom: 32,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1>Scan history</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            {isEmpty
              ? 'No scans yet — run your first scan to see results here.'
              : `${scans.length} scan${scans.length !== 1 ? 's' : ''} completed`}
          </p>
        </div>
        <Link href="/scan">
          <Button variant="primary">+ New Scan</Button>
        </Link>
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
          <p style={{ fontSize: 18, marginBottom: 24 }}>
            No scan history yet.
          </p>
          <Link href="/scan">
            <Button variant="primary">Start a Scan</Button>
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {scans.map((scan) => (
            <ScanCard key={scan.id} scan={scan} />
          ))}
        </div>
      )}
    </div>
  );
}
