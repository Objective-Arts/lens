# Testing Strategy for CC-Config & Ralph

Applying: **meszaros** (xUnit patterns), **fowler-test** (test pyramid), **hevery** (testable code), **dodds** (testing trophy)

---

## Test Pyramid Analysis

```
                    /\
                   /  \  E2E: Full ralph runs (expensive, slow)
                  /    \  ~5 scenarios, run nightly
                 /------\
                /        \  Integration: CLI commands against real FS
               /          \  ~50 tests, run on PR
              /------------\
             /              \  Unit: Pure functions, parsers, mergers
            /                \  ~100 tests, run on every commit
           /------------------\
```

**Dodds' Testing Trophy adjustment for CLI tools:**
Integration tests are MORE valuable than unit tests for CLI - we care about what the user experiences, not internal implementation.

---

## Layer 1: Unit Tests (Jest/Vitest)

Fast, isolated, run on every commit.

### What to Unit Test

```typescript
// Pure functions with no side effects
describe('profile merging', () => {
  it('merges skills arrays without duplicates', () => {
    const parent = { skills: { canon: ['kernighan', 'pike'] } };
    const child = { skills: { canon: ['pike', 'dijkstra'] } };
    const result = mergeProfiles(parent, child);
    expect(result.skills.canon).toEqual(['kernighan', 'pike', 'dijkstra']);
  });
});

describe('ralph config parsing', () => {
  it('reads stage skills from yaml', () => {
    const yaml = `skills:\n  plan:\n    - kernighan\n    - pike`;
    const config = parseRalphConfig(yaml);
    expect(config.skills.plan).toEqual(['kernighan', 'pike']);
  });
});

describe('PRD parsing', () => {
  it('counts incomplete items', () => {
    const prd = '- [ ] Item 1\n- [x] Item 2\n- [ ] Item 3';
    expect(countIncomplete(prd)).toBe(2);
  });

  it('extracts next incomplete item text', () => {
    const prd = '- [x] Done\n- [ ] Do this next\n- [ ] Later';
    expect(getNextItem(prd)).toBe('Do this next');
  });
});

describe('dynamic skill detection', () => {
  it('detects security keywords', () => {
    const item = 'Implement password reset with token validation';
    const skills = detectDynamicSkills(item, 'build');
    expect(skills).toContain('schneier');
    expect(skills).toContain('owasp');
  });

  it('detects UI keywords', () => {
    const item = 'Create modal dialog for user settings';
    const skills = detectDynamicSkills(item, 'build');
    expect(skills).toContain('frost');
    expect(skills).toContain('norman');
  });
});

describe('Gemini output parsing', () => {
  it('parses markdown formatted output', () => {
    const output = '**GEMINI_ISSUES:** 5\n**CRITICAL_HIGH:** 2';
    const result = parseGeminiOutput(output);
    expect(result.issues).toBe(5);
    expect(result.criticalHigh).toBe(2);
  });
});
```

### Hevery Principle: Extract Logic from Bash

The bash ralph script is hard to unit test. Extract logic into testable TypeScript:

```typescript
// src/ralph/parser.ts - Extracted from bash, now testable
export function countIncomplete(prd: string): number { ... }
export function getNextItem(prd: string): string | null { ... }
export function markComplete(prd: string, lineNum: number): string { ... }
export function detectDynamicSkills(item: string, stage: string): string[] { ... }
export function parseGeminiOutput(raw: string): GeminiResult { ... }
export function parseQodanaSarif(sarif: object): QodanaResult { ... }
```

---

## Layer 2: Integration Tests (CLI Commands)

Test actual CLI behavior against real file systems.

### Meszaros Pattern: Fresh Fixture per Test

