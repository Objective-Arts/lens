# Small Multiples: Comparative Visualization

## The Principle

> "Small multiples are economical: once viewers understand the design of one, they have immediate access to the data in all the others."
> — Edward Tufte, *Envisioning Information*

Small multiples display the same chart type multiple times, each showing a different subset of data. The consistent structure enables rapid comparison without the cognitive load of decoding new chart types.

**Key Insight:** The eye can compare position across charts more easily than it can interpret a single complex chart with multiple overlapping series.

---

## When to Use Small Multiples

### Use When:
- Comparing trends across categories (regions, products, time periods)
- Data has a natural grouping variable (faceting dimension)
- Single chart would have 5+ overlapping series
- Pattern differences between groups are important
- Audience needs to compare shapes, not exact values

### Avoid When:
- Exact cross-group comparison of specific values is critical
- Groups have vastly different scales (normalize or reconsider)
- Screen space is severely limited
- Data doesn't have clear grouping

---

## D3 Implementation Patterns

### Basic Grid Layout

```javascript
function smallMultiples(data, {
  groups,           // Array of group values
  width = 800,
  height = 600,
  columns = 3,
  margin = { top: 20, right: 10, bottom: 30, left: 40 },
  cellPadding = 10
} = {}) {

  const rows = Math.ceil(groups.length / columns);
  const cellWidth = (width - margin.left - margin.right) / columns;
  const cellHeight = (height - margin.top - margin.bottom) / rows;

  const innerWidth = cellWidth - cellPadding * 2;
  const innerHeight = cellHeight - cellPadding * 2 - 20; // Space for title

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);

  // Create a cell for each group
  const cells = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
    .selectAll("g")
    .data(groups)
    .join("g")
    .attr("transform", (d, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      return `translate(${col * cellWidth + cellPadding}, ${row * cellHeight + cellPadding})`;
    });

  // Add title to each cell
  cells.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", 12)
    .attr("text-anchor", "middle")
    .attr("font-size", "11px")
    .attr("font-weight", "500")
    .text(d => d);

  // Add chart to each cell
  cells.each(function(group) {
    const cell = d3.select(this);
    const groupData = data.filter(d => d.group === group);

    // Create scales (shared or per-cell)
    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.x))  // Shared domain
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.y)]) // Shared domain
      .range([innerHeight, 0]);

    // Draw the chart content
    const g = cell.append("g")
      .attr("transform", "translate(0, 20)");

    // Add line
    g.append("path")
      .datum(groupData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x(d => x(d.x))
        .y(d => y(d.y)));

    // Minimal axes
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x).ticks(3).tickSize(3))
      .call(g => g.select(".domain").remove());

    g.append("g")
      .call(d3.axisLeft(y).ticks(3).tickSize(3))
      .call(g => g.select(".domain").remove());
  });

  return svg.node();
}
```

### Faceted Small Multiples (Observable Plot Style)

```javascript
function facetedChart(data, {
  facetBy,          // Field to facet by
  x,                // X accessor
  y,                // Y accessor
  width = 800,
  columns = null,   // Auto-calculate if null
  aspectRatio = 1
} = {}) {

  const groups = [...new Set(data.map(d => d[facetBy]))].sort();
  const cols = columns || Math.ceil(Math.sqrt(groups.length));
  const rows = Math.ceil(groups.length / cols);

  const cellWidth = width / cols;
  const cellHeight = cellWidth * aspectRatio;
  const height = rows * cellHeight + 40; // Extra for shared axis labels

  const margin = { top: 10, right: 10, bottom: 25, left: 35 };
  const innerWidth = cellWidth - margin.left - margin.right;
  const innerHeight = cellHeight - margin.top - margin.bottom;

  // Shared scales across all facets
  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d[x]))
    .range([0, innerWidth])
    .nice();

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[y])])
    .range([innerHeight, 0])
    .nice();

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // Create facets
  groups.forEach((group, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const groupData = data.filter(d => d[facetBy] === group);

    const g = svg.append("g")
      .attr("transform", `translate(${col * cellWidth + margin.left}, ${row * cellHeight + margin.top})`);

    // Facet label
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -2)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#666")
      .text(group);

    // Only show axes on edge cells
    const isLeftEdge = col === 0;
    const isBottomEdge = row === rows - 1 || i >= groups.length - cols;

    // Y-axis (left edge only)
    if (isLeftEdge) {
      g.append("g")
        .call(d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line")
          .attr("stroke", "#e5e5e5")
          .attr("stroke-width", 0.5))
        .call(g => g.selectAll(".tick text")
          .attr("font-size", "9px")
          .attr("fill", "#666"));
    } else {
      // Gridlines only
      g.append("g")
        .call(d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickFormat(""))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line")
          .attr("stroke", "#e5e5e5")
          .attr("stroke-width", 0.5));
    }

    // X-axis (bottom edge only)
    if (isBottomEdge) {
      g.append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale).ticks(4).tickSize(3))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick text")
          .attr("font-size", "9px")
          .attr("fill", "#666"));
    }

    // Draw data
    g.append("path")
      .datum(groupData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x(d => xScale(d[x]))
        .y(d => yScale(d[y])));
  });

  return svg.node();
}
```

