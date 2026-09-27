// components/ui/Card.tsx & Badge.tsx
// Reusable card and badge components for consistent UI

import React from 'react';

/* ============================================================================
   CARD COMPONENT
   ============================================================================ */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds hover effect and shadow */
  isHoverable?: boolean;
  /** Adds subtle border */
  hasBorder?: boolean;
  /** Padding size */
  padding?: 'sm' | 'md' | 'lg';
}

/**
 * Card component for grouping related content
 * Used for findings, scans, reports, and other content cards
 * 
 * @example
 * <Card hasBorder padding="md">
 *   <h3>Finding Title</h3>
 *   <p>Finding description</p>
 * </Card>
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, isHoverable = false, hasBorder = false, padding = 'md', className, ...props }, ref) => {
    const classes = `
      card
      ${isHoverable ? 'card--hoverable' : ''}
      ${hasBorder ? 'card--bordered' : ''}
      ${padding ? `card--padding-${padding}` : ''}
      ${className || ''}
    `;

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/* ============================================================================
   BADGE COMPONENT
   ============================================================================ */

export type BadgeVariant = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'success' | 'warning' | 'default';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual style */
  variant?: BadgeVariant;
  /** Pill shaped (more rounded) */
  isPill?: boolean;
  /** Shows dot indicator */
  showDot?: boolean;
}

/**
 * Badge component for status, severity, and categorization
 * 
 * @example
 * <Badge variant="critical">Critical</Badge>
 * <Badge variant="verified" showDot>Verified</Badge>
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', isPill = false, showDot = false, className, ...props }, ref) => {
    const classes = `
      badge
      ${variant ? `badge--${variant}` : ''}
      ${isPill ? 'badge--pill' : ''}
      ${className || ''}
    `;

    return (
      <span ref={ref} className={classes} {...props}>
        {showDot && <span className="badge__dot" aria-hidden="true" />}
        <span className="badge__text">{children}</span>
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/* ============================================================================
   STAT CARD - Special Card variant for Dashboard
   ============================================================================ */

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Stat card for displaying metrics on dashboard
 * 
 * @example
 * <StatCard label="Critical Issues" value={5} trend="down" trendValue="2 from last week" />
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  description,
  trend,
  trendValue,
  icon,
  className,
}) => {
  return (
    <Card hasBorder padding="lg" className={`stat-card ${className || ''}`}>
      <div className="stat-card__content">
        {icon && <div className="stat-card__icon">{icon}</div>}
        <div className="stat-card__main">
          <p className="stat-card__label">{label}</p>
          <div className="stat-card__value">{value}</div>
          {description && <p className="stat-card__description">{description}</p>}
        </div>
      </div>
      {trend && trendValue && (
        <div className={`stat-card__trend stat-card__trend--${trend}`}>
          <span className="stat-card__trend-value">{trendValue}</span>
        </div>
      )}
    </Card>
  );
};
