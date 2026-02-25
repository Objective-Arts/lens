# PRD: Make Lens a Globally Installable Package

## Problem

Using Lens on a project today requires either working inside the Lens repo or copying/symlinking canons, skills, and pipeline scripts into the target project. This doesn't scale — every project needs Lens files, and updating Lens means updating every copy.

## Goal

After this work, the install and usage flow is:

```
npm install -g @objective-arts/lens
cd any-project
lens scan
```

The only artifact that appears in a target project is `.lens/` — output data (scores, findings). No canons, no skills, no pipeline code. Those live in the installed package.

## What Already Works

- `package.json` has `bin.lens` → `dist/cli/index.js`
- `package.json` has `publishConfig` → GitHub Packages
- CLI compiles from `src/` to `dist/` via `tsc`
- The `lens` command exists and runs

## What's Broken

Runtime assets don't ship with the package. When someone runs `npm install -g @objective-arts/lens`, they get `dist/` but not:

| Asset | Location | Needed at runtime |
|-------|----------|-------------------|
| Canons (75) | `canon/` | Yes |
| Profiles (15 YAML) | `profiles/` | Yes |
| Workflow skills (38) | `workflow-skills/` | Yes |
| Pipeline orchestrator | `scripts/pipeline.sh` | Yes |
| Claude skills | `.claude/skills/` | Yes |
| Rubrics | `.claude/rubric/` | Yes |
| Phase definitions | `.claude/phases/` | Yes |
| Config | `config/` | Yes |
| MCP servers | `mcp-servers/` | Yes |

The CLI resolves all asset paths relative to the working directory. After global install, assets live in the npm global prefix (e.g. `~/.npm-global/lib/node_modules/@objective-arts/lens/`), so relative paths break.

## Requirements

### 1. Add `files` field to `package.json`

Include all runtime assets so they ship with the published package:

```json
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
```

### 2. Create a `PATHS` module for runtime asset resolution

New file: `src/paths.ts`

This module resolves asset paths relative to the **package installation location**, not the current working directory. Every module that reads canons, profiles, skills, pipeline scripts, rubrics, phases, or config must use this module.

```typescript
// Resolves to the package root regardless of where the CLI is invoked from
// dist/cli/index.js → ../../ → package root
```

Exports an object with paths for: `canons`, `profiles`, `skills`, `workflowSkills`, `pipeline`, `rubrics`, `phases`, `config`, `mcp`.

**CRITICAL — Dual resolution for backwards compatibility:**

The PATHS module must check two locations for each asset:
1. **Primary:** The package installation directory (for global installs)
2. **Fallback:** The current working directory / repo root (for dev mode, running from the repo)

If the primary path exists, use it. If not, fall back to the repo-relative path. This ensures:
- Existing projects that run Lens from the repo continue to work unchanged
- Globally installed Lens works for new projects
- Migration is gradual — no big bang cutover, no projects break

The resolution logic should log which mode it's operating in (installed vs dev) on first resolution, so debugging is straightforward.

### 3. Update all path references in `src/` to use `PATHS`

Search for every place that resolves paths to runtime assets using relative paths, `process.cwd()`, or hardcoded strings. Replace with imports from the `PATHS` module.

Likely locations:
- `src/canon/` — reads from `canon/`
- `src/profiles/` — reads from `profiles/`
- `src/scanner/` — reads from `config/`
- `src/workflow/` — reads from `workflow-skills/`
- `src/cli/commands/` — various commands reference assets
- `src/mcp/` — reads from `mcp-servers/`

**Critical:** Some paths SHOULD still be relative to `process.cwd()` — specifically anything that reads/writes the target project's files. The `PATHS` module is only for Lens's own assets.

### 4. Add `lens init` command

New command: `src/cli/commands/init.ts`

Creates Claude Code integration in the target project directory:

```bash
lens init
```

What it does:
1. Creates `.claude/skills/` in the current directory
2. For each skill in the installed package's `.claude/skills/`, creates a symlink from the project's `.claude/skills/<name>` → the installed package's `.claude/skills/<name>`
3. Generates `.claude/CLAUDE.md` from the detected language/framework profile
4. Prints what was created

