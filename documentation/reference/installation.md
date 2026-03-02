# Installation Reference

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | 18.x | 20.x or 22.x |
| npm | 9.x | 10.x |
| Disk Space | 500MB | 1GB |
| RAM | 4GB | 8GB+ |

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
| `config/` | Hooks and settings templates | — |
| `dist/` | Compiled CLI | — |

## What Gets Installed in a Project

When you run `lens init` in any project (your own code, inherited codebase, vendor code, open-source repo):

```
your-project/
├── CLAUDE.md                      # Standards, anti-patterns, auto-invoke rules
└── .claude/
    ├── skills/                    # 14 slash commands
    │   ├── build/                  #   /build — plan + build + quality gates
    │   ├── improve/               #   /improve — plan + improve + quality gates
    │   ├── cleanup/               #   /cleanup — canon review + fix + verify
    │   ├── change/                #   /change — small changes done right
    │   ├── code-scan/             #   /code-scan — 13-dimension quality scoring
    │   ├── canon-audit/           #   /canon-audit — audit against a canon's rules
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

## Verification Checklist

```bash
lens --version
claude --version
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
