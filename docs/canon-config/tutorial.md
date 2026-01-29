# Tutorial: Configure Canon Skills for Your Project

Follow these steps to set up profiles and skill detection for a JavaScript project.

## What You'll Learn

- How to apply a profile to your project
- How skill detection works automatically
- How to customize detection rules
- How to run Ralph with your configuration

## Prerequisites

- A JavaScript/TypeScript project
- `cc-config` CLI installed
- Basic understanding of the command line

---

## Step 1: Apply a Profile

Navigate to your project directory and apply the JavaScript profile:

```bash
cd your-project
cc-config profile apply javascript+ralph-integration -p .
```

You'll see output like:

```
Applied profile: javascript+ralph-integration
Created: .claude/CLAUDE.md
```

---

## Step 2: Verify the Configuration

Open `.claude/CLAUDE.md` to see what was generated:

```bash
cat .claude/CLAUDE.md
```

You'll see:
- Standards from the JavaScript profile
- Anti-patterns to avoid
- Auto-invoke rules for canon experts

---

## Step 3: Create a PRD

Create a simple PRD file with one item:

```bash
cat > PRD.md << 'EOF'
# Project Requirements

- [ ] Add user authentication with JWT tokens
EOF
```

---

## Step 4: Run Ralph

Start the Ralph loop:

```bash
/ralph-loop PRD.md
```

Watch the output. Because your PRD mentions "authentication" and "JWT", the security detection rules automatically add:
- `schneier` - Security mindset
- `owasp` - Web security patterns
- `security-mindset` - Threat modeling

These are added to the JavaScript profile's base skills.

---

## Step 5: See Detection in Action

The stage header shows which skills were detected:

```
[PLAN] Item 1: Add user authentication with JWT tokens
       Skills: kyle-simpson, cherny, schneier, owasp, security-mindset
       Detected: auth, jwt → security
```

- `kyle-simpson`, `cherny` - From JavaScript profile
- `schneier`, `owasp`, `security-mindset` - Detected from task keywords

---

## Step 6: Add a Custom Rule

Open the skill rules file:

```bash
code canon/skill-rules.yaml
```

Add a rule for your domain at the end of the `rules:` section:

```yaml
  my-domain:
    patterns:
      - widget
      - gadget
    skills:
      - my-expert
    stages: [plan, build]
    workflows: [implement]
```

Save the file. Now any PRD item mentioning "widget" or "gadget" will add `my-expert`.

---

## Step 7: Test Your Rule

Add a new PRD item:

```bash
cat >> PRD.md << 'EOF'
- [ ] Create a widget dashboard
EOF
```

Run Ralph again:

```bash
/ralph-loop PRD.md --resume
```

Your custom rule triggers for the new item.

---

## What You've Accomplished

- Applied a profile that sets up JavaScript canon experts
- Ran Ralph with automatic skill detection
- Saw security experts added because the task mentioned "auth" and "jwt"
- Added a custom detection rule for your domain

## Next Steps

- [How-To: Combine Multiple Profiles](how-to.md#combine-profiles)
- [How-To: Create a New Profile](how-to.md#create-profile)
- [Reference: skill-rules.yaml Format](reference.md#skill-rules-yaml)
