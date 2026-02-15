# /dashboards Summary

> "A dashboard must fit on a single screen without scrolling."

## Essential Principles

| Principle | Meaning |
|-----------|---------|
| **Single screen** | If it scrolls, it's a report, not a dashboard |
| **At a glance** | No hunting, no mental calculations required |
| **Color is scarce** | Gray default, bright colors only for alerts |
| **Simplicity** | Every pixel must earn its place |

## Dashboard Types

| Type | Update | Interaction | Focus |
|------|--------|-------------|-------|
| **Strategic** | Daily/Weekly | Minimal | Trends, KPIs |
| **Analytical** | As needed | High | Drill-down, comparison |
| **Operational** | Seconds/Minutes | Low | Alerts, current state |

## Display Media Selection

| Data Type | Use | Avoid |
|-----------|-----|-------|
| KPI vs target | Bullet graph | Gauge, pie chart |
| Trend | Sparkline | Full chart with axes |
| Comparison | Bar chart | Radar chart |
| Distribution | Strip plot, histogram | Pie chart |

## Anti-Patterns

- **Gauges/Meters** → Replace with bullet graphs
- **Pie Charts** → Use bar charts
- **Traffic lights alone** → Always show the number too
- **Bright color everywhere** → Default to gray
- **Scrolling** → Prioritize ruthlessly
- **Decoration** → Remove gradients, 3D, logos

## Quick Audit

- [ ] Single screen, no scrolling?
- [ ] ONE dashboard type?
- [ ] Bullet graphs not gauges?
- [ ] Mostly grayscale?
- [ ] Key message in <5 seconds?

## When to Use

- Dashboard design
- Data visualization review
- Choosing chart types

## Concrete Checks (MUST ANSWER)

- Does the entire dashboard render without scrolling on a standard 1920x1080 display?
- Is the single most important metric/KPI positioned in the top-left quadrant?
- Are there 7 or fewer widgets on the dashboard?
- Does every summary number have a drill-down path to its underlying data?
- Are gauges and pie charts absent (replaced with bullet graphs and bar charts)?
- Is the default color palette grayscale, with bright color reserved only for alerts or thresholds?
