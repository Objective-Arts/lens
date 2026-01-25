# cc-config Manual

**Claude Code Configuration Manager**

Version 0.1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Commands Reference](#commands-reference)
   - [scan](#scan)
   - [list](#list)
   - [show](#show)
   - [audit](#audit)
   - [tokens](#tokens)
   - [deps](#deps)
   - [profile](#profile)
   - [canon](#canon)
   - [mcp](#mcp)
5. [Profiles](#profiles)
6. [Canon Skills System](#canon-skills-system)
7. [MCP Server Management](#mcp-server-management)
8. [Configuration Files](#configuration-files)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

`cc-config` is a command-line tool for managing Claude Code configuration across projects. It provides:

- **Profile Management**: Apply composable configuration profiles to projects
- **Canon Skills**: Copy expert knowledge skills with version tracking and upgrades
- **MCP Server Registry**: Install and manage MCP servers
- **Configuration Scanning**: Audit and analyze Claude Code configuration
- **Token Analysis**: Track context window usage across configurations

### Key Design Principles

1. **Portability**: Skills are copied (not symlinked) so projects work standalone
2. **Explicit Upgrades**: Changes to source skills don't auto-propagate; upgrades are explicit
3. **Manifest Tracking**: All installed skills tracked with hashes for change detection
4. **Composable Profiles**: Combine multiple profiles with `+` syntax

---

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/your-org/claude-optimal.git
cd claude-optimal/cli

# Install dependencies
npm install

# Build
npm run build

# Link globally
npm link
```

### Verify Installation

```bash
cc-config --version
# Output: 0.1.0

cc-config --help
```

---

## Quick Start

### 1. Create a New Project with a Profile

```bash
mkdir my-java-project
cd my-java-project

# Apply the Java profile
cc-config profile apply java -p .
```

This creates:
- `.claude/skills/` - Copied skill files (bloch, kernighan, gang-of-four, liskov)
- `.claude/canon-manifest.json` - Manifest tracking installed skills
- `CLAUDE.md` - Configuration with standards, anti-patterns, and auto-invoke rules

### 2. Check Skill Status

```bash
cc-config canon status -p .
```

Output:
```
Canon Skills Status
Source: /path/to/canon-skills @ abc1234
────────────────────────────────────────────────────────────
  bloch                ✓ current (abc1234)
  gang-of-four         ✓ current (abc1234)
  kernighan            ✓ current (abc1234)
  liskov               ✓ current (abc1234)
```

### 3. Upgrade Skills When Source Updates

```bash
cc-config canon upgrade -p .
```

### 4. Scan Configuration

```bash
cc-config scan -p .
```

---

## Commands Reference

### scan

Scan and discover all Claude Code configuration in a project.

```bash
cc-config scan [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path to scan | Current directory |
| `--no-plugins` | Skip scanning plugins | false |

**Example:**
```bash
cc-config scan -p /path/to/project
```

**Output includes:**
- Configuration locations (global, project)
- Items by type (skills, commands, agents, memory, settings)
- Items by scope (global, project, plugin)
- Total token count
- Conflicts and missing references

---

### list

List configuration items with filtering and sorting.

```bash
cc-config list [type] [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `type` | Filter by type: skill, command, agent, memory, settings |

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | Current directory |
| `-s, --scope <scope>` | Filter by scope: global, project, plugin | All |
| `--tokens` | Sort by token count | false |

**Examples:**
```bash
# List all skills
cc-config list skill

# List project items sorted by tokens
cc-config list -p . -s project --tokens
```

---

### show

Show details of a specific configuration item.

```bash
cc-config show <name> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `name` | Name of the item to show |

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | Current directory |

**Example:**
```bash
cc-config show bloch -p .
```

**Output includes:**
- Type, scope, path
- Symlink status and target
- Token count and percentage
- Dependencies and references

---

### audit

Run a configuration audit with recommendations.

```bash
cc-config audit [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | Current directory |

**Example:**
```bash
cc-config audit -p .
```

**Output includes:**
- Claude-Optimal pattern checks (STRATEGY.md, base canon, security skills)
- Quality flags documentation check
- Conflicts between scopes
- Missing references
- Project skills summary by category
- CLAUDE.md analysis

---

### tokens

Show detailed token usage breakdown.

```bash
cc-config tokens [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | Current directory |

**Example:**
```bash
cc-config tokens -p .
```

**Output includes:**
- Total token count
- Breakdown by scope (global, project, plugin)
- Breakdown by type (skill, command, agent, etc.)
- Top 10 items by token count with visual bars

---

### deps

Show the dependency graph of configuration items.

```bash
cc-config deps [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | Current directory |

**Example:**
```bash
cc-config deps -p .
```

**Output includes:**
- CLAUDE.md auto-invoke rules with validation
- Skill references with existence check
- Items with dependencies showing depends-on and used-by relationships

---

### profile

Manage configuration profiles.

#### profile list

List all available profiles.

```bash
cc-config profile list
```

**Output:**
```
Available Profiles:

  java [composable]
    Domain canon for Java projects
    Skills: 4, Agents: 0
  javascript [composable]
    JavaScript/TypeScript expertise
    Skills: 3, Agents: 0
  angular [composable]
    Angular frontend
    Skills: 4, Agents: 2

Tip: Combine profiles with + syntax:
  cc-config profile apply base-tech+javascript+react /path/to/project
```

#### profile show

Show profile details. Supports `+` syntax to preview combined profiles.

```bash
cc-config profile show <name>
```

**Examples:**
```bash
# Show single profile
cc-config profile show java

# Preview combined profile
cc-config profile show javascript+angular
```

#### profile create

Create a new profile from template.

```bash
cc-config profile create <name>
```

**Example:**
```bash
cc-config profile create my-custom-profile
```

Creates profile at `~/.claude/profiles/my-custom-profile.yaml`

#### profile apply

Apply profile(s) to a project. Use `+` to combine profiles.

```bash
cc-config profile apply <profiles> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `profiles` | Profile name(s), use `+` to combine |

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | Current directory |
| `--dry-run` | Show what would be done | false |

**Examples:**
```bash
# Apply single profile
cc-config profile apply java -p /path/to/project

# Combine multiple profiles
cc-config profile apply javascript+angular -p .

# Preview without changes
cc-config profile apply java --dry-run -p .
```

**What gets created:**
- `.claude/` directory structure
- `.claude/skills/` with copied skill files
- `.claude/canon-manifest.json` tracking installed skills
- `CLAUDE.md` with standards, anti-patterns, and auto-invoke rules

---

### canon

Manage canon skills with the copy-with-manifest system.

#### canon list

List all available canon skills from source.

```bash
cc-config canon list [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--category <category>` | Filter by category | All |

**Example:**
```bash
cc-config canon list
cc-config canon list --category javascript
```

**Output:**
```
Available Canon Skills
Source: /path/to/canon-skills
Commit: abc1234
──────────────────────────────────────────────────

  JAVASCRIPT
    abramov
    cherny
    crockford
    dodds

  ANGULAR
    hevery
    kurata

  ROOT
    bloch
    kernighan
    gang-of-four

Total: 25 skills
```

#### canon status

Show installed skills vs source with status indicators.

```bash
cc-config canon status [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | Current directory |

**Status indicators:**
| Status | Icon | Meaning |
|--------|------|---------|
| current | ✓ | Installed matches source |
| outdated | ⚠ | Source has updates |
| modified | ✎ | Local changes detected |
| missing | ✗ | Source not found |

**Example:**
```bash
cc-config canon status -p .
```

**Output:**
```
Canon Skills Status
Source: /path/to/canon-skills @ def5678
────────────────────────────────────────────────────────────
  bloch                ✓ current (abc1234)
  cherny               ⚠ outdated (abc1234 → def5678)
  dodds                ✎ modified (abc1234)
  kernighan            ✓ current (abc1234)

Run 'cc-config canon upgrade -p .' to update 1 skill(s)
1 skill(s) have local modifications
```

#### canon install

Install a skill from canon source to project.

```bash
cc-config canon install <skill> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `skill` | Name of skill to install |

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | Current directory |
| `-f, --force` | Overwrite existing skill | false |

**Example:**
```bash
cc-config canon install bloch -p .
cc-config canon install cherny --force -p .
```

#### canon upgrade

Upgrade outdated skills from source. Preserves local modifications unless `--force`.

```bash
cc-config canon upgrade [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | Current directory |
| `-f, --force` | Overwrite even if locally modified | false |
| `-s, --skills <skills>` | Comma-separated list of specific skills | All |

**Examples:**
```bash
# Upgrade all outdated skills
cc-config canon upgrade -p .

# Force upgrade all (overwrites local changes)
cc-config canon upgrade --force -p .

# Upgrade specific skills
cc-config canon upgrade -s bloch,kernighan -p .
```

**Behavior:**
- Skips skills marked as "current"
- Skips locally modified skills (warns user)
- With `--force`, overwrites everything
- Updates manifest with new hashes

#### canon diff

Show differences between installed and source skill.

```bash
cc-config canon diff <skill> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `skill` | Name of skill to diff |

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | Current directory |

**Example:**
```bash
cc-config canon diff bloch -p .
```

#### canon source

Show canon source path and info.

```bash
cc-config canon source
```

**Output:**
```
Canon Source
──────────────────────────────────────────────────
Path:   /Users/you/local-tech-projects/canon-skills
Commit: abc1234
Remote: git@github.com:user/canon-skills.git
```

---

### mcp

Manage MCP server registry and installation.

#### mcp list

List servers in the registry or installed servers.

```bash
cc-config mcp list [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | Global |
| `--installed` | Show only installed servers | false |
| `--enabled` | Show only enabled servers | false |
| `--category <category>` | Filter by category | All |

**Examples:**
```bash
# List all servers in registry
cc-config mcp list

# List installed servers
cc-config mcp list --installed -p .

# List enabled servers
cc-config mcp list --enabled -p .

# Filter by category
cc-config mcp list --category development
```

#### mcp show

Show detailed server information.

```bash
cc-config mcp show <server> [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | Global |

**Example:**
```bash
cc-config mcp show linear -p .
```

**Output includes:**
- Server type, category, source
- Command and arguments
- Required environment variables with status
- Installation and enabled status

#### mcp install

Install a server from the registry.

```bash
cc-config mcp install <server> [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | Current directory |
| `--category <category>` | Install all servers in category | - |
| `--skip-env-check` | Skip environment variable validation | false |

**Examples:**
```bash
# Install single server
cc-config mcp install linear -p .

# Install all servers in a category
cc-config mcp install --category development -p .
```

#### mcp uninstall

Remove a server from `.mcp.json`.

```bash
cc-config mcp uninstall <server> [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | Current directory |

#### mcp enable

Add server to `enabledMcpjsonServers` in settings.json.

```bash
cc-config mcp enable <server> [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | Current directory |

#### mcp disable

Remove server from `enabledMcpjsonServers`.

```bash
cc-config mcp disable <server> [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | Current directory |

#### mcp check

Verify required environment variables are set.

```bash
cc-config mcp check [server] [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | Current directory |
| `--all` | Check all installed servers | false |

**Examples:**
```bash
# Check specific server
cc-config mcp check linear

# Check all installed servers
cc-config mcp check --all -p .
```

#### mcp add

Add a custom server to the registry.

```bash
cc-config mcp add <name> <command> [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-a, --args <args>` | Command arguments (comma-separated) | - |
| `-c, --category <category>` | Server category | other |
| `-d, --description <description>` | Server description | - |
| `-e, --env <env>` | Environment variables (KEY=${VAR} format) | - |
| `-r, --required-env <vars>` | Required env vars (comma-separated) | - |

**Example:**
```bash
cc-config mcp add my-server npx \
  -a "-y,@my/server" \
  -c development \
  -d "My custom server" \
  -r "API_KEY,SECRET"
```

---

## Profiles

Profiles are YAML files that define reusable configurations. They live in `~/.claude/profiles/`.

### Profile Structure

```yaml
name: java
description: Domain canon for Java projects
projectType: software
composable: true
extends: software-base

skills:
  security:
    - owasp
    - security-mindset
  tech:
    - ceremony
  canon:
    - bloch
    - kernighan
    - gang-of-four
    - liskov
  global:
    - understand-first

agents:
  - code-reviewer
  - security-auditor

commands:
  - viz/*

claudeMd:
  standards:
    - "Prefer static factory methods over constructors"
    - "Minimize mutability - make fields final"
    - "Favor composition over inheritance"

  antiPatterns:
    - "Mutable public fields"
    - "Returning null from collections"
    - "Raw types (use generics)"

  autoInvoke:
    - context: Java API design, collections, builders
      action: INVOKE `/bloch`
    - context: Code clarity, naming, readability
      action: INVOKE `/kernighan`

mcpServers:
  enable:
    - sequential-thinking
  disable:
    - unused-server
```

### Skill Categories

| Category | Path | Purpose |
|----------|------|---------|
| `security` | `~/.claude/skill-library/security/` | Security-focused skills |
| `tech` | `~/.claude/skill-library/tech/` | Technical workflow skills |
| `canon` | `~/local-tech-projects/canon-skills/` | Domain expert skills |
| `global` | `~/.claude/skills/` | General productivity skills |

### Combining Profiles

Use `+` syntax to combine multiple profiles:

```bash
cc-config profile apply javascript+angular+react -p .
```

Combined profiles merge:
- Skills (union, deduplicated)
- Agents (union, deduplicated)
- Commands (union, deduplicated)
- Standards (union, deduplicated)
- Anti-patterns (union, deduplicated)
- Auto-invoke rules (concatenated)
- MCP servers (union for enable, union for disable)

---

## Canon Skills System

The canon system provides versioned, portable skill management.

### How It Works

1. **Skills are copied**, not symlinked
2. A **manifest** (`canon-manifest.json`) tracks:
   - Source path and git commit
   - Hash of each installed skill
   - Installation timestamp
   - Modification status
3. **Upgrades are explicit** - run `canon upgrade`
4. **Local modifications preserved** unless `--force`

### Manifest Structure

```json
{
  "source": {
    "type": "local",
    "path": "/path/to/canon-skills",
    "gitRemote": "git@github.com:user/canon-skills.git"
  },
  "installedAt": "2025-01-22T17:44:00Z",
  "sourceCommit": "abc123",
  "skills": {
    "bloch": {
      "installedCommit": "abc123",
      "installedAt": "2025-01-22T17:44:00Z",
      "sourceFile": "bloch",
      "hash": "sha256:abcd1234...",
      "modified": false
    }
  }
}
```

### Upgrade Workflow

```bash
# Check what needs updating
cc-config canon status -p .

# See what changed in a skill
cc-config canon diff bloch -p .

# Upgrade (skips locally modified)
cc-config canon upgrade -p .

# Force upgrade (overwrites local changes)
cc-config canon upgrade --force -p .
```

### Portability

Because skills are copied (not symlinked):
- Projects work after `git clone` to a new machine
- No dependency on canon-skills source being present
- Safe to archive/share projects

---

## MCP Server Management

### Server Registry

Servers are defined in YAML files in `~/.claude/mcp-registry/`.

### Server Definition

```yaml
name: linear
description: Linear issue tracking integration
type: stdio
command: npx
args:
  - "-y"
  - "@anthropic/mcp-server-linear"
category: productivity
requiredEnv:
  - LINEAR_API_KEY
env:
  NODE_ENV: production
tags:
  - issues
  - project-management
```

### Categories

| Category | Description |
|----------|-------------|
| `development` | Development tools (git, build, test) |
| `productivity` | Productivity tools (linear, notion) |
| `data` | Data tools (databases, APIs) |
| `reasoning` | AI reasoning tools (sequential-thinking) |
| `automation` | Automation tools |
| `other` | Uncategorized |

### Installation Flow

1. `mcp install` adds server config to `.mcp.json`
2. `mcp enable` adds to `enabledMcpjsonServers` in settings.json
3. `mcp check` verifies required environment variables

---

## Configuration Files

### Project Structure

```
my-project/
├── .claude/
│   ├── skills/
│   │   ├── bloch/
│   │   │   └── SKILL.md
│   │   └── kernighan/
│   │       └── SKILL.md
│   ├── commands/
│   │   └── my-command.md
│   ├── settings.json
│   └── canon-manifest.json
├── .mcp.json
└── CLAUDE.md
```

### .mcp.json

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

### settings.json

```json
{
  "enabledMcpjsonServers": ["sequential-thinking"],
  "permissions": {
    "allow": ["Read", "Glob", "Grep"]
  }
}
```

### CLAUDE.md

Generated by profile apply, contains:
- Profile name
- Standards (coding guidelines)
- Anti-patterns (what to avoid)
- Auto-invoke rules (skill triggers)

---

## Best Practices

### 1. Use Composable Profiles

Create focused profiles and combine them:
```bash
cc-config profile apply base-tech+java+spring -p .
```

### 2. Check Status Before Upgrading

```bash
cc-config canon status -p .
cc-config canon diff <skill> -p .  # If needed
cc-config canon upgrade -p .
```

### 3. Audit Regularly

```bash
cc-config audit -p .
```

Look for:
- Missing references
- Unused skills
- Token budget issues

### 4. Version Control the Manifest

Include `.claude/canon-manifest.json` in git to track skill versions.

### 5. Document Customizations

If you modify copied skills, add comments explaining why.

---

## Troubleshooting

### "Skill not found" Error

Check:
1. Skill exists in canon source: `cc-config canon list`
2. Canon source path is correct: `cc-config canon source`
3. Skill has SKILL.md file

### "Profile not found" Error

Check:
1. Profile exists: `cc-config profile list`
2. Profile file is valid YAML
3. Profile is in `~/.claude/profiles/`

### Skills Show as "outdated" After Fresh Install

This can happen if:
1. Canon source was updated after install
2. Git commit changed but content didn't

Run `cc-config canon upgrade -p .` to sync.

### MCP Server Won't Enable

Check:
1. Server is installed: `cc-config mcp list --installed`
2. Required env vars set: `cc-config mcp check <server>`
3. `.mcp.json` exists in project

### High Token Count

Use `cc-config tokens -p .` to identify large items.

Consider:
- Moving large skills to global scope
- Removing unused skills
- Splitting large skills

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CANON_SKILLS_PATH` | Override canon skills source path | `~/local-tech-projects/canon-skills` |

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |

---

## See Also

- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [MCP Server Protocol](https://modelcontextprotocol.io)

---

*Generated for cc-config v0.1.0*
