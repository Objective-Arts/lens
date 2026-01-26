# Claude-Optimal Workflow Guide

A dual-path system for **New Code** development and **Legacy Code** modernization.

---

## The Two Flows

Claude-Optimal supports two distinct workflows that share common planning and review phases but diverge at implementation:

```
                         ┌─────────────────────────────────────────────────────────────┐
                         │                                                             │
 NEW CODE ───► /plan ───►│ /structure ───► /build-from ─────┐                         │
 (PRD)           │       │   -first           -plan         │                         │
                 │       │     │                ▲           │                         │
                 │       │     │                │           │    REVIEW GATES         │
                 │       │     │          ┌─────┴───────────┤                         │
                 │       │     │          │  Fix & loop     │                         │
                 │       │     │          │  if issues      │  /hard    /gemini       │
                 │       │     │          │  found          ├─► review ─► review ───┐ │
                 │       │     │          │                 │      │         │      │ │
 LEGACY CODE ───►│       │     ▼          │                 │      │         │      │ │
 (Existing)      └──────►│ /structure ───►│ /refactor ──────┤      │         ▼      │ │
                         │   -first       │   -clean    ▲   │  /qodana ◄────────────┘ │
                         │                │             │   │   review                │
                         │                │             │   │      │                  │
                         │                │             └───┼──────┘                  │
                         │                │                 │                         │
                         │                │                 ▼                         │
                         │           ─ ─ ─ CANON ─ ─ ─    PASS ───► COMPLETE          │
                         │     (invoked throughout)                                   │
                         └─────────────────────────────────────────────────────────────┘
```

### Interactive Visualization

Open `docs/workflow-visualization.html` in a browser for an interactive D3 diagram.

---

## Flow 1: New Code Development

**Use when:** Building new features from a PRD, requirements, or feature request.

### Path

```
PRD/Requirements → /plan → /structure-first → /build-from-plan → [review gates]
```

### Steps

| Step | Skill | Creates Artifact | Canon Invoked |
|------|-------|------------------|---------------|
| 1. Plan | `/plan` | `.claude/plans/[name].md` | Domain-specific (bloch, pike, etc.) |
| 2. Structure | `/structure-first` | `.claude/structures/[name].md` | evans, linus, bloch, gang-of-four |
| 3. Implement | `/build-from-plan` | Source code | By file type + concern |
| 4. Review | `/hard-review` | - | Security, quality |
| 5. External | `/gemini-review` | - | AI second opinion |
| 6. Static | `/qodana-review` | - | Code quality |

### Example: New Authentication Feature

```bash
# 1. Start planning
> /plan

# Plan written to .claude/plans/auth-feature.md
# Invokes: /bloch (API design), /schneier (security)

# 2. Design structures
> /structure-first

# Structure written to .claude/structures/auth-types.md
# Invokes: /evans (entities vs value objects), /bloch (immutability)

# 3. Implement from plan
> /build-from-plan auth-feature

# Implements step by step
# Invokes: /bloch (Java), /schneier (security code)

# 4-6. Review gates
> /hard-review
> /gemini-review
> /qodana-review
```

---

## Flow 2: Legacy Code Modernization

**Use when:** Refactoring, cleaning up, or modernizing existing code.

### Path

```
Existing Code → /plan → /structure-first → /refactor-clean → [review gates]
```

### Steps

| Step | Skill | Creates Artifact | Canon Invoked |
|------|-------|------------------|---------------|
| 1. Plan | `/plan` | `.claude/plans/[name].md` | feathers, fowler |
| 2. Analyze Structure | `/structure-first` | `.claude/structures/[name].md` | evans (find hidden domain) |
| 3. Refactor | `/refactor-clean` | Refactored code | bloch, liskov, kernighan, gang-of-four |
| 4. Review | `/hard-review` | - | Security, quality |
| 5. External | `/gemini-review` | - | AI second opinion |
| 6. Static | `/qodana-review` | - | Code quality |

### Example: ClientController Refactoring

```bash
# 1. Plan the refactoring
> /plan ClientController.java

# Plan identifies: SRP violations, god class, HIPAA issues
# Invokes: /feathers (seams), /fowler (code smells)

# 2. Understand existing structure
> /structure-first

# Documents current entity relationships
# Invokes: /evans (find hidden aggregates)

# 3. Refactor
> /refactor-clean ClientController.java

# Applies: Bloch (composition), Liskov (SRP), Kernighan (clarity)
# Result: 1 god class → 6 focused controllers

# 4-6. Review gates
> /hard-review
> /gemini-review
> /qodana-review
```

