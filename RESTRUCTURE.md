# Lens Restructure — One Install, Every Project

## The Big Picture

Lens becomes a globally installed npm package. Projects get two dotfile directories and nothing else.

```
npm install -g @objective-arts/lens    ← Install once
cd any-project
lens init                              ← Connect Claude Code skills
lens scan                              ← Analyze code, write results
lens open                              ← View results in browser
```

---

## What Changes for a Project

### Before (today)

A project using Lens needs copied or symlinked canons, skills, pipeline scripts, and profiles. Updating Lens means updating every copy. Skills drift out of sync (we found 4 diverged copies in `.claude/skills/` — now fixed by `normalize-skills.sh`).

### After

```
my-project/
├── src/                    ← Your code (unchanged)
├── package.json            ← Your package (unchanged)
├── .claude/                ← Created by `lens init`
│   ├── skills/
│   │   ├── fix → <installed-package>/.claude/skills/fix
│   │   ├── build → <installed-package>/.claude/skills/build
│   │   ├── improve → <installed-package>/.claude/skills/improve
│   │   └── ... (14 symlinks total)
│   └── CLAUDE.md           ← Generated from detected profile
└── .lens/                  ← Created by `lens scan`
    ├── project.json        ← Identity + metadata
    └── runs/
        └── 2026-02-25T10-30-00Z.json  ← Score, findings, dimensions
```

Two dotfile directories. Symlinks point to the installed package — updates happen in one place, apply everywhere.

---

## What Changes in the Lens Repo

The repo structure stays the same. No directories move. The changes are:

### Already Done

| Change | Status |
|--------|--------|
| `package.json` — `files` field added | ✅ Done |
| Skills normalized — all `.claude/skills/` entries are symlinks to `workflow-skills/` | ✅ Script ready (`scripts/normalize-skills.sh`) |

### To Be Built (via `/build --prd prd-installable-package.md`)

| Change | What |
|--------|------|
| `src/paths.ts` | Runtime asset path resolution — finds canons, profiles, skills relative to package install location, falls back to repo root for dev mode |
| Update all `src/` path references | Every module that reads canons, profiles, skills, config switches from relative paths to the `PATHS` module |
| `src/cli/commands/init.ts` | `lens init` command — creates `.claude/skills/` symlinks + generates `CLAUDE.md` |
| `src/output/types.ts` | TypeScript types for `.lens/` output schema |
| `src/output/json-adapter.ts` | Writes scan/fix results as JSON to `.lens/runs/` |
| `src/cli/index.ts` | Register `init` command |

---

## How It Works

### The Engine (installed globally)

```
~/.npm-global/lib/node_modules/@objective-arts/lens/
├── dist/              ← Compiled CLI + TypeScript source
├── canon/             ← 75 canons (markdown + YAML)
├── profiles/          ← 15 language/framework profiles (YAML)
├── workflow-skills/   ← 38 workflow + utility skills
├── .claude/
│   ├── skills/        ← 14 Claude Code skill definitions (symlinks to workflow-skills/)
│   ├── phases/        ← Pipeline phase definitions
│   ├── rubric/        ← Evaluation rubrics
│   ├── plans/         ← Pre-built plans
│   └── config/        ← Internal config
├── config/            ← Keyword detection, workflow phases
├── scripts/
│   ├── pipeline.sh    ← Pipeline orchestrator
│   └── reset.sh       ← Reset utility
└── mcp-servers/       ← Gemini, Qodana integrations
```

This is exactly what's in the repo today — `npm pack` bundles it per the `files` field in `package.json`.

### Path Resolution (`src/paths.ts`)

The key module. When code needs to read a canon:

```typescript
import { PATHS } from '../paths.js';

// PATHS.canons resolves to:
// 1. Primary:  <package-install-dir>/canon/     (global install)
// 2. Fallback: <repo-root>/canon/               (dev mode)
const canonPath = join(PATHS.canons, 'sql', 'SKILL.md');
```

Dual resolution means:
- `npm run dev` from the repo → works (fallback to repo root)
- `lens scan` after global install → works (resolves from package dir)
- No big bang migration — both modes coexist

### `lens init` — Connecting a Project

```bash
cd my-project
lens init
```

1. Detects language/framework from `package.json`, file extensions, config files
2. Creates `.claude/skills/` with symlinks to the installed package
3. Generates `.claude/CLAUDE.md` from the matching profile

**Migration handling for existing projects:**

| Existing State | What `lens init` Does |
|---------------|----------------------|
| No `.claude/` directory | Creates from scratch |
| `.claude/skills/` with copied files | Replaces with symlinks, warns user |
| `.claude/skills/` with old symlinks | Replaces with symlinks to installed package |
| `.claude/CLAUDE.md` exists | Merges Lens section between `<!-- LENS:START -->` / `<!-- LENS:END -->` markers |
| Copied `canon/`, `workflow-skills/`, `profiles/` in project | Warns user they can be deleted |

### `lens scan` — Analyzing Code

```bash
cd my-project
lens scan
```

1. Reads canons from the installed package (via `PATHS`)
2. Runs the code-scan analysis on the current directory
3. Writes `.lens/project.json` + `.lens/runs/{timestamp}.json`
4. Prints terminal summary (score, top findings, `lens open` hint)

### `.lens/` Output Schema

**`.lens/project.json`** — Project identity:

