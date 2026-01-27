---
name: specialist-swarm
description: "Analyzing code from multiple expert perspectives (security, performance, architecture) then synthesizing findings. Use for comprehensive code reviews or architectural trade-off analysis."
---

# SPECIALIST-SWARM Pattern

**Intent**: Multiple experts analyze in parallel, then synthesize.

## The Pattern

```
             TRIGGER
             /review
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
SUBAGENT    SUBAGENT    SUBAGENT
Security    Perform     Architect
    │           │           │
    └───────────┼───────────┘
                │
                ▼
            SUBAGENT
           (Synthesize)
                │
                ▼
             APPLY
          (Act on findings)
```

## When to Use

- Code reviews requiring multiple perspectives
- Architectural decisions with trade-offs
- Complex debugging with multiple possible causes
- Any analysis benefiting from diverse expertise

## The Specialists

Common specialist perspectives:

| Specialist | Focus | Asks |
|------------|-------|------|
| Security | Vulnerabilities, auth, data | "What can be exploited?" |
| Performance | Speed, memory, scaling | "What's the bottleneck?" |
| Architecture | Structure, patterns, coupling | "Does this fit the system?" |
| Maintainability | Readability, complexity | "Can others understand this?" |
| Testing | Coverage, edge cases | "What could break?" |
| UX | User impact, behavior | "How does this affect users?" |

## Execution Steps

### Step 1: DISPATCH Specialists

Identify which perspectives are needed:

```
SWARM DISPATCH:
═══════════════════════════════════════════
Target: [What's being analyzed]
Specialists Engaged:
  1. [Specialist 1]: [Focus area]
  2. [Specialist 2]: [Focus area]
  3. [Specialist 3]: [Focus area]
═══════════════════════════════════════════
```

### Step 2: PARALLEL Analysis

Each specialist analyzes independently:

```
┌─────────────────────────────────────────┐
│ SECURITY SPECIALIST                     │
├─────────────────────────────────────────┤
│ Findings:                               │
│   - [Finding 1]                         │
│   - [Finding 2]                         │
│ Risk Level: [Low/Medium/High/Critical]  │
│ Recommendations:                        │
│   - [Recommendation 1]                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ PERFORMANCE SPECIALIST                  │
├─────────────────────────────────────────┤
│ Findings:                               │
│   - [Finding 1]                         │
│   - [Finding 2]                         │
│ Impact: [Negligible/Minor/Major]        │
│ Recommendations:                        │
│   - [Recommendation 1]                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ARCHITECTURE SPECIALIST                 │
├─────────────────────────────────────────┤
│ Findings:                               │
│   - [Finding 1]                         │
│   - [Finding 2]                         │
│ Alignment: [Good/Concerning/Poor]       │
│ Recommendations:                        │
│   - [Recommendation 1]                  │
└─────────────────────────────────────────┘
```

### Step 3: SYNTHESIZE

Combine findings, resolve conflicts:

```
SYNTHESIS:
═══════════════════════════════════════════
Agreement:
  - All specialists agree on: [points of consensus]

Conflicts:
  - Security vs Performance: [conflict description]
    → Resolution: [how to balance]

  - Architecture vs Maintainability: [conflict description]
    → Resolution: [how to balance]

Priority-Ordered Recommendations:
  1. [CRITICAL] [Recommendation]
  2. [HIGH] [Recommendation]
  3. [MEDIUM] [Recommendation]
  4. [LOW] [Recommendation]
═══════════════════════════════════════════
```

### Step 4: APPLY

Act on synthesized recommendations:

```
APPLYING SWARM FINDINGS:
─────────────────────────────────────────
□ [Action 1] - from [Specialist]
□ [Action 2] - from [Specialist]
□ [Action 3] - from synthesis
─────────────────────────────────────────
```

## Handling Specialist Conflicts

When specialists disagree:

1. **Surface the tension** - Don't hide disagreements
2. **Identify the trade-off** - What's being traded for what
3. **Apply context** - Which concern matters more HERE
4. **Escalate if needed** - User decides on genuine conflicts

```
CONFLICT RESOLUTION:
─────────────────────────────────────────
Security says: "Add rate limiting"
Performance says: "Rate limiting adds latency"

Trade-off: Security vs Response Time
Context: This is a public API with auth
Resolution: Security wins → Add rate limiting
            Mitigate: Cache rate limit checks
─────────────────────────────────────────
```

## Anti-Patterns

```
❌ SOLO SPECIALIST
   Only one perspective considered
   Fix: Minimum 2-3 specialists for complex analysis

❌ AVERAGING SPECIALISTS
   "Everyone found issues, so we'll fix half"
   Fix: Address ALL critical findings

❌ LOUDEST SPECIALIST WINS
   Security always overrules everything
   Fix: Context determines priority

❌ SYNTHESIS PARALYSIS
   Can't reconcile different views
   Fix: Escalate to user with clear trade-offs
```

## Quick Specialist Combos

| Scenario | Specialists |
|----------|-------------|
| Code Review | Security + Maintainability + Testing |
| New Feature | Architecture + Performance + UX |
| Bug Fix | Testing + Performance + Security |
| Refactor | Architecture + Maintainability |
| API Design | Security + UX + Performance |

## The Rule

> **Multiple perspectives catch what one misses. Synthesize, don't average.**
