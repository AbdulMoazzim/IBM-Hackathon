import Link from 'next/link';
import BrandLogo from '@/components/layout/BrandLogo';

const coverage = [
  ['01', 'Authentication', 'Review identity flows, session handling, and access checks.'],
  ['02', 'API security', 'Understand exposed routes, authorization, and risky endpoints.'],
  ['03', 'Database security', 'Inspect data access policies and configuration.'],
  ['04', 'Dependencies', 'Surface outdated packages and known security concerns.'],
  ['05', 'Secrets', 'Look for credentials that should not be in application code.'],
  ['06', 'Configuration', 'Review security headers and deployment settings.'],
];

const capabilities = [
  ['Analyze', 'Inspect source code, APIs, dependencies, and configuration together.'],
  ['Understand', 'Get clear context about why a security concern matters.'],
  ['Verify', 'Separate possible risks from issues supported by evidence.'],
  ['Report', 'Review severity, evidence, and practical remediation guidance.'],
];

export default function HomePage() {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <Link href="/" className="landing-brand"><BrandLogo className="landing-brand-image" /></Link>
        <div className="landing-nav-links"><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#why-vibeguard">Why VibeGuard</a><Link href="/glossary">Security glossary</Link></div>
        <div className="landing-nav-actions"><Link href="/glossary" className="landing-mobile-glossary">Glossary</Link><Link href="/login" className="landing-login-link">Log in</Link><Link href="/signup" className="button button-primary button-md">Get started <span aria-hidden="true">→</span></Link></div>
      </nav>

      <section className="landing-hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> SECURITY AUDITING FOR AI-BUILT APPS</div>
          <h1>Build fast with AI.<br /><span>Secure before you ship.</span></h1>
          <p className="hero-description">VibeGuard helps you review the security of applications built with AI coding tools—so you can understand risks before they reach production.</p>
          <div className="hero-actions"><Link href="/signup" className="button button-primary button-lg">Get started <span aria-hidden="true">→</span></Link><Link href="/login" className="button button-outline button-lg">Log in</Link></div>
          <p className="hero-footnote"><span>✓</span> Source code + API security auditing</p>
        </div>
        <div className="hero-visual" aria-label="VibeGuard turns an application into clear security insights">
          <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
          <div className="flow-node app-node"><span className="node-icon">⌘</span><span><b>AI-built application</b><small>URL · GitHub · project files</small></span></div>
          <div className="flow-line"><span /></div>
          <div className="audit-core"><div className="shield-symbol">✦</div><strong>VibeGuard</strong><small>SECURITY AUDIT</small><div className="audit-pulse" /></div>
          <div className="flow-line lower"><span /></div>
          <div className="insight-node"><span className="insight-check">✓</span><span><b>Security insights</b><small>Understand · Prioritize · Fix</small></span><span className="insight-score">Ready</span></div>
          <div className="visual-tag tag-left">SAST <span>＋</span> DAST</div><div className="visual-tag tag-right">AI-ASSISTED ANALYSIS</div>
        </div>
      </section>

      <section className="landing-proof"><span>One clear view across the parts that matter</span><div><b>CODE</b><i /><b>APIs</b><i /><b>AUTH</b><i /><b>DATA</b><i /><b>DEPENDENCIES</b></div></section>

      <section className="landing-section problem-section" id="why-vibeguard">
        <div className="section-heading"><span className="section-kicker">WHY VIBEGUARD</span><h2>AI makes building faster.<br /><span>Security needs to keep up.</span></h2><p>AI coding tools can turn an idea into a working application quickly. Security gaps in authentication, APIs, or configuration can be easier to miss when you move fast. VibeGuard helps make those areas easier to review.</p></div>
        <div className="coverage-grid">{coverage.map(([number, title, description]) => <article className="coverage-card" key={title}><span className="coverage-number">{number}</span><h3>{title}</h3><p>{description}</p><span className="coverage-arrow">↗</span></article>)}</div>
      </section>

      <section className="landing-section feature-section" id="features">
        <div className="section-heading centered"><span className="section-kicker">YOUR SECURITY LAYER</span><h2>From code to a clearer<br /><span>security picture.</span></h2><p>VibeGuard brings analysis, context, verification, and reporting into one understandable workflow.</p></div>
        <div className="capability-grid">{capabilities.map(([title, description], index) => <article className="capability-card" key={title}><div className="capability-icon">{['⌕', '⌘', '✓', '▤'][index]}</div><span className="capability-step">0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>

      <section className="landing-section workflow-section" id="how-it-works">
        <div className="section-heading"><span className="section-kicker">HOW IT WORKS</span><h2>From application to<br /><span>security assessment.</span></h2><p>Start with the project you already have. VibeGuard organizes the review into clear steps.</p></div>
        <div className="workflow-grid">{[['01', 'Connect', 'Provide a live URL, GitHub repository, or project files.'], ['02', 'Discover', 'Identify frameworks, APIs, databases, auth, and dependencies.'], ['03', 'Analyze', 'Review code and live behavior, with AI-assisted reasoning.'], ['04', 'Report', 'Get severity, evidence, verification status, and suggested fixes.']].map(([number, title, text], index) => <article className="workflow-step" key={number}><div className="workflow-top"><span>{number}</span>{index < 3 && <i />}</div><h3>{title}</h3><p>{text}</p></article>)}</div>
        <div className="analysis-strip"><div><span className="analysis-label">STATIC ANALYSIS</span><b>Source code</b><span>Inspect code and configuration without running the app.</span></div><span className="analysis-plus">+</span><div><span className="analysis-label">DYNAMIC ANALYSIS</span><b>Live application</b><span>Review externally visible behavior and API responses.</span></div><span className="analysis-equals">→</span><div className="analysis-result"><span className="analysis-label">THE OUTCOME</span><b>Useful security evidence</b><span>More context for understanding and prioritizing risk.</span></div></div>
      </section>

      <section className="landing-final-cta"><div className="cta-glow" /><span className="section-kicker">READY WHEN YOU ARE</span><h2>Built with AI?<br /><span>Check it before you ship it.</span></h2><p>Start with a demo account and explore the VibeGuard security workflow.</p><Link href="/signup" className="button button-primary button-lg">Get started <span aria-hidden="true">→</span></Link><small>Already have an account? <Link href="/login">Log in</Link></small></section>

      <footer className="landing-footer"><Link href="/" className="landing-brand"><BrandLogo className="landing-brand-image" /></Link><p>Security auditing for AI-built applications.</p><div><a href="#features">Features</a><a href="#how-it-works">How it works</a><Link href="/glossary">Security glossary</Link><Link href="/login">Log in</Link><Link href="/signup">Sign up</Link></div><small>© 2026 VibeGuard. Built to help you ship with confidence.</small></footer>
    </main>
  );
}
