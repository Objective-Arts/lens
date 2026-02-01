# Claude Optimal CLI - Architecture Guide

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLAUDE OPTIMAL CLI                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐                    ┌─────────────────────────────┐   │
│   │   cc-config     │                    │         ralph               │   │
│   │   (Config CLI)  │                    │   (Autonomous PRD Loop)     │   │
│   └────────┬────────┘                    └──────────────┬──────────────┘   │
│            │                                            │                   │
│   ┌────────┴────────────────────────────────────────────┴─────────────┐    │
│   │                      SHARED INFRASTRUCTURE                         │    │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │    │
│   │  │ Profiles │ │  Skills  │ │  Phases  │ │ Display  │ │ Summary  │ │    │
│   │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Directory Structure

```
cli/
├── src/
│   ├── cli/                    # cc-config CLI
│   │   ├── index.ts            # Entry point
│   │   └── commands/           # Subcommands (scan, profile, mcp, etc.)
│   │
│   ├── ralph/                  # Autonomous loop engine
│   │   ├── index.ts            # Entry point
│   │   ├── runner.ts           # Main orchestrator (521 lines)
│   │   ├── types.ts            # Core types
│   │   │
│   │   ├── phases/             # 8 workflow phases
│   │   │   ├── types.ts        # Phase interface
│   │   │   ├── index.ts        # Phase factory
│   │   │   ├── plan.ts
│   │   │   ├── structure-first.ts
│   │   │   ├── implement.ts
│   │   │   ├── test.ts
│   │   │   ├── refactor-check.ts
│   │   │   ├── adversarial-review.ts  # Gemini MCP
│   │   │   ├── static-analysis.ts     # Qodana MCP
│   │   │   └── doc-code.ts
│   │   │
│   │   ├── process/            # Claude CLI integration
│   │   │   └── claude.ts       # Spawn Claude, capture output
│   │   │
│   │   ├── parsers/            # Output parsing
│   │   │   └── claude-stream.ts
│   │   │
│   │   ├── display/            # Terminal output
│   │   │   ├── terminal.ts     # Print functions, Spinner
│   │   │   ├── phase-output.ts # Phase result formatting
│   │   │   └── issue-parser.ts # Issue extraction
│   │   │
│   │   ├── summary/            # Report generation
│   │   │   ├── collector.ts    # Metrics collector
│   │   │   ├── generator.ts    # HTML generator
│   │   │   └── types.ts
│   │   │
│   │   ├── config/             # Configuration loading
│   │   │   └── loader.ts
│   │   │
│   │   ├── skills/             # Expert skill loading
│   │   │   └── loader.ts
│   │   │
│   │   └── prd/                # PRD file handling
│   │       ├── parser.ts
│   │       └── updater.ts
│   │
│   ├── profiles/               # Profile system
│   ├── tools/                  # Tool management
│   ├── ui/                     # Web UI + summary HTML
│   └── types.ts                # Global types
│
├── config/
│   ├── workflow-phases.yaml    # Phase definitions + experts
│   └── keyword-detection.yaml  # 625+ keyword → expert rules
│
└── .claude/
    ├── ralph-config.yaml       # Project ralph config
    ├── ralph-logs/             # Execution logs
    └── plans/                  # Generated plans
```

---

## 2. Ralph Execution Flow

