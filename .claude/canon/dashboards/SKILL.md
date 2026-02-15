---
name: dashboards
description: "Dashboard design principles"
---

<purpose>
Design dashboards that communicate the most important information at a glance,
grounded in visual perception science rather than decoration.
</purpose>

<core_definition>
"A dashboard is a visual display of the most important information needed to achieve
one or more objectives; consolidated and arranged on a single screen so the information
can be monitored at a glance." — Stephen Few
</core_definition>

<essential_principles>

<single_screen_rule>
A dashboard must fit on a **single screen** without scrolling. If it requires scrolling,
it's not a dashboard—it's a report. The constraint forces prioritization.
</single_screen_rule>

<at_a_glance>
Information must be perceivable **at a glance**. This means:
- No hunting for data
- No mental calculations required
- Immediate pattern recognition
- Exceptions visible without interaction
</at_a_glance>

<eloquence_through_simplicity>
Reduce to the minimum necessary:
1. **Reduce non-data pixels**: Eliminate unnecessary ones, de-emphasize others
2. **Enhance data pixels**: Eliminate unneeded ones, highlight the most important

Every pixel should earn its place. If removing something loses no information, remove it.
</eloquence_through_simplicity>

<color_discipline>
Color is a **scarce resource**. Use it only for meaning:
- **Default**: Grayscale for most data and UI elements
- **Reserve bright colors**: Only for alerts, exceptions, highlights
- **Consistency**: Same color = same meaning across all dashboards
- **When everything is bright, nothing stands out**
</color_discipline>

<appropriate_precision>
Match precision to need:
- Executives need trends and exceptions, not decimal places
- Analysts need exact values for investigation
- Operations needs real-time status, not historical depth

Don't display more precision than the viewer can use.
</appropriate_precision>

</essential_principles>

<dashboard_types>
Three primary types, each with different design requirements:

| Type | Purpose | Update | Interaction | Focus |
|------|---------|--------|-------------|-------|
| **Strategic** | Long-term oversight | Daily/Weekly | Minimal | Trends, KPIs |
| **Analytical** | Deep investigation | As needed | High | Drill-down, comparison |
| **Operational** | Real-time monitoring | Seconds/Minutes | Low | Alerts, current state |

Most dashboards serve ONE type. Mixing types creates confusion.
</dashboard_types>

<display_media_hierarchy>
Choose the right display for the data:

| Data Type | Best Display | Avoid |
|-----------|--------------|-------|
| Single KPI vs target | **Bullet graph** | Gauge, pie chart |
| Trend over time | **Sparkline** | Full chart with axes |
| Distribution | **Strip plot, histogram** | Pie chart |
| Part-to-whole | **Stacked bar** | 3D pie, donut |
| Comparison | **Bar chart** | Radar chart |
| Geographic | **Choropleth** | 3D globe |
| Correlation | **Scatter plot** | Bubble chart |
| Current status | **Indicator + value** | Animation |

**Rule**: The simplest display that communicates the data wins.
</display_media_hierarchy>

<intake>
What are you designing?

1. **New dashboard** — Need to determine type, metrics, layout
2. **Reviewing existing dashboard** — Audit against Few's principles
3. **Specific component** — Bullet graph, sparklines, KPI cards, alerts
4. **Display media selection** — What chart type for this data?
5. **Color/layout guidance** — Visual design decisions
</intake>

<routing>
| Topic | Reference |
|-------|-----------|
| Strategic/Analytical/Operational dashboards | `references/dashboard-types.md` |
| The 13 common mistakes to avoid | `references/common-mistakes.md` |
| Bullet graph design and implementation | `references/bullet-graphs.md` |
| Sparklines for trends | `references/sparklines.md` |
| Color rules and palettes | `references/color-guidelines.md` |
| Visual perception science | `references/visual-perception.md` |
| Layout and organization | `references/layout-organization.md` |
| Choosing display media | `references/display-media.md` |
</routing>

<quick_audit_checklist>
Run through this for any dashboard:

**Structure**
- [ ] Fits on single screen without scrolling?
- [ ] Serves ONE dashboard type (strategic/analytical/operational)?
- [ ] Most important information in top-left quadrant?

**Display Media**
- [ ] Using bullet graphs instead of gauges?
- [ ] Sparklines for trends instead of full charts?
- [ ] No pie charts, 3D effects, or decorative elements?

**Visual Design**
- [ ] Mostly grayscale with color reserved for meaning?
- [ ] Adequate white space between groups?
- [ ] Consistent alignment and sizing?

**Data**
- [ ] Context provided (vs. target, vs. prior period)?
- [ ] Appropriate precision for audience?
- [ ] Exceptions highlighted, not hidden?

**Perception**
- [ ] Can grasp key message in <5 seconds?
- [ ] Related items grouped by proximity?
- [ ] No chartjunk, gradients, or decorative images?
</quick_audit_checklist>

<anti_patterns>
Few's most critical warnings:

**Gauges and Meters** — Waste space, encode poorly, look "impressive" but communicate little.
Replace with bullet graphs.

**Pie Charts** — Humans judge angles poorly. Use bar charts for comparison,
bullet graphs for target tracking.

**Traffic Lights Alone** — Red/yellow/green without values loses critical context.
Always show the number alongside status.

**Bright Color Everywhere** — When everything screams for attention, nothing gets it.
Default to gray, highlight exceptions.

**Scrolling Dashboards** — If it scrolls, it's not a dashboard. Prioritize ruthlessly.

**Decoration** — Gradients, 3D effects, background images, corporate logos in data area.
Every non-data pixel costs attention.
</anti_patterns>

<integration>
This skill works with:
- **d3-expert** — Implementation patterns for bullet graphs, sparklines
- **stakeholder-adaptation** — Adjust dashboard for executive vs. analyst audience
- **charts-visualization-review** — Complementary principles (data-ink ratio, lie factor)
- **behavioral-health-viz-patterns** — Domain-specific dashboard patterns
</integration>
