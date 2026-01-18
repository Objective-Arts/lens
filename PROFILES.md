# Claude Code Composable Profiles

Profiles are **composable** - stack them together for your project type.

## Profile Catalog

| Profile | Description | Skills Included |
|---------|-------------|-----------------|
| `base-tech` | All tech projects | Security + dev workflows |
| `javascript` | JS/TS projects | kyle-simpson, cherny |
| `react` | React/Next.js | abramov, dodds, osmani |
| `angular` | Angular | dodds, osmani |
| `d3` | D3.js visualization | bostock |
| `node` | Node.js backend | dodds, osmani |
| `frontend` | UI work | frontend-design |
| `java` | Java | bloch |
| `go` | Go | pike |
| `python` | Python | (TODO) |

---

## Profile Details

### base-tech

**Include in ALL tech projects.**

| Category | Skills |
|----------|--------|
| Security | security-mindset, owasp, bruce-schneier, tanya-janca, troy-hunt |
| Dev Workflows | ceremony, defense-in-depth, escalate, generate-validate, understand-first, specialist-swarm |
| Agents | security-auditor, code-reviewer, test-engineer |

**Auto-invoke:**
- Auth, login, passwords → `/security-mindset`
- SQL, user input, APIs → `/owasp`
- Production deployment → `/ceremony`

---

### javascript

**Add to any JS/TS project.**

| Category | Skills |
|----------|--------|
| Tech | kyle-simpson |
| Canon | cherny |

**Auto-invoke:**
- Complex JS runtime, closures, this → `/kyle-simpson`
- TypeScript types, generics → `/cherny`

---

### react

**Combine with `javascript`.**

| Category | Skills |
|----------|--------|
| Canon | abramov, dodds, osmani |

**Auto-invoke:**
- React components, hooks, state → `/abramov`
- Writing or reviewing tests → `/dodds`
- Performance, bundle size → `/osmani`

---

### angular

**Combine with `javascript`.**

| Category | Skills |
|----------|--------|
| Canon | dodds, osmani |

**Auto-invoke:**
- Writing or reviewing tests → `/dodds`
- Performance optimization → `/osmani`

---

### d3

**Combine with `javascript`.**

| Category | Skills |
|----------|--------|
| Canon | bostock |
| Commands | viz/*, d3/* |
| Agents | css-expert, accessibility-tester |

**Auto-invoke:**
- D3 selections, data joins, scales → `/bostock`

---

### node

**Combine with `javascript`.**

| Category | Skills |
|----------|--------|
| Canon | dodds, osmani |

**Auto-invoke:**
- Writing or reviewing tests → `/dodds`
- Performance, memory, event loop → `/osmani`

---

### frontend

**Add to any frontend project.**

| Category | Skills |
|----------|--------|
| Tech | frontend-design |
| Agents | css-expert, accessibility-tester |

**Auto-invoke:**
- UI design, styling, layouts → `/frontend-design`

---

### java

**Combine with `base-tech`.**

| Category | Skills |
|----------|--------|
| Canon | bloch |

**Auto-invoke:**
- Java code, API design, collections → `/bloch`

---

### go

**Combine with `base-tech`.**

| Category | Skills |
|----------|--------|
| Canon | pike |

**Auto-invoke:**
- Go code, concurrency, channels → `/pike`

---

### python

**Combine with `base-tech`.**

| Category | Skills |
|----------|--------|
| Canon | (TODO: add Python expert) |

---

## Example Combinations

| Project Type | Profiles | Total Skills |
|--------------|----------|--------------|
| React frontend | `base-tech + javascript + react + frontend` | ~17 |
| React + D3 viz | `base-tech + javascript + react + d3 + frontend` | ~18 |
| D3 visualization | `base-tech + javascript + d3 + frontend` | ~15 |
| Node API | `base-tech + javascript + node` | ~14 |
| Full-stack JS | `base-tech + javascript + react + node + frontend` | ~18 |
| Java backend | `base-tech + java` | ~13 |
| Go service | `base-tech + go` | ~13 |

---

## Applied Examples

### cdr-case-management

```
Profiles: base-tech + javascript + react + node + frontend

Skills (17):
  Security: security-mindset, owasp, bruce-schneier, tanya-janca, troy-hunt
  Tech: ceremony, defense-in-depth, escalate, generate-validate,
        understand-first, specialist-swarm, kyle-simpson, frontend-design
  Canon: cherny, abramov, dodds, osmani
```

### d3-smr

```
Profiles: base-tech + javascript + d3 + frontend

Skills (23 including project-specific):
  Security: security-mindset, owasp, bruce-schneier, tanya-janca, troy-hunt
  Tech: ceremony, defense-in-depth, escalate, generate-validate,
        understand-first, specialist-swarm, kyle-simpson, frontend-design
  Canon: cherny, bostock, abramov, dodds, osmani
  Project: d3-expert, d3-mental-model, d3-review, d3:start, d3:finish
```

---

## How to Apply Profiles

1. **Create project skills directory:**
   ```bash
   mkdir -p /path/to/project/.claude/skills
   ```

2. **Link skills from library:**
   ```bash
   cd /path/to/project/.claude/skills

   # base-tech security
   ln -sf ~/.claude/skill-library/security/* .

   # base-tech workflows
   ln -sf ~/.claude/skill-library/tech/* .

   # canon skills (adjust path)
   ln -sf ~/local-tech-projects/canon-skills/javascript/abramov .
   ln -sf ~/local-tech-projects/canon-skills/javascript/dodds .
   # etc.
   ```

3. **Update project CLAUDE.md:**
   ```markdown
   ## Profiles Applied

   `base-tech + javascript + react + frontend`

   ## Auto-Invoke Skills

   | Context | Action |
   |---------|--------|
   | React components, hooks | INVOKE `/abramov` |
   | Writing tests | INVOKE `/dodds` |
   | Auth, passwords | INVOKE `/security-mindset` |
   ```

---

## Skill Library Locations

| Library | Path | Contents |
|---------|------|----------|
| Security | `~/.claude/skill-library/security/` | security-mindset, owasp, bruce-schneier, tanya-janca, troy-hunt |
| Tech | `~/.claude/skill-library/tech/` | ceremony, defense-in-depth, escalate, generate-validate, understand-first, specialist-swarm, kyle-simpson, frontend-design |
| Canon | `~/local-tech-projects/canon-skills/` | Language/framework experts (bloch, pike, abramov, etc.) |
| Global | `~/.claude/skills/` | Universal skills (productivity workflows, meta) |
