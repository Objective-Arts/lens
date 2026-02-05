---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Lens

> Embed domain expertise into Claude Code workflows.

## The Problem

Claude Code is powerful but generic. It lacks the specialized knowledge that experienced developers carry—the hard-won wisdom from debugging production systems, shipping secure code, and learning from masters in the field.

## The Solution

Lens distills expertise from renowned engineers into composable "skills" that Claude applies during development. Instead of generic guidance, you get expert wisdom from:

- **clarity** — clear, simple code
- **security-mindset** — think like an attacker
- **react-state** — React mental models
- **charts** — data visualization principles
- **abstraction** — substitution and behavioral subtyping
- **73 domain skills total**

Quality enters at write-time, not review-time.

---

## How It Works

### 1. Skills

Each skill captures one expert's approach in a portable markdown file:

```
canon/
├── clarity/SKILL.md      # Clear, simple code
├── security-mindset/     # Think like an attacker
├── components/           # Atomic Design patterns
└── [70 more experts]
```

Skills install directly into projects (`.claude/skills/`). No symlinks, no remote dependencies.

### 2. Profiles

Profiles compose skills for project types:

```bash
lens profile apply javascript+react+security
```

| Profile | What You Get |
|---------|--------------|
| `software-base` | 32 core skills (clarity, testing, security, docs) |
| `javascript` | +TypeScript, React testing, JS internals |
| `frontend` | +12 UI/UX skills (components, usability, design, visual) |
| `security` | +Threat modeling, OWASP, AppSec |
| `python` | +python-advanced, python-idioms, python-protocols, python-patterns |

Profiles stack with `+` syntax. Each adds expertise without duplication.

### 3. Auto-Invoke

Skills activate based on context:

```yaml
# CLAUDE.md
autoInvoke:
  - context: "Security-sensitive code (auth, input)"
    action: "INVOKE /security-mindset then /owasp"
  - context: "React components"
    action: "INVOKE /react-state"
```

Or invoke directly: `/clarity`, `/security-mindset`, `/charts`

### 4. Ralph Loop

Autonomous implementation with expertise at each phase:

```
/ralph-loop PRD.md
```

| Phase | Skills Loaded |
|-------|---------------|
| Plan | clarity, simplicity, data-first |
| Structure | abstraction, design-patterns |
| Implement | pragmatism, composition |
| Refactor | legacy, style |
| Review | Gemini (external validation) |
| Static Analysis | Qodana |
| Test | test-doubles, test-strategy |
| Document | docs, brevity |

Each phase loads relevant skills. Keywords in requirements trigger additional experts (e.g., "auth" loads security skills).

### 5. Workflow Skills (Freestanding)

Interactive skills for quality control:

| Skill | Purpose | Modifies Code |
|-------|---------|---------------|
| `/create-plan` | Design approach before coding | No |
| `/structure-first` | Map architecture or create types | Yes |
| `/implement-plan` | Implement code from plan | Yes |
| `/refactor-check-fix` | Systematic code cleanup | Yes |
| `/ai-smell-fix` | Remove AI-generated code patterns | Yes |
| `/dedupe-fix` | Consolidate duplicated code | Yes |
| `/gemini-scan` | Read-only Gemini review | No |
| `/gemini-fix` | Gemini review with fixes | Yes |
| `/qodana-scan` | Read-only static analysis | No |
| `/qodana-fix` | Static analysis with fixes | Yes |
| `/ai-smell-scan` | Detect AI code smells | No |
| `/write-tests-run` | Write and run tests | Yes |
| `/generate-docs` | Generate Diátaxis documentation | Yes |
| `/phase-loop` | Run 9 quality phases with rollback | Yes |
| `/final-polish` | Final refinement for senior review | Yes |

Use individually or let Ralph Loop orchestrate them automatically.

---

## Project Structure

```
lens/
├── canon/              # 73 expert skills in 27 categories
├── profiles/           # 16 composable project profiles
├── cli/                # lens CLI implementation
│   └── src/
│       ├── cli/        # Commands (profile, canon, mcp)
│       ├── ralph/      # 10-phase workflow loop
│       ├── canon/      # Skill loading
│       └── profiles/   # Profile composition
├── documentation/      # Diátaxis-organized docs
└── config/             # Workflow and keyword detection
```

## CLI Commands

```bash
# Profiles
lens profile list              # Show available profiles
lens profile apply python+sql  # Configure project

# Canon
lens canon list                # Show all skills
lens canon deploy clarity      # Install single skill
lens canon status              # Compare versions

# Workflow
lens workflow install          # Install workflow skills

# Scan
lens scan                      # Discover all configuration
```

---

## Skill Categories

| Category | Count | Key Skills |
|----------|--------|---------|
| Core | 12 | clarity, simplicity, correctness, algorithms, abstraction |
| JavaScript | 8 | react-state, js-safety, js-internals, typescript |
| Security | 5 | security-mindset, owasp, appsec, web-security |
| Testing | 3 | legacy, test-strategy, test-doubles |
| UI/UX | 12 | components, usability, design, visual, personas |
| Visualization | 4 | d3, charts, dashboards, data-story |
| Python | 4 | python-advanced, python-idioms, python-protocols, python-patterns |
| Writing | 4 | docs, brevity, prose, editing |
| Engineering | 3 | safety, failure, resilience |
| Angular | 4 | angular-core, angular-perf, angular-arch, rxjs |
| Database | 2 | sql, sql-perf |
| Business | 6 | management, competition, strategy, leadership |

---

## Design Principles

**Expertise at write-time.** Quality enters when code is written, not when it's reviewed. Catching problems early costs less.

**Composable, not monolithic.** Skills and profiles stack. Take what you need, leave what you don't.

**Portable and versioned.** Skills copy into projects as real files. Track versions, upgrade explicitly, preserve local edits.

**Autonomous but guided.** Ralph loop automates implementation, but expert skills guide each phase. Automation with wisdom.

**Multi-layer validation.** Claude's self-review, Gemini's independent review, Qodana's static analysis, your final approval.

---

## Quick Start

```bash
# Install globally
npm install -g lens

# Configure a project
cd /your/project
lens profile apply javascript+security

# Check what's installed
lens scan

# Use skills directly
# (in Claude Code session)
/clarity           # Load clarity skill
/security-mindset  # Load security mindset

# Run autonomous loop
/ralph-loop requirements.md
```

---

## Further Reading

- `tutorials/` — Getting started, first skill, first Ralph run
- `how-to/` — Apply profiles, configure workflow, use quality flags
- `reference/` — Complete skill catalog, profile specs, API standards
- `explanation/` — Why expert skills, two-tier review architecture
