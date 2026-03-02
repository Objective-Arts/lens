# Lens System Overview

Lens is a CLI tool that makes Claude Code better at reviewing and writing code by injecting domain expertise, quality workflows, and independent review tools into any project.

## The Core Idea

Claude Code is a general-purpose AI. Lens makes it a specialist. When you point `/canon-audit sql` at a database layer, Claude reviews with the same depth as a senior DBA. When you run `/fix` on a React codebase, Claude catches patterns a React expert would flag. When you `/code-scan` inherited code, you get a 13-dimension quality assessment.

This works equally well on code you wrote and code you didn't. Reviewing inherited codebases, auditing vendor code, onboarding to unfamiliar projects — these are first-class use cases, not afterthoughts.

## Install and Use

```bash
npm install -g @objective-arts/lens    # install once
cd any-project                         # your code, inherited code, vendor code
lens init                              # auto-detects stack, sets up everything
```

After init, open Claude Code. Review existing code or write new:

```
/code-scan src/                        # 13-dimension quality review
/canon-audit sql src/db/               # audit against SQL canon
/fix src/                              # review + fix + verify
/change add input validation           # write a small change
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          YOUR TERMINAL                                  │
│                                                                         │
│  lens init ─── auto-detect stack ─── load profile ───┐                 │
│  lens scan        lens profile list    lens audit     │                 │
│  lens canon list  lens workflow status                │                 │
│                                                       │                 │
│                                        Creates in your project:         │
│                                                       │                 │
│  ┌────────────────────────────────────────────────────▼──────────┐      │
│  │                     YOUR PROJECT                              │      │
│  │                                                               │      │
│  │  .claude/skills/  ──copies──▶  14 slash commands              │      │
│  │  .claude/canon/   ──copies──▶  domain expertise (per profile) │      │
│  │  .claude/rubric/  ──copies──▶  scoring rubrics                │      │
│  │  .mcp.json        ──points to──▶ gemini-reviewer, qodana     │      │
│  │  CLAUDE.md        (standards, anti-patterns, auto-invoke)     │      │
│  └───────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        CLAUDE CODE SESSION                              │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │                   Slash Commands (14 shipped)                  │      │
│  │                                                               │      │
│  │  REVIEW EXISTING CODE          WRITE + FIX                    │      │
│  │  /code-scan     /gemini-scan   /fix        /change            │      │
│  │  /canon-audit   /codex-scan    /build      /improve           │      │
│  │  /ai-smell-scan /deadcode-scan /ai-smell-fix                  │      │
│  │                                /generate-docs                 │      │
│  │                                                               │      │
│  │  UTILITY                                                      │      │
│  │  /lens (status + help)                                        │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                         │
│  Canon skills loaded by profile ──▶ inform both review and writing      │
│  Rubrics loaded by domain ────────▶ score review findings               │
│                                                                         │
│  Optional external tools:                                               │
│  ┌──────────────┐  ┌──────────┐                                        │
│  │ Gemini (MCP) │  │Qodana MCP│                                        │
│  │ /gemini-scan │  │static    │                                        │
│  │              │  │analysis  │                                        │
│  └──────────────┘  └──────────┘                                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     INSTALLED PACKAGE (source of truth)                  │
│                                                                         │
│  canon/              88 domain expertise skills in 30 categories        │
│  profiles/           15 YAML profiles (which canons + standards)        │
│  workflow-skills/    33 skills (14 shipped as slash commands)            │
│  workflow-skills/rubric/  16 scoring rubrics                            │
│  mcp-servers/        gemini-reviewer, qodana                            │
│  config/             hooks and settings templates                       │
│  dist/               compiled CLI                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Two Modes of Operation

### Reviewing Existing Code

Point any scan or audit at code you want to understand or improve. The code doesn't need to be yours.

| Command | What it does | Needs external tools |
|---------|-------------|----------------------|
| `/code-scan [path]` | 13-dimension quality scoring | No |
| `/canon-audit <canon> [path]` | Audit against a canon's expert rules | No |
| `/fix [path]` | Review against canons, fix findings, verify | No |
| `/ai-smell-scan [path]` | Detect AI-generated code patterns | No |
| `/deadcode-scan [path]` | Find unused code | No |
| `/gemini-scan [path]` | Independent Gemini review | Gemini API key |
| `/codex-scan [path]` | Independent Codex review | Codex CLI |

Example workflow for inherited code:

```
/code-scan src/                     # get the big picture
/canon-audit sql src/db/            # deep-dive the database layer
/canon-audit security src/auth/     # audit auth against security canon
/fix src/db/                        # fix what was found
```

### Writing New Code

When you build or change code, the same canons inform what Claude writes.

| Command | What it does | Needs external tools |
|---------|-------------|----------------------|
| `/change [desc]` | One small change, done right | No |
| `/fix [desc]` | Build from description, review, fix | No |
| `/build [path]` | Full pipeline: plan, build, review, test | No (optional: Gemini, Qodana) |
| `/improve [path]` | Full pipeline on existing code | No (optional: Gemini, Qodana) |
| `/ai-smell-fix [path]` | Remove AI code smells | No |
| `/generate-docs [path]` | Generate documentation | No |

## Two Types of Knowledge

### Canon Skills (88 in 30 categories)

Domain expertise that teaches Claude *how to think* about a topic. Loaded when reviewing or writing code.

Examples: "Think in sets, not loops" (SQL). "Handle failure explicitly" (error handling). "Use const by default" (TypeScript). "Server Components for data, Client Components for interaction" (React).

Organized by domain: `javascript/`, `python/`, `security/`, `react/`, `database/sql/`, `testing/`, `ui-ux/`, `csharp/`, etc.

When you run `/canon-audit sql src/`, Claude loads the SQL canons and reviews your code against those specific expert rules. When you run `/fix src/`, Claude loads whichever canons match the detected file types.

### Rubrics (16 files)

Scoring criteria that tell reviewers *what to check* and *how to score*. Used during review commands and the pipeline's review phases.

Examples: "Score 1-10: Are all error paths explicit? No swallowed exceptions? Cause chains preserved?" Domain-specific rubrics (C#, React, TypeScript, security) add criteria like "Are DI lifetimes correct?" or "Are Server vs Client Components used appropriately?"

Auto-detected by domain — `AUTO-DETECT.md` loads the right rubrics based on what's in the code.

### How They Work Together

```
Canons                              Rubrics
"Write/review code like this"  →    "Grade the code against this"
                               ←    Lessons feed back for next run
