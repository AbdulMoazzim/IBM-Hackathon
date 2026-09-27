'use client';

import { useMemo, useState } from 'react';

const terms = [
  { term: 'Authentication', category: 'Identity & access', definition: 'Checking that a person or service really is who it claims to be—often with a password, passkey, or sign-in token.', why: 'It is the front door to accounts and private features.', risk: 'Someone may get into an account without proving they own it.' },
  { term: 'Authorization', category: 'Identity & access', definition: 'Deciding what an authenticated person or service is allowed to see or do.', why: 'A valid login should only grant the access that user needs.', risk: 'A user may reach actions or information meant for someone else.' },
  { term: 'Broken Access Control', category: 'Identity & access', definition: 'A broad name for missing or incorrect permission checks.', why: 'Every protected page, API action, and record needs the right access check.', risk: 'Users may view, change, or delete data or actions outside their permissions.' },
  { term: 'IDOR / BOLA', category: 'Identity & access', definition: 'A type of access-control flaw where changing an ID in a URL or request can expose another person’s record because ownership was not checked.', why: 'APIs often identify records with IDs that users can alter.', risk: 'Private records may be read or changed by the wrong user.' },
  { term: 'Multi-factor Authentication (MFA)', category: 'Identity & access', definition: 'A sign-in that asks for two different kinds of proof, such as a password and an authenticator app code.', why: 'A stolen password alone is less likely to be enough to sign in.', risk: 'An attacker with a leaked password has a simpler path into the account.' },
  { term: 'SQL Injection', category: 'Web & APIs', definition: 'When untrusted input is treated as part of a database command instead of ordinary data.', why: 'Database queries should keep user input separate from the command itself.', risk: 'An attacker may be able to read, alter, or remove data, depending on the query and permissions.' },
  { term: 'Cross-Site Scripting (XSS)', category: 'Web & APIs', definition: 'When a site shows untrusted content in a way that lets it run as code in another visitor’s browser.', why: 'A browser trusts code that comes from the site it is visiting.', risk: 'An attacker may act through a visitor’s session or show misleading content.' },
  { term: 'Cross-Site Request Forgery (CSRF)', category: 'Web & APIs', definition: 'Tricking a signed-in browser into sending an unwanted request to a site where the user is already logged in.', why: 'Browsers may automatically include sign-in cookies with requests.', risk: 'A user may unknowingly trigger an action on their account.' },
  { term: 'Server-Side Request Forgery (SSRF)', category: 'Web & APIs', definition: 'Tricking a server into making a network request chosen by an attacker.', why: 'A server may be able to reach private services that the public cannot.', risk: 'Internal services or data could be exposed if requests are not restricted.' },
  { term: 'Rate Limiting', category: 'Web & APIs', definition: 'Setting a limit on how many requests a user or device can make in a given time.', why: 'It helps keep automated or unusually frequent requests under control.', risk: 'Brute-force logins, scraping, API abuse, or service overload may become easier.' },
  { term: 'CORS', category: 'Web & APIs', definition: 'A browser rule that controls which websites can read responses from another website.', why: 'It lets an API make deliberate choices about browser-based cross-site access.', risk: 'An overly broad policy may allow untrusted sites to read responses in some situations. CORS does not replace authentication.' },
  { term: 'Input Validation', category: 'Web & APIs', definition: 'Checking that incoming data has the expected type, format, size, and allowed values.', why: 'It rejects unexpected data before the application uses it.', risk: 'Malformed or hostile input may cause errors or contribute to other flaws.' },
  { term: 'Security Headers', category: 'Browser protections', definition: 'HTTP response settings that tell browsers how to apply extra protections to a site.', why: 'They can reduce the impact of certain browser-based attacks.', risk: 'Without the right protections, some attacks may be easier to carry out or harder to contain.' },
  { term: 'Content Security Policy (CSP)', category: 'Browser protections', definition: 'A browser rule that limits where a page can load scripts and other resources from.', why: 'It can help limit the damage from some injected content.', risk: 'Without a suitable policy, injected code may have more room to run. CSP does not fix the underlying bug.' },
  { term: 'HTTPS / TLS', category: 'Browser protections', definition: 'The encrypted connection used when a browser communicates securely with a website.', why: 'It helps prevent others on the network from reading or changing traffic in transit and helps verify the site.', risk: 'Unprotected traffic may be exposed or altered while it travels.' },
  { term: 'Row-Level Security (RLS)', category: 'Data & configuration', definition: 'Database rules that decide which individual rows a user or service can read or change.', why: 'It adds access checks close to the data itself.', risk: 'A missing or incorrect policy may let one user access another user’s records.' },
  { term: 'Hardcoded Secret', category: 'Data & configuration', definition: 'A password, API key, token, or other credential written directly into source code or a checked-in config file.', why: 'Code is often shared, copied, or stored in version history.', risk: 'Anyone who obtains the secret may use it until it is revoked or expires.' },
  { term: 'Encryption', category: 'Data & configuration', definition: 'Turning readable information into a protected form that can be read only with the right key.', why: 'It helps protect sensitive data while stored or, with a secure connection, while sent.', risk: 'If sensitive data is left unprotected, someone who gains access to the storage or traffic may read it.' },
  { term: 'Dependency Vulnerability', category: 'Code & analysis', definition: 'A known security weakness in a third-party package your application uses.', why: 'Applications inherit some of the risks in their libraries and tools.', risk: 'An attacker may exploit the weakness if your app uses the affected code in a reachable way.' },
  { term: 'SAST (Static Analysis)', category: 'Code & analysis', definition: 'Reviewing source code without running the application to look for risky patterns.', why: 'It can point developers to code that may need a closer look early in development.', risk: 'If risky code goes unnoticed, a weakness may reach a deployed application. A result still needs context.' },
  { term: 'DAST (Dynamic Analysis)', category: 'Code & analysis', definition: 'Testing a running application from the outside, often by sending requests and observing responses.', why: 'It can reveal issues in behavior that are visible when the app is running.', risk: 'A live weakness may remain undiscovered. DAST also cannot see every code path.' },
  { term: 'False Positive', category: 'Code & analysis', definition: 'A security alert that looks like a problem but is not a real vulnerability in the application’s actual context.', why: 'Automated tools can lack the context a developer has.', risk: 'Teams may waste time or lose trust in useful findings if alerts are not checked.' },
];

