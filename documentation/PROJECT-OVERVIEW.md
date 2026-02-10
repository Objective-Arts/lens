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

- **clarity** — clear, simple code (Brian Kernighan)
- **security-mindset** — think like an attacker
- **react-state** — React mental models (Dan Abramov)
- **charts** — data visualization principles (Edward Tufte)
- **abstraction** — substitution and behavioral subtyping (Barbara Liskov)
- **75 canon skills total** across 30 categories

Quality enters at write-time, not review-time.

---

## How It Works

### 1. Skills

Each skill captures one expert's approach in a portable markdown file:

```
canon/
├── clarity/SKILL.md           # Clear, simple code
├── security/security-mindset/ # Think like an attacker
├── ui-ux/components/          # Atomic Design patterns
└── [72 more experts]
```

Skills install directly into projects (`.claude/skills/`). For the Lens project itself, symlinks point from `.claude/skills/` to `workflow-skills/` for dogfooding.

### 2. Profiles

14 composable profiles bundle skills for project types:

```bash
lens profile apply javascript+react+security
```

| Profile | What You Get |
|---------|--------------|
| `software-base` | 24 canon skills (10 Base Brain + security, testing, docs, engineering) |
| `typescript-cli` | +TypeScript, type-systems, JS internals, async |
| `javascript` | +TypeScript, React testing, JS internals, functional, UI/UX |
| `frontend` | +12 UI/UX skills (components, usability, design, visual, personas) |
| `security` | +Threat modeling, OWASP, AppSec, web-security |
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

### 4. Build/Improve Pipeline (12 Phases)

The `/build` and `/improve` commands run a 12-phase quality pipeline with machine gates between phases:

| # | Phase | Purpose |
|---|-------|---------|
| 1 | `create-plan` | Design approach, scope, files, risks |
| 2 | `structure-first` | Define data structures and interfaces |
| 3 | `implement-plan` | Write the code |
| 3.5 | *machine-gate* | `npm run build && npm test` |
| 4 | `refactor-check-fix` | Enforce constraints (30 lines/fn, 300 lines/file) |
| 5 | `dedupe-fix` | Consolidate duplicated code |
| 6 | `gemini-fix` | External code review via Gemini MCP |
| 7 | `qodana-fix` | Static analysis via Qodana MCP |
| 7.5 | *machine-gate* | `npm run build && npm test` |
| 8 | `adversarial-security-review` | Security audit (attacker mindset) |
| 9 | `write-tests-run` | Write and run tests |
| 10 | `ai-smell-fix` | Deep AI smell removal |
| 11 | `codex-fix` | Fast pattern scan + targeted fixes |
| 11.5 | *machine-gate* | `npm run build && npm test` |
| 12 | `write-tests-run` | Re-verify tests after cleanup |

Each phase must pass its gate marker before the next begins.

### 5. Five-Layer Enforcement

Lens enforces canon standards through five layers, each catching what the previous layers miss:

1. **Canon skills at write-time** — Base Brain + domain skills shape code as it's written
2. **Refactor/dedupe phases** — Structural cleanup and duplication removal
3. **External review** — Gemini MCP + Qodana static analysis
4. **Security + AI smell** — Adversarial review + antipattern removal
5. **Machine gates** — `npm run build && npm test` between phase groups

See `why-five-layers-wins.md` for competitive analysis and `canon-enforcement-map.md` for the mapping of all canon checks to enforcement layers.

### 6. Self-Learning Feedback Loop

Late phases (6-10) write lessons that early phases (1-5) read on future runs:

- `gemini-fix` discovers a shell injection → writes to lessons file
- Next run, `implement-plan` reads that lesson and avoids the same pattern

Two-tier knowledge:
- `workflow-skills/lessons.md` — universal patterns (travels with skills repo)
- `.claude/lessons.md` — project-specific instances (stays local)

### 7. Ralph Loop

Autonomous PRD-driven implementation:

```
/ralph-loop PRD.md
```

Ralph iterates through PRD items, running plan → build → refactor → test → review → doc phases per item. Each phase loads relevant canon skills from the profile's `ralph.skills` mapping. Up to 50 iterations with quality gates.

