# cc-config CLI

Claude Code configuration manager - scan, audit, and apply configuration profiles.

## Quick Start

```bash
# Install globally
npm install -g cc-config

# Apply a profile to your project
cc-config profile apply javascript+react -p /path/to/project

# Scan configuration
cc-config scan -p /path/to/project

# Audit for issues
cc-config audit -p /path/to/project
```

## Features

- **Profile Management**: Compose and apply configuration profiles with `+` syntax
- **Canon Skills**: Copy expert-authored skills to projects with version tracking
- **Workflow Skills**: Install universal workflow patterns (ralph-loop, implement, etc.)
- **MCP Registry**: Manage MCP server installation and configuration
- **Configuration Scanner**: Discover and audit all Claude Code configuration
- **Token Analysis**: Track context usage across skills and scopes

## Documentation

| Document | Purpose |
|----------|---------|
| [Architecture](docs/architecture.md) | System design and module structure |
| [API Reference](docs/api-reference.md) | Exported functions by module |
| [Development Guide](docs/development.md) | Contributing and testing |

## Commands

| Command | Description |
|---------|-------------|
| `scan` | Discover all Claude Code configuration |
| `list [type]` | List configuration items |
| `show <name>` | Show item details |
| `audit` | Run configuration audit |
| `tokens` | Show token usage breakdown |
| `deps` | Show dependency graph |
| `profile list` | List available profiles |
| `profile show <name>` | Show profile details |
| `profile apply <profiles>` | Apply profile(s) to project |
| `mcp list` | List MCP servers |
| `mcp install <server>` | Install MCP server |
| `mcp enable <server>` | Enable MCP server |
| `canon list` | List canon skills |
| `canon status` | Check skill versions |
| `canon install <skill>` | Install canon skill |
| `workflow list` | List workflow skills |
| `workflow install --all` | Install all workflow skills |

## License

MIT
