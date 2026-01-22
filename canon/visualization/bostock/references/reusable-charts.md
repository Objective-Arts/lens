# Reusable Charts: The Closure Pattern

From Bostock's "Towards Reusable Charts" - the canonical pattern for D3 components.

## The Core Pattern

Charts are closures that return functions:

```javascript
function chart() {
  // 1. Configuration variables (closure scope)
  let width = 720;
  let height = 80;
  let margin = {top: 20, right: 30, bottom: 30, left: 40};

  // 2. The chart function (called on selection)
  function my(selection) {
    selection.each(function(data) {
      // Build visualization using configuration and data
      const svg = d3.select(this)
        .selectAll("svg")
        .data([data])
        .join("svg")
        .attr("width", width)
        .attr("height", height);

      // ... rest of chart implementation
    });
  }

  // 3. Getter-setter methods
  my.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    return my;  // Enable chaining
  };

  my.height = function(value) {
    if (!arguments.length) return height;
    height = value;
    return my;
  };

  my.margin = function(value) {
    if (!arguments.length) return margin;
    margin = value;
    return my;
  };

  // 4. Return the chart function
  return my;
}
```

## Usage Pattern

```javascript
// Create and configure
const myChart = chart()
  .width(500)
  .height(300)
  .margin({top: 10, right: 10, bottom: 30, left: 40});

// Apply to selection with data
d3.select("#container")
  .datum(data)
  .call(myChart);

// Update configuration and re-render
myChart.width(800);
d3.select("#container").call(myChart);

// Inspect current values
console.log(myChart.width());  // 800
```

## Why Closures Over Classes?

Bostock prefers functional patterns over class-based OOP:

```javascript
// AVOID: Class-based approach
class Chart {
  constructor(config) {
    this.width = config.width || 720;
  }
  render(selection) { ... }
}
new Chart({width: 500}).render(d3.select("#viz"));

// PREFER: Closure-based approach
function chart() {
  let width = 720;
  function my(selection) { ... }
  my.width = function(v) { ... };
  return my;
}
chart().width(500)(d3.select("#viz"));
```

Benefits of closures:
- Consistent with D3's API style (scales, axes use same pattern)
- Works naturally with `selection.call()`
- No `this` binding confusion
- Method chaining feels natural
- Private state without `_` conventions

## Complete Bar Chart Example

```javascript
function barChart() {
  // Configuration
  let width = 720;
  let height = 400;
  let margin = {top: 20, right: 20, bottom: 30, left: 40};
  let x = d => d.name;
  let y = d => d.value;
  let xLabel = "";
  let yLabel = "";
  let color = "steelblue";

  function chart(selection) {
    selection.each(function(data) {
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // Scales
      const xScale = d3.scaleBand()
        .domain(data.map(x))
        .range([0, innerWidth])
        .padding(0.1);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, y)])
        .nice()
        .range([innerHeight, 0]);

      // SVG container
      const svg = d3.select(this)
        .selectAll("svg")
        .data([data])
        .join("svg")
        .attr("width", width)
        .attr("height", height);

      // Chart area
      const g = svg.selectAll("g.chart")
        .data([data])
        .join("g")
        .attr("class", "chart")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Bars
      g.selectAll("rect.bar")
        .data(data, x)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(x(d)))
        .attr("y", d => yScale(y(d)))
        .attr("width", xScale.bandwidth())
        .attr("height", d => innerHeight - yScale(y(d)))
        .attr("fill", color);

      // X Axis
      g.selectAll("g.x-axis")
        .data([null])
        .join("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale));

      // Y Axis
      g.selectAll("g.y-axis")
        .data([null])
        .join("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));
    });
  }

  // Getter-setters
  chart.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) return height;
    height = value;
    return chart;
  };

  chart.margin = function(value) {
    if (!arguments.length) return margin;
    margin = {...margin, ...value};
    return chart;
  };

  chart.x = function(value) {
    if (!arguments.length) return x;
    x = value;
    return chart;
  };

  chart.y = function(value) {
    if (!arguments.length) return y;
    y = value;
    return chart;
  };

  chart.color = function(value) {
    if (!arguments.length) return color;
    color = value;
    return chart;
  };

  return chart;
}
```

Usage:

