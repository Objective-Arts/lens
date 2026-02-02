# Tutorial: First Ralph Run

Run ralph to autonomously implement a feature from a PRD. By the end, you'll understand how the 10-phase workflow builds quality in from the start.

**Time**: 15 minutes
**Prerequisites**: Completed [Getting Started](./getting-started.md), project with profile applied

---

## Step 1: Create a PRD File

A PRD (Product Requirements Document) is a markdown file with checkbox items. Create one:

```bash
cat > PRD.md << 'EOF'
# My Feature PRD

- [ ] Create a utility function that validates email addresses
- [ ] Add unit tests for the email validator
EOF
```

Each `- [ ]` item is a task ralph will implement.

---

## Step 2: Create Ralph Configuration

Ralph needs a config file. Create `.claude/ralph-config.yaml`:

```bash
mkdir -p .claude
cat > .claude/ralph-config.yaml << 'EOF'
# Ralph configuration
settings:
  maxIterations: 50
  maxIterationsPerItem: 10
EOF
```

---

## Step 3: Run Ralph

Start the autonomous workflow:

```bash
ralph PRD.md
```

Ralph processes each PRD item through 10 phases:

```
1.  plan               → Understand requirements, design approach
2.  structure-first    → Define types and interfaces
3.  implement          → Write the code
4.  refactor-check     → Clean up, simplify
5.  independent-review → Code review via Gemini (bugs, edge cases)
6.  static-analysis    → Code analysis (Qodana)
7.  test               → Write and run tests
8.  doc-code           → Generate documentation
9.  security-review    → Adversarial security review
10. production-readiness → Final production checks
```

---

## Step 4: Watch the Output

Ralph shows progress as it works:

```
📝 Plan          ████████████████████ done
🏗️  Structure    ████████████████████ done
⚙️  Implement    ████████████░░░░░░░░ running...
```

Each phase loads expert skills. You'll see which experts are active:
- `kernighan` — Clarity and simplicity
- `pike` — Do one thing well
- `cherny` — Strict TypeScript

---

## Step 5: Review the Results

When ralph completes an item, it marks it done in the PRD:

```markdown
- [x] Create a utility function that validates email addresses
- [ ] Add unit tests for the email validator
```

Check what was created:

```bash
ls -la src/
cat src/email-validator.ts
```

---

## Step 6: Check the Logs

Ralph creates logs for each phase:

```bash
ls .claude/logs/
```

Each log shows:
- The prompt sent to Claude
- The response received
- Success/failure markers

---

## Step 7: Resume If Interrupted

If ralph stops (timeout, error), resume where you left off:

```bash
ralph PRD.md --resume
```

Ralph picks up from the last incomplete item.

---

## What You've Learned

- How to create a PRD file
- How to configure ralph
- How the 10-phase workflow operates
- How to review results and logs
- How to resume interrupted runs

---

## The Quality Difference

Notice that ralph doesn't just write code and test at the end. It:

1. **Plans first** — Understands requirements before coding
2. **Defines structure** — Types and interfaces before implementation
3. **Reviews during** — Adversarial review catches issues early
4. **Analyzes automatically** — Static analysis finds bugs
5. **Tests after implementing** — Tests verify the implementation
6. **Documents** — Generates docs for what was built

This is Deming's principle: quality built in, not inspected at the end.

---

## Next Steps

- [How to Run Ralph](../how-to/run-ralph.md) — Advanced options and flags
- [The 8 Phases Explained](../explanation/phases.md) — What each phase does
- [Quality Philosophy](../explanation/quality-philosophy.md) — Why this approach works
