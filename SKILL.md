---
name: claude-optimal
description: Pattern language for composing Claude Code primitives into quality-focused configurations. Use when setting up projects, designing workflows, or asking "how should this project be configured".
---

# Claude-Optimal: Pattern Language for Claude Code

> **This is the theory document.** For the complete guide combining theory and practice, see [docs/COMPREHENSIVE-GUIDE.md](docs/COMPREHENSIVE-GUIDE.md).

This document explains *why* the patterns work. For *how* to use them:
- **Profiles**: [docs/PROFILES.md](docs/PROFILES.md)
- **Standards**: [docs/STRUCTURAL-STANDARDS.md](docs/STRUCTURAL-STANDARDS.md)
- **Flags**: [docs/FLAGS.md](docs/FLAGS.md)

---

## Part I: Canon Skill Patterns

### Pattern: DOMAIN LENS

**Context**: Working in a domain with recognized masters (Java, D3, React, Security)

**Problem**: Claude has broad knowledge but no focused perspective. Code is correct but generic.

**Solution**: Load canon skill BEFORE writing code. The skill acts as a lens, not just knowledge.

```
WITHOUT LENS          WITH LENS
─────────────────     ─────────────────
General Java      →   Java through Bloch's eyes
"Works correctly"     "Effective Java patterns"
```

**Forces**:
- Token cost vs quality improvement
- Must be in context when writing, not after
- More specific lens beats broader lens

**Canon Structure** (Two Project Types):

```
SOFTWARE PROJECTS
┌─────────────────────────────────────────────────────────────┐
│ BASE CANON (always active)                                  │
│   Kernighan    - Clarity, simplicity                        │
│   Schneier     - Security mindset                           │
│   Dodds        - Testing Trophy                             │
│   OWASP        - Vulnerability patterns                     │
│   Procida      - Documentation (Diátaxis)                   │
├─────────────────────────────────────────────────────────────┤
│ DOMAIN CANON (per language/framework)                       │
│   Java:    Bloch (Effective Java)                           │
│   JS:      Simpson (You Don't Know JS)                      │
│   React:   Abramov (Mental models, hooks)                   │
│   D3/Viz:  Bostock, Tufte, Few, Knaflic                     │
└─────────────────────────────────────────────────────────────┘

BUSINESS PROJECTS
┌─────────────────────────────────────────────────────────────┐
│ BASE CANON (always active)                                  │
│   Strunk & White  - Elements of Style                       │
│   Zinsser         - On Writing Well                         │
├─────────────────────────────────────────────────────────────┤
│ DOMAIN CANON (per focus area)                               │
│   Strategy:     Porter (Competitive Advantage)              │
│   Tech Analysis: Thompson (Stratechery)                     │
│   Startups/Org: Horowitz (Hard Thing)                       │
└─────────────────────────────────────────────────────────────┘
```

**Key**: Base + Domain canon are both always alive - the lens through which all work is done.

**Implementation**:
```
CLAUDE.md:
| Context | Action |
|---------|--------|
| Java code | INVOKE /bloch |
| React components | INVOKE /abramov |
```

---

### Pattern: SECURITY LENS (Always-On)

**Context**: Any code touching auth, data, APIs, user input

**Problem**: Security as afterthought. Vulnerabilities ship.

**Solution**: Security skills trigger BEFORE writing, not as review after.

```
WRONG                     RIGHT
─────────────────         ─────────────────
Write code            →   Invoke security-mindset
Review for security       Write with security lens
Find vulnerabilities      Prevent vulnerabilities
```

**Forces**:
- False positives (triggers too often) vs false negatives (misses threats)
- Balance with development flow
- Some code genuinely low-risk

**Trigger Patterns**:
```
High confidence (always trigger):
  - auth, login, password, session, token
  - SQL, query, database access
  - user input, form data, request body
  - API key, secret, credential
  - encrypt, decrypt, hash

Medium confidence (trigger if context supports):
  - admin, permission, role
  - file upload, download
  - redirect, URL parameter
```

**Implementation**:
```yaml
# In project CLAUDE.md or profile
security_triggers:
  high_confidence:
    - auth|login|password|session|token
    - SQL|query|database
    - user.input|form|request.body
  action: INVOKE /security-mindset then /owasp
```

---

### Pattern: CANON STACK

**Context**: Project has multiple domains (React frontend + Node backend + D3 viz)

**Problem**: Single canon skill insufficient. Need layered expertise.

**Solution**: Define canon stack - Base Canon (universal) + Domain Canon (specific)

