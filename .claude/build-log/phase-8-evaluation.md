# Phase 8 Evaluation Log — src

**Date:** 2026-02-24
**Evaluator:** Codex
**Iterations:** 3
**Score delta:** 34/70 → 40/70 (+6)

---

## Fix Classification

Each fix was evaluated against the classification tree:
1. Code pattern to avoid? YES + general → LESSON in both lessons.md and universal-lessons.md
2. Code pattern to avoid? YES + project-specific → LESSON in lessons.md only
3. Suggests pipeline/tool change? → PROPOSAL in eval-proposals.md
4. Neither → eval-report.md only

### Security Fixes (7)

**validateProjectPath() at CLI entry points** (profile.ts:104, profile.ts:157, init.ts:204, profiles/apply.ts:261, scan.ts:22)
- Pattern: User-supplied path reaches destructive operations without boundary validation
- Classification: ALREADY covered — universal-lessons.md "Path Traversal" section: "Validate at the boundary where user input enters — not deep in library functions"
- Action: No new lesson needed

**readFileWithSizeCap() / MAX_SETTINGS_FILE_SIZE** (scanner/index.ts:154, parser/settings.ts:10)
- Pattern: Files read without size check → memory exhaustion
- Classification: ALREADY covered — universal-lessons.md "File Size Check Before Reading" section
- Action: No new lesson needed

### Error Handling Fixes (8)

**Named catch params + isEnoent() differentiation** (utils/git.ts:14, git.ts:30, init.ts:136, init.ts:196, scanner/index.ts:149, init.ts:223, profiles/apply.ts:195)
- Pattern: Bare catch blocks without named params; no differentiation of expected vs unexpected errors
- Classification: ALREADY covered — universal-lessons.md "Intent-Revealing Catch Parameter Names" section; lessons.md "2026-02-24 - src (phase 8 eval)" entry on `cause` naming
- Action: No new lesson needed

**registry.test.ts: Renamed to _registerInstallation (unused import suppression)**
- Pattern: Prefixing unused imports with underscore to suppress ESLint no-unused-vars
- Classification: Project-specific tooling pattern (ESLint config behavior in this codebase); not a reusable general lesson
- Action: eval-report.md only

### Type Safety Fixes (10)

**Non-null assertions replaced with null guards** (combiner.ts:28, combiner.ts:38, hooks/index.ts:181, scanner/analysis.ts:64)
- Pattern: `obj.field!.method()` bypasses the type checker — field may actually be undefined at runtime
- Classification: General pattern not yet in universal-lessons.md
- Action: NEW LESSON in both files (TYPE_SAFETY)

**Type assertions without type guards** (mcp/operations.ts:143, mcp/operations.ts:335, mcp/operations.ts:364, scanner/analysis.ts:75, cli/stack-detector.ts:54, parser/settings.ts:64)
- Pattern: `(value as string[])` casts without runtime validation — shape mismatch causes silent runtime errors
- Classification: General pattern not yet in universal-lessons.md (the existing JSON.parse lesson covers JSON.parse specifically but not general `as` casts)
- Action: NEW LESSON in both files (TYPE_SAFETY)

### Testability Fixes (4)

**Injectable path/function parameters** (mcp/registry.ts:1, scanner/index.ts:15, profiles/apply.ts:151)
- Pattern: Functions hardcode global constants (GLOBAL_CLAUDE_PATH, registry dir) — tests cannot substitute without filesystem
- Classification: General pattern; existing "Module Singleton Reset for Testability" covers cached state but not injectable function seams
- Action: NEW LESSON in both files (DESIGN)

**saveEnabledServers() extraction** (mcp/operations.ts:147)
- Pattern: Deduplication + isolation by extracting shared I/O into named helper
- Classification: Covered under general complexity/structure lessons
- Action: eval-report.md only

### Complexity Fixes (5)

**Long function decomposition** (profile.ts:99, profile.ts:218, init.ts:127, apply.ts:151, workflow/index.ts:64)
- Pattern: Functions over 30 lines mixing validation + action + I/O
- Classification: ALREADY covered — universal-lessons.md "Function Size" section
- Action: No new lesson needed

### Structure Fixes (3)

**Concern separation** (mcp/operations.ts:147, init.ts:26, profiles/apply.ts:151)
- Pattern: Display, detection, and I/O mixed in same function
- Classification: Covered under function size / design patterns
- Action: eval-report.md only

### Naming Fixes (8)

**Single-char/abbreviated loop params** (profile.ts:273 s→skillName, profile.ts:281 c→cmdName, profile.ts:288 ai→rule, profile.ts:125 e→deployError, analysis.ts:71 i→conflictItem, analysis.ts:94 i→configItem)
- Pattern: `s`, `c`, `i`, `e`, `ai` as forEach/map params obscure intent
- Classification: ALREADY covered — universal-lessons.md "Abbreviated Parameter Names" section
- Action: No new lesson needed

**Intent-clarifying renames** (json-adapter.ts:187 raw→rawFindings, combiner.ts:34 src→incomingSkills, dst→existingSkills)
- Pattern: Generic names hide domain role of parameter
- Classification: ALREADY covered — universal-lessons.md "Abbreviated Parameter Names" section
- Action: No new lesson needed

---

## Score Analysis

**Improved (+2 each):** Security (4→6), Error Handling (4→6), Type Safety (4→6), Complexity (5→6) — all had concrete fixable patterns

**Unchanged:** Structure (6→6) — architectural concerns that survive a single iteration

**Regressed:** Naming (7→5) — the renames were mechanical single-char fixes in forEach params, but the final score shows broader naming issues remain (generic `items`, `results`, `content` in core flows per scores file); the mechanical renames may have introduced inconsistency

**Marginally improved (+1):** Testability (4→5) — injectable params are a good start but most test coverage gaps remain; Naming is debatable

---

## New Lessons Written

### Lesson 1 — TYPE_SAFETY: Non-null assertions
Written to: .claude/lessons.md, .claude/universal-lessons.md
Category: TYPE_SAFETY
Pattern: `obj.field!.method()` — the `!` asserts non-null without runtime check; if the value is actually undefined the assertion silently bypasses TypeScript's protection
Fix: Replace with explicit null guard (`if (!obj.field) obj.field = init()`) or Map get+set pattern

### Lesson 2 — TYPE_SAFETY: Type assertions without guards
Written to: .claude/lessons.md, .claude/universal-lessons.md
Category: TYPE_SAFETY
Pattern: `(value as string[])` and `(result as SomeInterface)` without validating shape at runtime
Fix: Extract named type guard (`isStringArray`, `isRecord`, `isStringValueRecord`) and call it before the assertion

### Lesson 3 — DESIGN: Injectable global constants
Written to: .claude/lessons.md, .claude/universal-lessons.md
Category: DESIGN
Pattern: Functions that hardcode global filesystem constants (GLOBAL_CLAUDE_PATH, MCP registry dir) cannot be unit-tested without real filesystem state
Fix: Accept optional injectable parameter with the constant as default; tests pass alternatives directly

---

## Proposals Filed

None. All fixes were code-pattern improvements. No pipeline phase changes, reviewer behavior changes, or tooling additions were indicated.
