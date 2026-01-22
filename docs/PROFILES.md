# Claude Code Composable Profiles

Profiles are **composable** - stack them together for your project type.

## Canon Structure

Every project has a **Base Canon** (always active) + **Domain Canon** (project-specific).

```
┌─────────────────────────────────────────────────────────────┐
│ SOFTWARE PROJECTS                                           │
├─────────────────────────────────────────────────────────────┤
│ Base Canon: Kernighan, Schneier, Dodds, OWASP, Procida      │
│ Domain Canon: Selected per language/framework               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ BUSINESS PROJECTS                                           │
├─────────────────────────────────────────────────────────────┤
│ Base Canon: Strunk & White, Zinsser                         │
│ Domain Canon: Selected per focus area                       │
└─────────────────────────────────────────────────────────────┘
```

**Key**: Canon is always alive - the lens through which all work is done.

---

## Profile Catalog

### Software Profiles

| Profile | Description | Domain Canon |
|---------|-------------|--------------|
| `javascript` | JS/TS projects | Simpson, Cherny, Crockford |
| `react` | React/Next.js | Abramov |
| `angular` | Angular projects | Hevery, Papa, Kurata |
| `fullstack` | Java + JavaScript | Bloch + Simpson, Cherny, Crockford |
| `d3` | D3.js visualization | Bostock, Tufte, Few, Knaflic |
| `java` | Java | Bloch |
| `testing` | Extended testing focus | Dodds, Feathers, Meszaros, Fowler |
| `modernization` | Legacy modernization | Feathers, Fowler |
| `python` | Python | (TODO) |

### Business Profiles

| Profile | Description | Domain Canon |
|---------|-------------|--------------|
| `strategy` | Business strategy | Porter |
| `tech-analysis` | Tech industry analysis | Thompson |
| `startup` | Startups, org building | Horowitz |

---

## Profile Details

### Software Base Canon

**Included in ALL software projects. Always alive.**

| Expert | Focus | Core Contribution |
|--------|-------|-------------------|
| Kernighan | Clarity | The Practice of Programming |
| Schneier | Security | Threat modeling mindset |
| OWASP | AppSec | Vulnerability patterns |
| Procida | Documentation | Diátaxis framework |

**Testing Canon** (also in base):

| Expert | Focus | Core Contribution |
|--------|-------|-------------------|
| Dodds | Integration-first | Testing Trophy, Testing Library |
| Feathers | Legacy code | Characterization tests, seams |
| Meszaros | Test patterns | Test doubles, fixtures, smells |
| Fowler | Test strategy | Test pyramid, when to use which level |

**Agents available:** security-auditor, code-reviewer, test-engineer, qa-expert, test-automator

**Auto-Invoke Rules** (copy to project CLAUDE.md):

```markdown
## Auto-Invoke Rules

| Context | Action |
|---------|--------|
| Auth, login, password, session, token | INVOKE /schneier then /owasp |
| SQL, query, database access | INVOKE /owasp |
| User input, form data, API endpoints | INVOKE /owasp |
| New public API (exported function/class) | INVOKE --doc-code |
| New feature completed | INVOKE --doc-code |
| Complex system or architecture | INVOKE --doc-code --type=explanation |
| After --test completes successfully | INVOKE --doc-code |
| Testing code | INVOKE /dodds |
| Legacy code changes | INVOKE /feathers |
```

**Trigger Patterns** (high confidence - always trigger):

| Pattern | Skill/Flag |
|---------|------------|
| `auth\|login\|password\|session\|token` | /schneier, /owasp |
| `export function\|export class\|export interface` | --doc-code |
| New file in `src/features/` or `src/services/` | --doc-code |
| New route/endpoint | --doc-code, /owasp |
| `*.spec.ts` or `*.test.ts` | /dodds |

**Skip auto-invoke when**:
- Pure test files (for doc-code)
- Internal utilities (<50 lines, not exported)
- Config/comment changes only

---

### Business Base Canon

**Included in ALL business projects. Always alive.**

| Expert | Focus | Core Contribution |
|--------|-------|-------------------|
| Strunk & White | Clarity | Elements of Style |
| Zinsser | Writing | On Writing Well |
| Grove | Management | High Output Management |

---

## Software Domain Profiles

### javascript

**Domain canon for JS/TS projects.**

| Expert | Focus |
|--------|-------|
| Simpson | You Don't Know JS - runtime, closures, this |
| Cherny | Programming TypeScript - types, generics |
| Crockford | JavaScript: The Good Parts - avoiding bad parts, JSLint |

**Auto-Invoke:**
| Context | Action |
|---------|--------|
| Complex closures, `this` binding, async | INVOKE /simpson |
| TypeScript types, generics, inference | INVOKE /cherny |
| `.ts` or `.tsx` files | INVOKE /cherny |
| Code quality, avoiding bad parts | INVOKE /crockford |

---

### react

**Domain canon for React projects. Combine with `javascript`.**

| Expert | Focus |
|--------|-------|
| Abramov | Mental models, hooks, composition |

**Auto-Invoke:**
| Context | Action |
|---------|--------|
| React components (`*.tsx`, `use*` hooks) | INVOKE /abramov |
| State management, effects, composition | INVOKE /abramov |
| Component testing | INVOKE /dodds |

---

### angular

**Domain canon for Angular projects. Combine with `javascript`.**

