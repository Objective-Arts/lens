# Lens

> Embed domain expertise into Claude Code workflows.

**@objective-arts/lens** v0.4.0

Lens distills expertise from renowned engineers into composable "skills" that Claude applies during development. Quality enters at write-time, not review-time.

## What It Does

- **88 canon skills** across 30 categories — from clarity (Kernighan) to security-mindset to React state (Abramov) to visualization (Tufte)
- **15 composable profiles** — bundle skills for project types (`javascript+react+security`)
- **12 shipped workflow skills** — 4 workflow commands + 8 read-only scans/utilities
- **Quality rubrics** — domain-specific review criteria (TypeScript, React, C#, security, and more)

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
/fix src/auth                 # Canon review + quality gate + fix + verify
/change add email field       # Simple change + cleanup
/code-scan src/               # 13-dimension code scan (read-only)
/canon-audit typescript src/  # Audit against a canon's rules
```

## Shipped Slash Commands

After applying a profile, these slash commands are available in Claude Code:

### Workflow Commands

| Command | What it does |
|---------|-------------|
| `/build <description>` | Plan + build + quality gate + canon fix + verify |
| `/improve <path>` | Plan + improve + quality gate + canon fix + verify |
| `/fix <path>` | Canon review + quality gate, fix findings, verify — Claude-native, no external models |
| `/change <description>` | Simple change + cleanup + report |

### Read-Only Scans

| Command | What it does |
|---------|-------------|
| `/code-scan <path>` | 13-dimension code scan report |
| `/ai-smell-scan <path>` | AI antipattern report (9 categories) |
| `/deadcode-scan <path>` | Unused code detection |
| `/naming-scan <path>` | Naming convention issues |
| `/refactor-scan <path>` | Refactoring opportunities |
| `/dedupe-scan <path>` | Duplication report |
| `/canon-audit <canon> [path]` | Audit project against a canon's rules |
| `/generate-docs <path>` | Generate documentation |

## CLI Commands

```bash
# Profiles
lens profile list                  # Show available profiles
lens profile apply python+sql .    # Configure project
lens profile show javascript       # Profile details

# Canon skills
lens canon list                    # Show all 88 skills
lens canon status                  # Installed vs source state
lens canon deploy                  # Install skills to project
lens canon upgrade                 # Update outdated skills

# Workflow skills
lens workflow list                 # Show workflow skills
lens workflow status               # Check installed state
lens workflow push                 # Push updates to all registered projects

# Scanning
lens scan                          # Discover all Claude Code config
lens scan audit                    # Configuration audit
lens scan tokens                   # Token usage breakdown

# Code analysis
lens dedupe src/                   # Scan for duplication patterns
lens trace clarity                 # Show skill configuration stack
```

## Profiles

Composable with `+` syntax. Examples: `javascript+react+security`, `python+sql`, `nextjs+d3+sql`.

| Profile | Extends | Focus |
|---------|---------|-------|
| `software-base` | — | Foundational engineering (clarity, pragmatism, simplicity, composition, testing, security-mindset) |
| `javascript` | software-base | JS/TS, functional, safety, performance, internals |
| `react` | javascript | React state, hooks, reactivity |
| `nextjs` | react | Next.js App Router patterns |
| `angular` | javascript | Angular core, architecture, performance, RxJS |
| `d3` | javascript | D3, charts, dashboards, data stories, UI/UX |
| `nextjs-d3` | d3 | Next.js + D3 fullstack |
| `python` | software-base | Pythonic idioms, protocols, patterns |
| `java` | software-base | Effective Java |
| `csharp` | software-base | C# in Depth, async, type systems, .NET patterns |
| `typescript-cli` | software-base | Node.js CLI/backend (no frontend) |
| `sql` | — | SQL, query performance, data-first, security |
| `frontend` | — | UI/UX design (Tufte, Nielsen, Cooper) |
| `security` | — | Security-focused (composable with any tech profile) |
| `business-base` | — | Strategy, leadership, moats, competition, platforms |

## Project Structure

```
lens/
├── canon/              # 88 canon skills in 30 categories
├── profiles/           # 15 composable project profiles
├── src/                # TypeScript source
│   ├── cli/            # CLI commands (profile, canon, workflow, scan, dedupe, trace)
│   ├── canon/          # Skill loading, hashing, deployment
│   ├── profiles/       # Profile composition and application
│   ├── workflow/       # Workflow skill management
│   ├── scanner/        # Project configuration scanner
│   ├── trace/          # YAML configuration tracing
│   └── utils/          # Shared utilities
├── workflow-skills/    # Workflow + utility skills
│   ├── workflow/       # Pipeline and fix commands
│   ├── utils/          # Read-only scans + utilities
│   └── rubric/         # Quality rubrics (base, TypeScript, React, C#, security, etc.)
├── config/             # Keyword detection and workflow phase config
└── scripts/            # Pipeline orchestrator, quality gate
```

## License

Proprietary — Objective Arts LLC. See [LICENSE](LICENSE).
