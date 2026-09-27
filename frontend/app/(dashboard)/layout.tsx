import React from 'react';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg-primary, #000000)' }}>
      <Sidebar />
      {/* We add a left margin equal to the sidebar width for desktop */}
      <main style={{ flex: 1, width: '100%' }} className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
