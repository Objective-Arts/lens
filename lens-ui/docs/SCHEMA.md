# Lens Data Schema

This is the contract between the Lens CLI (which writes data) and the Lens UI (which reads data).

The Lens pipeline writes JSON files to a `.lens/` directory inside each scanned project. The UI reads these files and renders them. Neither side talks to the other directly.

---

## Directory Structure

```
my-project/                    ← Any project you scan
├── src/
├── package.json
└── .lens/                     ← Created on first scan
    ├── project.json           ← Project identity + metadata
    └── runs/
        ├── 2026-02-24T10-30-00Z.json   ← One file per scan/fix
        └── 2026-02-24T14-15-00Z.json
```

Plus one registry file that lives in the user's home directory:

```
~/.lens/
└── registry.json              ← List of all known project paths
```

That's the entire filesystem footprint.

---

## File 1: `~/.lens/registry.json`

**Purpose:** The UI needs to know which projects exist. This file is a simple list of paths.

**Written by:** `lens scan` (adds the project path on first scan)
**Read by:** UI (to discover all projects)

```json
{
  "version": 1,
  "projects": [
    "/Users/steve/local-tech-projects/my-api",
    "/Users/steve/local-tech-projects/my-frontend",
    "/Users/steve/local-tech-projects/shared-lib"
  ]
}
```

That's it. No metadata here — the UI reads each project's `.lens/project.json` for details.

**Why a registry?** Without it, the UI would have to scan every directory on disk looking for `.lens/` folders. The registry tells it exactly where to look.

---

## File 2: `.lens/project.json`

**Purpose:** Identity and metadata for this project.

**Written by:** `lens scan` (created on first scan, updated on each scan)
**Read by:** UI (to show project name, language, framework)

