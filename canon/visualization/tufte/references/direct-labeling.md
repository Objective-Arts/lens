# Direct Labeling: Labels at the Data

## The Principle

> "Data graphics should draw the viewer's attention to the sense and substance of the data, not to something else... Labels should be placed on the graphic itself; no legend is needed."
> — Edward Tufte, *The Visual Display of Quantitative Information*

Direct labeling places text annotations directly on or adjacent to the data elements they describe. This eliminates the cognitive cost of:
1. Looking at a data point
2. Identifying its visual encoding (color, position, shape)
3. Finding that encoding in a legend
4. Reading the legend
5. Returning to the data point

**With direct labels:** Look at data → Read label → Done.

---

## When to Use Direct Labels

### Always Prefer Direct Labels When:
- Fewer than 10 series/categories
- Labels fit without excessive overlap
- The visualization is static (not animated)
- Data points have natural endpoints (lines) or centers (bars)

### Use Legends When:
- More than ~8-10 overlapping series
- Labels would heavily overlap despite best efforts
- Interactive hover/highlight provides detail
- Space constraints make labels impossible
- Animation makes labels distracting

---

## Line Chart Labeling

### End-of-Line Labels (Best Practice)

```javascript
function labeledLineChart(data, series) {
  // Group by series
  const grouped = d3.group(data, d => d.series);

  // Draw lines
  const lines = g.selectAll("path")
    .data(grouped)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", d => color(d[0]))
    .attr("stroke-width", 2)
    .attr("d", ([, values]) => line(values));

  // Direct labels at end of each line
  const labels = g.selectAll("text.series-label")
    .data(grouped)
    .join("text")
    .attr("class", "series-label")
    .attr("x", ([, values]) => {
      const last = values[values.length - 1];
      return x(last.date) + 5;  // 5px right of endpoint
    })
    .attr("y", ([, values]) => {
      const last = values[values.length - 1];
      return y(last.value);
    })
    .attr("dy", "0.35em")  // Vertical centering
    .attr("fill", d => color(d[0]))
    .attr("font-size", "11px")
    .attr("font-weight", "500")
    .text(d => d[0]);  // Series name

  return { lines, labels };
}
```

### Handling Label Overlap

```javascript
function positionLabelsWithCollisionAvoidance(labels, spacing = 12) {
  const labelData = [];

  // Collect label positions
  labels.each(function(d) {
    const node = d3.select(this);
    labelData.push({
      node,
      y: +node.attr("y"),
      text: node.text(),
      originalY: +node.attr("y")
    });
  });

  // Sort by Y position
  labelData.sort((a, b) => a.y - b.y);

  // Adjust overlapping labels
  for (let i = 1; i < labelData.length; i++) {
    const prev = labelData[i - 1];
    const curr = labelData[i];

    if (curr.y - prev.y < spacing) {
      // Push current label down
      curr.y = prev.y + spacing;
    }
  }

  // Apply adjusted positions
  labelData.forEach(d => {
    d.node.attr("y", d.y);

    // Add connecting line if label moved significantly
    if (Math.abs(d.y - d.originalY) > spacing / 2) {
      const parent = d.node.node().parentNode;
      d3.select(parent).insert("line", "text")
        .attr("x1", +d.node.attr("x") - 5)
        .attr("y1", d.originalY)
        .attr("x2", +d.node.attr("x") - 2)
        .attr("y2", d.y)
        .attr("stroke", "#999")
        .attr("stroke-width", 0.5);
    }
  });
}
```

### Voronoi-Based Label Placement

```javascript
function voronoiLabelPlacement(data, width, height) {
  // Create Voronoi diagram for optimal label positions
  const delaunay = d3.Delaunay.from(data, d => x(d.x), d => y(d.y));
  const voronoi = delaunay.voronoi([0, 0, width, height]);

  // For each point, find the direction with most space
  data.forEach((d, i) => {
    const cell = voronoi.cellPolygon(i);
    if (!cell) return;

    // Find centroid of Voronoi cell
    const centroid = d3.polygonCentroid(cell);
    const pointX = x(d.x);
    const pointY = y(d.y);

    // Label direction is from point toward cell centroid
    const angle = Math.atan2(centroid[1] - pointY, centroid[0] - pointX);
    const distance = 15;

    d.labelX = pointX + Math.cos(angle) * distance;
    d.labelY = pointY + Math.sin(angle) * distance;
    d.labelAnchor = Math.abs(angle) > Math.PI / 2 ? "end" : "start";
  });
}
```

---

## Bar Chart Labeling

### Value Labels on Bars

