# API Reference

Complete API reference for @claude-optimal/agents.

## Main Functions

### runWithCanon

Run a prompt with canon enforcement.

```typescript
function runWithCanon(
  prompt: string,
  agentType: AgentType,
  options?: Partial<CanonAgentOptions>
): AsyncGenerator<AgentMessage, AgentResult, undefined>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `prompt` | `string` | The task to perform |
| `agentType` | `AgentType` | Agent type (see below) |
| `options` | `CanonAgentOptions` | Optional configuration |

**Agent Types:**

| Type | Description |
|------|-------------|
| `'structure-first'` | Design types before implementation |
| `'build-from-plan'` | Implement from approved plan |
| `'refactor-clean'` | Clean up legacy code |

**Options:**

```typescript
interface CanonAgentOptions {
  sessionId?: string;           // Custom session ID
  cwd?: string;                 // Working directory
  maxTurns?: number;            // Max API turns
  enableCitationEnforcement?: boolean;  // Default: true
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions';
  model?: string;               // Claude model
  additionalCanon?: string[];   // Extra canon to load
  skipGates?: string[];         // Quality gates to skip
}
```

**Example:**

```typescript
import { runWithCanon } from '@claude-optimal/agents';

for await (const msg of runWithCanon(
  "Add email validation",
  'build-from-plan',
  { maxTurns: 10 }
)) {
  console.log(msg.content);
}
```

---

### runRalphLoop

Run autonomous PRD-driven development.

```typescript
function runRalphLoop(
  prdPath: string,
  options?: RalphOptions
): AsyncGenerator<AgentMessage, RalphResult, undefined>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `prdPath` | `string` | Path to PRD markdown file |
| `options` | `RalphOptions` | Loop configuration |

**Options:**

```typescript
interface RalphOptions {
  maxIterations?: number;      // Default: 50
  checkpointInterval?: number; // Default: 3 items
  external?: boolean;          // Run Gemini + Qodana
}
```

**Result:**

```typescript
interface RalphResult extends AgentResult {
  state: RalphState;
  itemsCompleted: readonly string[];
  itemsFailed: readonly string[];
}
```

**Example:**

```typescript
import { runRalphLoop } from '@claude-optimal/agents';

const result = await (async () => {
  let finalResult;
  for await (const msg of runRalphLoop('./PRD.md', {
    maxIterations: 100,
    external: true,
  })) {
    if (msg.type === 'status') console.log(msg.content);
    finalResult = msg;
  }
  return finalResult;
})();
```

---

### runStructureFirst

Design data structures before implementation.

```typescript
function runStructureFirst(
  prompt: string,
  options?: StructureFirstOptions
): AsyncGenerator<AgentMessage, StructureFirstResult, undefined>
```

---

### runRefactorClean

Systematically clean up legacy code.

```typescript
function runRefactorClean(
  prompt: string,
  options?: RefactorCleanOptions
): AsyncGenerator<AgentMessage, RefactorCleanResult, undefined>
```

---

## Hooks

### canonLoaderHook

SessionStart hook that loads canon into context.

```typescript
const canonLoaderHook: HookCallback
```

### citationEnforcerHook

PreToolUse hook that blocks Edit/Write without citation.

```typescript
const citationEnforcerHook: HookCallback
```

### qualityGateHook

Stop hook that runs TypeScript, tests, and lint.

```typescript
const qualityGateHook: HookCallback
```

---

## Canon Functions

### setCanonPath / getCanonPath

Configure canon directory location.

```typescript
function setCanonPath(path: string): void
function getCanonPath(): string
```

### detectCanonForProject

Auto-detect canon based on project files.

```typescript
function detectCanonForProject(cwd: string): Promise<string[]>
```

### loadSummary

Load a single canon SUMMARY.md.

```typescript
function loadSummary(canonPath: string): Promise<string | null>
```

---

## Types

### AgentMessage

Simplified message from agent.

```typescript
interface AgentMessage {
  type: 'text' | 'tool_use' | 'tool_result' | 'status' | 'system' | 'result';
  content: string;
  metadata?: Record<string, unknown>;
  raw?: SDKMessage;
}
```

### AgentResult

Result of agent execution.

```typescript
interface AgentResult {
  success: boolean;
  filesModified: readonly string[];
  gateResults: readonly GateResult[];
  sessionLogPath: string;
}
```

### GateResult

Quality gate check result (discriminated union).

```typescript
type GateResult =
  | { status: 'passed'; evidence: string }
  | { status: 'failed'; reason: string }
  | { status: 'skipped'; reason: string };
```

### CanonState

Current canon loading state.

```typescript
interface CanonState {
  summariesLoaded: readonly string[];
  fullSkillsLoaded: readonly string[];
  citationsRequired: boolean;
  lastLoadedAt: Date;
}
```

---

## CLI Reference

```
canon [options] <prompt>
canon --prd <file>

OPTIONS:
  -a, --agent <type>     Agent type (default: build-from-plan)
  -p, --prd <file>       Run Ralph loop with PRD file
  -c, --canon-path <dir> Path to canon directory
  -m, --model <model>    Model to use
  --max-turns <n>        Maximum turns
  --no-citation          Disable citation enforcement
  --bypass               Bypass permission prompts
  -h, --help             Show help
```
