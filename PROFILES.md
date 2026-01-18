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
| `javascript` | JS/TS projects | Simpson, Cherny |
| `react` | React/Next.js | Abramov |
| `d3` | D3.js visualization | Bostock, Tufte, Few, Knaflic |
| `node` | Node.js backend | (uses base) |
| `java` | Java | Bloch |
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
| Dodds | Testing | Testing Trophy, Testing Library |
| OWASP | AppSec | Vulnerability patterns |
| Procida | Documentation | Diátaxis framework |

**Agents available:** security-auditor, code-reviewer, test-engineer

---

### Business Base Canon

**Included in ALL business projects. Always alive.**

| Expert | Focus | Core Contribution |
|--------|-------|-------------------|
| Strunk & White | Clarity | Elements of Style |
| Zinsser | Writing | On Writing Well |

---

## Software Domain Profiles

### javascript

**Domain canon for JS/TS projects.**

| Expert | Focus |
|--------|-------|
| Simpson | You Don't Know JS - runtime, closures, this |
| Cherny | Programming TypeScript - types, generics |

---

### react

**Domain canon for React projects. Combine with `javascript`.**

| Expert | Focus |
|--------|-------|
| Abramov | Mental models, hooks, composition |

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

---

### java

**Domain canon for Java projects.**

| Expert | Focus |
|--------|-------|
| Bloch | Effective Java - API design, collections |

---

### python

**Domain canon for Python projects.**

| Expert | Focus |
|--------|-------|
| (TODO) | (add Python expert) |

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
