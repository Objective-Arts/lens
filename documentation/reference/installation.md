# Installation Reference

Complete installation and configuration reference for Claude-Optimal.

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | 18.x | 20.x or 22.x |
| npm | 9.x | 10.x |
| Docker | 20.x | Latest |
| Disk Space | 500MB | 2GB (for Qodana images) |
| RAM | 4GB | 8GB+ |

---

## Required Software

### Claude Code CLI

The AI coding assistant that uses the canon configuration.

```bash
npm install -g @anthropic-ai/claude-code
claude --version
```

### Docker

Required for Qodana static analysis.

- **macOS**: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux**: `sudo apt install docker.io` or [official install](https://docs.docker.com/engine/install/)
- **Windows**: [Docker Desktop with WSL2](https://www.docker.com/products/docker-desktop/)

Verify:
```bash
docker --version
docker run hello-world
```

---

## cc-config CLI Installation

### Method 1: From Tarball (Recommended for Distribution)

You received a `cc-config-X.X.X.tgz` file:

```bash
npm install -g ./cc-config-0.1.0.tgz
cc-config --version
```

### Method 2: From Source Repository

If you have repository access:

```bash
git clone <repository-url> claude-optimal
cd claude-optimal/cli
npm install
npm run build
npm link
cc-config --version
```

### Method 3: Direct Execution (No Install)

Run without global install:

```bash
cd claude-optimal/cli
npm install
npm run build
node dist/cli/index.js --version
```

Or with npx:

```bash
npx tsx src/cli/index.ts --version
```

---

## API Key Configuration

### Gemini API Key

**Purpose**: External code review by a different AI model (catches blind spots)

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key

Add to shell profile:

```bash
# ~/.zshrc or ~/.bashrc
export GEMINI_API_KEY="AIza..."
```

**Verify**:
```bash
source ~/.zshrc
echo $GEMINI_API_KEY | head -c 10
# Should show: AIza...
```

### Qodana Token (Optional)

**Purpose**: Cloud-based static analysis reports and history

1. Visit [Qodana Cloud](https://qodana.cloud)
2. Create account (JetBrains account works)
3. Go to Settings → Tokens
4. Generate new token

Add to shell profile:

```bash
# ~/.zshrc or ~/.bashrc
export QODANA_TOKEN="eyJ..."
```

**Note**: Qodana works locally without a token. The token enables cloud features.

---

## MCP Server Setup

MCP (Model Context Protocol) servers provide Claude with external tools.

### List Available Servers

```bash
cc-config mcp list
```

### Install Gemini Reviewer

```bash
cc-config mcp install gemini-reviewer -p /path/to/project
cc-config mcp enable gemini-reviewer -p /path/to/project
```

### Install Qodana Scanner

```bash
cc-config mcp install qodana -p /path/to/project
cc-config mcp enable qodana -p /path/to/project
```

### Verify Configuration

```bash
# Check all installed servers
cc-config mcp check --all -p /path/to/project

# Check specific server
cc-config mcp check gemini-reviewer
```

### Pull Qodana Docker Images

Pre-pull images to avoid delays during scans:

```bash
# JavaScript/TypeScript
docker pull jetbrains/qodana-js:latest

# Java
docker pull jetbrains/qodana-jvm:latest

# C#/.NET
docker pull jetbrains/qodana-dotnet:latest

# Python
docker pull jetbrains/qodana-python:latest

# Go
docker pull jetbrains/qodana-go:latest
```

---

## Directory Structure

After installation, your system will have:

```
~/.claude/                          # Global Claude config
├── CLAUDE.md                       # Global standards (optional)
├── settings.json                   # Global settings
└── profiles/                       # Custom profiles (optional)

/path/to/claude-optimal/            # Source repository
├── cli/                            # cc-config CLI source
│   ├── dist/                       # Compiled CLI
│   └── src/                        # Source code
├── canon/                          # Canon skill definitions
├── profiles/                       # Profile definitions
├── workflow-skills/                # Workflow skills (ralph-loop, etc.)
└── mcp-servers/                    # MCP server implementations

/path/to/your-project/              # Your project
└── .claude/
    ├── CLAUDE.md                   # Project standards
    ├── settings.json               # Project settings
    └── skills/                     # Symlinked skills
```

---

## Verification Checklist

Run these commands to verify your installation:

```bash
# 1. cc-config CLI
cc-config --version
# Expected: 0.1.0 (or current version)

# 2. Claude Code
claude --version
# Expected: Version number

# 3. Docker
docker --version
# Expected: Docker version 20+

# 4. Gemini API Key
[ -n "$GEMINI_API_KEY" ] && echo "✓ GEMINI_API_KEY set" || echo "✗ GEMINI_API_KEY missing"

# 5. Qodana Token (optional)
[ -n "$QODANA_TOKEN" ] && echo "✓ QODANA_TOKEN set" || echo "○ QODANA_TOKEN not set (optional)"

# 6. Profile listing
cc-config profile list
# Expected: List of available profiles
```

---

## Troubleshooting

### "cc-config: command not found"

```bash
# Re-link the CLI
cd /path/to/claude-optimal/cli
npm run build
npm link

# Or check npm global bin is in PATH
npm config get prefix
# Add <prefix>/bin to your PATH
```

### "Permission denied" on npm link

```bash
# Option 1: Use sudo
sudo npm link

# Option 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
npm link
```

### Docker permission denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

### Qodana container fails to start

```bash
# Check Docker is running
docker ps

# Check available memory
docker info | grep Memory

# Try pulling image explicitly
docker pull jetbrains/qodana-js:latest
```

### Gemini API errors

```bash
# Verify key is set
echo $GEMINI_API_KEY

# Test API directly
curl -s "https://generativelanguage.googleapis.com/v1/models?key=$GEMINI_API_KEY" | head -5
```

---

## Updating

### Update cc-config

```bash
# If installed from tarball
npm install -g ./cc-config-X.X.X.tgz  # new version

# If installed from source
cd claude-optimal/cli
git pull
npm install
npm run build
npm link
```

### Update Canon Skills

```bash
# Check for outdated skills
cc-config canon status -p /path/to/project

# Upgrade all
cc-config canon upgrade -p /path/to/project
```

---

## Uninstalling

```bash
# Remove global CLI
npm uninstall -g cc-config

# Remove project configuration
rm -rf /path/to/project/.claude

# Remove Docker images (optional)
docker rmi jetbrains/qodana-js:latest
```
