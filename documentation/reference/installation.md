# Installation Reference

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | 18.x | 20.x or 22.x |
| npm | 9.x | 10.x |
| Disk Space | 500MB | 1GB |
| RAM | 4GB | 8GB+ |

Optional:

| Component | Purpose |
|-----------|---------|
| Docker | Run Qodana static analysis |
| Gemini API Key | External code review via `/gemini-scan` |
| Qodana Token | Cloud-based static analysis reports |

## Required Software

### Claude Code CLI

```bash
npm install -g @anthropic-ai/claude-code
claude --version
```

## Lens CLI Installation

### From GitHub Packages (Recommended)

After configuring npm authentication:

```bash
npm install -g @objective-arts/lens
lens --version
```

### From Source

```bash
git clone <repository-url> lens
cd lens
npm install
npm run build
npm link
lens --version
```

### Direct Execution (No Install)

```bash
cd lens
npm install && npm run build
node dist/cli/index.js --version
```

## What Ships in the Package

| Directory | Contents | Count |
|-----------|----------|-------|
| `canon/` | Domain expertise skills | 88 skills in 30 categories |
| `profiles/` | Stack-specific YAML profiles | 15 profiles |
| `workflow-skills/` | Slash commands and review tools | 33 total (14 shipped as commands) |
| `workflow-skills/rubric/` | Review scoring rubrics | 16 rubrics |
| `mcp-servers/` | Gemini reviewer, Qodana scanner | 2 servers |
| `config/` | Hooks and settings templates | — |
| `dist/` | Compiled CLI | — |

## What Gets Installed in a Project

When you run `lens init` in any project (your own code, inherited codebase, vendor code, open-source repo):

```
your-project/
├── CLAUDE.md                      # Standards, anti-patterns, auto-invoke rules
└── .claude/
    ├── skills/                    # 14 slash commands
    │   ├── fix/                   #   /fix — canon review + fix + verify
    │   ├── change/                #   /change — small changes done right
    │   ├── build/                 #   /build — full pipeline for new features
    │   ├── improve/               #   /improve — full pipeline for existing code
    │   ├── code-scan/             #   /code-scan — 13-dimension quality scoring
    │   ├── canon-audit/           #   /canon-audit — audit against a canon's rules
    │   ├── gemini-scan/           #   /gemini-scan — external Gemini review
    │   ├── codex-scan/            #   /codex-scan — external Codex review
    │   ├── ai-smell-scan/         #   /ai-smell-scan — detect AI code patterns
    │   ├── ai-smell-fix/          #   /ai-smell-fix — remove AI code smells
    │   ├── deadcode-scan/         #   /deadcode-scan — find unused code
    │   ├── generate-docs/         #   /generate-docs — generate documentation
    │   ├── lens/                  #   /lens — status and help
    │   └── ai-smell-review/       #   /ai-smell-review — review + fix AI smells
    ├── canon/                     # Domain expertise canons (selected by profile)
    ├── rubric/                    # Review scoring rubrics
    ├── scripts/                   # Quality gate
    ├── workflow-manifest.json
    └── canon-manifest.json
```

Skills and canons are **copied** into the project for portability. To update after upgrading lens, run `lens init --force`.

## API Key Configuration

### Gemini API Key (Optional)

Enables `/gemini-scan` for independent external code review — useful for reviewing inherited or unfamiliar codebases with a second opinion.

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Create an API key
3. Add to `~/.zshrc` or `~/.bashrc`:

```bash
export GEMINI_API_KEY="AIza..."
```

### Qodana Token (Optional)

Enables cloud-based static analysis reports:

1. Visit [Qodana Cloud](https://qodana.cloud)
2. Generate a token
3. Add to shell profile:

```bash
export QODANA_TOKEN="eyJ..."
```

Qodana also works locally without a token.

## Docker Setup (Optional)

Required only for Qodana static analysis.

```bash
# Pre-pull images for your stack
docker pull jetbrains/qodana-js:latest      # JavaScript/TypeScript
docker pull jetbrains/qodana-jvm:latest     # Java
docker pull jetbrains/qodana-dotnet:latest  # C#/.NET
docker pull jetbrains/qodana-python:latest  # Python
```

## Verification Checklist

```bash
# Required
lens --version
claude --version

# Optional
[ -n "$GEMINI_API_KEY" ] && echo "GEMINI_API_KEY set" || echo "GEMINI_API_KEY not set (optional)"
[ -n "$QODANA_TOKEN" ] && echo "QODANA_TOKEN set" || echo "QODANA_TOKEN not set (optional)"

# Test it works
lens profile list
```

## Troubleshooting

### "lens: command not found"

```bash
cd /path/to/lens && npm run build && npm link

# Or check npm global bin is in PATH
npm config get prefix
# Add <prefix>/bin to your PATH
```

### Permission denied on npm link

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
npm link
```

### Docker permission denied

```bash
sudo usermod -aG docker $USER
# Log out and back in
```

### Gemini API errors

```bash
echo $GEMINI_API_KEY
curl -s "https://generativelanguage.googleapis.com/v1/models?key=$GEMINI_API_KEY" | head -5
```

## Updating

```bash
npm update -g @objective-arts/lens   # get latest canons, rubrics, skills
cd your-project
lens init --force                    # re-copy updated assets into project
```

## Uninstalling

```bash
npm uninstall -g @objective-arts/lens
rm -rf /path/to/project/.claude      # remove project configuration
```
