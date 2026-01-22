# Data-Ink Ratio: Deep Dive

## The Principle

> "A large share of ink on a graphic should present data-information, the ink changing as the data change. Data-ink is the non-erasable core of a graphic, the non-redundant ink arranged in response to variation in the numbers represented."
> — Edward Tufte, *The Visual Display of Quantitative Information*

```
Data-Ink Ratio = Data-Ink / Total Ink Used in Graphic
```

**Goal:** Maximize this ratio. Every drop of ink should have a reason.

---

## The Erasure Test

For every element in your visualization, ask:

1. **Would removing this lose information?**
   - If NO → Remove it
   - If YES → Keep it, but consider if it can be lighter/smaller

2. **Is this redundant with something else?**
   - Same data encoded twice (color AND label AND position) → Reduce to one
   - Gridline at same position as axis → Remove one

---

## Common Non-Data Ink (Remove or Minimize)

### Heavy Gridlines

```javascript
// BAD: Prominent gridlines compete with data
g.append("g")
  .attr("class", "grid")
  .call(d3.axisLeft(y)
    .tickSize(-width)
    .tickFormat("")
  )
  .attr("stroke", "#666")
  .attr("stroke-width", 1);

// GOOD: Subtle gridlines support without competing
g.append("g")
  .attr("class", "grid")
  .call(d3.axisLeft(y)
    .tickSize(-width)
    .tickFormat("")
  )
  .call(g => g.selectAll("line")
    .attr("stroke", "#e5e5e5")
    .attr("stroke-width", 0.5))
  .call(g => g.select(".domain").remove());

// BEST: Remove gridlines entirely if data is clear
// Let the data speak for itself
```

### Axis Lines (Domain)

```javascript
// The axis "domain" line is often redundant
// Data bars or points already define the space

// Remove axis lines
svg.selectAll(".domain").remove();

// Or style axes to de-emphasize
g.append("g")
  .call(d3.axisLeft(y))
  .call(g => g.select(".domain")
    .attr("stroke", "#ccc"))  // Lighter if kept
  .call(g => g.selectAll(".tick line")
    .attr("stroke", "#ccc"));
```

### Borders and Boxes

```javascript
// BAD: Box around chart adds nothing
svg.append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", width)
  .attr("height", height)
  .attr("fill", "none")
  .attr("stroke", "#000");

// GOOD: No border - let data define the space
// The axes and data points implicitly bound the area
```

### Backgrounds

```javascript
// BAD: Colored background doesn't encode data
svg.append("rect")
  .attr("fill", "#f5f5f5")
  .attr("width", width)
  .attr("height", height);

// GOOD: White or transparent background
// Let the page/container provide context
```

### Tick Marks

```javascript
// BAD: Ticks + gridlines = redundant
d3.axisBottom(x)
  .tickSize(6)  // Tick marks
// Plus gridlines extending across chart

// GOOD: Choose one or the other
d3.axisBottom(x)
  .tickSize(0)  // No ticks, use gridlines

// OR
d3.axisBottom(x)
  .tickSize(6)  // Ticks only, no gridlines
```

---

## Before & After: Bar Chart

### Before (Low Data-Ink Ratio)

```javascript
// ~40% data-ink ratio
const svg = d3.select("#chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

// Background
svg.append("rect")
  .attr("fill", "#f0f0f0")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Border
g.append("rect")
  .attr("fill", "none")
  .attr("stroke", "#999")
  .attr("stroke-width", 2)
  .attr("width", width)
  .attr("height", height);

// Heavy gridlines
g.append("g")
  .call(d3.axisLeft(y).tickSize(-width))
  .call(g => g.selectAll("line")
    .attr("stroke", "#999")
    .attr("stroke-width", 1));

// Bars with borders and shadows
g.selectAll("rect.bar")
  .data(data)
  .join("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.category))
    .attr("y", d => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.value))
    .attr("fill", "steelblue")
    .attr("stroke", "#000")
    .attr("stroke-width", 1)
    .style("filter", "drop-shadow(2px 2px 2px #666)");

// Full axes with domain lines
g.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x));

g.append("g")
  .call(d3.axisLeft(y));
```

### After (High Data-Ink Ratio)

```javascript
// ~85% data-ink ratio
const svg = d3.select("#chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Subtle gridlines only
g.append("g")
  .call(d3.axisLeft(y)
    .tickSize(-width)
    .tickFormat(""))
  .call(g => g.selectAll("line")
    .attr("stroke", "#e5e5e5")
    .attr("stroke-width", 0.5))
  .call(g => g.select(".domain").remove());

// Clean bars - no borders, no shadows
g.selectAll("rect")
  .data(data)
  .join("rect")
    .attr("x", d => x(d.category))
    .attr("y", d => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.value))
    .attr("fill", "steelblue");

// Minimal axes
g.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x).tickSize(0))
  .call(g => g.select(".domain").remove());

g.append("g")
  .call(d3.axisLeft(y).ticks(5))
  .call(g => g.select(".domain").remove())
  .call(g => g.selectAll(".tick line").remove());
```

