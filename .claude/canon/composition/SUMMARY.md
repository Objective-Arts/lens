# /composition Summary

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

## Concrete Checks (MUST ANSWER)

1. **Build-vs-library audit (CRITICAL):** List every component you are building from scratch (CLI parser, HTTP client, argument validator, file watcher, date formatter, etc.). For each one: does a maintained library with >1000 weekly downloads exist? If yes, use it or write a one-sentence justification why not.
2. **One-thing test:** For each module/function, describe its purpose without using "and." If the description requires "and," it does two things — split it.
3. **Composability check:** Can each module's output be consumed as input by another module without shared mutable state or special setup? If two modules must share global state to communicate, redesign to use explicit data passing.
4. **Scriptability test:** Can every user-facing operation be invoked non-interactively (via flags, stdin, or environment variables)? If any operation requires interactive TTY input with no programmatic alternative, add one.
5. **Monolith detection:** Does any single file contain both I/O handling (HTTP, filesystem, CLI parsing) and business logic (validation, transformation, computation)? If yes, separate them into distinct modules.

## HARD GATES (mandatory before writing code)

- [ ] **Existing tool audit (CRITICAL):** List every component you plan to build. For EACH one, search for an established library:
  - CLI parsing → commander, yargs, cac, clipanion
  - Interactive prompts → prompts, inquirer, enquirer
  - Argument validation → zod, yup, joi
  - File locking → proper-lockfile, lockfile
  - HTTP server → express, fastify, hono
  - Date/time → date-fns, dayjs, temporal
  - **If a library with >1000 weekly downloads exists, use it.** Justify in writing if you choose to hand-roll instead.
- [ ] **Pipe test:** Can each module's output feed another module's input? If modules require shared mutable state to communicate, redesign.
- [ ] **Scriptability:** Can every operation run non-interactively? If the tool requires a TTY, add env var / stdin / flag alternatives.
- [ ] **One-thing test:** Describe each module without "and." If you can't, split it.
