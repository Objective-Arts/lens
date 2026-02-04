---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Profile Reference

Complete catalog of available profiles.

---

## Profile Basics

Profiles bundle:
- **Canon skills** - Which masters to load per Ralph stage
- **Standards** - Rules for code quality
- **Auto-invoke rules** - When to activate skills
- **Agent configuration** - Which agents to use

### How Profiles Work with Detection

Profiles provide **static** skill assignments. Dynamic detection via `config/keyword-detection.yaml` **adds** context-specific skills based on task keywords.

```
Profile (static)              +    Detection (dynamic)
────────────────────────           ────────────────────
ralph.skills.build:                Task mentions "auth":
  - typescript                     + security-mindset
  - js-safety                      + owasp

                                   = Final skills for build stage
```

See [Canon Loading Strategy](canon-loading-strategy.md) for details.

## Listing Profiles

```bash
cc-config profile list
```

## Showing Profile Details

```bash
cc-config profile show javascript+react
```

---

## Base Profiles

### `software-base`

Foundation for all software projects.

**Skill Stack**:
- Baseline Brain: clarity, pragmatism, simplicity, distributed, data-first, correctness
- Base Practices:
  - Security: security-mindset, owasp
  - Testing: react-test, test-doubles, legacy
  - Documentation: docs
  - Engineering Philosophy: failure, safety, resilience

**Use When**: Any software project (usually extended by language profiles)

---

## Language Profiles

### `javascript`

**Extends**: software-base

**Domain Skills**:
- js-internals (You Don't Know JS)
- typescript (Programming TypeScript)
- js-safety (JavaScript: The Good Parts)

**Standards**: ES6+, async patterns, type annotations

**Use When**: Any JavaScript/TypeScript project

---

### `java`

**Extends**: software-base

**Domain Skills**:
- java (Effective Java patterns)

**Standards**: Immutability, static factories, defensive copies

**Use When**: Java backend, Android

---

### `csharp`

**Extends**: software-base

**Domain Skills**:
- csharp-depth (C# in Depth)
- async (Concurrency patterns)
- type-systems (Language design)
- java (API design principles)

**Standards**: Async/await, nullable reference types, records

**Use When**: .NET projects, Unity

---

### `go`

**Extends**: software-base

**Domain Skills**:
- simplicity (Go Proverbs)

**Standards**: Error handling, goroutines, interfaces

**Use When**: Go services, CLI tools

---

## Framework Profiles

### `react`

**Extends**: javascript

**Additional Skills**:
- react-state (React patterns)

**Standards**: Hooks, composition, container/presenter split

**Use When**: React SPAs, Next.js

---

### `angular`

**Extends**: javascript

**Additional Skills**:
- angular-core (Angular architecture)
- angular-arch (Angular style guide)

**Standards**: RxJS, change detection, OnPush

**Use When**: Angular enterprise apps

---

### `d3`

**Extends**: javascript

**Additional Skills**:
- d3 (D3 patterns)
- charts (Information design)
- dashboards (Dashboard design)
- data-story (Data storytelling)

**Standards**: Data-join, selections, scales

**Use When**: Data visualization, dashboards

---

### `frontend`

**Composable**: Yes (use with any language profile)

**UI/UX Skills** (12 skills):
- **Philosophy**: design (10 Principles), usability (Affordances), personas (Goal-directed)
- **Visual**: visual (Minimalism), typography (Type hierarchy)
- **Motion**: motion (Material motion)
- **Interaction**: interaction (Input fundamentals)
- **Patterns**: mobile (Mobile-first), components (Atomic design)
- **Governance**: tokens (Documentation), handoff (Handoff)
- **Data**: charts (Information design)

**Auto-Invoke Rules**:
```yaml
autoInvoke:
  - context: Building UI component
    action: INVOKE `/frost` then `/ive`
  - context: Designing forms
    action: INVOKE `/wroblewski` then `/norman`
  - context: Modals, dialogs, confirmations
    action: INVOKE `/cooper` for goal-directed design
  - context: Adding animation
    action: INVOKE `/duarte`
  - context: Data visualization
    action: INVOKE `/tufte`
  - context: Mobile design
    action: INVOKE `/wroblewski` then `/buxton`
```

**Use When**: Any frontend project with UI components

---

## Meta Profiles

### `ralph-integration`

**Composable**: Yes (use with any base profile)

**Adds**:
- Iteration configuration
- Quality gates
- Post-loop validation
- Self-review standards

**Configuration**:
```yaml
ralph:
  max_iterations: 50
  max_iterations_per_item: 5
  exit_on_idle_commits: 3
  quality_gates:
    tests_required: true
    review_mode: self
    review_threshold: no_critical
```

**Use When**: Autonomous development with PRDs

---

## Profile Composition

Stack profiles with `+`:

```bash
cc-config profile apply javascript+react+d3 -p .
```

### Common Combinations

| Project Type | Profile Stack |
|--------------|---------------|
| React SPA | `javascript+react` |
| React + UI/UX | `javascript+react+frontend` |
| React + D3 | `javascript+react+d3` |
| Angular enterprise | `javascript+angular` |
| Angular + UI/UX | `javascript+angular+frontend` |
| Java + UI/UX | `java+frontend` |
| C# backend | `csharp` |
| Autonomous C# | `csharp+ralph-integration` |
| Full-stack Java/Angular | `java+javascript+angular+frontend` |

### Composition Rules

1. Language profiles extend software-base (no need to stack)
2. Framework profiles extend language (no need to stack language)
3. Meta profiles (ralph-integration) can stack with anything
4. Domain canon accumulates (no conflicts)

---

## Creating Custom Profiles

Create a new YAML file in `profiles/` following the existing profile structure. See existing profiles for examples.
