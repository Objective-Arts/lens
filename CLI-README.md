# lens CLI

**lens** sets up Claude Code projects with expert skills and configuration profiles. An 8-phase quality pipeline (plan → structure → implementation → refactoring → deduplication → review → testing → evaluation) with a learning loop and machine gates can be run in-session via `/build` and `/improve`, or via the bash orchestrator (`pipeline`) with isolated sessions per phase. Expert guidance shapes the code from the first line, and gates between phases catch issues when they're cheap to fix.

## Quick Start

```bash
# Install globally
npm install -g @objective-arts/lens

# Apply a profile to your project
lens profile apply javascript+react -p /path/to/project

# Scan configuration
lens scan -p /path/to/project
```

## Features

- **Profile Management**: Compose and apply 15 configuration profiles with `+` syntax
- **Canon Skills**: 77 expert-authored skills across 29 categories with version tracking
- **Workflow Skills**: 33 workflow/utility skills for quality control and automation
- **MCP Registry**: Manage MCP server installation and configuration
- **Configuration Scanner**: Discover and audit all Claude Code configuration
- **Token Analysis**: Track context usage across skills and scopes

## Documentation

Full documentation at [documentation/index.md](documentation/index.md).

| Section | Contents |
|---------|----------|
| [Tutorials](documentation/tutorials/) | Getting started |
| [How-To Guides](documentation/how-to/) | Apply profiles, configure workflow, external validation |
| [Reference](documentation/reference/) | Installation, profiles, hooks, canon catalog |
| [Explanation](documentation/explanation/) | Why expert skills, two-tier review, skill enforcement |

## Commands

### Core

| Command | Description |
|---------|-------------|
| `scan` | Discover all Claude Code configuration |
| `list [type]` | List configuration items |
| `show <name>` | Show item details |
| `audit` | Run configuration audit |
| `tokens` | Show token usage breakdown |
| `deps` | Show dependency graph |

### Profiles

| Command | Description |
|---------|-------------|
| `profile list` | List available profiles |
| `profile show <name>` | Show profile details |
| `profile apply <profiles>` | Apply profile(s) to project |

### Canon Skills

| Command | Description |
|---------|-------------|
| `canon list` | List all 77 canon skills |
| `canon status` | Check installed skill versions |
| `canon deploy` | Deploy all skills to project |
| `canon upgrade` | Upgrade outdated skills |
| `canon diff <skill>` | Show diff between installed and source |
| `canon verify` | Verify installed skills match source |
| `canon inspect <skill>` | Show what a skill contains when loaded |
| `canon source` | Show canon source info |

### MCP Servers

| Command | Description |
|---------|-------------|
| `mcp list` | List MCP servers |
| `mcp install <server>` | Install MCP server |
| `mcp enable <server>` | Enable MCP server |

### Workflow

| Command | Description |
|---------|-------------|
| `workflow list` | List workflow skills |
| `workflow install --all` | Install all workflow skills |

### Trace

| Command | Description |
|---------|-------------|
| `trace` | Trace configuration loading |

## Entry Points

| Binary | Purpose |
|--------|---------|
| `lens` | CLI for profiles, canon, scanning, workflow |
| `pipeline` | Bash orchestrator — isolated sessions per phase |
| `lens-reset` | Reset configuration to defaults |

## License

Proprietary — Objective Arts LLC. See [LICENSE](LICENSE).
