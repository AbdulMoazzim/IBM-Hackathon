// components/scan/ScanCard.tsx
// Component for displaying a scan summary card
// Shows score, findings count, and status

'use client';

import React from 'react';
import Link from 'next/link';
import { Scan } from '@/lib/types';
import { Card, Badge } from '@/components/ui';
import { formatDate, getScoreCategory } from '@/lib/utils';
import styles from './ScanCard.module.css';

interface ScanCardProps {
  scan: Scan;
  isClickable?: boolean;
  onClick?: () => void;
}

/**
 * SCAN CARD COMPONENT
 * 
 * Displays:
 * - Application name
 * - Security score with visual indicator
 * - Finding counts by severity
 * - Scan status and date
 * - Framework/tech stack icons
 */
export const ScanCard: React.FC<ScanCardProps> = ({
  scan,
  isClickable = true,
  onClick,
}) => {
  const scoreCategory = getScoreCategory(scan.securityScore);
  // For real VibeGuard scans navigate directly to findings; for mock demo scans fall back to scan root
  const href = scan.id.startsWith('vg-') ? `/scan/${scan.id}/findings` : `/scan/${scan.id}`;

  const content = (
    <Card isHoverable={isClickable} hasBorder className={styles.card}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>{scan.applicationName}</h3>
          <p className={styles.subtitle}>Scan on {formatDate(scan.createdAt)}</p>
        </div>
        <Badge variant={getStatusBadgeVariant(scan.status)}>
          {formatStatus(scan.status)}
        </Badge>
      </div>

      {/* SCORE SECTION */}
      <div className={styles.scoreSection}>
        <div className={styles.scoreCircle}>
          <div
            className={styles.scoreValue}
            style={{ color: getScoreColor(scan.securityScore) }}
          >
            {scan.securityScore}
          </div>
          <div className={styles.scoreLabel}>/ 100</div>
        </div>
        <div className={styles.scoreDescription}>
          <p className={styles.scoreCategory}>
            {scoreCategory.charAt(0).toUpperCase() + scoreCategory.slice(1)}
          </p>
          <p className={styles.scoreText}>
            {getScoreCategoryDescription(scoreCategory)}
          </p>
        </div>
      </div>

      {/* FINDINGS BREAKDOWN */}
      <div className={styles.findingsGrid}>
        <div className={styles.findingItem}>
          <Badge variant="critical">{scan.criticalCount}</Badge>
          <span className={styles.findingLabel}>Critical</span>
        </div>
        <div className={styles.findingItem}>
          <Badge variant="high">{scan.highCount}</Badge>
          <span className={styles.findingLabel}>High</span>
        </div>
        <div className={styles.findingItem}>
          <Badge variant="medium">{scan.mediumCount}</Badge>
          <span className={styles.findingLabel}>Medium</span>
        </div>
        <div className={styles.findingItem}>
          <Badge variant="low">{scan.lowCount}</Badge>
          <span className={styles.findingLabel}>Low</span>
        </div>
      </div>

      {/* TECH STACK */}
      {scan.detectedTechs && scan.detectedTechs.length > 0 && (
        <div className={styles.techStack}>
          <p className={styles.techLabel}>Technologies</p>
          <div className={styles.techList}>
            {scan.detectedTechs.slice(0, 3).map((tech) => (
              <span key={tech.name} className={styles.tech} title={tech.version}>
                {tech.name}
                {tech.version && <span className={styles.techVersion}>{tech.version}</span>}
              </span>
            ))}
            {scan.detectedTechs.length > 3 && (
              <span className={styles.tech}>+{scan.detectedTechs.length - 3} more</span>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className={styles.footer}>
        {isClickable && (
          <p className={styles.viewLink}>
            View Details →
          </p>
        )}
      </div>
    </Card>
  );

  if (isClickable) {
    return <Link href={href} className={styles.cardLink}>{content}</Link>;
  }

  return content;
};

/**
 * Helper: Get badge variant based on scan status
 */
function getStatusBadgeVariant(status: string): any {
  switch (status) {
    case 'completed':
      return 'success';
    case 'analyzing':
      return 'warning';
    case 'failed':
      return 'danger';
    default:
      return 'info';
  }
}

/**
 * Helper: Format status text
 */
function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Helper: Get score color based on value
 */
function getScoreColor(score: number): string {
  if (score >= 85) return '#34c759';       // Green - excellent
  if (score >= 60) return '#ffcc00';       // Yellow - good
  if (score >= 40) return '#ff9500';       // Orange - fair
  return '#ff3b30';                        // Red - poor
}

/**
 * Helper: Get category description
 */
function getScoreCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    critical: 'Critical issues require immediate attention',
    poor: 'Multiple issues should be addressed',
    fair: 'Several issues should be reviewed',
    good: 'Minor issues found',
    excellent: 'Strong security posture',
  };
  return descriptions[category] || '';
}

export default ScanCard;