---

## Shared Phases

### Planning Phase (Both Flows)

`/plan` works the same for both flows but invokes different canon:

| Flow | Canon Focus |
|------|-------------|
| New Code | Architecture (pike, bloch), Security (schneier) |
| Legacy | Seams (feathers), Smells (fowler), Risk (taleb) |

### Structure Phase (Both Flows)

`/structure-first` serves different purposes:

| Flow | Purpose |
|------|---------|
| New Code | Design new data structures before implementation |
| Legacy | Document existing structures, find hidden domain objects |

### Review Phase (Both Flows)

Same three gates for both:

1. **`/hard-review`** - Adversarial self-review (security, edge cases, quality)
2. **`/gemini-review`** - External AI review (second opinion)
3. **`/qodana-review`** - Static analysis (code quality metrics)

---

## Canon Skills by Phase

### Planning Phase

| Concern | Canon Skill | When |
|---------|-------------|------|
| Architecture | `/pike`, `/mcilroy` | Designing system boundaries |
| API Design | `/bloch` | Defining interfaces |
| Security | `/schneier`, `/owasp` | Security-sensitive features |
| Legacy | `/feathers` | Finding seams in existing code |
| Refactoring | `/fowler` | Identifying code smells |
| Risk | `/taleb`, `/petroski` | Major changes |

### Structure Phase

| Concern | Canon Skill | When |
|---------|-------------|------|
| Domain Modeling | `/evans` | Entities, value objects, aggregates |
| Data Structures | `/linus` | Data structures first |
| Type Design | `/bloch`, `/hejlsberg` | Immutability, interfaces |
| Patterns | `/gang-of-four` | Structural patterns |

### Implementation Phase

| File Type | Canon Skill |
|-----------|-------------|
| `.java` | `/bloch` |
| `.py` | `/hettinger`, `/ramalho` |
| `.ts`, `.js` | `/kyle-simpson`, `/boris-cherny` |
| `.go` | `/pike` |
| Tests | `/dodds`, `/meszaros` |

### Refactoring Phase

| Concern | Canon Skill |
|---------|-------------|
| Java patterns | `/bloch` |
| Single Responsibility | `/liskov` |
| Code clarity | `/kernighan` |
| Design patterns | `/gang-of-four` |
| Legacy techniques | `/feathers` |
| Refactoring catalog | `/fowler` |

---

## Decision: Which Flow?

```
Is there existing code?
│
├── NO → New Code Flow
│        /plan → /structure-first → /build-from-plan
│
└── YES → Is it working correctly?
          │
          ├── YES, but messy → Legacy Flow (refactor)
          │   /plan → /structure-first → /refactor-clean
          │
          └── NO, has bugs → Fix first, then decide
              (Bug fixes don't need full workflow)
```

---

## Ralph Loop Integration

Both flows can run inside a Ralph Loop for autonomous execution:

```bash
# New Code with Ralph Loop
ralph --prd features.md

# Legacy Modernization with Ralph Loop
ralph --prd refactoring-tasks.md
```

The Ralph Loop:
1. Reads PRD items
2. Selects appropriate flow (new vs refactor)
3. Executes full workflow including review gates
4. Commits and moves to next item

---

## Quick Reference

### New Code Commands

```bash
/plan                           # Create plan for new feature
/structure-first                # Design data structures
/build-from-plan                # Implement from plan
/build-from-plan [name]         # Implement specific plan
/build-from-plan --resume       # Resume partial implementation
```

### Legacy Code Commands

```bash
/plan [file]                    # Plan refactoring
/structure-first                # Document existing structure
/refactor-clean [file]          # Refactor target file
/refactor-clean                 # Refactor recently discussed code
```

### Review Commands (Both Flows)

```bash
/hard-review                    # Adversarial self-review
/gemini-review                  # External AI review
/qodana-review                  # Static analysis
```

---

## See Also

- [Case Study: ClientController Refactoring](case-studies/CLIENT-CONTROLLER-REFACTORING.md)
- [Interactive Flow Guide](flow-guide.html) - Comprehensive D3 visualization
- [Workflow Visualization](workflow-visualization.html) - Canon integration diagram
- [Baseline Brain](BASELINE-BRAIN.md) - The six foundational masters
