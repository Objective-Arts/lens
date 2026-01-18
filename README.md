# Claude-Optimal

A configuration methodology for getting consistently high-quality code from Claude Code.

**Start here:** [USER-GUIDE.md](USER-GUIDE.md)

---

## The Problem

Claude produces working code that fails expert review: 150-line functions, mixed patterns, calculations in render logic.

## The Solution

Three components that make quality requirements explicit:

| Component | Purpose | File |
|-----------|---------|------|
| **Profiles** | Which skills for which project type | [PROFILES.md](PROFILES.md) |
| **Standards** | What good code looks like | [STRUCTURAL-STANDARDS.md](STRUCTURAL-STANDARDS.md) |
| **Flags** | How to enforce structure at runtime | [FLAGS.md](FLAGS.md) |

## Quick Start

```bash
# 1. Apply a profile
cc-config profile apply base-tech+javascript+react -p /path/to/project

# 2. Copy framework standards to your CLAUDE.md
# (see FRAMEWORK-TEMPLATES.md)

# 3. Use flags when working
> Build the feature --structure-first
```

## Documentation

| Document | Description |
|----------|-------------|
| **[USER-GUIDE.md](USER-GUIDE.md)** | Complete guide - start here |
| [PROFILES.md](PROFILES.md) | Profile catalog and combinations |
| [STRUCTURAL-STANDARDS.md](STRUCTURAL-STANDARDS.md) | Universal code quality rules |
| [FRAMEWORK-TEMPLATES.md](FRAMEWORK-TEMPLATES.md) | D3, Angular, React, Node, Go, Java standards |
| [FLAGS.md](FLAGS.md) | Quality flag reference |
| [SKILL.md](SKILL.md) | Pattern language (theory) |
| [PATTERNS.md](PATTERNS.md) | GoF-style patterns (theory) |
| [primitive-picker.md](primitive-picker.md) | Decision tree for Claude Code primitives |

## Installation

```bash
# Link to global skills
ln -s /path/to/claude-optimal ~/.claude/skills/claude-optimal

# Invoke when setting up projects
> /claude-optimal
```

---

> **The Core Insight**: Claude knows best practices. It just doesn't apply them unless explicitly required.
