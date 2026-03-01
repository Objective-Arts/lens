# Lens Simplification Proposal

## The Problem

The current system is expensive and doesn't produce measurable improvement. The 8-phase pipeline burns tokens on external model calls (Codex, Gemini) that produce low-quality reviews, and the scoring metrics are self-referential — AI grading AI with no ground truth.

## What Actually Delivers Value

| Component | Why it works |
|-----------|-------------|
| Canon skills (pitfalls, clarity, typescript, etc.) | Real expertise loaded into context. Claude writes noticeably better code with these. |
| Profiles + `lens init` | One command configures a project with the right knowledge. Zero friction. |
| `/change` | Simple changes done right. Fast, cheap, focused. |
| Quality gate (`quality-gate.ts`) | Real static analysis. Deterministic. No AI involved. Catches actual bugs. |
| Rubrics | Good checklists for structured review. |

## What to Cut

### 1. External model calls (Codex, Gemini, Qodana)

**Why:** Codex CLI in read-only mode produces formulaic, context-poor reviews. Gemini is better but noisy — the false positives list in the pitfalls canon is evidence of how much noise it generates. Qodana catches real issues but adds infrastructure complexity.

**Reality:** Claude reviewing its own work with good canons loaded produces better reviews than any of these external models reviewing blind. The "independent perspective" argument sounds good but fails in practice because the external models are weaker reviewers.

**What goes away:**
- `codex exec` calls in `/fix`, review phases, evaluation
- Gemini MCP calls in gemini-review, gemini-scan
- Qodana MCP calls in qodana-review, qodana-scan
- All `-scan` skills that shell out to external tools (codex-scan, gemini-scan, qodana-scan)
- The codex-review and gemini-review workflow skills
- MCP server registry and setup

**What stays:**
- `/code-scan` (Claude-native 13-dimension scan — no external calls)
- `/ai-smell-scan` (Claude-native)
- `/deadcode-scan`, `/naming-scan`, `/refactor-scan`, `/dedupe-scan` (all Claude-native)

### 2. The 8-phase pipeline

**Why:** By phase 4 (refactoring), you're polishing polish. The refactoring and deduplication phases exist to fix things the implementation phase should have gotten right. The review phase runs 4 external scans in parallel — all cut above. The evaluation phase scores and writes reports nobody reads.

**Current pipeline (8 phases):**
```
PRD → plan → structure → implement → refactor → deduplicate → review → test → evaluate
```

**Proposed pipeline (4 phases + gate):**
```
plan → build → [quality gate] → review (self) → test → [quality gate]
```

| Phase | What it does |
|-------|-------------|
| **plan** | Load canons. Analyze requirements. Produce actionable plan with work items. |
| **build** | Load canons + pitfalls. Implement the plan. Run lint/tests as you go. |
| **gate** | Run `quality-gate.ts` — deterministic static analysis. Must pass before review. |
| **review** | Claude self-review against loaded canons and rubrics. Fix what it finds. No external models. |
| **test** | Write/update tests. Run suite. Fix failures. Final gate check. |

The quality gate is the objective checkpoint. It catches real bugs (shell injection, secrets, TOCTOU) without any AI involved. Run it after build, run it after test. Pass/fail, no ambiguity.

The plan phase loads the right expertise. The build phase uses it. The gate catches concrete violations. The review catches subtler issues. The test phase verifies behavior.

### 3. The AI scoring system (but NOT the quality gate)

**Why:** CODE_SCAN_INDEX and the /70 evaluation scorecard are AI models grading each other. There's no ground truth. A score of 62/70 means nothing to a human reviewing the code.

**What goes away:**
- Evaluation phase (phase 8) — the Codex score-fix loop
- eval-report.md generation
- build-state.json tracking

**What stays — the quality gate is real:**

`quality-gate.ts` is **not** AI scoring. It's a polyglot static analyzer (~1400 lines, 100+ tests) that runs deterministic regex-based checks:

