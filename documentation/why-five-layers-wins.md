# Why Three Layers Wins

## The Comparison

**Pure LLM approach:** AI writes code, AI says "looks good," ship it.

**Lens approach:** AI writes code shaped by domain expertise, a deterministic quality gate catches concrete violations, and structured review against rubrics catches the rest.

## Layer-by-Layer Advantage

### Layer 1: Canons — Expertise at Write-Time

88 canon skills load domain expertise into Claude's context *before* code is written. The AI doesn't write generic code and then get told what's wrong — it writes informed code from the start.

| | Pure LLM | Lens |
|---|---|---|
| Knows React hook rules | General knowledge | **Specific: 446-line canon with concrete checks** |
| Knows C# async pitfalls | Vague awareness | **Specific: async void = bug, sync-over-async = deadlock** |
| Knows SQL set-based thinking | Sometimes | **Always: canon loaded via auto-invoke** |
| Knows security attack patterns | Surface level | **Deep: OWASP top 10, threat modeling, trust boundaries** |

**Result: Lens produces better code on the first pass.** The canon doesn't fix bad code — it prevents it. A developer who has internalized Effective Java writes differently than one who hasn't. Same principle.

### Layer 2: Quality Gate — Deterministic Machine Checks

`quality-gate.ts` runs deterministic pattern checks. No AI involved. No judgment. Match = fail.

Catches: hardcoded secrets, shell injection, path traversal, TOCTOU races, empty catch blocks, circular imports, functions over 30 lines, files over 300 lines, vague parameter names, too many exports, magic numbers, async void (C#), SQL injection (C#), raw types (Java), and 40+ more checks across JS/TS, C#, and Java.

| | Pure LLM | Lens |
|---|---|---|
| Finds every hardcoded secret | Maybe | **Always** |
| Finds every shell injection | Often missed | **Always** |
| Flags a parameter named `data` | Never | **Always** |
| Flags a file with 15 exports | Never | **Always** |
| Catches C# async void | Sometimes | **Always** |
| Can be argued with | Yes — "I think this one is safe" | **No — match = fail** |

**Result: Lens wins 100% of the time on these checks.** The gate runs after every build phase and on every `/fix`. Pass/fail, no ambiguity.

### Layer 3: Rubric Review — Structured Self-Review

14 rubrics give Claude specific, numbered criteria to review against. Not "does this look good?" but "Score 1-10: Are all error paths explicit? No swallowed exceptions? Cause chains preserved?" Auto-detection loads the right rubrics based on what's in the code.

| | Pure LLM | Lens |
|---|---|---|
| Reviews against specific criteria | Vague "best practices" | **Numbered checklists per domain** |
| Catches domain-specific issues | Generic | **Rubric-specific: Angular, TypeScript, D3, security, CLI** |
| Consistent across reviews | Varies wildly | **Same rubric, same criteria, every time** |
| Reviews every item | Maybe 60% | **Rubric demands completeness** |

**Result: Lens wins on consistency and coverage.** The rubric turns a vague "review this code" into a concrete checklist that Claude must work through.

## The Scoreboard

| Check Type | Pure LLM | Lens | Who Wins |
|---|---|---|---|
| Knowledge at write-time | Generic training data | 88 domain canons loaded in context | **Lens — always** |
| Mechanical rules (secrets, injection, length) | ~40% caught | 100% caught | **Lens — always** |
| Warning sign patterns (bad names, too many params) | ~10% caught | 100% caught | **Lens — always** |
| Judgment calls (clarity, single responsibility) | Vague, inconsistent | Rubric-guided, structured | **Lens — consistently** |

## The Only Scenario Where Lens Doesn't Win

Claude reviews code against a rubric, works through every criterion, marks everything PASS — and is wrong.

This is real. But:

1. It's the same gap the pure LLM approach has, except the pure LLM doesn't even have a rubric to work through
2. The quality gate already caught everything mechanical, so the remaining judgment calls are genuinely hard problems
3. The canon already prevented many of these issues at write-time — the rubric review is catching what slipped through, not the first line of defense

## Why This Matters

The senior engineer who catches subtle design flaws — that person might not exist at your company. They might not exist at most companies. And if they do exist, they're reviewing code for six teams and catching maybe 20% of what crosses their desk.

The three-layer system doesn't replace that mythical expert. It replaces the absence of that expert, which is the actual situation at most companies.

| Situation | What catches problems |
|---|---|
| Company with Jeff Dean | Jeff Dean |
| Company without Jeff Dean, using pure LLM | Hope |
| Company without Jeff Dean, using Lens | Canons + quality gate + rubric review |

The canon IS the expert knowledge, written down once. The gate and rubrics ensure it's enforced, not just available.

## How This Relates to Canon Skills

The 88 canon skills are the source of truth for the entire system. Every layer traces back to them.

```
Canon skills (88 SKILL.md files)
    │
    ├── Loaded at write-time to shape code generation
    │   "Think in sets" ← canon/sql/SKILL.md
    │   "Prefer static factories" ← canon/java/SKILL.md
    │   "Composition over inheritance" ← canon/react-state/SKILL.md
    │
    ├── Quality gate derives deterministic checks from them
    │   "Max 30 lines" ← canon/clarity/SKILL.md
    │   "No hardcoded secrets" ← canon/security-mindset/SKILL.md
    │   "No shell injection" ← canon/owasp/SKILL.md
    │
    └── Rubrics formalize their judgment calls into checklists
        "Input validation at every boundary" ← base.md
        "No N+1 queries" ← data-persistence.md
        "Hook rules followed" ← react.md
```

The canon is the spec. The gate and rubrics are two ways of enforcing it — one mechanical, one structured. Without the canon, the layers have nothing to check against. Without the layers, the canon is just suggestions.

## Giving the Canon Teeth

The canon was always the right knowledge. The problem was never what the rules say — it was making anyone follow them. In an LLM world, you can't fire the developer for ignoring the rules. You can't embarrass them in code review. You can't put them on a performance plan. The LLM has no consequences.

So you build consequences into the system:

- Break a mechanical rule → quality gate fails, code doesn't ship
- Write without expertise → canon loaded automatically via auto-invoke, can't avoid it
- Skip a review criterion → rubric demands every item checked

The canon goes from "advice the AI should follow" to "rules the AI cannot ship without satisfying." The knowledge stays the same. The enforcement changes everything.