```json
{
  "version": 1,
  "id": "my-api",
  "name": "my-api",
  "path": "/Users/steve/local-tech-projects/my-api",
  "language": "typescript",
  "framework": "express",
  "createdAt": "2026-02-20T09:00:00Z",
  "updatedAt": "2026-02-24T10:30:00Z"
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `version` | `number` | Schema version (always `1` for now) |
| `id` | `string` | Unique identifier (derived from directory name) |
| `name` | `string` | Display name (defaults to directory name) |
| `path` | `string` | Absolute path to the project root |
| `language` | `string` | Primary language detected (`typescript`, `python`, `java`, etc.) |
| `framework` | `string \| null` | Framework detected (`express`, `nextjs`, `angular`, `spring`, etc.) |
| `createdAt` | `string` | ISO 8601 timestamp of first scan |
| `updatedAt` | `string` | ISO 8601 timestamp of most recent scan |

---

## File 3: `.lens/runs/{timestamp}.json`

**Purpose:** The results of a single scan or fix operation.

**Written by:** `lens scan` or `lens fix`
**Read by:** UI (to show scores, findings, history)

This is the big one. Here's the full structure:

```json
{
  "version": 1,
  "id": "2026-02-24T10-30-00Z",
  "mode": "scan",
  "startedAt": "2026-02-24T10:30:00Z",
  "completedAt": "2026-02-24T10:31:14Z",
  "durationMs": 74000,

  "score": {
    "total": 72,
    "max": 100,
    "verdict": "needs-attention"
  },

  "dimensions": [
    { "name": "Structure",         "score": 8, "max": 10 },
    { "name": "Clarity",           "score": 7, "max": 10 },
    { "name": "Data Design",       "score": 6, "max": 10 },
    { "name": "Error Handling",    "score": 5, "max": 10 },
    { "name": "Security",          "score": 4, "max": 10 },
    { "name": "Framework Idioms",  "score": 8, "max": 10 },
    { "name": "Dead Code",         "score": 9, "max": 10 },
    { "name": "AI Smells",         "score": 7, "max": 10 },
    { "name": "Duplication",       "score": 6, "max": 10 },
    { "name": "Consistency",       "score": 8, "max": 10 },
    { "name": "Type Safety",       "score": 5, "max": 10 },
    { "name": "Dependency Health",  "score": 7, "max": 10 },
    { "name": "Conversion Residue","score": 9, "max": 10 }
  ],

  "summary": {
    "critical": 3,
    "high": 5,
    "medium": 12,
    "low": 7
  },

  "findings": [
    {
      "id": "f-001",
      "severity": "critical",
      "dimension": "Security",
      "title": "SQL injection risk",
      "description": "User input concatenated into SQL query without parameterization.",
      "file": "src/auth/login.ts",
      "line": 47,
      "suggestion": "Use parameterized queries instead of string concatenation.",
      "canon": "security-mindset",
      "status": "open"
    },
    {
      "id": "f-002",
      "severity": "high",
      "dimension": "Error Handling",
      "title": "Empty catch block",
      "description": "Exception caught and silently swallowed. Failures will be invisible.",
      "file": "src/utils/api.ts",
      "line": 89,
      "suggestion": "Log the error or re-throw. Never swallow exceptions silently.",
      "canon": "correctness",
      "status": "open"
    }
  ]
}
```

### Score

| Field | Type | Description |
|-------|------|-------------|
| `total` | `number` | Overall quality score, 0-100 |
| `max` | `number` | Always `100` |
| `verdict` | `string` | One of: `production-ready`, `needs-attention`, `needs-work`, `needs-rework` |

**Verdict mapping** (derived from total score):
- 90-100 → `production-ready`
- 70-89 → `needs-attention`
- 50-69 → `needs-work`
- 0-49 → `needs-rework`

**Score conversion from current pipeline:** The code-scan produces a `CODE_SCAN_INDEX` of 0-130 where **lower is better** (it's a penalty score). To convert to the 0-100 "higher is better" scale:

```
uiScore = Math.round(100 - (codeScanIndex / 130) * 100)
```

### Dimensions

The 13 dimensions from the code-scan, each scored 0-10 where **higher is better**. These are the inverse of the current penalty scoring — a dimension with 0 penalties gets 10/10.

**Conversion from current pipeline:** Each dimension currently accumulates penalty points (critical=3, warning=2, observation=1). To convert:

```
dimensionScore = Math.max(0, 10 - penaltyPoints)
```

### Findings

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique finding identifier within this run |
| `severity` | `"critical" \| "high" \| "medium" \| "low"` | Severity level |
| `dimension` | `string` | Which of the 13 dimensions this belongs to |
| `title` | `string` | One-line summary (what's wrong) |
| `description` | `string` | Explanation of the problem and its impact |
| `file` | `string` | Relative file path from project root |
| `line` | `number \| null` | Line number (null if file-level finding) |
| `suggestion` | `string` | How to fix it |
| `canon` | `string \| null` | Which canon flagged this (e.g., `security-mindset`, `sql`, `correctness`) |
| `status` | `"open" \| "fixed" \| "ignored"` | Finding status |

**Severity mapping from current pipeline:**
- Current "Critical" (3 pts) → `critical`
- Current "Warning" (2 pts) → `high`
- Current "Observation" (1 pt) → `medium`
- Style/preference items → `low`

### Run for `lens fix`

A fix run looks the same but with `mode: "fix"` and findings have their `status` updated:

```json
{
  "version": 1,
  "id": "2026-02-24T14-15-00Z",
  "mode": "fix",
  "startedAt": "2026-02-24T14:15:00Z",
  "completedAt": "2026-02-24T14:18:30Z",
  "durationMs": 210000,

  "score": {
    "total": 89,
    "max": 100,
    "verdict": "needs-attention"
  },

  "dimensions": [ "..." ],

  "summary": {
    "critical": 0,
    "high": 1,
    "medium": 8,
    "low": 7
  },

  "findings": [
    {
      "id": "f-001",
      "severity": "critical",
      "title": "SQL injection risk",
      "file": "src/auth/login.ts",
      "line": 47,
      "status": "fixed"
    }
  ],

  "fixedFrom": "2026-02-24T10-30-00Z"
}
```

The `fixedFrom` field links this fix run back to the scan it was fixing. Findings that were fixed carry `status: "fixed"`. Findings that remain carry `status: "open"`.

---

## TypeScript Types

This is the source of truth for both sides:

```typescript
// ============================================
// Registry — ~/.lens/registry.json
// ============================================

