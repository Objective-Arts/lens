---
name: d3
description: "D3 patterns and philosophy"
---

<objective>
Apply Mike Bostock's design philosophy and recommended patterns when building D3 visualizations.
Write idiomatic D3 code that embraces standards, transparency, and expressiveness.
</objective>

<core_philosophy>

<principle name="representation-transparency">
D3 embraces web standards rather than hiding them. You work directly with the DOM, SVG, and
Canvas - not proprietary abstractions. This means browser developer tools work, CSS works,
and any browser feature is automatically available.

"The goal is to embrace and build on standard, universal representations of graphics,
rather than reinvent them each time." - Mike Bostock
</principle>

<principle name="expressiveness-over-convenience">
D3 is not a charting library. It provides low-level primitives - selections, scales, shapes -
that you compose into exactly the visualization you need. This requires more code than
high-level chart libraries but removes the ceiling on what's possible.

Protovis achieved ~80% of needed expressiveness. The remaining 20% was a long tail that
would have been impractical to support. D3 solves this by not abstracting away the platform.
</principle>

<principle name="data-driven-documents">
The central insight: bind data to DOM elements, then derive attributes from data.
Don't manually loop through data creating elements. Declare the relationship between
data and visual properties, and let D3 handle the mechanical details.
</principle>

<principle name="minimalism">
"As little design as possible." (Dieter Rams)
- Maximize data-ink ratio
- Every visual element should serve a purpose
- Remove decoration that doesn't communicate data
- Tools should provide primitives, not prescriptions
</principle>

<principle name="human-centered-purpose">
"Visualization helps people. As Don Norman says, it makes us smart."
Visualization leverages the human visual system to perceive patterns, trends, and outliers.
Replace cognitive calculation with simple perceptual inference. The goal is understanding,
not technological showcase.
</principle>

</core_philosophy>

<essential_patterns>

<pattern name="data-join">
The declarative way to bind data to elements:

```javascript
const circles = svg.selectAll("circle")
  .data(data, d => d.id)  // Key function for identity
  .join(
    enter => enter.append("circle")
      .attr("r", 0)
      .call(enter => enter.transition()
        .attr("r", d => r(d.value))),
    update => update
      .call(update => update.transition()
        .attr("cx", d => x(d.date))),
    exit => exit
      .call(exit => exit.transition()
        .attr("r", 0)
        .remove())
  );
```

Three states: enter (new data), update (existing data), exit (removed data).
Handle each explicitly. Same pattern works for static and dynamic visualizations.
</pattern>

<pattern name="key-functions">
Always use key functions when data may be reordered or filtered:

```javascript
// BAD: Join by index - elements shift to wrong data
.data(data)

// GOOD: Join by identity - elements track their data
.data(data, d => d.id)
```

Key functions enable object constancy, reduce DOM churn, and prevent visual confusion.
</pattern>

<pattern name="reusable-charts">
Implement charts as closures with getter-setter methods:

```javascript
function barChart() {
  let width = 720;
  let height = 400;

  function chart(selection) {
    selection.each(function(data) {
      // Build chart using width, height, data
    });
  }

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

  return chart;
}

// Usage
const myChart = barChart().width(500).height(300);
d3.select("#viz").datum(data).call(myChart);
```
</pattern>

<pattern name="margin-convention">
Define outer dimensions, subtract margins, translate content group:

```javascript
const margin = {top: 20, right: 30, bottom: 40, left: 50};
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Now use width/height for scales, everything is offset correctly
```
</pattern>

</essential_patterns>

<intake>
Which aspect of Bostock's D3 philosophy do you need?

1. **Data joins** - Enter/update/exit, key functions, general update pattern
2. **Reusable charts** - Closure pattern, getter-setters, composable components
3. **Transitions** - Object constancy, meaningful animation, interpolation
4. **Scales and axes** - Domain/range, tick generation, margin conventions
5. **Philosophy** - Deeper dive into his design thinking and principles
6. **Observable Plot** - When to use Plot vs D3, high-level charting API