### Responsive Small Multiples

```javascript
function responsiveSmallMultiples(container, data, groups) {
  const containerWidth = container.getBoundingClientRect().width;

  // Responsive column count
  let columns;
  if (containerWidth < 400) columns = 1;
  else if (containerWidth < 600) columns = 2;
  else if (containerWidth < 900) columns = 3;
  else columns = 4;

  const cellWidth = containerWidth / columns;
  const cellHeight = cellWidth * 0.6; // Maintain aspect ratio

  // Rebuild on resize
  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const newWidth = entry.contentRect.width;
      // Debounced rebuild
      clearTimeout(container._resizeTimeout);
      container._resizeTimeout = setTimeout(() => {
        container.innerHTML = "";
        responsiveSmallMultiples(container, data, groups);
      }, 250);
    }
  });

  resizeObserver.observe(container);

  // Build chart with calculated dimensions
  // ... (use cellWidth and cellHeight)
}
```

---

## Scale Decisions

### Shared Scales (Default - Recommended)

```javascript
// Same scale for all panels - enables direct visual comparison
const sharedY = d3.scaleLinear()
  .domain([0, d3.max(allData, d => d.value)])
  .range([innerHeight, 0]);

// Use sharedY for every panel
// PRO: Can compare heights across panels
// CON: Low-variance groups look flat
```

### Free Scales (Per-Panel)

```javascript
// Each panel has its own scale
groups.forEach(group => {
  const groupData = data.filter(d => d.group === group);

  const freeY = d3.scaleLinear()
    .domain([0, d3.max(groupData, d => d.value)])
    .range([innerHeight, 0]);

  // PRO: Shows pattern within each group
  // CON: Can't compare heights across panels - potentially misleading!
});
```

### Hybrid: Free with Visual Cue

```javascript
// Free scales, but indicate relative magnitudes
const maxByGroup = d3.rollup(data, v => d3.max(v, d => d.value), d => d.group);
const globalMax = d3.max(maxByGroup.values());

groups.forEach(group => {
  const groupMax = maxByGroup.get(group);
  const relativeScale = groupMax / globalMax;

  // Visual indicator of relative scale
  g.append("rect")
    .attr("x", innerWidth - 5)
    .attr("y", innerHeight * (1 - relativeScale))
    .attr("width", 4)
    .attr("height", innerHeight * relativeScale)
    .attr("fill", "#ddd")
    .attr("opacity", 0.5);

  // Label the max
  g.append("text")
    .attr("x", innerWidth - 8)
    .attr("y", innerHeight * (1 - relativeScale) - 2)
    .attr("text-anchor", "end")
    .attr("font-size", "8px")
    .attr("fill", "#999")
    .text(d3.format(".0f")(groupMax));
});
```

---

## Layout Patterns

### Grid Layout (Most Common)

```javascript
const gridLayout = (items, columns) => {
  return items.map((item, i) => ({
    item,
    col: i % columns,
    row: Math.floor(i / columns)
  }));
};
```

### Ordered by Metric

```javascript
// Order panels by some aggregate metric
const groupSummaries = d3.rollups(data,
  v => d3.mean(v, d => d.value),
  d => d.group
).sort((a, b) => d3.descending(a[1], b[1]));

const orderedGroups = groupSummaries.map(d => d[0]);
// Most important/highest value groups appear first
```

### Highlight + Context

```javascript
// One panel larger (highlighted), others small
function highlightMultiples(data, highlightGroup) {
  // Large panel for highlight
  const mainWidth = width * 0.5;
  const mainHeight = height * 0.6;

  // Small panels for context
  const thumbWidth = (width - mainWidth) / 3;
  const thumbHeight = height / 4;

  // Draw highlighted panel prominently
  // Draw other panels as thumbnails
}
```

---

## Typography and Labels

### Minimalist Facet Labels

