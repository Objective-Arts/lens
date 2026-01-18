# Claude-Optimal User Guide

## The Problem

Claude Code produces working code. But "working" isn't enough.

When external reviewers (Codex, Gemini, Qodana, or human experts) look at Claude's output, they consistently flag the same issues:
- 150-line functions doing 8 things
- Data processing mixed with rendering logic
- Inconsistent patterns (innerHTML here, data-join there)
- Generic code that doesn't follow framework idioms

**Root cause**: Claude optimizes for "satisfies the request" not "survives expert review." Without explicit quality standards, Claude picks "good enough."

## The Solution

Claude-optimal is a configuration methodology that gives Claude explicit quality standards. It has three components:

| Component | What It Does | How You Use It |
|-----------|--------------|----------------|
| **Profiles** | Bundles of skills for project types | Apply once per project |
| **Standards** | Rules for what good code looks like | Copy to project CLAUDE.md |
| **Flags** | Runtime enforcement during work | Add to prompts as needed |

Together, they shift Claude from "working code" to "reviewable code."

---

## Quick Start (5 Minutes)

### Step 1: Apply a Profile

Profiles are composable. Stack them with `+`:

```bash
cc-config profile apply base-tech+javascript+react -p /path/to/project
```

This creates symlinks to skills in your project's `.claude/skills/` and updates your CLAUDE.md with auto-invoke rules.

**Common combinations:**

| Project Type | Profile Stack |
|--------------|---------------|
| React frontend | `base-tech + javascript + react + frontend` |
| React + D3 viz | `base-tech + javascript + react + d3 + frontend` |
| Node API | `base-tech + javascript + node` |
| Full-stack JS | `base-tech + javascript + react + node + frontend` |
| Java backend | `base-tech + java` |
| Go service | `base-tech + go` |

### Step 2: Add Framework Standards

Copy the relevant section from `FRAMEWORK-TEMPLATES.md` to your project's CLAUDE.md.

For a D3 project, you'd add:
```markdown
## D3 Structural Standards (Non-Negotiable)

### DOM Manipulation
- ALWAYS use `.selectAll().data().join()` for data-driven elements
- NEVER use innerHTML for anything data-bound
...
```

### Step 3: Use Quality Flags

When working, add flags to enforce structure:

```
> Build the timeline component --structure-first
```

Claude will show you the architecture plan before implementing.

---

## Profiles: What Skills for Which Project

### What's a Profile?

A profile is a named bundle of skills organized by category:

```yaml
# Example: base-tech profile
name: base-tech
skills:
  security:
    - security-mindset
    - owasp
    - bruce-schneier
  tech:
    - ceremony
    - defense-in-depth
    - escalate
agents:
  - security-auditor
  - code-reviewer
```

### The Profile Stack

Profiles are designed to compose. `base-tech` is the foundation for all tech projects. Language/framework profiles add on top:

```
base-tech          ← Security + dev workflows (always include)
    │
    ├── javascript ← JS/TS expertise (kyle-simpson, cherny)
    │       │
    │       ├── react    ← React patterns (abramov, dodds, osmani)
    │       ├── angular  ← Angular patterns
    │       ├── node     ← Node backend
    │       └── d3       ← D3 visualization (bostock)
    │
    ├── java       ← Java patterns (bloch)
    ├── go         ← Go patterns (pike)
    └── python     ← Python patterns (TODO)
```

### What Each Profile Provides

**base-tech** (include in ALL tech projects):
- Security skills: security-mindset, owasp, bruce-schneier, tanya-janca, troy-hunt
- Tech workflows: ceremony, defense-in-depth, escalate, generate-validate
- Agents: security-auditor, code-reviewer, test-engineer

**javascript** (add to any JS/TS project):
- Skills: kyle-simpson (JS runtime), cherny (TypeScript)
- Auto-invoke: Complex JS → kyle-simpson, TypeScript → cherny

**react** (combine with javascript):
- Skills: abramov (React patterns), dodds (testing), osmani (performance)
- Auto-invoke: React components → abramov, tests → dodds, performance → osmani

**d3** (combine with javascript):
- Skills: bostock (D3 patterns)
- Agents: css-expert, accessibility-tester
- Auto-invoke: D3 code → bostock

### How to Apply

**With cc-config CLI:**
```bash
cc-config profile apply base-tech+javascript+react -p /path/to/project

# Preview first:
cc-config profile show base-tech+javascript+react

# Dry run:
cc-config profile apply base-tech+javascript+react --dry-run -p /path/to/project
```

**Manually:**
```bash
cd /path/to/project/.claude/skills
ln -sf ~/.claude/skill-library/security/* .
ln -sf ~/.claude/skill-library/tech/* .
ln -sf ~/local-tech-projects/canon-skills/javascript/abramov .
# etc.
```

---

## Standards: What Good Code Looks Like

### Universal Standards (All Code)

These rules apply to ALL Claude-generated code, regardless of framework:

**Function Design:**
- Single responsibility per function
- Maximum 30 lines (extract if longer)
- Names describe what, not how
- Pure functions where possible

**Data Flow:**
- Pipeline pattern: raw → group → enrich → sort → render
- Calculations happen in prep, not in presentation
- Render functions receive complete data, touch only output

