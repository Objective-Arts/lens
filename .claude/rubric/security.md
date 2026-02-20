# Security Rubric

Always loaded. Extends base.md with deeper OWASP patterns, access control, cryptography, and sensitive data handling.

## Review Criteria

1. **Broken Access Control** — Every endpoint enforces authorization, not just authentication. No IDOR (direct object references without ownership check). Role checks on server side, never client only. Deny by default.
2. **CSRF Protection** — State-changing requests require anti-CSRF tokens or SameSite cookies. No GET requests that modify data. Verify origin/referer headers on APIs.
3. **SSRF Prevention** — No user-controlled URLs passed to server-side HTTP clients without allowlist validation. Block internal network ranges (127.0.0.1, 10.x, 169.254.x, metadata endpoints).
4. **Cryptographic Failures** — No weak algorithms (MD5, SHA1 for security, DES, RC4, ECB mode). Use bcrypt/scrypt/argon2 for passwords. No hardcoded keys, IVs, or salts. TLS for all external communication.
5. **Sensitive Data Exposure** — PII/PHI never in URLs, query parameters, or logs. Encrypt at rest and in transit. Minimize data collection and retention. Mask sensitive fields in error messages and API responses.
6. **Session Management** — Sessions invalidated on logout, password change, and privilege change. Secure/HttpOnly/SameSite flags on session cookies. Session timeout configured. No session IDs in URLs.
7. **Security Headers** — CSP, HSTS, X-Content-Type-Options, X-Frame-Options configured. CORS allowlist explicit (no wildcard with credentials). Referrer-Policy set.
8. **Rate Limiting** — Authentication endpoints rate-limited. Account lockout or progressive delay after failed attempts. API rate limits per user/IP.
9. **Audit Logging** — All authentication events logged (login, logout, failure, lockout). All access to sensitive data logged with user identity and timestamp. Logs tamper-resistant. No sensitive data in logs.
10. **Deserialization Safety** — No deserializing untrusted data without type validation. Allowlist expected types. Prefer data-only formats (JSON) over executable formats (Java serialization, pickle).

## Planning Checklist

| Concern | What the plan must address |
|---------|---------------------------|
| Access Control | Authorization on every endpoint. IDOR prevention. Deny by default. |
| CSRF | Anti-CSRF tokens or SameSite cookies on state changes. |
| Cryptography | Strong algorithms. No hardcoded secrets. TLS everywhere. |
| Sensitive Data | PII/PHI encrypted at rest and transit. Not in logs or URLs. |
| Sessions | Secure flags. Timeout. Invalidation on auth events. |
| Headers | CSP, HSTS, CORS allowlist, X-Frame-Options. |
| Rate Limiting | Auth endpoints protected. Progressive lockout. |
| Audit Trail | Auth events + sensitive data access logged with identity. |
