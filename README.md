# Lens

> Embed domain expertise into Claude Code workflows.

**@objective-arts/lens** v0.2.0

Lens distills expertise from renowned engineers into composable "skills" that Claude applies during development. Quality enters at write-time, not review-time.

## What It Does

- **75 canon skills** across 30 categories — from clarity (Kernighan) to security-mindset to React state management (Abramov) to data visualization (Tufte)
- **14 composable profiles** — bundle skills for project types (`javascript+react+security`)
- **8-phase pipeline** (plan → structure → implementation → refactoring → deduplication → review → testing → evaluation) with learning loop and machine gates
- **Ralph loop** — autonomous PRD-driven implementation with expert guidance at each phase
- **Self-learning feedback** — late phases write lessons that early phases read on future runs

## Quick Start

```bash
# Install globally
npm install -g @objective-arts/lens

# Configure a project
cd /your/project
lens profile apply javascript+security

# Check what's installed
lens scan

# Use skills directly (in Claude Code)
/clarity           # Load clarity skill
/security-mindset  # Load security mindset

# Build a feature through the full pipeline
/build src/feature

# Run autonomous PRD implementation
/ralph-loop requirements.md
```

## CLI Entry Points

| Command | Purpose |
|---------|---------|
| `lens` | Profile management, canon skills, scanning, workflow |
| `ralph` | Autonomous PRD implementation loop |
| `lens-reset` | Reset configuration to defaults |

## Key Commands

```bash
lens profile list              # Show available profiles
lens profile apply python+sql  # Configure project
lens canon list                # Show all 75 skills
lens canon deploy clarity      # Install a skill
lens canon status              # Compare installed vs source
lens workflow install           # Install workflow skills
lens scan                      # Discover all configuration
```

## Project Structure

```
lens/
├── canon/              # 75 canon skills in 30 categories
├── profiles/           # 14 composable project profiles
├── src/                # TypeScript source
│   ├── cli/            # CLI commands
│   ├── ralph/          # Autonomous loop orchestrator
│   ├── canon/          # Skill loading and hashing
│   ├── profiles/       # Profile composition
│   ├── workflow/       # Workflow skill management
│   ├── scanner/        # Project configuration scanner
│   └── utils/          # Shared utilities
├── workflow-skills/    # 29 workflow + utility skills
│   ├── workflow/       # 16 pipeline/edit skills
│   ├── utils/          # 12 read-only + utility skills
│   └── ralph-loop/     # Ralph orchestrator
├── documentation/      # Diataxis-organized docs
└── scripts/            # Quality gate scripts
```

## Documentation

Full documentation at [documentation/index.md](documentation/index.md).

| Section | Contents |
|---------|----------|
| [Project Overview](documentation/PROJECT-OVERVIEW.md) | Architecture, design principles, skill catalog |
| [Tutorials](documentation/tutorials/) | Getting started, adding skills, first Ralph run |
| [How-To Guides](documentation/how-to/) | Apply profiles, configure workflow, external validation |
| [Reference](documentation/reference/) | Installation, profiles, hooks, canon catalog |
| [Explanation](documentation/explanation/) | Why expert skills, two-tier review, skill enforcement |
| [Developer Guide](documentation/DEVELOPER-GUIDE.md) | Contributing to the Lens codebase |

## License

Proprietary — Objective Arts LLC. See [LICENSE](LICENSE).
