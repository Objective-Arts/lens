# Lens System Overview

Lens is a CLI tool that makes Claude Code better at writing code by injecting domain expertise, quality workflows, and independent review tools into any project.

## Install and Use

```bash
npm install -g @objective-arts/lens    # install once
cd any-project
lens init                              # auto-detects stack, sets up everything
```

After init, open Claude Code and use `/build`, `/fix`, `/improve`, etc.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          YOUR TERMINAL                                  │
│                                                                         │
│  npm install -g @objective-arts/lens                                    │
│  cd my-project                                                          │
│  lens init                                                              │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     Layer 1: CLI (lens)                         │    │
│  │                                                                 │    │
│  │  lens init ─── auto-detect stack ─── load profile ───┐         │    │
│  │  lens scan        lens list        lens audit         │         │    │
│  │  lens canon list  lens workflow status                │         │    │
│  └───────────────────────────────────────────────────────┼─────────┘    │
│                                                          │              │
│                                           Creates in your project:      │
│                                                          │              │
│  ┌───────────────────────────────────────────────────────▼─────────┐    │
│  │                     YOUR PROJECT                                │    │
│  │                                                                 │    │
│  │  .claude/skills/  ──copies──▶  ~10 workflow commands             │    │
│  │  .claude/canon/   ──copies──▶  domain expertise (per profile)   │    │
│  │  .claude/rubric/  ──copies──▶  scoring rubrics                  │    │
│  │  .mcp.json        ──points to──▶ gemini-reviewer, qodana       │    │
│  │  CLAUDE.md        (standards, anti-patterns, auto-invoke)       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        CLAUDE CODE SESSION                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                Layer 2: Skills (slash commands)                  │    │
│  │                                                                 │    │
│  │  /build ──┐     /fix          /change                           │    │
│  │  /improve─┤     /gemini-scan  /code-scan  /ai-smell-scan       │    │
│  │           │     /codex-scan   /qodana-scan  ...                 │    │
│  │           │                                                     │    │
│  │           │  ┌──────────────────────────────────────────────┐   │    │
│  │           └──▶  Layer 3: Pipeline (pipeline.sh)             │   │    │
│  │              │                                              │   │    │
│  │              │  Phase 1: Plan ────────────┐                 │   │    │
│  │              │  Phase 2: Structure        │ Load canons     │   │    │
│  │              │  Phase 3: Implementation   │ (domain         │   │    │
│  │              │  Phase 4: Refactoring      │  expertise)     │   │    │
│  │              │  Phase 5: Deduplication ───┘                 │   │    │
│  │              │  Phase 6: Review ──────────┐                 │   │    │
│  │              │  Phase 7: Testing          │ Load rubrics    │   │    │
│  │              │  Phase 8: Evaluation ──────┘ (scoring        │   │    │
│  │              │           │                   criteria)      │   │    │
│  │              │           ▼                                  │   │    │
│  │              │  Lessons learned ──▶ fed back to phases 1-5  │   │    │
│  │              └──────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  External tools:                                                        │
│  ┌──────────────┐  ┌──────────┐  ┌──────────┐                         │
│  │ Gemini (MCP) │  │ Codex CLI│  │Qodana MCP│                         │
│  │ gemini-scan  │  │ codex-scan│ │qodana-scan│                        │
│  │ phase 6      │  │ fix       │ │ phase 6   │                         │
│  └──────────────┘  └──────────┘  └──────────┘                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     INSTALLED PACKAGE                                    │
│                     (source of truth — copied into projects by init)    │
│                                                                         │
│  canon/              88 domain expertise skills (knowledge)             │
│  workflow-skills/    38 workflow + utility skills (actions)             │
│  profiles/           15 YAML profiles (which canons + standards)       │
│  workflow-skills/rubric/  14 scoring rubrics (review criteria)         │
│  mcp-servers/        gemini-reviewer, qodana                           │
│  scripts/pipeline.sh 8-phase build/improve orchestrator                │
│  dist/               compiled CLI                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Three Layers

### Layer 1: CLI Tool (`lens`)

Run from your terminal. Setup and inspection.

| Command | Purpose |
|---------|---------|
| `lens init` | Set up a project (the one command users need) |
| `lens init --profile sql+react` | Set up with specific profile instead of auto-detect |
| `lens init --force` | Re-symlink everything (after upgrading lens) |
| `lens scan` | What Claude Code config exists in this project? |
| `lens list [type]` | What skills/hooks/settings are installed? |
| `lens audit` | Any configuration problems? |
| `lens profile list` | What profiles are available? |
| `lens canon list` | Browse the knowledge library (~88 canons) |
| `lens workflow status` | Check if installed skills are up to date |

### Layer 2: Skills (inside Claude Code)

What users type in Claude Code conversations after `lens init`.

**Quick commands:**

| Command | What it does | External tools needed |
|---------|-------------|----------------------|
| `/build [path]` | Full 8-phase pipeline: plan, code, review, test, evaluate | Codex CLI, Gemini MCP, Qodana MCP |
| `/improve [path]` | Same pipeline on existing code (skips reference phase) | Codex CLI, Gemini MCP, Qodana MCP |
| `/fix [path]` | Fast loop: Codex reviews, Claude fixes, Codex verifies | Codex CLI |
| `/change [desc]` | One small change, clean up, done | None |

**Read-only scans:**

| Command | What it does | External tools needed |
|---------|-------------|----------------------|
| `/gemini-scan [path]` | Gemini code review | Gemini MCP |
| `/codex-scan [path]` | Codex code review | Codex CLI |
| `/qodana-scan [path]` | Static analysis | Qodana MCP |
| `/code-scan [path]` | 13-dimension quality scoring | None |
| `/ai-smell-scan [path]` | Detect AI-generated code patterns | None |
| `/naming-scan [path]` | Check name clarity | None |
| `/deadcode-scan [path]` | Find unused code | None |
| `/dedupe-scan [path]` | Find duplicated code | None |
| `/refactor-scan [path]` | Find refactoring opportunities | None |
| `/canon-audit <canon>` | Audit code against a canon's rules | None |

