---
name: appsec
description: "AppSec integration, shift-left security, DevSecOps, security champions"
---

# Tanya Janca AppSec Philosophy

Integrating application security into the software development lifecycle through shift-left practices, security champions programs, and DevSecOps culture. Use when building security into CI/CD pipelines, establishing security champion networks, creating secure SDLC processes, implementing security testing automation, or fostering purple team collaboration. NOT for penetration testing execution, compliance auditing, or incident response.

---

## Core Philosophy

**Security is everyone's responsibility, not a gate at the end.**

Tanya Janca's approach transforms security from blocker to enabler through:
- **Shift-Left**: Find vulnerabilities when they're cheapest to fix
- **Security Champions**: Developers who bridge security and engineering
- **Purple Team Thinking**: Attackers and defenders collaborating, not competing
- **Automation First**: Security testing that runs on every commit
- **Culture Over Tools**: Tools fail without security-minded humans

---

## Progressive Security Integration

### Level 1: Foundation (Week 1-2)

**Establish baseline visibility:**

```yaml
# .github/workflows/security-baseline.yml
name: appsec
on: [push, pull_request]

jobs:
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: gitleaks/gitleaks-action@v2

  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: snyk/actions/node@master
        continue-on-error: true  # Don't block initially
```

**Key principle**: Start with visibility, not blocking.

### Level 2: Guardrails (Week 3-4)

**Add blocking for critical issues only:**

```yaml
dependency-check:
  steps:
    - uses: snyk/actions/node@master
      with:
        args: --severity-threshold=critical
```

### Level 3: Comprehensive (Month 2+)

**Full security pipeline:**
- Secrets scanning (gitleaks)
- SCA - dependency vulnerabilities (Snyk, OWASP DC)
- SAST - static analysis (CodeQL, Semgrep)
- Container scanning (Trivy)
- IaC scanning (Checkov)
- DAST - dynamic testing (ZAP) on staging

---

## Security Champions Program

### Champion Selection Criteria

**Required:**
- [ ] Genuine interest in security (volunteers, not voluntold)
- [ ] Respected by their team
- [ ] Strong communication skills
- [ ] At least 1 year with the team

### Champion Responsibilities

**Weekly (30 min):**
- Review security alerts for team repos
- Answer security questions from teammates
- Escalate unclear issues to AppSec team

**Monthly (2 hours):**
- Attend security champions meetup
- Share one security learning with team

**Per Sprint:**
- Security review of significant changes
- Ensure security tests exist for new features

---

## Quick Reference

### Security Testing Tools by Phase

| Phase | Tool Category | Examples |
|-------|--------------|----------|
| Pre-commit | Secrets detection | gitleaks, truffleHog |
| Build | SAST | Semgrep, CodeQL, SonarQube |
| Build | SCA | Snyk, Dependabot, OWASP DC |
| Build | Container | Trivy, Grype, Clair |
| Build | IaC | Checkov, tfsec, Terrascan |
| Deploy | DAST | ZAP, Burp, Nuclei |

### OWASP Top 10 Quick Mitigations

| Risk | Primary Mitigation |
|------|-------------------|
| A01 Broken Access Control | Deny by default, test authz |
| A02 Cryptographic Failures | Use standard libraries, TLS everywhere |
| A03 Injection | Parameterized queries, input validation |
| A04 Insecure Design | Threat modeling, secure patterns |
| A05 Security Misconfiguration | Hardening guides, IaC scanning |
| A06 Vulnerable Components | SCA scanning, update policy |
| A07 Auth Failures | MFA, secure session handling |
| A08 Integrity Failures | Code signing, CI/CD security |
| A09 Logging Failures | Centralized logging, alerting |
| A10 SSRF | Allowlist destinations |

---

## Resources

- **We Hack Purple**: wehackpurple.com
- **Alice and Bob Learn Application Security** (Tanya's book)
- **OWASP SAMM**: Software Assurance Maturity Model
