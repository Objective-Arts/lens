# Configuration Files Reference

File formats and locations for all configuration.

---

## Directory Structure

### Global Configuration

```
~/.claude/
├── CLAUDE.md              # Global standards
├── settings.json          # Claude Code settings
├── settings.local.json    # Local overrides (gitignored)
├── .mcp.json              # MCP server configuration
├── skills/                # Global custom skills
├── commands/              # Global custom commands
├── agents/                # Global custom agents
├── profiles/              # User-defined profiles
└── skill-library/
    ├── security/          # Security skills
    └── tech/              # Tech workflow skills
```

### Project Configuration

```
project/
├── CLAUDE.md              # Project standards (overrides global)
├── CLAUDE.local.md        # Local project overrides (gitignored)
├── .claude/
│   ├── skills/            # Project skills
│   ├── commands/          # Project commands
│   ├── agents/            # Project agents
│   ├── settings.json      # Project settings
│   ├── settings.local.json
│   ├── canon-manifest.json    # Skill version tracking
│   ├── workflow-manifest.json # Workflow version tracking
│   ├── ralph-config.yaml      # Ralph configuration
│   ├── plans/             # Saved plans
│   └── logs/              # Ralph logs
└── .mcp.json              # Project MCP config
```

---

## CLAUDE.md

Markdown file with standards and auto-invoke rules.

### Format

```markdown
# Project Name

## Standards

- Use const by default
- Prefer async/await over promises

## Anti-Patterns

- Avoid var declarations
- No implicit type coercion

## Auto-Invoke Skills

| Context | Action |
|---------|--------|
| Writing tests | INVOKE /meszaros |
| React components | INVOKE /abramov then /frost |
```

### Auto-Invoke Table

The table format is parsed by cc-config:

```markdown
| Context | Action |
|---------|--------|
| <trigger text> | INVOKE /<skill> [then /<skill2>] |
```

---

## settings.json

Claude Code settings.

### Format

```json
{
  "model": "claude-sonnet-4-20250514",
  "permissions": {
    "allow": ["Read", "Glob", "Grep"],
    "deny": ["Bash"],
    "defaultMode": "askEveryTime"
  },
  "mcpServers": {
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic/sequential-thinking"]
    }
  },
  "env": {
    "NODE_ENV": "development"
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run format"
          }
        ]
      }
    ]
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `model` | string | Claude model to use |
| `permissions.allow` | string[] | Always-allowed tools |
| `permissions.deny` | string[] | Always-denied tools |
| `permissions.defaultMode` | string | Default permission mode |
| `mcpServers` | object | MCP server configurations |
| `env` | object | Environment variables |
| `hooks` | object | Hook configurations |

---

## canon-manifest.json

Tracks installed skill versions.

### Format

```json
{
  "version": 1,
  "source": {
    "type": "git",
    "path": "/path/to/canon",
    "commit": "abc123"
  },
  "skills": {
    "kernighan": {
      "installedCommit": "abc123",
      "hash": "sha256...",
      "modified": false
    },
    "pike": {
      "installedCommit": "abc123",
      "hash": "sha256...",
      "modified": true
    }
  }
}
```

### Skill Status

| Field | Meaning |
|-------|---------|
| `installedCommit` | Git commit when installed |
| `hash` | SHA-256 of skill content |
| `modified` | User changed since install |

---

## ralph-config.yaml

Ralph loop configuration.

### Format

```yaml
settings:
  maxIterations: 50
  maxIterationsPerItem: 10
  exitOnIdleCommits: 3
  checkpointEvery: 5

skills:
  plan:
    - dijkstra
    - liskov
  build:
    - cherny
  test:
    - meszaros

quality_gates:
  tests_required: true
  test_level: unit
  review_required: true
  review_threshold: no_critical

post_loop_validation:
  enabled: true
  gemini: true
  qodana: true
  action: report
  findings_file: .claude/findings.json
  promote_threshold: 0

exit_criteria:
  prd_items_complete: all
  tests_passing: required
  review_issues_critical: 0
```

### Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxIterations` | number | 50 | Total iteration limit |
| `maxIterationsPerItem` | number | 10 | Per-item limit |
| `exitOnIdleCommits` | number | 3 | Exit after N commits with no progress |
| `checkpointEvery` | number | 5 | Save checkpoint every N items |

### Quality Gates

| Field | Values | Description |
|-------|--------|-------------|
| `tests_required` | boolean | Must have tests |
| `test_level` | unit, integration, e2e | Minimum test level |
| `review_required` | boolean | Must pass review |
| `review_mode` | self, full | Review type |
| `review_threshold` | no_critical, no_high, clean | Max severity allowed |

---

## .mcp.json

MCP server configuration.

### Format

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic/sequential-thinking"]
    },
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic/memory-server"],
      "env": {
        "MEMORY_PATH": ".claude/memory"
      }
    }
  }
}
```

### Server Definition

| Field | Type | Description |
|-------|------|-------------|
| `type` | "stdio" \| "http" | Connection type |
| `command` | string | Command to run |
| `args` | string[] | Command arguments |
| `env` | object | Environment variables |

---

## Skill Files

Skills are directories containing SKILL.md:

```
skills/
└── kernighan/
    └── SKILL.md
```

### SKILL.md Format

```markdown
---
name: kernighan
description: "Kernighan's clarity and simplicity"
---

# Brian Kernighan: Clarity and Simplicity

Apply Kernighan's principles...

## Core Philosophy

> "Debugging is twice as hard as writing the code..."

## Rules

1. Write clearly
2. Avoid cleverness
...
```

### Frontmatter Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Skill identifier |
| `description` | string | Brief description |
