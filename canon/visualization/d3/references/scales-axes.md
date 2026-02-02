# Scales, Axes, and the Margin Convention

Bostock's patterns for the foundational elements of any D3 visualization.

## The Margin Convention

The standard pattern for chart layout:

```javascript
// 1. Define outer dimensions (total SVG size)
const width = 960;
const height = 500;

// 2. Define margins
const margin = {top: 20, right: 30, bottom: 30, left: 40};

// 3. Calculate inner dimensions (chart area)
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

// 4. Create SVG with outer dimensions
const svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height);

// 5. Create translated group for chart content
const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 6. Use innerWidth/innerHeight for scales
const x = d3.scaleLinear()
    .domain([0, 100])
    .range([0, innerWidth]);

const y = d3.scaleLinear()
    .domain([0, 100])
    .range([innerHeight, 0]);  // Note: inverted for SVG coordinates
```

### Why This Pattern?

- Separates chart content from axes/labels
- Axes naturally positioned at margins
- Easy to adjust spacing without recalculating scales
- Consistent pattern across all visualizations

## Scale Types

### Linear Scale
```javascript
const x = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.value)])  // Data space
  .range([0, innerWidth]);                   // Pixel space

x(50);       // Returns pixel position for value 50
x.invert(400);  // Returns data value at pixel 400
```

### Band Scale (Categorical)
```javascript
const x = d3.scaleBand()
  .domain(data.map(d => d.category))  // Array of categories
  .range([0, innerWidth])
  .padding(0.1)       // Gap between bands (0-1)
  .paddingInner(0.1)  // Inner padding only
  .paddingOuter(0.05); // Outer padding only

x("Category A");   // Returns left edge of band
x.bandwidth();     // Returns width of each band
```

### Point Scale (Categorical without width)
```javascript
const x = d3.scalePoint()
  .domain(categories)
  .range([0, innerWidth])
  .padding(0.5);  // Padding at edges

x("Category A");  // Returns center point position
x.step();         // Returns distance between points
```

### Time Scale
```javascript
const x = d3.scaleTime()
  .domain([new Date(2020, 0, 1), new Date(2024, 0, 1)])
  .range([0, innerWidth]);

x(new Date(2022, 6, 1));  // Returns pixel position for date
x.ticks(d3.timeMonth.every(3));  // Quarterly ticks
```

### Log Scale
```javascript
const y = d3.scaleLog()
  .domain([1, 1000])  // Must not include 0!
  .range([innerHeight, 0])
  .base(10);
```

### Power Scale
```javascript
const r = d3.scalePow()
  .exponent(0.5)  // Square root for area perception
  .domain([0, 100])
  .range([0, 50]);
```

### Ordinal Color Scale
```javascript
const color = d3.scaleOrdinal()
  .domain(["A", "B", "C"])
  .range(["#e41a1c", "#377eb8", "#4daf4a"]);

// Or use built-in schemes
const color = d3.scaleOrdinal(d3.schemeCategory10);
```

### Sequential Color Scale
```javascript
const color = d3.scaleSequential()
  .domain([0, 100])
  .interpolator(d3.interpolateBlues);

// Or
const color = d3.scaleSequential(d3.interpolateViridis)
  .domain([0, d3.max(data, d => d.value)]);
```

### Diverging Color Scale
```javascript
const color = d3.scaleDiverging()
  .domain([-10, 0, 10])  // [min, center, max]
  .interpolator(d3.interpolateRdBu);
```

### Quantize Scale (Continuous to Discrete)
```javascript
const color = d3.scaleQuantize()
  .domain([0, 100])
  .range(["#f7fbff", "#6baed6", "#08306b"]);  // 3 buckets

color(25);  // Returns color for first third
color(50);  // Returns color for middle third
color(75);  // Returns color for last third
```

### Threshold Scale
```javascript
const color = d3.scaleThreshold()
  .domain([0, 50, 100])  // Breakpoints
  .range(["red", "yellow", "green", "blue"]);

color(-10);  // "red" (below 0)
color(25);   // "yellow" (0-50)
color(75);   // "green" (50-100)
color(150);  // "blue" (above 100)
```

## Scale Methods

### .nice()
Round domain to nice values:

```javascript
const y = d3.scaleLinear()
  .domain([0.123, 97.456])
  .range([innerHeight, 0])
  .nice();  // Domain becomes [0, 100]
```

### .clamp()
Constrain output to range:

```javascript
const x = d3.scaleLinear()
  .domain([0, 100])
  .range([0, 500])
  .clamp(true);

x(150);  // Returns 500 (clamped), not 750
```

### .ticks()
Generate tick values:

```javascript
const x = d3.scaleLinear().domain([0, 100]).range([0, 500]);
x.ticks(5);  // [0, 20, 40, 60, 80, 100]
x.ticks(10); // [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
```

