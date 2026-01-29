# How-To Guides: Canon Configuration

Task-oriented guides for specific goals.

---

## Add a Custom Detection Rule {#add-rule}

**Goal**: Add skills that trigger when specific keywords appear in tasks.

1. Open `canon/skill-rules.yaml`

2. Add a new rule under `rules:`:
   ```yaml
   rules:
     # ... existing rules ...

     my-category:
       patterns:
         - keyword1
         - multi word phrase
       skills:
         - expert1
         - expert2
       stages: [plan, build, review]
       workflows: [implement, plan]
   ```

3. Save the file. Detection uses the new rule immediately (no restart needed).

**Troubleshooting**:
- Pattern not matching? Check word boundaries - `auth` won't match inside `authenticate`
- Skills not loading? Verify the skill exists in `canon/*/SKILL.md`

---

## Combine Multiple Profiles {#combine-profiles}

**Goal**: Apply multiple profiles to get combined expertise.

```bash
cc-config profile apply javascript+react+ralph-integration -p .
```

Profiles are combined left-to-right:
- `javascript` - Base JS experts (cherny, crockford, etc.)
- `react` - React experts (abramov, dodds)
- `ralph-integration` - Loop discipline and quality gates

**Note**: Only profiles with `composable: true` can be combined.

---

## Create a New Profile {#create-profile}

**Goal**: Create a profile for your tech stack.

1. Create `profiles/my-stack.yaml`:
   ```yaml
   name: my-stack
   description: My technology stack
   composable: true
   extends: software-base

   ralph:
     skills:
       plan:
         - kernighan
       build:
         - my-expert
       test:
         - meszaros

   skills:
     canon:
       - kernighan
       - my-expert
       - meszaros

   claudeMd:
     standards:
       - "My coding standard"
     antiPatterns:
       - "Pattern to avoid"
   ```

2. Apply it:
   ```bash
   cc-config profile apply my-stack -p .
   ```

---

## Add Workflow-Specific Defaults {#workflow-defaults}

**Goal**: Ensure certain experts always run for a workflow command.

1. Open `canon/skill-rules.yaml`

2. Add or modify `workflow-defaults`:
   ```yaml
   workflow-defaults:
     my-workflow:
       always:
         - expert1
         - expert2
       phases:
         planning: [kernighan, pike]
         execution: [thompson]
   ```

Now `/my-workflow` always invokes `expert1` and `expert2`.

---

## Debug Skill Detection {#debug-detection}

**Goal**: See which skills are being selected and why.

### Method 1: Ralph Verbose Mode

```bash
/ralph-loop PRD.md --verbose
```

Shows detected keywords and resulting skills for each stage.

### Method 2: Programmatic Check

```typescript
import { getWorkflowSkills } from './skills/rules-loader.js';

const skills = getWorkflowSkills(
  '/path/to/project',
  'implement',
  'Add JWT authentication',
  'build'
);

console.log(skills);
// ['kernighan', 'schneier', 'owasp', ...]
```

### Method 3: Check Rule Loading

```typescript
import { hasCustomRules, loadSkillRules } from './skills/rules-loader.js';

console.log('Custom rules?', hasCustomRules('/path/to/project'));

const rules = loadSkillRules('/path/to/project');
console.log('Rules loaded:', rules.length);
```

---

## Override Profile Skills for One Stage {#override-stage}

**Goal**: Use different skills for one stage without changing the profile.

Edit your project's `ralph-config.yaml`:

```yaml
skills:
  review:
    - schneier
    - my-security-expert
```

This overrides only the `review` stage; other stages use profile defaults.

---

## Make Patterns Match Partial Words {#partial-match}

**Goal**: Match `authenticate` with an `auth` pattern.

By default, patterns use word boundaries. To match partials, use a prefix pattern:

```yaml
patterns:
  - auth          # Matches: auth, but NOT authenticate
  - authentica    # Matches: authenticate, authentication
```

Or add both:

```yaml
patterns:
  - auth
  - authenticate
  - authentication
```

---

## Disable a Detection Rule Temporarily {#disable-rule}

**Goal**: Stop a rule from firing without deleting it.

Comment out the rule:

```yaml
rules:
  # security:
  #   patterns: [auth, password]
  #   skills: [schneier, owasp]
  #   stages: [plan, build, review]
```

Or remove stages/workflows to limit where it applies:

```yaml
rules:
  security:
    patterns: [auth, password]
    skills: [schneier, owasp]
    stages: []           # Never fires for Ralph
    workflows: [review-hard]  # Only for /review-hard
```

---

## Use Different Rules Per Project {#per-project-rules}

**Goal**: Have project-specific detection rules.

Each project can have its own `canon/skill-rules.yaml`. The loader looks in the project's `canon/` folder first.

1. Copy the base rules:
   ```bash
   cp /path/to/claude-optimal/canon/skill-rules.yaml ./canon/
   ```

2. Modify for your project's needs.

The project-local file takes precedence.