export interface LensRegistry {
  version: 1;
  projects: string[];  // Absolute paths to project roots
}

// ============================================
// Project — .lens/project.json
// ============================================

export interface LensProject {
  version: 1;
  id: string;
  name: string;
  path: string;
  language: string;
  framework: string | null;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}

// ============================================
// Run — .lens/runs/{timestamp}.json
// ============================================

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type Verdict = 'production-ready' | 'needs-attention' | 'needs-work' | 'needs-rework';
export type RunMode = 'scan' | 'fix';
export type FindingStatus = 'open' | 'fixed' | 'ignored';

export interface RunScore {
  total: number;       // 0-100, higher is better
  max: 100;
  verdict: Verdict;
}

export interface DimensionScore {
  name: string;        // One of the 13 dimensions
  score: number;       // 0-10, higher is better
  max: 10;
}

export interface Finding {
  id: string;
  severity: Severity;
  dimension: string;
  title: string;
  description: string;
  file: string;        // Relative to project root
  line: number | null;
  suggestion: string;
  canon: string | null;
  status: FindingStatus;
}

export interface SeveritySummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface LensRun {
  version: 1;
  id: string;           // Timestamp-based identifier
  mode: RunMode;
  startedAt: string;    // ISO 8601
  completedAt: string;  // ISO 8601
  durationMs: number;
  score: RunScore;
  dimensions: DimensionScore[];
  summary: SeveritySummary;
  findings: Finding[];
  fixedFrom?: string;   // Only for mode: "fix" — links to the scan run ID
}

// ============================================
// Dimension names (canonical list)
// ============================================

export const DIMENSIONS = [
  'Structure',
  'Clarity',
  'Data Design',
  'Error Handling',
  'Security',
  'Framework Idioms',
  'Dead Code',
  'AI Smells',
  'Duplication',
  'Consistency',
  'Type Safety',
  'Dependency Health',
  'Conversion Residue',
] as const;

export type DimensionName = typeof DIMENSIONS[number];

// ============================================
// Verdict thresholds
// ============================================

export function getVerdict(score: number): Verdict {
  if (score >= 90) return 'production-ready';
  if (score >= 70) return 'needs-attention';
  if (score >= 50) return 'needs-work';
  return 'needs-rework';
}
```

---

## What Writes These Files

Today: nothing. The pipeline outputs markdown to the terminal.

To make this work, the pipeline needs an **output adapter** — a function that takes the same analysis results and writes them as JSON instead of (or in addition to) markdown.

The adapter lives in the `lens/` repo and gets called at the end of each scan/fix. It:

1. Creates `.lens/` and `.lens/runs/` if they don't exist
2. Creates or updates `project.json` (detect language/framework from file extensions and config files)
3. Writes a new run file to `.lens/runs/{timestamp}.json`
4. Adds the project path to `~/.lens/registry.json` if not already there
5. Prints the terminal summary (score, top findings, `lens open` hint)

That adapter is the **only new code needed in the lens repo** to make the UI work.

---

## What Reads These Files

The Next.js UI. Its data layer does:

1. Read `~/.lens/registry.json` to get all project paths
2. For each path, read `.lens/project.json` for project metadata
3. For each path, read `.lens/runs/*.json` for run history, sorted by `startedAt` descending
4. All reads happen in Server Components (no API layer needed)

---

## Validation Rules

**Run files:**
- `id` must match the filename (minus `.json`)
- `findings` count must match `summary` totals
- `dimensions` must contain exactly 13 entries
- `score.verdict` must match `getVerdict(score.total)`
- `completedAt` must be after `startedAt`

**Project files:**
- `path` must be an absolute path
- `id` must be URL-safe (lowercase alphanumeric + hyphens)

**Registry:**
- No duplicate paths
- Paths should exist on disk (UI should handle missing gracefully)
