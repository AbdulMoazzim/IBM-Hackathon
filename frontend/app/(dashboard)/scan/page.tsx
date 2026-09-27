'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { vibeGuardAPI } from '@/lib/api';
import type { VibeGuardAnalysisResponse } from '@/lib/types';

export default function ScanPage() {
  const router = useRouter();
  const [appName, setAppName] = useState('');
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsScanning(true);

    try {
      const result: VibeGuardAnalysisResponse = await vibeGuardAPI.scan(url);

      // Generate a client-side scan ID and persist the real response
      const scanId = `vg-${Date.now()}`;
      sessionStorage.setItem(
        `vibeguard_scan_${scanId}`,
        JSON.stringify({ appName, url, ...result })
      );

      router.push(`/scan/${scanId}/findings`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed — check that the backend is running.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: 900, margin: '0 auto' }}>
      <header style={{ marginBottom: 32 }}>
        <h1>Start a security scan</h1>
        <p>Enter a public HTTPS URL to run a live DAST scan.</p>
      </header>

      <Card hasBorder padding="lg">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20, maxWidth: 620 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            Application name
            <input
              required
              placeholder="e.g. Customer Portal"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            Website URL
            <input
              required
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isScanning}
            />
          </label>

          <Button type="submit" disabled={isScanning}>
            {isScanning ? 'Scanning…' : 'Run security scan'}
          </Button>
        </form>

        {isScanning && (
          <div role="status" style={{ marginTop: 24, padding: 16, border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <strong>Scanning {url}</strong>
            <p style={{ marginTop: 8, color: 'var(--color-muted)' }}>
              Running DAST checks and LLM analysis — this may take 30–90 seconds…
            </p>
          </div>
        )}

        {error && (
          <div role="alert" style={{ marginTop: 24, padding: 16, border: '1px solid var(--color-critical)', borderRadius: 8, color: 'var(--color-critical)' }}>
            <strong>Scan failed</strong>
            <p style={{ marginTop: 8 }}>{error}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
