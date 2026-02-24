# Lens

> Embed domain expertise into Claude Code workflows.

**@objective-arts/lens** v0.4.0

Lens distills expertise from renowned engineers into composable "skills" that Claude applies during development. Quality enters at write-time, not review-time.

## What It Does

- **77 canon skills** across 29 categories — from clarity (Kernighan) to security-mindset to React state (Abramov) to visualization (Tufte)
- **15 composable profiles** — bundle skills for project types (`javascript+react+security`)
- **8-phase quality pipeline** with learning loop, machine gates (Gemini, Qodana), and canary validation
- **Bash pipeline orchestrator** — run `/build` and `/improve` as isolated `claude -p` sessions (no context exhaustion)
- **Self-learning feedback** — late phases write lessons that early phases read on future runs
- **33 workflow skills** — 17 pipeline/fix skills + 16 read-only scans and utilities

## Quick Start

```bash
# Install globally
npm install -g @objective-arts/lens

# Configure a project
cd /your/project
lens profile apply javascript+security

# Check what's installed
lens scan

# Use in Claude Code
/build src/feature            # Full 8-phase pipeline
/improve src/module           # Quality pass on existing code
/change add email field       # Simple change + cleanup
/fix src/auth                 # Fast fix loop (Codex → fix → verify)
```

## Two Ways to Run the Pipeline

### 1. In-Session (Claude Code slash commands)

Runs all phases within one Claude Code conversation. Simple, but long pipelines can exhaust the context window.

```bash
/build src/feature
/improve src/module
```

### 2. Bash Orchestrator (`pipeline`)

Each phase spawns its own `claude -p` session — full context window per phase, file-based handoff via `.claude/build-log/`.

```bash
# From any project with lens workflow installed
pipeline build src/auth --prd docs/requirements.md
pipeline improve --fast "Wire ScoreEntryForm per docs/plan.md Phase A"
pipeline build --dry-run src/feature    # Preview phases
pipeline improve --from review src/mod  # Resume from phase 6
pipeline build --rollback               # Undo last build
```

Flags: `--fast` (sonnet for phase 3, parallel 4+5), `--prd FILE`, `--desc "..."`, `--from N|name`, `--rollback`, `--dry-run`

## Pipeline Phases

```
Phase 0  reference       (opus)    Build from PRD — build only
Phase 1  plan            (sonnet)  Analyze, design hardening work
Phase 2  structure       (sonnet)  Architecture, types, boundaries
Phase 3  implementation  (opus)    Code with compile loop (max 5 iterations)
         ── quality gate ──        Lint + code pattern checks
Phase 4  refactoring     (sonnet)  Structural cleanup
Phase 5  deduplication   (haiku)   Consolidate patterns
Phase 6  review          (sonnet)  4 parallel scans → dedup → fix → canary validate
Phase 7  testing         (sonnet)  Write + run tests
Phase 8  evaluation      (sonnet)  Codex scores 7 dimensions, fix loop (max 3)
         ── quality gate ──        npm test + lint + pattern checks
```

## CLI Commands

| Command | Purpose |
|---------|---------|
| `lens` | Profile management, canon skills, scanning, workflow |
| `pipeline` | Bash orchestrator — isolated sessions per phase |
| `lens-reset` | Reset configuration to defaults |

### Key Subcommands

```bash
# Profiles
lens profile list                  # Show available profiles
lens profile apply python+sql .    # Configure project
lens profile show javascript       # Profile details

# Canon skills
lens canon list                    # Show all 77 skills
lens canon status                  # Installed vs source state
lens canon deploy                  # Install skills to project
lens canon upgrade                 # Update outdated skills

# Workflow skills
lens workflow list                 # Show 33 workflow skills
lens workflow status               # Check installed state
lens workflow push                 # Push updates to all registered projects

# Scanning
lens scan                          # Discover all Claude Code config
lens scan audit                    # Configuration audit
lens scan tokens                   # Token usage breakdown

# MCP servers
lens mcp list                      # Available MCP servers
lens mcp check                     # Verify env vars

# Code analysis
lens dedupe src/                   # Scan for duplication patterns
lens trace clarity                 # Show skill configuration stack
```

## In Claude Code (Slash Commands)

After applying a profile, these slash commands are available:

### Pipelines

| Command | What it does |
|---------|-------------|
| `/build <target>` | New feature — 8 phases from PRD to evaluation |
| `/improve <path>` | Quality pass — 8 phases on existing code |
| `/fix <path>` | Fast loop — Codex reviews, Claude fixes, Codex verifies |
| `/change <description>` | Simple change + cleanup |

### Fix/Review Skills