---

## Before & After: Line Chart

### Before

```javascript
// Multiple redundant encodings
lines.attr("stroke", d => color(d.series))
     .attr("stroke-width", 3)
     .attr("stroke-dasharray", d => dash(d.series));  // Redundant with color

// Plus legend repeating the same information
svg.append("g")
  .attr("class", "legend")
  // ... builds legend with color AND dash pattern AND label
```

### After

```javascript
// Direct labeling replaces legend
lines.attr("stroke", d => color(d.series))
     .attr("stroke-width", 2);

// Label at end of each line
g.selectAll(".line-label")
  .data(series)
  .join("text")
    .attr("x", d => x(d.values[d.values.length - 1].date) + 5)
    .attr("y", d => y(d.values[d.values.length - 1].value))
    .attr("dy", "0.35em")
    .attr("fill", d => color(d.name))
    .text(d => d.name);

// No legend needed - information is at the data
```

---

## Quantifying Data-Ink Ratio

While exact measurement is impractical, you can estimate:

### Pixel Counting Approach

```javascript
// Conceptual - count pixels by type
function estimateDataInkRatio(svg) {
  const totalPixels = svg.width * svg.height;

  // Data pixels: bars, lines, points, data labels
  const dataElements = svg.querySelectorAll('rect.bar, path.line, circle.point, text.value');
  let dataPixels = 0;
  dataElements.forEach(el => {
    const bbox = el.getBBox();
    dataPixels += bbox.width * bbox.height;
  });

  // Non-data pixels: axes, gridlines, legends, borders, backgrounds
  // (everything else)

  return dataPixels / totalPixels;
}
```

### Practical Assessment

| Element | Data-Ink? | Action |
|---------|-----------|--------|
| Bar heights | Yes | Keep |
| Bar fills | Yes (if encoding data) | Keep |
| Bar borders | No | Remove |
| Bar shadows | No | Remove |
| Axis labels | Yes (identify data) | Keep |
| Axis lines | Debatable | Lighten or remove |
| Gridlines | Debatable | Lighten significantly |
| Legend | Partial | Replace with direct labels |
| Title | Yes (if informative) | Keep if adds insight |
| Background color | No | Remove |
| Decorative images | No | Remove |

---

## The Sparkline: Maximum Data-Ink

Tufte's sparklines achieve near-perfect data-ink ratio:

```javascript
function sparkline(data, { width = 100, height = 20 } = {}) {
  const x = d3.scaleLinear()
    .domain([0, data.length - 1])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data))
    .range([height, 0]);

  const line = d3.line()
    .x((d, i) => x(i))
    .y(d => y(d));

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("overflow", "visible");

  // Just the line - nothing else
  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1)
    .attr("d", line);

  // Optional: highlight endpoints
  svg.append("circle")
    .attr("cx", x(data.length - 1))
    .attr("cy", y(data[data.length - 1]))
    .attr("r", 2)
    .attr("fill", "steelblue");

  return svg.node();
}

// No axes, no gridlines, no legend, no title
// Just data. ~99% data-ink ratio.
```

---

## CSS for High Data-Ink Ratio

```css
/* Default to invisible non-data elements */
.axis .domain {
  display: none;
}

.axis .tick line {
  stroke: #e5e5e5;
  stroke-width: 0.5;
}

.axis .tick text {
  fill: #666;
  font-size: 11px;
}

.grid line {
  stroke: #f0f0f0;
  stroke-width: 0.5;
}

.grid .domain {
  display: none;
}

/* No chart borders */
.chart-container {
  border: none;
  background: transparent;
}

/* Data elements are prominent */
.bar, .line, .point {
  /* Let fills/strokes define the data */
}
```

---

## Checklist

Before shipping a visualization:

- [ ] Can I remove the axis domain lines?
- [ ] Can I lighten or remove gridlines?
- [ ] Can I remove tick marks (use gridlines or nothing)?
- [ ] Can I remove the border/box around the chart?
- [ ] Is the background adding information? (Usually no)
- [ ] Can I replace the legend with direct labels?
- [ ] Are there redundant encodings (color AND shape AND pattern)?
- [ ] Is there any decorative element that doesn't encode data?

**Target:** Aim for 70%+ data-ink ratio on production visualizations.
