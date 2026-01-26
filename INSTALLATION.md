# Claude-Optimal Installation Guide

Private distribution guide for claude-optimal and cc-config CLI.

> **Full Documentation**: See `documentation/` folder for complete guides, tutorials, and reference.
> - [Getting Started Tutorial](documentation/tutorials/getting-started.md)
> - [Installation Reference](documentation/reference/installation.md)
> - [External Validation Setup](documentation/how-to/external-validation.md)

---

## Prerequisites

| Requirement | Purpose | Get It |
|-------------|---------|--------|
| Node.js 18+ | Run cc-config CLI | [nodejs.org](https://nodejs.org) |
| Claude Code CLI | AI coding assistant | `npm install -g @anthropic-ai/claude-code` |
| Docker | Run Qodana static analysis | [docker.com](https://docker.com/get-started) |
| Gemini API Key | External code review | [aistudio.google.com](https://aistudio.google.com/apikey) |
| Qodana Token (optional) | Cloud reports | [qodana.cloud](https://qodana.cloud) |

## Step 1: Install cc-config CLI

### Option A: From Tarball (Recommended for Distribution)

```bash
# You received a file: cc-config-X.X.X.tgz
npm install -g ./cc-config-0.1.0.tgz
```

### Option B: From Private Git Repository

```bash
# If you have access to the repo:
git clone https://github.com/YOUR_ORG/claude-optimal.git
cd claude-optimal/cli
npm install
npm run build
npm link
```

### Option C: Direct from Source

```bash
# Clone and link
git clone <provided-url> claude-optimal
cd claude-optimal/cli
npm install
npm run build
npm link

# Verify installation
cc-config --version
```

## Step 2: Configure API Keys

### Gemini API Key (Required for External Review)

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create an API key
3. Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export GEMINI_API_KEY="your-gemini-api-key-here"
```

### Qodana Token (Optional - for Cloud Reports)

1. Go to [Qodana Cloud](https://qodana.cloud)
2. Create account and generate token
3. Add to shell profile:

```bash
export QODANA_TOKEN="your-qodana-token-here"
```

### Reload Shell

```bash
source ~/.zshrc  # or source ~/.bashrc
```

## Step 3: Verify Installation

```bash
# Check cc-config
cc-config --version

# Check Claude Code
claude --version

# Check Docker (for Qodana)
docker --version

# Check Gemini key is set
echo $GEMINI_API_KEY | head -c 10

# Test Qodana (optional)
docker pull jetbrains/qodana-js:latest
```

## Step 4: Set Up a Project

```bash
# Create new project
mkdir my-project && cd my-project
git init

# Apply a profile (example: C# + JavaScript fullstack with Ralph Loop)
cc-config profile apply csharp+javascript+ralph-integration -p .

# View what was installed
cc-config scan -p .
cc-config audit -p .
```

## Available Profiles

| Profile | Use Case |
|---------|----------|
| `software-base` | Base canon (always included) |
| `csharp` | C#/.NET projects |
| `javascript` | JS/TS projects |
| `react` | React frontend |
| `java` | Java projects |
| `python` | Python projects |
| `ralph-integration` | Autonomous iteration loop |

Combine with `+`: `cc-config profile apply csharp+javascript+ralph-integration -p .`

## Step 5: Run Ralph Loop (Autonomous Development)

```bash
# In your project with PRD.md:
claude "/ralph-loop PRD.md"

# With external validation (Gemini + Qodana):
claude "/ralph-loop PRD.md --external"
```

## MCP Servers (Optional)

cc-config can manage MCP servers for Claude Code:

```bash
# List available servers
cc-config mcp list

# Install Gemini reviewer
cc-config mcp install gemini-reviewer -p .
cc-config mcp enable gemini-reviewer -p .

# Install Qodana
cc-config mcp install qodana -p .
cc-config mcp enable qodana -p .

# Check env vars are set
cc-config mcp check --all -p .
```

## Troubleshooting

### "cc-config: command not found"

```bash
# Re-link
cd /path/to/claude-optimal/cli
npm run build
npm link
```

### "GEMINI_API_KEY not set"

```bash
# Check it's exported
echo $GEMINI_API_KEY

# If empty, add to ~/.zshrc:
export GEMINI_API_KEY="your-key"
source ~/.zshrc
```

### Qodana Docker Issues

```bash
# Ensure Docker is running
docker ps

# Pull image manually
docker pull jetbrains/qodana-js:latest
```

### Permission Errors on npm link

```bash
# Use sudo or fix npm permissions
sudo npm link
# Or: https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally
```

## Creating Distribution Package

For the person distributing cc-config:

```bash
cd claude-optimal/cli
npm run build
npm pack
# Creates: cc-config-0.1.0.tgz
# Share this file with recipients
```

## Support

Contact the person who provided this package for support.
