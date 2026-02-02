# Transitions and Animation

Bostock's approach: animations should serve understanding, not decoration.

## Core Principle: Object Constancy

From "Object Constancy":

> When a visualization changes, we are much better at tracking moving objects than
> comparing two sequential static images. Animated transitions leverage our visual
> system to follow individual elements through change.

The goal: elements representing specific data should remain perceptually trackable.

## Transition Basics

Transitions are constrained key-frame animation with two frames: start and end.

```javascript
// The current state is the start frame
// What you specify is the end frame
selection.transition()
  .duration(750)
  .attr("x", 100)
  .attr("fill", "red");
```

### Duration and Delay

```javascript
// Fixed duration
.transition()
.duration(750)  // milliseconds

// Staggered animation
.transition()
.delay((d, i) => i * 50)  // Sequential reveal
.duration(500)

// Computed delay
.transition()
.delay(d => x(d.date))  // Delay based on data
```

### Easing Functions

```javascript
// Default: cubic-in-out (smooth start and end)
.ease(d3.easeCubicInOut)

// Linear (constant speed)
.ease(d3.easeLinear)

// Bounce
.ease(d3.easeBounce)

// Elastic
.ease(d3.easeElastic)

// Back (overshoots then settles)
.ease(d3.easeBack)
```

Bostock recommends `d3.easeLinear` for continuous/streaming data to avoid "wiggle".

## Object Constancy Through Key Functions

**Without keys**: elements get wrong data when order changes

```javascript
// BAD: Bars swap data, not positions
bars.data(sortedData)
  .transition()
  .attr("y", (d, i) => i * 20);  // Bars morph into each other
```

**With keys**: elements track their data through transitions

```javascript
// GOOD: Bars move to new positions
bars.data(sortedData, d => d.name)
  .transition()
  .attr("y", (d, i) => i * 20);  // Each bar slides to correct position
```

## The General Update Pattern with Transitions

```javascript
function update(data) {
  const t = svg.transition().duration(750);

  const bars = svg.selectAll("rect")
    .data(data, d => d.id);

  // EXIT: Fade and shrink out
  bars.exit()
    .transition(t)
    .attr("fill", "red")
    .attr("width", 0)
    .remove();

  // UPDATE: Move to new position
  bars.transition(t)
    .attr("x", d => x(d.category))
    .attr("width", x.bandwidth())
    .attr("y", d => y(d.value))
    .attr("height", d => height - y(d.value));

  // ENTER: Grow in from zero
  bars.enter().append("rect")
    .attr("x", d => x(d.category))
    .attr("width", x.bandwidth())
    .attr("y", height)  // Start at baseline
    .attr("height", 0)
    .attr("fill", "green")
    .transition(t)
    .attr("y", d => y(d.value))
    .attr("height", d => height - y(d.value))
    .attr("fill", "steelblue");
}
```

## Chained Transitions

```javascript
// Sequential transitions
selection.transition()
  .duration(500)
  .attr("cx", 100)
  .transition()  // Chains after first completes
  .duration(500)
  .attr("cy", 100);

// Named transitions for coordination
const t = d3.transition()
  .duration(750)
  .ease(d3.easeLinear);

svg.selectAll("circle").transition(t)
  .attr("cx", d => x(d.value));

svg.select(".x-axis").transition(t)
  .call(xAxis);
```

## Transition Events

```javascript
selection.transition()
  .duration(750)
  .attr("x", 100)
  .on("start", function(event, d) {
    d3.select(this).attr("fill", "orange");
  })
  .on("end", function(event, d) {
    d3.select(this).attr("fill", "steelblue");
  })
  .on("interrupt", function(event, d) {
    // Cleanup if transition is interrupted
  });
```

## Interpolation

D3 automatically interpolates between values. You can customize:

