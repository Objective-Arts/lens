# Explanation: Canon Configuration Design

Why the system is designed this way.

---

## The Problem We're Solving

When using AI for code generation, you want consistent application of software engineering principles. But different tasks need different expertise:

- Building a REST API? You need Bloch's API design principles.
- Adding authentication? You need Schneier's security mindset.
- Writing tests? You need Meszaros's test patterns.

Manually invoking the right experts for each task is tedious and error-prone. You might forget to invoke security expertise when adding auth, leading to vulnerabilities.

---

## Why Two Configuration Layers?

### Layer 1: Profiles (Static)

Profiles define what expertise your project type needs **by default**.

A JavaScript project always benefits from:
- Cherny for TypeScript
- Crockford for language discipline
- Dodds for testing patterns

These are known at project setup time. They don't change based on what you're implementing today.

### Layer 2: Skill Rules (Dynamic)

Skill rules detect **context-specific** needs from task content.

When your task mentions "JWT" or "authentication", the system recognizes this is security-sensitive and adds security experts—even if your profile is "javascript" not "security-hardened".

### Why Not Just One Layer?

**Profiles alone** would require:
- A profile for every combination: `javascript-security`, `javascript-api`, `javascript-security-api`
- Or manually invoking experts: "I'm doing auth, better add /schneier"

**Detection alone** would miss:
- Base expertise that's always relevant (TypeScript for a TS project)
- Expertise that doesn't have obvious keywords

Together, they give you sensible defaults plus smart context detection.

---

## Why Separate Stages from Workflows?

### Stages: Ralph Pipeline

Ralph runs a fixed pipeline for each PRD item:

```
plan → build → refactor → test → review → doc
```

Different expertise matters at different stages:
- **plan**: Kernighan (clarity), Pike (interfaces)
- **build**: Thompson (get it working), domain experts
- **review**: Schneier (security), quality experts

### Workflows: Standalone Commands

Workflow commands (`/implement`, `/plan`, `/review-hard`) are invoked independently. They might internally go through multiple phases, but they're triggered by user action, not a pipeline.

Why separate configuration?

1. **Different triggers**: Stages run automatically in sequence; workflows are user-invoked
2. **Different defaults**: `/review-hard` always wants security focus; the `review` stage might not
3. **Composability**: You might use `/plan` outside of Ralph entirely

---

## Why Keyword Detection?

We considered alternatives:

### Option: LLM Classification

Ask Claude: "What expertise does this task need?"

**Rejected because**:
- Circular: using Claude to configure Claude
- Latency: API call per detection
- Cost: Adds up in long loops
- Non-deterministic: Same task might get different experts

### Option: User Annotation

Require users to tag tasks: `[security] Add JWT auth`

**Rejected because**:
- Friction: Users forget or get it wrong
- Expertise gap: Users might not know they need security review
- Doesn't scale: Every new domain needs new tags

### Chosen: Keyword Detection

Pattern matching is:
- **Deterministic**: Same input → same output
- **Fast**: Regex, no API calls
- **Maintainable**: Rules are visible and editable
- **Extensible**: Add patterns for your domain

The trade-off is false negatives (keywords not in the pattern list). We mitigate this with comprehensive default rules and the ability to extend.

---

## Why YAML Configuration?

### Considered: Hardcoded Rules

```typescript
const RULES = [
  { patterns: /auth|password/, skills: ['schneier'] }
];
```

**Rejected because**:
- Requires code changes to modify
- No project-specific customization
- Can't override without forking

### Considered: Per-Skill Declaration

Each skill declares its own triggers:

```yaml
# canon/schneier/SKILL.md frontmatter
triggers:
  patterns: [auth, password]
```

**Rejected because**:
- 80+ files to maintain
- No central view of all rules
- Harder to see conflicts/overlaps

### Chosen: Central YAML File

One file (`skill-rules.yaml`) with all rules:
- Single source of truth
- Clear diffs in version control
- Easy to review and modify
- Project-specific overrides possible

---

## The Merge Strategy

When determining skills for a task, we merge from multiple sources:

```
Profile defaults (always)
    +
Workflow defaults (if using workflow)
    +
Phase-specific (if in a phase)
    +
Keyword-detected (from task text)
    =
Final skill set (deduplicated)
```

### Why Additive?

We only add skills, never remove. This is intentional:

- **Safe by default**: Extra expertise rarely hurts
- **Predictable**: Profile skills always present
- **No surprises**: You know your base is stable

If you need to exclude a skill, remove it from the profile or workflow defaults—don't try to subtract dynamically.

---

## Trade-offs Acknowledged

### More Skills = More Context

Each loaded skill adds to the prompt. Too many skills could:
- Dilute focus
- Exceed context limits
- Slow processing

We mitigate by:
- Stage filtering (security skills in review, not doc)
- Workflow filtering (test skills for /test, not /plan)
- Keeping skill content concise

### Keyword Matching Limitations

Word boundaries mean:
- `auth` won't match `authenticate`
- `sql` won't match `postgresql`

We mitigate by:
- Including common variations in patterns
- Allowing partial prefixes where useful
- Making rules editable for project needs

### Maintenance Burden

Rules need updating as:
- New skills are added
- New domains emerge
- Patterns prove too broad/narrow

We accept this as the cost of configurability. The alternative (hardcoding or LLM) has worse trade-offs.

---

## Future Directions

### Confidence Scoring

Instead of binary match/no-match, weight by relevance:

```yaml
security:
  patterns:
    - pattern: auth
      confidence: 0.9
    - pattern: password
      confidence: 0.95
    - pattern: user
      confidence: 0.3
```

### Skill Relationships

Express conflicts and dependencies:

```yaml
security:
  requires: [schneier, owasp]  # Both together
  conflicts: [move-fast]        # Don't combine
```

### Learning from Usage

Track which skills are actually useful:
- If schneier is loaded but never referenced, maybe the detection was wrong
- If users manually invoke skills, maybe detection should have caught it

These remain future enhancements. The current system prioritizes simplicity and predictability.
