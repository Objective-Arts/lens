# Tutorial: Running Your First Ralph Loop

*Learn autonomous development by completing a PRD with Ralph Loop.*

## What You'll Learn

- How to write a PRD for Ralph Loop
- How to configure quality gates
- How to run an autonomous development session
- How to handle the completion report

## Prerequisites

- Claude-Optimal CLI installed
- Claude Code CLI installed and authenticated
- A configured project (completed Getting Started tutorial)

## Step 1: Create a Project with Issues

Create a simple file with intentional problems that Ralph will fix:

```bash
mkdir -p src
cat > src/UserService.js << 'EOF'
// This has issues Ralph will fix
export class UserService {
    // BAD: async void equivalent
    async loadUser(id) {
        const response = await fetch(`/api/users/${id}`);
        const data = await response.json();
        console.log(data);
        // No return, no error handling
    }

    // BAD: blocking style
    getUserSync(id) {
        // Simulated sync behavior
        let result = null;
        fetch(`/api/users/${id}`)
            .then(r => r.json())
            .then(d => result = d);
        return result; // Always null!
    }

    // BAD: no validation
    getDisplayName(user) {
        return user.firstName + ' ' + user.lastName;
    }
}
EOF
```

## Step 2: Write a PRD

Create a Product Requirements Document that Ralph will work through:

```bash
cat > PRD.md << 'EOF'
# PRD: Fix UserService Issues

## Requirements

- [ ] Fix async methods to return proper values
- [ ] Add error handling to all API calls
- [ ] Add null checks on public method parameters
- [ ] Add TypeScript types or JSDoc

## Acceptance Criteria

- All async methods return their results
- Errors are caught and handled appropriately
- Public methods validate their inputs
- Types are documented
EOF
```

## Step 3: Apply Ralph Integration Profile

Stack the Ralph integration profile with your base profile:

```bash
cc-config profile apply javascript+ralph-integration -p .
```

This adds:
- Iteration limits (safety)
- Quality gates (tests, review)
- Post-loop validation settings

## Step 4: Initialize Git

Ralph uses git for context persistence:

```bash
git init
git add -A
git commit -m "Initial state with issues"
```

## Step 5: Run Ralph Loop

Start the autonomous loop:

```bash
claude "/ralph-loop PRD.md --max 5"
```

Ralph will:
1. Read the PRD to understand requirements
2. Check git history for context
3. Pick the first incomplete item
4. Implement a fix
5. Run self-review against standards
6. Commit if quality gates pass
7. Repeat until all items are complete

Watch as Claude works through each item autonomously.

## Step 6: Observe the Iterations

During each iteration, Claude will:

```
Iteration 1: Fix async methods
  → Read current code
  → Apply Simpson canon (async patterns)
  → Implement fix
  → Self-review: Check standards
  → Commit: "Fix async methods to return values"

Iteration 2: Add error handling
  → Read updated code
  → Apply Schneier canon (defensive thinking)
  → Add try/catch
  → Self-review: Check error patterns
  → Commit: "Add error handling to API calls"
```

## Step 7: Review the Completion Report

When Ralph finishes, you'll see a summary:

```
=== Ralph Loop Complete ===

PRD Status: 4/4 items complete
Iterations: 4
Commits: 4

Quality Summary:
  Tests: N/A (none configured)
  Self-review: Passed

Post-Loop Validation: Available
  Run: /validate-external

Next steps:
  - Review commits: git log --oneline
  - Run external validation: /validate-external
  - Or accept and ship
```

## Step 8: Review the Changes

Check what Ralph committed:

```bash
git log --oneline
```

You should see commits for each PRD item:

```
abc1234 Add TypeScript types/JSDoc
def5678 Add null checks on public methods
ghi9012 Add error handling to API calls
jkl3456 Fix async methods to return values
mno7890 Initial state with issues
```

## What You've Accomplished

You've successfully:
- Written a PRD that Ralph can process
- Configured quality gates for the loop
- Run an autonomous development session
- Seen how self-review catches issues

## Next Steps

- [Configure Ralph Loop](../how-to/configure-ralph-loop.md) - Customize iteration limits
- [Set Up External Validation](../how-to/external-validation.md) - Add Gemini/Qodana
- [Ralph Loop Design](../explanation/ralph-loop-design.md) - Understand the philosophy