**Fix + review:**

| Command | What it does | External tools needed |
|---------|-------------|----------------------|
| `/ai-smell-fix [path]` | Remove AI code smells | None |
| `/generate-docs [path]` | Generate documentation | None |

**Utilities:**

| Command | What it does |
|---------|-------------|
| `/lens` | Home base — status and help |

### Layer 3: Pipeline Orchestrator (`pipeline.sh`)

A bash script that `/build` and `/improve` call under the hood. It spawns 8 separate `claude -p` sessions — one per phase, each with a fresh context window. State passes between phases via `.claude/build-log/` files.

Users don't interact with pipeline.sh directly. The `/build` and `/improve` skills invoke it.

**The 8 phases:**

```
Phase 0: Reference (build only) — Opus builds a reference implementation
Phase 1: Plan         — Read canons + lessons, create implementation plan
Phase 2: Structure    — Design types and architecture from the plan
Phase 3: Implementation — Write code with compile loop + quality gate
Phase 4: Refactoring  — Fix all issues (functions >30 lines, complexity >10, etc.)
Phase 5: Deduplication — Consolidate duplicate code
Phase 6: Review       — 4 parallel scans (Gemini + Codex + Qodana + AI smell), then fix
Phase 7: Testing      — Write and run tests (must pass)
Phase 8: Evaluation   — Score/fix loop (up to 3 iterations), write lessons learned
```

## What `lens init` Creates in a Project

```
my-project/
├── .claude/
│   ├── skills/              # ~10 workflow commands (slash commands)
│   ├── canon/               # domain expertise canons (per profile)
│   ├── rubric/              # scoring rubrics (14 files)
│   ├── scripts/             # quality gate
│   ├── plans/               # empty writable dir (pipeline writes here)
│   ├── workflow-manifest.json
│   ├── canon-manifest.json
│   └── universal-lessons.md # seeded copy (writable, grows over time)
├── .mcp.json                # gemini-reviewer + qodana MCP servers
└── CLAUDE.md                # commands, standards, anti-patterns, auto-invoke
```

Skills and canons are copied (not symlinked) for portability. Only `.claude/skills/` contains slash commands (~10 workflow skills like `/fix`, `/change`, `/code-scan`). Canons live in `.claude/canon/` as reference material read by `/fix` and `/canon-audit`. To update after upgrading the package, run `lens init --force`.

## Two Types of Knowledge

### Canon Skills (~88): Domain Expertise

Teach Claude *how to think* about a topic. Loaded during writing phases (1-5).

"Think in sets, not loops." "Handle failure explicitly." "Use const by default."

Live in `canon/` organized by domain: javascript, python, security, react, sql, ui-ux, testing, etc.

### Rubrics (14): Scoring Criteria

Tell reviewers *what to check* and *how to score*. Loaded during review phases (6-8).

"Score 1-10: Are all error paths explicit? No swallowed exceptions? Cause chains preserved?"

Live in `workflow-skills/rubric/`. Auto-detected by domain — `AUTO-DETECT.md` controls which rubrics load based on what's in the code.

### How They Work Together

```
Canons (phases 1-5)              Rubrics (phases 6-8)
"Write code like this"    →      "Grade the code against this"
                          ←      Lessons feed back for next run
```

Canons teach. Rubrics judge. Lessons bridge the gap.

## Profiles

Profiles specify which canon skills to install and what standards to enforce. There are 15 built-in profiles:

| Profile | For |
|---------|-----|
| `software-base` | Base for all projects |
| `javascript` | JS/TS (extends software-base) |
| `typescript-cli` | CLI tools in TypeScript |
| `react` | React |
| `nextjs` | Next.js |
| `angular` | Angular |
| `python` | Python |
| `java` | Java |
| `csharp` | C# |
| `sql` | SQL and databases |
| `security` | Security focus (combine with any other) |
| `d3` | D3 visualization |
| `frontend` | Generic frontend |
| `nextjs-d3` | Next.js + D3 |
| `business-base` | Business/strategy |

`lens init` auto-detects the right profile from your project's `package.json`, `requirements.txt`, `pom.xml`, etc. You can override with `--profile`.

Profiles can be combined: `lens init --profile sql+security` loads both.

## MCP Server Dependencies

Two MCP servers ship with the package and get configured in `.mcp.json` by `lens init`:

| Server | Used By | Requires |
|--------|---------|----------|
| gemini-reviewer | `/gemini-scan`, pipeline phase 6 | `GEMINI_API_KEY` env var |
| qodana | `/qodana-scan`, pipeline phase 6 | (none) |

The Codex CLI (`codex`) is called directly by `/codex-scan` and `/fix` — it's not an MCP server. Users install it separately.

Skills that don't need external tools (`/code-scan`, `/ai-smell-scan`, `/change`, etc.) work with zero setup.

## Self-Learning Loop

The pipeline gets smarter over time:

1. Phases 6-8 find issues and write them to `.claude/lessons.md` (project-specific) and `.claude/universal-lessons.md` (general patterns)
2. On the next pipeline run, phases 1-5 read those lesson files
3. Claude avoids making the same mistakes

Phase 8 also writes `.claude/eval-proposals.md` — suggestions for pipeline or config changes that a human reviews.

## Updating

```bash
npm update -g @objective-arts/lens    # get latest skills, canons, rubrics
cd my-project
lens init --force                     # re-symlink to updated package
```

Because projects use copies, `--force` re-copies everything from the updated package.
