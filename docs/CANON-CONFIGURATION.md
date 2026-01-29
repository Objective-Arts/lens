# Canon Configuration Manual

How profiles, skill rules, and canon experts work together.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your Project                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │   Profile    │    │  skill-rules.yaml │    │  Canon Skills │  │
│  │              │    │                   │    │               │  │
│  │ "Always use  │ +  │ "Also use X when  │ →  │  SKILL.md     │  │
│  │  these for   │    │  task mentions Y" │    │  files        │  │
│  │  this stage" │    │                   │    │               │  │
│  └──────────────┘    └──────────────────┘    └───────────────┘  │
│         │                     │                      ↑          │
│         └─────────────────────┴──────────────────────┘          │
│                          Merged                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Canon Skills (The Experts)

**Location:** `canon/*/SKILL.md`

Canon skills are the actual expert guidance - each represents a programming luminary's philosophy and patterns.

```
canon/
├── kernighan/SKILL.md      # Clarity, simplicity
├── pike/SKILL.md           # Minimal interfaces
├── linus/SKILL.md          # Data structures first
├── thompson/SKILL.md       # Get it working, then optimize
├── schneier/SKILL.md       # Security mindset
├── javascript/
│   ├── cherny/SKILL.md     # TypeScript mastery
│   ├── crockford/SKILL.md  # Good parts
│   └── dodds/SKILL.md      # Testing Trophy
└── ...
```

**What they contain:**
- Philosophy and principles
- Code patterns and anti-patterns
- Decision frameworks
- Examples

---

## 2. Profiles (Project Configuration)

**Location:** `profiles/*.yaml`

Profiles define what canon skills to use for a project type. They're composable.

### Profile Structure

```yaml
# profiles/javascript.yaml
name: javascript
extends: software-base        # Inherit from base profile
composable: true              # Can combine with other profiles

# Static skill assignments per Ralph stage
ralph:
  skills:
    plan:
      - kyle-simpson          # Always for planning JS
    build:
      - cherny                # Always for building JS
      - crockford
      - osmani
    test:
      - dodds                 # Always for testing JS
    # review and doc: inherited from software-base

# All canon skills available to this profile
skills:
  canon:
    - kyle-simpson
    - cherny
    - crockford
    - dodds
    - abramov
    # ... etc

# CLAUDE.md standards this profile adds
claudeMd:
  standards:
    - "Use const by default"
    - "Prefer arrow functions"
  antiPatterns:
    - "var declarations"
    - "callback hell"
  autoInvoke:
    - context: TypeScript types
      action: INVOKE `/cherny`
```

### Combining Profiles

```bash
# Apply multiple profiles
cc-config profile apply javascript+react+ralph-integration -p .
```

This merges:
- `javascript`: JS canon experts + standards
- `react`: React-specific experts (abramov, dodds)
- `ralph-integration`: Autonomous loop discipline

---

## 3. Skill Rules (Dynamic Detection)

**Location:** `canon/skill-rules.yaml`

Adds skills dynamically based on task content. Supplements profile's static assignments.

### Structure

```yaml
# Workflow defaults - core canons for each command
workflow-defaults:
  plan:
    always: [kernighan, pike, linus]     # Always invoke for /plan
    phases:
      design: [cherny, dijkstra]         # During design phase

  implement:
    always: [kernighan]
    phases:
      plan: [pike, linus]
      build: [thompson, bill-joy]
      test: [meszaros, dodds]
      review: [schneier, owasp]

# Detection rules - keyword-based skill selection
rules:
  security:
    patterns:                             # Keywords to match
      - auth
      - password
      - jwt
      - token
    skills:                               # Skills to add when matched
      - schneier
      - owasp
      - security-mindset
    stages: [plan, build, review]         # Ralph stages where rule applies
    workflows: [implement, review-hard]   # Workflow commands where rule applies

  database:
    patterns: [sql, orm, prisma, mongo]
    skills: [bloch, schneier]
    stages: [plan, build, review]
    workflows: [implement, plan]
```

### Fields Explained

| Field | Purpose |
|-------|---------|
| `patterns` | Keywords to match (case-insensitive, word boundaries) |
| `skills` | Canon skills to add when pattern matches |
| `stages` | Ralph pipeline stages where rule applies |
| `workflows` | Workflow commands (`/implement`, `/plan`, etc.) where rule applies |

---

## 4. How They Merge

### For Ralph Stages

