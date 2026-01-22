# Layout and Organization

Principles for arranging dashboard elements effectively.

## The Single-Screen Constraint

Everything must fit without scrolling. This constraint forces:
- Ruthless prioritization
- Efficient use of space
- Clear visual hierarchy

If it doesn't fit, either:
1. Remove less important items
2. Aggregate to higher level
3. Create a separate dashboard

## Visual Hierarchy Zones

### The Quadrant Model

```
┌─────────────────┬─────────────────┐
│                 │                 │
│   PRIMARY       │   SECONDARY     │
│   (most seen)   │   (second)      │
│                 │                 │
├─────────────────┼─────────────────┤
│                 │                 │
│   TERTIARY      │   SUPPORTING    │
│   (third)       │   (last)        │
│                 │                 │
└─────────────────┴─────────────────┘

Reading order (Western): Top-left → Top-right → Bottom-left → Bottom-right
```

### Placement Guidelines

- **Top-left**: Most critical KPIs, summary status
- **Top-right**: Secondary metrics, context
- **Bottom-left**: Supporting details, trends
- **Bottom-right**: Reference information, legends

## Grouping Strategies

### By Function

```
┌─────────────────────────────────────┐
│ SUMMARY STATUS                      │
├─────────────┬─────────────┬─────────┤
│ SALES       │ OPERATIONS  │ FINANCE │
│             │             │         │
└─────────────┴─────────────┴─────────┘
```

### By Time

```
┌─────────────┬─────────────┬─────────┐
│ TODAY       │ THIS WEEK   │ MTD     │
│             │             │         │
└─────────────┴─────────────┴─────────┘
```

### By Priority

```
┌─────────────────────────────────────┐
│ ALERTS (needs attention)            │
├─────────────────────────────────────┤
│ KEY METRICS                         │
├─────────────────────────────────────┤
│ SUPPORTING DETAILS                  │
└─────────────────────────────────────┘
```

## Whitespace

Whitespace is not empty—it's a grouping mechanism.

### Using Whitespace

```
Good (whitespace groups):         Bad (no grouping):
┌─────────────────────────┐      ┌─────────────────────────┐
│ Revenue    $1.2M        │      │ Revenue    $1.2M        │
│ Margin     23%          │      │ Margin     23%          │
│                         │      │ Customers  45,000       │
│ Customers  45,000       │      │ Churn      2.3%         │
│ Churn      2.3%         │      │ Uptime     99.2%        │
│                         │      │ Incidents  3            │
│ Uptime     99.2%        │      └─────────────────────────┘
│ Incidents  3            │
└─────────────────────────┘
```

### Whitespace Rules

1. **More space between groups** than within groups
2. **Consistent spacing** throughout dashboard
3. **Don't fill every pixel** - breathing room aids scanning
4. **Margin from edges** - don't crowd the borders

## Alignment

Misalignment creates visual noise. Align everything.

### Alignment Grid

```
Column 1      Column 2      Column 3
│             │             │
├─────────────┼─────────────┼─────────────
│ Label       │ Value       │ Trend
│ Label       │ Value       │ Trend
│ Label       │ Value       │ Trend
├─────────────┼─────────────┼─────────────
│ Label       │ Value       │ Trend
│ Label       │ Value       │ Trend
```

### Alignment Types

- **Left-align text labels**
- **Right-align numbers** (decimal alignment)
- **Center sparingly** (titles only)
- **Align baselines** across rows

```javascript
// CSS for aligned metric display
.metric-row {
  display: grid;
  grid-template-columns: 100px 80px 60px;
  gap: 12px;
}

.metric-label { text-align: left; }
.metric-value { text-align: right; font-variant-numeric: tabular-nums; }
.metric-trend { text-align: center; }
```

## Sizing Consistency

Same type of element = same size.

```
Good (consistent):              Bad (random sizing):
┌────────┐ ┌────────┐          ┌────────┐ ┌──────────────┐
│ KPI 1  │ │ KPI 2  │          │ KPI 1  │ │   KPI 2      │
└────────┘ └────────┘          └────────┘ └──────────────┘
┌────────┐ ┌────────┐          ┌──────┐ ┌────────────┐
│ KPI 3  │ │ KPI 4  │          │KPI 3 │ │   KPI 4    │
└────────┘ └────────┘          └──────┘ └────────────┘
```

### Size Hierarchy

Use size to indicate importance:

```
┌─────────────────────────────────────┐
│          PRIMARY METRIC             │  ← Largest
│             $1.2M                   │
├──────────────────┬──────────────────┤
│ Secondary $800K  │ Secondary $400K  │  ← Medium
├────────┬────────┬────────┬──────────┤
│ $100K  │ $90K   │ $85K   │ $75K     │  ← Smallest
└────────┴────────┴────────┴──────────┘
```

## Borders and Separators

Less is more. Use sparingly.

### When to Use Borders

- **Grouping sections** - Light border or background
- **Tables** - Horizontal lines only, not full grid
- **Separation** - When whitespace isn't enough

### Border Styling

```css
/* Subtle grouping border */
.section {
  border: 1px solid #e5e5e5;
  border-radius: 4px;
}

/* Table rows only */
.table tr {
  border-bottom: 1px solid #f0f0f0;
}
.table tr:last-child {
  border-bottom: none;
}

/* Avoid: Heavy black borders, full grid lines */
```

## Responsive Considerations

Dashboards are designed for specific screen sizes, but:

### Fixed Layout (Preferred)

Design for a target resolution (e.g., 1920×1080). Display on dedicated monitors.

### Adaptive Layout

Define breakpoints for different contexts:

```javascript
const layouts = {
  desktop: {
    columns: 4,
    kpiSize: 'large',
    showSparklines: true
  },
  tablet: {
    columns: 2,
    kpiSize: 'medium',
    showSparklines: true
  },
  mobile: {
    columns: 1,
    kpiSize: 'full-width',
    showSparklines: false  // Too small
  }
};
```

## Common Layout Patterns

### KPI Row + Detail Below

```
┌────────┬────────┬────────┬────────┐
│ KPI 1  │ KPI 2  │ KPI 3  │ KPI 4  │
└────────┴────────┴────────┴────────┘
┌─────────────────┬─────────────────┐
│ Chart 1         │ Chart 2         │
│                 │                 │
└─────────────────┴─────────────────┘
```

### Sidebar + Main Content

```
┌─────────┬───────────────────────────┐
│ Filters │ Main Visualization        │
│         │                           │
│ KPIs    │                           │
│         │                           │
│         ├───────────────────────────┤
│         │ Supporting Table          │
└─────────┴───────────────────────────┘
```

### Alert Banner + Grid

```
┌─────────────────────────────────────┐
│ 🔴 3 ALERTS REQUIRE ATTENTION       │
├────────┬────────┬────────┬──────────┤
│        │        │        │          │
│        │        │        │          │
├────────┼────────┼────────┼──────────┤
│        │        │        │          │
│        │        │        │          │
└────────┴────────┴────────┴──────────┘
```
