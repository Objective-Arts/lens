# Session Progress - 2026-01-21

## Current Task
Defining the "Baseline Brain" - foundational experts for all software projects

## Completed This Session

### 1. Created principles-and-sequence.html
New diagram with two sections:
- **Section I: Core Principles** (4 memorable principles)
  1. "Claude knows. It just doesn't apply."
  2. "Expert > Knowledge"
  3. "Build it in, don't bolt it on"
  4. "Four levers: Experts, Rules, Gates, Triggers"

- **Section II: Setup Sequence** (5 steps with purpose)
  1. Apply a Profile → "Pick your experts"
  2. Add Standards → "Set the rules"
  3. Add Auto-Invoke → "Wire the triggers"
  4. Use Flags → "Add the gates"
  5. Verify → "Check your work"

### 2. Created Ken Thompson canon skill
- `canon/thompson/SKILL.md` - Ken Thompson's pragmatic philosophy
- Core principle: "When in doubt, use brute force"
- Includes: Unix philosophy, regex guidance, "Trusting Trust" security lesson
- Added to `canon/README.md`

### 3. Defined the Baseline Brain
Six masters that shape ALL code regardless of language:

| Master | Contribution |
|--------|--------------|
| **Kernighan** | Clarity, readability, style |
| **Thompson** | Pragmatism, brute force, get it working |
| **Pike** | Small interfaces, composition |
| **Joy** | Distributed systems, failure handling |
| **Linus** | Good taste, data structures first |
| **Dijkstra** | Formal discipline, correctness |

Key insight: Thompson/Dijkstra tension is productive (pragmatism vs rigor)

### 4. Documented Baseline Brain
- Created `docs/BASELINE-BRAIN.md`
- Explains: why these six, what each provides, productive tensions
- What's NOT in baseline and why (GoF is domain-specific)

### 5. Updated software-base profile
- Updated `profiles/software-base.yaml`
- Added baseline brain as distinct section (6 masters)
- Kept security (schneier, owasp), docs (procida), testing (4 masters)
- Total: 13 masters in software-base

## Key Decisions Made

### Gang of Four NOT in Baseline
- Conflicts with Pike/Linus simplicity ethos
- Language-family specific (OOP-heavy)
- Belongs in Java/C# domain profiles instead

### Jeff Dean NOT a Canon Master
- His work is in systems/papers, not articulated principles
- Wisdom embedded in specific system designs
- "google-systems" skill would be reference material, not a perspective

## Files Created/Modified
- `principles-and-sequence.html` (new)
- `canon/thompson/SKILL.md` (new)
- `docs/BASELINE-BRAIN.md` (new)
- `canon/README.md` (modified - added Thompson)
- `profiles/software-base.yaml` (modified - added baseline brain)

## Next Steps
1. Commit these changes
2. Consider adding Bill Joy skill if not complete
3. Consider creating a baseline-only profile for minimal setups
4. Update other docs to reference baseline brain concept

## Context to Restore

### The Baseline Brain (memorize this)
Kernighan, Thompson, Pike, Joy, Linus, Dijkstra

### Profile Structure
```
software-base profile:
  baseline: kernighan, thompson, pike, joy, linus, dijkstra
  security: schneier, owasp
  documentation: procida
  testing: dodds, feathers, meszaros, fowler-test
```

### Key Principles (memorable versions)
1. Claude knows. It just doesn't apply.
2. Expert > Knowledge
3. Build it in, don't bolt it on
4. Four levers: Experts, Rules, Gates, Triggers
