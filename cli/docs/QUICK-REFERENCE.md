# cc-config Quick Reference

## Installation

```bash
cd claude-optimal/cli && npm install && npm run build && npm link
```

## Common Workflows

### New Project Setup

```bash
# Apply a profile (creates .claude/, skills, CLAUDE.md)
cc-config profile apply java -p /path/to/project

# Or combine profiles
cc-config profile apply javascript+angular -p .
```

### Check Configuration

```bash
cc-config scan -p .          # Full scan
cc-config audit -p .         # Audit with recommendations
cc-config tokens -p .        # Token breakdown
```

### Manage Skills

```bash
cc-config canon list                    # List available skills
cc-config canon status -p .             # Check installed vs source
cc-config canon install bloch -p .      # Install a skill
cc-config canon upgrade -p .            # Upgrade outdated skills
cc-config canon diff bloch -p .         # See changes
```

### Manage MCP Servers

```bash
cc-config mcp list                      # List registry
cc-config mcp install linear -p .       # Install server
cc-config mcp enable linear -p .        # Enable server
cc-config mcp check --all -p .          # Verify env vars
```

## Command Cheat Sheet

| Command | Description |
|---------|-------------|
| `cc-config --version` | Show version |
| `cc-config --help` | Show help |
| `cc-config scan -p .` | Scan project config |
| `cc-config list skill -p .` | List skills |
| `cc-config show <name> -p .` | Show item details |
| `cc-config audit -p .` | Run audit |
| `cc-config tokens -p .` | Token breakdown |
| `cc-config deps -p .` | Dependency graph |
| `cc-config profile list` | List profiles |
| `cc-config profile show <name>` | Show profile |
| `cc-config profile apply <name> -p .` | Apply profile |
| `cc-config canon list` | List canon skills |
| `cc-config canon status -p .` | Skill status |
| `cc-config canon install <skill> -p .` | Install skill |
| `cc-config canon upgrade -p .` | Upgrade skills |
| `cc-config canon upgrade --force -p .` | Force upgrade |
| `cc-config canon diff <skill> -p .` | Show diff |
| `cc-config canon source` | Show source info |
| `cc-config mcp list` | List servers |
| `cc-config mcp list --installed -p .` | Installed servers |
| `cc-config mcp show <server>` | Server details |
| `cc-config mcp install <server> -p .` | Install server |
| `cc-config mcp enable <server> -p .` | Enable server |
| `cc-config mcp disable <server> -p .` | Disable server |
| `cc-config mcp check <server>` | Check env vars |

## Status Icons

| Icon | Meaning |
|------|---------|
| ✓ current | Installed matches source |
| ⚠ outdated | Source has updates |
| ✎ modified | Local changes detected |
| ✗ missing | Source not found |

## Profile Combination

```bash
# Combine with + syntax
cc-config profile apply base-tech+java+spring -p .

# Preview combined profile
cc-config profile show javascript+angular
```

## Files Created by Profile Apply

```
project/
├── .claude/
│   ├── skills/           # Copied skill directories
│   │   ├── bloch/
│   │   └── kernighan/
│   ├── canon-manifest.json  # Skill tracking
│   └── settings.json     # If MCP servers enabled
├── .mcp.json             # If MCP servers configured
└── CLAUDE.md             # Standards, rules, auto-invoke
```

## Key Flags

| Flag | Commands | Description |
|------|----------|-------------|
| `-p, --project <path>` | Most | Project path (default: .) |
| `-f, --force` | canon install/upgrade | Overwrite existing |
| `--dry-run` | profile apply | Preview without changes |
| `--installed` | mcp list | Show installed only |
| `--enabled` | mcp list | Show enabled only |
| `--category <cat>` | canon list, mcp list/install | Filter by category |

## Troubleshooting

```bash
# Skill not found?
cc-config canon list                    # Check available
cc-config canon source                  # Check source path

# Profile not found?
cc-config profile list                  # Check available

# MCP server issues?
cc-config mcp check <server>            # Check env vars
cc-config mcp list --installed -p .     # Check installed
```
