---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Installation Reference

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

```bash
npm install -g @anthropic-ai/claude-code
claude --version
```

### Docker

- **macOS**: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux**: `sudo apt install docker.io` or [official install](https://docs.docker.com/engine/install/)
- **Windows**: [Docker Desktop with WSL2](https://www.docker.com/products/docker-desktop/)

Verify:
```bash
docker --version
docker run hello-world
```

---

## lens CLI Installation

### Method 1: From GitHub Packages (Recommended)

See [Install from GitHub Packages](../how-to/install-from-github-packages.md) for full setup.

Quick version (after configuring npm auth):

```bash
npm install -g @objective-arts/lens
lens --version
```

### Method 2: From Source Repository

If you have repository access:

```bash
git clone <repository-url> lens
cd lens
npm install
npm run build
npm link
lens --version
```

### Method 3: Direct Execution (No Install)

Run without global install:

```bash
cd lens
npm install
npm run build
node dist/cli/index.js --version
```

Or with tsx:

```bash
npx tsx src/cli/index.ts --version
```

---

## API Key Configuration

### Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key

Add to shell profile:

```bash
# ~/.zshrc or ~/.bashrc
export GEMINI_API_KEY="AIza..."
```

Reload shell:
```bash
source ~/.zshrc
```

### Qodana Token (Optional)

1. Visit [Qodana Cloud](https://qodana.cloud)
2. Create account (JetBrains account works)
3. Go to Settings → Tokens
4. Generate new token

Add to shell profile:

```bash
# ~/.zshrc or ~/.bashrc
export QODANA_TOKEN="eyJ..."
```

Qodana works locally without a token. The token enables cloud features.

---

## MCP Server Setup

MCP (Model Context Protocol) servers provide Claude with external tools.

### List Available Servers

```bash
lens mcp list
```

### Install Gemini Reviewer

```bash
lens mcp install gemini-reviewer -p /path/to/project
lens mcp enable gemini-reviewer -p /path/to/project
```

### Install Qodana Scanner

```bash
lens mcp install qodana -p /path/to/project
lens mcp enable qodana -p /path/to/project
```

### Verify Configuration

```bash
# Check all installed servers
lens mcp check --all -p /path/to/project

# Check specific server
lens mcp check gemini-reviewer
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

/path/to/lens/                      # Source repository
├── src/                            # TypeScript source code
├── dist/                           # Compiled output
├── canon/                          # 77 canon skill definitions
├── profiles/                       # 15 profile definitions
├── workflow-skills/                # 33 workflow + utility skills
├── mcp-servers/                    # MCP server implementations
└── scripts/                        # Pipeline orchestrator, quality gate

/path/to/your-project/              # Your project
├── CLAUDE.md                       # Standards, auto-invoke rules
└── .claude/
    ├── skills/                     # ~10 workflow commands (slash commands)
    ├── canon/                      # Domain expertise canons (per profile)
    ├── rubric/                     # Scoring rubrics
    ├── scripts/                    # Quality gate
    ├── workflow-manifest.json
    └── canon-manifest.json
```

---

## Verification Checklist

```bash
# 1. lens CLI
lens --version

# 2. Claude Code
claude --version

# 3. Docker
docker --version

# 4. Gemini API Key
[ -n "$GEMINI_API_KEY" ] && echo "✓ GEMINI_API_KEY set" || echo "✗ GEMINI_API_KEY missing"

# 5. Qodana Token (optional)
[ -n "$QODANA_TOKEN" ] && echo "✓ QODANA_TOKEN set" || echo "○ QODANA_TOKEN not set (optional)"

# 6. Profile listing
lens profile list
```

---

## Troubleshooting

### "lens: command not found"

```bash
# Re-link the CLI
cd /path/to/lens
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

### Update lens

```bash
# If installed from tarball
npm install -g ./lens-X.X.X.tgz  # new version

# If installed from source
cd lens
git pull
npm install
npm run build
npm link
```

### Update Canon Skills

```bash
# Check for outdated skills
lens canon status -p /path/to/project

# Upgrade all
lens canon upgrade -p /path/to/project
```

---

## Uninstalling

```bash
# Remove global CLI
npm uninstall -g @objective-arts/lens

# Remove project configuration
rm -rf /path/to/project/.claude

# Remove Docker images (optional)
docker rmi jetbrains/qodana-js:latest
```
