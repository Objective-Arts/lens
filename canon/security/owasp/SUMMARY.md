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

## Load Full Skill When

- Implementing auth/authorization
- Processing user input
- Handling sensitive data
- Security code review
- Designing new API endpoints

## HARD GATES (mandatory before writing code)

- [ ] **Injection check:** For every point where user input reaches a command, query, or template: is it parameterized/escaped? String concatenation with user input = injection vulnerability.
- [ ] **Auth check:** For every endpoint/command that modifies data: is the caller authenticated AND authorized? Authentication without authorization is half a lock.
- [ ] **Crypto check:** Are you using standard library crypto (not hand-rolled)? AES-256-GCM or ChaCha20-Poly1305 for encryption? bcrypt/scrypt/argon2 for passwords? PBKDF2 only if the others aren't available?
- [ ] **Error disclosure:** Do error responses reveal: stack traces, SQL errors, file paths, or internal implementation details? In production, errors should return a status code and generic message only.
- [ ] **HTTPS/TLS:** Every external communication uses TLS. No HTTP. No self-signed certs in production. No disabled certificate verification.

## Concrete Checks (MUST ANSWER)

1. **Search for string concatenation or template literals that include user input in SQL, shell commands, or HTML.** List each occurrence. Every one is an injection vulnerability (A03). Replace with parameterized queries, `execFile` (not `exec`), or proper HTML encoding.
2. **For every endpoint or command that accesses a resource: does it verify the caller owns that resource?** "Authenticated" is not "authorized." Can user A access user B's data by changing an ID in the URL/parameter? If yes, add ownership check (A01).
3. **Search for hardcoded strings that look like secrets.** Grep for: API keys, passwords, tokens, connection strings, private keys in source files. Each one is A05. Move to environment variables or a secret manager.
4. **Does any user-supplied input reach a file path operation?** Search for `path.join`, `fs.readFile`, `fs.writeFile`, or similar where any segment comes from user input. Can an attacker use `../` to escape the intended directory? If yes, canonicalize and validate against an allowlist (A01/A03).
5. **Do error responses sent to users contain stack traces, SQL errors, or internal paths?** Search for error handlers that pass raw error objects to responses. Each exposed internal detail helps an attacker (A04). Return generic messages + opaque error IDs only.
6. **Are all dependencies audited?** Run `npm audit` (or equivalent). Are there known vulnerabilities at HIGH or CRITICAL severity? Each unpatched dependency is A06.