| Expert | Focus |
|--------|-------|
| Hevery | Dependency injection, change detection, signals |
| Papa | Angular style guide, best practices |
| Kurata | Angular architecture, RxJS patterns |

**Agents:** css-expert, accessibility-tester

**Auto-Invoke:**
| Context | Action |
|---------|--------|
| Angular components (`*.component.ts`) | INVOKE /papa |
| Services, DI, change detection | INVOKE /hevery |
| RxJS, observables, async patterns | INVOKE /kurata |

---

### d3

**Domain canon for D3.js visualization. Combine with `javascript`.**

| Expert | Focus |
|--------|-------|
| Bostock | Selections, data joins, scales |
| Tufte | Visual Display of Quantitative Information |
| Few | Dashboard design, information clarity |
| Knaflic | Storytelling with Data |

**Agents:** css-expert, accessibility-tester

**Auto-Invoke:**
| Context | Action |
|---------|--------|
| D3 code, selections, scales | INVOKE /bostock |
| Chart/visualization design decisions | INVOKE /tufte then /few |
| Data storytelling, presentation | INVOKE /knaflic |

---

### fullstack

**Domain canon for full-stack Java + JavaScript projects.**

| Expert | Focus |
|--------|-------|
| Bloch | Effective Java - API design, collections |
| Simpson | You Don't Know JS - runtime, closures |
| Cherny | Programming TypeScript - types, generics |

Add `react` or `angular` profile for framework-specific canon.

**Auto-Invoke:**
| Context | Action |
|---------|--------|
| Java code (`.java` files) | INVOKE /bloch |
| JavaScript/TypeScript code | INVOKE /simpson, /cherny |

---

### java

**Domain canon for Java projects.**

| Expert | Focus |
|--------|-------|
| Bloch | Effective Java - API design, collections |

**Auto-Invoke:**
| Context | Action |
|---------|--------|
| Java code (`.java` files) | INVOKE /bloch |
| API design, collections, concurrency | INVOKE /bloch |

---

### python

**Domain canon for Python projects.**

| Expert | Focus |
|--------|-------|
| (TODO) | (add Python expert) |

---

### modernization

**Domain canon for legacy modernization projects.**

| Expert | Focus |
|--------|-------|
| Feathers | Working Effectively with Legacy Code |
| Fowler | Refactoring - improving design of existing code |

---

## Business Domain Profiles

### strategy

**Domain canon for business strategy work.**

| Expert | Focus |
|--------|-------|
| Porter | Competitive Advantage, Five Forces |

---

### tech-analysis

**Domain canon for tech industry analysis.**

| Expert | Focus |
|--------|-------|
| Thompson | Stratechery - aggregation theory, platform analysis |

---

### startup

**Domain canon for startups and org building.**

| Expert | Focus |
|--------|-------|
| Horowitz | The Hard Thing About Hard Things |

---

## Example Combinations

### Software Projects

| Project Type | Base | Domain |
|--------------|------|--------|
| React frontend | Software Base | javascript + react |
| D3 visualization | Software Base | javascript + d3 |
| React + D3 viz | Software Base | javascript + react + d3 |
| Node API | Software Base | javascript |
| Java backend | Software Base | java |

### Business Projects

| Project Type | Base | Domain |
|--------------|------|--------|
| Strategy doc | Business Base | strategy |
| Tech analysis | Business Base | tech-analysis |
| Startup planning | Business Base | startup |
| General writing | Business Base | (base only) |

---

## Applied Examples

### React Full-Stack Project

```
Project Type: Software
Base Canon: Kernighan, Schneier, Dodds, OWASP, Procida
Domain Canon: Simpson, Cherny, Abramov

Canon is always alive - shapes all code written in this project.
```

### D3 Visualization Project

```
Project Type: Software
Base Canon: Kernighan, Schneier, Dodds, OWASP, Procida
Domain Canon: Simpson, Bostock, Tufte, Few, Knaflic

All visualization code follows Bostock patterns.
All design decisions through Tufte/Few/Knaflic lens.
```

### Business Strategy Document

```
Project Type: Business
Base Canon: Strunk & White, Zinsser
Domain Canon: Porter

Writing is clear and concise.
Analysis uses Five Forces, value chain frameworks.
```

---

## How to Apply Profiles

1. **Determine project type:**
   - Software project → Software Base Canon
   - Business project → Business Base Canon

2. **Select domain canon:**
   - Based on language/framework (software)
   - Based on focus area (business)

3. **Update project CLAUDE.md:**
   ```markdown
   ## Project Type
   Software

   ## Canon Stack (always alive)

   ### Base Canon
   Kernighan, Schneier, Dodds, OWASP, Procida

   ### Domain Canon
   Simpson (JS), Abramov (React)

   ## Quality Philosophy
   Canon is the lens through which all work is done.
   Quality is generative, not corrective.
   ```

4. **Create canon skills** (if needed):
   ```bash
   mkdir -p /path/to/project/.claude/skills
   # Add skill files for each canon expert
   ```

---

## Skill Library Locations

| Library | Path | Contents |
|---------|------|----------|
| Software Base | `~/.claude/skill-library/software-base/` | kernighan, schneier, dodds, owasp, procida |
| Business Base | `~/.claude/skill-library/business-base/` | strunk-white, zinsser |
| Domain Canon | `~/local-tech-projects/canon-skills/` | Language/framework experts (bloch, pike, abramov, bostock, etc.) |
| Business Domain | `~/local-tech-projects/canon-skills/business/` | porter, thompson, horowitz |
