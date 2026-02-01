# How to Manage Skills

Install, upgrade, and check the status of canon skills.

---

## Check Skill Status

See which skills are installed and whether they're current:

```bash
cc-config canon status -p .
```

**Status indicators**:
| Icon | Meaning |
|------|---------|
| ✓ current | Matches source |
| ⚠ outdated | Source has updates |
| ✎ modified | You changed it locally |
| ✗ missing | Source not found |

---

## Install a Skill

```bash
cc-config canon install <skill> -p .
```

**Example**:
```bash
cc-config canon install bloch -p .
cc-config canon install kernighan -p .
```

Force overwrite if it exists:
```bash
cc-config canon install bloch --force -p .
```

---

## Install All Canon Skills

Deploy every available skill:

```bash
cc-config canon deploy -p .
cc-config canon deploy --force -p .  # Overwrite existing
```

---

## Upgrade Outdated Skills

Update skills that have newer versions in the source:

```bash
cc-config canon upgrade -p .
```

This skips locally modified skills. To overwrite local changes:

```bash
cc-config canon upgrade --force -p .
```

Upgrade specific skills only:

```bash
cc-config canon upgrade -s bloch,kernighan -p .
```

---

## View Skill Differences

See what changed between your installed version and source:

```bash
cc-config canon diff <skill> -p .
cc-config canon diff bloch -p .
```

---

## List Available Skills

```bash
cc-config canon list
cc-config canon list --category javascript
```

---

## Check Skill Source

See where skills are sourced from:

```bash
cc-config canon source
```

---

## Workflow Skills

Workflow skills (ralph-loop, implement, test, etc.) are managed separately:

```bash
cc-config workflow list
cc-config workflow install --all -p .
cc-config workflow status -p .
cc-config workflow upgrade -p .
```

---

## Troubleshooting

**Skill not found**:
```bash
cc-config canon list              # Check available skills
cc-config canon source            # Verify source path
```

**Can't upgrade modified skill**:
```bash
cc-config canon diff <skill> -p . # See your changes
cc-config canon upgrade --force   # Overwrite (loses changes)
```

**Skills show outdated after install**:
```bash
cc-config canon upgrade -p .      # Sync with source
```
