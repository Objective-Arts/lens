# Lens Restructure — One Install, Every Project

## The Problem

Today, using Lens on a project means one of:
- Working inside the Lens repo itself
- Copying or symlinking canons, skills, and pipeline scripts into the target project
- Manually referencing file paths to the Lens repo

This doesn't scale. Every project needs a pile of Lens files, and updating Lens means updating every copy.

## The Goal

```
npm install -g @objective-arts/lens    ← Install once
cd any-project
lens scan                              ← Works immediately
```

The only thing that appears in a project is `.lens/` — and that's just output data (scores, findings). No canons, no skills, no pipeline code. Those live in the installed package.

## What You Already Have

Your `package.json` is already structured for this:

```json
{
  "name": "@objective-arts/lens",
  "bin": { "lens": "./dist/cli/index.js" },
  "publishConfig": { "registry": "https://npm.pkg.github.com" }
}
```

The `lens` CLI command already exists. The compiled source already goes to `dist/`. You're publishing to GitHub Packages. The bones are there.

## What Needs to Change

### The Core Problem: Runtime Assets

Your CLI compiles from `src/` to `dist/`, but the things that make Lens valuable aren't in `src/`:

| Asset | Current Location | Used At Runtime? | Shipped in `dist/`? |
|-------|-----------------|------------------|---------------------|
| Canons (75 skill definitions) | `canon/` | Yes — read by scanner | **No** |
| Profiles (15 YAML configs) | `profiles/` | Yes — loaded by CLI | **No** |
| Workflow skills (38 skills) | `workflow-skills/` | Yes — read by pipeline | **No** |
| Pipeline orchestrator | `scripts/pipeline.sh` | Yes — runs builds/fixes | **No** |
| Claude skills (17 skills) | `.claude/skills/` | Yes — loaded by Claude Code | **No** |
| Rubrics | `.claude/rubric/` | Yes — used in evaluation | **No** |
| Phase definitions | `.claude/phases/` | Yes — used in pipeline | **No** |
| MCP servers | `mcp-servers/` | Yes — external integrations | **No** |
| Config | `config/` | Yes — keyword detection etc. | **No** |

When someone runs `npm install -g @objective-arts/lens`, they get `dist/` and whatever `files` in `package.json` specifies. Right now, none of the runtime assets ship.

### The Fix: Include Runtime Assets in the Package

**Step 1: Tell npm to include runtime assets**

Add a `files` field to `package.json`:

```json
{
  "files": [
    "dist/",
    "canon/",
    "profiles/",
    "workflow-skills/",
    "config/",
    "scripts/pipeline.sh",
    ".claude/skills/",
    ".claude/phases/",
    ".claude/rubric/",
    ".claude/plans/",
    ".claude/config/",
    "mcp-servers/"
  ]
}
```

This tells npm: when you publish this package, include these directories. Everything else (docs, reports, lens-ui, tests, IDE files) stays out.

**Step 2: Resolve asset paths at runtime**

Your CLI currently assumes it's running from the repo root. After global install, the code lives in something like `~/.npm-global/lib/node_modules/@objective-arts/lens/`. The CLI needs to find its canons, profiles, etc. relative to its own installation, not the current working directory.

In your CLI entry point, add:

```typescript
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Where Lens is installed (the package root)
const __filename = fileURLToPath(import.meta.url);
const LENS_HOME = join(dirname(__filename), '..', '..');  // dist/cli/index.js → package root

// Runtime asset paths
export const PATHS = {
  canons:    join(LENS_HOME, 'canon'),
  profiles:  join(LENS_HOME, 'profiles'),
  skills:    join(LENS_HOME, 'workflow-skills'),
  pipeline:  join(LENS_HOME, 'scripts', 'pipeline.sh'),
  rubrics:   join(LENS_HOME, '.claude', 'rubric'),
  phases:    join(LENS_HOME, '.claude', 'phases'),
  config:    join(LENS_HOME, 'config'),
  mcp:       join(LENS_HOME, 'mcp-servers'),
};
```

Every place in the codebase that currently does `fs.readFileSync('canon/...')` or `path.resolve('profiles/...')` needs to use `PATHS.canons` instead. This is the main refactor.

**Step 3: Make `.lens/` the only project-side artifact**

When `lens scan` runs in a project directory, it:
1. Reads canons from `PATHS.canons` (the installed package)
2. Analyzes the code in the current directory
3. Writes results to `./.lens/` (in the project)

The project never sees the engine. It only sees its own results.

**Step 4: Claude Code integration**