```javascript
function labeledBarChart(data) {
  const bars = g.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.category))
    .attr("y", d => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.value))
    .attr("fill", "steelblue");

  // Labels inside or outside based on bar size
  const labels = g.selectAll("text.value-label")
    .data(data)
    .join("text")
    .attr("class", "value-label")
    .attr("x", d => x(d.category) + x.bandwidth() / 2)
    .attr("y", d => {
      const barHeight = height - y(d.value);
      // Inside if bar is tall enough, outside if short
      return barHeight > 20 ? y(d.value) + 15 : y(d.value) - 5;
    })
    .attr("text-anchor", "middle")
    .attr("fill", d => {
      const barHeight = height - y(d.value);
      // White text inside, dark outside
      return barHeight > 20 ? "white" : "#333";
    })
    .attr("font-size", "11px")
    .attr("font-weight", "500")
    .text(d => d3.format(",")(d.value));
}
```

### Category Labels Directly

```javascript
// Instead of axis labels at bottom, label bars directly
function directCategoryLabels(data) {
  g.selectAll("text.category-label")
    .data(data)
    .join("text")
    .attr("class", "category-label")
    .attr("x", d => x(d.category) + x.bandwidth() / 2)
    .attr("y", height + 15)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .attr("fill", "#666")
    .text(d => d.category);

  // Remove redundant axis
  g.select(".x-axis").remove();
}
```

### Horizontal Bar Chart Labels

```javascript
function horizontalBarLabels(data) {
  const bars = g.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", 0)
    .attr("y", d => y(d.category))
    .attr("width", d => x(d.value))
    .attr("height", y.bandwidth())
    .attr("fill", "steelblue");

  // Category labels at start of bar
  g.selectAll("text.category")
    .data(data)
    .join("text")
    .attr("class", "category")
    .attr("x", -5)
    .attr("y", d => y(d.category) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .attr("font-size", "11px")
    .attr("fill", "#333")
    .text(d => d.category);

  // Value labels at end of bar
  g.selectAll("text.value")
    .data(data)
    .join("text")
    .attr("class", "value")
    .attr("x", d => {
      const barWidth = x(d.value);
      // Inside if wide enough, outside if narrow
      return barWidth > 40 ? barWidth - 5 : barWidth + 5;
    })
    .attr("y", d => y(d.category) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => x(d.value) > 40 ? "end" : "start")
    .attr("fill", d => x(d.value) > 40 ? "white" : "#333")
    .attr("font-size", "11px")
    .text(d => d3.format(",")(d.value));

  // No axes needed!
}
```

---

## Scatter Plot Labeling

### Selective Point Labels

```javascript
function selectiveScatterLabels(data) {
  // Only label notable points
  const notablePoints = data.filter(d =>
    d.value > threshold ||
    d.isHighlighted ||
    d.category === "Important"
  );

  g.selectAll("text.point-label")
    .data(notablePoints)
    .join("text")
    .attr("class", "point-label")
    .attr("x", d => x(d.x) + 8)
    .attr("y", d => y(d.y))
    .attr("dy", "0.35em")
    .attr("font-size", "10px")
    .attr("fill", "#333")
    .text(d => d.label);
}
```

### Smart Label Positioning

```javascript
function smartLabelPosition(data) {
  // Eight possible positions around a point
  const positions = [
    { dx: 8, dy: 0, anchor: "start" },      // Right
    { dx: -8, dy: 0, anchor: "end" },       // Left
    { dx: 0, dy: -10, anchor: "middle" },   // Top
    { dx: 0, dy: 15, anchor: "middle" },    // Bottom
    { dx: 6, dy: -6, anchor: "start" },     // Top-right
    { dx: -6, dy: -6, anchor: "end" },      // Top-left
    { dx: 6, dy: 10, anchor: "start" },     // Bottom-right
    { dx: -6, dy: 10, anchor: "end" }       // Bottom-left
  ];

  const placedLabels = [];

  data.forEach(d => {
    const px = x(d.x);
    const py = y(d.y);

    // Try each position, pick first without overlap
    for (const pos of positions) {
      const labelX = px + pos.dx;
      const labelY = py + pos.dy;

      // Check against already-placed labels
      const overlaps = placedLabels.some(placed => {
        const dx = Math.abs(placed.x - labelX);
        const dy = Math.abs(placed.y - labelY);
        return dx < 40 && dy < 12; // Approximate label size
      });

      if (!overlaps) {
        d.labelX = labelX;
        d.labelY = labelY;
        d.labelAnchor = pos.anchor;
        placedLabels.push({ x: labelX, y: labelY });
        break;
      }
    }
  });
}
```

---

## Pie/Donut Chart Labeling

### Direct Labels (Avoid Pie Charts, But If You Must)

