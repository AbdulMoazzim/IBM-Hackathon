 # VibeGuard

  **Ship-vibecoded without getting hacked.**

  VibeGuard is a security-auditing platform for applications created with AI-assisted
  development tools such as Lovable, Replit, Bolt, Cursor, Claude Code, and similar
  workflows.

  Its core principle is:

  > Deterministic scanners find evidence; the LLM investigates, correlates, explains,
  and produces structured findings.

  The LLM is not the primary vulnerability scanner. SAST and DAST first produce bounded,
  reproducible evidence. The LLM then investigates that evidence using registered tools
  and returns a structured security finding.

  ## Current implementation

  Implemented:

  - Shared `SecurityEvidence` schema for SAST and DAST.
  - Four deterministic SAST rules.
  - Four safe, read-only DAST checks.
  - FastAPI `/health` and `/analyze` endpoints.
  - OpenRouter-compatible LLM analysis.
  - LLM tool calling and orchestration.
  - Six registered investigation tools.
  - Contextual-validation tests.
  - SAST + DAST authorization-correlation test.

  Not implemented:

  - GitHub ingestion
  - ZIP ingestion
  - Frontend
  - Database/storage
  - Authentication
  - Report UI
  - General-purpose vulnerability correlation engine

  ## Architecture

  ```text
  INPUT
  ├── Live URL
  │   └── DAST
  ├── GitHub repository
  │   └── project extraction -> SAST
  └── ZIP archive
      └── project extraction -> SAST

  SAST / DAST scanner
          ↓
  SecurityEvidence[]
          ↓
  LLM Security Analyst
          ↓
  Registered investigation tools
          ↓
  LLM re-evaluation
          ↓
  SAST + DAST correlation
          ↓
  Structured SecurityAnalysis finding
          ↓
  FastAPI response
  ```

  ### Processing stages

  1. Scanners generate deterministic evidence.
  2. The LLM reviews scanner evidence.
  3. The LLM requests additional context when necessary.
  4. Registered tools inspect authorized project files.
  5. Tool results are returned to the LLM.
  6. The LLM re-evaluates the original evidence.
  7. Related SAST and DAST evidence may be correlated.
  8. A validated structured finding is returned.

  Scanner evidence, contextual investigation, LLM reasoning, and verification status are
  separate concepts.

  ## Repository structure

  ```text
  README.md
  requirements.txt

  vibeguard/
  ├── app/
  │   ├── api/
  │   │   ├── __init__.py
  │   │   └── routes.py
  │   ├── llm/
  │   │   ├── __init__.py
  │   │   ├── analyst.py
  │   │   ├── prompts.py
  │   │   └── schemas.py
  │   ├── models/
  │   │   ├── __init__.py
  │   │   ├── evidence.py
  │   │   └── findings.py
  │   ├── orchestration/
  │   │   ├── __init__.py
  │   │   └── agent.py
  │   ├── tools/
  │   │   ├── __init__.py
  │   │   ├── investigation.py
  │   │   ├── read_file.py
  │   │   ├── redaction.py
  │   │   ├── registry.py
  │   │   └── search_code.py
  │   ├── __init__.py
  │   └── main.py
  ├── dast/
  │   ├── __init__.py
  │   └── scanner.py
  └── sast/
      ├── __init__.py
      └── scanner.py

  tests/
  ├── fixtures/openrouter_project/supabase/policies.sql
  ├── run_openrouter_integration.py
  ├── test_api_analyze.py
  ├── test_contextual_validation.py
  ├── test_dast_contextual_validation.py
  ├── test_dast_scanner.py
  ├── test_evidence_schema.py
  ├── test_investigation_tools.py
  ├── test_sast_dast_correlation.py
  ├── test_sast_scanner.py
  └── test_security_cases.py
  ```

  ## Input architecture

  ### URL

  ```text
  URL -> DAST scanner
  ```

  The current DAST scanner performs controlled read-only HTTP checks against only the
  explicitly supplied URL.

  ### GitHub

  ```text
  GitHub repository -> project extraction -> scan_project(...)
  ```

  GitHub ingestion is not currently implemented. A caller must provide an extracted
  local project directory.

  ### ZIP

  ```text
  ZIP archive -> safe extraction -> scan_project(...)
  ```

  ZIP ingestion is also not currently implemented.

  ## SecurityEvidence schema

  The shared schema is defined in:

  ```text
  vibeguard/app/models/evidence.py
  ```

  Example:

  ```json
  {
    "id": "EVD-001",
    "category": "authorization",
    "source": "sast",
    "severity": "high",
    "confidence": 0.72,
    "target": {
      "type": "file",
      "value": "app/api/orders/[id]/route.ts"
    },
    "evidence": {
      "type": "code",
      "content": "...",
      "line": 42
    },
    "metadata": {
      "rule_id": "SAST-AUTH-001"
    }
  }
  ```

  Fields:

  - `id`: Evidence identifier.
  - `category`: Controlled security category.
  - `source`: `sast`, `dast`, or `combined`.
  - `severity`: `low`, `medium`, `high`, or `critical`.
  - `confidence`: Scanner confidence between `0.0` and `1.0`.
  - `target`: Target object with type `file`, `endpoint`, or `project`.
  - `evidence`: Scanner-specific evidence object.
  - `metadata`: Additional scanner metadata such as `rule_id` or `test_id`.

  Supported categories:

  - `authentication`
  - `authorization`
  - `injection`
  - `secrets`
  - `cors`
  - `rate_limiting`
  - `rls`
  - `security_headers`
  - `configuration`
  - `dependency`

  Scanner confidence describes the reliability of the scanner observation. It is not the
  final vulnerability confidence assigned by the LLM.

  ## SAST

  Entry point:

  ```python
  from vibeguard.sast.scanner import scan_project

  findings = scan_project("project-root")
  ```

  The scanner recursively reads supported UTF-8 text files without executing project
  code.

  ### SAST-SECRET-001

  Detects obvious hardcoded API keys, secrets, access tokens, authentication tokens, and
  password assignments.

  - Category: `secrets`
  - Severity: `high`
  - Secret values are redacted.
  - Placeholders containing `example`, `your-key`, `changeme`, or `placeholder` are
  ignored.
  - This is a heuristic and does not determine whether a secret is active.

  ### SAST-INJECT-001

  Detects obvious SQL-like query construction using concatenation or interpolation.

  Examples:

  ```text
  "SELECT ... " + user_input
  f"SELECT ... {user_input}"
  ```

  - Category: `injection`
  - Severity: `high`
  - Includes file and line evidence.
  - Does not execute queries or attempt exploitation.
  - Client-side JSX or display strings may produce false positives.

  ### SAST-RLS-001

  Detects Supabase/Postgres policies containing unrestricted:

  ```sql
  USING (true)
  ```

  - Category: `rls`
  - Severity: `high`
  - Returns SQL evidence and line number.
  - Does not inspect a live database.

  ### SAST-CORS-001

  Detects clearly permissive wildcard CORS configuration such as:

  ```text
  Access-Control-Allow-Origin: *
  ```

  - Category: `cors`
  - Severity: `medium`
  - This is evidence of permissive configuration, not proof of exploitability.

  ### SAST safety behavior

  The scanner:

  - Redacts detected secrets.
  - Skips binary, oversized, unreadable, and non-UTF-8 files.
  - Ignores `.git`, `node_modules`, `.venv`, `venv`, `env`, `.env`, `build`, `dist`, and
  `__pycache__`.
  - Rejects paths and symlinks escaping the project root.
  - Does not execute project code.
  - Does not perform dynamic exploitation.
  - Deduplicates findings.

  ## DAST

  Entry point:

  ```python
  from vibeguard.dast.scanner import scan_url

  findings = scan_url("https://example.com")
  ```

  The scanner:

  - Accepts only absolute `http://` and `https://` URLs.
  - Performs DNS resolution.
  - Rejects localhost, loopback, private, reserved, multicast, unspecified, and link-
  local targets.
  - Uses GET requests only.
  - Does not crawl.
  - Does not follow unsafe redirects.
  - Uses bounded connection and read timeouts.
  - Limits response bodies to 1 MB.
  - Sends at most three identical requests for rate-limit testing.
  - Does not brute force, bypass authentication, or make destructive requests.
  - Does not issue POST, PUT, PATCH, or DELETE requests.
  - Handles timeout, DNS, TLS, connection, and HTTP errors safely.

  ### DAST-HEADERS-001

  Reports missing:

  - `Content-Security-Policy`
  - `X-Content-Type-Options`
  - `Strict-Transport-Security` for HTTPS
  - `Referrer-Policy`

  Category: `security_headers`
  Severity: `medium`

  One finding is produced per missing header.

  ### DAST-CORS-001

  Sends:

  ```text
  Origin: https://vibeguard-test.invalid
  ```

  Reports:

  - `Access-Control-Allow-Origin: *`
  - Reflection of the supplied arbitrary origin

  Category: `cors`
  Severity: `medium`

  Wildcard CORS is evidence of permissive behavior, not automatic proof of an
  exploitable vulnerability.

  ### DAST-AUTH-001

  Inspects only the supplied URL. A potential finding is generated when:

  - The response status is HTTP 200.
  - The response appears to contain multiple sensitive indicators such as `password`,
  `email`, `token`, `api_key`, `ssn`, `credit_card`, `orders`, or `users`.

  Category: `authentication`
  Severity: `high`

  HTTP 200 alone does not create a finding. No private endpoint discovery or
  authentication bypass is performed.

  ### DAST-RATE-001

  Sends at most three identical harmless GET requests and checks for:

  - HTTP 429
  - `Retry-After`
  - `X-RateLimit-*`

  Category: `rate_limiting`
  Severity: `medium`

  If no rate-limit signal is observed, the result is reported only as potential missing
  rate limiting. This is not proof that rate limiting is absent.

  ## Investigation tools

  The LLM can use only tools registered in:

  ```text
  vibeguard/app/tools/registry.py
  ```

  ### read_file(path)

  Reads bounded text from the authorized project root.

  It returns:

  - Relative file path
  - Numbered content
  - Redacted content where applicable

  It rejects:

  - Absolute paths
  - Path traversal
  - Directories
  - Missing files
  - Binary files
  - Oversized files
  - Files outside the project root

  ### search_code(query)

  Searches bounded text files in the authorized project root.

  It returns:

  - Relative file path
  - Line number
  - Matching content
  - Limited surrounding context

  ### list_files(path=".")

  Recursively lists relative file paths.

  It:

  - Returns sorted results.
  - Uses a maximum result count.
  - Does not read file contents.
  - Ignores common noisy directories.

  ### find_files(pattern, path=".")

  Finds files by filename/path pattern.

  It:

  - Returns sorted relative paths.
  - Prevents traversal.
  - Does not read file contents.
  - Uses a maximum result count.

  ### get_package_dependencies(path=".")

  Parses only:

  - `package.json`
  - `requirements.txt`
  - `pyproject.toml`

  It returns package names and declared versions/specifiers. It does not install
  dependencies, run package managers, or contact the internet.

  ### get_security_config(path=".")

  Inspects supported security configuration files such as:

  - `next.config.js`
  - `next.config.mjs`
  - `next.config.ts`
  - `vite.config.js`
  - `vite.config.ts`
  - `middleware.ts`
  - `middleware.js`
  - `vercel.json`
  - `supabase/config.toml`
  - `.env.example`
  - `.env.sample`

  It:

  - Treats JavaScript and TypeScript as text.
  - Never executes configuration.
  - Never reads actual `.env` files.
  - Redacts secrets, tokens, passwords, and connection strings.
  - Applies output-size limits.
  - Reports redaction counts.

  The LLM cannot execute arbitrary shell commands, Python, HTTP requests, or filesystem
  operations. It can only call registered tools.

  ```text
  LLM
    ↓
  ToolRegistry
    ↓
  Validated tool execution
    ↓
  Tool result
    ↓
  LLM re-evaluation
    ↓
  Structured finding
  ```

  ## Contextual validation

  Scanner evidence is a lead, not a conclusion.

  ### SAST

  A SQL-like pattern inside JSX may initially produce a potential or likely finding. The
  LLM can inspect the affected file using `read_file` or search the project with
  `search_code`.

  If the code is only client-side UI logic and there is no SQL construction or
  execution, the final result can be:

  ```text
  status = false_positive
  verification_status = unverified
  ```

  ### DAST

  For:

  ```text
  Access-Control-Allow-Origin: *
  ```

  the LLM should recognize permissive CORS but preserve uncertainty when exploitability
  is not demonstrated.

  The current DAST contextual-validation test uses the existing investigation
  architecture and mocked LLM behavior. The available tools cannot inspect live HTTP
  behavior, so the test preserves `potential` or `likely` status and does not mark the
  issue verified.

  ## SAST + DAST correlation

  VibeGuard can correlate SAST and DAST evidence describing the same issue.

  Example:

  SAST:

  ```text
  GET /api/orders/[id]
  const order = await db.orders.findById(id)
  ```

  This suggests that an order is retrieved without an ownership check.

  DAST:

  ```text
  User A successfully received User B's order.
  ```

  The evidence is combined into one broken-authorization finding.

  Expected result:

  - Exactly one final finding.
  - Authorization/BOLA type.
  - High severity.
  - Status: `verified`.
  - Verification status: `verified`.
  - Both evidence IDs preserved.
  - Affected endpoint preserved.
  - Explanation connects the missing ownership check with the unauthorized response.
  - Recommended fix enforces server-side ownership authorization.

  Verification is allowed because the mocked DAST evidence explicitly demonstrates
  unauthorized cross-user access. SAST alone cannot produce a verified result.

  The current implementation demonstrates this behavior through a deterministic test. It
  is not a general-purpose correlation engine.

  ## Verification model

  Final status values:

  - `potential`: Initial or weak signal requiring more context.
  - `likely`: Evidence supports the issue, but verification is incomplete.
  - `verified`: Actual verification evidence supports the claim.
  - `false_positive`: Investigation shows that the scanner signal does not represent the
  claimed issue.

  Verification values:

  - `not_tested`
  - `unverified`
  - `verified`

  Rules:

  1. Suspicious code is not automatically a vulnerability.
  2. Scanner severity is not proof.
  3. Scanner confidence is not final vulnerability confidence.
  4. `verified` requires actual verification evidence.
  5. SAST plus runtime DAST evidence can support verification.
  6. Contextual investigation can downgrade findings.

  ## Structured finding

  The final model is:

  ```text
  vibeguard/app/llm/schemas.py
  ```

  Example:

  ```json
  {
    "id": "VG-001",
    "title": "Potential broken object-level authorization",
    "type": "broken_authorization",
    "severity": "high",
    "confidence": 0.91,
    "status": "likely",
    "explanation": "The code retrieves an object by ID, but the available evidence does
    not yet demonstrate an ownership check or unauthorized response.",
    "impact": "An attacker may access another user's object if authorization is
    missing.",
    "evidence": [
      "SAST evidence at api/orders/[id]/route.ts:42",
      "Additional verification is required."
    ],
    "affected_components": [
      "api/orders/[id]/route.ts"
    ],
    "recommended_fix": "Enforce server-side ownership or authorization before returning
    the object.",
    "verification_status": "unverified"
  }
  ```

  ## API

  The FastAPI application is defined in:

  ```text
  vibeguard/app/main.py
  ```

  ### GET /health

  Response:

  ```json
  {
    "status": "ok"
  }
  ```

  ### POST /analyze

  The endpoint validates `AnalysisRequest`, calls the existing orchestration layer, and
  returns `AnalysisResponse`.

  Request:

  ```json
  {
    "findings": [
      {
        "id": "VG-TEST-001",
        "type": "rls_issue",
        "severity": "high",
        "file": "supabase/policies.sql",
        "line": 12,
        "evidence": "USING (true)",
        "source": "sast"
      }
    ],
    "project_context": {
      "project_name": "test-project",
      "root_path": "test-project"
    }
  }
  ```

  Response:

  ```json
  {
    "summary": "Analyzed 1 scanner finding(s).",
    "risk_level": "high",
    "findings": [
      {
        "id": "VG-TEST-001",
        "title": "Excessive permissions in policy",
        "type": "rls_issue",
        "severity": "high",
        "confidence": 0.9,
        "status": "likely",
        "explanation": "...",
        "impact": "...",
        "evidence": [
          "Scanner evidence: USING (true)"
        ],
        "affected_components": [
          "supabase/policies.sql"
        ],
        "recommended_fix": "Restrict the policy to authorized rows.",
        "verification_status": "unverified"
      }
    ]
  }
  ```

  Malformed requests are rejected through FastAPI/Pydantic validation. LLM/provider
  failures return a generic HTTP 502 response without exposing provider errors or
  secrets.

  ## OpenRouter configuration

  The provider adapter is implemented in:

  ```text
  vibeguard/app/llm/analyst.py
  ```

  Supported environment variables:

  ```text
  VIBEGUARD_LLM_API_KEY
  VIBEGUARD_LLM_MODEL
  VIBEGUARD_LLM_BASE_URL
  VIBEGUARD_PROJECT_ROOT
  VIBEGUARD_MAX_FILE_BYTES
  VIBEGUARD_MAX_TOOL_ITERATIONS
  ```

  Defaults:

  - Model: `gpt-4o-mini`
  - Project root: current directory
  - Maximum file size: 200000 bytes
  - Maximum tool iterations: 8

  The API key is server-side only and must never be committed or exposed to a frontend.

  The real provider integration is run separately through:

  ```text
  tests/run_openrouter_integration.py
  ```

  Normal unit tests use mocked providers and do not consume OpenRouter credits.

  ## Testing

  Test groups:

  - `tests/test_security_cases.py`: original five security cases.
  - `tests/test_evidence_schema.py`: evidence validation.
  - `tests/test_sast_scanner.py`: SAST rules, redaction, ignored directories, binaries,
  and path safety.
  - `tests/test_dast_scanner.py`: mocked DAST behavior and safety restrictions.
  - `tests/test_investigation_tools.py`: investigation tools and registry.
  - `tests/test_contextual_validation.py`: SAST contextual investigation.
  - `tests/test_dast_contextual_validation.py`: DAST CORS uncertainty.
  - `tests/test_sast_dast_correlation.py`: one-finding SAST/DAST correlation.
  - `tests/test_api_analyze.py`: API validation and provider failure handling.

  Latest known test result:

  ```text
  44 passed, 1 skipped, 1 warning
  ```

  The warning is from the FastAPI/Starlette test client and installed `httpx`
  compatibility path.

  Run:

  ```powershell
  .venv\Scripts\python.exe -m pytest -q
  ```

  OpenRouter integration is tested separately. Contextual-validation and correlation
  tests are mocked and deterministic.

  ## Real-world validation

  ### TutorFinder DAST

  Target:

  ```text
  https://find-your-tutor.vercel.app/
  ```

  The scanner:

  - Successfully validated and resolved the target.
  - Used read-only GET requests.
  - Made five requests.
  - Received HTTP 200 for all five.
  - Produced no scanner errors.

  Findings included:

  - Missing Content-Security-Policy.
  - Missing X-Content-Type-Options.
  - Missing Referrer-Policy.
  - Wildcard CORS.
  - Sensitive-data authentication heuristic.
  - Potential missing-rate-limiting signal.

  These were heuristic observations and not all verified vulnerabilities.

  ### TutorFinder SAST

  Repository:

  ```text
  https://github.com/nadseecot-hub/Front-end-capstone
  ```

  The scanner:

  - Scanned 94 UTF-8 text files.
  - Initially produced one `SAST-INJECT-001` finding.
  - Reported the location as:
    `src/features/FindTutors/FindTutorsView.tsx:31`.
  - Later investigated the finding contextually.
  - Downgraded it to `false_positive`.

  The finding was not confirmed as SQL injection.

  ## Safety model

  VibeGuard is intended for authorized security testing.

  Current protections include:

  - DAST is restricted to explicitly supplied targets.
  - No crawling of unrelated domains.
  - No brute force.
  - No credential attacks.
  - No authentication bypass.
  - No destructive requests.
  - No arbitrary shell execution.
  - No arbitrary Python execution.
  - Project code is not executed during SAST.
  - Tool paths are validated.
  - Binary and oversized files are bounded.
  - Secrets are redacted where supported.
  - Actual `.env` files are not read by `get_security_config`.
  - Provider errors are returned without sensitive exception details.

  Future hardening may include stronger isolation, audit logging, and additional quotas.
  These are not currently implemented.

  ## Current limitations

  - SAST rules are narrow heuristics.
  - No full dataflow or taint analysis.
  - DAST only tests the explicitly supplied URL.
  - No endpoint crawling.
  - No authenticated DAST workflow.
  - Investigation tools cannot inspect live HTTP behavior.
  - Dependency parsing supports only three manifest formats.
  - No dependency CVE intelligence.
  - Security configuration inspection supports a limited filename list.
  - Correlation is demonstrated through deterministic tests, not a general engine.
  - GitHub and ZIP ingestion are absent.
  - No frontend, database, authentication, or report UI exists.

  ## Not implemented

  The following are future work:

  - Generalized vulnerability correlation.
  - Broader SAST rule coverage.
  - Authenticated DAST.
  - Endpoint crawling.
  - Dependency vulnerability intelligence.
  - Deeper static dataflow analysis.
  - GitHub ingestion.
  - ZIP ingestion.
  - Frontend/reporting.
  - Database-backed storage.
  - Authentication and multi-user access control.
  - Future database, route, auth, DAST-result, and verification tools.

  ## Development

  Create a virtual environment:

  ```powershell
  python -m venv .venv
  .venv\Scripts\Activate.ps1
  ```

  Install dependencies:

  ```powershell
  python -m pip install -r requirements.txt
  ```

  Configure server-side environment variables:

  ```text
  VIBEGUARD_LLM_API_KEY=<provider-key>
  VIBEGUARD_LLM_MODEL=<model>
  VIBEGUARD_LLM_BASE_URL=<compatible-base-url>
  VIBEGUARD_PROJECT_ROOT=<authorized-project-root>
  ```

  Run tests:

  ```powershell
  .venv\Scripts\python.exe -m pytest -q
  ```

  Start FastAPI:

  ```powershell
  .venv\Scripts\python.exe -m uvicorn vibeguard.app.main:app --reload
  ```

  Health check:

  ```powershell
  curl http://127.0.0.1:8000/health
  ```

  Analysis request:

  ```powershell
  curl -X POST http://127.0.0.1:8000/analyze -H "Content-Type: application/json" -d
  '{"findings":[{"id":"VG-001","type":"rls_issue","severity":"high","file":"supabase/pol
  icies.sql","line":12,"evidence":"USING
  (true)","source":"sast"}],"project_context":{"project_name":"test-project","root_path"
  :"test-project"}}'
  ```

  Real provider integration:

  ```powershell
  .venv\Scripts\python.exe tests/run_openrouter_integration.py
  ```

  ## Design principles

  1. Deterministic scanners generate evidence.
  2. The LLM investigates evidence rather than blindly trusting scanners.
  3. Tools constrain what the LLM can inspect and do.
  4. SAST and DAST use one evidence contract.
  5. Multiple evidence sources can be correlated.
  6. Scanner confidence is not proof.
  7. Verification requires verification evidence.
  8. Uncertainty should be preserved instead of hidden.
  9. Security testing must remain controlled and authorized.