```
D3 VISUALIZATION PROJECT (Software):
┌─────────────────────────────────────────┐
│ BASE CANON (always active)              │
│   Kernighan, Schneier, Dodds, OWASP,    │
│   Procida                               │
├─────────────────────────────────────────┤
│ DOMAIN CANON (always active)            │
│   Bostock (D3 patterns)                 │
│   Tufte, Few, Knaflic (viz design)      │
│   Abramov (React components)            │
└─────────────────────────────────────────┘
```

**Forces**:
- Base canon applies to ALL software projects
- Domain canon selected by project type
- Both layers always alive - not invoked per-use
- Security (Schneier, OWASP) built into base, not optional

---

## Part II: Subagent Patterns

### Pattern: PARALLEL EXPLORATION

**Context**: Large/unfamiliar codebase, multiple unknowns

**Problem**: Sequential exploration is slow, single context limited

**Solution**: Spawn multiple Explore agents concurrently

```
SEQUENTIAL (slow)         PARALLEL (fast)
─────────────────         ─────────────────
Find auth code            ┌─ Find auth code
      ↓                   ├─ Find API endpoints
Find API endpoints        ├─ Find data models
      ↓                   └─ Find tests
Find data models              ↓
      ↓                   Synthesize findings
Find tests
```

**Implementation**:
```
User: "Understand this codebase"
Claude: [Spawns 4 Explore agents in parallel]
  - Agent 1: "Find authentication and authorization"
  - Agent 2: "Find API routes and handlers"
  - Agent 3: "Find data models and database access"
  - Agent 4: "Find test patterns and coverage"
```

**Forces**:
- Each agent has separate context (good for large tasks)
- Coordination overhead (must synthesize)
- Diminishing returns beyond 4-5 parallel agents

---

### Pattern: QUALITY GATE SEQUENCE

**Context**: After writing code

**Problem**: Code ships without review, tests, security check

**Solution**: Enforce sequence: test → review → security

```
CODE WRITTEN
     ↓
┌─────────────────┐
│ test-engineer   │ → Creates/runs tests
└────────┬────────┘
         ↓
┌─────────────────┐
│ code-reviewer   │ → Quality, patterns, clarity
└────────┬────────┘
         ↓
┌─────────────────┐
│ security-auditor│ → Vulnerabilities (if applicable)
└────────┬────────┘
         ↓
    READY TO COMMIT
```

**Forces**:
- Time cost vs quality benefit
- Not all code needs full sequence (trivial changes)
- Security gate only for relevant code

**When to Apply**:
```
Full sequence:
  - New features
  - Auth/data changes
  - API endpoints
  - Anything user-facing

Abbreviated (test + review):
  - Bug fixes
  - Refactoring
  - Internal utilities

Skip:
  - Documentation only
  - Config changes
  - Comments/formatting
```

---

### Pattern: SPECIALIST DELEGATION

**Context**: Task requires deep expertise in specific area

**Problem**: Main context cluttered, specialist knowledge diluted

**Solution**: Delegate to specialist subagent, return findings

```
MAIN CONTEXT                 SPECIALIST CONTEXT
─────────────────            ─────────────────
"Make this accessible"   →   accessibility-tester
                             [Deep WCAG analysis]
                         ←   [Specific findings]
Apply findings
```

**Available Specialists**:
| Agent | Specialty | When to Delegate |
|-------|-----------|------------------|
| css-expert | Complex layouts, animations | Styling challenges |
| accessibility-tester | WCAG compliance | UI components |
| security-auditor | Vulnerability analysis | Auth, data, APIs |
| test-engineer | Test strategy, coverage | After writing code |
| code-reviewer | Quality, patterns | Before commit |
| error-detective | Debugging, root cause | Mysterious failures |

---

### Pattern: CONTEXT PRESERVATION

**Context**: Long task, context filling up

**Problem**: Lose important context mid-task

**Solution**: Delegate heavy work to agents, keep main context for conversation

```
ANTI-PATTERN               PATTERN
─────────────────          ─────────────────
Main context does          Main context orchestrates
everything                 Agents do heavy lifting
     ↓                          ↓
Context fills up           Main stays light
Lose conversation          Conversation preserved
```

**Implementation**:
```
Main context:
  - User conversation
  - Decision making
  - Orchestration

Delegate to agents:
  - Large file reads (Explore agent)
  - Test creation (test-engineer)
  - Code review (code-reviewer)
  - Deep research (general-purpose agent)
```

---

## Part III: Project Configuration Patterns

### Pattern: PROJECT TYPE DETECTION

**Context**: Starting work in a project

**Problem**: Generic configuration for specific project type

**Solution**: Detect type, apply appropriate profile