```javascript
const myBarChart = barChart()
  .width(600)
  .height(400)
  .x(d => d.category)
  .y(d => d.count)
  .color("#e74c3c");

d3.select("#viz")
  .datum(salesData)
  .call(myBarChart);
```

## Adding Events and Callbacks

```javascript
function chart() {
  let width = 720;
  let onClick = () => {};  // Default no-op
  let onHover = () => {};

  function my(selection) {
    selection.each(function(data) {
      // ... setup ...

      bars.on("click", function(event, d) {
        onClick.call(this, event, d);
      })
      .on("mouseenter", function(event, d) {
        onHover.call(this, event, d, true);
      })
      .on("mouseleave", function(event, d) {
        onHover.call(this, event, d, false);
      });
    });
  }

  my.onClick = function(value) {
    if (!arguments.length) return onClick;
    onClick = value;
    return my;
  };

  my.onHover = function(value) {
    if (!arguments.length) return onHover;
    onHover = value;
    return my;
  };

  return my;
}

// Usage
chart()
  .onClick((event, d) => console.log("Clicked:", d))
  .onHover((event, d, isHovering) => {
    tooltip.style("display", isHovering ? "block" : "none");
  });
```

## Composing Multiple Components

```javascript
function dashboard() {
  let barChart = null;
  let lineChart = null;
  let data = [];

  function my(selection) {
    selection.each(function() {
      const container = d3.select(this);

      // Bar chart panel
      container.select(".bar-panel")
        .datum(data.categories)
        .call(barChart);

      // Line chart panel
      container.select(".line-panel")
        .datum(data.timeseries)
        .call(lineChart);
    });
  }

  my.barChart = function(value) {
    if (!arguments.length) return barChart;
    barChart = value;
    return my;
  };

  my.lineChart = function(value) {
    if (!arguments.length) return lineChart;
    lineChart = value;
    return my;
  };

  my.data = function(value) {
    if (!arguments.length) return data;
    data = value;
    return my;
  };

  return my;
}

// Usage
const myDashboard = dashboard()
  .barChart(barChart().width(400))
  .lineChart(lineChart().width(400))
  .data(dashboardData);

d3.select("#dashboard").call(myDashboard);
```

## Adding Transitions

```javascript
function chart() {
  let duration = 750;
  let ease = d3.easeCubicInOut;

  function my(selection) {
    selection.each(function(data) {
      const bars = g.selectAll("rect")
        .data(data, d => d.id);

      // Enter
      bars.enter().append("rect")
        .attr("y", innerHeight)
        .attr("height", 0)
        .merge(bars)  // Enter + Update
        .transition()
        .duration(duration)
        .ease(ease)
        .attr("y", d => yScale(d.value))
        .attr("height", d => innerHeight - yScale(d.value));

      // Exit
      bars.exit()
        .transition()
        .duration(duration)
        .attr("y", innerHeight)
        .attr("height", 0)
        .remove();
    });
  }

  my.duration = function(value) {
    if (!arguments.length) return duration;
    duration = value;
    return my;
  };

  my.ease = function(value) {
    if (!arguments.length) return ease;
    ease = value;
    return my;
  };

  return my;
}
```

## TypeScript Version

```typescript
interface ChartConfig {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

interface ChartAPI {
  (selection: d3.Selection<HTMLElement, unknown, null, undefined>): void;
  width(): number;
  width(value: number): ChartAPI;
  height(): number;
  height(value: number): ChartAPI;
}

function chart(): ChartAPI {
  let width = 720;
  let height = 400;

  const my: ChartAPI = function(selection) {
    selection.each(function(data) {
      // Implementation
    });
  } as ChartAPI;

  my.width = function(value?: number): any {
    if (value === undefined) return width;
    width = value;
    return my;
  };

  my.height = function(value?: number): any {
    if (value === undefined) return height;
    height = value;
    return my;
  };

  return my;
}
```

## Design Guidelines

From Bostock:

1. **Sensible defaults** - Charts should work without configuration
2. **Expose what matters** - Not everything needs a getter-setter
3. **Consistent naming** - Follow D3 conventions (width, height, margin)
4. **Enable method chaining** - Always return `this` from setters
5. **Use accessors for data** - `x(d => d.date)` not `xField: "date"`
6. **Keep state minimal** - Derive what you can, store what you must
