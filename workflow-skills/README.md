# Workflow Skills

Universal workflow skills for Claude Code.

## Structure

```
workflow-skills/
├── ralph-loop/     # Top-level orchestrator
├── workflow/       # Multi-step processes (scan → fix → verify)
└── utils/          # Single-purpose tools (read-only scans, reports)
```

## Quick Reference

| Directory | Purpose | Modifies Code |
|-----------|---------|---------------|
| `ralph-loop/` | Autonomous PRD implementation | Yes |
| `workflow/` | Multi-phase processes | Yes |
| `utils/` | Read-only tools and reports | No |

## Usage

### Autonomous (Ralph orchestrates everything)

```bash
/ralph-loop PRD.md            # Run all phases per PRD item
/ralph-loop --max 30          # Limit iterations
/ralph-loop --resume          # Continue from last session
```

### Full Pipeline

```bash
/build user-auth             # New feature from scratch
/improve src/component.ts    # Quality pipeline on existing code
```

### Light Workflow

```bash
/quick-change add email field  # Simple change + cleanup
```

### Individual Skills

```bash
/gemini-review src/              # Scan and fix issues
/refactoring src/module.ts   # Refactor with verification
```

### Read-Only Analysis

```bash
/gemini-scan src/             # Report issues (no fixes)
/qodana-scan                  # Static analysis report
/dedupe-scan src/             # Find duplicates
```

## Installation

### Via lens (recommended)

```bash
lens profile apply javascript+ralph-integration .
```

### Manual

```bash
cp -r workflow-skills/* your-project/.claude/skills/
```

## Naming Conventions

| Suffix | Meaning | Location |
|--------|---------|----------|
| `-fix` | Modifies code, fixes issues | `workflow/` |
| `-scan` | Read-only, reports issues | `utils/` |
| `-review` | Analyzes (may or may not fix) | varies |