```
Profile Skills (static)     +     Detected Skills (dynamic)     =     Final Skills
─────────────────────────         ──────────────────────────         ─────────────
ralph.skills.build:               From skill-rules.yaml:             All merged:
  - cherny                        Task: "Add JWT auth"               - cherny
  - crockford                     Matches: security rule             - crockford
  - osmani                        Adds: schneier, owasp              - osmani
                                                                      - schneier
                                                                      - owasp
                                                                      - security-mindset
```

### For Workflow Commands

```
Workflow Defaults (always)  +     Detected Skills (dynamic)     =     Final Skills
──────────────────────────        ──────────────────────────         ─────────────
workflow-defaults.plan:           From skill-rules.yaml:             All merged:
  always: [kernighan, pike]       Task: "Design auth API"            - kernighan
                                  Matches: security, api rules       - pike
                                  Adds: schneier, bloch              - linus
                                                                      - schneier
                                                                      - bloch
```

---

## 5. Execution Flow

### Ralph Loop (`/ralph-loop`)

```
1. Load profile config
   └── config.skills.plan = ['kyle-simpson']

2. For each PRD item:
   └── "Implement JWT authentication for API"

3. For each stage (plan, build, test, review, doc):
   │
   ├── Get profile skills for stage
   │   └── ['kyle-simpson']
   │
   ├── Detect skills from task text + stage
   │   └── Matches: security, api rules
   │   └── Adds: ['schneier', 'owasp', 'bloch']
   │
   ├── Merge and dedupe
   │   └── ['kyle-simpson', 'schneier', 'owasp', 'bloch']
   │
   └── Load SKILL.md files and execute stage
```

### Workflow Command (`/implement`, `/plan`, etc.)

```
1. Get workflow defaults
   └── implement.always = ['kernighan']
   └── implement.phases.build = ['thompson', 'bill-joy']

2. Detect skills from task text + workflow
   └── Task: "Add password reset"
   └── Matches: security rule
   └── Adds: ['schneier', 'owasp']

3. Merge all
   └── ['kernighan', 'thompson', 'bill-joy', 'schneier', 'owasp']

4. Load and invoke
```

---

## 6. Configuration Precedence

From highest to lowest priority:

1. **Explicit invocation** - User types `/schneier` directly
2. **Workflow defaults** - `workflow-defaults.*.always`
3. **Dynamic detection** - `skill-rules.yaml` pattern matches
4. **Profile skills** - `ralph.skills.*` per stage
5. **Inherited skills** - From `extends: base-profile`

---

## 7. Common Patterns

### Language + Framework + Ralph

```bash
cc-config profile apply typescript+react+ralph-integration -p .
```

- `typescript`: Cherny, type patterns
- `react`: Abramov, Dodds, component patterns
- `ralph-integration`: Loop discipline, quality gates

### Security-Hardened Project

```bash
cc-config profile apply javascript+security-hardened+ralph-integration -p .
```

The `security-hardened` profile adds security experts to every stage, not just when detected.

### Adding Custom Detection Rules

Edit `canon/skill-rules.yaml`:

```yaml
rules:
  # Add your domain
  my-domain:
    patterns:
      - my-keyword
      - domain-term
    skills:
      - relevant-expert
    stages: [plan, build]
    workflows: [implement]
```

---

## 8. Files Reference

| File | Purpose |
|------|---------|
| `canon/*/SKILL.md` | Expert guidance content |
| `canon/skill-rules.yaml` | Dynamic detection rules |
| `profiles/*.yaml` | Project type configurations |
| `workflow-skills/*/SKILL.md` | Workflow command definitions |
| `.claude/CLAUDE.md` | Generated project instructions |

---

## 9. Debugging

### See what skills are detected

```typescript
import { getWorkflowSkills } from './skills/rules-loader.js';

const skills = getWorkflowSkills(
  projectPath,
  'implement',           // workflow
  'Add JWT auth',        // task text
  'build'                // optional phase
);
console.log(skills);
// ['kernighan', 'thompson', 'schneier', 'owasp', ...]
```

### Check if custom rules are loaded

```typescript
import { hasCustomRules } from './skills/rules-loader.js';

if (hasCustomRules(projectPath)) {
  console.log('Using custom skill-rules.yaml');
} else {
  console.log('Using default rules');
}
```

---

## 10. Summary

| Component | Static/Dynamic | Scope | When Used |
|-----------|---------------|-------|-----------|
| Profile `ralph.skills` | Static | Per stage | Always for this project |
| `workflow-defaults` | Static | Per command | Always for this command |
| `rules.*.patterns` | Dynamic | Per match | When keywords found in task |
| Canon `SKILL.md` | Content | Per expert | When skill is selected |

**The key insight:** Profiles define your baseline, skill-rules.yaml adds context-aware experts dynamically.
