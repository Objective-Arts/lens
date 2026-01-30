# Claude-Optimal Documentation

> **Canon-Driven Development**: Quality built in from the start, not forced by review when it's too late.

## The Dual Workflow

Choose your path based on whether code exists:

| New Code Flow | Legacy Code Flow |
|---------------|------------------|
| PRD / Feature Request | Existing Codebase |
| `/plan` → `/structure-first` → `/build-from-plan` | `/plan` → `/structure-first` → `/refactor-clean` |
| Canon: Bloch, Pike, Schneier, Evans | Canon: Feathers, Fowler, Taleb, Liskov |

Both flows converge at shared review gates: `/test` → `/review-hard`

**[Interactive Diagram](flow-guide.html)**

---

## Documentation Structure (Diátaxis Framework)

This documentation follows Daniele Procida's Diátaxis framework, organizing content by purpose:

```
                PRACTICAL                      THEORETICAL
                (doing)                        (understanding)
          ┌─────────────────────────────┬─────────────────────────────┐
LEARNING  │                             │                             │
(acquiring│         TUTORIALS           │        EXPLANATION          │
          │    "Follow along to learn"  │   "Understand why it works" │
          │                             │                             │
          ├─────────────────────────────┼─────────────────────────────┤
WORKING   │                             │                             │
(applying)│         HOW-TO              │        REFERENCE            │
          │    "Steps to accomplish X"  │   "Complete specifications" │
          │                             │                             │
          └─────────────────────────────┴─────────────────────────────┘
```

---

## Installation

*Start here if you're new.*

**Quick Start**:
```bash
npm install -g ./cc-config-0.1.0.tgz
export GEMINI_API_KEY="your-key"
cc-config profile apply javascript+react -p /path/to/project
```

See [Installation Reference](reference/installation.md) for complete setup guide.

---

## Tutorials (Learning-Oriented)

*For beginners learning the system step by step.*

| Tutorial | Description |
|----------|-------------|
| [Getting Started](tutorials/getting-started.md) | Your first Claude-Optimal project |
| [Adding a Canon Skill](tutorials/adding-canon-skill.md) | Create your first expert lens |
| [Running Ralph Loop](tutorials/ralph-loop-basics.md) | Autonomous development with PRDs |

---

## How-To Guides (Task-Oriented)

*For accomplishing specific tasks.*

### Setup & Configuration
| Guide | Description |
|-------|-------------|
| [Apply a Profile](how-to/apply-profile.md) | Configure a project with a profile |
| [Configure Ralph Loop](how-to/configure-ralph-loop.md) | Set up autonomous iteration |

### Development Workflows
| Guide | Description |
|-------|-------------|
| [Use Quality Flags](how-to/use-quality-flags.md) | --test, --review-hard, --plan |
| [Set Up External Validation](how-to/external-validation.md) | Gemini and Qodana integration |

---

## Reference (Information-Oriented)

*Complete specifications for lookup.*

| Reference | Description |
|-----------|-------------|
| [Installation](reference/installation.md) | System requirements, API keys, troubleshooting |
| [Profiles](reference/profiles.md) | All available profiles and composition |
| [Canon Catalog](reference/canon-catalog.md) | Complete list of masters by domain |
| [Canon Loading Strategy](reference/canon-loading-strategy.md) | How skills are detected and loaded |
| [Quality Flags](reference/flags.md) | All flags with parameters |
| [API Design Standards](reference/api-design-standards.md) | Bloch-style API design principles |
| [Framework Templates](reference/framework-templates.md) | D3, Angular, React, Node, Go, Java standards |
| [Structural Standards](reference/structural-standards.md) | Universal code quality rules |
| [Design Patterns](reference/patterns.md) | Canon Factory, Profile Builder, etc. |
| [Hooks](reference/hooks.md) | Pre-commit and quality gate hooks |
| [Sample CLAUDE.md](reference/sample-claude-md.md) | Example generated configuration |

### Key Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| skill-rules.yaml | `config/skill-rules.yaml` | Skill detection for Ralph + workflows |
| Profiles | `profiles/*.yaml` | Project type configurations |
| Canon Skills | `canon/*/SKILL.md` | Expert guidance content |

---

## Explanation (Understanding-Oriented)

*For understanding the system deeply.*

| Topic | Description |
|-------|-------------|
| [Why Canon Masters?](explanation/why-canon-masters.md) | The philosophy behind expert lenses |
| [Two-Tier Review Architecture](explanation/two-tier-review.md) | Self-review vs external validation |

---

## Quick Links

- **New to Claude-Optimal?** Start with [Getting Started](tutorials/getting-started.md)
- **Setting up a project?** See [Apply a Profile](how-to/apply-profile.md)
- **Looking up a specific master?** Check [Canon Catalog](reference/canon-catalog.md)
- **Building UI/UX?** Apply `frontend` profile for 12 UI/UX experts
- **Want to understand the philosophy?** Read [Why Canon Masters?](explanation/why-canon-masters.md)
