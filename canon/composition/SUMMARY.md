# /mcilroy Summary

> "Write programs that do one thing well. Write programs to work together."

## The Unix Philosophy

| Rule | Meaning |
|------|---------|
| **Do one thing well** | Not two things. Not "one thing plus related things." One thing |
| **Work together** | Output of one becomes input of another |
| **Text streams** | Universal interface. Human-readable, tool-friendly, future-proof |
| **Silence is golden** | No news is good news. Only speak on error or when asked |
| **Fail fast and loud** | Exit immediately on error. Non-zero exit codes |

## The Knuth Critique

**Problem:** Find N most common words in a file.

**Knuth:** 10+ pages of literate Pascal with custom data structures.

**McIlroy:**
```bash
tr -cs A-Za-z '\n' | tr A-Z a-z | sort | uniq -c | sort -rn | sed ${1}q
```

Six lines. Uses existing tools.

## Design Principles

```bash
# BAD: Monolithic tool
supertool --compress --encrypt --upload --notify file.txt

# GOOD: Composition
gzip file.txt | gpg -e | aws s3 cp - s3://bucket/file.gz.gpg
```

## Interface Requirements

- **Filter pattern**: Read stdin, write stdout
- **Standard flags**: `-h` help, `-v` verbose, `-q` quiet, `-o` output
- **Sensible defaults**: Work without configuration
- **Clean exit codes**: 0 success, non-zero failure
- **No required interactivity**: Must be scriptable

## Silence Pattern

```bash
# BAD
$ cp file.txt backup/
Copying file.txt to backup/...
Success!

# GOOD
$ cp file.txt backup/
$
```

## The McIlroy Test

1. Does it do one thing? (describe without "and")
2. Can I pipe output to another tool?
3. Does it use text, not binary?
4. Is it silent on success?
5. Does it fail loudly with non-zero exit?
6. Could existing tools do this?
7. Does it follow standard conventions?

## When to Use

- Building CLI tools and utilities
- Designing filters and pipelines
- Creating composable commands
