# Profile Format Reference

YAML specification for composable profiles.

---

## Basic Structure

```yaml
name: my-profile
description: "What this profile does"
projectType: software  # or 'business'
extends: base-profile  # Optional inheritance

skills:
  security:
    - owasp
    - schneier
  tech:
    - ceremony
  canon:
    - kernighan
    - pike
  global:
    - productivity

agents:
  - code-reviewer

commands:
  - commit

claudeMd:
  standards:
    - "Use const by default"
    - "Prefer async/await"
  antiPatterns:
    - "Avoid var declarations"
  autoInvoke:
    - context: "Writing tests"
      action: "INVOKE /meszaros"

mcpServers:
  enable:
    - sequential-thinking
  disable:
    - legacy-server
  categories:
    - reasoning

hooks:
  PostToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "npm run format"

ralph:
  skills:
    plan:
      - dijkstra
    build:
      - cherny
  settings:
    maxIterations: 50
```

---

## Fields

### `name`

**Required**. Profile identifier.

```yaml
name: javascript
```

### `description`

Optional description.

```yaml
description: "JavaScript/TypeScript development profile"
```

### `projectType`

Project category. Affects which base skills are loaded.

```yaml
projectType: software  # or 'business'
```

### `extends`

Inherit from another profile. Extended profile's settings are merged, with this profile's values taking precedence.

```yaml
extends: base-tech
```

### `composable`

Whether this profile can be combined with others using `+`.

```yaml
composable: true
```

---

## Skills Section

Skills are organized by category:

```yaml
skills:
  security:    # Security-focused skills
    - owasp
    - schneier
  tech:        # Technical workflow skills
    - ceremony
  canon:       # Expert knowledge skills
    - kernighan
    - bloch
  global:      # Cross-cutting skills
    - productivity
```

---

## CLAUDE.md Section

Content for the generated CLAUDE.md:

```yaml
claudeMd:
  standards:
    - "Use const by default, let when reassignment needed"
    - "Prefer arrow functions for callbacks"
  antiPatterns:
    - "Avoid var declarations"
    - "No implicit type coercion"
  autoInvoke:
    - context: "Writing React components"
      action: "INVOKE /abramov then /frost"
    - context: "Security-sensitive code"
      action: "INVOKE /schneier then /owasp"
```

---

## MCP Servers Section

```yaml
mcpServers:
  enable:
    - sequential-thinking
    - memory
  disable:
    - deprecated-server
  categories:
    - reasoning
    - productivity
  config:
    sequential-thinking:
      maxSteps: 10
  requireAll: false  # Don't fail if server unavailable
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `enable` | string[] | Servers to enable |
| `disable` | string[] | Servers to disable |
| `categories` | string[] | Enable all in category |
| `config` | object | Server-specific config |
| `requireAll` | boolean | Fail if any unavailable |

---

## Hooks Section

Install hooks in project settings.json:

```yaml
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: prompt
          prompt: "Verify this command is safe"
  PostToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "npm run lint:fix"
  UserPromptSubmit:
    - hooks:
        - type: command
          command: "echo 'Processing...'"
```

### Hook Events

| Event | When |
|-------|------|
| `PreToolUse` | Before a tool runs |
| `PostToolUse` | After a tool runs |
| `UserPromptSubmit` | When user submits prompt |
| `Notification` | On notifications |

### Hook Types

| Type | Description |
|------|-------------|
| `command` | Run a shell command |
| `prompt` | Show a prompt/warning |

---

## Ralph Section

Configure the ralph autonomous loop:

```yaml
ralph:
  skills:
    plan:
      - dijkstra
      - liskov
    build:
      - cherny
      - crockford
    refactor:
      - fowler-refactoring
    test:
      - meszaros
      - dodds
    review:
      - schneier
    doc:
      - procida

  settings:
    maxIterations: 50
    maxIterationsPerItem: 10
    exitOnIdleCommits: 3

  quality_gates:
    tests_required: true
    test_level: unit
    review_required: true
    review_mode: self
    review_threshold: no_critical

  post_loop_validation:
    enabled: true
    gemini: true
    qodana: true
    action: report

  exit_criteria:
    prd_items_complete: all
    tests_passing: required
    review_issues_critical: 0
```

---

## Profile Locations

Profiles are loaded from:

1. User profiles: `~/.claude/profiles/`
2. Built-in profiles: `~/local-tech-projects/claude-optimal/profiles/`

---

## Combining Profiles

Use `+` to combine:

```bash
cc-config profile apply javascript+react+security -p .
```

Profiles merge in order:
- Later skills add to earlier
- Later settings override earlier
- All auto-invoke rules are combined
