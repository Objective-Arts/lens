# Observable Plot: When to Use It vs D3

## What is Observable Plot?

Observable Plot is a **high-level visualization library** built on top of D3 by Mike Bostock and the Observable team. Released in 2021, it represents Bostock's answer to the question: "What if we kept D3's grammar of graphics but made common charts easy?"

> "Plot lets you get from data to insight faster, while D3 gives you complete control." — Observable Team

---

## The Key Decision: Plot vs D3

### Use Observable Plot When:
- Creating standard chart types quickly
- Exploring data interactively
- Prototyping visualizations
- Building dashboards with common chart forms
- Time matters more than customization
- You want sensible defaults

### Use D3 When:
- Building custom, non-standard visualizations
- Needing complex animations/transitions
- Requiring precise control over every element
- Integrating with specific framework patterns (React, Angular)
- Performance is critical (Canvas, WebGL)
- Creating reusable components for a design system

---

## Decision Matrix

| Scenario | Recommendation |
|----------|---------------|
| Quick bar chart | **Plot** |
| Line chart with standard axes | **Plot** |
| Scatter plot with facets | **Plot** |
| Custom force-directed network | **D3** |
| Animated data transitions | **D3** |
| Complex interlinked dashboards | **D3** |
| Exploratory data analysis | **Plot** |
| Production component library | **D3** |
| One-off report visualization | **Plot** |
| Real-time streaming chart | **D3** |
| Sankey/chord diagram | **D3** |
| Heatmap with standard layout | **Plot** |
| Custom radial visualization | **D3** |

---

## Observable Plot Basics

### Installation
```bash
npm install @observablehq/plot
```

### Simple Bar Chart
```javascript
import * as Plot from "@observablehq/plot";

// Plot creates SVG automatically
const chart = Plot.plot({
  marks: [
    Plot.barY(data, {x: "category", y: "value"})
  ]
});

document.getElementById("chart").appendChild(chart);
```

Compare to D3:
```javascript
// D3 requires explicit setup
const svg = d3.select("#chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleBand()
  .domain(data.map(d => d.category))
  .range([0, width])
  .padding(0.2);

const y = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.value)])
  .range([height, 0]);

g.selectAll("rect")
  .data(data)
  .join("rect")
  .attr("x", d => x(d.category))
  .attr("y", d => y(d.value))
  .attr("width", x.bandwidth())
  .attr("height", d => height - y(d.value))
  .attr("fill", "steelblue");

// ... axes, labels, etc.
```

### Plot's Concise API

```javascript
// Line chart
Plot.plot({
  marks: [
    Plot.line(data, {x: "date", y: "value"})
  ]
});

// Multi-series line chart
Plot.plot({
  color: {legend: true},
  marks: [
    Plot.line(data, {x: "date", y: "value", stroke: "series"})
  ]
});

// Scatter plot with facets
Plot.plot({
  facet: {data, x: "region"},
  marks: [
    Plot.dot(data, {x: "income", y: "lifeExpectancy", fill: "continent"})
  ]
});

// Histogram
Plot.plot({
  marks: [
    Plot.rectY(data, Plot.binX({y: "count"}, {x: "age"}))
  ]
});

// Heatmap
Plot.plot({
  color: {scheme: "Blues"},
  marks: [
    Plot.cell(data, {x: "day", y: "hour", fill: "value"})
  ]
});
```

---

## Plot's Strengths

### 1. Sensible Defaults
Plot automatically handles:
- Axis labels and formatting
- Appropriate scales based on data types
- Color schemes
- Margins
- Legends

### 2. Concise Transforms
```javascript
// Group and aggregate
Plot.plot({
  marks: [
    Plot.barY(data, Plot.groupX({y: "mean"}, {x: "category", y: "value"}))
  ]
});

// Bin continuous data
Plot.plot({
  marks: [
    Plot.rectY(data, Plot.binX({y: "count"}, {x: "temperature"}))
  ]
});

// Stack
Plot.plot({
  marks: [
    Plot.barY(data, Plot.stackY({x: "year", y: "revenue", fill: "product"}))
  ]
});
```

### 3. Faceting (Small Multiples)
```javascript
Plot.plot({
  facet: {
    data,
    x: "region",
    y: "year"
  },
  marks: [
    Plot.line(data, {x: "month", y: "sales"})
  ]
});
```

