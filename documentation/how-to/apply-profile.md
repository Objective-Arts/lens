---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# How to Apply a Profile

## Prerequisites

- lens CLI installed (see [Installation](../reference/installation.md))
- A project directory

## Steps

### 1. Preview the profile

See what a profile includes before applying:

```bash
lens profile show javascript+react
```

Output shows canon stack, standards, and auto-invoke rules.

### 2. Apply the profile

Apply to your project:

```bash
lens profile apply javascript+react -p /path/to/project
```

Or from within the project:

```bash
lens profile apply javascript+react -p .
```

### 3. Verify the configuration

Check that files were created:

```bash
ls -la .claude/
```

You should see:
- `CLAUDE.md` - Standards and rules
- `settings.json` - Profile configuration
- `skills/` - Symlinked canon skills

### 4. Test with Claude

Open Claude and check status:

```bash
claude
> /status
```

## Common Profile Stacks

### Frontend with UI/UX Experts

For projects with user interfaces, add the `frontend` profile to get 12 UI/UX experts:

```bash
lens profile apply java+frontend -p .
# or
lens profile apply javascript+react+frontend -p .
```

This adds skills for:
- Visual design (design, visual)
- Interaction (usability, personas, interaction)
- Typography (typography)
- Motion (motion)
- Components (components, mobile)
- Governance (tokens, handoff)
- Data visualization (charts)

## Dry Run Mode

Preview changes without applying:

```bash
lens profile apply javascript+react --dry-run -p .
```

## Overwriting Existing Configuration

By default, existing files are preserved. To overwrite:

```bash
lens profile apply javascript+react --force -p .
```

## Troubleshooting

### "Profile not found"

Check available profiles:

```bash
lens profile list
```

### "Permission denied"

Ensure write access to the project directory.

### "CLAUDE.md already exists"

Use `--force` to overwrite, or manually merge the configurations.
