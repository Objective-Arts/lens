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
| [Use the Build/Improve Pipeline](how-to/use-quality-flags.md) | /build, /improve, and individual phase skills |
| [Set Up External Validation](how-to/external-validation.md) | Gemini and Qodana integration |

---

## Reference (Information-Oriented)

*Complete specifications for lookup.*

| Reference | Description |
|-----------|-------------|
| [Installation](reference/installation.md) | System requirements, API keys, troubleshooting |
| [Use Cases](reference/use-cases.md) | All use cases with implementation code |
| [Hooks](reference/hooks.md) | Pre-commit and quality gate hooks |
| [AI Smell Index](reference/ai-smell-index.md) | Measuring AI-generated code patterns |

### Key Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| workflow-phases.yaml | `config/workflow-phases.yaml` | 11-phase workflow with experts |
| keyword-detection.yaml | `config/keyword-detection.yaml` | Dynamic keyword-based expert detection |
| Profiles | `profiles/*.yaml` | Project type configurations |
| Canon Skills | `canon/*/SKILL.md` | Expert guidance content |

---

## Explanation (Understanding-Oriented)

*For understanding the system deeply.*

| Topic | Description |
|-------|-------------|
| [Why Expert Skills?](explanation/why-expert-skills.md) | The philosophy behind expert lenses |
| [How Skills Get Loaded](explanation/how-skills-load.md) | The 4-layer loading system and Base Brain |
| [Skill Enforcement Model](explanation/skill-enforcement-model.md) | How skills become hard gates, not suggestions |
| [Two-Tier Review Architecture](explanation/two-tier-review.md) | Self-review vs external validation |
| [Why Five Layers Wins](why-five-layers-wins.md) | Competitive analysis of five-layer enforcement |
| [Quality Building Flow](explanation/quality-building-flow.md) | How the 11-phase pipeline, contracts, and lessons work together |
| [Quality Gate Spec](quality-gate-spec.md) | Machine gate specification |

---

## Quick Links

- **New to Lens?** Start with [Getting Started](tutorials/getting-started.md)
- **Setting up a project?** See [Apply a Profile](how-to/apply-profile.md)
- **Building UI/UX?** Apply `frontend` profile for 12 UI/UX experts
- **Want to understand the philosophy?** Read [Why Expert Skills?](explanation/why-expert-skills.md)
