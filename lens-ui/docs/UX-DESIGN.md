# Lens UI — UX Design Document

## The Core Question

> What does a developer do when they open Lens?

Everything in this document answers that question. If a feature doesn't serve it, it doesn't ship.

---

## 1. The Core Use Case

**One sentence:** A developer points Lens at their code and immediately sees what's wrong and how to fix it.

That's it. Not "manages a portfolio of projects." Not "configures a quality pipeline." Not "browses a library of canons." Those are features that may exist later. The core use case is: **scan → see → fix.**

### What "immediately" means

- Zero configuration on first use
- Results visible within seconds (scan) or minutes (full pipeline)
- No jargon without explanation
- No screen that doesn't answer "what should I do next?"

---

## 2. User Journey

### 2.1 Installation

```
npm install -g @lens/cli
```

That's the entire installation. No account creation, no API keys, no config files, no `.lens/` directory to set up manually. The CLI is the entry point. The web UI is a viewer — it comes bundled or launches on demand.

### 2.2 First Run

```
cd my-project
lens scan
```

**Terminal output (concise, not a wall of text):**

```
Lens — scanning my-project...

  Score:  72/100  ⚠️  Needs attention

  3 critical · 5 high · 12 medium

  Top findings:
  1. SQL injection risk in auth/login.ts:47        critical
  2. Missing error boundary in App.tsx              high
  3. SELECT * in reports/quarterly.ts:112           high

  Full results → lens open
```

**Key design decisions:**
- Score is the headline. One number. Immediately meaningful.
- Severity counts give shape without detail.
- Top 3 findings are actionable — file, line, what's wrong.
- `lens open` is the bridge to the web UI. Not automatic. User chooses.

### 2.3 Opening the Web UI

```
lens open
```

Launches `http://localhost:3000` in the default browser. Shows the results of the scan that just ran.

**What the user sees (single project view — not a dashboard):**

```
┌─────────────────────────────────────────────────────┐
│  my-project                              72/100  ⚠️  │
│                                                       │
│  ┌─────────┐  ┌─────────────────────────────────┐    │
│  │         │  │  Findings (20)                   │    │
│  │  Score  │  │                                   │    │
│  │  Ring   │  │  🔴 3 critical                    │    │
│  │   72    │  │  🟠 5 high                        │    │
│  │         │  │  🟡 12 medium                     │    │
│  └─────────┘  │                                   │    │
│               │  [View all findings]              │    │
│  [Fix All]    └─────────────────────────────────┘    │
│                                                       │
│  Quality Dimensions                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━           │
│  Security      ██████░░░░  58%                       │
│  Correctness   ████████░░  82%                       │
│  Simplicity    ███████░░░  74%                       │
│  Performance   █████████░  90%                       │
│  Clarity       ██████░░░░  65%                       │
│  Resilience    ███████░░░  71%                       │
│  Maintainability ████████░  80%                      │
└─────────────────────────────────────────────────────┘
```

