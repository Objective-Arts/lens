---
name: charts
description: "Graphical integrity"
---

This skill applies Edward Tufte's principles of graphical excellence to review visualization code. Invoke when creating or reviewing D3, Chart.js, Recharts, or any data visualization implementation.

## Intake

Which Tufte principle needs attention?

1. **Data-ink ratio** - Maximizing data per pixel, removing chartjunk
2. **Lie factor** - Graphical integrity, accurate representation
3. **Small multiples** - Comparative visualization, faceted displays
4. **Direct labeling** - Labels at the data, eliminating legends
5. **Full review** - Comprehensive evaluation against all principles

Share your visualization code or describe your chart, and I'll provide targeted guidance.

## Routing

| Response | Reference File |
|----------|----------------|
| 1, data-ink, chartjunk, gridlines, remove | references/data-ink-ratio.md |
| 2, lie factor, baseline, accuracy, distortion | references/lie-factor.md |
| 3, small multiples, facets, comparison, grid | references/small-multiples.md |
| 4, direct labels, legend, annotation | references/direct-labeling.md |
| 5, review, audit, comprehensive | (use full skill below) |

---

## Core Tufte Principles

### 1. Data-Ink Ratio
Maximize the share of ink devoted to data. Every drop of ink should have a reason.

**Review for:**
- Unnecessary gridlines (remove or lighten significantly)
- Redundant axis lines (often the data itself implies the axis)
- Decorative borders and boxes around charts
- Background colors that don't encode data
- 3D effects that add no information
- Drop shadows on data elements
- Excessive tick marks

**Target:** Can any element be removed without losing information?

### 2. Lie Factor
The size of an effect shown in the graphic should match the size of the effect in the data.

```
Lie Factor = (Size of effect in graphic) / (Size of effect in data)
```

**Review for:**
- Truncated axes that exaggerate differences (not starting at zero for bar charts)
- Area/volume encodings that distort proportions (2x data ≠ 2x visual)
- Inconsistent scales across small multiples
- Perspective distortions (3D pie charts are notorious)
- Manipulated aspect ratios

**Target:** Lie factor should be between 0.95 and 1.05

### 3. Chartjunk
Eliminate non-data elements that clutter and distract.

**Review for:**
- Moiré patterns and vibrating textures
- Heavy gridlines competing with data
- Unnecessary legends (label data directly when possible)
- Decorative illustrations unrelated to data
- Gratuitous color (more than needed to distinguish categories)
- Ornamental axes, borders, backgrounds
- Redundant encoding (color AND shape AND label for same variable)

**Target:** Does every visual element earn its place?

### 4. Data Density
Maximize information per unit area without sacrificing clarity.

**Review for:**
- Wasted whitespace that could show data
- Oversized legends and titles relative to data area
- Charts that could be tables (few data points)
- Tables that could be charts (many data points with patterns)
- Missed opportunities for small multiples

**Target:** Shrink the non-data elements, expand the data

### 5. Integration of Text and Graphics
Labels should be close to data, not segregated in legends.

**Review for:**
- Legends that force eye movement away from data
- Missing direct labels on data points/lines
- Axis labels far from the axis
- Titles that don't inform
- Missing units on axes

**Target:** Can the reader understand without consulting a legend?

### 6. Small Multiples
Use consistent, repeated designs for comparison.

**Review for:**
- Inconsistent scales across panels
- Varying axis ranges that mislead
- Missing shared reference lines
- Unclear panel ordering

**Target:** Same scales, same structure, easy scanning

## Review Checklist

When reviewing visualization code, evaluate:

### Critical Issues (Must Fix)
- [ ] Lie factor > 1.1 or < 0.9
- [ ] Truncated Y-axis on bar chart
- [ ] 3D effects distorting proportions
- [ ] Inconsistent scales in comparisons
- [ ] Missing axis labels or units

### High Priority (Should Fix)
- [ ] Heavy gridlines obscuring data
- [ ] Legend instead of direct labels
- [ ] Unnecessary color variation
- [ ] Redundant encodings
- [ ] Chart type inappropriate for data

### Polish (Consider Fixing)
- [ ] Gridlines could be lighter/removed
- [ ] Borders and boxes around chart
- [ ] Excessive decimal precision
- [ ] Title doesn't add information
- [ ] Aspect ratio not optimized for data

## Code Review Patterns

### D3.js Red Flags
```javascript
// BAD: Heavy gridlines
.style("stroke", "#000")
.style("stroke-width", 2)

// GOOD: Subtle gridlines
.style("stroke", "#e0e0e0")
.style("stroke-width", 0.5)

// BAD: 3D-like effects
.style("filter", "drop-shadow(3px 3px 3px #000)")

// BAD: Redundant legend when direct labels possible
svg.append("g").attr("class", "legend")

// GOOD: Direct labels on data
text.attr("x", d => x(d.x) + 5).text(d => d.label)
```

### Color Guidelines
- Use color only when it encodes data
- Prefer position encoding over color encoding
- Limit to 5-7 distinguishable colors maximum
- Ensure accessibility (colorblind-safe palettes)
- Gray for de-emphasized elements, color for emphasis

### Axis Guidelines
- Bar charts: start at zero
- Line charts: can truncate if clearly labeled
- Log scales: when data spans orders of magnitude
- Remove axis line if gridlines present
- Tick marks: only where needed for reading values

## Output Format

When reviewing, provide:

1. **Tufte Score: X/10** - Overall adherence to principles

2. **Critical Issues** - Must fix before shipping

3. **Recommendations** - Specific code changes with before/after

4. **Data-Ink Analysis** - What can be removed

5. **Positive Notes** - What's working well

## Example Review Output

```
## Tufte Visualization Review

**Score: 6/10**

### Critical Issues
1. Bar chart Y-axis starts at 50, exaggerating differences (Lie Factor ~2.3)
   - Fix: Set domain to [0, max] or clearly mark truncation

### High Priority
2. Legend at bottom forces eye movement
   - Fix: Add direct labels at line endpoints

3. Gridlines too prominent (#999, 1px)
   - Fix: Lighten to #e5e5e5, 0.5px or remove

### Data-Ink Wins
- Good use of direct value labels on bars
- Appropriate chart type for comparison
- Clean typography

### Suggested Code Changes
[specific edits with line numbers]
```

## When to Invoke This Skill

- After writing new visualization code
- When reviewing existing charts for improvement
- Before presenting data to stakeholders
- When a visualization "feels cluttered"
- During code review of dashboard components

Remember: The goal is **clear thinking made visible**. Every element should serve the reader's understanding of the data.