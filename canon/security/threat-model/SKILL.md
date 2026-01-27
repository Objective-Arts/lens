---
name: threat-model
description: Adversarial security analysis - failure modes, race conditions, trust boundaries
---

# /threat-model — Adversarial Security Analysis

Think like an attacker. Find what static analysis and pattern-matching miss.

## Core Assumptions (Adversarial Mindset)

When reviewing security-critical code, assume:

1. **Attacker controls environment** - env vars, config files can be tampered
2. **Network is hostile** - calls can fail, timeout, or be intercepted mid-sequence
3. **Multi-instance deployment** - in-memory state isn't shared across pods
4. **Tokens will be replayed** - if valid, they'll be reused until truly invalidated
5. **Race conditions exist** - if two operations aren't atomic, they'll be exploited

## Analysis Checklist

### 1. Failure Mode Analysis

For each multi-step operation, ask:

```
Step 1: Do A
Step 2: Do B
Step 3: Do C

What if step 2 fails AFTER step 1 succeeds?
- Is state now inconsistent?
- Can attacker exploit the partial state?
- Is there rollback/cleanup?
```

**Common vulnerabilities:**
- [ ] Password changed but token not invalidated (race)
- [ ] Payment captured but order not created (inconsistency)
- [ ] User deleted but sessions still valid (orphaned auth)
- [ ] File uploaded but metadata write fails (orphaned resource)

**Fix pattern:** Wrap in transaction, invalidate BEFORE sensitive change, or use saga pattern.

### 2. Trust Boundary Analysis

For each input, ask: **"Who controls this?"**

| Input Type | Threat | Mitigation |
|------------|--------|------------|
| Env vars | Runtime injection, misconfig | Allowlist expected values |
| User input | Injection, overflow | Validate, sanitize, parameterize |
| Database values | Stored XSS, poisoned data | Treat as untrusted on read |
| External API responses | SSRF, data poisoning | Validate schema, allowlist domains |
| File uploads | Path traversal, malware | Sanitize names, scan content |

**Checklist:**
- [ ] Env vars validated against allowlist (not just "is set")
- [ ] URLs validated against allowed domains before fetch
- [ ] Redirects validated (open redirect prevention)
- [ ] Deserialized data validated (no prototype pollution)

### 3. Deployment Topology Analysis

Ask: **"Does this work correctly when scaled?"**

| Pattern | Single Instance | Multi Instance |
|---------|-----------------|----------------|
| In-memory rate limit | Works | Bypassed (N instances = Nx limit) |
| In-memory session store | Works | Session loss on different pod |
| In-memory cache | Works | Inconsistent state across pods |
| File-based locks | Works | Race conditions across pods |

**Checklist:**
- [ ] Rate limiting uses shared store (Redis)
- [ ] Sessions stored externally (Redis, DB)
- [ ] Distributed locks for critical sections
- [ ] Cache invalidation works across instances

### 4. Token/Session Replay Analysis

Ask: **"If I capture this token, what can I do with it?"**

**Checklist:**
- [ ] Tokens invalidated immediately on use (one-time tokens)
- [ ] Tokens invalidated on password change
- [ ] Tokens invalidated on logout (all sessions)
- [ ] Token scope is minimal (not over-privileged)
- [ ] Token lifetime is appropriate (shorter = safer)
- [ ] Refresh tokens rotated on use

### 5. Transaction Atomicity Analysis

For state changes, ask: **"Is this atomic?"**

```javascript
// BAD: Non-atomic - attacker window between steps
await updatePassword(newHash);    // Step 1: password changed
await invalidateTokens(userId);   // Step 2: if fails, tokens still valid!

// GOOD: Atomic - all or nothing
await db.transaction(async (trx) => {
  await invalidateTokens(userId, trx);  // Invalidate FIRST
  await updatePassword(newHash, trx);
});
```

**Checklist:**
- [ ] Related state changes wrapped in transaction
- [ ] Invalidation happens BEFORE sensitive change
- [ ] Rollback on any step failure
- [ ] No TOCTOU (time-of-check-time-of-use) gaps

## Output Format

```markdown
## Threat Model Analysis

**Target:** [file/feature being analyzed]

### Failure Modes
| Sequence | Failure Point | Impact | Fix |
|----------|---------------|--------|-----|
| resetPassword | markTokenUsed fails after password change | Token replay | Transaction, invalidate first |

### Trust Boundaries
| Input | Controller | Risk | Mitigation |
|-------|-----------|------|------------|
| RESET_URL_BASE | Env var | Attacker redirect | Allowlist domains |

### Deployment Issues
| Pattern | Problem | Fix |
|---------|---------|-----|
| In-memory rate limit | Bypassed multi-instance | Redis store |

### Replay Risks
| Token Type | Risk | Mitigation |
|------------|------|------------|
| Password reset | Replay until expiry | One-time use, invalidate on use |

### Recommendations (Priority Order)
1. **CRITICAL:** [most severe finding]
2. **HIGH:** [next finding]
3. **MEDIUM:** [etc.]
```

## When to Invoke

- Auth/session management code
- Payment/financial transactions
- Password reset/recovery flows
- Token generation/validation
- Any multi-step state changes
- Code handling external input (env, API, user)
- Before deploying to multi-instance environment

## Integration with /review-hard

This analysis should run as Stage 2.5 in review-hard for security-critical code:

```
Stage 1: Self-review checklist
Stage 2: Gemini review (general)
Stage 2.5: Threat model (for auth/payment/sensitive code)
Stage 3: Qodana static analysis
Stage 4: Fix findings
```
