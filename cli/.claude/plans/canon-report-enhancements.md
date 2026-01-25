# Plan: Enhance Canon Report with Auto-Open and Directory Hierarchies

## Goals

1. **Auto-open report** - Automatically open the HTML report when ralph completes
2. **Rich directory hierarchies** - Show skills organized by their actual canon directory structure
3. **CRITICAL: Always-Active Base Practices Tracking** - Ensure all 15 mandatory masters are tracked and displayed prominently

## Current State

The canon report (`cli/src/tools/index.ts` RALPH_SCRIPT and CANON_REPORT_SCRIPT):
- Generates `.claude/canon-masters.json` with flat skill list
- Generates `.claude/canon-report.html` with D3 force graph
- Prints "Open the report: open $CANON_REPORT" but doesn't auto-open
- Skills shown as flat list with domain badges, no hierarchy

## Changes

### 1. Auto-Open Report (Simple)

**File:** `cli/src/tools/index.ts` (RALPH_SCRIPT, around line 811)

Add after "echo -e ... open $CANON_REPORT":
```bash
# Auto-open the report
if command -v open &> /dev/null; then
  open "$CANON_REPORT"
elif command -v xdg-open &> /dev/null; then
  xdg-open "$CANON_REPORT"
fi
```

### 2. Rich Directory Hierarchies

**Approach:** Reflect the actual canon directory structure in the report.

The canon masters are organized as:
```
canon/
├── engineering/
│   ├── kernighan/
│   ├── thompson/
│   ├── pike/
│   ├── joy/
│   ├── dijkstra/
│   └── linus/
├── security/
│   ├── schneier/
│   └── owasp/
├── testing/
│   ├── dodds/
│   ├── meszaros/
│   └── feathers/
├── documentation/
│   └── procida/
├── javascript/
│   ├── simpson/
│   ├── crockford/
│   ├── cherny/
│   └── abramov/
├── python/
│   ├── hettinger/
│   ├── slatkin/
│   └── ramalho/
├── java/
│   └── bloch/
├── csharp/
│   ├── skeet/
│   └── cleary/
├── ui-ux/
│   ├── frost/
│   ├── ive/
│   ├── norman/
│   ├── rams/
│   ├── cooper/
│   ├── wroblewski/
│   ├── duarte/
│   ├── buxton/
│   ├── curtis/
│   └── kruzeniski/
└── business/
    ├── porter/
    ├── rumelt/
    ├── helmer/
    └── horowitz/
```

**JSON Schema Update:**

Change from:
```json
{
  "skills": [
    {"name": "/kernighan", "count": 5, "domain": "engineering"}
  ]
}
```

To hierarchical:
```json
{
  "hierarchy": {
    "baseline": {
      "engineering": ["/kernighan", "/thompson", "/pike", "/joy", "/dijkstra", "/linus"],
      "security": ["/schneier", "/owasp"],
      "testing": ["/dodds", "/meszaros", "/feathers"],
      "documentation": ["/procida"],
      "philosophy": ["/petroski", "/leveson", "/taleb"]
    },
    "domain": {
      "javascript": ["/simpson", "/crockford", "/cherny", "/abramov"],
      "python": ["/hettinger", "/slatkin", "/ramalho"],
      "java": ["/bloch"],
      "csharp": ["/skeet", "/cleary"],
      "ui-ux": ["/frost", "/ive", "/norman", "/rams", "/cooper", "/wroblewski", "/duarte", "/buxton", "/curtis", "/kruzeniski"],
      "business": ["/porter", "/rumelt", "/helmer", "/horowitz"]
    }
  },
  "invocations": [
    {"name": "/kernighan", "count": 5, "category": "baseline", "group": "engineering"}
  ]
}
```

**HTML Report Updates:**

1. Add a **tree view section** showing the hierarchy with:
   - Collapsible folders for each category
   - Skills as leaves with invocation counts
   - Color-coded by baseline vs domain

2. Update the **D3 visualization** to:
   - Use hierarchical layout (tree or sunburst) instead of force graph
   - OR keep force graph but cluster nodes by hierarchy
   - Show baseline skills in center, domain skills in orbit

3. Add **coverage indicator**:
   - Show which baseline skills were invoked (should be all 15)
   - Highlight missing baseline invocations as warnings

### 3. Implementation Files

| File | Changes |
|------|---------|
| `cli/src/tools/index.ts` | Update RALPH_SCRIPT and CANON_REPORT_SCRIPT |

### 4. Verification

1. Run ralph on a test PRD
2. Verify report auto-opens
3. Verify hierarchy is displayed correctly
4. Verify D3 visualization shows tree/cluster structure
5. Verify baseline coverage is shown

## CRITICAL: Always-Active Base Practices

The 15 mandatory masters that MUST be tracked:

```
BASELINE BRAIN (6):
1. /kernighan - Clarity
2. /thompson - Pragmatism
3. /pike - Composition
4. /joy - Resilience
5. /linus - Taste
6. /dijkstra - Rigor

BASE PRACTICES - Security (2):
7. /schneier - Attack thinking
8. /owasp - Top 10

BASE PRACTICES - Testing (3):
9. /dodds - Testing Trophy
10. /meszaros - xUnit patterns
11. /feathers - Legacy code

BASE PRACTICES - Documentation (1):
12. /procida - Diátaxis

BASE PRACTICES - Engineering (3):
13. /petroski - Failure learning
14. /leveson - Safety
15. /taleb - Antifragility
```

### Report Must Show:
1. **Coverage card** - "15/15 Base Masters Invoked" or "12/15 - MISSING: /joy, /leveson, /taleb"
2. **Visual indicator** - Green checkmarks for invoked, red X for missing
3. **Separate section** - "Always Active" distinct from "Domain Masters"

## Recommendation

Start with Phase 1 (auto-open) as it's simple, then implement Phase 2 (hierarchies) which requires more HTML/CSS/D3 work.
