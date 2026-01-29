# Reference: Canon Configuration

Complete specification of formats, APIs, and file locations.

---

## File Locations

| File | Location | Purpose |
|------|----------|---------|
| Skill rules | `canon/skill-rules.yaml` | Detection patterns and workflow defaults |
| Profiles | `profiles/*.yaml` | Project type configurations |
| Canon skills | `canon/*/SKILL.md` | Expert guidance content |
| Workflow skills | `workflow-skills/*/SKILL.md` | Command definitions |
| Project config | `.claude/CLAUDE.md` | Generated project instructions |

---

## skill-rules.yaml Format

### Top-Level Structure

```yaml
workflow-defaults:
  <workflow-name>:
    always: [<skill>, ...]
    phases:
      <phase-name>: [<skill>, ...]

rules:
  <category-name>:
    patterns: [<pattern>, ...]
    skills: [<skill>, ...]
    stages: [<stage>, ...]
    workflows: [<workflow>, ...]
```

### workflow-defaults

Defines skills that always run for workflow commands.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `always` | `string[]` | Yes | Skills invoked every time this workflow runs |
| `phases` | `object` | No | Phase-specific skills |
| `phases.<name>` | `string[]` | No | Skills for this phase |

**Valid workflow names**:
- `implement`
- `plan`
- `review-hard`
- `structure-first`
- `build-from-plan`
- `refactor-clean`
- `test`

**Example**:
```yaml
workflow-defaults:
  implement:
    always:
      - kernighan
    phases:
      plan: [pike, linus]
      build: [thompson]
      review: [schneier]
```

### rules

Keyword-based skill detection.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `patterns` | `string[]` | Yes | Keywords to match (case-insensitive) |
| `skills` | `string[]` | Yes | Skills to add when matched |
| `stages` | `string[]` | No | Ralph stages where rule applies |
| `workflows` | `string[]` | No | Workflow commands where rule applies |

**Valid stages**:
- `plan`
- `build`
- `refactor`
- `test`
- `review`
- `doc`

**Pattern matching**:
- Case-insensitive
- Word boundaries apply (`auth` matches "auth" but not "authenticate")
- Multi-word patterns: spaces match flexible whitespace (`access control` matches `access-control`)
- Longer patterns match first

**Example**:
```yaml
rules:
  security:
    patterns:
      - auth
      - password
      - jwt
      - access control
    skills:
      - schneier
      - owasp
    stages: [plan, build, review]
    workflows: [implement, review-hard]
```

---

## Profile YAML Format

### Top-Level Structure

```yaml
name: <profile-name>
description: <description>
projectType: software | business
composable: true | false
extends: <parent-profile>

ralph:
  skills:
    <stage>: [<skill>, ...]
  max_iterations: <number>
  quality_gates:
    <gate>: <value>

skills:
  canon: [<skill>, ...]

claudeMd:
  standards: [<string>, ...]
  antiPatterns: [<string>, ...]
  autoInvoke:
    - context: <string>
      action: <string>
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Profile identifier |
| `description` | `string` | Yes | Human-readable description |
| `projectType` | `string` | No | `software` or `business` |
| `composable` | `boolean` | No | Can combine with other profiles |
| `extends` | `string` | No | Parent profile to inherit from |

### ralph

Ralph-specific configuration.

| Field | Type | Description |
|-------|------|-------------|
| `skills.<stage>` | `string[]` | Skills for this Ralph stage |
| `max_iterations` | `number` | Maximum loop iterations |
| `max_iterations_per_item` | `number` | Max attempts per PRD item |
| `quality_gates` | `object` | Quality requirements |

### skills.canon

List of all canon skills available to this profile.

### claudeMd

Content generated into `.claude/CLAUDE.md`.

| Field | Type | Description |
|-------|------|-------------|
| `standards` | `string[]` | Coding standards |
| `antiPatterns` | `string[]` | Patterns to avoid |
| `autoInvoke` | `object[]` | Context-based skill invocation |

---

## API Functions

### loadSkillRules

```typescript
function loadSkillRules(projectPath: string): readonly SkillRule[]
```

Loads detection rules from `canon/skill-rules.yaml` or returns defaults.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `projectPath` | `string` | Project root directory |

**Returns**: Array of compiled `SkillRule` objects.

**Example**:
```typescript
import { loadSkillRules } from './skills/rules-loader.js';

const rules = loadSkillRules('/path/to/project');
// [{ keywords: /regex/, skills: [...], stages: [...] }, ...]
```

---

### getWorkflowSkills

```typescript
function getWorkflowSkills(
  projectPath: string,
  workflow: WorkflowName,
  taskText: string,
  phase?: string
): readonly string[]
```

Gets all skills for a workflow command (defaults + detected).

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `projectPath` | `string` | Project root directory |
| `workflow` | `WorkflowName` | Workflow command name |
| `taskText` | `string` | Task description for keyword matching |
| `phase` | `string` | Optional phase within workflow |

**Returns**: Array of unique skill names.

**Example**:
```typescript
import { getWorkflowSkills } from './skills/rules-loader.js';

const skills = getWorkflowSkills(
  '/path/to/project',
  'implement',
  'Add JWT authentication',
  'build'
);
// ['kernighan', 'thompson', 'schneier', 'owasp', ...]
```

---

### getWorkflowConfig

```typescript
function getWorkflowConfig(
  projectPath: string,
  workflow: WorkflowName
): WorkflowConfig
```

Gets workflow defaults configuration.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `projectPath` | `string` | Project root directory |
| `workflow` | `WorkflowName` | Workflow command name |

**Returns**: `WorkflowConfig` object with `always` and `phases`.

---

### hasCustomRules

```typescript
function hasCustomRules(projectPath: string): boolean
```

Checks if project has custom `skill-rules.yaml`.

---

### clearRulesCache

```typescript
function clearRulesCache(): void
```

Clears cached rules. Call after modifying `skill-rules.yaml` at runtime.

---

### clearAllCaches

```typescript
function clearAllCaches(): void
```

Clears both rules and workflow defaults caches.

---

## Types

### SkillRule

```typescript
interface SkillRule {
  readonly keywords: RegExp;
  readonly skills: readonly string[];
  readonly stages?: readonly StageName[];
  readonly workflows?: readonly WorkflowName[];
}
```

### WorkflowConfig

```typescript
interface WorkflowConfig {
  readonly always: readonly string[];
  readonly phases: Readonly<Record<string, readonly string[]>>;
}
```

### StageName

```typescript
type StageName = 'plan' | 'build' | 'refactor' | 'test' | 'review' | 'doc';
```

### WorkflowName

```typescript
type WorkflowName =
  | 'implement'
  | 'plan'
  | 'review-hard'
  | 'structure-first'
  | 'build-from-plan'
  | 'refactor-clean'
  | 'test';
```
