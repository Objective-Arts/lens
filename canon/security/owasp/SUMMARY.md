# /owasp Summary

> OWASP Top 10 - Industry standard for web application security.

## Top 10 Quick Reference

| # | Vulnerability | Fix |
|---|---------------|-----|
| A01 | **Broken Access Control** | Verify ownership on every resource access |
| A02 | **Cryptographic Failures** | TLS 1.2+, bcrypt/Argon2 for passwords, AES-256 at rest |
| A03 | **Injection** | Parameterized queries, never string concat |
| A04 | **Insecure Design** | Threat model before coding |
| A05 | **Security Misconfiguration** | Remove defaults, disable unused features |
| A06 | **Vulnerable Components** | `npm audit`, update dependencies |
| A07 | **Auth Failures** | MFA, rate limiting, secure sessions |
| A08 | **Integrity Failures** | Verify signatures, secure CI/CD |
| A09 | **Logging Failures** | Log security events, monitor anomalies |
| A10 | **SSRF** | Allowlist domains for outbound requests |

## Code Patterns

```javascript
// BAD: SQL Injection
const query = `SELECT * FROM users WHERE id = ${userId}`;

// GOOD: Parameterized
const query = 'SELECT * FROM users WHERE id = @id';
await db.query(query, { id: userId });
```

```javascript
// BAD: No authorization
app.get('/api/users/:id', (req, res) => db.users.find(req.params.id));

// GOOD: Verify ownership
app.get('/api/users/:id', (req, res) => {
  const user = db.users.find(req.params.id);
  if (user.id !== req.user.id && !req.user.isAdmin) throw 403;
  return user;
});
```

## Checklist

**Input:** All validated server-side, parameterized queries, output encoded

**Auth:** Strong passwords, bcrypt/Argon2, MFA, account lockout, secure sessions

**Authorization:** Default deny, RBAC, verify ownership, audit trail

**Data:** TLS everywhere, encrypt at rest, no secrets in code, minimize PII

**Errors:** Generic to users, detailed in logs only, no stack traces exposed

## Load Full Skill When

- Implementing auth/authorization
- Processing user input
- Handling sensitive data
- Security code review
- Designing new API endpoints
