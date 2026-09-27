'use client';

import Link from 'next/link';
import BrandLogo from '@/components/layout/BrandLogo';

export default function LoginPage() {
  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requestedPath = new URLSearchParams(window.location.search).get('next');
    const safePath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/dashboard';
    window.location.assign(safePath);
  }

  return (
    <main className="auth-page">
      <div className="auth-ambient" />
      <section className="auth-card">
        <Link href="/" className="landing-brand auth-brand"><BrandLogo className="auth-brand-image" /></Link>
        <div className="auth-heading"><span className="section-kicker">DEMO ACCESS</span><h1>Welcome back</h1><p>Sign in to continue to your VibeGuard dashboard.</p></div>
        <form className="auth-form" onSubmit={handleLogin}>
          <label>Email address<input type="email" value="dev@vibeguard.com" readOnly /></label>
          <label>Password<input type="password" placeholder="Enter any password" autoComplete="current-password" /></label>
          <button className="button button-primary button-lg auth-submit" type="submit">Log in <span aria-hidden="true">→</span></button>
        </form>
        <div className="demo-note"><span>i</span><p><b>Demo account</b><br />Developer · dev@vibeguard.com<br />No backend authentication is connected yet.</p></div>
        <p className="auth-switch">New to VibeGuard? <Link href="/signup">Create a demo account</Link></p>
        <Link href="/" className="auth-back">← Back to VibeGuard</Link>
      </section>
    </main>
  );
}
