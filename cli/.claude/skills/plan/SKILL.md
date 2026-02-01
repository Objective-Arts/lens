---
name: plan
description: Enter planning mode with mandatory verification. Plan file must exist with required sections before completion.
---

# /plan

Enter planning mode to design approach before writing code. Creates a plan file for user approval.

## First: Activate Workflow

**Before any other action**, activate this workflow session:

```bash
mkdir -p .claude && echo '{"skill":"plan","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## Step 0: Load Expert Context (MANDATORY)

Before planning, read these expert skills to inform your approach:

```
Read: .claude/skills/kernighan/SKILL.md   (clarity in design)
Read: .claude/skills/pike/SKILL.md        (small interfaces)
Read: .claude/skills/dijkstra/SKILL.md    (formal correctness)
Read: .claude/skills/linus/SKILL.md       (data structures first)
```

Apply these principles throughout planning. Skip if files don't exist.

## When to Use

- New feature implementation
- Multiple valid approaches exist
- Code modifications affecting existing behavior
- Multi-file changes (3+ files)
- Architectural decisions

## When NOT to Use

- Single-line fixes, typos
- Tasks with specific, detailed instructions
- Pure research/exploration

## Process

1. **Explore** - Use Glob, Grep, Read to understand existing code
2. **Identify** - Find patterns, constraints, integration points
3. **Design** - Outline implementation approach
4. **Document** - Write plan to `.claude/plans/` file
5. **Verify** - Confirm plan file has all required sections

## Plan File Format (REQUIRED SECTIONS)

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

---

## VERIFICATION (MANDATORY - DO NOT SKIP)

**You MUST execute these commands and show output before claiming completion.**

### Step 1: Verify Plan File Exists

```bash
# Plan file must exist in .claude/plans/
ls -la .claude/plans/

# Show plan file name
ls .claude/plans/*.md
```

### Step 2: Verify Required Sections Present

```bash
# Each required section must exist in the plan file
grep -E "^## (Problem Statement|Approach|Files to Modify|Implementation Steps|Testing Strategy|Risks)" .claude/plans/<plan-name>.md
```

**Expected output must show ALL 6 sections:**
```
## Problem Statement
## Approach
## Files to Modify
## Implementation Steps
## Testing Strategy
## Risks/Considerations
```

### Step 3: Verify Plan Has Content

```bash
# Plan must have substantive content (not just headers)
wc -l .claude/plans/<plan-name>.md

# Show the plan content
cat .claude/plans/<plan-name>.md
```

### Completion Criteria (ALL must be TRUE)

| Criterion | Evidence Required | Pass? |
|-----------|-------------------|-------|
| Plan file exists | `ls .claude/plans/*.md` shows file | [ ] |
| Problem Statement section | grep shows "## Problem Statement" | [ ] |
| Approach section | grep shows "## Approach" | [ ] |
| Files to Modify section | grep shows "## Files to Modify" | [ ] |
| Implementation Steps section | grep shows "## Implementation Steps" | [ ] |
| Testing Strategy section | grep shows "## Testing Strategy" | [ ] |
| Risks section | grep shows "## Risks" | [ ] |
| Plan has content | wc -l shows >20 lines | [ ] |

**If ANY criterion fails: add missing sections. Do not report complete.**

---

## Output Format

```markdown
## Plan Ready

**Task**: [brief description]
**Plan file**: `.claude/plans/[name].md`

### Verification Results

```bash
$ ls .claude/plans/*.md
.claude/plans/feature-name.md

$ grep -E "^## " .claude/plans/feature-name.md
## Problem Statement
## Approach
## Files to Modify
## Implementation Steps
## Testing Strategy
## Risks/Considerations

$ wc -l .claude/plans/feature-name.md
47 .claude/plans/feature-name.md
```

### Plan Summary
- **Files affected**: [count]
- **Implementation steps**: [count]
- **Key risks**: [list]

PLAN_VERIFIED
```

**The marker `PLAN_VERIFIED` may ONLY appear if all criteria pass.**

---

## Anti-Patterns (Immediate Failure)

- Claiming plan is ready without showing `ls .claude/plans/` output
- Missing any of the 6 required sections
- Plan file with only headers, no content
- Plan file with <20 lines (too sparse)
- Skipping the grep verification step
- Not showing the plan file contents
