# cc-config Usage Guide

Standalone CLI usage for managing Claude Code configuration.

---

## Prerequisites

- cc-config installed (`npm link` from cli/)
- Project directory to configure

---

## Setting Up a New Project

### Apply a Profile

```bash
cc-config profile apply <profile> -p /path/to/project
```

**Examples:**
```bash
# Single profile
cc-config profile apply java -p .

# Combined profiles (use + to merge)
cc-config profile apply javascript+react -p .
cc-config profile apply software-base+python -p .

# Preview without making changes
cc-config profile apply java --dry-run -p .
```

**What gets created:**
```
project/
├── .claude/
│   ├── skills/           # Copied skill files
│   ├── canon-manifest.json
│   └── settings.json
└── CLAUDE.md             # Standards and auto-invoke rules
```

### List Available Profiles

```bash
cc-config profile list
```

### Preview a Profile

```bash
cc-config profile show java
cc-config profile show javascript+angular   # Preview combined
```

---

## Managing Canon Skills

### Check Skill Status

```bash
cc-config canon status -p .
```

**Status indicators:**
| Icon | Meaning |
|------|---------|
| ✓ current | Matches source |
| ⚠ outdated | Source updated |
| ✎ modified | Local changes |
| ✗ missing | Not in source |

### Install a Skill

```bash
cc-config canon install <skill> -p .
cc-config canon install bloch -p .
cc-config canon install bloch --force -p .   # Overwrite existing
```

### Upgrade Outdated Skills

```bash
# Upgrade all (skips locally modified)
cc-config canon upgrade -p .

# Force upgrade (overwrites local changes)
cc-config canon upgrade --force -p .

# Upgrade specific skills only
cc-config canon upgrade -s bloch,kernighan -p .
```

### View Skill Diff

```bash
cc-config canon diff <skill> -p .
cc-config canon diff bloch -p .
```

### Deploy All Canon Skills

```bash
cc-config canon deploy -p .
cc-config canon deploy --force -p .   # Overwrite existing
```

### List Available Skills

```bash
cc-config canon list
cc-config canon list --category javascript
```

### Check Source Location

```bash
cc-config canon source
```

---

## Managing Workflow Skills

### List Workflow Skills

```bash
cc-config workflow list
```

### Install Workflow Skills

```bash
# Install one skill
cc-config workflow install structure-first -p .

# Install all workflow skills
cc-config workflow install --all -p .
cc-config workflow install --all --force -p .
```

### Check Workflow Status

```bash
cc-config workflow status -p .
```

### Upgrade Workflow Skills

```bash
cc-config workflow upgrade -p .
cc-config workflow upgrade --force -p .
```

---

## Managing MCP Servers

### List Registry

```bash
cc-config mcp list                          # All registry servers
cc-config mcp list --category reasoning     # Filter by category
cc-config mcp list --installed -p .         # Installed in project
cc-config mcp list --enabled -p .           # Enabled in project
```

### View Server Details

```bash
cc-config mcp show <server>
cc-config mcp show sequential-thinking
```

### Install a Server

```bash
cc-config mcp install <server> -p .
cc-config mcp install linear -p .
cc-config mcp install --category reasoning -p .   # Install category
cc-config mcp install linear --skip-env-check -p .
```

### Enable/Disable Servers

```bash
cc-config mcp enable <server> -p .
cc-config mcp disable <server> -p .
```

### Check Environment Variables

```bash
cc-config mcp check <server>
cc-config mcp check linear
cc-config mcp check --all -p .    # Check all installed
```

### Add Custom Server

```bash
cc-config mcp add <name> <command> [options]

cc-config mcp add my-server npx \
  -a "-y,@my/mcp-server" \
  -c development \
  -d "My custom server" \
  -r "API_KEY"
```

### Remove a Server

```bash
cc-config mcp uninstall <server> -p .
```

---

## Auditing Configuration

### Full Scan

```bash
cc-config scan -p .
cc-config scan -p . --no-plugins   # Skip plugins
```

### Run Audit

```bash
cc-config audit -p .
```

Checks for:
- Base canon completeness
- Security skills presence
- Quality flags documentation
- Conflicts and missing references

### Token Usage

```bash
cc-config tokens -p .
```

Shows breakdown by scope, type, and top items.

### Dependency Graph

```bash
cc-config deps -p .
```

### List Items

```bash
cc-config list -p .                    # All items
cc-config list skill -p .              # Skills only
cc-config list -p . -s project         # Project scope only
cc-config list -p . --tokens           # Sort by token count
```

### Show Item Details

```bash
cc-config show <name> -p .
cc-config show bloch -p .
```

---

## Installing Tools

### List Available Tools

```bash
cc-config tools list
```

### Install a Tool

```bash
cc-config tools install <tool>
cc-config tools install ralph
cc-config tools install ralph --force
```

### Remove a Tool

```bash
cc-config tools uninstall <tool>
```

---

## Common Flags Reference

| Flag | Commands | Description |
|------|----------|-------------|
| `-p, --project <path>` | Most | Target project (default: `.`) |
| `-f, --force` | install, upgrade, deploy | Overwrite existing |
| `--dry-run` | profile apply | Preview only |
| `--all` | workflow install, mcp check | Apply to all |
| `--installed` | mcp list | Show installed only |
| `--enabled` | mcp list | Show enabled only |
| `--category <cat>` | canon list, mcp list/install | Filter by category |
| `-s, --skills <list>` | canon/workflow upgrade | Specific skills (comma-sep) |
| `-s, --scope <scope>` | list | Filter: global, project, plugin |
| `--tokens` | list | Sort by token count |
| `--no-plugins` | scan | Skip plugin scanning |
| `--skip-env-check` | mcp install | Skip env var validation |

---

## Typical Workflows

### New Project Setup

```bash
# 1. Apply profile
cc-config profile apply java -p /path/to/project

# 2. Install workflow skills
cc-config workflow install --all -p /path/to/project

# 3. Verify setup
cc-config audit -p /path/to/project
```

### Adding a Technology

```bash
# 1. Check available profiles
cc-config profile list

# 2. Apply additional profile
cc-config profile apply react -p .

# 3. Check what was added
cc-config canon status -p .
```

### Keeping Skills Updated

```bash
# 1. Check status
cc-config canon status -p .

# 2. View changes
cc-config canon diff <skill> -p .

# 3. Upgrade
cc-config canon upgrade -p .
```

### Adding MCP Server

```bash
# 1. Find server
cc-config mcp list --category reasoning

# 2. Check requirements
cc-config mcp show sequential-thinking

# 3. Install and enable
cc-config mcp install sequential-thinking -p .
cc-config mcp enable sequential-thinking -p .

# 4. Verify env vars
cc-config mcp check sequential-thinking
```

---

## Troubleshooting

### Skill not found

```bash
cc-config canon list              # Check available
cc-config canon source            # Check source path
```

### Profile not found

```bash
cc-config profile list            # Check available names
```

### MCP server missing env vars

```bash
cc-config mcp check <server>      # Shows which vars missing
cc-config mcp show <server>       # Shows required vars
```

### High token count

```bash
cc-config tokens -p .             # Find large items
cc-config list -p . --tokens      # Sort by size
```

### Skills show as outdated after install

```bash
cc-config canon upgrade -p .      # Sync with source
```