What it does NOT do:
- Create `.lens/` (that's created by `lens scan`)
- Modify any existing source files
- Require any arguments or configuration

The symlink targets must be absolute paths resolved from the package installation location.

**Migration of existing projects:**

`lens init` must detect and handle projects that already have Lens files:

1. **Existing `.claude/skills/` with real directories (copied files):** Replace each copied directory with a symlink to the installed package. Before replacing, warn the user and list what will be replaced. If a local skill has been modified (differs from the installed version), warn but still replace — `workflow-skills/` is the source of truth.

2. **Existing `.claude/skills/` with symlinks pointing to old locations:** Replace with symlinks pointing to the installed package location.

3. **Existing `.claude/CLAUDE.md`:** Preserve user customizations. If the file exists, merge the Lens standards section (between marker comments like `<!-- LENS:START -->` and `<!-- LENS:END -->`) and leave everything else untouched. If no markers exist, append the Lens section.

4. **Copied `canon/`, `workflow-skills/`, `profiles/` directories in the project:** Detect these and print a message telling the user they can safely delete them, since Lens now resolves from the installed package. Do NOT auto-delete — let the user verify and remove manually.

The output should clearly show what was created, what was replaced, and what the user should clean up:

```
lens init

  ✓ Created .claude/skills/fix → @objective-arts/lens/.claude/skills/fix
  ✓ Created .claude/skills/build → @objective-arts/lens/.claude/skills/build
  ...
  ✓ Generated .claude/CLAUDE.md (profile: typescript)

  ⚠ Found copied Lens directories that are no longer needed:
    canon/           (Lens resolves canons from the installed package)
    workflow-skills/ (Lens resolves skills from the installed package)

  You can safely delete these:
    rm -rf canon/ workflow-skills/
```

### 5. Add JSON output adapter

New file: `src/output/json-adapter.ts`

Called at the end of scan/fix operations. Writes structured results to `.lens/` in the target project directory.

Creates:
- `.lens/project.json` — project metadata (id, name, path, language, framework, timestamps)
- `.lens/runs/{timestamp}.json` — run results (score, dimensions, findings, verdict)

**Schema (TypeScript types):**

```typescript
type Severity = 'critical' | 'high' | 'medium' | 'low';
type Verdict = 'production-ready' | 'needs-attention' | 'needs-work' | 'needs-rework';
type RunMode = 'scan' | 'fix';
type FindingStatus = 'open' | 'fixed' | 'ignored';

interface LensProject {
  version: 1;
  id: string;
  name: string;
  path: string;
  language: string;
  framework: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LensRun {
  version: 1;
  id: string;
  mode: RunMode;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  score: { total: number; max: 100; verdict: Verdict };
  dimensions: Array<{ name: string; score: number; max: 10 }>;
  summary: { critical: number; high: number; medium: number; low: number };
  findings: Array<{
    id: string;
    severity: Severity;
    dimension: string;
    title: string;
    description: string;
    file: string;
    line: number | null;
    suggestion: string;
    canon: string | null;
    status: FindingStatus;
  }>;
  fixedFrom?: string;
}
```

**Score conversion from current pipeline:**
- CODE_SCAN_INDEX is 0-130 (penalty, lower=better) → convert to 0-100 (quality, higher=better): `Math.round(100 - (index / 130) * 100)`
- Dimension penalties → dimension scores: `Math.max(0, 10 - penaltyPoints)`
- Verdict: 90-100=production-ready, 70-89=needs-attention, 50-69=needs-work, 0-49=needs-rework

The 13 dimensions are: Structure, Clarity, Data Design, Error Handling, Security, Framework Idioms, Dead Code, AI Smells, Duplication, Consistency, Type Safety, Dependency Health, Conversion Residue.

### 6. Verify with `npm pack`

After all changes, run `npm pack` and inspect the tarball to confirm:
- All runtime assets are included
- No dev-only files leak in (node_modules, .git, reports, lens-ui, documentation, .idea, .qodana)
- The package size is reasonable (~5MB)

Then test a global install from the tarball:
```bash
npm install -g objective-arts-lens-0.4.0.tgz
cd /tmp/some-test-project
lens init
lens scan
```

## Out of Scope

- `lens open` (web UI launcher) — separate PRD
- Web UI changes — separate project
- CI/CD integration
- Multi-project dashboard
- Any changes to canon content or pipeline logic

## Files to Create

| File | Purpose |
|------|---------|
| `src/paths.ts` | Runtime asset path resolution |
| `src/cli/commands/init.ts` | `lens init` command |
| `src/output/json-adapter.ts` | JSON output writer |
| `src/output/types.ts` | Schema types for .lens/ output |

## Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add `files` field |
| `src/cli/index.ts` | Register `init` command |
| Every file that resolves asset paths | Import from `src/paths.ts` instead |

## Acceptance Criteria

1. `npm pack` produces a tarball containing `dist/`, `canon/`, `profiles/`, `workflow-skills/`, `config/`, `scripts/pipeline.sh`, `.claude/skills/`, `.claude/phases/`, `.claude/rubric/`, `.claude/config/`, `mcp-servers/`
2. `npm install -g` from the tarball makes the `lens` command available globally
3. `lens init` in any project directory creates `.claude/skills/` symlinks pointing to the installed package
4. `lens init` in a project with existing Lens files detects them, replaces copies with symlinks, and advises on cleanup
5. `lens scan` in any project directory writes `.lens/project.json` and `.lens/runs/{timestamp}.json`
6. All existing CLI commands still work after the path refactor
7. No runtime asset is resolved relative to `process.cwd()` — all use the `PATHS` module
8. Running from the Lens repo with `npm run dev` or `tsx` still works (dual resolution fallback)
