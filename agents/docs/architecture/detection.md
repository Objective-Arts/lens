# How Canon Detection Works

Technical explanation of automatic canon selection.

## Overview

Canon is auto-detected based on:

1. **Project files** - package.json, tsconfig.json, etc.
2. **File patterns** - .ts, .tsx, test files, etc.
3. **Code context** - auth code, form handling, etc.

## Detection Hierarchy

```
Project Detection (once at session start)
    │
    ├── Foundational (always)
    │   └── kernighan, gang-of-four
    │
    ├── Language-specific
    │   ├── tsconfig.json → cherny
    │   ├── package.json (react) → frost, norman
    │   └── requirements.txt → beazley, ramalho
    │
    └── Context-specific (per-file)
        ├── *.test.ts → dodds, meszaros
        ├── auth*.ts → schneier
        └── *.css → rams
```

## Project Detection

**File:** `src/canon/detector.ts`

At session start, we scan the project:

```typescript
async function detectCanonForProject(cwd: string): Promise<string[]> {
  const canon: string[] = [];

  // Foundational - always loaded
  canon.push('kernighan', 'gang-of-four');

  // TypeScript
  if (await fileExists(join(cwd, 'tsconfig.json'))) {
    canon.push('javascript/cherny');
  }

  // React
  const pkg = await readPackageJson(cwd);
  if (pkg?.dependencies?.react) {
    canon.push('ui-ux/frost', 'ui-ux/norman');
  }

  // Testing
  if (pkg?.devDependencies?.['@testing-library/react']) {
    canon.push('javascript/dodds');
  }

  return [...new Set(canon)]; // Deduplicate
}
```

## File Pattern Detection

For dynamic loading based on current file:

```typescript
const CANON_PATTERNS: CanonPattern[] = [
  { pattern: /\.(test|spec)\.(ts|tsx|js|jsx)$/, canon: ['javascript/dodds', 'testing/meszaros'] },
  { pattern: /auth|login|password/i, canon: ['security/schneier'] },
  { pattern: /\.css$|\.scss$/, canon: ['rams'] },
  { pattern: /form|input|validation/i, canon: ['ui-ux/wroblewski'] },
];

function detectCanonForFile(filePath: string): string[] {
  return CANON_PATTERNS
    .filter(p => p.pattern.test(filePath))
    .flatMap(p => p.canon);
}
```

## Agent-Specific Canon

Each agent type has required canon:

| Agent | Required Canon | Reason |
|-------|----------------|--------|
| `structure-first` | (project-detected) | Type design |
| `build-from-plan` | (project-detected) | Implementation |
| `refactor-clean` | `testing/feathers` | Legacy code patterns |
| `ralph-loop` | `testing/meszaros` | Test patterns for gates |

```typescript
const AGENT_DEFINITIONS = {
  'refactor-clean': {
    requiredCanon: ['testing/feathers'],  // Always needed for refactoring
    qualityGates: ['typescript', 'tests'],
  },
  'build-from-plan': {
    requiredCanon: [],  // Project detection handles it
    qualityGates: ['typescript', 'tests', 'lint'],
  },
};
```

## Canon Loading Order

1. **Project canon** - Detected from project files
2. **Agent canon** - Required by agent type
3. **Additional canon** - Specified via options

```typescript
const projectCanon = await detectCanonForProject(cwd);
const allCanon = [
  ...projectCanon,                    // From project detection
  ...definition.requiredCanon,        // From agent type
  ...(options.additionalCanon ?? []), // From user options
];
```

## SUMMARY.md Resolution

Canon paths resolve to SUMMARY.md files:

```
"javascript/cherny"
  → {CANON_PATH}/javascript/cherny/SUMMARY.md

"testing/meszaros"
  → {CANON_PATH}/testing/meszaros/SUMMARY.md
```

Fallback to SKILL.md if SUMMARY.md doesn't exist:

```typescript
async function loadSummaryFile(canonPath: string): Promise<string | null> {
  const summaryPath = join(canonRoot, canonPath, 'SUMMARY.md');
  try {
    return await readFile(summaryPath, 'utf-8');
  } catch {
    // Fallback to full SKILL.md
    const skillPath = join(canonRoot, canonPath, 'SKILL.md');
    return await readFile(skillPath, 'utf-8');
  }
}
```

## Adding Custom Detection

To add detection for your domain:

```typescript
// In canon/detector.ts

const CANON_PATTERNS: CanonPattern[] = [
  // Existing patterns...

  // Your custom patterns
  { pattern: /graphql/i, canon: ['your-org/graphql-patterns'] },
  { pattern: /kubernetes|k8s/i, canon: ['your-org/k8s-practices'] },
];
```

## See Also

- [How to Use Custom Canon](../how-to/custom-canon.md)
- [Canon Reference](../reference/canon.md)
