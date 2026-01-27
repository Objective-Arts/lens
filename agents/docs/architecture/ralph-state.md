# Ralph Loop State Machine

Technical explanation of the PRD-driven development loop.

## State Machine

```
           ┌──────────────┐
           │   loading    │
           └──────┬───────┘
                  │ CANON_LOADED
                  ▼
           ┌──────────────┐
     ┌────▶│   working    │◀────┐
     │     └──────┬───────┘     │
     │            │             │
     │    ┌───────┴───────┐     │
     │    │               │     │
     │    ▼               ▼     │
     │ ITEM_COMPLETED  ITEM_FAILED
     │    │               │     │
     │    └───────┬───────┘     │
     │            │             │
     │     more items?          │
     │       yes ───────────────┘
     │       no
     │            │
     │            ▼
     │     ┌──────────────┐
     │     │  validating  │
     │     └──────┬───────┘
     │            │
     │    ┌───────┴───────┐
     │    │               │
     │    ▼               ▼
     │ VALIDATION_PASSED  VALIDATION_FAILED
     │    │               │
     │    └───────┬───────┘
     │            │
     │            ▼
     │     ┌──────────────┐
     └────▶│   complete   │
           └──────────────┘
```

## State Definition

```typescript
interface RalphState {
  phase: 'loading' | 'working' | 'validating' | 'complete';
  currentItem: number;      // 0-indexed
  totalItems: number;
  iterations: number;       // Safeguard against infinite loops
  maxIterations: number;    // Default: 50
  completedItems: readonly string[];
  failedItems: readonly string[];
}
```

## Transitions

**File:** `src/session/state.ts`

```typescript
type RalphEvent =
  | { type: 'CANON_LOADED' }
  | { type: 'ITEM_STARTED' }
  | { type: 'ITEM_COMPLETED'; itemId: string }
  | { type: 'ITEM_FAILED'; itemId: string }
  | { type: 'VALIDATION_STARTED' }
  | { type: 'VALIDATION_PASSED' }
  | { type: 'VALIDATION_FAILED' };

function transition(state: RalphState, event: RalphEvent): RalphState {
  switch (event.type) {
    case 'CANON_LOADED':
      return { ...state, phase: 'working' };

    case 'ITEM_COMPLETED':
      return {
        ...state,
        currentItem: state.currentItem + 1,
        completedItems: [...state.completedItems, event.itemId],
        iterations: state.iterations + 1,
      };

    case 'ITEM_FAILED':
      return {
        ...state,
        currentItem: state.currentItem + 1,
        failedItems: [...state.failedItems, event.itemId],
        iterations: state.iterations + 1,
      };

    // ... more transitions
  }
}
```

## Continue Condition

```typescript
function shouldContinue(state: RalphState): boolean {
  return (
    state.phase === 'working' &&
    state.currentItem < state.totalItems &&
    state.iterations < state.maxIterations
  );
}
```

## Checkpointing

Progress is saved to disk:

```typescript
async function checkpoint(
  state: RalphState,
  prdPath: string,
  cwd: string
): Promise<string> {
  const checkpointPath = join(cwd, '.claude', 'ralph-checkpoint.json');
  await writeFile(checkpointPath, JSON.stringify({
    prdPath,
    state,
    savedAt: new Date().toISOString(),
  }));
  return checkpointPath;
}
```

Resume from checkpoint:

```typescript
async function restoreFromCheckpoint(
  prdPath: string,
  cwd: string
): Promise<RalphState | null> {
  const checkpointPath = join(cwd, '.claude', 'ralph-checkpoint.json');
  try {
    const content = await readFile(checkpointPath, 'utf-8');
    const data = JSON.parse(content);
    if (data.prdPath === prdPath) {
      return data.state;
    }
  } catch {
    return null;
  }
  return null;
}
```

## PRD Parsing

```typescript
async function parsePRD(prdPath: string): Promise<PRDItem[]> {
  const content = await readFile(prdPath, 'utf-8');
  const items: PRDItem[] = [];

  // Match numbered items: "1. Description"
  const itemRegex = /^(\d+)\.\s+(.+)$/gm;
  let match;

  while ((match = itemRegex.exec(content)) !== null) {
    items.push({
      id: `item-${match[1]}`,
      description: match[2].trim(),
      acceptanceCriteria: parseAcceptanceCriteria(content, match.index),
      priority: 'must',
    });
  }

  return items;
}
```

## Iteration Safeguard

The `maxIterations` limit prevents infinite loops:

```typescript
const state = createInitialState({
  totalItems: items.length,
  maxIterations: options.maxIterations ?? 50,
});

while (shouldContinue(state)) {
  // Process item...
  // iterations increments on each ITEM_COMPLETED or ITEM_FAILED
}
```

If iterations hits the limit, the loop exits gracefully.

## Session Logging

Every state change is logged:

```typescript
await logEvent(sessionId, 'state-changed', {
  phase: state.phase,
  currentItem: state.currentItem,
  iterations: state.iterations,
});
```

## See Also

- [How to Run PRD-Driven Development](../how-to/ralph-loop.md)
- [API: runRalphLoop](../reference/api.md#runralphloop)
