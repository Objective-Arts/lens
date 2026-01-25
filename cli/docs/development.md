# cc-config Development Guide

Contributing to and extending the CLI.

## Setup

```bash
# Clone and install
cd cli
npm install

# Build
npm run build

# Run tests
npm test

# Link for local development
npm link
```

## Project Structure

```
cli/
├── src/
│   ├── cli/
│   │   ├── index.ts              # CLI entry point
│   │   └── cli.integration.test.ts
│   ├── scanner/
│   │   ├── index.ts              # Configuration discovery
│   │   └── scanner.test.ts
│   ├── profiles/
│   │   ├── index.ts              # Profile management
│   │   └── profiles.test.ts
│   ├── canon/
│   │   ├── index.ts              # Canon skill management
│   │   ├── manifest.ts           # Manifest operations
│   │   ├── hash.ts               # Content hashing
│   │   └── types.ts
│   ├── workflow/
│   │   ├── index.ts              # Workflow skill management
│   │   └── types.ts
│   ├── mcp/
│   │   ├── index.ts              # MCP re-exports
│   │   ├── registry.ts           # Server registry
│   │   ├── operations.ts         # Install/enable operations
│   │   ├── types.ts
│   │   └── registry.test.ts
│   ├── parser/
│   │   ├── claude-md.ts          # CLAUDE.md parsing
│   │   └── settings.ts           # settings.json parsing
│   ├── utils/
│   │   ├── tokens.ts             # Token estimation
│   │   ├── tokens.test.ts
│   │   └── validation.ts         # Input validation
│   └── types.ts                  # Shared types
├── docs/
│   ├── architecture.md
│   ├── api-reference.md
│   └── development.md
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Testing

Tests use Vitest and follow the Testing Trophy pattern.

### Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run specific file
npm test -- scanner.test.ts

# Run with coverage
npm run test:coverage
```

### Test Structure

```typescript
// Integration test example
describe('cc-config CLI integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cc-config-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('applies profile correctly', async () => {
    // Test full workflow
    const result = await applyComposableProfile(testProfile, tempDir);

    expect(result.errors).toHaveLength(0);
    expect(fs.existsSync(path.join(tempDir, '.claude', 'skills'))).toBe(true);
  });
});
```

### Test Categories

| Category | Location | Purpose |
|----------|----------|---------|
| Unit | `*.test.ts` next to source | Individual functions |
| Integration | `cli.integration.test.ts` | Full CLI workflows |

## Adding a New Command

1. **Define the command** in `src/cli/index.ts`:

```typescript
const myCmd = program.command('mycommand')
  .description('Do something useful');

myCmd
  .command('action <arg>')
  .description('Perform action')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .action(async (arg, options) => {
    // Validate input
    if (!validateNameOrExit(arg, 'argument')) return;
    const projectPath = validateProjectPathOrWarn(options.project);
    if (!projectPath) return;

    // Do the work
    const result = await doSomething(arg, projectPath);

    // Output using printList helper
    printList('Created', result.created, chalk.green, '+');
    printList('Errors', result.errors, chalk.red, '✗');
  });
```

2. **Implement the logic** in a dedicated module:

```typescript
// src/mymodule/index.ts
export function doSomething(arg: string, projectPath: string): Result {
  // Implementation
}
```

3. **Add tests**:

```typescript
// src/mymodule/mymodule.test.ts
describe('doSomething', () => {
  it('handles valid input', () => {
    // Test
  });
});
```

## Adding a New Module

1. Create directory: `src/mymodule/`
2. Create files:
   - `index.ts` - Main exports
   - `types.ts` - Type definitions (if needed)
   - `mymodule.test.ts` - Tests
3. Re-export from `src/cli/index.ts` if needed

## Code Style

### TypeScript Patterns (Cherny)

