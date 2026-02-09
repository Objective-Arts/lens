---
name: lens
description: Lens home base - status, help, and setup
---

# /lens

Welcome to Lens. Show status and offer choices for what to do next.

## On Invoke

### 1. Quick Status Check

Run silently and summarize:

```
Lens Status:
  Profile: javascript+react (or "No profile applied")
  Skills: 24 installed (or "None")
  MCP: gemini-reviewer ✓, qodana ✓ (or issues)
  Issues: None (or list problems)
```

### 2. Present Choices

Ask the user what they want to do:

```
What would you like to do?

1. **Check status** — Full diagnostic of current configuration
2. **Apply profile** — Configure this project with a profile
3. **View skills** — List available workflow skills
4. **Quick start** — Start coding with quality gates
5. **Fix issues** — Resolve configuration problems (if any)
```

Use AskUserQuestion with these options.

## Choice Actions

### Choice 1: Check Status

Run full diagnostic:

```
═══════════════════════════════════════════
 LENS STATUS
═══════════════════════════════════════════

 Profile: javascript+react
 Applied: 2024-01-15

 Skills (24):
   Core: clarity, simplicity, correctness, data-first
   Security: security-mindset, owasp
   Testing: test-doubles, test-strategy, legacy
   JS: js-internals, typescript, js-safety, react-state
   [full list...]

 MCP Servers:
   ✓ gemini-reviewer (GEMINI_API_KEY set)
   ✓ qodana (Docker available)

 CLAUDE.md: Present (2,341 tokens)
 settings.json: Present

 Issues: None

═══════════════════════════════════════════
```

### Choice 2: Apply Profile

Ask which profile:

```
Which profile stack?

1. javascript — JS/TS projects
2. javascript+react — React apps
3. javascript+angular — Angular apps
4. python — Python projects
5. java — Java projects
6. Other — Enter custom stack
```

Then run: `lens profile apply <selection> -p .`

### Choice 3: View Skills

Show workflow skills grouped by purpose:

```
═══════════════════════════════════════════
 WORKFLOW SKILLS
═══════════════════════════════════════════

 PLANNING
   /create-plan [task]      Design before coding
   /structure-first [feat]  Define types first

 IMPLEMENTATION
   /implement-plan          Build from plan
   /refactor-check-fix [path]     Clean up code

 QUALITY GATES
   /gemini-scan [path]      Review (read-only)
   /gemini-fix [path]       Review + fix
   /qodana-scan [path]      Static analysis (read-only)
   /qodana-fix [path]       Static analysis + fix

 TESTING
   /write-tests-run [level]     Generate tests

 HEAVY WORKFLOWS (12 phases)
   /build [target]          New feature from scratch
   /improve [path]          Refine existing code
   /final-polish [path]     Senior review prep

 LIGHT WORKFLOWS
   /quick-edit [desc]       Simple change (add field, rename)
   /quick-clean [path]      Fast AI smell cleanup

 AUTONOMOUS
   /ralph-loop [prd]        Full PRD implementation

═══════════════════════════════════════════

Which skill do you want to run?
```

### Choice 4: Quick Start

Guide user to start coding:

```
Quick Start Options:

1. **New feature** — /build [target] (runs all 12 phases)
2. **Improve existing code** — /improve [path] (runs all 12 phases)
3. **Simple change** — /quick-edit [description]
4. **Fast cleanup** — /quick-clean [path]
5. **Review code** — /gemini-scan [path]
6. **Run full PRD** — /ralph-loop [prd.md]

Which workflow?
```

### Choice 5: Fix Issues

Only shown if issues detected. Run diagnostics and offer fixes:

```
Issues Found:

1. ⚠ GEMINI_API_KEY not set
   → Add to ~/.zshrc: export GEMINI_API_KEY="your-key"

2. ⚠ No profile applied
   → Run: /lens then choose "Apply profile"

3. ⚠ Docker not running (Qodana unavailable)
   → Start Docker Desktop

Fix these now? [Y/n]
```

## Output Style

- Clean, bordered boxes
- Checkmarks (✓) for success, warnings (⚠) for issues
- Concise — no walls of text
- Always end with a choice or clear next step
