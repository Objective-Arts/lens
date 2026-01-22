# Claude-Optimal

A configuration methodology for getting consistently high-quality, expert-reviewed code from Claude Code.

---

## The Problem

Claude produces **working code that fails expert review**:
- 150-line functions doing 8 things
- Data processing mixed with rendering
- Inconsistent patterns across the codebase
- Generic code that ignores framework idioms

**Root cause**: Claude optimizes for "satisfies the request" not "survives expert review."

## The Solution

Two integrated systems that make quality requirements explicit:

```
┌─────────────────────────────────────────────────────────────┐
│ CANON-MASTER STRATEGY (The Lens)                            │
│                                                             │
│   Load the published wisdom of software's masters           │
│   BEFORE writing code, not after as review                  │
│                                                             │
│   "Java through Bloch's eyes, not generic Java"             │
└─────────────────────────────────────────────────────────────┘
                           +
┌─────────────────────────────────────────────────────────────┐
│ CLAUDE-OPTIMAL METHODOLOGY (The Workflow)                   │
│                                                             │
│   Profiles → Which expertise to load                        │
│   Standards → What good code looks like                     │
│   Flags → When to enforce quality gates                     │
│   Auto-Invoke → Automatic skill/flag triggers               │
└─────────────────────────────────────────────────────────────┘
```

**Together**: Quality is **generative** (built in from the start), not **corrective** (fixed after the fact).

---

## What's Included

### Canon Skills (34 Masters)

Expert perspectives loaded as lenses before writing code.

| Category | Masters |
|----------|---------|
| **Base Canon** (all projects) | Kernighan (clarity), Schneier (security), OWASP (vulnerabilities), Procida (documentation), Dodds (testing) |
| **JavaScript** | Simpson, Cherny, Crockford |
| **React** | Abramov |
| **Angular** | Hevery, Papa, Kurata |
| **D3/Visualization** | Bostock, Tufte, Few, Knaflic |
| **Java** | Bloch |
| **Go** | Pike |
| **Testing** | Dodds, Feathers, Meszaros, Fowler |
| **CS Foundations** | Dijkstra, Knuth, Liskov, Carmack |
| **Business** | Porter, Horowitz, Grove, Rumelt, Helmer |

See [canon/README.md](canon/README.md) for the complete catalog.

### Profiles

Composable bundles that load the right canon for your project type.

| Profile | Canon Loaded |
|---------|--------------|
| `javascript` | Simpson, Cherny |
| `react` | + Abramov |
| `angular` | + Hevery, Papa, Kurata |
| `d3` | + Bostock, Tufte, Few, Knaflic |
| `java` | Bloch |
| `fullstack` | Bloch + Simpson + Cherny |

Stack them: `javascript + react + d3`

### Flags

Runtime enforcement switches that trigger quality workflows.

| Flag | Purpose |
|------|---------|
| `--structure-first` | Inline plan → Approve → Implement |
| `--plan` | Full plan mode with `.plan.md` file |
| `--test [level]` | Write tests (unit/integration/e2e/all) |
| `--doc-code` | Generate documentation (Procida/Diátaxis) |
| `--review-hard` | Adversarial self-review before presenting |
| `--refactor-clean` | Systematic decomposition with before/after |

Combine them: `--structure-first --test all --doc-code --review-hard`

### Auto-Invoke Rules

Automatic triggers that invoke skills/flags based on context.

| Context | Auto-Invokes |
|---------|--------------|
| Auth, login, password code | /schneier, /owasp |
| New public API | --doc-code |
| React components | /abramov |
| Test files | /dodds |
| Java code | /bloch |

See [PROFILES.md](docs/PROFILES.md) for complete auto-invoke rules per profile.

### Standards

Explicit rules copied to project CLAUDE.md.

| Document | Content |
|----------|---------|
| [STRUCTURAL-STANDARDS.md](docs/STRUCTURAL-STANDARDS.md) | Universal code rules (30-line max, SRP, pipeline pattern) |
| [API-DESIGN-STANDARDS.md](docs/API-DESIGN-STANDARDS.md) | Bloch-style API design |
| [FRAMEWORK-TEMPLATES.md](docs/FRAMEWORK-TEMPLATES.md) | D3, React, Angular, Node, Go, Java idioms |