```typescript
// Use 'as const' for literal types
const CATEGORIES = ['security', 'tech', 'canon'] as const;

// Use 'satisfies' for validation with inference
const config = {
  security: '/path/to/security',
  tech: '/path/to/tech'
} satisfies Record<string, string>;

// Use type guards instead of unsafe casts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Use discriminated unions for results
type Result =
  | { status: 'success'; data: string }
  | { status: 'error'; error: string };

// Handle exhaustively
switch (result.status) {
  case 'success': return result.data;
  case 'error': throw new Error(result.error);
}
```

### Function Patterns (Kernighan)

```typescript
// Small, focused functions
function validateName(name: string): boolean {
  return VALID_PATTERN.test(name) && name.length <= MAX_LENGTH;
}

// Clear names
function copySkillToProject(skillName: string, targetDir: string): Result {
  // Not: processItem, handleStuff
}

// Early returns for error cases
function processSkill(name: string): Result {
  if (!name) return { success: false, error: 'Name required' };
  if (!isValidName(name)) return { success: false, error: 'Invalid name' };

  // Happy path
  return { success: true, data: doWork(name) };
}
```

### Async Patterns

```typescript
// Parallel execution when independent
const results = await Promise.all(
  skills.map(skill => copySkill(skill, targetDir))
);

// Use fs/promises for new code
import * as fsPromises from 'fs/promises';
await fsPromises.mkdir(dir, { recursive: true });

// Keep sync versions for backwards compatibility
function loadProfiles(): Profile[] { /* sync */ }
async function loadProfilesAsync(): Promise<Profile[]> { /* async */ }
```

## Security Considerations

### Input Validation

Always validate user input:

```typescript
// In CLI command handler
if (!validateNameOrExit(serverName, 'server name')) return;
const projectPath = validateProjectPathOrWarn(options.project);
if (!projectPath) return;
```

### Path Traversal

Never trust paths from user input:

```typescript
// WRONG
const target = path.join(projectPath, userInput);

// RIGHT
const validated = validateProjectPath(userInput);
if (!validated) throw new Error('Invalid path');
const target = path.join(validated, 'safe-name');
```

### Environment Variables

Check required env vars before operations:

```typescript
if (server.requiredEnv?.length) {
  const check = checkRequiredEnv(server);
  if (!check.ok) {
    return { success: false, message: `Missing: ${check.missing.join(', ')}` };
  }
}
```

## Debugging

### Enable Debug Output

```bash
# Set environment variable
export CC_DEBUG=true
cc-config scan -p .

# Or
NODE_ENV=development cc-config scan -p .
```

### Debug Points

The code uses `DEBUG` constant for development logging:

```typescript
const DEBUG = process.env.NODE_ENV === 'development' || process.env.CC_DEBUG === 'true';

if (DEBUG) {
  console.debug(`Skill not found in canon: ${skillName}`);
}
```

## Building for Release

```bash
# Build
npm run build

# Pack for distribution
npm pack

# Creates cc-config-x.y.z.tgz
```

## Common Tasks

### Add a New Profile Field

1. Update `ComposableProfile` in `src/types.ts`
2. Update `validateProfileSchema()` in `src/profiles/index.ts`
3. Update `combineProfiles()` merge logic
4. Update `applyComposableProfile()` if needed
5. Add tests

### Add a New MCP Server

1. Create YAML file in `~/.claude/mcp-registry/`:

```yaml
name: my-server
type: stdio
command: node
args: ["/path/to/server.js"]
category: development
source: custom
requiredEnv: [MY_API_KEY]
description: My custom server
```

2. Or use CLI:

```bash
cc-config mcp add my-server node \
  --args "/path/to/server.js" \
  --required-env MY_API_KEY \
  --description "My custom server"
```

### Add a New Skill Category

1. Update `SkillCategory` type in `src/types.ts`
2. Update `SKILL_CATEGORIES` in `src/profiles/index.ts`
3. Update `SKILL_LIBRARY_PATHS` with new path
4. Update `findSkillPathAsync()` if special handling needed
