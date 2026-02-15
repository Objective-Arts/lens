# Display Media Selection

Choosing the right visualization for the data and purpose.

## Few's Hierarchy

**Simplest effective display wins.** Don't use a chart when a number suffices.

```
Most Simple                                    Most Complex
    │                                              │
    ▼                                              ▼
Number → Bullet Graph → Sparkline → Bar Chart → Scatter Plot
```

## Decision Framework

### What Are You Showing?

| Data Relationship | Best Display | Avoid |
|-------------------|--------------|-------|
| Single value + target | Bullet graph | Gauge, pie |
| Trend over time | Sparkline, line chart | Bar chart for time |
| Comparison of items | Bar chart | Pie chart, radar |
| Part-to-whole | Stacked bar | Pie chart, donut |
| Distribution | Histogram, strip plot | Pie chart |
| Correlation | Scatter plot | Bubble chart |
| Ranking | Bar chart (sorted) | Unsorted bars |
| Geographic | Choropleth map | 3D globe |

## Display Types in Detail

### Numbers (Text)

**When to use:**
- Current value is the only message
- No comparison needed
- Dashboard is about status, not analysis

```
Revenue: $1.2M
Uptime: 99.2%
Active Users: 45,231
```

**Enhance with:**
- Comparison (vs. target, vs. prior)
- Trend indicator (↑ ↓ →)
- Conditional color (alert if threshold crossed)

### Bullet Graphs

**When to use:**
- Value vs. target
- Performance against goal
- KPI with context

```
Revenue     █████████████████│░░░░░░
Margin      ██████████│░░░░░░░░░░░░░
Satisfaction ████████████████████│░░
```

**Always instead of:** Gauges, meters, dials

### Sparklines

**When to use:**
- Trend direction matters
- Space is constrained
- Multiple metrics to compare

```
Revenue  ─╱╲─╱──  $1.2M
Margin   ──────   23%
Volume   ─╲─╱──  45K
```

**Not for:** Exact value reading, single data point

### Bar Charts

**When to use:**
- Comparing values across categories
- Ranking items
- Showing magnitude differences

```
Product A  ████████████████████
Product B  ██████████████
Product C  ████████████
Product D  ████████
```

**Variations:**
- Horizontal (easier to label, better for many items)
- Grouped (comparing multiple measures)
- Stacked (part-to-whole)

### Line Charts

**When to use:**
- Continuous data over time
- Showing trends and patterns
- Multiple series comparison

**Not for:**
- Categorical data (use bars)
- Few time points (use bars or values)

### Scatter Plots

**When to use:**
- Showing correlation
- Identifying clusters
- Finding outliers in two dimensions

**Enhance with:**
- Trend line
- Quadrant lines
- Size encoding (carefully)

## Displays to Avoid

### Gauges and Meters

**Problem:** Huge space for one number, decorative waste

**Replace with:** Bullet graph (10x more data density)

### Pie Charts

**Problems:**
- Humans judge angles poorly
- Can't compare non-adjacent slices
- More than 3-4 slices becomes unreadable
- 3D versions distort horribly

**Replace with:**
- Bar chart (comparison)
- Bullet graph (target tracking)
- Numbers (if just showing percentages)

### 3D Anything

**Problems:**
- Distorts perception
- Hides data behind other data
- Adds no information
- "Looks impressive" ≠ communicates

**Replace with:** 2D equivalent (always)

### Radar/Spider Charts

**Problems:**
- Area distorts comparison
- Connecting unrelated categories
- Order of axes arbitrary
- Hard to read

**Replace with:** Small multiples of bar charts

### Donut Charts

Same problems as pie charts, plus hollow center wastes space.

### Traffic Lights Alone

**Problem:** Red/yellow/green without values loses critical context

**Fix:** Always show value + status indicator

```
Bad:  🔴 🟢 🟡 🟢

Good: 🔴 82% (target: 95%)
      🟢 $1.2M (target: $1M)
```

## Few's Rules for Quantitative Display

### 1. Reduce Non-Data Pixels

- Remove unnecessary gridlines
- Lighten remaining gridlines
- Remove chart borders
- Remove backgrounds
- Remove 3D effects

### 2. Enhance Data Pixels

- Remove redundant data labels
- Highlight important values
- Direct label instead of legends
- Use color meaningfully

### Example Transformation

**Before (cluttered):**
```
┌─────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│ ║████████████████████████████       │
│ ║████████████████████               │
│ ║████████████████                   │
│ ║══════════════════════════════════ │
│ 0    25    50    75    100          │
│ Legend: ■ Series A                  │
└─────────────────────────────────────┘
```

**After (clean):**
```
Series A  ████████████████████████████  85
Series B  ████████████████████          62
Series C  ████████████████              48
          0         50        100
```

## Display Selection Cheat Sheet

```
"How is X performing vs. target?"
    → Bullet graph

"What's the trend for X?"
    → Sparkline (compact) or Line chart (detailed)

"How do A, B, C compare?"
    → Bar chart (horizontal if many items)

"What percent is each category?"
    → Stacked bar or just show percentages

"Is X correlated with Y?"
    → Scatter plot

"Where are the outliers?"
    → Strip plot or scatter plot

"What's happening right now?"
    → Number with alert indicator

"Show me everything about X"
    → Multiple coordinated views, not one complex chart
```

## Combining Displays

Small multiples > complex single chart:

```
Instead of one chart with 12 lines:

Product A      Product B      Product C      Product D
─╱╲─╱──        ──╲─╱──        ─╱─╱─╱─        ──────╲─
$1.2M          $800K          $650K          $400K
```

Each small chart is readable. Patterns across charts are visible.
