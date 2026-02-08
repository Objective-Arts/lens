# Developer Guide: Learning to Code in lens

This guide teaches you how to understand and write code in this codebase. No deep TypeScript knowledge required—we explain everything as we go.

---

## Overview

**lens** sets up Claude Code projects with expert skills and configuration profiles, while **ralph** autonomously implements features by running code through a 10-phase workflow (plan → structure → implement → refactor → review → analyze → test → document → security → production-readiness). This reflects Deming's principle of building quality in rather than inspecting it at the end—expert guidance shapes the code from the first line, and quality gates at each phase catch issues when they're cheap to fix, not after the feature is "done." The result is code that is much more reviewable and much closer to production ready.

---

## Part 1: What Are We Building?

This codebase has two tools:

1. **lens** — Sets up projects with the right skills and configuration
2. **ralph** — Runs code through 10 phases to implement features autonomously

Both are command-line tools written in TypeScript.

---

## Part 2: Your First Look at the Code

### The Entry Point

Every program starts somewhere. Ours starts at `src/cli/index.ts`:

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import {
  registerScanCommands,
  registerProfileCommands,
  // ... more imports
} from './commands/index.js';

const program = new Command();

program
  .name('lens')
  .description('Claude Code configuration manager')
  .version('0.1.0');

// Register all command groups
registerScanCommands(program);
registerProfileCommands(program);
// ... more registrations

