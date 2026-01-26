---
name: plan
description: Enter planning mode before implementation. Use for non-trivial tasks, new features, or architectural decisions.
---

# /plan

Enter planning mode to design approach before writing code. Creates a plan file for user approval.

## Why This Skill Exists

Without this skill, Claude skips planning and jumps straight to implementation. When asked to "plan", Claude typically:

1. Thinks through the problem in chat
2. Outlines steps in text
3. Asks "does this look good?"
4. Starts coding

**The problem:** That plan lives in chat and disappears. It's not a tangible artifact.

**This skill creates a persistent file** at `.claude/plans/[name].md` that you can:
- Review before approving
- Edit and refine
- Refer back to during implementation
- Commit to version control
- Share with teammates

The skill enforces discipline: plan first, create artifact, get approval, then implement.

## When to Use

- New feature implementation
- Multiple valid approaches exist
- Code modifications affecting existing behavior
- Multi-file changes (3+ files)
- Unclear requirements needing exploration
- Architectural decisions

## When NOT to Use

- Single-line fixes, typos
- Tasks with specific, detailed instructions
- Pure research/exploration (use explore agent)

## Process

1. **Explore** - Use Glob, Grep, Read to understand existing code
2. **Identify** - Find patterns, constraints, integration points
3. **Design** - Outline implementation approach
4. **Document** - Write plan to `.claude/plans/` file
5. **Present** - Exit plan mode for user approval

## Plan File Format

```markdown
# Plan: [Feature/Task Name]

## Problem Statement
[What needs to be done and why]

## Approach
[High-level strategy]

## Files to Modify
- `path/to/file1.ts` - [what changes]
- `path/to/file2.ts` - [what changes]

## Implementation Steps
1. [First step]
2. [Second step]
3. [Third step]

## Testing Strategy
- [How to verify]

## Risks/Considerations
- [Potential issues]
```

## Output

After planning, present summary:

```markdown
## Plan Ready

**Task**: [brief description]
**Files**: [count] files affected
**Approach**: [one-line summary]

Plan written to: `.claude/plans/[name].md`

Ready for approval.
```

## Integration with Claude Code

This skill works with Claude Code's built-in plan mode:
- Use `EnterPlanMode` tool to start planning
- Write plan to the designated plan file
- Use `ExitPlanMode` tool when ready for approval

## Workflow Position

```
/plan → /structure-first → [implement] → /test → /review-hard
```

Planning comes FIRST, before structure design and implementation.
