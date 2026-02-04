---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Quality Flags Reference

Complete specification of all quality flags.

---

## Flag Summary

| Flag | Command | Purpose |
|------|---------|---------|
| `--structure-first` | *(flag only)* | Lightweight planning before implementation |
| `--plan` | *(flag only)* | Full plan mode with .plan.md file |
| `--build-from-plan` | `/build-from-plan` | Implement from existing plan |
| `--test [level]` | `/test [level]` | Write tests at specified level |
| `--review-hard` | `/review-hard` | Adversarial self-review |
| `--refactor-check` | `/refactor-check` | Systematic decomposition |
| `--doc-code` | `/doc-code` | Generate documentation |

---

## --structure-first

**Purpose**: Lightweight planning without formal plan file.

**Syntax**: `<request> --structure-first`

**Behavior**:
1. Analyze requirements
2. Design structure (functions, data flow, separation)
3. Present plan and WAIT for approval
4. Implement per plan
5. Self-verify: "Does this match the plan?"

**Example**:
```
Build the user dashboard --structure-first
```

**Output**:
```markdown
## Structure Plan

### Functions (single responsibility):
1. fetchDashboardData() - API calls only
2. transformForDisplay(raw) - data shaping
3. DashboardLayout - container component
4. MetricCard - presentational component

### Data Flow:
fetch → transform → render

Ready to implement?
```

---

## --plan

**Purpose**: Rigorous planning with persistent plan file.

**Syntax**: `<request> --plan`

**Behavior**:
1. Enter plan mode (EnterPlanMode tool)
2. Explore codebase (read-only: Glob, Grep, Read)
3. Write .plan.md with full analysis
4. Exit plan mode (ExitPlanMode tool)
5. User reviews and approves
6. Implement per plan

**Differences from --structure-first**:

| Aspect | --structure-first | --plan |
|--------|-------------------|--------|
| Output | Inline markdown | Persistent .plan.md |
| Exploration | Can read files | Enforced read-only |
| Persistence | Gone after session | File remains |
| Best for | Quick features | Complex architecture |

---

## --build-from-plan

**Purpose**: Implement from existing plan file.

**Syntax**: `--build-from-plan [plan-file]`

**Also**: `/build-from-plan [plan-file]`

**Behavior**:
1. Read .plan.md (or specified file)
2. Validate plan is current
3. Summarize scope
4. Implement per plan structure
5. Update plan with status

**Example**:
```
--build-from-plan auth-system.plan.md
```

---

## --test [level]

**Purpose**: Write tests at appropriate level.

**Syntax**: `<request> --test <level>`

**Also**: `/test <level> [target]`

**Levels**:
| Level | Description |
|-------|-------------|
| `unit` | Unit tests with mocks |
| `integration` | Integration tests |
| `e2e` | End-to-end tests |
| `all` | Analyze and write at all appropriate levels |

**Examples**:
```
Build login form --test unit
--test all
/test integration src/services/
```

**Skills Applied**:
- react-test: Testing Trophy, behavior over implementation
- test-doubles: Test doubles, setup patterns
- legacy: Characterization tests for legacy code

---

## --review-hard

**Purpose**: Adversarial self-review against standards.

**Syntax**: `--review-hard`

**Also**: `/review-hard [target]`

**Behavior**:
1. Read all code written in session
2. Check against project CLAUDE.md standards
3. Ask: "What would external reviewers flag?"
4. Fix all issues found
5. Report what was fixed
6. Present verified code

**Checks For**:
- Functions over 30 lines
- Mixed concerns
- Inconsistent patterns
- Missing error handling
- Security issues
- Performance issues
- Framework anti-patterns

**Output**:
```markdown
## Adversarial Review

### Issues Fixed:
1. Long function (45 lines) → Split into 3
2. Missing error handling → Added try/catch

### Verification:
- [x] No function over 30 lines
- [x] Error states handled
```

---

## --refactor-check

**Purpose**: Systematic decomposition of messy code.

**Syntax**: `--refactor-check <target>`

**Also**: `/refactor-check <target>`

**Behavior**:
1. Read entire target file/module
2. Analyze through canon lenses
3. Plan decomposition
4. Execute refactoring
5. Show before/after summary
6. Verify build passes

**Output**:
```markdown
## Refactoring: UserView.js

### Before
UserView.js (1 file, 234 lines)
└── renderUser() - 147 lines

### After
userView/
├── index.js (40 lines)
├── api.js (25 lines)
├── transform.js (35 lines)
└── UserCard.jsx (45 lines)

### Metrics:
| Metric | Before | After |
|--------|--------|-------|
| Max function length | 147 | 30 |
| Testable units | 1 | 5 |
```

---

## --doc-code

**Purpose**: Generate documentation using Diátaxis framework.

**Syntax**: `<request> --doc-code`

**Also**: `/doc-code [target]`

**Options**:
| Option | Effect |
|--------|--------|
| `--type=tutorial` | Force tutorial format |
| `--type=how-to` | Force how-to format |
| `--type=reference` | Force reference format |
| `--type=explanation` | Force explanation format |
| (none) | Auto-detect type |

**Decision Tree**:
```
What was built?
├── Public function/class/API? → Reference
├── New feature users will use? → How-to
├── Complex internal system? → Explanation
└── New capability to learn? → Tutorial
```

---

## Combining Flags

Flags compose. Execution order follows request order:

```
Build feature --structure-first --test all --doc-code --review-hard
```

1. Plan (--structure-first)
2. Implement
3. Test (--test all)
4. Document (--doc-code)
5. Review (--review-hard)

**Common Combinations**:
| Combination | Use Case |
|-------------|----------|
| `--structure-first --test all` | Normal feature |
| `--plan --test all --review-hard` | Complex feature |
| `--refactor-check --test unit` | Tech debt cleanup |
| `--doc-code --review-hard` | Documentation pass |
