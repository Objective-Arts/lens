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
  - cherny                         + schneier
  - crockford                      + owasp

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

**Canon Stack**:
- Baseline Brain: kernighan, thompson, pike, joy, linus, dijkstra
- Base Practices:
  - Security: schneier, owasp
  - Testing: dodds, meszaros, feathers
  - Documentation: procida
  - Engineering Philosophy: petroski, leveson, taleb

**Use When**: Any software project (usually extended by language profiles)

---

## Language Profiles

### `javascript`

**Extends**: software-base

**Domain Canon**:
- Simpson (You Don't Know JS)
- Cherny (Programming TypeScript)
- Crockford (JavaScript: The Good Parts)

**Standards**: ES6+, async patterns, type annotations

**Use When**: Any JavaScript/TypeScript project

---

### `java`

**Extends**: software-base

**Domain Canon**:
- Bloch (Effective Java)

**Standards**: Immutability, static factories, defensive copies

**Use When**: Java backend, Android

---

### `csharp`

**Extends**: software-base

**Domain Canon**:
- Skeet (C# in Depth)
- Cleary (Concurrency in C#)
- Hejlsberg (Language design)
- Bloch (API design principles)

**Standards**: Async/await, nullable reference types, records

**Use When**: .NET projects, Unity

---

### `go`

**Extends**: software-base

**Domain Canon**:
- Pike (Go Proverbs)

**Standards**: Error handling, goroutines, interfaces

**Use When**: Go services, CLI tools

---

## Framework Profiles

### `react`

**Extends**: javascript

**Additional Canon**:
- Abramov (React patterns)

**Standards**: Hooks, composition, container/presenter split

**Use When**: React SPAs, Next.js

---

### `angular`

**Extends**: javascript

**Additional Canon**:
- Hevery (Angular architecture)
- Papa (Angular style guide)

**Standards**: RxJS, change detection, OnPush

**Use When**: Angular enterprise apps

---

### `d3`

**Extends**: javascript

**Additional Canon**:
- Bostock (D3 patterns)
- Tufte (Information design)
- Few (Dashboard design)
- Knaflic (Data storytelling)

**Standards**: Data-join, selections, scales

**Use When**: Data visualization, dashboards

---

### `frontend`

**Composable**: Yes (use with any language profile)

**UI/UX Canon** (12 experts):
- **Philosophy**: Rams (10 Principles), Norman (Affordances), Cooper (Goal-directed)
- **Visual**: Ive (Minimalism), Kruzeniski (Typography)
- **Motion**: Duarte (Material motion)
- **Interaction**: Buxton (Input fundamentals)
- **Patterns**: Wroblewski (Mobile-first), Frost (Atomic design)
- **Governance**: Curtis (Documentation), Mall (Handoff)
- **Data**: Tufte (Information design)

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
