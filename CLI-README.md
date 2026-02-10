# lens CLI

**lens** sets up Claude Code projects with expert skills and configuration profiles, while **ralph** autonomously implements features by running code through a 9-phase quality pipeline with 3 machine gates (plan → structure → implement → refactor → dedupe → Gemini review → security audit → tests → AI smell removal). Expert guidance shapes the code from the first line, and quality gates between phase groups catch issues when they're cheap to fix.

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

- **Profile Management**: Compose and apply 14 configuration profiles with `+` syntax
- **Canon Skills**: 75 expert-authored skills across 30 categories with version tracking
- **Workflow Skills**: 29 workflow/utility skills for quality control and automation
- **MCP Registry**: Manage MCP server installation and configuration
- **Configuration Scanner**: Discover and audit all Claude Code configuration
- **Token Analysis**: Track context usage across skills and scopes

## Documentation

Full documentation at [documentation/index.md](documentation/index.md).

| Section | Contents |
|---------|----------|
| [Project Overview](documentation/PROJECT-OVERVIEW.md) | Architecture, design principles, skill catalog |
| [Tutorials](documentation/tutorials/) | Getting started, first Ralph run |
| [How-To Guides](documentation/how-to/) | Apply profiles, configure workflow, external validation |
| [Reference](documentation/reference/) | Installation, profiles, hooks, canon catalog |
| [Explanation](documentation/explanation/) | Why expert skills, two-tier review, skill enforcement |
| [Developer Guide](documentation/DEVELOPER-GUIDE.md) | Contributing to the Lens codebase |

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
| `canon list` | List all 75 canon skills |
| `canon status` | Check installed skill versions |
| `canon deploy` | Deploy all skills to project |
| `canon upgrade` | Upgrade outdated skills |
| `canon diff <skill>` | Show diff between installed and source |
| `canon verify` | Verify installed skills match source |
| `canon inspect <skill>` | Show what Ralph sees when loading a skill |
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
| `ralph` | Autonomous PRD implementation loop |
| `lens-reset` | Reset configuration to defaults |

## License

Proprietary — Objective Arts LLC. See [LICENSE](LICENSE).
