# Base Rubric

Always loaded. Covers universal production readiness concerns.

## Review Criteria

1. **Input Validation** — Validate on every boundary: API inputs, CLI arguments, file contents, query parameters. Reject bad input early with actionable errors.
2. **Injection Prevention** — No SQL injection, command injection, or path traversal. Parameterized queries, safe child_process usage, path normalization against a root.
3. **Secret Management** — No secrets in error messages, logs, or stack traces. No hardcoded credentials. Secrets via env vars, files, or interactive prompt.
4. **Auth Lifecycle** — Authentication must have a rotation strategy (expiry, revocation endpoint, or manual rotation docs). Flag basic auth with no lifecycle.
5. **Error Handling** — Preserve cause chains (`{ cause: e }`). Resource cleanup in finally blocks. No swallowed errors. No empty catch blocks.
6. **Bounded Operations** — Timeouts on network calls, limits on iterations, max sizes on reads. No unbounded loops or unlimited reads.
7. **Atomic Writes** — Write to temp file, then rename. No partial writes on crash. Cross-filesystem safety (temp in same directory as target).
8. **Config Externalization** — No hardcoded URLs, ports, paths, or connection strings. All config via env vars or config files with sensible defaults.
9. **Structured Logging** — No PII in logs. Error context preserved. Correlation IDs for request tracing where applicable.
10. **Actionable Error Messages** — User-facing errors say what went wrong and what to do. No stack traces for end users. Non-zero exit codes on failure.
11. **AI Code Smells** — No single-use wrappers, comment spam, unnecessary try/catch, over-abstraction, speculative features, or defensive checks for impossible cases.
12. **Architecture** — No god files, tight coupling, or missing abstractions. Single responsibility. Composable interfaces.
13. **Runtime Version** — Target LTS or stable releases for production. Preview/RC runtimes are not production-safe. Flag any preview SDK, framework, or runtime target.

## Planning Checklist

| Concern | What the plan must address |
|---------|---------------------------|
| Input Validation | Validation on every boundary: API inputs, CLI arguments, file contents, query parameters. |
| Injection Prevention | Parameterized queries, safe shell usage, path traversal prevention. |
| Secret Management | No secrets in errors/logs. Secrets via env vars, files, or prompt. |
| Auth Lifecycle | Mechanism (API key, JWT, session). Rotation strategy (expiry, revocation). |
| Error Handling | Cause chains, resource cleanup, no swallowed errors. |
| Bounded Operations | Timeouts, iteration limits, max read sizes. |
| Atomic Writes | Write-then-rename pattern. Temp file in same directory as target. |
| Config Externalization | All config via env vars or config files. Sensible defaults. |
| Structured Logging | No PII. Correlation IDs. Error context preserved. |
| Error UX | Actionable messages. Non-zero exit codes on failure. |
| AI Code Smells | No wrappers used once, comment spam, speculative features, over-abstraction. |
| Architecture | No god files. Single responsibility. Composable interfaces. |
| Runtime Version | LTS/stable runtime. No preview SDKs in production targets. |

**Template:**
```
- Input Validation: [approach]
- Injection Prevention: [approach]
- Secret Management: [approach or "N/A — no secrets handled"]
- Auth Lifecycle: [mechanism + rotation or "N/A — no auth"]
- Error Handling: [approach]
- Config Externalization: [approach]
- Structured Logging: [approach]
- Error UX: [approach]
- Runtime Version: [runtime + version or "LTS — {version}"]
```
