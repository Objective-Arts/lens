# Claude-Optimal Architecture & Usage Guide

## What This Repo Delivers
- A method to make Claude Code produce review-grade code by making quality requirements explicit.
- Three pillars work together: **Profiles** (which skills are active), **Standards** (what good looks like), **Flags** (how you enforce behavior at runtime).
- Tooling (`cc-config`) wires these into a project by creating `.claude/skills/` symlinks and updating `CLAUDE.md`.

## Architecture (Conceptual)
- **Profiles** (`docs/PROFILES.md`): Composable bundles of canon skills. Example: `base-tech+javascript+react` → security canon + JS/TS runtime + React idioms. Applying a profile:
  - Links skills into `.claude/skills/`.
  - Writes auto-invoke rules to `CLAUDE.md` (TypeScript → cherny, React → abramov, etc.).
- **Standards**:
  - Structural rules: `docs/STRUCTURAL-STANDARDS.md` (SRP, short functions, render/pipeline separation).
  - API design: `docs/API-DESIGN-STANDARDS.md` (contracts, immutability, error handling).
  - Framework templates: `docs/FRAMEWORK-TEMPLATES.md` (React, Angular, D3, Node, Go, Java). You copy the relevant sections into the project `CLAUDE.md` to make them “live.”
- **Flags** (`docs/FLAGS.md`): Prompt switches that force workflows/discipline:
  - `--structure-first` (plan/architecture before code)
  - `--refactor-clean` (analyze and decompose existing code)
  - `--review-hard` (self-review against standards with fixes)
  - Others: `--tests-first`, `--defend`, etc.
- **Canon skills**: Named lenses (bloch, simpson, abramov, hevery, ben-lesh, owasp, etc.). Profiles decide which are active; flags decide how they are applied (planning, refactor, review).
- **CLI / assets**:
  - `cc-config` CLI applies profiles and updates `CLAUDE.md` (see `cc-config-guide.html` and `docs/USER-GUIDE.md`).
  - Supporting docs: `docs/HOOKS.md`, `docs/PATTERNS.md`, `docs/case-studies/`, `docs/USAGE-SEQUENCE.md` (visual flow).
  - Theory: `SKILL.md` describes the pattern language that underpins skills.

## Usage Model (End-to-End)
### 1) Project Setup (once)
1. Apply a profile stack:
   - `cc-config profile apply <stack> -p .`
   - Examples:
     - React frontend: `base-tech+javascript+react`
     - Node API: `base-tech+javascript+node`
     - Full-stack Java + Angular (see below): `software-base+fullstack+angular`
2. Paste standards into `CLAUDE.md`:
   - From `docs/FRAMEWORK-TEMPLATES.md`, copy the sections for your stack (e.g., React; or Java + Angular).
3. Verify:
   - `/status` to confirm active canon and standards.

### 2) New Feature Flow
1. Prompt with `--structure-first` (e.g., `Build client enrollment form with validation --structure-first`).
2. Review/approve the architecture plan (expected: layered design, data flow, smart/dumb components, DTO boundaries).
3. Approve → Claude implements per plan using active canon and standards.
4. Run `--review-hard ...` to force a standards pass and fixes. You get a checklist of what changed/verified.

### 3) Refactor Flow (existing code)
1. Prompt: `--refactor-clean <path>` to analyze, decompose god-objects/components, extract services/pipes, fix RxJS/immutability issues, etc.
2. Follow with `--review-hard ...` to catch remaining violations and verify against standards.

### 4) Ad Hoc / Enforcement
- Add flags to any prompt to dial in behavior:
  - Planning: `--structure-first`
  - Testing: `--tests-first`
  - Security: `--defend`
  - Refactor: `--refactor-clean`
  - Review: `--review-hard`

## Worked Example (Java + Angular) from `docs/USAGE-SEQUENCE.md`
- Apply: `cc-config profile apply software-base+fullstack+angular -p .`
- Paste into `CLAUDE.md`: Java + Angular sections from `docs/FRAMEWORK-TEMPLATES.md`.
- New feature: `Build client enrollment form with validation --structure-first` → approve plan → `--review-hard the client enrollment feature I just built`.
- Refactor: `--refactor-clean src/app/features/client-admin` → `--review-hard ...` (Angular); similarly for Java controllers.

## Key Standards to Remember
- Keep rendering dumb: calculations in prep/pipeline, not in templates/components.
- Single responsibility; short functions/classes; pure where possible.
- Consistency: one pattern per concern (React: hooks + composition; D3: data-join; Angular: OnPush, trackBy, async pipe; Node/Java: layered services/repos, immutable DTOs).
- Event/data hygiene: attach once, clean up subscriptions, no mixed patterns.

## File Map (quick reference)
- `README.md` → top-level orientation.
- `docs/USER-GUIDE.md` → full narrative guide.
- `docs/PROFILES.md` → profile stacks and contents.
- `docs/STRUCTURAL-STANDARDS.md`, `docs/API-DESIGN-STANDARDS.md` → universal/API rules.
- `docs/FRAMEWORK-TEMPLATES.md` → copy/paste standards into project `CLAUDE.md`.
- `docs/FLAGS.md` → prompt flags reference.
- `docs/USAGE-SEQUENCE.md` → visual/step-by-step example (Java + Angular).
- `SKILL.md` → pattern language/theory.

## Quick Starts by Stack
- **React frontend**: `cc-config profile apply base-tech+javascript+react -p .`; paste React standards; use `--structure-first`, `--review-hard`.
- **Node API**: `cc-config profile apply base-tech+javascript+node -p .`; paste Node standards; `--structure-first`, `--tests-first`, `--review-hard`.
- **React + D3**: `cc-config profile apply base-tech+javascript+react+d3+frontend -p .`; paste React + D3 standards; `--structure-first`, `--review-hard`.
- **Java + Angular**: `cc-config profile apply software-base+fullstack+angular -p .`; paste Java + Angular standards; `--structure-first`, `--refactor-clean`, `--review-hard`.
