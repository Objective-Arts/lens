# /security-mindset Summary

> "Security is a process, not a product."

## Security Mindset

| Principle | Meaning |
|-----------|---------|
| **Think like an attacker** | How would I break this? |
| **Assume breach** | What happens when (not if) security fails? |
| **Defense in depth** | Multiple layers, no single point of failure |
| **Trust minimization** | Give minimum required privileges |

## Threat Modeling Questions

1. What are we protecting? (Assets)
2. From whom? (Threat actors)
3. What can go wrong? (Attack vectors)
4. What's the impact? (Risk assessment)

## Fail Securely

```csharp
// BAD: Fails open
try {
    if (user.HasPermission(resource)) return Allow();
} catch { }
return Allow(); // WRONG

// GOOD: Fails closed
try {
    if (user.HasPermission(resource)) return Allow();
} catch (Exception ex) {
    Log.Error(ex);
}
return Deny(); // Default deny
```

## Trust Nothing from Outside

- All user input is malicious until validated
- All external APIs may be compromised
- All network traffic may be intercepted
- All client-side controls may be bypassed

## Security Review Questions

1. **Authentication**: How do we know who this is?
2. **Authorization**: Should they be allowed to do this?
3. **Input validation**: What happens with malformed input?
4. **Error handling**: Do errors leak information?
5. **Logging**: Would we detect an attack?
6. **Data protection**: Is sensitive data encrypted?

## Anti-Patterns (Always Reject)

- Security through obscurity
- Rolling your own crypto
- Trusting client-side validation
- Storing passwords reversibly
- Hardcoded secrets

## When to Use

- Designing authentication/authorization
- Handling sensitive data
- Processing user input
- Security-focused code reviews

## HARD GATES (mandatory before writing code)

- [ ] **Error message audit:** List every error message in your code. Does any leak: file paths, stack traces, internal service names, SQL queries, or configuration details? If yes, sanitize to a generic message + opaque error ID.
- [ ] **Log audit:** List every console.log/console.error/logger call. Does any log: passwords, API keys, tokens, PII, or raw error objects? If yes, remove or redact.
- [ ] **Input boundary check:** List every point where external data enters your code (CLI args, HTTP params, file contents, env vars). Is each one validated before use? Untrusted data must never reach business logic unvalidated.
- [ ] **Dependency audit:** List every npm/pip/cargo dependency. Check each for: last update >1 year ago? Known vulnerabilities? Excessive transitive dependencies? Each dependency is attack surface.
- [ ] **Secret storage:** Are any secrets (API keys, passwords, tokens) hardcoded, logged, or stored in plaintext? If yes, fix immediately.

## Concrete Checks (MUST ANSWER)

1. **List every input boundary.** For each entry point (CLI arg, HTTP param, file read, env var, IPC message): what validation runs before the data reaches business logic? If the answer is "none," add validation now.
2. **Do any error messages or log statements contain secrets?** Search for every `console.log`, `console.error`, `logger.*`, and `throw new Error`. Does any include: API keys, tokens, passwords, raw user data, file paths, or stack traces that reach the end user? If yes, redact.
3. **Walk each auth path -- is there a bypass?** For every protected operation, trace the code path from entry to authorization check. Is there any code path that skips the check (early return, catch block, fallthrough, default case)?
4. **Does every `catch` block fail closed?** For each try/catch around security-critical code (auth, validation, access control): does the catch block deny access, or does it fall through to allow? Fail-open catch blocks are the most common security bug.
5. **What happens when an external dependency is unavailable?** For each external call (API, database, auth service): if it times out or errors, does the system deny by default or silently allow?
