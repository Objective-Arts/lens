# cc-config CLI

**cc-config** sets up Claude Code projects with expert skills and configuration profiles, while **ralph** autonomously implements features by running code through a 10-phase workflow (plan → structure → implement → refactor → review → analyze → test → document → security → production-readiness). This reflects Deming's principle of building quality in rather than inspecting it at the end—expert guidance shapes the code from the first line, and quality gates at each phase catch issues when they're cheap to fix, not after the feature is "done." The result is code that is much more reviewable and much closer to production ready.

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

Full documentation at [documentation/index.md](documentation/index.md).

| Section | Contents |
|---------|----------|
| [Tutorials](documentation/tutorials/) | Getting started, first ralph run |
| [How-To Guides](documentation/how-to/) | Apply profiles, manage skills, run ralph |
| [Reference](documentation/reference/) | Commands, profiles, configuration, types |
| [Explanation](documentation/explanation/) | Architecture, quality philosophy, phases |
| [Developer Guide](documentation/DEVELOPER-GUIDE.md) | Learning to code in this codebase |

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
