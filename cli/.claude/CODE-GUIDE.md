# CLI Code Guide

How the cc-config CLI and Ralph system work at a code level.

## Quick Overview

```
cc-config/
├── src/cli/           # CLI commands (cc-config profile, canon, etc.)
├── src/ralph/         # Ralph autonomous loop (the core)
├── src/ui/            # Web UI server
├── src/tools/         # Tool utilities
└── src/trace/         # Skill tracing
```

## Entry Points

### cc-config CLI (`src/cli/index.ts`)

```typescript
// Commander.js based CLI
const program = new Command();
registerScanCommands(program);
registerProfileCommands(program);
registerCanonCommands(program);
registerWorkflowCommands(program);  // includes ralph command
// ...
program.parse();
```

**Commands are in `src/cli/commands/`** - each file exports a `registerXxxCommands(program)` function.

### Ralph Entry (`src/ralph/index.ts`)

```typescript
export { run } from './runner.js';
```

Called by the `ralph` command in workflow.ts.

---

## Ralph: The Core System

Ralph is a PRD-driven autonomous implementation loop. Given a PRD file with checklist items, it processes each item through 8 phases until complete.

### Main Loop (`src/ralph/runner.ts`)

```
run(options)
  ├── loadConfig()           # Load ralph-config.yaml
  ├── parsePrd()             # Parse PRD file
  ├── createSession()        # Create session with logs dir
  └── processAllItems()
       └── for each incomplete item:
            ├── processItem()
            │    └── runItemPhases()
            │         └── for each phase:
            │              ├── buildPhaseContext()
            │              ├── executePhaseWithRetry()
            │              └── processPhaseResult()
            ├── markItemComplete()
            └── updatePrdFile()
```

### The 8 Phases (`PHASE_ORDER` in types.ts)

| # | Phase | Purpose | Tool |
|---|-------|---------|------|
| 1 | `plan` | Create implementation plan | Claude + experts |
| 2 | `structure-first` | Design types and interfaces | Claude + experts |
| 3 | `implement` | Write the code | Claude + experts |
| 4 | `refactor-check` | Clean up code structure | Claude + experts |
| 5 | `adversarial-review` | Security/quality review | **Gemini MCP** |
| 6 | `static-analysis` | Linting and type checking | **Qodana MCP** |
| 7 | `test` | Write and run tests | Claude + experts |
| 8 | `doc-code` | Generate documentation | Claude + experts |

Phases 5-6 use MCP tools (external AI) instead of Claude experts.

---

## Phase Implementation

### Phase Interface (`src/ralph/phases/types.ts`)

```typescript
interface Phase {
  name: PhaseName;
  icon: string;
  description: string;
  execute(context: PhaseContext): Promise<PhaseResult>;
  shouldRun(context: PhaseContext): boolean;
}

type PhaseResult =
  | { status: 'success'; message: string; metrics?: Record<string, number>; rawOutput?: string }
  | { status: 'failed'; error: string }
  | { status: 'skipped'; reason: string };
```

### BasePhase Class

All phases extend `BasePhase` which provides:

- `getLogPrefix()` - Generate log file name
- `buildExpertGuidance()` - Format expert skills for prompt
- `success()`, `failed()`, `skipped()` - Create result objects

### Example Phase (`src/ralph/phases/implement.ts`)

```typescript
export class ImplementPhase extends BasePhase {
  readonly name = 'implement' as const;
  readonly icon = '🔨';
  readonly description = 'Implement from plan';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;
    const expertGuidance = this.buildExpertGuidance(experts);

    const prompt = IMPLEMENT_PROMPT
      .replace('{ITEM_TEXT}', item.text)
      .replace('{EXPERT_GUIDANCE}', expertGuidance);

    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix: this.getLogPrefix(context),
      allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
    });

    if (!output.success) {
      return this.failed(`Implementation failed: ${extractError(output.result)}`);
    }
    return this.success('Implementation complete', { linesWritten: 100 }, output.result);
  }
}
```

---

## Claude Process (`src/ralph/process/claude.ts`)

Spawns the Claude CLI and captures output.

```typescript
export async function runClaude(options: ClaudeOptions): Promise<ClaudeOutput> {
  const child = spawn('claude', [
    '--output-format', 'stream-json',
    '--verbose',
    '--dangerously-skip-permissions',
    '-p', prompt,
    '--allowedTools', allowedTools.join(','),
  ], { cwd: projectPath });

  // Collect output, parse streaming JSON for tool events
  // Return { success, jsonPath, rawPath, result, durationMs }
}
```

### StreamCallbacks

For real-time monitoring of Claude tool usage:

```typescript
interface StreamCallbacks {
  onToolCall?: (toolName: string, input?: string) => void;
  onToolResult?: (toolName: string, output?: string) => void;
  onText?: (text: string) => void;
}
```