**What's NOT on this screen:**
- No sidebar with 5 navigation items
- No "Projects" list (there's one project — the one you just scanned)
- No PRD library
- No pipeline phase viewer
- No settings

**Why:** The user ran `lens scan` in one project. They care about one project. Show them that project. Everything else is noise.

### 2.4 Viewing Findings

Clicking "View all findings" or any severity count expands to a findings list:

```
┌─────────────────────────────────────────────────────┐
│  ← Back to overview          my-project  72/100     │
│                                                      │
│  Findings  [All] [Critical] [High] [Medium] [Low]   │
│                                                      │
│  🔴 SQL injection risk                               │
│     auth/login.ts:47                                 │
│     Canon: security-mindset                          │
│     > User input concatenated into SQL query.        │
│     > Use parameterized queries instead.             │
│     [Show code] [Fix this]                           │
│                                                      │
│  🔴 Unvalidated redirect                             │
│     routes/callback.ts:23                            │
│     Canon: security-mindset                          │
│     > Redirect URL from query parameter without      │
│       validation enables open redirect attacks.      │
│     [Show code] [Fix this]                           │
│                                                      │
│  ...                                                 │
└─────────────────────────────────────────────────────┘
```

**Each finding shows:**
- Severity (color-coded)
- What's wrong (plain English, one line)
- Where (file:line)
- Which canon flagged it
- How to fix it (one line)
- Actions: Show code context, Fix this

### 2.5 Fixing

"Fix this" on a single finding → runs `lens fix` scoped to that finding.
"Fix All" on the overview → runs `lens fix` on the whole project.

In both cases, the terminal handles the actual work. The UI shows progress:

```
┌─────────────────────────────────────────────────────┐
│  Fixing my-project...                                │
│                                                      │
│  ✅ SQL injection in auth/login.ts         fixed     │
│  ✅ Unvalidated redirect in routes/...     fixed     │
│  ⏳ Missing error boundary in App.tsx      fixing... │
│  ○  SELECT * in reports/quarterly.ts       queued    │
│  ○  Empty catch block in utils/api.ts      queued    │
│                                                      │
│  Progress: 2/20 findings fixed                       │
└─────────────────────────────────────────────────────┘
```

After fixing completes, the UI automatically re-scans and shows the updated score.

---

## 3. Screen Inventory (Minimal Viable UI)

For v1, there are exactly **4 screens:**

| Screen | URL | Purpose |
|--------|-----|---------|
| Project Overview | `/` | Score, dimensions, finding summary, actions |
| Findings | `/findings` | Filterable list of all findings with detail |
| Fix Progress | `/fixing` | Live progress of fix operations |
| History | `/history` | Past scans with score trend over time |

That's it. No projects list (single project mode). No PRD section. No settings page. No pipeline viewer.

### When multi-project comes in (v2)

If a user has scanned multiple projects, `/` becomes a project picker:

```
┌─────────────────────────────────────────────────────┐
│  Lens                                                │
│                                                      │
│  Your Projects                                       │
│                                                      │
│  my-api          84/100  ✅   Last scan: 2 hours ago │
│  my-frontend     72/100  ⚠️   Last scan: yesterday   │
│  shared-lib      91/100  ✅   Last scan: 3 days ago  │
│                                                      │
│  [Scan a new project]                                │
└─────────────────────────────────────────────────────┘
```

Clicking a project takes you to the same single-project view. Simple.

---

## 4. Design Principles

### 4.1 Terminal First, UI Second
The CLI is the primary interface. The web UI exists for visual understanding and drill-down — not for running commands. A developer who never opens the UI should still get full value from Lens.

### 4.2 One Project, One Screen
When you open Lens, you see YOUR project. Not a dashboard. Not a portfolio. Your code, your score, your findings. Multi-project is a later concern.

### 4.3 Score → Findings → Fix
Every screen answers one of three questions:
1. **How healthy is my code?** (Score)
2. **What's wrong?** (Findings)
3. **How do I fix it?** (Fix action)

If a UI element doesn't serve one of these, it doesn't belong.

### 4.4 Progressive Disclosure
- Overview shows score + severity counts (3 seconds to understand)
- Findings list shows what + where + why (30 seconds to scan)
- Finding detail shows code context + fix suggestion (2 minutes to act)
- History shows trend over time (for later, when you care about progress)

### 4.5 No Configuration Required
- First scan works without any setup
- Canons are built-in (not something you "install")
- Pipeline depth is automatic (quick scan for first run, full pipeline available)
- Settings exist but are never required

---

## 5. What Gets Deferred

These are real features that DO NOT belong in v1:

| Feature | Why not v1 |
|---------|-----------|
| PRD library | Separate workflow, separate audience |
| Pipeline phase viewer | Implementation detail, not user need |
| Canon browser | Reference material, not core flow |
| Build/Improve launcher | Advanced actions — scan/fix is the entry |
| Team features | Single developer first |
| CI/CD integration | Requires the CLI to be solid first |
| Custom rules | Power user feature |
| Settings page | Nothing to configure in v1 |

---

## 6. Data Flow

```
Developer's terminal          Lens Engine           .lens/ directory         Web UI
      │                           │                       │                    │
      │  lens scan                │                       │                    │
      ├──────────────────────────►│                       │                    │
      │                           │  analyze code         │                    │
      │                           │──────────────►        │                    │
      │                           │               write   │                    │
      │                           │  project.json ───────►│                    │
      │                           │  run-{ts}.json ──────►│                    │
      │  terminal summary         │                       │                    │
      │◄──────────────────────────│                       │                    │
      │                           │                       │                    │
      │  lens open                │                       │                    │
      ├──────────────────────────►│                       │                    │
      │                           │  start server ────────┼───────────────────►│
      │                           │                       │   read .lens/      │
      │                           │                       │◄───────────────────│
      │                           │                       │   render           │
      │                           │                       │──────────────────►│
```

The `.lens/` directory is the contract between CLI and UI:
- `project.json` — project metadata (name, language, framework, path)
- `runs/` — one JSON file per scan/fix run
- Each run file contains: timestamp, mode, score, dimensions, findings, verdict

The web UI reads these files. It never writes to them. It never talks to the CLI directly. This is a deliberate separation — the UI is a viewer.

---

## 7. Visual Design Direction

### Aesthetic
- Dark background (`#09090b`) — this is a developer tool, not a SaaS dashboard
- Monospace for code, system sans-serif for UI
- Color only for meaning (severity, score ranges) — not decoration
- Generous whitespace — findings need room to breathe

### Score Color Scale
| Range | Color | Meaning |
|-------|-------|---------|
| 90-100 | Green (`#22c55e`) | Production-ready |
| 70-89 | Yellow (`#eab308`) | Needs attention |
| 50-69 | Orange (`#f97316`) | Needs work |
| 0-49 | Red (`#ef4444`) | Needs rework |

### Severity Colors
| Level | Color | Badge |
|-------|-------|-------|
| Critical | Red (`#ef4444`) | Filled |
| High | Orange (`#f97316`) | Filled |
| Medium | Yellow (`#eab308`) | Outlined |
| Low | Zinc (`#a1a1aa`) | Outlined |

---

## 8. Empty States

Every screen needs a zero-data state that tells the user what to do:

**No scans yet (fresh install):**
```
┌─────────────────────────────────────────────────────┐
│                                                      │
│           Welcome to Lens                            │
│                                                      │
│     Run your first scan:                             │
│                                                      │
│     $ cd your-project                                │
│     $ lens scan                                      │
│                                                      │
│     Then come back here to explore the results.      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**No findings (perfect score):**
```
┌─────────────────────────────────────────────────────┐
│  my-project                             100/100  ✅  │
│                                                      │
│           No findings. Your code is clean.           │
│                                                      │
│           Last scanned: 2 minutes ago                │
│           [Scan again]                               │
└─────────────────────────────────────────────────────┘
```

---

## 9. Open Questions

1. **Should `lens open` start a persistent server or a one-shot viewer?**
   Persistent server means it can update live when you re-scan from terminal. One-shot is simpler.

2. **How does multi-project discovery work?**
   Does Lens remember every project you've ever scanned? Or do you register projects? The `.lens/` directory per-project model means the UI needs to know where to look.

3. **Should the UI be able to trigger scans/fixes, or only view results?**
   Starting as view-only is simpler and keeps the CLI as the single entry point. But "Fix All" button is very compelling.

4. **What happens during a long-running fix?**
   WebSocket for live progress? Polling the `.lens/` directory? Or just "come back when it's done"?

---

## Summary

The entire Lens UI experience is three words: **scan, see, fix.**

Everything serves that loop. The terminal is where you act. The UI is where you understand. The `.lens/` directory connects them. No accounts, no configuration, no learning curve.

Build this small. Validate it works. Then expand.
