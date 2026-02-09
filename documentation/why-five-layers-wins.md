# Why Five Layers Wins

## The Comparison

**Pure LLM approach:** AI writes code, AI says "looks good," ship it.

**Lens approach:** AI writes code, then five independent verification layers check the work before it ships.

## Layer-by-Layer Advantage

### Layer 1: Machine Gates

Deterministic checks derived from canon rules. No AI involved.

Catches: `any` types, functions over 30 lines, hardcoded secrets, shell injection, missing return types, strict equality violations.

| | Pure LLM | Lens |
|---|---|---|
| Finds every hardcoded secret | Maybe | **Always** |
| Finds every `any` type | Sometimes | **Always** |
| Finds every shell injection | Often missed | **Always** |
| Can be argued with | Yes — "I think this one is safe" | **No — match = fail** |

**Result: Lens wins 100% of the time on these checks.**

### Layer 2: Proxy Checks

Measurable patterns that correlate with judgment-based canon violations. Still no AI.

Catches: vague parameter names (`data`, `result`, `info`), files named `utils.ts`, too many exports per file, too many function parameters, empty catch blocks, magic numbers, missing test files, deep inheritance.

| | Pure LLM | Lens |
|---|---|---|
| Flags a parameter named `data` | Never | **Always** |
| Flags a file with 15 exports | Never | **Always** |
| Flags a function with 7 parameters | Rarely | **Always** |

**Result: Lens wins 100% of the time on these checks.**

### Layer 3: Evidence Checklists

Forces AI reviewers to list every item with a file:line, verdict, and reasoning. The machine validates completeness — if there are 14 exported functions and only 9 on the checklist, it's rejected.

| | Pure LLM | Lens |
|---|---|---|
| Reviews every function | Maybe 60% | **100% — machine counts** |
| Reviews every error message | Maybe 40% | **100% — machine counts** |
| Reviews every input boundary | Maybe 50% | **100% — machine counts** |
| Can hand-wave "looks good" | Yes | **No — every item needs a row** |

**Result: Lens wins on coverage. The LLM might still judge an individual item wrong, but it can't skip any. A complete review with some wrong answers beats an incomplete review every time.**

### Layer 4: Three-Model Vote

Three AI models (Claude, Gemini, Codex) review independently. Each fills out its own evidence checklist. Disagreements are surfaced.

| | Pure LLM | Lens |
|---|---|---|
| Number of independent opinions | 1 | **3** |
| Catches model-specific blind spots | No | **Yes — different training, different biases** |
| Surfaces disagreements for human review | No | **Yes** |

**Result: Lens wins on blind spot coverage. One model missing something is common. Three models missing the same thing is rare.**

### Layer 5: Canary Tests

Known violations planted before review phases. If the reviewer doesn't find them, the review is thrown out and rerun.

| | Pure LLM | Lens |
|---|---|---|
| Verifies the review actually happened | No | **Yes** |
| Catches lazy/sloppy reviews | No | **Yes** |
| Can detect rubber-stamping | No | **Yes** |

**Result: Lens wins on review integrity. The pure LLM approach has no way to verify its reviews are real.**

## The Scoreboard

| Check Type | Pure LLM | Lens | Who Wins |
|---|---|---|---|
| Mechanical rules (any, secrets, length) | ~40% caught | 100% caught | **Lens — always** |
| Warning sign patterns (bad names, too many params) | ~10% caught | 100% caught | **Lens — always** |
| Judgment calls (is this clear? does this do one thing?) | ~50% evaluated | 100% evaluated, three opinions | **Lens — always** |
| Review actually happened | Unknown | Verified by canaries | **Lens — always** |
| All three models agree but are wrong | Same gap | Same gap | **Tie** |

## The Only Scenario Where Lens Doesn't Win

All three models look at the same piece of code. All three fill out their checklists. All three mark it PASS. All three are wrong.

The canaries pass because the models ARE paying attention — they're just making the same incorrect judgment.

This is real. But:

1. It's the same gap the pure LLM approach has, except worse — they only have one model making that call instead of three
2. Three models independently making the same wrong judgment is statistically much rarer than one model making a wrong judgment
3. The machine layers already caught everything mechanical, so the remaining judgment calls are genuinely hard problems where disagreement among experts (human or AI) is expected

## Why This Matters

The senior engineer who catches subtle design flaws — that person might not exist at your company. They might not exist at most companies. And if they do exist, they're reviewing code for six teams and catching maybe 20% of what crosses their desk.

The five-layer system doesn't replace that mythical expert. It replaces the absence of that expert, which is the actual situation at most companies.

| Situation | What catches problems |
|---|---|
| Company with Jeff Dean | Jeff Dean |
| Company without Jeff Dean, using pure LLM | Hope |
| Company without Jeff Dean, using Lens | Machine gates + proxy checks + evidence checklists + three-model vote + canary tests |

The canon IS the expert knowledge, written down once. The five layers stop trusting any single AI to follow it and start verifying.

## Estimated Effectiveness

```
Pure LLM catches maybe    40% of problems
Lens system catches maybe 85% of problems
Expert human review adds  another 10%
Perfect                   100%
```

The 45-point gap between 40% and 85% is what the five layers provide. None of it requires an experienced human reviewer.

The remaining 15% gap to perfection — the pure LLM approach doesn't catch it either. Nobody does without a senior engineer. Lens doesn't lose ground there. It just doesn't gain it.

On everything else, Lens wins. Every time.