program.parse();
```

Let's break this down:

| Line | What It Does |
|------|--------------|
| `#!/usr/bin/env node` | Tells the system to run this with Node.js |
| `import { Command } from 'commander'` | Loads the Commander library that handles CLI arguments |
| `const program = new Command()` | Creates a new command-line program |
| `program.name('lens')` | Sets the program name |
| `registerScanCommands(program)` | Adds the "scan" command (we'll see how below) |
| `program.parse()` | Reads what the user typed and runs the right command |

**Key insight**: The entry point is tiny. It just imports and registers commands. The real work happens in separate files.

---

## Part 3: How Commands Work

Look at `src/cli/commands/scan.ts`. This file adds several commands like `scan`, `list`, and `show`:

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { scan } from '../../scanner/index.js';

export function registerScanCommands(program: Command): void {
  program
    .command('scan')
    .description('Scan and discover all Claude Code configuration')
    .option('-p, --project <path>', 'Project path to scan', process.cwd())
    .option('--no-plugins', 'Skip scanning plugins')
    .action(async (options) => {
      console.log(chalk.blue('Scanning Claude Code configuration...\n'));
      const result = await scan({
        projectPath: options.project,
        includePlugins: options.plugins
      });
      printScanSummary(result);
    });
}
```

Breaking this down:

```typescript
export function registerScanCommands(program: Command): void {
```
- `export` — Makes this function available to other files
- `function registerScanCommands` — The function name
- `program: Command` — Takes a Command object as input
- `: void` — Returns nothing (just modifies the program)

```typescript
program
  .command('scan')
  .description('Scan and discover...')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .action(async (options) => {
    // This runs when user types "lens scan"
  });
```

This is **method chaining**—each method returns the same object so you can call another method on it. It reads like a sentence: "Add a command called 'scan' with this description and these options, and when run, do this action."

```typescript
.option('-p, --project <path>', 'Project path to scan', process.cwd())
```
- `-p` — Short flag (user types `-p ./myproject`)
- `--project` — Long flag (user types `--project ./myproject`)
- `<path>` — This option takes a value
- `process.cwd()` — Default value (current directory)

```typescript
.action(async (options) => {
  const result = await scan({ projectPath: options.project });
  printScanSummary(result);
});
```
- `async` — This function does things that take time (reading files)
- `options` — Contains what the user passed (`options.project` is the path)
- `await` — Wait for the scan to finish before continuing
- The `scan` function does the real work; this just calls it and prints results

---

## Part 4: Understanding Types

TypeScript uses types to catch mistakes before you run the code. Look at `src/types.ts`:

```typescript
export type ConfigScope = 'global' | 'project' | 'plugin';
```

This says: "A ConfigScope can ONLY be one of these three strings." If you try to use `'other'`, TypeScript shows an error.

```typescript
export interface ConfigItem {
  type: ConfigItemType;
  name: string;
  scope: ConfigScope;
  path: string;
  tokens: number;
}
```

An **interface** describes the shape of an object. A ConfigItem must have:
- `type` — What kind of item (skill, command, etc.)
- `name` — Its name as a string
- `scope` — Where it lives (global, project, or plugin)
- `path` — File path as a string
- `tokens` — Number (how many tokens it uses)

You can't create a ConfigItem without all these fields. TypeScript enforces it.

### The Skill Type

Skills have both full content and a summary for efficient loading:

```typescript
export interface Skill {
  name: string;
  content: string;        // Full SKILL.md content
  summary: string;        // SUMMARY.md (dense, structured)
  checklist: readonly string[];  // Extracted enforcement items
  source: 'profile' | 'dynamic';
}
```

The `checklist` array contains items extracted from "## Checklist" and "## The X Test" sections — these become hard pass/fail gates in the enforcement model.

### The "Discriminated Union" Pattern

This codebase uses a pattern for results that can be success OR failure:

```typescript
export type PhaseResult =
  | { status: 'success'; message: string }
  | { status: 'failed'; error: string }
  | { status: 'skipped'; reason: string };
```

The `|` means "or". A PhaseResult is one of three shapes:
1. Success: has `status: 'success'` and a `message`
2. Failed: has `status: 'failed'` and an `error`
3. Skipped: has `status: 'skipped'` and a `reason`

Why? Because you can check which one you have:

```typescript
function handleResult(result: PhaseResult) {
  if (result.status === 'success') {
    console.log(result.message);  // TypeScript knows message exists here
  } else if (result.status === 'failed') {
    console.log(result.error);    // TypeScript knows error exists here
  } else {
    console.log(result.reason);   // TypeScript knows reason exists here
  }
}
```

TypeScript knows that when `status === 'success'`, the object has `message`. This prevents bugs.

---

## Part 5: Reading Real Code — The Scanner

Let's trace through `src/scanner/index.ts` to see how real code works:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
```

These are built-in Node.js modules:
- `fs` — File system (read/write files)
- `path` — Handle file paths (join directories, etc.)
- `homedir` — Get the user's home directory (`~`)

```typescript
const GLOBAL_CLAUDE_PATH = path.join(homedir(), '.claude');
```

This builds a path like `/Users/yourname/.claude`. The `path.join` function handles slashes correctly on any operating system.

```typescript
export interface ScanOptions {
  projectPath?: string;
  includePlugins?: boolean;
}
```

The `?` means optional. You can call `scan()` with no options, with just `projectPath`, or with both.

```typescript
export async function scan(options: ScanOptions = {}): Promise<ScanResult> {
  const { projectPath, includePlugins = true } = options;
```

Let's decode this:
- `async function` — This function does slow stuff (file I/O)
- `options: ScanOptions = {}` — If no options given, use empty object
- `: Promise<ScanResult>` — Returns a Promise that eventually gives a ScanResult
- `const { projectPath, includePlugins = true } = options` — **Destructuring**: pulls out `projectPath` and `includePlugins` from options. If `includePlugins` isn't set, default to `true`.

```typescript
const items: ConfigItem[] = [];

// Scan global config
const globalItems = await scanScope(GLOBAL_CLAUDE_PATH, 'global');
items.push(...globalItems);
```

- `ConfigItem[]` — An array of ConfigItem objects
- `await scanScope(...)` — Call another function and wait for it
- `items.push(...globalItems)` — Add all items from globalItems to items. The `...` (spread) unpacks the array.

```typescript
if (projectPath) {
  projectClaudePath = path.join(projectPath, '.claude');
  if (fs.existsSync(projectClaudePath)) {
    const projectItems = await scanScope(projectClaudePath, 'project');
    items.push(...projectItems);
  }
}
```

- `if (projectPath)` — Only run this if projectPath was provided
- `fs.existsSync(...)` — Check if directory exists (returns true/false)

---

## Part 6: How Ralph Phases Work

Ralph runs code through 10 phases. Each phase is a class that extends BasePhase.

### The Base Brain

Every phase loads the **Base Brain** — 10 foundational expert skills:

| # | Skill | Focus |
|---|-------|-------|
| 1 | clarity | No cleverness, obvious code |
| 2 | pragmatism | Get it working first |
| 3 | simplicity | Small interfaces, delete code |
| 4 | composition | Unix philosophy, pipelines |
| 5 | distributed | Failure handling |
| 6 | data-first | Data structures before algorithms |
| 7 | correctness | Formal discipline |
| 8 | algorithms | Algorithmic rigor |
| 9 | abstraction | Substitution principle |
| 10 | optimization | Measure before optimizing |

These are loaded via `SUMMARY.md` files (~4,200 tokens total).

### The Base Class

Look at `src/ralph/phases/types.ts`:

```typescript
export abstract class BasePhase implements Phase {
  abstract readonly name: PhaseName;
  abstract readonly icon: string;
  abstract readonly description: string;

  abstract execute(context: PhaseContext): Promise<PhaseResult>;

  shouldRun(_context: PhaseContext): boolean {
    return true;
  }

  protected buildExpertGuidance(experts: readonly Skill[]): string {
    // Builds prompt with SUMMARY.md content + enforcement checklist
  }

  protected validateAppliedPrinciples(output: string, experts: readonly Skill[]): string | null {
    // Validates APPLIED section cites each expert with specific decisions
  }

  protected success(message: string): PhaseResult {
    return { status: 'success', message };
  }

  protected failed(error: string): PhaseResult {
    return { status: 'failed', error };
  }
}
```

### The Enforcement Model

Skills aren't just guidance — they're enforced:

1. **Full Content**: `buildExpertGuidance()` loads complete `SUMMARY.md` files (not truncated)
2. **Enforcement Checklist**: Extracts checklist items from skills, appends as hard pass/fail gates
3. **APPLIED Validation**: `validateAppliedPrinciples()` checks that each expert is cited with specific decisions

If the APPLIED section is missing, empty, or contains generic claims like "applied clarity principles", the phase fails.

Valid APPLIED entry:
```
- clarity: used early returns to flatten nesting in parseConfig
- simplicity: chose linear scan over hash map — only 12 items, O(n) is clearer
```

Invalid (will fail):
```
- clarity: applied clarity principles
- simplicity: followed simplicity guidance
```

Let's decode:

- `abstract class` — You can't create a BasePhase directly; you must extend it
- `abstract readonly name` — Subclasses MUST define this
- `readonly` — Can't be changed after creation
- `implements Phase` — This class fulfills the Phase interface contract
- `protected` — Only this class and subclasses can use these methods
- `_context` — The underscore means "I'm not using this parameter" (prevents warnings)

### A Real Phase

Now look at `src/ralph/phases/plan.ts`:

```typescript
export class PlanPhase extends BasePhase {
  readonly name = 'plan' as const;
  readonly icon = '📝';
  readonly description = 'Understand requirements, design approach';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;

    // Build the prompt
    let prompt = PLAN_PROMPT
      .replace('{ITEM_TEXT}', item.text)
      .replace('{EXPERT_GUIDANCE}', this.buildExpertGuidance(experts));

    // Run Claude
    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix: this.getLogPrefix(context),
      allowedTools: ['Read', 'Glob', 'Grep', 'Bash'],
    });

    // Check result
    if (!output.success) {
      return this.failed(`Planning failed: ${output.error}`);
    }

    // Save plan
    const planPath = path.join(projectPath, '.claude', 'plans', `${slug}.md`);
    fs.writeFileSync(planPath, output.result);

    return this.success(`Plan saved to ${planPath}`);
  }
}
```

Breaking it down:

```typescript
export class PlanPhase extends BasePhase {
```
- `class PlanPhase` — Define a new class called PlanPhase
- `extends BasePhase` — It inherits from BasePhase (gets all its methods)

```typescript
readonly name = 'plan' as const;
```
- `= 'plan'` — Set the value
- `as const` — Tell TypeScript this is exactly the literal `'plan'`, not just any string

```typescript
async execute(context: PhaseContext): Promise<PhaseResult> {
  const { item, experts, projectPath, logsDir } = context;
```
- Destructure context to get the parts we need
- `context.item` becomes just `item`

```typescript
let prompt = PLAN_PROMPT
  .replace('{ITEM_TEXT}', item.text)
  .replace('{EXPERT_GUIDANCE}', this.buildExpertGuidance(experts));
```
- `PLAN_PROMPT` is a template string defined earlier in the file
- `.replace()` swaps placeholders with real values
- `this.buildExpertGuidance()` calls a method from BasePhase

```typescript
const output = await runClaude({
  prompt,
  projectPath,
  logDir: logsDir,
  allowedTools: ['Read', 'Glob', 'Grep', 'Bash'],
});
```
- Call the Claude CLI with these options
- `await` because it takes time
- `prompt` is shorthand for `prompt: prompt` (when key equals variable name)

```typescript
if (!output.success) {
  return this.failed(`Planning failed: ${output.error}`);
}
```
- If it didn't work, return a failure result
- `this.failed()` is a helper from BasePhase

```typescript
return this.success(`Plan saved to ${planPath}`);
```
- Return a success result with a message

---

## Part 6b: The AI Smell Index

When writing code, avoid patterns that look AI-generated. The `/ai-smell-scan` command measures this with weighted scoring:

| Smell Type | Weight | What to Avoid |
|------------|--------|---------------|
| Over-abstraction | 3 | Factories/wrappers used once, single-use helpers |
| Defensive paranoia | 3 | Null checks where null is impossible |
| Speculative features | 3 | Config options nobody uses |
| Enterprise patterns | 3 | Repository pattern for one entity |
| Generic wrappers | 2 | `Result<T>` when you just throw |
| Excessive structure | 2 | Single-method classes, deep nesting |
| Comment spam | 1 | Comments that repeat the code |
| Verbose naming | 1 | Names longer than 25 characters |

**Index interpretation:**
- 0-5: Clean (human-like code)
- 6-15: Minor — a few AI fingerprints
- 16-30: Moderate — needs attention
- 31+: Heavy — run `/ai-smell-fix`

**Example smell to avoid:**
```typescript
// BAD - principle citation in comment (AI smell)
/**
 * Following design-patterns: Strategy pattern for phases.
 */
export interface Phase { ... }

// GOOD - just the interface
export interface Phase { ... }
```

See [AI Smell Index Reference](reference/ai-smell-index.md) for full details.

---

## Part 7: Common Patterns You'll See

### Async/Await

When code does slow things (reading files, network requests), we use async/await:

```typescript
// BAD - blocks everything
const data = readFileSync('file.txt');

// GOOD - lets other code run while waiting
const data = await readFile('file.txt');
```

Any function using `await` must be marked `async`:

```typescript
async function loadConfig() {
  const data = await fs.promises.readFile('config.json', 'utf-8');
  return JSON.parse(data);
}
```

### Import/Export

To use code from another file:

```typescript
// In src/utils/tokens.ts
export function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

// In another file
import { estimateTokens } from './utils/tokens.js';
const count = estimateTokens('hello world');
```

The `.js` extension is required even though the source is `.ts`.

### Optional Chaining

When something might not exist:

```typescript
// Might crash if item is undefined
const name = item.name;

// Safe - returns undefined if item is undefined
const name = item?.name;

// With a default value
const name = item?.name ?? 'unknown';
```

### Nullish Coalescing

```typescript
// Use default if value is null or undefined
const port = options.port ?? 3000;

// Different from || which also triggers on 0, '', false
const port = options.port || 3000;  // 0 would become 3000
const port = options.port ?? 3000;  // 0 stays 0
```

---

## Part 8: Adding a New Command (Tutorial)

Let's add a command called `hello` that prints a greeting.

### Step 1: Create the Command File

Create `src/cli/commands/hello.ts`:

```typescript
/**
 * Hello command - prints a greeting
 */

import { Command } from 'commander';
import chalk from 'chalk';

export function registerHelloCommand(program: Command): void {
  program
    .command('hello [name]')
    .description('Print a greeting')
    .option('-l, --loud', 'Print in uppercase')
    .action((name, options) => {
      // Default name if not provided
      const who = name ?? 'World';

      // Build the message
      let message = `Hello, ${who}!`;

      // Apply --loud option
      if (options.loud) {
        message = message.toUpperCase();
      }

      // Print with color
      console.log(chalk.green(message));
    });
}
```

What each part does:
- `[name]` — Square brackets mean optional argument
- `options.loud` — Will be `true` if user passed `--loud`
- `chalk.green()` — Makes the text green

### Step 2: Export from Index

Add to `src/cli/commands/index.ts`:

```typescript
export { registerHelloCommand } from './hello.js';
```

### Step 3: Register in Main CLI

Add to `src/cli/index.ts`:

```typescript
import {
  registerScanCommands,
  registerHelloCommand,  // Add this
  // ...
} from './commands/index.js';

// Later in the file:
registerHelloCommand(program);  // Add this
```

### Step 4: Build and Test

```bash
npm run build
lens hello
lens hello Steve
lens hello Steve --loud
```

---

## Part 9: Adding a New Phase (Tutorial)

Let's add a phase called "validate" that checks if files exist.

### Step 1: Create the Phase File

Create `src/ralph/phases/validate.ts`:

```typescript
/**
 * Validate phase - check that expected files exist.
 */

import * as fs from 'fs';
import * as path from 'path';
import { BasePhase, PhaseContext, PhaseResult } from './types.js';

export class ValidatePhase extends BasePhase {
  // Required properties
  readonly name = 'validate' as const;
  readonly icon = '✓';
  readonly description = 'Verify expected files exist';

  // The main work happens here
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { projectPath } = context;

    // List of files that should exist
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
    ];

    // Check each file
    const missing: string[] = [];
    for (const file of requiredFiles) {
      const fullPath = path.join(projectPath, file);
      if (!fs.existsSync(fullPath)) {
        missing.push(file);
      }
    }

    // Return result
    if (missing.length > 0) {
      return this.failed(`Missing files: ${missing.join(', ')}`);
    }

    return this.success('All required files present');
  }
}
```

### Step 2: Add the Type

In `src/ralph/types.ts`, add 'validate' to PhaseName:

```typescript
export type PhaseName =
  | 'plan'
  | 'structure-first'
  | 'implement'
  | 'validate'  // Add this
  | 'test'
  // ...
```

### Step 3: Add to Phase Order

Still in `src/ralph/types.ts`:

```typescript
export const PHASE_ORDER: readonly PhaseName[] = [
  'plan',
  'structure-first',
  'implement',
  'validate',  // Add where you want it to run
  'test',
  // ...
] as const;
```

### Step 4: Export the Phase

Add to `src/ralph/phases/index.ts`:

```typescript
export { ValidatePhase } from './validate.js';
```

### Step 5: Register in Loader

The phase loader needs to know about your phase. Check how other phases are instantiated and add yours.

---

## Part 10: File Organization

```
src/
├── cli/                      # Command-line interface
│   ├── index.ts              # Entry point - starts here
│   ├── commands/             # One file per command group
│   │   ├── index.ts          # Exports all command functions
│   │   ├── scan.ts           # scan, list, show commands
│   │   ├── profile.ts        # profile commands
│   │   └── ...
│   └── display/              # Output formatting
│
├── ralph/                    # Autonomous implementation
│   ├── index.ts              # Ralph entry point
│   ├── runner.ts             # Orchestrates phases
│   ├── types.ts              # Ralph-specific types
│   ├── phases/               # One file per phase
│   │   ├── types.ts          # Phase interface & base class
│   │   ├── plan.ts           # Plan phase
│   │   ├── implement.ts      # Implement phase
│   │   └── ...
│   ├── prd/                  # PRD parsing
│   └── parsers/              # Output parsing
│
├── scanner/                  # Configuration discovery
│   └── index.ts              # Main scan function
│
├── profiles/                 # Profile management
│   └── index.ts              # Load & apply profiles
│
├── canon/                    # Skill management
│   ├── index.ts              # Copy skills
│   └── manifest.ts           # Track versions
│
└── types.ts                  # Shared types (used everywhere)
```

**Rule**: Types go in `types.ts`. Logic goes in `index.ts`. Tests go in `*.test.ts` next to the source.

---

## Part 11: Running and Testing

### Build the Code

```bash
npm run build
```

This compiles TypeScript to JavaScript in `dist/`.

### Run During Development

```bash
npm run dev -- scan -p .
```

The `--` separates npm arguments from your arguments.

### Run Tests

```bash
npm test                    # All tests
npm test -- scanner         # Tests matching "scanner"
npm run test:watch          # Re-run on file changes
```

### Link for Global Use

```bash
npm link
```

Now `lens` and `ralph` work from anywhere.

---

## Part 12: Common Mistakes and Fixes

### "Cannot find module"

```
Error: Cannot find module './foo.js'
```

**Fix**: Add `.js` extension to imports, even for TypeScript files:

```typescript
// Wrong
import { foo } from './foo';

// Right
import { foo } from './foo.js';
```

### "Property does not exist"

```
Property 'name' does not exist on type 'unknown'
```

**Fix**: TypeScript doesn't know the type. Add a type annotation:

```typescript
// Wrong
const item = getItem();
console.log(item.name);

// Right
const item: ConfigItem = getItem();
console.log(item.name);
```

### "Object is possibly undefined"

```
Object is possibly 'undefined'
```

**Fix**: Check if it exists first, or use optional chaining:

```typescript
// Wrong
console.log(options.project.length);

// Right - check first
if (options.project) {
  console.log(options.project.length);
}

// Right - optional chaining
console.log(options.project?.length ?? 0);
```

### Async Function Not Awaited

```typescript
// Wrong - result is a Promise, not the actual data
const result = scan({ projectPath: '.' });
console.log(result.items);  // undefined!

// Right - await the Promise
const result = await scan({ projectPath: '.' });
console.log(result.items);  // works!
```

---

## Part 13: Where to Find Things

| "I want to..." | Look in... |
|----------------|------------|
| Add a CLI command | `src/cli/commands/` |
| Add a Ralph phase | `src/ralph/phases/` |
| Change how scanning works | `src/scanner/index.ts` |
| Change how profiles work | `src/profiles/index.ts` |
| Add a new type | `src/types.ts` or `src/ralph/types.ts` |
| See how tests are written | Any `*.test.ts` file |
| Understand the config format | `config/workflow-phases.yaml` |
| See how skills are loaded | `src/ralph/skills/loader.ts` |
| See how enforcement works | `src/ralph/phases/types.ts` (BasePhase) |
| Understand the Base Brain | `profiles/software-base.yaml` |
| See workflow skill definitions | `workflow-skills/workflow/*/SKILL.md` |

---

## Quick Reference Card

### TypeScript Syntax

```typescript
// Variable with type
const name: string = 'hello';

// Optional parameter
function greet(name?: string) {}

// Default parameter
function greet(name: string = 'World') {}

// Array type
const items: string[] = ['a', 'b'];

// Object type (interface)
interface Person {
  name: string;
  age: number;
}

// Union type (one of several)
type Status = 'pending' | 'done' | 'failed';

// Function type
type Handler = (event: Event) => void;

// Async function
async function load(): Promise<Data> {
  return await fetch('/data');
}
```

### Common Operations

```typescript
// Read a file
import * as fs from 'fs';
const content = fs.readFileSync('file.txt', 'utf-8');

// Check if file exists
if (fs.existsSync('file.txt')) { ... }

// Join paths
import * as path from 'path';
const full = path.join(dir, 'file.txt');

// Get home directory
import { homedir } from 'os';
const home = homedir();  // /Users/yourname

// Find files matching pattern
import { glob } from 'glob';
const files = await glob('**/*.ts');
```

---

## Next Steps

1. Read `src/types.ts` to understand the data structures
2. Read `src/cli/commands/scan.ts` as a simple command example
3. Read `src/ralph/phases/plan.ts` as a phase example
4. Try adding your own command (Part 8)
5. Try adding your own phase (Part 9)

When stuck, look at existing code that does something similar. This codebase is consistent—patterns repeat.