Used by adversarial-review and static-analysis to show "Calling Gemini..." etc.

---

## Self-Correction Retry Loop

When a phase fails validation, it can retry with a corrective prompt.

### Correctable Failures (`isCorrectableFailure()`)

```typescript
const correctablePatterns = [
  /issues not fixed/i,
  /function.*is.*lines.*max.*30/i,
  /vague.*names/i,
  /missing.*sections/i,
  /tests.*failed/i,
  /ISSUES_REMAINING.*[1-9]/i,
];
```

### Retry Flow

```
executePhaseWithRetry()
  for attempt in 0..MAX_RETRIES:
    result = phase.execute(context)
    if result.success or !isCorrectableFailure(error):
      return result
    context.correctivePrompt = buildCorrectivePrompt(error, attempt)
    continue
```

---

## MCP Phases

Phases 5-6 call external tools via MCP (Model Context Protocol).

### adversarial-review.ts

```typescript
// Two-step process:
// 1. IDENTIFY: Call Gemini to find issues
const stream: StreamCallbacks = {
  onToolCall: (name) => {
    if (name.includes('gemini')) {
      console.log('Calling Gemini...');
    }
  },
};
// 2. FIX: Have Claude fix each issue
```

### static-analysis.ts

```typescript
// Calls Qodana MCP tools:
// - mcp__qodana__qodana_detect (check project type)
// - mcp__qodana__qodana_scan (run analysis)
// - mcp__qodana__qodana_problems (get issues)
```

---

## Key Types (`src/ralph/types.ts`)

```typescript
// PRD item from checklist
interface PrdItem {
  lineNumber: number;
  text: string;
  status: 'pending' | 'complete';
}

// Session state
interface Session {
  id: string;
  startTime: Date;
  prdPath: string;
  projectPath: string;
  logsDir: string;
  currentItem: number;
  totalItems: number;
  completedItems: number;
}

// Phase execution context
interface PhaseContext {
  session: Session;
  item: PrdItem;
  experts: Skill[];
  projectPath: string;
  logsDir: string;
  correctivePrompt?: string;  // For retry attempts
}

// Claude process output
interface ClaudeOutput {
  success: boolean;
  jsonPath: string;
  rawPath: string;
  result: string;
  durationMs: number;
}
```

---

## Support Modules

### PRD (`src/ralph/prd/`)

- `parser.ts` - Parse PRD markdown into PrdItem[]
- `updater.ts` - Mark items complete with [x]

### Display (`src/ralph/display/`)

- `terminal.ts` - Spinner class, printHeader, printStageComplete, etc.
- `phase-output.ts` - Parse and display phase results

### Summary (`src/ralph/summary/`)

- `collector.ts` - SummaryCollector class accumulates results
- `generator.ts` - Generate HTML summary from collected data

### Parsers (`src/ralph/parsers/`)

- `claude-stream.ts` - Extract result from Claude JSON output
- `gemini.ts` - Parse Gemini review output
- `qodana.ts` - Parse Qodana SARIF output

### Skills (`src/ralph/skills/`)

- `loader.ts` - Load skill content from .claude/skills/

### Config (`src/ralph/config/`)

- `loader.ts` - Load ralph-config.yaml

---

## File Naming Conventions

```
src/ralph/
├── phases/
│   ├── types.ts          # Interface definitions
│   ├── index.ts          # Export createPhases()
│   ├── loader.ts         # Load phase implementations
│   ├── mcp-helpers.ts    # Shared MCP phase utilities
│   ├── plan.ts           # PlanPhase
│   ├── implement.ts      # ImplementPhase
│   └── ...
├── prd/
│   ├── parser.ts         # Pure functions
│   ├── updater.ts        # Pure functions
│   └── index.ts          # Re-exports
└── ...
```

Pattern: `module/index.ts` re-exports public API.

---

## Adding a New Phase

1. Create `src/ralph/phases/my-phase.ts`:

```typescript
import { BasePhase, PhaseContext, PhaseResult } from './types.js';

const MY_PROMPT = `...`;

export class MyPhase extends BasePhase {
  readonly name = 'my-phase' as const;
  readonly icon = '🎯';
  readonly description = 'Does something useful';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    // Implementation
  }
}
```

2. Add to `PHASE_ORDER` in `src/ralph/types.ts`

3. Register in `src/ralph/phases/loader.ts`

4. Add skill mapping in `runner.ts` `getProfileExpertsForPhase()`

---

## Testing

```bash
npm test                    # Run all 492 tests
npm test -- --watch         # Watch mode
npm test -- phases          # Run phase tests only
```

Test files are co-located: `foo.ts` → `foo.test.ts`

---

## Build

```bash
npm run build               # TypeScript → dist/
npm link                    # Make globally available
```

Changes require rebuild for `ralph` command to pick them up.
