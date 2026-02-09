---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Profile Reference

Complete catalog of all 14 available profiles.

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
lens profile list
```

## Showing Profile Details

```bash
lens profile show javascript+react
```

---

## Base Profile

### `software-base`

Foundation for all software projects. Always included when using a language profile.

**Canon Skills (24)**:
- **Base Brain (10)**: clarity, pragmatism, simplicity, composition, distributed, data-first, correctness, algorithms, abstraction, optimization
- **Design Patterns (1)**: design-patterns
- **Security (2)**: security-mindset, owasp
- **Engineering (3)**: failure, safety, resilience
- **Documentation & Writing (4)**: docs, prose, brevity, editing
- **Testing (4)**: react-test, legacy, test-doubles, test-strategy

**Ralph Skill Mapping**:
- plan: clarity, simplicity, correctness, composition, data-first, distributed
- build: clarity, simplicity, java, abstraction, design-patterns, pragmatism, optimization
- refactor: clarity, legacy, design-patterns, distributed
- test: test-doubles, test-strategy, legacy
- review: security-mindset, owasp, failure, safety, resilience
- doc: docs, brevity, prose, editing

**Agents**: security-auditor, code-reviewer, test-engineer

**Use When**: Any software project (usually extended by language profiles)

---

## Language Profiles

### `typescript-cli`

TypeScript CLI/backend projects. Node.js, no frontend.

**Composable**: Yes

**Canon Skills (9)**:
- typescript, type-systems, js-safety, js-internals, js-perf, functional, async, composition, simplicity

**Standards**: TypeScript inference, discriminated unions, unknown over any, async/await, event loop awareness, CLI conventions (exit codes, stderr/stdout)

**Use When**: TypeScript CLI tools, Node.js backends

---

### `javascript`

JavaScript/TypeScript expertise with full UI/UX coverage.

**Extends**: software-base

**Canon Skills (17)**:
- **JS/TS (8)**: js-internals, react-state, functional, typescript, js-safety, react-test, reactivity, js-perf
- **UI/UX (9)**: components, visual, usability, mobile, motion, interaction, tokens, typography, design

**Ralph Skill Mapping**:
- plan: js-internals
- build: typescript, js-safety, js-internals, js-perf
- refactor: js-perf, js-safety
- test: react-test

**Standards**: ES6+, const by default, async/await, destructuring, named exports, TypeScript strict mode

**Use When**: Any JavaScript/TypeScript project

---

### `java`

**Extends**: software-base

**Canon Skills (1)**: java

**Standards**: Static factories, immutability, defensive copies, composition over inheritance

**Use When**: Java backend, Android

---

### `python`

**Extends**: software-base

**Canon Skills (4)**: python-idioms, python-advanced, python-protocols, python-patterns

**Ralph Skill Mapping**:
- plan: python-idioms
- build: python-idioms, python-protocols, python-advanced, python-patterns
- refactor: python-idioms, python-protocols
- test: python-idioms

**Standards**: Pythonic over clever, generators for iteration, data model protocols, type hints

**Use When**: Python projects

---

### `csharp`

**Extends**: software-base

**Canon Skills (4)**: csharp-depth, async, type-systems, java (API design transfers)

**Ralph Skill Mapping**:
- plan: type-systems
- build: csharp-depth, async, type-systems
- refactor: csharp-depth, async

**Standards**: Records for immutability, pattern matching, nullable reference types, async all the way down, LINQ

**Use When**: .NET projects, Unity

---

### `sql`

SQL and database development.

**Composable**: Yes

**Canon Skills (4)**: sql, sql-perf, java (for stored procs/functions), security-mindset (injection prevention)

**Standards**: Set-based thinking, index optimization, parameterized queries, explicit JOIN syntax

**Use When**: Database-heavy projects, SQL development

---

## Framework Profiles

### `react`

**Extends**: javascript

**Canon Skills (1)**: react-state

**Ralph Skill Mapping**:
- plan: react-state, components
- build: react-state, components, reactivity
- refactor: react-state, components
- test: react-test
- review: usability

**Standards**: Hooks, composition, unidirectional flow

**Use When**: React SPAs, Next.js

---

### `angular`

**Extends**: javascript

**Canon Skills (4)**: angular-core, angular-arch, angular-perf, rxjs

**Ralph Skill Mapping**:
- plan: angular-core, angular-perf
- build: angular-core, rxjs, angular-perf, angular-arch
- refactor: angular-perf, rxjs
- test: angular-core

**Agents**: css-expert, accessibility-tester

**Standards**: OnPush change detection, standalone components, async pipe, lazy loading

**Use When**: Angular enterprise apps

---

### `d3`

**Extends**: javascript

**Canon Skills (4)**: d3, charts, dashboards, data-story

**Ralph Skill Mapping**:
- plan: charts, dashboards
- build: d3, charts, dashboards, data-story
- refactor: charts, dashboards
- review: dashboards, charts
- doc: data-story

**Agents**: css-expert, accessibility-tester

**Standards**: Data-join pattern, selections, scales

**Use When**: Data visualization, dashboards

---

## Specialty Profiles

### `frontend`

UI/UX canon for frontend projects. 12 skills for building beautiful interfaces without being a designer.

**Composable**: Yes (use with any language profile)

**Canon Skills (12)**:
- **Anthropic Official**: frontend-design
- **Philosophy & Psychology**: design, usability, personas
- **Visual & Typography**: visual, typography
- **Motion & Interaction**: motion, interaction
- **Patterns & Components**: mobile, components
- **Governance & Collaboration**: tokens, handoff

**Ralph Skill Mapping**:
- plan: personas, usability, charts
- build: frontend-design, components, visual, usability, mobile, motion, interaction, tokens, typography, design, handoff, charts
- refactor: components, design
- review: usability, personas
- doc: charts

**Agents**: css-expert, accessibility-tester

**Auto-Invoke Rules**:
```yaml
autoInvoke:
  - context: Building UI component
    action: INVOKE `/frontend-design` then `/components` then `/visual`
  - context: Designing forms
    action: INVOKE `/mobile` then `/usability`
  - context: Modals, dialogs, confirmations
    action: INVOKE `/personas` for goal-directed design
  - context: Adding animation
    action: INVOKE `/motion`
  - context: Mobile design
    action: INVOKE `/mobile` then `/interaction`
  - context: CSS styling, layouts
    action: INVOKE `/design` for simplicity check
