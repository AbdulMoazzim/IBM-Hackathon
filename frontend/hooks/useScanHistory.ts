'use client';

// hooks/useScanHistory.ts
// Reads all completed VibeGuard scans from sessionStorage and derives
// the Scan + Finding shapes the existing UI components expect.
// No mock data. No backend polling. Source of truth = sessionStorage.

import { useState, useEffect } from 'react';
import {
  Scan,
  Finding,
  VibeGuardAnalysisResponse,
  VibeGuardFinding,
  adaptVibeGuardFinding,
  SeverityLevel,
} from '@/lib/types';

export interface StoredScan {
  scanId: string;
  appName: string;
  url: string;
  scannedAt: string; // ISO string
  response: VibeGuardAnalysisResponse;
}

/** Read every vibeguard_scan_* key from sessionStorage and parse them. */
function readStoredScans(): StoredScan[] {
  if (typeof window === 'undefined') return [];
  const result: StoredScan[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (!key?.startsWith('vibeguard_scan_vg-')) continue;
    try {
      const raw = sessionStorage.getItem(key)!;
      const parsed = JSON.parse(raw) as {
        appName?: string;
        url?: string;
        summary?: string;
        risk_level?: string;
        findings?: VibeGuardFinding[];
      };
      // scanId is embedded in the key: vibeguard_scan_<scanId>
      const scanId = key.replace('vibeguard_scan_', '');
      // timestamp embedded in scanId: vg-<timestamp>
      const ts = parseInt(scanId.replace('vg-', ''), 10);
      result.push({
        scanId,
        appName: parsed.appName || parsed.url || 'Unknown application',
        url: parsed.url || '',
        scannedAt: isNaN(ts) ? new Date().toISOString() : new Date(ts).toISOString(),
        response: {
          summary: parsed.summary || '',
          risk_level: (parsed.risk_level as VibeGuardAnalysisResponse['risk_level']) || 'medium',
          findings: parsed.findings || [],
        },
      });
    } catch {
      // skip corrupt entries
    }
  }
  // newest first
  return result.sort((a, b) => b.scannedAt.localeCompare(a.scannedAt));
}

/** Convert a StoredScan into the Scan shape ScanCard expects. */
function toScan(stored: StoredScan): Scan {
  const findings = stored.response.findings;
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) {
    const sev = f.severity as SeverityLevel;
    if (sev === 'critical') counts.critical++;
    else if (sev === 'high') counts.high++;
    else if (sev === 'medium') counts.medium++;
    else if (sev === 'low') counts.low++;
  }
  // Simple security score: start at 100, subtract weighted penalty per finding
  const penalty = counts.critical * 20 + counts.high * 10 + counts.medium * 5 + counts.low * 2;
  const securityScore = Math.max(0, 100 - penalty);

  return {
    id: stored.scanId,
    userId: 'local',
    name: `${stored.appName} scan`,
    applicationName: stored.appName,
    applicationUrl: stored.url,
    inputType: 'url',
    status: 'completed',
    securityScore,
    totalFindings: findings.length,
    criticalCount: counts.critical,
    highCount: counts.high,
    mediumCount: counts.medium,
    lowCount: counts.low,
    dependencies: [],
    createdAt: new Date(stored.scannedAt),
    completedAt: new Date(stored.scannedAt),
  };
}

export interface ScanHistoryData {
  scans: Scan[];
  allFindings: Finding[];
  totalScans: number;
  openIssues: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  isEmpty: boolean;
}

export function useScanHistory(): ScanHistoryData {
  const [data, setData] = useState<ScanHistoryData>({
    scans: [],
    allFindings: [],
    totalScans: 0,
    openIssues: 0,
    criticalFindings: 0,
    highFindings: 0,
    mediumFindings: 0,
    lowFindings: 0,
    isEmpty: true,
  });

  useEffect(() => {
    const stored = readStoredScans();
    const scans = stored.map(toScan);

    const allFindings: Finding[] = [];
    for (const s of stored) {
      for (const vgf of s.response.findings) {
        allFindings.push(adaptVibeGuardFinding(vgf, s.scanId));
      }
    }

    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const f of allFindings) {
      if (f.severity === 'critical') counts.critical++;
      else if (f.severity === 'high') counts.high++;
      else if (f.severity === 'medium') counts.medium++;
      else if (f.severity === 'low') counts.low++;
    }

    setData({
      scans,
      allFindings,
      totalScans: scans.length,
      openIssues: allFindings.length,
      criticalFindings: counts.critical,
      highFindings: counts.high,
      mediumFindings: counts.medium,
      lowFindings: counts.low,
      isEmpty: scans.length === 0,
    });
  }, []);

  return data;
}