```

Canons teach. Rubrics judge. Both work for review and for writing.

## Profiles

Profiles bundle which canons to install and what standards to enforce. Lens ships 15:

| Profile | For |
|---------|-----|
| `software-base` | Base for all software projects |
| `javascript` | JS/TS (extends software-base) |
| `typescript-cli` | CLI tools in TypeScript |
| `react` | React |
| `nextjs` | Next.js |
| `angular` | Angular |
| `python` | Python |
| `java` | Java |
| `csharp` | C# / .NET |
| `sql` | SQL and databases |
| `security` | Security focus (combine with any) |
| `d3` | D3 visualization |
| `frontend` | Generic frontend |
| `nextjs-d3` | Next.js + D3 |
| `business-base` | Business/strategy |

`lens init` auto-detects the right profile. Combine profiles for focused review: `lens init --profile sql+security` loads both SQL and security canons.

## MCP Server Dependencies

Two MCP servers ship with the package and get configured in `.mcp.json` by `lens init`:

| Server | Used by | Requires |
|--------|---------|----------|
| gemini-reviewer | `/gemini-scan` | `GEMINI_API_KEY` env var |
| qodana | Static analysis | Docker (optional) |

Most commands work without any external tools. `/fix`, `/change`, `/code-scan`, `/canon-audit`, `/ai-smell-scan`, `/deadcode-scan` are all Claude-native — zero setup beyond `lens init`.

## Self-Learning Loop

The pipeline (`/build`, `/improve`) gets smarter over time:

1. Review phases find issues and write them to `.claude/lessons.md` (project-specific) and `.claude/universal-lessons.md` (general patterns)
2. On the next run, earlier phases read those lesson files
3. Claude avoids making the same mistakes

This feedback loop bridges review findings and writing quality — what gets caught in review informs future code generation.

## Updating

```bash
npm update -g @objective-arts/lens    # get latest canons, rubrics, skills
cd your-project
lens init --force                     # re-copy updated assets into project
```
