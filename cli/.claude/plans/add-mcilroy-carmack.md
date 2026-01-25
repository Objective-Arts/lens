# Plan: Add McIlroy and Carmack to Base Practices

## Why Include Them

**Doug McIlroy** - Unix Philosophy Father
- "Do one thing and do it well"
- Pipes and composition
- Software tools approach
- Complements Pike's composition focus

**John Carmack** - Performance Engineering
- Optimization without premature optimization
- Ship working software
- Pragmatic engineering decisions
- Complements Joy's resilience focus

## Proposed Addition

Add to **Base Practices - Engineering** (currently: petroski, leveson, taleb)

New structure:
```
BASE PRACTICES - Engineering (5 masters):
13. /petroski - Form follows failure
14. /leveson - STAMP safety constraints
15. /taleb - Antifragility, via negativa
16. /mcilroy - Do one thing well, composition
17. /carmack - Performance, pragmatic shipping
```

This increases base masters from 15 to 17.

## Files to Modify

1. **`cli/src/tools/index.ts`** - RALPH_PROMPT STEP 1 section
2. **`cli/src/tools/index.ts`** - Canon report BASE_ENGINEERING variable
3. **`cli/src/tools/index.ts`** - JSON hierarchy in report generation
4. **`cli/src/tools/index.ts`** - HTML baseMasters.required array

## Changes

### 1. STEP 1: INVOKE SKILLS - Add to base practices

```
**Base Practices - Engineering (5 masters):**
13. /petroski - Form follows failure
14. /leveson - STAMP safety constraints
15. /taleb - Antifragility, via negativa
16. /mcilroy - Do one thing well, Unix pipes
17. /carmack - Performance, ship it
```

### 2. Canon Report Generation - Update BASE_ENGINEERING

FROM:
```bash
BASE_ENGINEERING="petroski leveson taleb"
```

TO:
```bash
BASE_ENGINEERING="petroski leveson taleb mcilroy carmack"
```

### 3. JSON hierarchy - Update engineering array

FROM:
```bash
echo '      "engineering": ["petroski","leveson","taleb"]' >> "$CANON_LOG"
```

TO:
```bash
echo '      "engineering": ["petroski","leveson","taleb","mcilroy","carmack"]' >> "$CANON_LOG"
```

### 4. Required array - Update count

FROM:
```bash
echo '    "required": ["kernighan","thompson","pike","joy","linus","dijkstra","schneier","owasp","dodds","meszaros","feathers","procida","petroski","leveson","taleb"],' >> "$CANON_LOG"
```

TO:
```bash
echo '    "required": ["kernighan","thompson","pike","joy","linus","dijkstra","schneier","owasp","dodds","meszaros","feathers","procida","petroski","leveson","taleb","mcilroy","carmack"],' >> "$CANON_LOG"
```

### 5. Update total count

FROM: `"total": 15`
TO: `"total": 17`

### 6. Update BLOCKING message

FROM: `⚠️ BLOCKING: You MUST invoke ALL 15 base masters`
TO: `⚠️ BLOCKING: You MUST invoke ALL 17 base masters`

## Verification

1. Rebuild CLI
2. Reinstall ralph
3. Check that mcilroy and carmack appear in:
   - STEP 1 base practices list
   - Canon report tracking (17 required)
   - HTML hierarchy grid