This is the one tricky part. Claude Code discovers skills from `.claude/skills/` **inside the project directory**. After the restructure, those skills live in the installed package, not the project.

Two options:

**Option A: `lens init` creates symlinks** (simpler)
```bash
lens init
# Creates .claude/skills/ symlinks pointing to the installed package
# Also creates .claude/CLAUDE.md with standards and auto-invoke rules
```

The project gets a thin `.claude/` directory with symlinks. Updating Lens automatically updates the skills because symlinks follow the target.

**Option B: `lens` CLI wraps Claude Code** (cleaner but harder)
```bash
lens fix   # Internally calls claude with --skill-dir pointing to the package
```

This keeps the project completely clean but requires understanding Claude Code's skill resolution.

**Recommendation: Start with Option A.** It works today, it's simple, and you can move to Option B later. The `lens init` command creates:

```
my-project/
├── .claude/
│   ├── skills/
│   │   ├── fix -> ~/.npm-global/lib/node_modules/@objective-arts/lens/.claude/skills/fix
│   │   ├── build -> ...
│   │   ├── improve -> ...
│   │   └── ... (all symlinked)
│   └── CLAUDE.md  → Generated from the installed profile
└── .lens/
    └── (scan results appear here)
```

---

## The Commands After Restructure

| Command | What It Does | Touches Project? |
|---------|-------------|-----------------|
| `npm i -g @objective-arts/lens` | Installs engine globally | No |
| `lens init` | Creates `.claude/` symlinks in current project | Yes — `.claude/` |
| `lens scan` | Analyzes code, writes results | Yes — `.lens/` |
| `lens fix` | Fixes findings, writes results | Yes — `.lens/` + source files |
| `lens open` | Launches web UI to view results | No (reads `.lens/`) |
| `lens update` | `npm update -g @objective-arts/lens` wrapper | No |

---

## What the Repo Looks Like After

No structural changes to the repo itself. The directories stay where they are. The changes are:

1. **`package.json`** — Add `files` field to include runtime assets
2. **`src/cli/`** — Use `PATHS` object instead of relative paths
3. **New command: `lens init`** — Creates `.claude/skills/` symlinks in a project
4. **New command: `lens open`** — Starts the web UI (from `lens-ui/`)
5. **New output adapter** — Writes JSON to `.lens/` after scans (from the schema doc)

The repo stays as your development workspace. Publishing creates the installable package.

---

## Migration for Existing Projects

For any project that currently has Lens files copied into it:

```bash
cd my-project
rm -rf canon/ workflow-skills/ profiles/    # Remove copied Lens files
lens init                                    # Create symlinks to installed package
lens scan                                    # First scan with new output format
```

---

## Package Size Estimate

| Asset | Approximate Size |
|-------|-----------------|
| `dist/` (compiled TS) | ~500KB |
| `canon/` (75 canons, markdown + yaml) | ~2MB |
| `profiles/` (15 YAML files) | ~50KB |
| `workflow-skills/` (38 skills, markdown) | ~1.5MB |
| `.claude/` (skills, rubrics, phases) | ~500KB |
| `config/` | ~10KB |
| `scripts/pipeline.sh` | ~40KB |
| `mcp-servers/` | ~200KB |
| **Total** | **~5MB** |

That's a reasonable npm package size. No node_modules ship — those get installed from dependencies.

---

## Order of Work

| Step | What | Why First |
|------|------|-----------|
| 1 | Add `files` to `package.json` | Determines what ships |
| 2 | Create `PATHS` module with asset resolution | Foundation for everything else |
| 3 | Update all path references in `src/` to use `PATHS` | Make the CLI installable |
| 4 | Add `lens init` command | Projects can connect to the installed engine |
| 5 | Add output adapter (JSON to `.lens/`) | Results get persisted |
| 6 | Test with `npm pack` + global install | Verify it works outside the repo |
| 7 | Add `lens open` command | Web UI launcher |

Steps 1-3 are the restructure. Steps 4-5 connect it to the project/UI. Steps 6-7 are polish.

---

## What Projects End Up With

```
my-project/
├── src/                    ← Your code (unchanged)
├── package.json            ← Your package (unchanged)
├── .claude/                ← Created by `lens init` (symlinks)
│   ├── skills/ → ...
│   └── CLAUDE.md
└── .lens/                  ← Created by `lens scan` (output data)
    ├── project.json
    └── runs/
        └── 2026-02-24T10-30-00Z.json
```

Two dotfiles directories. One is symlinks to the engine (optional — only needed for Claude Code integration). One is scan results. Everything else lives in the globally installed package.