```

**Use When**: Any frontend project with UI components

---

### `security`

Security-focused profile for security-critical projects.

**Composable**: Yes (use with any tech profile)

**Canon Skills (7)**: security-mindset, owasp, appsec, web-security, safety, resilience, failure

**Ralph Skill Mapping**:
- plan: security-mindset
- build: appsec, owasp, security-mindset
- refactor: owasp
- test: owasp, web-security
- review: security-mindset, owasp, appsec, web-security, safety, resilience

**Agents**: security-auditor

**Standards**: Assume all input is malicious, defense in depth, least privilege, fail securely, audit everything

**Use When**: Security-critical projects, applications handling sensitive data

---

### `business-base`

Base canon for business strategy and management projects.

**Canon Skills (5)**: management, competition, strategy, leadership, moats

**Ralph Skill Mapping**:
- plan: competition, strategy, management
- build: management, leadership
- review: leadership, competition
- doc: moats, data-story

**Standards**: Diagnosis before prescription, strategy as coherent actions, leverage points

**Use When**: Business strategy, management consulting, organizational design

---

## Meta Profile

### `ralph-integration`

Adds iteration discipline and quality gates for autonomous Ralph loops. Does NOT include canon skills — those come from your tech profile.

**Composable**: Yes (use with any base profile)

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
  post_loop_validation:
    gemini: true
    qodana: true
```

**Agents**: code-reviewer, test-engineer, security-auditor

**Use When**: Autonomous development with PRDs

---

## Profile Composition

Stack profiles with `+`:

```bash
lens profile apply javascript+react+d3 -p .
```

### Common Combinations

| Project Type | Profile Stack |
|--------------|---------------|
| React SPA | `javascript+react` |
| React + UI/UX | `javascript+react+frontend` |
| React + D3 | `javascript+react+d3` |
| Angular enterprise | `javascript+angular` |
| Angular + UI/UX | `javascript+angular+frontend` |
| Java backend | `java` |
| Java + UI/UX | `java+frontend` |
| C# backend | `csharp` |
| Python backend | `python` |
| Python + security | `python+security` |
| TypeScript CLI | `typescript-cli` |
| SQL development | `sql` |
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
