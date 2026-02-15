# /charts Summary

> "Every drop of ink should have a reason." - Edward Tufte

## Core Principles

| Principle | Rule |
|-----------|------|
| **Data-ink ratio** | Maximize data per pixel, remove everything else |
| **Lie factor** | Visual size must match data size (0.95-1.05) |
| **Chartjunk** | Eliminate decoration that doesn't communicate |
| **Direct labeling** | Labels at the data, not in legends |
| **Small multiples** | Same scales, same structure, easy scanning |

## Must Fix (Critical)

- Bar chart Y-axis not starting at zero (exaggerates differences)
- 3D effects distorting proportions
- Inconsistent scales across comparisons
- Missing axis labels or units

## Should Fix

- Heavy gridlines (lighten to #e5e5e5, 0.5px or remove)
- Legend instead of direct labels
- Unnecessary color variation
- Redundant encodings (color AND shape AND label for same thing)

## Quick Rules

```
GRIDLINES:  #e0e0e0, 0.5px max. Or remove entirely.
COLORS:     Only when encoding data. Gray for de-emphasis.
BAR CHARTS: Always start at zero.
LINE CHARTS: Can truncate if clearly labeled.
LEGENDS:    Avoid. Label data directly.
3D:         Never.
```

## Lie Factor Check

```
Lie Factor = (Size of effect in graphic) / (Size of effect in data)

2x data change should = 2x visual change
Area/volume encodings are dangerous (2x radius = 4x area!)
```

## Load Full Skill When

- Building dashboards
- Reviewing existing visualizations
- Presenting data to stakeholders
- When a chart "feels cluttered"

## Concrete Checks (MUST ANSWER)

- Does every bar chart Y-axis start at zero, or is a non-zero baseline explicitly justified with a visible axis break?
- Is the lie factor between 0.95 and 1.05 for every visual encoding (calculate: visual size change / data size change)?
- Are there zero 3D effects, drop shadows, or gradient fills on data-encoding elements?
- Can you remove any gridline, border, or label without losing information? If yes, remove it.
- Is every color encoding data (not decoration), with non-data elements in gray?
