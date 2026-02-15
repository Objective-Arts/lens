# Lie Factor: Graphical Integrity

## The Principle

> "The representation of numbers, as physically measured on the surface of the graphic itself, should be directly proportional to the numerical quantities represented."
> — Edward Tufte, *The Visual Display of Quantitative Information*

```
Lie Factor = (Size of effect shown in graphic) / (Size of effect in data)
```

**Target Range:** 0.95 to 1.05 (±5% tolerance)

- **Lie Factor = 1.0**: Perfect graphical integrity
- **Lie Factor > 1.0**: Graphic exaggerates the effect
- **Lie Factor < 1.0**: Graphic understates the effect

---

## Common Violations

### 1. Non-Zero Baseline (Most Common)

```javascript
// BAD: Y-axis starts at 90, exaggerates 10% difference
const y = d3.scaleLinear()
  .domain([90, 100])  // Starting at 90!
  .range([height, 0]);

// Data: values are 92 and 98 (6.5% difference)
// Visual: bars appear 3x different in height (300% difference)
// Lie Factor = 3.0 / 0.065 ≈ 46!

// GOOD: Y-axis starts at zero
const y = d3.scaleLinear()
  .domain([0, 100])
  .range([height, 0]);

// Visual height difference now matches data difference
// Lie Factor = 1.0
```

**Visual Comparison:**

```
BAD (baseline 90):          GOOD (baseline 0):
     ████                        █
     ████                        █
     ████                        █
     ████                        █
     █  ████                     █  █
                                 █  █
                                 █  █
     92  98                      92 98
```

### 2. Area/Volume Encoding Errors

When using circles or bubbles, radius vs. area confusion causes massive distortion:

```javascript
// BAD: Scaling radius by value
// A value 2x bigger gets a circle 4x the area (πr² effect)
circles.attr("r", d => d.value * 10);

// Data: 10 vs 20 (2x difference)
// Visual: 314 vs 1256 pixels (4x difference)
// Lie Factor = 4.0 / 2.0 = 2.0

// GOOD: Scale area, derive radius
const radiusScale = d3.scaleSqrt()  // sqrt to counteract πr²
  .domain([0, d3.max(data, d => d.value)])
  .range([0, 50]);

circles.attr("r", d => radiusScale(d.value));
// Lie Factor = 1.0
```

### 3. 3D Effects

3D perspective distorts proportions unpredictably:

```javascript
// BAD: 3D bar chart (never do this)
// Front bars appear larger than back bars of equal value
// Perspective makes comparison impossible

// GOOD: 2D bar chart
g.selectAll("rect")
  .data(data)
  .join("rect")
  .attr("x", d => x(d.category))
  .attr("y", d => y(d.value))
  .attr("width", x.bandwidth())
  .attr("height", d => height - y(d.value))
  .attr("fill", "steelblue");
// No perspective distortion
```

### 4. Dual Y-Axes with Mismatched Scales

```javascript
// BAD: Two Y-axes scaled to make lines cross dramatically
const y1 = d3.scaleLinear()
  .domain([0, 100])    // Full range
  .range([height, 0]);

const y2 = d3.scaleLinear()
  .domain([45, 55])    // Narrow range - exaggerates variation
  .range([height, 0]);

// The second metric looks wildly volatile when it's actually stable

// BETTER: Normalize to same scale, or use small multiples
// Or clearly label the deception
```

### 5. Pie Charts with Distortion

```javascript
// BAD: 3D pie chart
// Slices at the "front" appear larger than equal slices at "back"
// Elliptical perspective distorts angles

// BAD: Exploded pie chart
// Separated slices break angle comparison

// BETTER: Bar chart for comparison
// Or if pie is required: 2D, no explosion, no tilt
```

---

## Calculating Lie Factor

### Formula

```javascript
function calculateLieFactor(dataChange, visualChange) {
  // dataChange: (newValue - oldValue) / oldValue
  // visualChange: (newVisualSize - oldVisualSize) / oldVisualSize

  if (dataChange === 0) return visualChange === 0 ? 1 : Infinity;
  return Math.abs(visualChange / dataChange);
}

// Example: Bar chart
const oldValue = 100, newValue = 150;  // 50% increase
const oldHeight = 200, newHeight = 500; // 150% increase

const dataChange = (150 - 100) / 100;      // 0.50
const visualChange = (500 - 200) / 200;    // 1.50
const lieFactor = visualChange / dataChange; // 3.0 - BAD!
```

### Automated Lie Factor Checker

```javascript
function auditLieFactor(svg, data, accessor) {
  const violations = [];

  // Check bar charts
  const bars = svg.selectAll("rect[data-value]");
  if (bars.size() > 1) {
    const barData = [];
    bars.each(function(d) {
      barData.push({
        value: accessor ? accessor(d) : d.value,
        height: +d3.select(this).attr("height")
      });
    });

    // Compare pairs
    for (let i = 0; i < barData.length; i++) {
      for (let j = i + 1; j < barData.length; j++) {
        const dataRatio = barData[j].value / barData[i].value;
        const visualRatio = barData[j].height / barData[i].height;
        const lieFactor = visualRatio / dataRatio;

        if (lieFactor < 0.95 || lieFactor > 1.05) {
          violations.push({
            type: "bar",
            items: [i, j],
            dataRatio,
            visualRatio,
            lieFactor,
            severity: Math.abs(lieFactor - 1) > 0.5 ? "critical" : "warning"
          });
        }
      }
    }
  }

  // Check circles (bubble charts)
  const circles = svg.selectAll("circle[data-value]");
  if (circles.size() > 1) {
    const circleData = [];
    circles.each(function(d) {
      const r = +d3.select(this).attr("r");
      circleData.push({
        value: accessor ? accessor(d) : d.value,
        area: Math.PI * r * r
      });
    });

    // Compare pairs for area encoding
    for (let i = 0; i < circleData.length; i++) {
      for (let j = i + 1; j < circleData.length; j++) {
        const dataRatio = circleData[j].value / circleData[i].value;
        const visualRatio = circleData[j].area / circleData[i].area;
        const lieFactor = visualRatio / dataRatio;

        if (lieFactor < 0.95 || lieFactor > 1.05) {
          violations.push({
            type: "bubble",
            items: [i, j],
            dataRatio,
            visualRatio,
            lieFactor,
            severity: Math.abs(lieFactor - 1) > 0.5 ? "critical" : "warning"
          });
        }
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    summary: violations.length === 0
      ? "Lie Factor within acceptable range (0.95-1.05)"
      : `${violations.length} lie factor violations found`
  };
}
```

