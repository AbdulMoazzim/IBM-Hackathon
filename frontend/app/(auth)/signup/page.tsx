'use client';

import Link from 'next/link';
import BrandLogo from '@/components/layout/BrandLogo';

export default function SignupPage() {
  function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.assign('/dashboard');
  }

  return (
    <main className="auth-page">
      <div className="auth-ambient" />
      <section className="auth-card">
        <Link href="/" className="landing-brand auth-brand"><BrandLogo className="auth-brand-image" /></Link>
        <div className="auth-heading"><span className="section-kicker">GET STARTED</span><h1>Create your account</h1><p>Use the demo profile to explore the security workspace.</p></div>
        <form className="auth-form" onSubmit={handleSignup}>
          <label>Name<input defaultValue="Developer" required /></label>
          <label>Email address<input type="email" defaultValue="dev@vibeguard.com" required /></label>
          <label>Password<input type="password" placeholder="Choose a demo password" required /></label>
          <button className="button button-primary button-lg auth-submit" type="submit">Create demo account <span aria-hidden="true">→</span></button>
        </form>
        <div className="demo-note"><span>i</span><p>This is a frontend demo. Account details are not saved or sent to a server.</p></div>
        <p className="auth-switch">Already have an account? <Link href="/login">Log in</Link></p>
        <Link href="/" className="auth-back">← Back to VibeGuard</Link>
      </section>
    </main>
  );
}
