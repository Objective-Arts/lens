---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Lens Documentation

> **Canon-Driven Development**: Quality built in from the start, not forced by review when it's too late.

## The Dual Workflow

Choose your path based on whether code exists:

| New Code Flow | Legacy Code Flow |
|---------------|------------------|
| PRD / Feature Request | Existing Codebase |
| `/create-plan` → `/structure-first` → `/implement-plan` | `/create-plan` → `/structure-first` → `/refactor-check-fix` |
| Skills: java, simplicity, security-mindset | Skills: legacy, test-strategy, resilience, abstraction |

Both flows converge at shared review gates: `/write-tests-run` → `/gemini-fix`

---

## Documentation Structure (Diátaxis Framework)

This documentation follows the Diátaxis framework, organizing content by purpose:

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
npm install -g @objective-arts/lens
export GEMINI_API_KEY="your-key"
lens profile apply javascript+react -p /path/to/project
```

See [Installation Reference](reference/installation.md) for complete setup guide.

---

## Tutorials (Learning-Oriented)

*For beginners learning the system step by step.*

| Tutorial | Description |
|----------|-------------|
| [Getting Started](tutorials/getting-started.md) | Your first Lens project |
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
| [Canon Catalog](reference/canon-catalog.md) | Complete list of skills by domain |
| [Canon Loading Strategy](reference/canon-loading-strategy.md) | How skills are detected and loaded |
| [Quality Flags](reference/flags.md) | All flags with parameters |
| [API Design Standards](reference/api-design-standards.md) | API design principles from java skill |
| [Framework Templates](reference/framework-templates.md) | D3, Angular, React, Node, Go, Java standards |
| [Structural Standards](reference/structural-standards.md) | Universal code quality rules |
| [Design Patterns](reference/patterns.md) | Canon Factory, Profile Builder, etc. |
| [Hooks](reference/hooks.md) | Pre-commit and quality gate hooks |
| [Sample CLAUDE.md](reference/sample-claude-md.md) | Example generated configuration |

### Key Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| workflow-phases.yaml | `config/workflow-phases.yaml` | 8-phase workflow with experts |
| keyword-detection.yaml | `config/keyword-detection.yaml` | Dynamic keyword-based expert detection |
| Profiles | `profiles/*.yaml` | Project type configurations |
| Canon Skills | `canon/*/SKILL.md` | Expert guidance content |

---

## Explanation (Understanding-Oriented)

*For understanding the system deeply.*

| Topic | Description |
|-------|-------------|
| [Why Expert Skills?](explanation/why-expert-skills.md) | The philosophy behind expert lenses |
| [Two-Tier Review Architecture](explanation/two-tier-review.md) | Self-review vs external validation |

---

## Quick Links

- **New to Lens?** Start with [Getting Started](tutorials/getting-started.md)
- **Setting up a project?** See [Apply a Profile](how-to/apply-profile.md)
- **Looking up a specific skill?** Check [Canon Catalog](reference/canon-catalog.md)
- **Building UI/UX?** Apply `frontend` profile for 12 UI/UX experts
- **Want to understand the philosophy?** Read [Why Expert Skills?](explanation/why-expert-skills.md)Let
