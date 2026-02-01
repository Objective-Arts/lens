# Command Reference

Complete reference for all cc-config and ralph commands.

---

## cc-config

### Global Options

| Option | Description |
|--------|-------------|
| `--version` | Show version |
| `--help` | Show help |

---

## Scan Commands

### `scan`

Discover all Claude Code configuration.

```bash
cc-config scan [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |
| `--no-plugins` | Skip plugin scanning | `false` |

### `list`

List configuration items.

```bash
cc-config list [type] [options]
```

| Argument | Description |
|----------|-------------|
| `type` | Filter: `skill`, `command`, `agent`, `settings`, `hook`, `mcp` |

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |
| `-s, --scope <scope>` | Filter: `global`, `project`, `plugin` | all |
| `--tokens` | Sort by token count | `false` |

### `show`

Show item details.

```bash
cc-config show <name> [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |

### `audit`

Run configuration audit.

```bash
cc-config audit [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |

### `tokens`

Show token usage breakdown.

```bash
cc-config tokens [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |

### `deps`

Show dependency graph.

```bash
cc-config deps [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |

---

## Profile Commands

### `profile list`

List available profiles.

```bash
cc-config profile list
```

### `profile show`

Show profile details.

```bash
cc-config profile show <name>
```

| Argument | Description |
|----------|-------------|
| `name` | Profile name (use `+` to preview combined) |

### `profile apply`

Apply profile(s) to a project.

```bash
cc-config profile apply <profiles> [options]
```

| Argument | Description |
|----------|-------------|
| `profiles` | Profile name(s), combined with `+` |

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |
| `-f, --force` | Overwrite existing | `false` |
| `--dry-run` | Preview only | `false` |

---

## Canon Commands

### `canon list`

List available canon skills.

```bash
cc-config canon list [options]
```

| Option | Description |
|--------|-------------|
| `--category <cat>` | Filter by category |

### `canon status`

Check installed skill versions.

```bash
cc-config canon status [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |

### `canon install`

Install a canon skill.

```bash
cc-config canon install <skill> [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |
| `-f, --force` | Overwrite existing | `false` |

### `canon upgrade`

Upgrade outdated skills.

```bash
cc-config canon upgrade [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |
| `-f, --force` | Overwrite modified | `false` |
| `-s, --skills <list>` | Specific skills (comma-separated) | all |

### `canon diff`

Show differences between installed and source.

```bash
cc-config canon diff <skill> [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |

### `canon deploy`

Install all canon skills.

```bash
cc-config canon deploy [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |
| `-f, --force` | Overwrite existing | `false` |

### `canon source`

Show canon source path.

```bash
cc-config canon source
```

---

## Workflow Commands

### `workflow list`

List available workflow skills.

```bash
cc-config workflow list
```

### `workflow install`

Install workflow skills.

```bash
cc-config workflow install [skill] [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |
| `--all` | Install all | `false` |
| `-f, --force` | Overwrite existing | `false` |

### `workflow status`

Check workflow skill versions.

```bash
cc-config workflow status [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |

### `workflow upgrade`

Upgrade workflow skills.

```bash
cc-config workflow upgrade [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |
| `-f, --force` | Overwrite modified | `false` |

---

## MCP Commands

### `mcp list`

List MCP servers.

```bash
cc-config mcp list [options]
```

| Option | Description |
|--------|-------------|
| `--category <cat>` | Filter by category |
| `--installed` | Show installed only |
| `--enabled` | Show enabled only |
| `-p, --project <path>` | Project path |

### `mcp show`

Show server details.

```bash
cc-config mcp show <server>
```

### `mcp install`

Install an MCP server.

```bash
cc-config mcp install <server> [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |
| `--category <cat>` | Install all in category | — |
| `--skip-env-check` | Skip env var validation | `false` |

### `mcp enable`

Enable an MCP server.

```bash
cc-config mcp enable <server> [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |

### `mcp disable`

Disable an MCP server.

```bash
cc-config mcp disable <server> [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |

### `mcp check`

Check required environment variables.

```bash
cc-config mcp check <server>
cc-config mcp check --all [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--all` | Check all installed | `false` |
| `-p, --project <path>` | Project path | `.` |

### `mcp add`

Add a custom server to registry.

```bash
cc-config mcp add <name> <command> [options]
```

| Option | Description |
|--------|-------------|
| `-a, --args <args>` | Command arguments (comma-separated) |
| `-c, --category <cat>` | Server category |
| `-d, --description <desc>` | Description |
| `-r, --required-env <vars>` | Required env vars (comma-separated) |

### `mcp uninstall`

Remove an MCP server.

```bash
cc-config mcp uninstall <server> [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |

---

## Other Commands

### `trace`

Trace skill configuration stack.

```bash
cc-config trace <skill> [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project <path>` | Project path | `.` |

### `ui`

Launch web UI.

```bash
cc-config ui [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--port <port>` | Port number | `3847` |

---

## ralph

### Basic Usage

```bash
ralph <prd-file> [options]
```

| Argument | Description |
|----------|-------------|
| `prd-file` | Path to PRD markdown file |

| Option | Description | Default |
|--------|-------------|---------|
| `--max <n>` | Max iterations | `50` |
| `--resume` | Continue from last item | `false` |
| `--external` | Enable Gemini + Qodana | `false` |
| `--dry-run` | Preview only | `false` |
| `--verbose` | Detailed output | `false` |
| `--skip-review` | Skip adversarial review | `false` |