```typescript
import { mkdtemp, rm } from 'fs/promises';
import { execSync } from 'child_process';
import { join } from 'path';

describe('cc-config profile apply', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Fresh fixture - Meszaros: test independence
    tempDir = await mkdtemp('/tmp/cc-test-');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it('creates .claude directory structure', () => {
    execSync(`cc-config profile apply javascript -p ${tempDir}`);

    expect(fs.existsSync(join(tempDir, '.claude'))).toBe(true);
    expect(fs.existsSync(join(tempDir, '.claude', 'skills'))).toBe(true);
    expect(fs.existsSync(join(tempDir, '.claude', 'ralph-config.yaml'))).toBe(true);
  });

  it('copies canon skills to project', () => {
    execSync(`cc-config profile apply javascript -p ${tempDir}`);

    const skillsDir = join(tempDir, '.claude', 'skills');
    expect(fs.existsSync(join(skillsDir, 'cherny', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(join(skillsDir, 'crockford', 'SKILL.md'))).toBe(true);
  });

  it('combines multiple profiles', () => {
    execSync(`cc-config profile apply javascript+security-hardened -p ${tempDir}`);

    const config = yaml.load(
      fs.readFileSync(join(tempDir, '.claude', 'ralph-config.yaml'), 'utf8')
    );

    // Has JavaScript skills
    expect(config.skills.build).toContain('cherny');
    // Has security skills
    expect(config.skills.review).toContain('schneier');
    expect(config.skills.review).toContain('tanya-janca');
  });

  it('generates ralph-config.yaml with stage skills', () => {
    execSync(`cc-config profile apply software-base -p ${tempDir}`);

    const config = yaml.load(
      fs.readFileSync(join(tempDir, '.claude', 'ralph-config.yaml'), 'utf8')
    );

    expect(config.skills.plan).toContain('kernighan');
    expect(config.skills.build).toContain('bloch');
    expect(config.skills.review).toContain('schneier');
  });
});

describe('cc-config canon', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp('/tmp/cc-test-');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it('lists available canon skills', () => {
    const output = execSync('cc-config canon list').toString();
    expect(output).toContain('kernighan');
    expect(output).toContain('schneier');
    expect(output).toContain('dodds');
  });

  it('copies individual skill', () => {
    execSync(`cc-config canon copy kernighan -p ${tempDir}`);

    expect(fs.existsSync(join(tempDir, '.claude', 'skills', 'kernighan', 'SKILL.md'))).toBe(true);
  });

  it('detects outdated skills', async () => {
    // Setup: copy skill, then modify source
    execSync(`cc-config canon copy kernighan -p ${tempDir}`);

    const output = execSync(`cc-config canon status -p ${tempDir}`).toString();
    expect(output).toContain('current');
  });
});
```

---

## Layer 3: E2E Tests (Full Ralph Runs)

Expensive, slow - run nightly or on release branches.

### Challenge: Claude API Calls

Ralph calls Claude which is:
- Expensive ($)
- Slow (minutes per stage)
- Non-deterministic

### Solution: Recorded Fixtures + Mock Mode

```bash
# Record mode: capture real Claude responses
RALPH_RECORD=1 ralph PRD.md --yes

# Replay mode: use recorded responses (fast, free, deterministic)
RALPH_REPLAY=1 ralph PRD.md --yes
```

### Implementation

```typescript
// test/e2e/ralph.test.ts
describe('ralph e2e', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp('/tmp/ralph-e2e-');
    // Copy fixture project
    await cp('test/fixtures/password-reset-project', tempDir, { recursive: true });
  });

  it('completes all PRD items', async () => {
    // Use recorded Claude responses
    process.env.RALPH_REPLAY = 'test/fixtures/password-reset-recordings';

    execSync(`ralph PRD.md --yes`, { cwd: tempDir });

    const prd = fs.readFileSync(join(tempDir, 'PRD.md'), 'utf8');
    const incomplete = prd.match(/- \[ \]/g);
    expect(incomplete).toBeNull(); // All items complete
  });

  it('creates expected files', async () => {
    process.env.RALPH_REPLAY = 'test/fixtures/password-reset-recordings';

    execSync(`ralph PRD.md --yes`, { cwd: tempDir });

    // Check expected outputs
    expect(fs.existsSync(join(tempDir, 'src/routes/auth.ts'))).toBe(true);
    expect(fs.existsSync(join(tempDir, 'src/models/passwordResetToken.ts'))).toBe(true);
  });

  it('runs Gemini review and parses results', async () => {
    process.env.RALPH_REPLAY = 'test/fixtures/password-reset-recordings';

    execSync(`ralph PRD.md --yes`, { cwd: tempDir });

    // Check log files for Gemini output
    const logs = fs.readdirSync(join(tempDir, '.claude', 'ralph-logs'));
    const reviewLog = logs.find(f => f.includes('.review.raw'));
    const content = fs.readFileSync(join(tempDir, '.claude', 'ralph-logs', reviewLog), 'utf8');

    expect(content).toContain('GEMINI_ISSUES');
    expect(content).toContain('REVIEW_COMPLETE');
  });
});
```

