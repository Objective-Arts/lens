# /d3 Summary

> "D3 embraces web standards rather than hiding them."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Representation transparency** | Work with DOM/SVG/Canvas directly, not abstractions |
| **Expressiveness over convenience** | Low-level primitives you compose, no ceiling |
| **Data-driven documents** | Bind data to elements, derive attributes from data |
| **Minimalism** | Every visual element serves a purpose |

## Data Join Pattern

```javascript
svg.selectAll("circle")
  .data(data, d => d.id)     // KEY FUNCTION for identity
  .join(
    enter => enter.append("circle").attr("r", 0),
    update => update,
    exit => exit.remove()
  );
```

**Three states**: enter (new), update (existing), exit (removed)

## Essential Patterns

```javascript
// Margin convention
const margin = {top: 20, right: 30, bottom: 40, left: 50};
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Scales
const x = d3.scaleLinear().domain([0, max]).range([0, width]);
const y = d3.scaleBand().domain(names).range([0, height]).padding(0.1);
```

## Anti-Patterns

| Bad | Good |
|-----|------|
| `.data(newData)` (index join) | `.data(newData, d => d.id)` (key function) |
| `svg.selectAll("*").remove()` (full redraw) | Use data join enter/update/exit |
| Excessive method chaining | Assign to variables, handle explicitly |
| Class-based constructors | Closure with getter-setters |

## Reusable Chart Pattern

```javascript
function barChart() {
  let width = 720, height = 400;

  function chart(selection) {
    selection.each(function(data) { /* build chart */ });
  }

  chart.width = function(v) {
    return arguments.length ? (width = v, chart) : width;
  };

  return chart;
}

// Usage
d3.select("#viz").datum(data).call(barChart().width(500));
```

## Load Full Skill When

- Building complex D3 visualizations
- Implementing transitions and animations
- Creating reusable chart components
- Debugging data join issues

## Concrete Checks (MUST ANSWER)

- Does every `.data()` call include a key function (e.g., `.data(data, d => d.id)`) rather than relying on index-based joins?
- Does the code handle all three join states (enter, update, exit) explicitly via `.join()` or separate `.enter()` / `.exit()` calls?
- Does the code follow the margin convention (margin object, inner `g` element with `translate`)?
- Does every transition convey a data change (enter, exit, value update), not a purely decorative animation?
- Are reusable chart components implemented as closures with getter-setter methods (not class constructors)?