```
DETECTION SIGNALS:
─────────────────
package.json + d3 dependency     → D3 Visualization
package.json + react dependency  → React Frontend
pom.xml or build.gradle          → Java Backend
go.mod                           → Go Project
requirements.txt + django        → Python Web
Cargo.toml                       → Rust Project
```

**Profile Selection**:
```
Detected: D3 + React
     ↓
Project Type: Software
Profile: d3-visualization
     ↓
Canon Stack:
  BASE: kernighan, schneier, dodds, owasp, procida
  DOMAIN: bostock, tufte, few, knaflic, abramov
```

---

### Pattern: STRATEGY DOCUMENT

**Context**: Every configured project

**Problem**: Configuration without rationale. Why these skills? Why these rules?

**Solution**: STRATEGY.md explains the "why"

```
project/
├── .claude/
│   ├── STRATEGY.md      ← WHY this configuration
│   ├── skills/          ← WHAT skills
│   └── settings.json    ← HOW configured
└── CLAUDE.md            ← WHEN to invoke
```

**STRATEGY.md Template**:
```markdown
# Project Strategy

## Project Type
[What kind of project is this]

## Quality Priorities
1. [Most important quality attribute]
2. [Second priority]
3. [Third priority]

## Canon Stack Rationale
- **Base Canon**: [Software or Business base] - [why this project type]
- **Domain Canon**: [specific experts] - [why these for this project]

## Patterns Applied
- [Pattern name] - [why it applies here]

## Quality Sequence
[Which gates apply and why]

## Known Risks
- [Risk] - [mitigation via skill/pattern]
```

---

### Pattern: PROFILE INHERITANCE

**Context**: Multiple projects of same type

**Problem**: Duplicate configuration, inconsistent setup

**Solution**: Profiles define reusable configurations

```
PROFILE HIERARCHY:
─────────────────
base-development          (everyone gets)
     ↓
javascript-development    (JS projects)
     ↓
d3-visualization          (D3 specifically)
     ↓
project-overrides         (this project's tweaks)
```

**Profile Composition**:
```yaml
# d3-visualization.yaml
extends: javascript-development
project_type: software

canon:
  base: [kernighan, schneier, dodds, owasp, procida]
  domain: [bostock, tufte, few, knaflic, abramov]

quality_sequence:
  - test-engineer
  - code-reviewer
  - accessibility-tester  # D3 needs this

# Canon is always alive - no auto_invoke needed
# Base + Domain canon active throughout entire workflow
```

---

## Part IV: Enforcement Patterns

### Pattern: HOOK GATES

**Context**: Quality rules that must be enforced

**Problem**: Skills are suggestions. Can be forgotten.

**Solution**: Hooks enforce, skills advise

```
SKILL (advisory)          HOOK (enforced)
─────────────────         ─────────────────
"Consider testing"    →   "Tests must pass"
Can be skipped            Cannot be bypassed
```

**When to Use Hooks**:
```
ALWAYS HOOK:
  - Format on save
  - Lint before commit
  - Tests must pass before push

KEEP AS SKILL:
  - Code style preferences
  - Architecture guidance
  - Pattern recommendations
```

---

### Pattern: TRANSPARENCY CHECKPOINT

**Context**: User needs visibility into configuration

**Problem**: Black box. Don't know what's active.

**Solution**: /status command shows current state

```
┌─ Session Status ─────────────────────────┐
│ Project: d3-smr (D3 Visualization)       │
│ Profile: d3-visualization                │
│ Type: Software                           │
│                                          │
│ CANON STACK (always alive)               │
│   BASE: kernighan, schneier, dodds,      │
│         owasp, procida                   │
│   DOMAIN: bostock, tufte, few, knaflic,  │
│           abramov                        │
│                                          │
│ QUALITY SEQUENCE: ENABLED                │
│   test-engineer → code-reviewer          │
│                                          │
│ HOOKS: pre-push [test, lint]             │
└──────────────────────────────────────────┘
```

---

## Part V: The Meta-Pattern

### Pattern: COMPOUND QUALITY

**Context**: All development work

**Problem**: Individual patterns help. Combined patterns multiply.

**Solution**: Layer patterns for compound effect

```
PATTERN LAYERS:
┌─────────────────────────────────────────┐
│ Canon Stack (domain expertise)          │ ← Lens for all code
├─────────────────────────────────────────┤
│ Quality Sequence (enforced gates)       │ ← Verification
├─────────────────────────────────────────┤
│ Parallel Agents (context leverage)      │ ← Speed + depth
├─────────────────────────────────────────┤
│ Transparency (visibility via /status)   │ ← Know what's active
└─────────────────────────────────────────┘
```