```javascript
// Color interpolation
.attrTween("fill", function(d) {
  return d3.interpolateRgb(this.getAttribute("fill"), "red");
})

// Custom path interpolation
.attrTween("d", function(d) {
  const previous = this.getAttribute("d");
  const next = line(d);
  return d3.interpolatePath(previous, next);
})

// Arc interpolation
.attrTween("d", function(d) {
  const interpolate = d3.interpolate(this._current, d);
  this._current = interpolate(1);
  return t => arc(interpolate(t));
})
```

## Path Transitions for Streaming Data

From Bostock's "Path Transitions":

The problem: naively animating path `d` attribute causes "wiggle" as points
appear to move vertically during scroll.

The solution: animate transform, not path.

```javascript
function tick() {
  // Add new data point
  data.push(newValue);

  // Redraw path instantly (no transition)
  path.attr("d", line)
    .attr("transform", null);

  // Slide the path left
  path.transition()
    .duration(500)
    .ease(d3.easeLinear)  // Linear for smooth scroll
    .attr("transform", `translate(${x(0) - x(1)},0)`)
    .on("end", tick);

  // Remove oldest data point
  data.shift();
}
```

Key insights:
- Use `d3.easeLinear` for continuous motion
- Animate transform instead of path coordinates
- Use clip-path to hide overflow

```javascript
// Clip path setup
svg.append("defs").append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", width)
  .attr("height", height);

path.attr("clip-path", "url(#clip)");
```

## When NOT to Animate

Bostock cautions against unnecessary animation:

1. **Unrelated datasets**: Don't animate between temperature and stock prices
2. **Static presentations**: Start with static design, add animation only if needed
3. **Decorative motion**: Animation should aid understanding, not showcase skill

```javascript
// BAD: Gratuitous animation
bars.transition()
  .duration(2000)
  .ease(d3.easeBounce)  // Distracting
  .attr("height", d => y(d.value));

// GOOD: Purposeful animation
bars.transition()
  .duration(300)
  .attr("height", d => y(d.value));  // Quick, informative
```

## Performance Considerations

```javascript
// Use shared transitions for coordination
const t = svg.transition().duration(750);
circles.transition(t).attr("cx", d => x(d.value));
axis.transition(t).call(xAxis);

// Interrupt previous transitions
selection.interrupt().transition()
  .duration(750)
  .attr("x", 100);

// Throttle for rapid updates
let pending = false;
function update(data) {
  if (pending) return;
  pending = true;

  selection.transition()
    .duration(200)
    .attr("cx", d => x(d.value))
    .on("end", () => { pending = false; });
}
```

## Meaningful Transition Hierarchy

Order animations to tell a story:

```javascript
// 1. Exit old elements first
const t0 = svg.transition().duration(500);
bars.exit().transition(t0)
  .attr("height", 0)
  .remove();

// 2. Update axes
const t1 = t0.transition();
xAxis.transition(t1).call(d3.axisBottom(x));
yAxis.transition(t1).call(d3.axisLeft(y));

// 3. Update existing elements
const t2 = t1.transition();
bars.transition(t2)
  .attr("x", d => x(d.category))
  .attr("y", d => y(d.value));

// 4. Enter new elements last
const t3 = t2.transition();
bars.enter().append("rect")
  .attr("height", 0)
  .transition(t3)
  .attr("height", d => height - y(d.value));
```

## Cross-Fade for Unrelated Changes

When data is unrelated, don't animate - cross-fade:

```javascript
function switchDataset(newData) {
  // Fade out old
  svg.selectAll(".chart")
    .transition()
    .duration(300)
    .style("opacity", 0)
    .on("end", function() {
      // Remove old, draw new
      d3.select(this).remove();
      drawChart(newData);
    });
}

function drawChart(data) {
  const chart = svg.append("g")
    .attr("class", "chart")
    .style("opacity", 0);

  // ... draw chart ...

  chart.transition()
    .duration(300)
    .style("opacity", 1);
}
```