Share your context and I'll provide the relevant patterns.
</intake>

<routing>
| Response | Reference File |
|----------|----------------|
| 1, data join, enter, update, exit, key | references/data-joins.md |
| 2, reusable, chart, closure, component | references/reusable-charts.md |
| 3, transition, animation, constancy | references/transitions-animation.md |
| 4, scale, axis, margin, domain, range | references/scales-axes.md |
| 5, philosophy, thinking, design, principles | references/philosophy.md |
| 6, Plot, Observable, quick, simple, high-level | references/observable-plot.md |
</routing>

<anti_patterns>
<avoid name="excessive-chaining">
Don't chain excessively on enter/exit/transition selections - they're brittle:

```javascript
// BAD: Brittle, hard to debug
selection.enter().append("circle").attr(...).transition().attr(...).on("end", ...)

// GOOD: Assign to variables, handle explicitly
const entering = selection.enter().append("circle");
entering.attr("r", 0);
entering.transition().attr("r", d => r(d.value));
```
</avoid>

<avoid name="full-redraws">
Don't redraw the entire SVG on data updates:

```javascript
// BAD: Destroys and recreates everything
svg.selectAll("*").remove();
data.forEach(d => svg.append("circle")...);

// GOOD: Bind data, let enter/update/exit handle changes
svg.selectAll("circle").data(data, d => d.id).join("circle")...
```
</avoid>

<avoid name="join-by-index">
Don't rely on index-based joins when data order changes:

```javascript
// BAD: Reordering data causes elements to represent wrong items
.data(newData)

// GOOD: Stable identity through transitions
.data(newData, d => d.id)
```
</avoid>

<avoid name="class-constructors">
Prefer functional patterns over class-based constructors:

```javascript
// AVOID: Traditional OOP
class Chart {
  constructor(config) { ... }
  render() { ... }
}

// PREFER: Closure with getter-setters
function chart() {
  function my(selection) { ... }
  my.width = function(v) { ... };
  return my;
}
```
</avoid>

<avoid name="hiding-standards">
Don't create abstractions that hide web standards:

```javascript
// AVOID: Proprietary API that hides SVG
myChart.setCircleColor("red");

// PREFER: Work with standard attributes
circles.attr("fill", "red");
circles.style("fill", "red");  // Or CSS
```
</avoid>
</anti_patterns>

<quick_reference>

<selection_basics>
```javascript
// Select and modify
d3.select("body").style("background", "#eee");
d3.selectAll("p").style("color", "blue");

// Append elements
svg.append("g").attr("class", "axis");

// Method chaining returns selection
d3.select("body")
  .append("svg")
  .attr("width", 960)
  .attr("height", 500);
```
</selection_basics>

<scale_patterns>
```javascript
// Linear scale
const x = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.value)])
  .range([0, width]);

// Band scale for categories
const y = d3.scaleBand()
  .domain(data.map(d => d.name))
  .range([0, height])
  .padding(0.1);

// Color scale
const color = d3.scaleSequential(d3.interpolateBlues)
  .domain([0, 100]);
```
</scale_patterns>

<transition_basics>
```javascript
// Simple transition
selection.transition()
  .duration(750)
  .attr("x", d => x(d.value));

// Staggered transitions
selection.transition()
  .delay((d, i) => i * 50)
  .attr("opacity", 1);

// Chained transitions
selection.transition()
  .attr("cx", 100)
  .transition()
  .attr("cy", 100);
```
</transition_basics>

</quick_reference>

<related_skills>
- **d3-expert** - Comprehensive D3 v7 patterns and API reference
- **charts-review** - D3's minimalism aligns with charts data-ink principles
- **temporal-choreography** - Animation patterns building on D3's transition philosophy
</related_skills>

<success_criteria>
Code follows Bostock's philosophy when:
- Data joins handle enter/update/exit explicitly
- Key functions used for data that changes
- Reusable components use closure pattern
- Web standards are embraced, not hidden
- Visualizations are minimal and data-focused
- Transitions serve understanding, not decoration
</success_criteria>