---

## Before & After Examples

### Bar Chart Baseline Fix

```javascript
// BEFORE: Truncated axis
const data = [
  { name: "A", value: 92 },
  { name: "B", value: 98 }
];

// This makes B look ~3x taller than A
const yBad = d3.scaleLinear()
  .domain([90, 100])
  .range([height, 0]);

// AFTER: Zero baseline
const yGood = d3.scaleLinear()
  .domain([0, 100])
  .range([height, 0]);

// Now B is correctly ~6.5% taller than A
```

### Bubble Chart Area Fix

```javascript
// BEFORE: Radius scales with value (wrong!)
const data = [
  { name: "Small", value: 10 },
  { name: "Large", value: 40 }
];

// Large is 4x the value, but circle is 16x the area!
circles.attr("r", d => d.value);

// AFTER: Area scales with value (correct)
const rScale = d3.scaleSqrt()
  .domain([0, 40])
  .range([0, 40]);

circles.attr("r", d => rScale(d.value));
// Large is 4x the value and 4x the area
```

### Line Chart Y-Axis Fix

```javascript
// BEFORE: Zoomed-in axis exaggerates volatility
const prices = [99.5, 100.2, 99.8, 100.5, 100.1];

const yBad = d3.scaleLinear()
  .domain([99, 101])  // Only 2% range shown
  .range([height, 0]);
// Looks like massive swings!

// AFTER: Context-appropriate axis
const yGood = d3.scaleLinear()
  .domain([0, d3.max(prices) * 1.1])
  .range([height, 0]);
// Or for financial data, show reasonable context:
// .domain([d3.min(prices) * 0.9, d3.max(prices) * 1.1])
// with clear axis labels showing the range
```

---

## Special Cases

### When Non-Zero Baselines Are Acceptable

Some contexts allow truncated axes **with clear disclosure**:

1. **Stock prices**: Daily changes matter more than absolute value
2. **Temperature data**: Showing variation in a narrow range
3. **Scientific measurements**: When baseline is physically meaningful

```javascript
// If you must use non-zero baseline:
// 1. Break the axis visually
// 2. Label clearly
// 3. Consider showing both views

// Axis break indicator
g.append("path")
  .attr("d", "M-10,10 L0,0 L10,10 M-10,20 L0,30 L10,20")
  .attr("transform", `translate(0, ${height - 20})`)
  .attr("fill", "none")
  .attr("stroke", "#999")
  .attr("stroke-width", 1);

// Clear label
g.append("text")
  .attr("x", -margin.left + 5)
  .attr("y", height + 15)
  .attr("font-size", "10px")
  .attr("fill", "#666")
  .text("Note: Y-axis begins at 90");
```

### Area Charts

Area charts inherently use 2D space to show 1D data:

```javascript
// Area naturally starts at baseline
const area = d3.area()
  .x(d => x(d.date))
  .y0(height)         // Always baseline
  .y1(d => y(d.value));

// This is fine - area IS the data representation
// Lie factor = 1.0 when y-axis starts at zero
```

### Stacked Charts

For stacked bar/area charts, ensure totals are comparable:

```javascript
// Lie factor applies to the total stack height
// Individual segments can be compared within a stack
// But cross-stack segment comparison is unreliable

// Consider using 100% stacked for proportions
const stack = d3.stack()
  .offset(d3.stackOffsetExpand);  // Normalize to 100%
```

---

## Checklist

Before shipping any visualization:

- [ ] **Bar charts**: Y-axis starts at zero (or axis break is clearly shown)
- [ ] **Bubble charts**: Using `scaleSqrt()` for radius (area encodes value)
- [ ] **Line charts**: Y-axis range doesn't exaggerate variation
- [ ] **3D effects**: None (3D always distorts)
- [ ] **Dual axes**: Both scales comparable (or avoided entirely)
- [ ] **Pie charts**: 2D only, no explosion, no tilt
- [ ] **Icons/pictograms**: Scaled in one dimension only

**Lie Factor Target:** 0.95 - 1.05

**Rule of Thumb:** If you have to truncate to make the effect visible, the effect might not be significant enough to visualize.

---

## Quick Reference

| Chart Type | Common Violation | Fix |
|------------|------------------|-----|
| Bar | Non-zero baseline | Start Y at 0 |
| Bubble | Radius = value | Use `scaleSqrt()` |
| Line | Zoomed Y-axis | Show appropriate context |
| Pie | 3D, exploded | 2D, connected |
| Area | Non-zero baseline | `y0 = height` |
| Icon | Scaled 2D | Scale one dimension |