### .tickFormat()
Format tick labels:

```javascript
x.tickFormat(5, "$.2f");  // "$0.00", "$20.00", etc.
x.tickFormat(5, "%");     // "0%", "20%", etc.
```

## Axes

### Basic Axis Creation
```javascript
// Create axis generators
const xAxis = d3.axisBottom(x);
const yAxis = d3.axisLeft(y);

// Render axes
g.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0,${innerHeight})`)
  .call(xAxis);

g.append("g")
  .attr("class", "y-axis")
  .call(yAxis);
```

### Axis Orientations
```javascript
d3.axisTop(scale)     // Ticks above line
d3.axisRight(scale)   // Ticks right of line
d3.axisBottom(scale)  // Ticks below line
d3.axisLeft(scale)    // Ticks left of line
```

### Customizing Axes
```javascript
const xAxis = d3.axisBottom(x)
  .ticks(5)                    // Approximate number of ticks
  .tickValues([0, 25, 50, 100]) // Exact tick positions
  .tickFormat(d3.format("$,d")) // Format labels
  .tickSize(6)                  // Tick line length
  .tickSizeInner(6)             // Inner tick length
  .tickSizeOuter(0)             // Outer tick length (domain ends)
  .tickPadding(3);              // Space between tick and label
```

### Time Axis Formatting
```javascript
const xAxis = d3.axisBottom(x)
  .ticks(d3.timeMonth.every(3))  // Quarterly
  .tickFormat(d3.timeFormat("%b %Y"));

// Multi-scale time format
const formatTime = d3.timeFormat("%b %d");
const formatMonth = d3.timeFormat("%B");
const formatYear = d3.timeFormat("%Y");

const xAxis = d3.axisBottom(x)
  .tickFormat(date => {
    if (d3.timeYear(date) < date) {
      return d3.timeMonth(date) < date ? formatTime(date) : formatMonth(date);
    }
    return formatYear(date);
  });
```

### Updating Axes with Transitions
```javascript
// Initial render
const xAxisG = g.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0,${innerHeight})`)
  .call(xAxis);

// Update with transition
function update(newData) {
  x.domain([0, d3.max(newData, d => d.value)]);

  xAxisG.transition()
    .duration(750)
    .call(xAxis);
}
```

### Grid Lines
```javascript
// X grid lines
g.append("g")
  .attr("class", "grid")
  .attr("transform", `translate(0,${innerHeight})`)
  .call(d3.axisBottom(x)
    .tickSize(-innerHeight)
    .tickFormat("")
  );

// Style with CSS
.grid line {
  stroke: #e0e0e0;
  stroke-opacity: 0.7;
}
.grid path {
  stroke-width: 0;  // Hide domain line
}
```

### Axis Labels
```javascript
// X axis label
g.append("text")
  .attr("class", "x-label")
  .attr("x", innerWidth / 2)
  .attr("y", innerHeight + margin.bottom - 5)
  .attr("text-anchor", "middle")
  .text("Value ($)");

// Y axis label (rotated)
g.append("text")
  .attr("class", "y-label")
  .attr("transform", "rotate(-90)")
  .attr("x", -innerHeight / 2)
  .attr("y", -margin.left + 15)
  .attr("text-anchor", "middle")
  .text("Frequency");
```

## Responsive Scales

```javascript
function resize() {
  const width = container.clientWidth;
  const height = container.clientHeight;

  svg.attr("width", width).attr("height", height);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Update scale ranges (domains stay same)
  x.range([0, innerWidth]);
  y.range([innerHeight, 0]);

  // Update axes
  xAxisG.call(xAxis);
  yAxisG.call(yAxis);

  // Update elements
  bars.attr("x", d => x(d.category))
      .attr("width", x.bandwidth());
}

window.addEventListener("resize", resize);
```

## ViewBox for Responsive SVG

Alternative to manual resize:

```javascript
const svg = d3.select("#chart").append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet");

// SVG scales automatically with container
// No need to update scales on resize
```

## Common Patterns

### Inverted Y Scale
SVG y-coordinates increase downward, but data often increases upward:

```javascript
const y = d3.scaleLinear()
  .domain([0, max])
  .range([innerHeight, 0]);  // Inverted!
```

### Padding for Points
Leave room at edges:

```javascript
const x = d3.scaleLinear()
  .domain(d3.extent(data, d => d.x))
  .range([0, innerWidth])
  .nice();

// Add explicit padding
const padding = 20;
const x = d3.scaleLinear()
  .domain(d3.extent(data, d => d.x))
  .range([padding, innerWidth - padding]);
```

### Color Scale for Diverging Data
```javascript
const color = d3.scaleSequential()
  .domain([
    d3.min(data, d => d.change),
    d3.max(data, d => d.change)
  ])
  .interpolator(t => d3.interpolateRdYlGn(1 - t));  // Red=bad, Green=good
```
