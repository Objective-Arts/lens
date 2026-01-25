# How to Use Quality Flags

## Prerequisites

- Claude Code CLI installed
- Project configured with a profile

## Available Flags

| Flag | Purpose |
|------|---------|
| `--structure-first` | Plan before implementing |
| `--plan` | Full plan mode with .plan.md file |
| `--test [level]` | Write tests after implementation |
| `--review-hard` | Adversarial self-review |
| `--doc-code` | Generate documentation |
| `--refactor-clean` | Systematic decomposition |

## Using Flags

### Basic Usage

Add flags at the end of your request:

```
Build the user dashboard --structure-first
```

### Combining Flags

Flags compose. Order matters:

```
Build feature X --structure-first --test all --review-hard
```

Execution order:
1. `--structure-first` - Plan shown, wait for approval
2. Implement per plan
3. `--test all` - Write tests at all levels
4. `--review-hard` - Adversarial review

## Common Combinations

### Normal Feature Development

```
Build login form --structure-first --test unit
```

### High-Stakes Feature

```
Build payment processing --plan --test all --review-hard
```

### Refactoring

```
Clean up UserService.js --refactor-clean --test unit
```

### Before PR

```
--review-hard
```

## Flag Details

### --structure-first

Shows a structure plan and waits for approval before implementing.

```
> Build user list --structure-first

## Structure Plan

### Functions:
1. fetchUsers() - API call
2. transformForDisplay(users) - data shaping
3. UserList - container component
4. UserCard - presentational component

Ready to implement?
```

### --test [level]

Writes tests at specified level:

- `--test unit` - Unit tests with mocks
- `--test integration` - Integration tests
- `--test e2e` - End-to-end tests
- `--test all` - Analyze and write at all appropriate levels

### --review-hard

Reviews all written code against standards:

```
> --review-hard

## Adversarial Review

### Issues Fixed:
1. Long function (45 lines) → Split into 3 functions
2. Missing error handling → Added try/catch
3. Inline object in JSX → Moved to useMemo

### Verification:
- [x] No function over 30 lines
- [x] Error states handled
- [x] No inline objects
```

## Troubleshooting

### "Flag not recognized"

Flags go at the end of requests:
- Correct: `Build X --structure-first`
- Wrong: `--structure-first Build X`

### "Flag seems ignored"

Check for typos: `--structure-frist` won't work.
