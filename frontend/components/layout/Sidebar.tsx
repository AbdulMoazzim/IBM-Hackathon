// components/layout/Sidebar.tsx
// Main navigation sidebar for dashboard
// Shows menu items, user profile, and theme toggle

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandLogo from '@/components/layout/BrandLogo';

/**
 * SIDEBAR COMPONENT
 * 
 * Features:
 * - Navigation menu with active state
 * - User profile section
 * - Theme toggle
 * - Mobile responsive (collapses to hamburger)
 * - Dark security theme matching design system
 */
export const Sidebar: React.FC = () => {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false); // Mobile sidebar state
    const [isExpanded, setIsExpanded] = useState(true); // Desktop collapse state

    // Navigation menu items
    const navItems = [
        { label: 'Dashboard', href: '/dashboard', icon: '📊' },
        { label: 'New Scan', href: '/scan', icon: '🔍' },
        { label: 'Scans', href: '/scans', icon: '📋' },
        { label: 'Findings', href: '/findings', icon: '⚠️' },
        { label: 'Reports', href: '/reports', icon: '📄' },
    ];

    // Check if route is active
    const isActive = (href: string) => {
        if (!pathname) return false;
        if (href === '/scan') return pathname === '/scan';
        if (href === '/scans') return pathname === '/scans' || pathname.startsWith('/scan/');
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    return (
        <>
            {/* MOBILE TOGGLE BUTTON */}
            <button
                className="vg-sidebar-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
            >
                <span className="vg-sidebar-hamburger" />
            </button>

            {/* SIDEBAR OVERLAY (Mobile) */}
            {isOpen && (
                <div
                    className="vg-sidebar-overlay"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`vg-sidebar ${isOpen ? 'vg-sidebar--open' : ''} ${isExpanded ? '' : 'vg-sidebar--collapsed'}`}>
                {/* LOGO SECTION */}
                <div className="vg-sidebar-logo-section">
                    <Link href="/" className="vg-sidebar-logo">
                        <BrandLogo compact={!isExpanded} className="vg-sidebar-brand-image" />
                    </Link>

                    {/* DESKTOP COLLAPSE BUTTON */}
                    <button
                        className="vg-sidebar-collapse"
                        onClick={() => setIsExpanded(!isExpanded)}
                        title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        {isExpanded ? '◀' : '▶'}
                    </button>
                </div>

                {/* NAVIGATION MENU */}
                <nav className="vg-sidebar-nav">
                    <ul className="vg-sidebar-nav-list">
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`vg-sidebar-item ${isActive(item.href) ? 'vg-sidebar-item--active' : ''}`}
                                    title={!isExpanded ? item.label : undefined}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="vg-sidebar-icon">{item.icon}</span>
                                    {isExpanded && (
                                        <span className="vg-sidebar-label">{item.label}</span>
                                    )}
                                    {isActive(item.href) && (
                                        <div className="vg-sidebar-indicator" />
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* BOTTOM SECTION - Settings & User */}
                <div className="vg-sidebar-bottom">
                    {/* Settings */}
                    <Link
                        href="/settings"
                        className={`vg-sidebar-item ${isActive('/settings') ? 'vg-sidebar-item--active' : ''}`}
                        title={!isExpanded ? 'Settings' : undefined}
                        onClick={() => setIsOpen(false)}
                    >
                        <span className="vg-sidebar-icon">⚙️</span>
                        {isExpanded && <span className="vg-sidebar-label">Settings</span>}
                    </Link>

                    {/* User Profile */}
                    <div className="vg-sidebar-profile">
                        <div className="vg-sidebar-avatar">👤</div>
                        {isExpanded && (
                            <div className="vg-sidebar-user-info">
                                <p className="vg-sidebar-user-name">Developer</p>
                                <p className="vg-sidebar-user-email">dev@vibeguard.com</p>
                            </div>
                        )}
                    </div>

                    {/* Logout Button */}
                    <button
                        className="vg-sidebar-logout"
                        onClick={() => {
                            // BACKEND: Call logout API
                            localStorage.removeItem('authToken');
                            window.location.href = '/login';
                        }}
                        title={!isExpanded ? 'Logout' : undefined}
                    >
                        <span className="vg-sidebar-logout-icon">🚪</span>
                        {isExpanded && <span>Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
