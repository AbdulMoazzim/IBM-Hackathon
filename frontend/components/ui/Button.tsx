// components/ui/Button.tsx
// Reusable Button component with multiple variants and sizes
// Used throughout the app for consistent interactions

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visual style variant */
    variant?: ButtonVariant;
    /** Button size */
    size?: ButtonSize;
    /** Show loading spinner */
    isLoading?: boolean;
    /** Full width button */
    fullWidth?: boolean;
    /** Icon element (left side) */
    icon?: React.ReactNode;
    /** Icon element (right side) */
    iconRight?: React.ReactNode;
}

/**
 * Professional button component for VibeGuard
 * 
 * @example
 * <Button variant="primary" size="md">Start Scan</Button>
 * <Button variant="danger" isLoading>Processing...</Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            fullWidth = false,
            icon,
            iconRight,
            children,
            disabled,
            className,
            ...props
        },
        ref
    ) => {
        const baseClass = `button button-${variant} button-${size}`;
        const classes = `${baseClass} ${fullWidth ? 'w-full' : ''} ${isLoading ? 'is-loading' : ''} ${className || ''}`;

        return (
            <button
                ref={ref}
                className={classes}
                disabled={disabled || isLoading}
                {...props}
            >
                {/* Loading spinner */}
                {isLoading && (
                    <span className="button__spinner" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" opacity="0.2" />
                            <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </span>
                )}

                {/* Left icon */}
                {!isLoading && icon && <span className="button__icon-left">{icon}</span>}

                {/* Button text */}
                <span className="button__text">{children}</span>

                {/* Right icon */}
                {!isLoading && iconRight && <span className="button__icon-right">{iconRight}</span>}
            </button>
        );
    }
);

Button.displayName = 'Button';