```javascript
// Simple, unobtrusive labels
cells.append("text")
  .attr("x", innerWidth / 2)
  .attr("y", -4)
  .attr("text-anchor", "middle")
  .attr("font-size", "10px")
  .attr("font-weight", "500")
  .attr("fill", "#333")
  .text(d => d);

// No borders, no backgrounds - let the data define the space
```

### Shared Axis Labels

```javascript
// Instead of labeling every panel, add shared labels
// Y-axis label (once, on left side)
svg.append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", 12)
  .attr("text-anchor", "middle")
  .attr("font-size", "11px")
  .attr("fill", "#666")
  .text("Value");

// X-axis label (once, at bottom)
svg.append("text")
  .attr("x", width / 2)
  .attr("y", height - 5)
  .attr("text-anchor", "middle")
  .attr("font-size", "11px")
  .attr("fill", "#666")
  .text("Time");
```

---

## Common Mistakes

### Too Many Panels

```javascript
// BAD: 50 tiny unreadable panels
const groups = data.map(d => d.category); // 50 categories!

// GOOD: Aggregate or filter to manageable number
const topGroups = d3.rollups(data, v => d3.sum(v, d => d.value), d => d.category)
  .sort((a, b) => d3.descending(a[1], b[1]))
  .slice(0, 12)
  .map(d => d[0]);

// Show top 12, aggregate rest as "Other"
```

### Inconsistent Aspect Ratios

```javascript
// BAD: Panels have different aspect ratios
// Makes comparison harder

// GOOD: All panels identical dimensions
const cellWidth = width / columns;
const cellHeight = cellWidth * 0.75; // Consistent aspect ratio
```

### Over-Decorated Panels

```javascript
// BAD: Full axes, gridlines, legends in each panel
// Wastes space, creates visual noise

// GOOD: Minimal decoration
// - Axes only on edges
// - Light or no gridlines
// - Single shared legend
// - Facet label only (no panel borders)
```

---

## Complete Example: Regional Sales Comparison

```javascript
function regionalSalesMultiples(data) {
  const regions = [...new Set(data.map(d => d.region))].sort();
  const width = 800;
  const columns = 3;
  const rows = Math.ceil(regions.length / columns);
  const cellWidth = width / columns;
  const cellHeight = 120;
  const height = rows * cellHeight + 30;

  const margin = { top: 20, right: 10, bottom: 20, left: 30 };
  const innerWidth = cellWidth - margin.left - margin.right;
  const innerHeight = cellHeight - margin.top - margin.bottom;

  // Shared scales
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.sales)])
    .range([innerHeight, 0]);

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  // Create panels
  regions.forEach((region, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const regionData = data.filter(d => d.region === region);

    const g = svg.append("g")
      .attr("transform", `translate(${col * cellWidth + margin.left}, ${row * cellHeight + margin.top})`);

    // Region label
    g.append("text")
      .attr("x", 0)
      .attr("y", -6)
      .attr("font-weight", "600")
      .attr("fill", "#333")
      .text(region);

    // Light gridlines
    g.append("g")
      .call(d3.axisLeft(y).ticks(3).tickSize(-innerWidth).tickFormat(""))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("line").attr("stroke", "#f0f0f0"));

    // Area chart
    const area = d3.area()
      .x(d => x(d.date))
      .y0(innerHeight)
      .y1(d => y(d.sales))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(regionData)
      .attr("fill", "steelblue")
      .attr("fill-opacity", 0.3)
      .attr("d", area);

    // Line on top
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.sales))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(regionData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", line);

    // Minimal x-axis (bottom row only)
    if (row === rows - 1) {
      g.append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(x).ticks(4).tickSize(0))
        .call(g => g.select(".domain").remove());
    }

    // Y-axis values (left column only)
    if (col === 0) {
      g.append("g")
        .call(d3.axisLeft(y).ticks(3).tickSize(0))
        .call(g => g.select(".domain").remove());
    }
  });

  return svg.node();
}
```

---

## Checklist

Before shipping small multiples:

- [ ] Panels have identical dimensions and aspect ratios
- [ ] Scales are shared (unless explicitly designed otherwise)
- [ ] Number of panels is manageable (≤16 typical, ≤25 max)
- [ ] Panels are ordered meaningfully (alphabetic, by value, temporal)
- [ ] Axes appear only on edges (not every panel)
- [ ] Facet labels are minimal and clear
- [ ] No redundant borders or backgrounds
- [ ] Layout is responsive or appropriately sized
- [ ] Eye can scan and compare without effort

**Target:** Viewer should understand all panels after understanding one.