---

## Quick Start

### 1. Apply a Profile

```bash
cc-config profile apply javascript+react -p /path/to/project
```

Or manually add to project CLAUDE.md:

```markdown
## Canon Stack (always alive)
Base: Kernighan, Schneier, Dodds, OWASP, Procida
Domain: Simpson, Cherny, Abramov
```

### 2. Add Standards

Copy relevant sections from [FRAMEWORK-TEMPLATES.md](docs/FRAMEWORK-TEMPLATES.md) to your project CLAUDE.md.

### 3. Add Auto-Invoke Rules

Copy from [PROFILES.md](docs/PROFILES.md):

```markdown
## Auto-Invoke Rules

| Context | Action |
|---------|--------|
| React components | INVOKE /abramov |
| Auth code | INVOKE /schneier then /owasp |
| New public API | INVOKE --doc-code |
| Testing | INVOKE /dodds |
```

### 4. Use Flags

```bash
# New feature
> Build the user dashboard --structure-first --doc-code

# Full pipeline
> Build the auth system --structure-first --test all --doc-code --review-hard

# Cleanup
> --refactor-clean src/legacy/BigFile.js
```

### 5. Verify

```
> /status
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| **[COMPREHENSIVE-GUIDE.md](docs/COMPREHENSIVE-GUIDE.md)** | Full theory + practice (~2500 lines) |
| [USER-GUIDE.md](docs/USER-GUIDE.md) | Quick practical guide |
| [PROFILES.md](docs/PROFILES.md) | Profile catalog + auto-invoke rules |
| [FLAGS.md](docs/FLAGS.md) | Flag reference + workflows |
| [STRUCTURAL-STANDARDS.md](docs/STRUCTURAL-STANDARDS.md) | Universal code rules |
| [API-DESIGN-STANDARDS.md](docs/API-DESIGN-STANDARDS.md) | API design standards |
| [FRAMEWORK-TEMPLATES.md](docs/FRAMEWORK-TEMPLATES.md) | Framework-specific standards |
| [SKILL.md](SKILL.md) | Pattern language (theory) |
| [canon/README.md](canon/README.md) | Complete master catalog |

---

## Directory Structure

```
claude-optimal/
├── README.md                    ← You are here
├── SKILL.md                     ← Pattern language (theory)
├── docs/
│   ├── COMPREHENSIVE-GUIDE.md   ← Full guide
│   ├── USER-GUIDE.md            ← Quick start
│   ├── PROFILES.md              ← Profiles + auto-invoke
│   ├── FLAGS.md                 ← Flag reference
│   ├── STRUCTURAL-STANDARDS.md  ← Code rules
│   ├── API-DESIGN-STANDARDS.md  ← API design
│   ├── FRAMEWORK-TEMPLATES.md   ← Framework idioms
│   └── case-studies/            ← Real examples
├── canon/                       ← 34 master skills
│   ├── README.md                ← Master catalog
│   ├── bloch/
│   ├── kernighan/
│   ├── procida/                 ← Documentation (Diátaxis)
│   ├── javascript/
│   │   ├── simpson/
│   │   ├── cherny/
│   │   ├── abramov/
│   │   └── dodds/
│   ├── angular/
│   ├── visualization/
│   ├── business/
│   └── ...
└── commands/
    └── doc-code/                ← /doc-code command
```

---

## The Core Insight

> **Claude knows best practices. It just doesn't apply them unless explicitly required.**

Canon provides the **lens** (whose perspective).
Standards provide the **rules** (what good looks like).
Flags provide the **triggers** (when to enforce).
Auto-invoke provides the **automation** (context-aware activation).

---

## Measuring Success

After one week:
- [ ] External reviewers finding fewer structural issues?
- [ ] Less time spent on review-fix-review cycles?
- [ ] New code matching existing patterns?

If still catching issues, add them to project anti-patterns.

---

*"The question that unlocks everything: Who has solved this before, and better than I could?"*