**Key Insight**: Patterns compound because each layer catches what others miss:
- Canon prevents bad patterns from being written
- Quality sequence catches what slipped through
- Hooks enforce what must never fail

Quality is **generative** (built in from the start), not **corrective** (fixed after the fact).

---

## Quick Reference

**Starting a project?**
1. Detect project type
2. Apply appropriate profile
3. Write STRATEGY.md explaining why
4. Verify with /status

**Writing code?**
1. Canon skill should be in context
2. Security lens if touching risky areas
3. Quality sequence after completion

**Large exploration?**
1. Spawn parallel Explore agents
2. Synthesize findings in main context
3. Keep main context for decisions

**Quality concerns?**
1. Delegate to specialist agents
2. Run full quality sequence
3. Hook enforcement for must-haves

---

## Part VI: Structural Enforcement Patterns

### Pattern: STRUCTURE-FIRST

**Context**: Building new features or components

**Problem**: Claude optimizes for "working code" not "reviewable code." External reviewers (Codex, Gemini, Qodana) consistently flag structural issues.

**Solution**: Plan architecture before implementing. Show structure, get approval, then build.

```
WITHOUT STRUCTURE-FIRST        WITH STRUCTURE-FIRST
─────────────────────          ─────────────────────
"Build timeline view"          "Build timeline view --structure-first"
      ↓                              ↓
Claude writes 150-line         Claude shows plan:
monolith function                - 5 functions, 1 responsibility each
      ↓                           - Data flow: fetch→group→enrich→sort→render
External reviewer flags           - Separation: data-prep vs DOM
8 structural issues               ↓
      ↓                        You approve
Refactoring session               ↓
                               Claude implements clean architecture

```

**Implementation**: Use `--structure-first` flag. See FLAGS.md.

---

### Pattern: ADVERSARIAL REVIEW

**Context**: Before presenting code as complete

**Problem**: Claude self-review is too friendly. Misses issues external tools catch.

**Solution**: Ask "What would a hostile reviewer flag?" and fix before presenting.

```
FRIENDLY REVIEW                ADVERSARIAL REVIEW
───────────────                ──────────────────
"Looks correct"                "What would Codex flag?"
      ↓                              ↓
Ships with structural          Finds mixed patterns
issues                         Finds 80-line function
      ↓                        Finds calculations in render
External review catches              ↓
all of them                    Fixes before presenting
```

**Implementation**: Use `--review-hard` flag. See FLAGS.md.

---

### Pattern: PIPELINE DISCIPLINE

**Context**: All data processing code

**Problem**: Data transformation mixed with presentation. Calculations inside render logic.

**Solution**: Enforce pipeline: raw → group → enrich → sort → render

```
MIXED (anti-pattern)           PIPELINE (pattern)
────────────────────           ──────────────────
function render(data) {        // Data prep (pure, testable)
  data.forEach(item => {       const grouped = groupBy(data);
    const calc = item.a *      const enriched = enrich(grouped);
    item.b;                    const sorted = sortBy(enriched);
    // mixed: calc + DOM
    container.innerHTML +=     // Render (DOM only)
      `<div>${calc}</div>`;    render(sorted);
  });
}
```

**Implementation**: See STRUCTURAL-STANDARDS.md for full rules.

---

### Pattern: CONSISTENCY ENFORCEMENT

**Context**: Codebase with established patterns

**Problem**: Claude introduces different patterns, creating inconsistency.

**Solution**: Detect existing patterns, match them exactly.

```
BEFORE (mixed)                 AFTER (consistent)
──────────────                 ─────────────────
innerHTML for some data        All data uses data-join
data-join for other data       (matched existing pattern)
callbacks here                 All async uses await
promises there                 (matched existing pattern)
```

**Rule**: One pattern per concern. Never mix.

---

### Pattern: FRAMEWORK STANDARDS

**Context**: Framework-specific projects (D3, Angular, React, etc.)

**Problem**: Generic Claude code doesn't follow framework idioms.

**Solution**: Apply framework-specific standards from templates.

```
D3 STANDARDS                   ANGULAR STANDARDS
────────────                   ─────────────────
data-join not innerHTML        async pipe not subscribe
enter/update/exit pattern      trackBy on all ngFor
event delegation               smart/dumb split
max 30 lines                   max 200 lines/component
```

**Implementation**: Copy from FRAMEWORK-TEMPLATES.md to project CLAUDE.md.

---

## The Rule

> **Configuration is strategy made executable. Every skill, hook, and agent choice should trace back to a quality goal. If you can't explain why it's there, it shouldn't be.**