**Consistency:**
- One pattern per concern (never mix innerHTML and data-join)
- Match existing codebase patterns

**Event Handling:**
- Attach once, not per render
- Delegate where possible
- Clean up on destroy

See `STRUCTURAL-STANDARDS.md` for full details.

### Framework Standards

Each framework has specific idioms. Copy the relevant section from `FRAMEWORK-TEMPLATES.md` to your project's CLAUDE.md.

**D3 example:**
```markdown
- ALWAYS use `.selectAll().data().join()` for data-driven elements
- NEVER use innerHTML for anything data-bound
- Attach event handlers in `.join()` enter phase
```

**React example:**
```markdown
- Container/Presenter split
- Custom hooks for reusable logic
- No inline object literals in JSX (causes re-renders)
```

**Angular example:**
```markdown
- Async pipe over manual subscriptions (always)
- trackBy on ALL *ngFor (no exceptions)
- No function calls in template bindings
```

### Anti-Patterns

Each framework template includes anti-patterns Claude must avoid. These are the specific issues external reviewers consistently flag.

---

## Flags: How to Enforce It

### The Three Flags

| Flag | When to Use | What Claude Does |
|------|-------------|------------------|
| `--structure-first` | New features | Shows architecture plan, waits for approval |
| `--review-hard` | Before completion | Adversarial self-review, fixes issues |
| `--refactor-clean` | Cleanup tasks | Systematic decomposition with before/after |

### --structure-first

Use when building new features or components.

**Your prompt:**
```
> Build the placement timeline view --structure-first
```

**Claude's response:**
```markdown
## Structure Plan

### Functions (single responsibility each):
1. fetchPlacements() - API call only
2. groupByMonth(data) - grouping only
3. enrichWithMetrics(grouped) - calculations only
4. sortByStartDate(enriched) - sorting only
5. renderTimeline(sorted) - DOM only

### Data Flow:
raw → group by month → calculate metrics → sort → render

### Separation:
- Data prep: steps 1-4 (pure, testable)
- Rendering: step 5 (DOM only)

Ready to implement? [Awaiting approval]
```

You review, approve, and Claude implements with clean architecture.

### --review-hard

Use before presenting code as complete.

**Your prompt:**
```
> That looks done. --review-hard
```

**Claude's response:**
```markdown
## Review Findings

### Fixed:
- Extracted calculateMetrics() from 147-line function
- Moved grouping logic out of render function
- Unified DOM manipulation to data-join pattern
- Moved event handlers to .join() enter phase

### Verified:
- [x] No function exceeds 30 lines
- [x] Data prep separate from rendering
- [x] Consistent patterns throughout

Code is now review-ready.
```

### --refactor-clean

Use for cleanup and tech debt.

**Your prompt:**
```
> --refactor-clean src/views/renderUserView.js
```

**Claude's response:**
```markdown
## Refactoring: renderUserView.js

### Before (1 function, 147 lines, 8 responsibilities):
renderUserView() - fetch, group, calculate, sort, build HTML, attach handlers, update DOM, handle errors

### After (8 functions, max 25 lines each):
fetchUserData()        → API call
groupByCategory(data)  → grouping
calculateTotals()      → calculations
sortByDate()           → sorting
renderUserList()       → DOM via data-join
attachHandlers()       → events (once)
updateView()           → orchestration
handleError()          → error handling

### Changes Made:
- Decomposed monolithic function into pipeline
- Extracted calculations to pure functions
- Unified DOM updates to D3 data-join
```

### Combining Flags

```
> Build the timeline view --structure-first --review-hard
```

Claude will plan first, implement, then do adversarial review before presenting.

---

## Putting It All Together

### New Project Setup

1. **Apply profile stack:**
   ```bash
   cc-config profile apply base-tech+javascript+react -p /path/to/project
   ```

2. **Add framework standards to CLAUDE.md:**
   Copy from FRAMEWORK-TEMPLATES.md

3. **Verify with /status:**
   ```
   > /status
   ```
   Shows what's active in the session.

### Daily Workflow

**Starting a feature:**
```
> Build the user dashboard --structure-first
```

**Before committing:**
```
> --review-hard
```

**Cleaning up old code:**
```
> --refactor-clean src/components/LegacyView.js
```

### Measuring Success

After a week:
- Are external reviewers finding fewer structural issues?
- Is less time spent on review passes?
- Is new code matching existing patterns?

If still catching issues, add them to your project's anti-patterns.

---

## Reference

| Document | Purpose |
|----------|---------|
| `PROFILES.md` | Full profile catalog with all combinations |
| `STRUCTURAL-STANDARDS.md` | Complete universal standards |
| `FRAMEWORK-TEMPLATES.md` | All framework-specific templates |
| `FLAGS.md` | Detailed flag behavior and examples |
| `SKILL.md` | Pattern language theory |
| `PATTERNS.md` | GoF-style formal patterns |

---

## The Core Insight

> Claude knows best practices. It just doesn't apply them unless explicitly required.

Claude-optimal makes quality requirements explicit:
- **Profiles** tell Claude which expertise to apply
- **Standards** tell Claude what good code looks like
- **Flags** tell Claude when to enforce structure

The result: code that works AND survives expert review.
