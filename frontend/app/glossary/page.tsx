import type { Metadata } from 'next';
import Link from 'next/link';
import BrandLogo from '@/components/layout/BrandLogo';
import GlossaryExplorer from '@/components/glossary/GlossaryExplorer';

export const metadata: Metadata = {
  title: 'Security glossary | VibeGuard',
  description: 'Plain-language explanations of common application security terms.',
};

export default function GlossaryPage() {
  return (
    <main className="glossary-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <Link href="/" className="landing-brand"><BrandLogo className="landing-brand-image" /></Link>
        <div className="landing-nav-links"><Link href="/#features">Features</Link><Link href="/#how-it-works">How it works</Link><Link href="/glossary" aria-current="page">Security glossary</Link></div>
        <div className="landing-nav-actions"><Link href="/glossary" className="landing-mobile-glossary">Glossary</Link><Link href="/login" className="landing-login-link">Log in</Link><Link href="/signup" className="button button-primary button-md">Get started <span aria-hidden="true">→</span></Link></div>
      </nav>

      <header className="glossary-hero">
        <Link className="glossary-back" href="/">← Back to VibeGuard</Link>
        <span className="section-kicker">THE VIBEGUARD FIELD GUIDE</span>
        <h1>Security terms</h1>
        <p>Security reports can be full of unfamiliar words. Use this guide to understand what they mean, why they matter, and what a risk could lead to.</p>
      </header>

      <GlossaryExplorer />

      <footer className="landing-footer glossary-footer"><Link href="/" className="landing-brand"><BrandLogo className="landing-brand-image" /></Link><p>Security auditing for AI-built applications.</p><div><Link href="/">Home</Link><Link href="/login">Log in</Link><Link href="/signup">Sign up</Link></div><small>© 2026 VibeGuard. Built to help you ship with confidence.</small></footer>
    </main>
  );
}