```json
{
  "version": 1,
  "id": "my-project",
  "name": "my-project",
  "path": "/Users/steve/local-tech-projects/my-project",
  "language": "typescript",
  "framework": "express",
  "createdAt": "2026-02-25T09:00:00Z",
  "updatedAt": "2026-02-25T10:30:00Z"
}
```

**`.lens/runs/{timestamp}.json`** — Scan results:

```json
{
  "version": 1,
  "id": "2026-02-25T10-30-00Z",
  "mode": "scan",
  "startedAt": "2026-02-25T10:30:00Z",
  "completedAt": "2026-02-25T10:31:14Z",
  "durationMs": 74000,
  "score": { "total": 72, "max": 100, "verdict": "needs-attention" },
  "dimensions": [
    { "name": "Structure",          "score": 8, "max": 10 },
    { "name": "Clarity",            "score": 7, "max": 10 },
    { "name": "Data Design",        "score": 6, "max": 10 },
    { "name": "Error Handling",     "score": 5, "max": 10 },
    { "name": "Security",           "score": 4, "max": 10 },
    { "name": "Framework Idioms",   "score": 8, "max": 10 },
    { "name": "Dead Code",          "score": 9, "max": 10 },
    { "name": "AI Smells",          "score": 7, "max": 10 },
    { "name": "Duplication",        "score": 6, "max": 10 },
    { "name": "Consistency",        "score": 8, "max": 10 },
    { "name": "Type Safety",        "score": 5, "max": 10 },
    { "name": "Dependency Health",  "score": 7, "max": 10 },
    { "name": "Conversion Residue", "score": 9, "max": 10 }
  ],
  "summary": { "critical": 3, "high": 5, "medium": 12, "low": 7 },
  "findings": [
    {
      "id": "f-001",
      "severity": "critical",
      "dimension": "Security",
      "title": "SQL injection risk",
      "description": "User input concatenated into SQL query.",
      "file": "src/auth/login.ts",
      "line": 47,
      "suggestion": "Use parameterized queries.",
      "canon": "security-mindset",
      "status": "open"
    }
  ]
}
```

**Score conversion from current pipeline:**

| Current Pipeline | UI Schema |
|-----------------|-----------|
| `CODE_SCAN_INDEX` 0-130 (penalty, lower=better) | `score.total` 0-100 (quality, higher=better): `Math.round(100 - (index / 130) * 100)` |
| Dimension penalties (critical=3, warning=2, obs=1) | `dimensions[].score` 0-10: `Math.max(0, 10 - penaltyPoints)` |
| Severity: Critical/Warning/Observation | `critical` / `high` / `medium` (+ `low` for style items) |
| Score 90-100 | `production-ready` |
| Score 70-89 | `needs-attention` |
| Score 50-69 | `needs-work` |
| Score 0-49 | `needs-rework` |

---

## How the UI Reads This

The Lens UI (Next.js, separate project in `lens-ui/`) is a viewer. It reads `.lens/` directories — it never writes to them, never talks to the CLI.

**Discovery:** The UI gets one environment variable — `LENS_ROOT` (defaults to `~/local-tech-projects/`). On startup, it walks immediate children looking for `.lens/` folders. Any directory with one is a Lens project.

**Data flow:**

```
lens scan (terminal)
    │
    ├── reads canons from installed package
    ├── analyzes code in current directory
    └── writes JSON to .lens/runs/

lens open (terminal)
    │
    └── starts Next.js dev server → browser

Next.js (browser)
    │
    ├── reads LENS_ROOT env var
    ├── scans for .lens/ directories
    ├── reads project.json + runs/*.json
    └── renders: score, dimensions, findings
```

No database. No API. No accounts. Just JSON files on disk.

---

## Package Size

| Asset | Size |
|-------|------|
| `dist/` | ~500KB |
| `canon/` (75 canons) | ~2MB |
| `profiles/` (15 YAML) | ~50KB |
| `workflow-skills/` (38 skills) | ~1.5MB |
| `.claude/` (skills, rubrics, phases) | ~500KB |
| `config/` | ~10KB |
| `scripts/` | ~45KB |
| `mcp-servers/` | ~200KB |
| **Total** | **~5MB** |

---

## Build Order

The PRD (`prd-installable-package.md`) is ready. Run it through the pipeline:

```
/build src --prd prd-installable-package.md
```

The pipeline will execute these requirements in order:

| Step | What | Why |
|------|------|-----|
| 1 | `src/paths.ts` — dual-resolution path module | Foundation — everything else depends on this |
| 2 | Update all `src/` path references | Make existing CLI work from global install |
| 3 | `src/cli/commands/init.ts` — init command | Projects can connect to installed engine |
| 4 | `src/output/types.ts` + `json-adapter.ts` | Structured output for UI |
| 5 | Register init command in CLI | Wire it up |
| 6 | `npm pack` + test global install | Verify everything works |

---

## What's Out of Scope

| Feature | When |
|---------|------|
| `lens open` (web UI launcher) | Separate PRD, after this ships |
| Web UI redesign (4 screens from UX doc) | After JSON output exists |
| CI/CD integration | After CLI is stable as global install |
| Team features | Future |
| Canon content or pipeline logic changes | Never — this is infrastructure only |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `prd-installable-package.md` | The PRD for the `/build` pipeline |
| `lens-ui/docs/UX-DESIGN.md` | UI design (scan → see → fix) |
| `lens-ui/docs/SCHEMA.md` | Detailed JSON schema with TypeScript types |
| `scripts/normalize-skills.sh` | Skills normalization (prerequisite, run first) |
