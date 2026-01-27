# How Canon Enforcement Works

Technical explanation of the hook-based enforcement system.

## The Problem

Prompt-based instructions are advisory. Claude can ignore "always cite your sources" just like any other instruction. We needed programmatic enforcement.

## The Solution: SDK Hooks

The Claude Agent SDK provides hooks that intercept events:

| Hook Event | When Triggered | Our Use |
|------------|----------------|---------|
| `SessionStart` | Session begins | Load canon into context |
| `PreToolUse` | Before any tool | Block Edit/Write without citation |
| `Stop` | Session ending | Run quality gates |

## Hook Flow

```
Session Start
    │
    ▼
┌─────────────────┐
│ Canon Loader    │  ← Reads SUMMARY.md files
│ (SessionStart)  │    Injects into system prompt
└────────┬────────┘
         │
         ▼
    Claude works...
         │
         ▼
┌─────────────────┐
│ Citation Check  │  ← Reads conversation transcript
│ (PreToolUse)    │    Searches for author names
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 ALLOW     DENY
(cited)   (no cite)
    │         │
    ▼         ▼
  Edit    "Citation required..."
 happens   Claude must cite
              then retry
         │
         ▼
    Session ending...
         │
         ▼
┌─────────────────┐
│ Quality Gates   │  ← Runs tsc, tests, lint
│ (Stop)          │    Blocks if failures
└─────────────────┘
```

## Canon Loader Hook

**File:** `src/hooks/canon-loader.ts`

At session start:

1. Detect project type (TypeScript, React, etc.)
2. Determine required canon (cherny for TS, dodds for tests, etc.)
3. Read SUMMARY.md files from canon directory
4. Inject into Claude's system prompt via `appendSystemPrompt`

```typescript
const canonLoaderHook: HookCallback = async (input) => {
  const requiredCanon = await detectCanonForProject(input.cwd);
  const content = await loadMultipleSummaries(requiredCanon);

  return {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: formatCanonForContext(content),
    },
  };
};
```

## Citation Enforcer Hook

**File:** `src/hooks/citation-enforcer.ts`

Before Edit/Write tools:

1. Read conversation transcript (`transcript_path` from SDK)
2. Parse last 10 assistant messages
3. Search for canon author names (case-insensitive)
4. If found: allow the edit
5. If not found: deny with helpful message

```typescript
const citationEnforcerHook: HookCallback = async (input) => {
  const { tool_name, transcript_path } = input;

  // Only check Edit/Write/NotebookEdit
  if (!isCitationRequiredTool(tool_name)) return {};

  // Read transcript and search for citations
  const hasCitation = await checkTranscriptForCitation(
    transcript_path,
    canonState.summariesLoaded
  );

  if (!hasCitation) {
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'Citation required...',
      },
    };
  }

  return {}; // Allow
};
```

## Citation Detection

The enforcer searches for author names in Claude's recent messages:

```typescript
function textContainsCitation(text: string, loadedCanon: string[]): boolean {
  const lowerText = text.toLowerCase();

  for (const canon of loadedCanon) {
    // "javascript/cherny" → "cherny"
    const authorName = canon.split('/').pop()?.toLowerCase();
    if (lowerText.includes(authorName)) {
      return true;
    }
  }

  return false;
}
```

Valid citations:

```
"Following Cherny's preference..."     ✓ contains "cherny"
"Per the cherny canon..."              ✓ contains "cherny"
"Using discriminated unions..."        ✗ no author name
"Following best practices..."          ✗ no author name
```

## Quality Gate Hook

**File:** `src/hooks/quality-gate.ts`

Before session ends:

1. Run TypeScript compiler (`tsc --noEmit`)
2. Run tests (`npm test` or detected test command)
3. Run linter (`npm run lint` if available)
4. If any fail: block completion, show errors

```typescript
const qualityGateHook: HookCallback = async (input) => {
  const results = await checkAllGates(input.cwd);
  const failed = results.filter(r => r.status === 'failed');

  if (failed.length > 0) {
    return {
      continue: false,
      stopReason: `Quality gates failed: ${failed.map(f => f.reason).join(', ')}`,
    };
  }

  return {}; // Allow completion
};
```

## Why Hooks, Not Prompts?

| Approach | Enforcement | Bypassable? |
|----------|-------------|-------------|
| Prompt instructions | Advisory | Yes, Claude can ignore |
| SDK Hooks | Programmatic | No, tool call is blocked |

The citation enforcer returns `permissionDecision: 'deny'` which the SDK respects at the transport level. Claude cannot proceed until the condition is met.

## Fail-Open Design

If we can't read the transcript or encounter errors:

```typescript
} catch {
  // If we can't read transcript, allow the operation
  // (fail open rather than blocking all edits)
  return true;
}
```

This prevents the enforcement from breaking normal workflows due to edge cases.

## See Also

- [API: Hooks](../reference/api.md#hooks)
- [How to Cite Correctly](../how-to/citation-examples.md)
