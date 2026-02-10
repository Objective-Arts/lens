---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Two-Tier Review Architecture

---

## The Problem

Running external validators on every iteration creates cost, latency, and nested loops. We needed an architecture that gets the benefits of external validation without these costs.

---

## The Solution: Two Tiers

### Tier 1: Self-Review (In-Loop)

During each iteration, Claude reviews its own code against:

- Standards in CLAUDE.md (explicit rules)
- Canon principles (expert lenses)
- Previous findings in `.claude/ext-validation-findings.md` (learned patterns)

This is **fast** because it requires no external calls. Claude already has the standards loaded.

**What self-review catches**:
- Functions over 30 lines
- Mixed concerns
- Framework anti-patterns
- Inconsistent patterns
- Missing error handling
- Security basics (from security-mindset/owasp skills)

### Tier 2: External Validation (Post-Loop)

After the PRD is complete, external validators run **once**:

- **Gemini**: AI-powered code review
- **Qodana**: Static analysis

These catch what self-review misses:
- Subtle type issues
- Deep security vulnerabilities
- Performance patterns
- Cross-file consistency

---

## The Flow

```
┌────────────────────────────────────────────────────────────┐
│                    RALPH LOOP                               │
│                                                            │
│  Iteration 1 → Implement → Self-review → Commit            │
│       ↓                                                    │
│  Iteration 2 → Implement → Self-review → Commit            │
│       ↓                                                    │
│  Iteration N → Implement → Self-review → Commit            │
│       ↓                                                    │
│  PRD Complete?                                             │
│       ↓                                                    │
└────────────────────────────────────────────────────────────┘
                       ↓
┌────────────────────────────────────────────────────────────┐
│              POST-LOOP VALIDATION                           │
│                                                            │
│   Gemini Review ──────────┐                                │
│                           ├──→ Consolidated Report         │
│   Qodana Analysis ────────┘                                │
│                                                            │
│   Human Decision:                                          │
│   ├── Accept: Ship it                                      │
│   ├── Fix: Re-enter loop with focus                        │
│   └── Defer: Log findings for later                        │
└────────────────────────────────────────────────────────────┘
```

---

## The Learning Loop

External validation findings improve future self-review:

```
External Finding
       ↓
.claude/ext-validation-findings.md
       ↓
(Pattern appears 3+ times)
       ↓
Add to CLAUDE.md standards
       ↓
(Validated across projects)
       ↓
Promote to profile standards
```

**Example**: Qodana flags "async method without CancellationToken" three times. After the third occurrence, promote to CLAUDE.md: "Always pass CancellationToken through async chains." Now self-review catches this pattern without external validation.

---

## Configuration

In `ralph-integration.yaml`:

```yaml
ralph:
  quality_gates:
    review_mode: self           # self | external | both
    review_threshold: no_critical

post_loop_validation:
  enabled: true
  gemini: true
  qodana: true
  action: report                # report | fix | defer
  findings_file: .claude/ext-validation-findings.md
  promote_threshold: 3          # How many times before promoting
```

---

## Further Reading

- [How to Set Up External Validation](../how-to/external-validation.md) - Setup guide
- [How to Configure Ralph Loop](../how-to/configure-ralph-loop.md) - Configuration options