const categories = ['All terms', ...Array.from(new Set(terms.map((item) => item.category)))];

export default function GlossaryExplorer() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All terms');
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return terms.filter((item) => (category === 'All terms' || item.category === category)
      && (!normalized || `${item.term} ${item.category} ${item.definition} ${item.why} ${item.risk}`.toLowerCase().includes(normalized)));
  }, [query, category]);

  return (
    <section className="glossary-content" aria-label="Security terms">
      <div className="glossary-tools">
        <label className="glossary-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search security terms</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a term or topic…" /></label>
        <span className="glossary-count">{filtered.length} {filtered.length === 1 ? 'term' : 'terms'}</span>
      </div>
      <div className="glossary-filters" aria-label="Filter terms by topic">{categories.map((item) => <button type="button" key={item} onClick={() => setCategory(item)} className={category === item ? 'glossary-filter active' : 'glossary-filter'} aria-pressed={category === item}>{item}</button>)}</div>
      {filtered.length ? <div className="glossary-grid">{filtered.map((item, index) => <article className="glossary-card" key={item.term}>
        <div className="glossary-card-top"><span className="glossary-index">{String(index + 1).padStart(2, '0')}</span><span className="glossary-category">{item.category}</span></div>
        <h2>{item.term}</h2><p className="glossary-definition">{item.definition}</p>
        <div className="glossary-detail"><span>WHY IT MATTERS</span><p>{item.why}</p></div>
        <div className="glossary-detail glossary-risk"><span>IF IT IS MISSED</span><p>{item.risk}</p></div>
      </article>)}</div> : <div className="glossary-empty"><span>⌕</span><h2>No matching terms</h2><p>Try another search or choose a different topic.</p><button type="button" onClick={() => { setQuery(''); setCategory('All terms'); }}>Clear filters</button></div>}
      <p className="glossary-disclaimer">Security terms describe possible risks. Confirm each finding against your code, configuration, and how the application is used.</p>
    </section>
  );
}