```javascript
function directPieLabels(data) {
  const radius = Math.min(width, height) / 2;
  const arc = d3.arc()
    .innerRadius(radius * 0.5)  // Donut
    .outerRadius(radius * 0.8);

  const labelArc = d3.arc()
    .innerRadius(radius * 0.85)
    .outerRadius(radius * 0.85);

  const pie = d3.pie()
    .value(d => d.value)
    .sort(null);

  const arcs = g.selectAll("g.arc")
    .data(pie(data))
    .join("g")
    .attr("class", "arc");

  arcs.append("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data.category));

  // Direct labels
  arcs.append("text")
    .attr("transform", d => `translate(${labelArc.centroid(d)})`)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => {
      const midAngle = (d.startAngle + d.endAngle) / 2;
      return midAngle < Math.PI ? "start" : "end";
    })
    .attr("font-size", "11px")
    .text(d => d.data.category);

  // Value inside slice (if large enough)
  arcs.filter(d => d.endAngle - d.startAngle > 0.3)
    .append("text")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", "10px")
    .text(d => d3.format(".0%")(d.value / d3.sum(data, d => d.value)));
}
```

---

## Leader Lines

When labels must be offset from their data points:

```javascript
function labelsWithLeaders(data) {
  const labelGroups = g.selectAll("g.label-group")
    .data(data)
    .join("g")
    .attr("class", "label-group");

  // Leader line
  labelGroups.append("line")
    .attr("x1", d => x(d.x))
    .attr("y1", d => y(d.y))
    .attr("x2", d => d.labelX)
    .attr("y2", d => d.labelY)
    .attr("stroke", "#999")
    .attr("stroke-width", 0.5);

  // Small dot at data point
  labelGroups.append("circle")
    .attr("cx", d => x(d.x))
    .attr("cy", d => y(d.y))
    .attr("r", 2)
    .attr("fill", "#666");

  // Label text
  labelGroups.append("text")
    .attr("x", d => d.labelX)
    .attr("y", d => d.labelY)
    .attr("text-anchor", d => d.labelAnchor)
    .attr("font-size", "10px")
    .attr("fill", "#333")
    .text(d => d.label);
}
```

---

## Typography Best Practices

```javascript
// Label styling for readability
const labelStyle = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "11px",
  fontWeight: "500",
  letterSpacing: "0.01em"
};

// Apply to labels
labels
  .style("font-family", labelStyle.fontFamily)
  .style("font-size", labelStyle.fontSize)
  .style("font-weight", labelStyle.fontWeight)
  .style("letter-spacing", labelStyle.letterSpacing);

// Text shadow for contrast (use sparingly)
labels.style("text-shadow", "0 1px 1px rgba(255,255,255,0.8)");

// Or SVG shadow filter
svg.append("defs").append("filter")
  .attr("id", "text-shadow")
  .append("feDropShadow")
  .attr("dx", 0)
  .attr("dy", 0)
  .attr("stdDeviation", 1)
  .attr("flood-color", "white")
  .attr("flood-opacity", 0.8);

labels.attr("filter", "url(#text-shadow)");
```

---

## CSS for Direct Labels

```css
/* Base label styling */
.direct-label {
  font-family: Inter, system-ui, sans-serif;
  font-size: 11px;
  font-weight: 500;
  fill: #333;
  pointer-events: none; /* Don't interfere with interactions */
}

/* Series labels (colored to match data) */
.series-label {
  font-weight: 600;
}

/* Value labels */
.value-label {
  font-variant-numeric: tabular-nums; /* Align numbers */
}

/* Labels inside dark elements */
.label-inside {
  fill: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

/* De-emphasized secondary labels */
.label-secondary {
  font-size: 9px;
  font-weight: 400;
  fill: #666;
}
```

---

## Checklist

Before shipping visualizations:

- [ ] Can series/categories be labeled directly instead of legend?
- [ ] Are labels positioned to minimize eye movement?
- [ ] Do labels use same color as their data elements?
- [ ] Is overlap handled gracefully (repositioning or selective labeling)?
- [ ] Are labels readable (sufficient size, contrast, font weight)?
- [ ] Do leader lines exist where needed for offset labels?
- [ ] Is label density appropriate (not cluttered)?
- [ ] Are values formatted appropriately (commas, percentages, units)?

**Goal:** Viewer should never need to consult a legend to understand the data.

---

## Quick Decision Tree

```
Can I label directly?
├─ < 5 series → YES, always label directly
├─ 5-10 series → TRY label placement algorithm
│   ├─ Labels fit without major overlap → Label directly
│   └─ Labels overlap badly → Use legend + highlight on hover
├─ > 10 series → Use legend + interactive highlighting
└─ Animated data → Use legend (labels would flicker)
```

