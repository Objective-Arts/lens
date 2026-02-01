# How to Apply Profiles

Configure a project with one or more profiles.

---

## Apply a Single Profile

```bash
cc-config profile apply <profile> -p <path>
```

**Example**:
```bash
cc-config profile apply javascript -p .
cc-config profile apply python -p ./my-python-app
```

---

## Combine Multiple Profiles

Use `+` to merge profiles:

```bash
cc-config profile apply javascript+react -p .
cc-config profile apply python+security -p .
```

Profiles merge in order. Later profiles add to (don't replace) earlier ones.

---

## Preview Before Applying

See what would be installed without making changes:

```bash
cc-config profile apply javascript+react --dry-run -p .
```

---

## List Available Profiles

```bash
cc-config profile list
```

---

## Show Profile Details

See what a profile contains:

```bash
cc-config profile show javascript
cc-config profile show javascript+react  # Preview combined
```

---

## What Gets Created

Applying a profile creates:

```
project/
├── .claude/
│   ├── skills/              # Copied skill files
│   ├── canon-manifest.json  # Tracks skill versions
│   └── settings.json        # Claude Code settings
└── CLAUDE.md                # Standards and auto-invoke rules
```

---

## Override Existing Configuration

By default, apply won't overwrite existing files. To force:

```bash
cc-config profile apply javascript --force -p .
```

---

## Troubleshooting

**Profile not found**:
```bash
cc-config profile list  # Check available names
```

**Skills not installing**:
```bash
cc-config canon source  # Check source path exists
```
