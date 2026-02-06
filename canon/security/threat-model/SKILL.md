---
name: threat-model
description: Threat modeling, security architecture, and thinking like an attacker. Use for reviewing auth flows, evaluating security controls, or when someone asks "is this secure?" Triggers on security review, threat model, attacker thinking, security architecture.
---

# Threat Modeling

Security mindset applied to code reviews, architecture decisions, and threat modeling. Use when reviewing authentication flows, evaluating security controls, designing defense strategies, or when someone asks "is this secure?" This skill is NOT for compliance checklists, penetration testing execution, or vulnerability scanning - it's for thinking about security.

---

## Core Philosophy

### The Security Mindset

Security is not a product but a process. Think like an attacker:

```
DEFENDER THINKING          ATTACKER THINKING
"How does this work?"  →   "How can this break?"
"Is this secure?"      →   "What's the cheapest attack?"
"We added encryption"  →   "What's NOT encrypted?"
"Users won't do that"  →   "Some user definitely will"
```

Anyone can design a security system that they themselves cannot break. The real test is whether someone smarter than you can break it.

### Security Economics

Attackers are rational economic actors:

```
ATTACK HAPPENS WHEN: Cost of Attack < Value of Target × Probability of Success

YOUR JOB: Make the left side bigger than the right side
```

**Don't ask**: "Can this be broken?"
**Ask**: "Is breaking this worth it compared to alternatives?"

---

## Threat Modeling Framework

### Step 1: Assets

What are you protecting? Be specific.

| Asset | Value | Sensitivity | Location |
|-------|-------|-------------|----------|
| User passwords | Critical | PII | Database |
| Session tokens | High | Auth | Memory/cookies |
| API keys | Critical | Secrets | Environment |

### Step 2: Adversaries

Who wants your assets? What are their capabilities?

| Adversary | Motivation | Resources | Skill | Persistence |
|-----------|------------|-----------|-------|-------------|
| Script kiddie | Fun/notoriety | Low | Low | Low |
| Competitor | Business intel | Medium | Medium | Medium |
| Nation-state | Strategic | Unlimited | High | Extreme |
| Insider | Revenge/money | High access | Varies | Medium |

Design for the adversary you have, not the one you wish you had.

### Step 3: Attack Trees

Decompose attacks into steps. Find the cheapest path.

```
GOAL: Steal user data
├── Attack the application
│   ├── SQL injection (Cost: Low, Skill: Low) ← LIKELY PATH
│   ├── XSS to steal sessions (Cost: Low, Skill: Medium)
│   └── Business logic flaw (Cost: Medium, Skill: High)
├── Attack the infrastructure
│   ├── Compromise server (Cost: Medium, Skill: Medium)
│   └── MITM attack (Cost: High, Skill: High)
├── Attack the people
│   ├── Phish an admin (Cost: Low, Skill: Low) ← LIKELY PATH
│   └── Social engineer support (Cost: Low, Skill: Medium)
└── Attack the process
    ├── Exploit password reset (Cost: Low, Skill: Low) ← LIKELY PATH
    └── Abuse API rate limits (Cost: Low, Skill: Low)
```

**Find the weakest link**: Attackers don't break crypto. They go around it.

---

## Defense Principles

### Defense in Depth

Multiple independent layers. Failure of one doesn't compromise all.

```
Layer 1: Network (firewall, WAF)
    ↓ attacker gets through
Layer 2: Application (input validation, auth)
    ↓ attacker gets through
Layer 3: Data (encryption at rest, access controls)
    ↓ attacker gets through
Layer 4: Detection (logging, alerting, anomaly detection)
    ↓ you notice and respond
Layer 5: Response (incident plan, containment, recovery)
```

### Fail Securely

```python
# WRONG: Fail open
def check_permission(user, resource):
    try:
        return permission_service.check(user, resource)
    except Exception:
        return True  # "Let them in, service is down"

# RIGHT: Fail closed
def check_permission(user, resource):
    try:
        return permission_service.check(user, resource)
    except Exception:
        log.error("Permission check failed, denying access")
        return False  # Deny by default
```

### Least Privilege

Grant minimum access for minimum time:

```yaml
# WRONG
role: admin
permissions: ["*"]
duration: permanent

# RIGHT
role: deployment-bot
permissions: ["deploy:staging", "read:configs"]
duration: 1 hour
conditions:
  - source_ip: ci_server
  - requires_approval: true
```

### Simplicity

Complexity is the enemy of security.

```
SECURE: Simple system you understand completely
INSECURE: Complex system with "security features" you don't understand

Every line of code is attack surface.
Every feature is potential vulnerability.
Every integration is trust boundary.
```

---

## Security Review Checklist

### Authentication
- [ ] Passwords: hashed with bcrypt/argon2, not MD5/SHA1
- [ ] Sessions: random tokens, httpOnly, secure, short-lived
- [ ] MFA: available for sensitive operations
- [ ] Rate limiting: on login, password reset, MFA
- [ ] Account enumeration: prevented (same response for valid/invalid)

### Authorization
- [ ] Every endpoint checks authorization (not just authentication)
- [ ] Server-side enforcement (never trust client)
- [ ] IDOR prevention: user can only access their resources
- [ ] Privilege escalation: horizontal and vertical prevented
- [ ] Default deny: explicit allow, not explicit deny

### Data Protection
- [ ] Encryption in transit: TLS 1.2+ everywhere
- [ ] Encryption at rest: sensitive data encrypted
- [ ] Key management: keys not in code, rotatable
- [ ] Secrets: not in logs, not in URLs, not in errors
- [ ] PII: minimized, access logged, retention limited

### Input Handling
- [ ] Validation: allowlist, not denylist
- [ ] Injection: parameterized queries, no string concatenation
- [ ] XSS: output encoding, CSP headers
- [ ] File upload: type validation, size limits, isolated storage
- [ ] Deserialization: avoid untrusted input, use safe formats

---

## Thinking Patterns

### Inversion

Instead of "How do I secure this?", ask:

```
"If I wanted to break this, how would I do it?"
"What would I need to steal/modify to cause maximum damage?"
"Where would I hide if I got in?"
"How would I avoid detection?"
```

### Attacker Economics

For every control, ask:

```
"How much does this cost the attacker?"
"What's the bypass?"
"Is there a cheaper target nearby?"
"Does this just redirect attack, not prevent it?"
```

### Trust Boundaries

Draw boxes around trust zones. Every arrow crossing a boundary needs validation.

### Key Security Questions

Before signing off on any security decision:

1. **What assets are we protecting?**
2. **What are the risks to those assets?**
3. **How well does the solution mitigate those risks?**
4. **What new risks does the solution introduce?**
5. **What does the solution cost?**
6. **Is there a cheaper way to get the same security?**

---

## Common Mistakes

### Security Theater

Controls that look good but don't work:
- CAPTCHA on login (bots solve these)
- Security questions (answers are guessable/public)
- Password complexity without length requirements
- IP blocking (VPNs exist)
- WAF as only defense (can be bypassed)

### Assuming Attackers Are Stupid

- "Nobody would guess that URL"
- "The parameter is obscure enough"
- "It's internal, so it's safe"
- "We use HTTPS so we're secure"
- "The mobile app hides this"

### Crypto Misuse

- Inventing your own crypto
- ECB mode for anything
- MD5/SHA1 for passwords
- Hardcoded keys
- Predictable IVs/nonces
- Encryption without authentication (use GCM/Poly1305)

---

## References

- STRIDE threat modeling
- OWASP Top 10