```
┌─────────────┐
│  PRD.md     │  User creates checklist of requirements
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         RALPH RUNNER                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    INITIALIZATION                                │   │
│  │  1. Parse PRD file                                               │   │
│  │  2. Load ralph-config.yaml                                       │   │
│  │  3. Create session (UUID, logs dir)                              │   │
│  │  4. Create workflow marker (.claude/active-workflow.json)        │   │
│  │  5. Initialize summary collector                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    ITEM LOOP (for each PRD item)                 │   │
│  │                                                                  │   │
│  │   ┌────────────────────────────────────────────────────────┐    │   │
│  │   │              PHASE LOOP (8 phases per item)             │    │   │
│  │   │                                                         │    │   │
│  │   │  For each phase:                                        │    │   │
│  │   │    1. Detect experts (phase + keyword + profile)        │    │   │
│  │   │    2. Load skill content                                │    │   │
│  │   │    3. Build phase context                               │    │   │
│  │   │    4. Execute phase (spawn Claude)                      │    │   │
│  │   │    5. Parse results                                     │    │   │
│  │   │    6. Retry if correctable failure (max 3)              │    │   │
│  │   │    7. Update progress display                           │    │   │
│  │   └────────────────────────────────────────────────────────┘    │   │
│  │                                                                  │   │
│  │   On success: Mark PRD item complete                            │   │
│  │   On failure: Log warning, move to next item                    │   │
│  │   Every 3 items: Git checkpoint                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    FINALIZATION                                  │   │
│  │  1. Generate summary HTML                                        │   │
│  │  2. Write JSON metrics                                           │   │
│  │  3. Open in browser                                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Phase Pipeline

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           8-PHASE PIPELINE                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────┐   ┌───────────┐   ┌───────────┐   ┌──────────┐                  │
│  │  PLAN  │ → │ STRUCTURE │ → │ IMPLEMENT │ → │ REFACTOR │                  │
│  │   📝   │   │   🏗️     │   │    🛠️    │   │    🧹    │                  │
│  └────────┘   └───────────┘   └───────────┘   └──────────┘                  │
│      │             │               │               │                         │
│      ▼             ▼               ▼               ▼                         │
│  Requirements   Data types      Code files      Clean code                   │
│  + approach     + interfaces                    + better names               │
│                                                                              │
│      │                                              │                        │
│      └──────────────────────┬───────────────────────┘                        │
│                             │                                                │
│                             ▼                                                │
│  ┌───────────────┐   ┌──────────────┐   ┌────────┐   ┌─────────┐           │
│  │  ADVERSARIAL  │ → │   STATIC     │ → │  TEST  │ → │  DOC    │           │
│  │    REVIEW     │   │   ANALYSIS   │   │   🧪   │   │   📚    │           │
│  │     🔒        │   │     📊       │   │        │   │         │           │
│  └───────────────┘   └──────────────┘   └────────┘   └─────────┘           │
│         │                   │                │             │                 │
│         ▼                   ▼                ▼             ▼                 │
│    Gemini MCP          Qodana MCP       Tests run     JSDoc/README          │
│    Security scan       Code quality     63 pass       Updated               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Phase Interface

```typescript
┌─────────────────────────────────────────────────────────────────┐
│                      Phase Interface                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  interface Phase {                                              │
│    readonly name: PhaseName                                     │
│    readonly icon: string                                        │
│    readonly description: string                                 │
│                                                                 │
│    execute(context: PhaseContext): Promise<PhaseResult>         │
│    shouldRun(context: PhaseContext): boolean                    │
│  }                                                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  interface PhaseContext {                                       │
│    session: Session         // Current run session              │
│    item: PrdItem            // PRD requirement being processed  │
│    experts: Skill[]         // Loaded expert skills             │
│    projectPath: string                                          │
│    logsDir: string                                              │
│    correctivePrompt?: string // For retry attempts              │
│  }                                                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  type PhaseResult =                                             │
│    | { status: 'success'; message: string; metrics?; rawOutput? }
│    | { status: 'failed'; error: string }                        │
│    | { status: 'skipped'; reason: string }                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Expert Detection System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXPERT DETECTION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   INPUTS                                                                    │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐    │
│   │  Phase Name     │  │  PRD Item Text  │  │  Profile Experts        │    │
│   │  "implement"    │  │  "Add user      │  │  [cherny, dodds]        │    │
│   │                 │  │   auth with JWT"│  │                         │    │
│   └────────┬────────┘  └────────┬────────┘  └───────────┬─────────────┘    │
│            │                    │                       │                   │
│            ▼                    ▼                       │                   │
│   ┌─────────────────────────────────────────────────────┼─────────────────┐│
│   │              DETECTION ENGINE                       │                 ││
│   │                                                     │                 ││
│   │  ┌────────────────────────┐                         │                 ││
│   │  │  workflow-phases.yaml  │  Phase → Experts        │                 ││
│   │  │  implement:            │  ─────────────────▶     │                 ││
│   │  │    - thompson          │  [thompson, kernighan,  │                 ││
│   │  │    - kernighan         │   pike, mcilroy]        │                 ││
│   │  │    - pike              │                         │                 ││
│   │  │    - mcilroy           │                         │                 ││
│   │  └────────────────────────┘                         │                 ││
│   │                                                     │                 ││
│   │  ┌────────────────────────┐                         │                 ││
│   │  │ keyword-detection.yaml │  Keywords → Experts     │                 ││
│   │  │ security:              │  ─────────────────▶     │                 ││
│   │  │   - auth, jwt, token   │  [schneier, owasp,      │                 ││
│   │  │   → schneier, owasp    │   tanya-janca]          │                 ││
│   │  │                        │                         │                 ││
│   │  │ (625+ rules)           │                         │                 ││
│   │  └────────────────────────┘                         │                 ││
│   │                                                     │                 ││
│   └─────────────────────────────────────────────────────┼─────────────────┘│
│                                                         │                   │
│                                                         ▼                   │
│   OUTPUT                                                                    │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  Merged Expert List (deduplicated)                                   │  │
│   │  [thompson, kernighan, pike, mcilroy, schneier, owasp, cherny, ...]  │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Claude Process Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLAUDE SPAWNING                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Phase.execute(context)                                                     │
│        │                                                                    │
│        ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Build Prompt                                                        │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │ ## Phase Instructions                                          │  │   │
│  │  │ [Phase-specific rules and requirements]                        │  │   │
│  │  │                                                                 │  │   │
│  │  │ ## PRD Item                                                     │  │   │
│  │  │ {item.text}                                                     │  │   │
│  │  │                                                                 │  │   │
│  │  │ ## Expert Guidance                                              │  │   │
│  │  │ ### kernighan                                                   │  │   │
│  │  │ [Skill content - clarity, simplicity]                          │  │   │
│  │  │                                                                 │  │   │
│  │  │ ### schneier                                                    │  │   │
│  │  │ [Skill content - security mindset]                             │  │   │
│  │  │                                                                 │  │   │
│  │  │ ## Required Output Format                                       │  │   │
│  │  │ [Markers for parsing]                                          │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│        │                                                                    │
│        ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Spawn Claude CLI                                                    │   │
│  │                                                                      │   │
│  │  claude --output-format stream-json                                  │   │
│  │         --verbose                                                    │   │
│  │         --dangerously-skip-permissions                               │   │
│  │         --allowedTools Read,Write,Edit,Glob,Grep,Bash               │   │
│  │         -p "<prompt>"                                                │   │
│  │                                                                      │   │
│  │  Working directory: projectPath                                      │   │
│  │  Timeout: 30 minutes                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│        │                                                                    │
│        ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Capture & Parse Output                                              │   │
│  │                                                                      │   │
│  │  stdout ──▶ Buffer ──▶ stream-json parsing                          │   │
│  │                               │                                      │   │
│  │                               ▼                                      │   │
│  │                    ┌─────────────────────┐                          │   │
│  │                    │ Write to log files  │                          │   │
│  │                    │ - item1.plan.json   │                          │   │
│  │                    │ - item1.plan.raw    │                          │   │
│  │                    └─────────────────────┘                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│        │                                                                    │
│        ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Validate Results                                                    │   │
│  │                                                                      │   │
│  │  - Check success/failure markers                                     │   │
│  │  - Extract metrics (TEST_COUNT, ISSUES_FOUND, etc.)                 │   │
│  │  - Return PhaseResult                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Adversarial Review (Split Architecture)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ADVERSARIAL REVIEW - TWO-STEP PROCESS                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  STEP 1: IDENTIFY                                                      │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │  1. Find files (git diff, git log, Glob fallback)               │  │ │
│  │  │  2. Read file contents                                          │  │ │
│  │  │  3. Call Gemini MCP tool with code                              │  │ │
│  │  │  4. Parse issues: [SEVERITY] description (file:line)            │  │ │
│  │  │  5. Output: list of issues to fix                               │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  │                              │                                         │ │
│  │                              ▼                                         │ │
│  │                    ┌──────────────────┐                               │ │
│  │                    │  21 issues found │                               │ │
│  │                    │  - 7 INFO        │                               │ │
│  │                    │  - 14 actionable │                               │ │
│  │                    └──────────────────┘                               │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              │                                              │
│                              ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  STEP 2: FIX                                                           │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │  Input: Numbered list of 14 actionable issues                   │  │ │
│  │  │                                                                  │  │ │
│  │  │  For each issue:                                                │  │ │
│  │  │    1. Read the file                                             │  │ │
│  │  │    2. Understand the issue                                      │  │ │
│  │  │    3. Edit to fix                                               │  │ │
│  │  │    4. Verify (npm run build)                                    │  │ │
│  │  │    5. Mark: #N [SEVERITY] description - FIXED                   │  │ │
│  │  │                                                                  │  │ │
│  │  │  If cannot fix:                                                 │  │ │
│  │  │    #N [SEVERITY] description - REASON: <why>                    │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  │                              │                                         │ │
│  │                              ▼                                         │ │
│  │                    ┌──────────────────┐                               │ │
│  │                    │  Fixed: 14       │                               │ │
│  │                    │  Cannot fix: 0   │                               │ │
│  │                    │  Unfixed: 0      │                               │ │
│  │                    └──────────────────┘                               │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  WHY TWO STEPS?                                                            │
│  - Cognitive load: One task at a time (find OR fix, not both)              │
│  - Debugging: Separate logs for identify vs fix                            │
│  - Retry: Can retry fix step without re-calling Gemini                     │
│  - Visibility: See exactly what Gemini found before fixing                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Type System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CORE TYPES                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PhaseName (8 values)                                                │   │
│  │  'plan' | 'structure-first' | 'implement' | 'test'                   │   │
│  │  | 'refactor-check' | 'adversarial-review' | 'static-analysis'       │   │
│  │  | 'doc-code'                                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Session                                                             │   │
│  │  {                                                                   │   │
│  │    id: string              // UUID                                   │   │
│  │    startTime: Date                                                   │   │
│  │    prdPath: string                                                   │   │
│  │    projectPath: string                                               │   │
│  │    logsDir: string         // .claude/ralph-logs/                    │   │
│  │    currentItem: number                                               │   │
│  │    totalItems: number                                                │   │
│  │    completedItems: number                                            │   │
│  │  }                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PrdItem                                                             │   │
│  │  {                                                                   │   │
│  │    lineNumber: number                                                │   │
│  │    text: string            // "Add user authentication with JWT"    │   │
│  │    status: 'pending' | 'complete'                                    │   │
│  │  }                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  RalphConfig                                                         │   │
│  │  {                                                                   │   │
│  │    skills: {                                                         │   │
│  │      plan: string[]        // Experts for plan phase                 │   │
│  │      build: string[]       // Experts for implement phase            │   │
│  │      test: string[]        // Experts for test phase                 │   │
│  │      review: string[]      // Experts for review phases              │   │
│  │      refactor: string[]                                              │   │
│  │      doc: string[]                                                   │   │
│  │    }                                                                 │   │
│  │    settings: {                                                       │   │
│  │      maxIterations: number        // Default 50                      │   │
│  │      checkpointEvery: number      // Default 3                       │   │
│  │    }                                                                 │   │
│  │  }                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Skill                                                               │   │
│  │  {                                                                   │   │
│  │    name: string            // "kernighan", "schneier"                │   │
│  │    content: string         // Full markdown content                  │   │
│  │    source: 'profile' | 'dynamic'                                     │   │
│  │  }                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Configuration Files

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONFIGURATION HIERARCHY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PROJECT ROOT                                                               │
│  └── .claude/                                                               │
│       ├── ralph-config.yaml        ◄── Project-specific ralph config       │
│       │   ┌──────────────────────────────────────────────────────────┐     │
│       │   │ skills:                                                   │     │
│       │   │   plan: [kernighan, dijkstra]                            │     │
│       │   │   build: [cherny, crockford]                             │     │
│       │   │   test: [dodds, meszaros]                                │     │
│       │   │ settings:                                                 │     │
│       │   │   maxIterations: 50                                      │     │
│       │   └──────────────────────────────────────────────────────────┘     │
│       │                                                                     │
│       ├── active-workflow.json     ◄── Runtime marker (hooks check this)   │
│       │   ┌──────────────────────────────────────────────────────────┐     │
│       │   │ { skill: 'ralph-loop', started: '...', pid: 12345 }      │     │
│       │   └──────────────────────────────────────────────────────────┘     │
│       │                                                                     │
│       ├── ralph-logs/              ◄── Execution logs                       │
│       │   ├── item1-plan.json                                              │
│       │   ├── item1-plan.raw                                               │
│       │   ├── item1-implement.json                                         │
│       │   └── ...                                                          │
│       │                                                                     │
│       └── plans/                   ◄── Generated plan files                 │
│           └── add-user-auth.md                                             │
│                                                                             │
│  CLI PACKAGE                                                                │
│  └── config/                                                                │
│       ├── workflow-phases.yaml     ◄── Phase definitions                    │
│       │   ┌──────────────────────────────────────────────────────────┐     │
│       │   │ phases:                                                   │     │
│       │   │   plan:                                                  │     │
│       │   │     description: Understand requirements                 │     │
│       │   │     experts: [kernighan, pike, dijkstra, ...]           │     │
│       │   │   implement:                                             │     │
│       │   │     experts: [thompson, kernighan, pike, mcilroy]       │     │
│       │   │   ...                                                    │     │
│       │   └──────────────────────────────────────────────────────────┘     │
│       │                                                                     │
│       └── keyword-detection.yaml   ◄── 625+ keyword → expert rules          │
│           ┌──────────────────────────────────────────────────────────┐     │
│           │ rules:                                                    │     │
│           │   security:                                              │     │
│           │     patterns: [auth, jwt, password, encrypt, ...]       │     │
│           │     experts: [schneier, owasp, tanya-janca]             │     │
│           │   database:                                              │     │
│           │     patterns: [sql, query, orm, prisma, ...]            │     │
│           │     experts: [bloch, schneier]                          │     │
│           │   react:                                                 │     │
│           │     patterns: [jsx, hook, useState, context, ...]       │     │
│           │     experts: [abramov, dodds]                           │     │
│           └──────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Summary Generation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUMMARY SYSTEM                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  SummaryCollector (during execution)                                │    │
│  │                                                                      │    │
│  │  collector.startItem(1, "Add user auth")                            │    │
│  │      │                                                               │    │
│  │      ├── collector.addStage({ name: 'plan', status: 'done', ... })  │    │
│  │      ├── collector.addStage({ name: 'implement', ... })             │    │
│  │      ├── collector.addStage({ name: 'test', tests: { passed: 63 }}) │    │
│  │      └── ...                                                         │    │
│  │  collector.completeItem('success')                                   │    │
│  │                                                                      │    │
│  │  collector.startItem(2, "Add password reset")                       │    │
│  │      └── ...                                                         │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                              │                                              │
│                              ▼                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  collector.build() → RunSummary                                     │    │
│  │  {                                                                   │    │
│  │    sessionId: "abc123",                                             │    │
│  │    startTime: "2026-02-01T10:00:00Z",                              │    │
│  │    endTime: "2026-02-01T10:45:00Z",                                │    │
│  │    durationMs: 2700000,                                             │    │
│  │    prdPath: "PRD.md",                                               │    │
│  │    projectType: "TypeScript",                                       │    │
│  │    totalItems: 5,                                                   │    │
│  │    completedItems: 4,                                               │    │
│  │    failedItems: 1,                                                  │    │
│  │    items: [                                                         │    │
│  │      { number: 1, text: "...", status: "success", stages: [...] }, │    │
│  │      ...                                                            │    │
│  │    ]                                                                │    │
│  │  }                                                                   │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                              │                                              │
│                              ▼                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  generateSummaryHtml(summary, logsDir)                              │    │
│  │                                                                      │    │
│  │  1. Read template: src/ui/summary.html                              │    │
│  │  2. Embed data as JSON: <script id="ralph-summary-data">           │    │
│  │  3. Write: ralph-summary-{sessionId}.html                          │    │
│  │  4. Write: ralph-summary-{sessionId}.json (backup)                 │    │
│  │  5. Open in browser                                                 │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                              │                                              │
│                              ▼                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Browser: Interactive D3 visualization                              │    │
│  │  - Stats cards (completed, failed, duration)                        │    │
│  │  - Issues chart (by severity)                                       │    │
│  │  - Improvements list                                                │    │
│  │  - Expandable PRD items with stage details                          │    │
│  │  - Duration breakdown chart                                         │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Module Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MODULE DEPENDENCY GRAPH                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                            ┌──────────────┐                                 │
│                            │   runner.ts  │ (main orchestrator)             │
│                            └──────┬───────┘                                 │
│                                   │                                         │
│          ┌────────────────────────┼────────────────────────┐               │
│          │                        │                        │               │
│          ▼                        ▼                        ▼               │
│  ┌──────────────┐        ┌──────────────┐         ┌──────────────┐        │
│  │   prd/       │        │   phases/    │         │   summary/   │        │
│  │  parser.ts   │        │  index.ts    │         │ collector.ts │        │
│  │  updater.ts  │        │  (factory)   │         │ generator.ts │        │
│  └──────────────┘        └──────┬───────┘         └──────────────┘        │
│                                  │                                         │
│          ┌───────────────────────┼───────────────────────┐                 │
│          │           │           │           │           │                 │
│          ▼           ▼           ▼           ▼           ▼                 │
│  ┌─────────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ plan.ts    │ │implement│ │ test.ts │ │adversar│ │static-  │          │
│  │            │ │  .ts    │ │         │ │ial.ts  │ │analysis │          │
│  └─────────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│          │           │           │           │           │                 │
│          └───────────┴───────────┼───────────┴───────────┘                 │
│                                  │                                         │
│                                  ▼                                         │
│                         ┌──────────────┐                                   │
│                         │ process/     │                                   │
│                         │ claude.ts    │ (spawn Claude CLI)                │
│                         └──────┬───────┘                                   │
│                                │                                           │
│          ┌─────────────────────┼─────────────────────┐                     │
│          │                     │                     │                     │
│          ▼                     ▼                     ▼                     │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐             │
│  │  parsers/    │      │  display/    │      │  skills/     │             │
│  │ stream.ts    │      │ terminal.ts  │      │ loader.ts    │             │
│  └──────────────┘      └──────────────┘      └──────────────┘             │
│                                                      │                     │
│                                                      ▼                     │
│                                              ┌──────────────┐             │
│                                              │   config/    │             │
│                                              │  loader.ts   │             │
│                                              └──────────────┘             │
│                                                      │                     │
│                                     ┌────────────────┼────────────────┐   │
│                                     ▼                ▼                ▼   │
│                              ┌───────────┐   ┌───────────┐   ┌───────────┐│
│                              │workflow-  │   │keyword-   │   │ralph-     ││
│                              │phases.yaml│   │detection  │   │config.yaml││
│                              └───────────┘   │.yaml      │   └───────────┘│
│                                              └───────────┘                │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Key Design Patterns

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Strategy** | `phases/*.ts` | Each phase is interchangeable strategy |
| **Factory** | `phases/index.ts` | `createPhases()` builds phase array |
| **Template Method** | `BasePhase` | Common behavior, subclass specifics |
| **Observer** | `StreamCallbacks` | React to Claude output in real-time |
| **Builder** | `SummaryCollector` | Incrementally build summary |
| **Discriminated Union** | `PhaseResult` | Type-safe success/failure/skip |
| **Dependency Injection** | `PhaseContext` | Context injected to phases |

---

## 13. Expert Masters (Partial List)

| Domain | Masters |
|--------|---------|
| **Code Quality** | kernighan, pike, mcilroy, thompson, dijkstra, linus |
| **Architecture** | gang-of-four, bloch, liskov, leveson |
| **Security** | schneier, owasp, tanya-janca, troy-hunt |
| **Testing** | meszaros, fowler-test, dodds, hevery, feathers |
| **TypeScript** | cherny, hejlsberg, crockford |
| **React** | abramov, dodds |
| **Documentation** | procida, strunk-white, zinsser, king |
| **Performance** | carmack, osmani |
| **UI/UX** | frost, ive, norman, rams |
| **Systems** | taleb, petroski, leveson |

---

## Quick Reference

```
# Run ralph on a PRD
ralph PRD.md

# With options
ralph PRD.md --skip-review --verbose

# Check configuration
cc-config scan
cc-config profile list

# Trace skill detection
cc-config trace "Add JWT authentication"

# Logs location
.claude/ralph-logs/

# Summary location
.claude/ralph-logs/ralph-summary-{sessionId}.html
```
