---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Two-Tier Review Architecture

---

## The Problem

Running external validators on every code change creates cost, latency, and nested loops. We needed an architecture that gets the benefits of external validation without these costs.

---

## The Solution: Two Tiers

### Tier 1: Self-Review (Every Phase)

During each pipeline phase, Claude reviews its own code against:

- Standards in CLAUDE.md (explicit rules)
- Canon principles (expert lenses)
- Previous findings in lesson files (learned patterns)

This is **fast** because it requires no external calls. Claude already has the standards loaded.

**What self-review catches**:
- Functions over 30 lines
- Mixed concerns
- Framework anti-patterns
- Inconsistent patterns
- Missing error handling
- Security basics (from security-mindset/owasp skills)

### Tier 2: External Validation (Phase 6 + Phase 8)

During the review and evaluation phases, external validators run:

- **Gemini**: AI-powered code review (code quality + security)
- **Codex**: Independent model review
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
│                    PIPELINE                                 │
│                                                            │
│  Phase 1: Plan   → Self-review (canon + lessons)           │
│  Phase 2: Structure → Self-review                          │
│  Phase 3: Implementation → Self-review + quality gate      │
│  Phase 4: Refactoring → Self-review                        │
│  Phase 5: Deduplication → Self-review                      │
│       ↓                                                    │
│  Phase 6: Review (4 external scans in parallel)            │
│       ↓                                                    │
│  Phase 7: Testing                                          │
│  Phase 8: Evaluation (Codex + Gemini scoring)              │
│       ↓                                                    │
│  Quality gate (lint + tests)                               │
└────────────────────────────────────────────────────────────┘
                       ↓
┌────────────────────────────────────────────────────────────┐
│              LEARNING LOOP (cross-run)                      │
│                                                            │
│   Findings from phases 6-8 ─────┐                          │
│                                  ├──→ Lesson files          │
│   Next pipeline run:             │                          │
│   Phases 1-5 read lessons ◀─────┘                          │
│                                                            │
│   Defect caught once → prevented forever                   │
└────────────────────────────────────────────────────────────┘
```

---

## The Learning Loop

External validation findings improve future self-review:

```
External Finding (phase 6 or 8)
       ↓
.claude/lessons.md (project-specific)
.claude/universal-lessons.md (cross-project)
       ↓
(Pattern appears 3+ times)
       ↓
Promote to CLAUDE.md standards
       ↓
Self-review catches it without external validation
```

**Example**: Qodana flags "async method without CancellationToken" three times. After the third occurrence, promote to CLAUDE.md: "Always pass CancellationToken through async chains." Now self-review catches this pattern without external validation.

---

## Phase 6: How External Review Works

Four scan agents run in parallel against identical code:

```
┌─────────────────────────────────────────────────┐
│              PHASE 6: REVIEW                     │
│                                                  │
│   Gemini scan ──────────┐                        │
│   Codex scan ───────────┤                        │
│   Qodana scan ──────────┼──→ Dedupe → Fix agent  │
│   AI smell scan ────────┘                        │
│                                                  │
└─────────────────────────────────────────────────┘
```

All four see the same code. Findings are deduped (same file + line within 5 lines + similar description = one finding). A single fix agent applies the unified list. This prevents cascade damage.

---

## Further Reading

- [How to Set Up External Validation](../how-to/external-validation.md) - Setup guide
- [How the Pipeline Works](how-the-pipeline-works.md) - Full pipeline explanation
- [Skill Enforcement Model](skill-enforcement-model.md) - How skills become gates
