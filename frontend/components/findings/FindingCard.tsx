// components/findings/FindingCard.tsx
// Component for displaying individual vulnerabilities/findings

'use client';

import React from 'react';
import Link from 'next/link';
import { Finding } from '@/lib/types';
import { Card, Badge } from '@/components/ui';
import { getSeverityColor, getVerificationStatusLabel } from '@/lib/utils';
import styles from './FindingCard.module.css';

interface FindingCardProps {
  finding: Finding;
  scanId: string;
  onClick?: () => void;
  isClickable?: boolean;
}

/**
 * Finding Card Component
 * Displays a vulnerability with severity, verification status, and key details
 * 
 * Features:
 * - Color-coded severity badges
 * - Verification status indicator
 * - Affected component/endpoint
 * - Click to view full details
 */
export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  scanId,
  onClick,
  isClickable = true,
}) => {
  const href = `/scan/${scanId}/findings/${finding.id}`;

  const content = (
    <Card
      isHoverable={isClickable}
      hasBorder
      className={styles.findingCard}
      onClick={onClick}
    >
      {/* Header: Severity Badge + Title + Verification Status */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Badge variant={finding.severity as any} showDot>
            {finding.severity.toUpperCase()}
          </Badge>
          <h4 className={styles.title}>{finding.title}</h4>
        </div>
        <Badge variant={getVerificationStatusBadgeVariant(finding.verificationStatus)}>
          {getVerificationStatusLabel(finding.verificationStatus)}
        </Badge>
      </div>

      {/* Description */}
      <p className={styles.description}>{finding.description}</p>

      {/* Metadata */}
      <div className={styles.metadata}>
        {/* Endpoint or File */}
        {finding.endpoint && (
          <div className={styles.metadataItem}>
            <span className={styles.label}>Endpoint:</span>
            <code className={styles.code}>{finding.endpoint}</code>
          </div>
        )}

        {finding.filePath && (
          <div className={styles.metadataItem}>
            <span className={styles.label}>File:</span>
            <code className={styles.code}>
              {finding.filePath}
              {finding.lineNumber && `:${finding.lineNumber}`}
            </code>
          </div>
        )}

        {finding.affectedComponent && (
          <div className={styles.metadataItem}>
            <span className={styles.label}>Component:</span>
            <span className={styles.value}>{finding.affectedComponent}</span>
          </div>
        )}

        {finding.cveId && (
          <div className={styles.metadataItem}>
            <span className={styles.label}>CVE:</span>
            <code className={styles.code}>{finding.cveId}</code>
          </div>
        )}
      </div>

      {/* Risk Level Indicator */}
      <div className={styles.footer}>
        <div className={styles.riskMeter}>
          <span className={styles.riskLabel}>Remediation Priority:</span>
          <div className={styles.riskBar}>
            <div
              className={styles.riskFill}
              style={{
                width: `${finding.remedationPriority * 10}%`,
                background: getRiskBarColor(finding.remedationPriority),
              }}
              aria-valuenow={finding.remedationPriority}
              aria-valuemin={1}
              aria-valuemax={10}
            />
          </div>
          <span className={styles.riskValue}>{finding.remedationPriority}/10</span>
        </div>

        {isClickable && (
          <p className={styles.viewDetails}>
            View Details →
          </p>
        )}
      </div>
    </Card>
  );

  // Wrap in Link if clickable
  if (isClickable) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};

/**
 * Helper: Get badge variant based on verification status
 */
function getVerificationStatusBadgeVariant(status: string): any {
  switch (status) {
    case 'verified':
      return 'success';
    case 'likely':
      return 'warning';
    case 'potential':
      return 'info';
    case 'informational':
      return 'default';
    default:
      return 'default';
  }
}

/**
 * Helper: Get risk bar color based on priority (1-10)
 */
function getRiskBarColor(priority: number): string {
  if (priority >= 9) return 'var(--color-critical)';        // Red
  if (priority >= 7) return 'var(--color-high)';            // Orange
  if (priority >= 5) return 'var(--color-medium)';          // Yellow
  return 'var(--color-low)';                                // Green
}
