# How to Configure MCP Servers

Set up Model Context Protocol servers for extended capabilities.

---

## List Available Servers

```bash
cc-config mcp list
cc-config mcp list --category reasoning
cc-config mcp list --category development
```

**Categories**:
- `development` — Code tools, linters
- `productivity` — Task management, notes
- `data` — Databases, file systems
- `reasoning` — Advanced thinking (sequential-thinking)
- `automation` — CI/CD, deployment

---

## Show Server Details

```bash
cc-config mcp show <server>
cc-config mcp show sequential-thinking
```

Shows:
- Type (stdio, http)
- Command to run
- Required environment variables
- Description

---

## Install a Server

```bash
cc-config mcp install <server> -p .
```

**Example**:
```bash
cc-config mcp install sequential-thinking -p .
```

Skip environment variable check:
```bash
cc-config mcp install linear --skip-env-check -p .
```

Install all servers in a category:
```bash
cc-config mcp install --category reasoning -p .
```

---

## Enable/Disable Servers

Enable a server (add to settings.json):
```bash
cc-config mcp enable <server> -p .
```

Disable a server (remove from settings.json):
```bash
cc-config mcp disable <server> -p .
```

---

## Check Environment Variables

Many servers need API keys. Check what's required:

```bash
cc-config mcp check <server>
cc-config mcp check linear
```

Check all installed servers:
```bash
cc-config mcp check --all -p .
```

---

## List Installed/Enabled Servers

```bash
cc-config mcp list --installed -p .
cc-config mcp list --enabled -p .
```

---

## Add a Custom Server

```bash
cc-config mcp add <name> <command> [options]
```

**Example**:
```bash
cc-config mcp add my-server npx \
  -a "-y,@my/mcp-server" \
  -c development \
  -d "My custom server" \
  -r "API_KEY"
```

Options:
- `-a, --args` — Command arguments (comma-separated)
- `-c, --category` — Server category
- `-d, --description` — Description
- `-r, --required-env` — Required env vars (comma-separated)

---

## Remove a Server

```bash
cc-config mcp uninstall <server> -p .
```

---

## Troubleshooting

**Server missing env vars**:
```bash
cc-config mcp check <server>      # Shows which vars missing
cc-config mcp show <server>       # Shows required vars
```

Set the variable:
```bash
export MY_API_KEY=xxx
# Or add to ~/.zshrc / ~/.bashrc
```

**Server not starting**:
Check logs in Claude Code. Common issues:
- Missing npm package (run `npm install -g @package/name`)
- Wrong Node.js version
- Firewall blocking connection
