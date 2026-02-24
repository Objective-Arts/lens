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
| `/plan` → `/structure` → `/implementation` | `/plan` → `/structure` → `/refactoring` |
| Skills: java, simplicity, security-mindset | Skills: legacy, test-strategy, resilience, abstraction |

Both flows converge at shared review gates: `/testing` → `/gemini-review`

---

## Documentation Structure (Diataxis Framework)

This documentation follows the Diataxis framework, organizing content by purpose:

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

---

## How-To Guides (Task-Oriented)

*For accomplishing specific tasks.*

### Setup & Configuration
| Guide | Description |
|-------|-------------|
| [Apply a Profile](how-to/apply-profile.md) | Configure a project with a profile |

### Development Workflows
| Guide | Description |
|-------|-------------|
| [Set Up External Validation](how-to/external-validation.md) | Gemini and Qodana integration |

---

## Reference (Information-Oriented)

*Complete specifications for lookup.*

| Reference | Description |
|-----------|-------------|
| [Installation](reference/installation.md) | System requirements, API keys, troubleshooting |
| [Hooks](reference/hooks.md) | Pre-commit and quality gate hooks |
| [AI Smell Index](reference/ai-smell-index.md) | Measuring AI-generated code patterns |

### Key Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| Profiles | `profiles/*.yaml` | Project type configurations |
| Canon Skills | `canon/*/SKILL.md` | Expert guidance content |
| Rubrics | `workflow-skills/rubric/*.md` | Quality criteria for pipeline phases |

---

## Explanation (Understanding-Oriented)

*For understanding the system deeply.*

| Topic | Description |
|-------|-------------|
| [Why Expert Skills?](explanation/why-expert-skills.md) | The philosophy behind expert lenses |
| [How the Pipeline Works](explanation/how-the-pipeline-works.md) | The 8-phase pipeline, skills, contracts, lessons, and review model |
| [Skill Enforcement Model](explanation/skill-enforcement-model.md) | How skills become hard gates, not suggestions |
| [Two-Tier Review Architecture](explanation/two-tier-review.md) | Self-review vs external validation |
| [Why Five Layers Wins](why-five-layers-wins.md) | Competitive analysis of five-layer enforcement |
| [Quality Gate Spec](quality-gate-spec.md) | Machine gate specification |

---

## Quick Links

- **New to Lens?** Start with [Getting Started](tutorials/getting-started.md)
- **Setting up a project?** See [Apply a Profile](how-to/apply-profile.md)
- **Building UI/UX?** Apply `frontend` profile for 12 UI/UX experts
- **Want to understand the philosophy?** Read [Why Expert Skills?](explanation/why-expert-skills.md)