| Check | Languages | What it catches |
|-------|-----------|----------------|
| Hardcoded secrets | All | Passwords, API keys, tokens, private keys |
| Shell injection | JS/TS | exec/execSync with template literals |
| Path traversal | JS/TS | User input in path.join without validation |
| TOCTOU | JS/TS | existsSync then readFileSync |
| Circular imports | JS/TS | DFS cycle detection on import graph |
| Empty catch blocks | All | Swallowed errors |
| Dangerous eval | JS/TS | eval(), innerHTML, document.write |
| Falsy numeric guard | JS/TS | if(count) missing 0 |
| Comment spam | JS/TS | JSDoc restating function name |
| Function length | JS/TS | Functions >30 lines |
| Verification reads | JS/TS | write then read back (TOCTOU variant) |
| TODO accumulation | All | >3 TODO/FIXME/HACK markers |
| Hardcoded URLs | All | http://, hardcoded IP:port |
| Construction checks | Plan → code | Verifies plan deliverables exist |

This is the pitfalls canon turned into automated enforcement. Same code always gets the same result. It should run after every build phase and on every `/fix` — it's the one real quality signal.

**Also stays:**
- Test pass/fail (real metric)
- Lint pass/fail (real metric)
- `/code-scan` when you want a structured review (on-demand, not in pipeline)

### 4. The lesson write-back system (already removed)

Done in this session. Pitfalls canon replaces per-project lessons files.

## Proposed Architecture

```
lens/
├── canon/              # Domain expertise (the core value)
│   ├── pitfalls/
│   ├── clarity/
│   ├── typescript/
│   └── ...
├── profiles/           # Project configuration
├── workflow-skills/
│   ├── workflow/
│   │   ├── plan/       # Phase 1: Plan with canons
│   │   ├── build/      # Phase 2: Build with canons (simplified, was implement)
│   │   ├── review/     # Phase 3: Self-review against canons (new, replaces 4 external scans)
│   │   ├── test/       # Phase 4: Test (was testing)
│   │   ├── fix/        # Standalone: review + fix loop (simplified, no Codex)
│   │   └── change/     # Standalone: simple changes
│   └── utils/
│       ├── code-scan/  # On-demand 13-dimension scan (Claude-native)
│       ├── ai-smell-scan/
│       ├── deadcode-scan/
│       └── ...         # Other Claude-native scans
└── src/                # CLI (lens init, profiles, canon management)
```

## What the Team Gets

**Before:** Complex 8-phase pipeline, 4 external model integrations, scoring system, lesson feedback loops. Expensive. Hard to understand. Unclear if it helps.

**After:** Canon-powered Claude with simple workflows. `lens init` loads the right expertise. `/change` for small stuff. `/fix` for targeted cleanup. `/build` for new features (4 phases). All Claude-native, no external model costs.

**Cost reduction:** Roughly 60-70% fewer tokens per pipeline run (no Codex/Gemini calls, fewer phases, no evaluation loop).

## Migration Path

1. Simplify `/fix` — remove Codex calls, Claude self-review with canons
2. Simplify `/build` and `/improve` — collapse to 4 phases
3. Remove external model integrations (Codex, Gemini, Qodana MCP)
4. Remove scoring/evaluation infrastructure
5. Remove dead scan skills that depend on external models
6. Clean up CLI (remove MCP commands if no longer needed)

Each step is independently deployable. The team can use the simplified versions immediately while the rest gets cleaned up.

## What This Doesn't Solve

- **No objective quality metric.** There's no way to prove code is X% better without human judgment. Accept this. The value is in the canons making Claude's output consistently better, not in a number.
- **Canon maintenance.** The pitfalls canon needs to grow over time as the team encounters new patterns. This is manual — someone adds entries when they find recurring issues.
- **Team adoption.** The tool is only useful if people actually run `lens init` and use the slash commands. Keep it simple enough that they will.
