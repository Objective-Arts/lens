# Web API Rubric

Load when target contains HTTP server, REST API, or web application code.

## Review Criteria

1. **Security Headers** — HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Content-Security-Policy. Missing headers = CRITICAL for production web apps.
2. **CORS Policy** — Explicit allowed origins. No wildcard `*` in production with credentials. Preflight handling for non-simple requests.
3. **CSRF Protection** — Anti-forgery tokens for state-changing operations. SameSite cookies. Double-submit cookie or synchronizer token pattern.
4. **Rate Limiting** — Request rate limits on auth endpoints and expensive operations. Must use shared storage (Redis, DB) if multi-instance. In-memory rate limits break with >1 instance.
5. **Multi-Instance Readiness** — In-memory sessions, caches, or rate limits that break with >1 instance must use shared storage or be documented as single-instance only. No silent data loss on scale-out.
6. **Proxy Trust** — If behind a reverse proxy, configure trusted proxy settings. X-Forwarded-For trust policy must be explicit. IP-based features (rate limiting, geo) must handle proxied requests.
7. **Graceful Shutdown** — Handle SIGTERM. Drain in-flight requests. Close DB connections. Return 503 during shutdown.
8. **Authentication & Authorization** — Every endpoint must be authenticated or explicitly marked public with justification. No "we'll add auth later." Framework auth middleware (JWT, cookie, API key) must be wired before route registration.
9. **HTTPS** — Enforce HTTPS in production. Redirect HTTP → HTTPS. HSTS header with sufficient max-age. No mixed content.
10. **Health Checks** — Liveness endpoint (`/healthz`) confirms the process is running. Readiness endpoint (`/readyz`) confirms dependencies (DB, cache, external APIs) are reachable. Both must return quickly (<100ms). Required for any web API, not just containerized services.
11. **Pagination** — List endpoints must be bounded. Default page size, max page size, total count in response. No unbounded `SELECT *` or `.ToList()` on entire tables. Cursor or offset pagination — pick one and be consistent.

## Planning Checklist

| Concern | What the plan must address |
|---------|---------------------------|
| Security Headers | Which headers, how set (middleware, framework config). |
| CORS Policy | Allowed origins, credentials policy. |
| CSRF Protection | Mechanism (token, SameSite, double-submit) or "N/A — API-only with token auth". |
| Rate Limiting | Where applied, storage backend, limits. |
| Multi-Instance | Shared state strategy or "single-instance only — {reason}". |
| Proxy Trust | Trusted proxy config or "N/A — direct access only". |
| Graceful Shutdown | Signal handling, request draining, connection cleanup. |
| Authentication | Auth mechanism (JWT, cookie, API key). Which endpoints are public and why. |
| HTTPS | HTTPS enforcement, HTTP redirect, HSTS config. |
| Health Checks | Liveness + readiness endpoints. Dependency checks in readiness. |
| Pagination | Page size defaults/limits, pagination style (cursor/offset), response shape. |

**Template:**
```
- Security Headers: [approach]
- CORS: [approach or "N/A — not cross-origin"]
- CSRF: [approach or "N/A — API-only with token auth"]
- Rate Limiting: [approach]
- Multi-Instance: [shared state strategy or "single-instance only — {reason}"]
- Proxy Trust: [approach or "N/A — direct access only"]
- Graceful Shutdown: [approach]
- Authentication: [mechanism or "public API — {justification}"]
- HTTPS: [enforcement approach]
- Health Checks: [endpoints, dependency checks]
- Pagination: [style, default/max page size]
```
