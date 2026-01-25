# Two-Tier Review Architecture

*Understanding the separation between fast self-review and thorough external validation.*

---

## The Problem

External validation tools like Gemini and Qodana provide valuable feedback. But if we run them during every iteration of an autonomous loop, we create problems:

1. **Cost**: Each external API call has a cost
2. **Latency**: Network calls slow iteration
3. **Nested loops**: If external review finds issues, we might re-enter the loop, which triggers another external review, creating recursion

We needed an architecture that gets the benefits of external validation without these costs.

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
- Security basics (from Schneier/OWASP canon)

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

## Why This Works

### Cost Efficiency

| Approach | External Calls | With 10 Iterations |
|----------|---------------|-------------------|
| Every iteration | 10 | 10+ API calls |
| Post-loop only | 1 | 1 API call |

### Speed

Self-review is instantaneous. External validation can take 30+ seconds. In a 10-iteration loop:

| Approach | Added Latency |
|----------|--------------|
| Every iteration | 300+ seconds |
| Post-loop only | 30 seconds |

### No Recursion

External validation can't create nested loops because it runs after the loop ends. The human decides what to do with findings.

---

## The Learning Loop

External validation findings aren't wasted—they improve future self-review:

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

### Example

**Day 1**: Qodana flags "async method without CancellationToken"

**Action**: Add to ext-validation-findings.md
```markdown
## Pattern: Async Without Cancellation
- **Source**: Qodana (2024-01-15)
- **Occurrences**: 1
- **Fix**: Always use CancellationToken with async methods
```

**Day 3**: Same pattern flagged again

**Action**: Update occurrences count
```markdown
- **Occurrences**: 2
```

**Day 5**: Third occurrence

**Action**: Promote to CLAUDE.md
```markdown
## C# Standards
- Always pass CancellationToken through async chains
```

Now self-review catches this pattern without external validation.

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

## Trade-offs

### What Self-Review Catches

- Explicit standard violations
- Pattern inconsistencies
- Known anti-patterns
- Size/complexity issues

### What External Validation Catches

- Novel issues not in standards
- Deep static analysis (type inference)
- Cross-project consistency
- Emerging patterns

### When to Run External More Often

Consider running external validation more frequently if:
- High-stakes code (security, payments)
- New team/domain (standards incomplete)
- Learning phase (building up findings)

---

## Further Reading

- [Ralph Loop Design](ralph-loop-design.md) - Full loop architecture
- [How to Set Up External Validation](../how-to/external-validation.md) - Setup guide
- [How to Configure Ralph Loop](../how-to/configure-ralph-loop.md) - Configuration options
