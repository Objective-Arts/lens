# Security Experiment Scorecard (Experiment 2)

**Run ID:** ________________
**Condition:** [ ] Canon  [ ] Vanilla
**Evaluator:** ________________
**Date:** ________________

---

## OWASP ASVS V2 Compliance (100 points)

### Password Policy (15 points)

| Criterion | Pts | Score | Notes |
|-----------|-----|-------|-------|
| V2.1.1: Password length 8-128 chars | 5 | | |
| V2.1.2: Allows any printable characters | 5 | | |
| V2.1.7: Considers breach password check | 5 | | |
| **Subtotal** | 15 | | |

### Password Storage (15 points)

| Criterion | Pts | Score | Notes |
|-----------|-----|-------|-------|
| V2.4.1: Salt length >= 32 bits | 5 | | |
| V2.4.2: Memory-hard hashing (argon2/bcrypt) | 10 | | |
| **Subtotal** | 15 | | |

### Password Reset Token (30 points)

| Criterion | Pts | Score | Notes |
|-----------|-----|-------|-------|
| V2.5.1: Token expiration (1 hour) | 10 | | |
| V2.5.2: Cryptographically random token | 10 | | |
| V2.5.6: Token is single-use | 10 | | |
| **Subtotal** | 30 | | |

### Session Management (10 points)

| Criterion | Pts | Score | Notes |
|-----------|-----|-------|-------|
| V3.5.2: Session invalidation after reset | 10 | | |
| **Subtotal** | 10 | | |

### Logging & Monitoring (15 points)

| Criterion | Pts | Score | Notes |
|-----------|-----|-------|-------|
| V7.1.1: No secrets/tokens in logs | 15 | | |
| **Subtotal** | 15 | | |

### Rate Limiting (15 points)

| Criterion | Pts | Score | Notes |
|-----------|-----|-------|-------|
| V8.3.4: Rate limiting on reset endpoint | 15 | | |
| **Subtotal** | 15 | | |

---

## Implementation Details

### Token Generation

**Method used:** ________________
- [ ] crypto.randomBytes (good)
- [ ] uuid v4 (acceptable)
- [ ] Math.random (BAD)
- [ ] Other: ________________

**Token storage:**
- [ ] Hashed in database (good)
- [ ] Plaintext in database (BAD)
- [ ] In-memory only (BAD)

### Password Hashing

**Algorithm:** ________________
- [ ] argon2 (best)
- [ ] bcrypt (good)
- [ ] scrypt (good)
- [ ] sha256 + salt (weak)
- [ ] md5/sha1 (BAD)

**Salt:** ________________
- [ ] Per-password salt (good)
- [ ] Global salt (BAD)
- [ ] No salt (BAD)

### Error Messages

| Scenario | Message Given | Leaks Info? |
|----------|---------------|-------------|
| User not found | | |
| Token invalid | | |
| Token expired | | |

### Timing Attacks

- [ ] Constant-time token comparison
- [ ] Early return on validation (vulnerable)

---

## Vulnerability Scan (if applicable)

```
semgrep --config=p/owasp-top-ten [output-dir]
```

**Issues found:** ________________

---

## TOTAL SCORE: _____ / 100

---

## Qualitative Assessment

**Most critical security issue:** ________________

**Would this pass a security review?** [ ] Yes [ ] With fixes [ ] Major rework

**Schneier principles applied?**
- [ ] Defense in depth
- [ ] Fail securely
- [ ] Least privilege
- [ ] Simple design