### 8. Workflow Skills (Freestanding)

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
| `/generate-docs` | Generate Diataxis documentation | Yes |
| `/build` | Build new feature (12 phases) | Yes |
| `/improve` | Improve existing code (12 phases) | Yes |
| `/quick-edit` | Simple changes (add field, rename) | Yes |
| `/quick-clean` | Fast AI smell cleanup | Yes |
| `/final-polish` | Final refinement for senior review | Yes |
| `/codex-fix` | Fast pattern scan + targeted fixes | Yes |

Use individually or let Ralph Loop orchestrate them automatically.

---

## Project Structure

```
lens/
├── canon/              # 75 canon skills in 30 categories
├── profiles/           # 14 composable project profiles
├── src/
│   ├── cli/            # Commands (profile, canon, mcp)
│   ├── ralph/          # Autonomous loop orchestrator
│   ├── canon/          # Skill loading and hashing
│   ├── profiles/       # Profile composition
│   ├── workflow/       # Workflow skill management
│   ├── scanner/        # Project configuration scanner
│   ├── utils/          # Shared utilities
│   ├── hooks/          # Git hooks
│   ├── tools/          # MCP tools
│   └── mcp/            # MCP server
├── workflow-skills/    # 29 workflow + utility skills
│   ├── workflow/       # 16 pipeline/edit skills
│   ├── utils/          # 12 read-only + utility skills
│   └── ralph-loop/     # Ralph orchestrator
├── documentation/      # Diataxis-organized docs
└── scripts/            # Quality gate scripts
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
|----------|-------|------------|
| Core (Base Brain) | 10 | clarity, simplicity, correctness, algorithms, abstraction, optimization |
| Design Patterns | 1 | design-patterns |
| Refactoring | 1 | refactoring |
| Security | 5 | security-mindset, owasp, appsec, web-security, threat-model |
| Testing | 3 | legacy, test-strategy, test-doubles |
| Engineering & Safety | 4 | safety, failure, resilience, style |
| Documentation | 1 | docs |
| Writing | 3 | brevity, prose, editing |
| JavaScript/TypeScript | 8 | react-state, js-safety, js-internals, typescript, functional, reactivity, js-perf, react-test |
| C# | 3 | csharp-depth, async, type-systems |
| Java | 1 | java |
| Python | 4 | python-advanced, python-idioms, python-protocols, python-patterns |
| Angular | 4 | angular-core, angular-perf, angular-arch, rxjs |
| Database | 2 | sql, sql-perf |
| UI/UX | 12 | components, usability, design, visual, personas, typography, motion, interaction, mobile, tokens, handoff, frontend-design |
| Visualization | 4 | d3, charts, dashboards, data-story |
| Business | 6 | management, competition, strategy, leadership, moats, platforms |
| Utility | 3 | code-scan, deadcode, implement |
| **Total** | **75** | |

---

## Design Principles

**Expertise at write-time.** Quality enters when code is written, not when it's reviewed. Catching problems early costs less.

**Composable, not monolithic.** Skills and profiles stack. Take what you need, leave what you don't.

**Portable and versioned.** Skills copy into projects as real files. Track versions, upgrade explicitly, preserve local edits.

**Autonomous but guided.** Ralph loop automates implementation, but expert skills guide each phase. Automation with wisdom.

**Five-layer validation.** Canon skills at write-time, structural cleanup, external review (Gemini + Qodana), security + AI smell audit, machine gates.

**Self-improving.** Late phases teach early phases. The system stops generating the same mistakes over time.

---

## Quick Start

```bash
# Install globally
npm install -g @objective-arts/lens

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
- `reference/` — Complete skill catalog, profile specs, hooks
- `explanation/` — Why expert skills, two-tier review, skill enforcement model
- `quality-gate-spec.md` — Machine gate specification
- `why-five-layers-wins.md` — Competitive analysis of five-layer enforcement
- `canon-enforcement-map.md` — All 418 canon checks mapped to enforcement layers
