'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  return (
    <div style={{ padding: '40px', maxWidth: 900, margin: '0 auto' }}>
      <header style={{ marginBottom: 32 }}><h1>Settings</h1><p>Manage your local demo profile and dashboard preferences.</p></header>
      <Card hasBorder padding="lg">
        <h2>Profile</h2>
        <div style={{ display: 'grid', gap: 18, maxWidth: 560, marginTop: 24 }}>
          <label style={{ display: 'grid', gap: 8 }}>Name<input defaultValue="Developer" /></label>
          <label style={{ display: 'grid', gap: 8 }}>Email<input type="email" defaultValue="dev@vibeguard.com" /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} /> Email me when a scan completes</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><Button onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 2500); }}>Save preferences</Button>{saved && <span role="status" style={{ color: 'var(--color-low)' }}>Preferences saved for this demo.</span>}</div>
        </div>
      </Card>
    </div>
  );
}