| Command | What it does |
|---------|-------------|
| `/gemini-review <path>` | Gemini scan + fix all findings |
| `/codex-review <path>` | Codex pattern scan + fix |
| `/qodana-review <path>` | Static analysis + fix every issue |
| `/ai-smell-fix <path>` | Remove 9 AI antipattern categories |
| `/refactoring <path>` | Structural refactoring with verification |
| `/security-review <path>` | Security-focused review + fix |

### Read-Only Scans

| Command | What it does |
|---------|-------------|
| `/gemini-scan <path>` | Code review report |
| `/codex-scan <path>` | Codex pattern report |
| `/qodana-scan` | Static analysis report |
| `/ai-smell-scan <path>` | AI antipattern report |
| `/code-scan <path>` | 13-dimension code scan report |
| `/dedupe-scan <path>` | Duplication report |
| `/naming-scan <path>` | Naming convention issues |
| `/deadcode-scan <path>` | Unused code detection |
| `/refactor-scan <path>` | Refactoring opportunities |
| `/canon-audit <canon> [path]` | Audit project against a canon's rules |

### Utilities

| Command | What it does |
|---------|-------------|
| `/lens` | Status and help |
| `/generate-docs <path>` | Generate documentation |
| `/run-tests` | Execute test suite |
| `/explain-skill <skill>` | Explain what a skill does |

## Profiles

Composable with `+` syntax. Examples: `javascript+react+security`, `python+sql`, `nextjs+d3+sql`.

| Profile | Extends | Canon Skills | Focus |
|---------|---------|:------------:|-------|
| `software-base` | — | 18 | Foundational engineering (clarity, pragmatism, simplicity, composition, testing) |
| `javascript` | software-base | 18 | JS/TS, functional, safety, performance, internals |
| `react` | javascript | 1 | React state management and reactivity |
| `nextjs` | react | 1 | Next.js App Router patterns |
| `angular` | javascript | 4 | Angular core, architecture, performance, RxJS |
| `d3` | javascript | 5 | D3, charts, dashboards, data stories, UI/UX |
| `nextjs-d3` | d3 | 4 | Next.js + D3 + Supabase fullstack |
| `python` | software-base | 4 | Pythonic idioms, protocols, patterns, advanced |
| `java` | software-base | 1 | Effective Java |
| `csharp` | software-base | 4 | C# in Depth, async, type systems |
| `typescript-cli` | software-base | 8 | Node.js CLI/backend (no frontend) |
| `sql` | — | 4 | SQL, query performance, data-first, security |
| `frontend` | — | 12 | UI/UX design (Tufte, Nielsen, Cooper) |
| `security` | — | 7 | Security-focused (composable with any tech profile) |
| `business-base` | — | 5 | Strategy, leadership, moats, competition, platforms |

## Project Structure

```
lens/
├── canon/              # 77 canon skills in 29 categories
├── profiles/           # 15 composable project profiles
├── src/                # TypeScript source
│   ├── cli/            # CLI commands (profile, canon, workflow, scan, mcp, dedupe, trace)
│   ├── canon/          # Skill loading, hashing, deployment
│   ├── profiles/       # Profile composition and application
│   ├── workflow/       # Workflow skill management
│   ├── scanner/        # Project configuration scanner
│   ├── trace/          # YAML configuration tracing
│   └── utils/          # Shared utilities
├── workflow-skills/    # 33 workflow + utility skills
│   ├── workflow/       # 17 pipeline/fix skills
│   ├── utils/          # 16 read-only scans + utilities
│   └── rubric/         # Quality rubrics (base, product-quality, domain-specific)
├── scripts/            # Pipeline orchestrator, quality gate, reset
├── mcp-servers/        # Gemini reviewer, Qodana
└── documentation/      # Diataxis-organized docs
```

## Quality Enforcement

The pipeline enforces quality at every phase:

- **Quality gates** after phases 3 and 8 — polyglot linting (ESLint, Qodana), security checks, naming/size/complexity rules
- **Canary validation** in phase 6 — planted violations must be caught by reviewers
- **Score-fix loop** in phase 8 — 7 dimensions scored 1-10, iterate until all reach 9+
- **Self-learning** — evaluation findings written to lessons files, read by future pipeline runs
- **Rollback** — git stash before pipeline starts, restore with `--rollback`

## MCP Servers

Bundled and configured automatically when profiles are applied:

| Server | Purpose |
|--------|---------|
| `gemini-reviewer` | Gemini-powered code review (requires `GEMINI_API_KEY`) |
| `qodana` | JetBrains static analysis |

## License

Proprietary — Objective Arts LLC. See [LICENSE](LICENSE).
