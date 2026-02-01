# How to Audit Configuration

Scan, analyze, and troubleshoot Claude Code configuration.

---

## Full Scan

Discover all configuration in a project:

```bash
cc-config scan -p .
```

Shows:
- Items by type (skills, commands, agents)
- Items by scope (global, project)
- Total token count
- Conflicts and missing references

---

## Run Audit

Check for issues and recommendations:

```bash
cc-config audit -p .
```

Checks:
- Base canon completeness
- Security skills presence
- Quality flag documentation
- Conflicts between scopes
- Missing references

---

## Token Usage

See token breakdown:

```bash
cc-config tokens -p .
```

Shows:
- Total tokens
- Tokens by scope
- Tokens by type
- Top items by size

---

## List Items

List all configuration items:

```bash
cc-config list -p .
```

Filter by type:
```bash
cc-config list skill -p .
cc-config list command -p .
cc-config list agent -p .
```

Filter by scope:
```bash
cc-config list -p . -s project
cc-config list -p . -s global
```

Sort by token count:
```bash
cc-config list -p . --tokens
```

---

## Show Item Details

View a specific item:

```bash
cc-config show <name> -p .
cc-config show kernighan -p .
```

Shows:
- Type and scope
- File path
- Token count
- Dependencies
- Referenced by

---

## Dependency Graph

See how items reference each other:

```bash
cc-config deps -p .
```

---

## Skip Plugin Scanning

If plugin scanning is slow:

```bash
cc-config scan -p . --no-plugins
```

---

## Common Issues

**High token count**:
```bash
cc-config tokens -p .         # Find large items
cc-config list -p . --tokens  # Sort by size
```
Consider removing unused skills.

**Conflicts detected**:
Same name exists in multiple scopes. Project scope wins, but review if intentional:
```bash
cc-config show <conflicting-name> -p .
```

**Missing references**:
CLAUDE.md references a skill that doesn't exist:
```bash
cc-config canon list          # Check available
cc-config canon install <skill> -p .
```

**Unused items**:
Skills that nothing references. Safe to remove if not needed:
```bash
cc-config show <unused-name> -p .
rm -rf .claude/skills/<unused-name>
```