---

## Layer 4: Contract Tests (External Services)

### Gemini MCP Tool Contract

```typescript
describe('Gemini MCP contract', () => {
  it('returns expected response structure', async () => {
    // Mock MCP server or use recorded response
    const response = await callGeminiReview({
      code: 'function foo() { return eval(userInput); }',
      focus: 'security',
      context: 'Test file'
    });

    // Contract: response has these fields
    expect(response).toHaveProperty('issues');
    expect(response).toHaveProperty('severity');
    expect(Array.isArray(response.issues)).toBe(true);
  });
});
```

### Qodana SARIF Contract

```typescript
describe('Qodana SARIF parsing', () => {
  it('parses real SARIF output', () => {
    const sarif = JSON.parse(
      fs.readFileSync('test/fixtures/qodana-sample.sarif.json', 'utf8')
    );

    const result = parseQodanaSarif(sarif);

    expect(result.critical).toBeGreaterThanOrEqual(0);
    expect(result.warnings).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.issues)).toBe(true);
  });
});
```

---

## CI/CD Pipeline Configuration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit
      # Fast - runs on every commit

  integration:
    name: Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run test:integration
      # Medium - runs on every PR

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
      # Slow - runs on main branch only (nightly)

  # Optional: Live E2E with real Claude (expensive)
  e2e-live:
    name: E2E Live Tests
    runs-on: ubuntu-latest
    if: github.event_name == 'release'
    env:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npm run build
      - run: npm run test:e2e:live
      # Very slow, expensive - runs on release only
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "vitest run src/**/*.test.ts",
    "test:integration": "vitest run test/integration/**/*.test.ts",
    "test:e2e": "RALPH_REPLAY=1 vitest run test/e2e/**/*.test.ts",
    "test:e2e:live": "vitest run test/e2e/**/*.test.ts --timeout=600000",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## Test Fixtures Structure

```
test/
├── fixtures/
│   ├── profiles/
│   │   └── test-profile.yaml
│   ├── skills/
│   │   └── test-skill/
│   │       └── SKILL.md
│   ├── projects/
│   │   └── password-reset/
│   │       ├── PRD.md
│   │       └── package.json
│   ├── recordings/
│   │   └── password-reset/
│   │       ├── plan-stage.json
│   │       ├── build-stage.json
│   │       └── review-stage.json
│   └── sarif/
│       └── qodana-sample.sarif.json
├── unit/
│   ├── profile-merger.test.ts
│   ├── prd-parser.test.ts
│   ├── skill-detector.test.ts
│   └── output-parser.test.ts
├── integration/
│   ├── profile-apply.test.ts
│   ├── canon-commands.test.ts
│   └── context-analysis.test.ts
└── e2e/
    ├── ralph-full-run.test.ts
    └── ralph-resume.test.ts
```

---

## Key Testing Principles Applied

### Meszaros
- ✅ Fresh fixture per test (temp directories)
- ✅ One assertion concept per test
- ✅ Test doubles for external services (Gemini, Qodana)
- ✅ Arrange-Act-Assert structure

### Fowler
- ✅ Test pyramid respected (many unit, some integration, few E2E)
- ✅ Contract tests for external APIs
- ✅ Integration tests at boundaries (CLI → file system)

### Hevery
- ✅ Extract logic from bash into testable TypeScript
- ✅ Inject dependencies (file system, external tools)
- ✅ Separate construction from logic

### Dodds
- ✅ Test user behavior (CLI commands), not implementation
- ✅ Integration tests prioritized for CLI tool
- ✅ Avoid testing implementation details
- ✅ Test what matters: "Did the PRD get completed?"

---

## Next Steps

1. [ ] Extract bash logic into TypeScript modules (testable)
2. [ ] Set up Vitest with coverage
3. [ ] Create fixture projects for E2E
4. [ ] Implement recording/replay for Claude responses
5. [ ] Add GitHub Actions workflow
6. [ ] Target: 80% coverage on TypeScript, key paths on bash
