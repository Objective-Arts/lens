# Tutorial: Getting Started with Lens

*Apply domain expertise to review existing code and write new code with quality standards.*

## What Lens Does

Lens injects domain expertise into Claude Code. It works in two directions:

1. **Review existing code** — Point `/fix`, `/code-scan`, `/canon-audit`, or `/gemini-scan` at any codebase. Lens loads the right canons (SQL, React, security, etc.) and reviews the code against expert-level standards. You don't need to have written the code.

2. **Write new code** — When you build with `/change`, `/build`, or `/improve`, Claude writes code informed by the same canon knowledge, then reviews its own output against rubrics.

Most teams start with review. You inherit a codebase, join a project, or need to audit third-party code. Lens gives Claude the domain knowledge to catch what generic review misses.

## Prerequisites

| Requirement | Purpose |
|-------------|---------|
| Node.js 18+ | Run lens CLI |
| Claude Code CLI | AI coding assistant |
| Gemini API Key | External code review via `/gemini-scan` (optional) |

## Step 1: Install

```bash
npm install -g @objective-arts/lens
lens --version
```

Or from source:

```bash
git clone <repository-url> lens
cd lens && npm install && npm run build && npm link
```

## Step 2: Initialize a Project

Navigate to the codebase you want to review or work on:

```bash
cd /path/to/any/project
lens init
```

Lens auto-detects the stack from `package.json`, `requirements.txt`, `pom.xml`, `*.csproj`, etc. and loads the right profile. This works on any project — your own code, inherited codebases, open-source repos, vendor code.

Override the auto-detection if needed:

```bash
lens init --profile sql+security    # combine profiles for focused review
```

Output:

```
Auto-detected profile: javascript+react

Created:
  + CLAUDE.md (standards, anti-patterns, auto-invoke rules)
  + .claude/skills/ (14 workflow commands)
  + .claude/canon/ (domain expertise per profile)
  + .claude/rubric/ (review scoring rubrics)
  + .mcp.json (gemini-reviewer, qodana)

Profile applied successfully!
```

## Step 3: Review Existing Code

Open Claude Code and point any scan at the codebase:

```bash
claude
```

**Quick quality check** — 13-dimension scoring, no external tools needed:
```
/code-scan src/
```

**Audit against a specific canon** — does this code follow SQL best practices? React patterns? Security standards?
```
/canon-audit sql src/
/canon-audit react src/components/
/canon-audit security src/auth/
```

**Fix what you find** — Claude reviews against loaded canons, fixes findings, verifies:
```
/fix src/
```

**AI smell check** — detect over-abstraction, comment spam, defensive paranoia:
```
/ai-smell-scan src/
```

**External review** — independent model perspective (requires `GEMINI_API_KEY`):
```
/gemini-scan src/
```

These all work on code you didn't write. That's the primary use case — you point Lens at foreign code and get expert-level review informed by 88 domain canons.

## Step 4: Write New Code

When you're ready to build or change code, the same canons inform what Claude writes:

```
/change add input validation to the login form
/fix "add a rate limiter to the API endpoints"
```

For larger features, the full pipeline plans, builds, reviews, and tests:

```
/build add JWT authentication
/improve src/api/
```

## Step 5: Verify the Setup

From the terminal, check what's installed:

```bash
lens scan -p .       # what Claude Code config exists
lens canon list      # browse the 88 domain canons
lens profile list    # see all 15 available profiles
```

## What Was Created

```
your-project/
├── CLAUDE.md                    # Standards, anti-patterns, auto-invoke rules
└── .claude/
    ├── skills/                  # 14 slash commands
    ├── canon/                   # Domain expertise (selected by profile)
    ├── rubric/                  # Review scoring rubrics
    ├── scripts/                 # Quality gate
    ├── workflow-manifest.json
    └── canon-manifest.json
```

## Optional: Gemini API Key

Most commands work without any API keys. For external code review via `/gemini-scan`:

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a free API key
3. Add to `~/.zshrc` or `~/.bashrc`:

```bash
export GEMINI_API_KEY="your-key-here"
```

## Next Steps

- [Installation Reference](../reference/installation.md) — system requirements, troubleshooting
- [System Overview](../system-overview.md) — architecture and how the layers work together
