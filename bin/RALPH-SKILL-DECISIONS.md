# Ralph's Skill Decisions

This document defines which skills Ralph loads at each stage of autonomous execution.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  CORE BRAIN (always loaded, full skills)                │
│  Shapes how Claude thinks about all code                │
│  ~14,000 tokens                                         │
├─────────────────────────────────────────────────────────┤
│  STAGE-SPECIFIC (added per stage)                       │
│  Specialized expertise for that phase of work           │
│  ~4,000-8,000 additional tokens                         │
├─────────────────────────────────────────────────────────┤
│  DYNAMIC (context-triggered)                            │
│  Based on PRD item content (UI, API, database, etc.)    │
│  Invoked when relevant keywords detected                │
└─────────────────────────────────────────────────────────┘
```

## Core Brain (8 Skills, Always Loaded)

These fundamentally shape how Claude approaches all code.

| Skill | Principle | What It Gives You |
|-------|-----------|-------------------|
| **kernighan** | Clarity above all | Code is read more than written. Write for readers. |
| **mcilroy** | Do one thing well | Modularity, composition, Unix philosophy |
| **linus** | Data structures first | Get the data right, algorithms follow |
| **bill-joy** | Fail explicitly | Never hide failures, handle errors visibly |
| **schneier** | Security mindset | Think like an attacker, assume breach |
| **thompson** | Get it working first | Pragmatism over perfection, iterate |
| **bloch** | Effective APIs | Every function signature is an API |
| **gang-of-four** | Design patterns | Recognize and apply proven structures |

## Stage-Specific Skills

### PLAN Stage
*Designing the approach before coding*

| Skill | Why |
|-------|-----|
| dijkstra | Correctness by construction, formal thinking |
| knuth | Algorithmic thinking, complexity awareness |
| pike | Simplicity in system design |

**Dynamic additions:**
- UI work → cooper (interaction design)
- API work → fielding (REST principles)

### BUILD Stage
*Actually writing code*

Core brain handles most. Add based on language/domain:

| Context | Add Skills |
|---------|------------|
| JavaScript/TypeScript | cherny, crockford, kyle-simpson |
| Python | hettinger, ramalho |
| React | abramov, frost |
| UI/Frontend | frost, norman, ive, wroblewski |
| API | fielding |
| Database | codd |

### CLEAN Stage
*Refactoring, improving structure*

| Skill | Why |
|-------|-----|
| feathers | Working with legacy code, finding seams |

*Note: gang-of-four already in core brain*

### TEST Stage
*Writing and running tests*

| Skill | Why |
|-------|-----|
| meszaros | xUnit test patterns |
| fowler-test | Test pyramid, test strategy |
| hevery | Writing testable code |
| dodds | Testing Library (JS/React specific) |

### REVIEW Stage
*Adversarial analysis, finding failures*

| Skill | Why |
|-------|-----|
| petroski | Learn from failure, why designs fail |
| taleb | Antifragility, design for black swans |
| leveson | System safety, accident causation |
| owasp | Security checklist, vulnerability patterns |
| tanya-janca | AppSec, secure SDLC |

*Note: schneier already in core brain*

### DOC Stage
*Documentation and clarity*

| Skill | Why |
|-------|-----|
| procida | Diataxis framework (tutorials, how-to, reference, explanation) |
| strunk-white | Omit needless words |
| zinsser | Clarity in writing |
| king | Kill your darlings |

## Context-Triggered Dynamic Skills

Ralph analyzes PRD item text and adds relevant skills:

| Keywords Detected | Additional Skills |
|-------------------|-------------------|
| form, button, component, UI, modal, page | frost, norman, ive, wroblewski, duarte |
| API, endpoint, REST, route | fielding |
| table, database, schema, migration | codd |
| password, auth, token, security | owasp, tanya-janca (reinforce core) |
| performance, optimize, cache | carmack, knuth |
| CLI, command, tool | raymond |

## Token Budget

| Stage | Core | Stage-Specific | Dynamic | Total |
|-------|------|----------------|---------|-------|
| PLAN | ~14k | ~6k | ~4k | ~24k |
| BUILD | ~14k | ~8k | ~4k | ~26k |
| CLEAN | ~14k | ~4k | ~2k | ~20k |
| TEST | ~14k | ~8k | ~2k | ~24k |
| REVIEW | ~14k | ~10k | ~2k | ~26k |
| DOC | ~14k | ~8k | ~0k | ~22k |

All within comfortable limits of 200k context window.

## Implementation

Ralph should:
1. Load core brain full SKILL.md files (always)
2. Load stage-specific full SKILL.md files (per stage)
3. Detect item context and invoke additional skills dynamically
4. Use SUMMARY.md only for reference, not for injection

## Future Considerations

- Profile-based core brain variations (security-hardened profile adds more security skills to core)
- Skill effectiveness measurement (does loading X skill improve output quality?)
- Skill interaction analysis (do certain skill combinations work better together?)