### 4. Built-in Statistical Marks
```javascript
// Regression line
Plot.plot({
  marks: [
    Plot.dot(data, {x: "x", y: "y"}),
    Plot.linearRegressionY(data, {x: "x", y: "y"})
  ]
});

// Box plot
Plot.plot({
  marks: [
    Plot.boxY(data, {x: "category", y: "value"})
  ]
});
```

---

## Plot's Limitations

### What Plot Can't Do (Use D3 Instead)

1. **Complex Animations**
   - Plot generates static SVG
   - No enter/update/exit transitions
   - Use D3 for animated data updates

2. **Custom Interaction**
   - Plot supports basic tooltips
   - Complex interactions need D3 selections

3. **Non-Standard Layouts**
   - Force layouts
   - Custom radial charts
   - Sankey diagrams
   - Chord diagrams

4. **Canvas/WebGL Rendering**
   - Plot outputs SVG only
   - Use D3 + D3FC for performance

5. **Framework Integration**
   - Plot manages its own DOM
   - D3 integrates better with React/Vue/Angular patterns

---

## Hybrid Approach

You can use Plot for quick exploration, then migrate to D3 for production:

### Exploration Phase (Plot)
```javascript
// Quick iteration on chart design
const chart = Plot.plot({
  marks: [
    Plot.dot(data, {x: "metric1", y: "metric2", fill: "category"}),
    Plot.tip(data, Plot.pointer({x: "metric1", y: "metric2"}))
  ]
});
```

### Production Phase (D3)
```javascript
// Convert to D3 for animations, interactions, framework integration
function ScatterChart({ data }) {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    // Full D3 implementation with transitions, events, etc.
  }, [data]);

  return <svg ref={svgRef} />;
}
```

---

## Using Plot in Observable Notebooks

Plot was designed for Observable notebooks, where it shines:

```javascript
// In Observable, this just works
Plot.plot({
  marks: [
    Plot.line(await FileAttachment("data.csv").csv({typed: true}),
      {x: "date", y: "value"})
  ]
})
```

Benefits in Observable:
- Reactive cells automatically re-render
- Easy data loading
- Live preview as you type
- Shareable notebooks

---

## Plot in Standalone Projects

### Vanilla JavaScript
```javascript
import * as Plot from "@observablehq/plot";

async function main() {
  const data = await d3.csv("data.csv", d3.autoType);

  const chart = Plot.plot({
    width: 800,
    height: 400,
    marks: [
      Plot.line(data, {x: "date", y: "value"})
    ]
  });

  document.getElementById("container").appendChild(chart);
}

main();
```

### React
```jsx
import * as Plot from "@observablehq/plot";
import { useEffect, useRef } from "react";

function LineChart({ data }) {
  const containerRef = useRef();

  useEffect(() => {
    const chart = Plot.plot({
      marks: [
        Plot.line(data, {x: "date", y: "value"})
      ]
    });

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(chart);

    return () => chart.remove();
  }, [data]);

  return <div ref={containerRef} />;
}
```

### Angular
```typescript
import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import * as Plot from '@observablehq/plot';

@Component({
  selector: 'app-plot-chart',
  template: '<div #container></div>',
  standalone: true
})
export class PlotChartComponent implements OnChanges {
  @Input() data: any[] = [];
  @ViewChild('container', { static: true }) container!: ElementRef;

  ngOnChanges() {
    const chart = Plot.plot({
      marks: [
        Plot.barY(this.data, {x: 'category', y: 'value'})
      ]
    });

    this.container.nativeElement.innerHTML = '';
    this.container.nativeElement.appendChild(chart);
  }
}
```

---

## Summary: The Bostock Philosophy Evolution

| Era | Tool | Philosophy |
|-----|------|------------|
| 2009 | Protovis | Declarative marks, but limited |
| 2011 | D3.js | Low-level power, unlimited expressiveness |
| 2021 | Observable Plot | High-level convenience, fast exploration |

**Bostock's recommendation:**
- Use **Plot** for the 80% of charts that are standard
- Use **D3** for the 20% that need full control
- They work together, not in competition

---

## Resources

- [Observable Plot Documentation](https://observablehq.com/plot/)
- [Plot for D3 Users](https://observablehq.com/@observablehq/plot-for-d3-users)
- [Plot Examples](https://observablehq.com/@observablehq/plot-gallery)
- [Observable Framework](https://observablehq.com/framework/) (includes Plot)
