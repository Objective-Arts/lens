# Testing the Ralph Loop Framework

## Test Levels

| Level | What It Tests | Speed | Requires |
|-------|---------------|-------|----------|
| **Smoke** | Install + run = no crash | Fast | Bash only |
| **Unit** | Config parsing, PRD parsing | Fast | Node.js |
| **Contract** | Loop invariants, state transitions | Medium | Mock Claude |
| **E2E** | Full loop with real Claude | Slow | Claude CLI + API key |

## Quick Start

### Smoke Test (no dependencies)

```bash
./tests/run-smoke-test.sh
```

Verifies:
- Fixture contains expected bad patterns
- Git initializes correctly
- Profile structure is valid
- (Optionally) Claude runs without error

### Full E2E Test

```bash
# Prerequisites
npm install -g @claude-optimal/cli
# Ensure Claude CLI installed and authenticated

# Run
./tests/run-smoke-test.sh  # Uncomment claude command first
```

## Fixtures

### smoke-test/

Minimal C# codebase with intentional issues:

| Issue | File | Pattern |
|-------|------|---------|
| async void | UserService.cs | `async void LoadUser` |
| Blocking async | UserService.cs | `.Result` |
| Null reference | UserService.cs | No null check on `user` |
| SQL injection | UserService.cs | String concat in SQL |
| Long method | UserService.cs | 30+ line method |

### Adding New Fixtures

```
tests/fixtures/my-test/
├── src/                    # Source code with known issues
├── PRD.md                  # Requirements to fix
├── expected-patterns.yaml  # Assertions
└── meta.yaml              # Test configuration (optional)
```

## Assertions

### Pattern-Based

```yaml
# expected-patterns.yaml
should_not_exist:
  - pattern: "async void"
should_exist:
  - pattern: "async Task"
```

### Invariant-Based

```yaml
invariants:
  - prd_items_complete: true
  - max_iterations: 10
  - git_commits_created: true
```

## Test Modes

### Dry Run (default)

Validates structure without running Claude:

```bash
./tests/run-smoke-test.sh
```

### Live Run

Actually executes ralph-loop:

```bash
# Edit run-smoke-test.sh, uncomment:
# claude "/ralph-loop PRD.md --max 5"

./tests/run-smoke-test.sh
```

### CI Mode

For automated pipelines (future):

```bash
./tests/run-smoke-test.sh --ci --timeout 300
```

## Expected Outputs

### Successful Run

```
=== Ralph Loop Smoke Test ===
Fixture: /path/to/fixtures/smoke-test
Test dir: /tmp/xxx

=== Step 1: Copy fixture ===
Copied fixture to /tmp/xxx

=== Step 2: Initialize git ===
Git initialized with 1 commit(s)

=== Step 3: Apply profile ===
Profile applied via cc-config

...

=== Smoke Test Complete ===
Result: PASS (framework structure verified)
```

### Failed Run

```
ERROR: Fixture doesn't contain expected bad patterns
```

or

```
ERROR: Claude exited with non-zero status
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "cc-config not in PATH" | CLI not installed | `npm install -g @claude-optimal/cli` |
| "claude CLI not in PATH" | Claude not installed | Install Claude Code |
| Git errors | Missing git | Install git |
| Timeout | Claude taking too long | Increase --max or --timeout |
