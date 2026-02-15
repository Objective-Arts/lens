# Bullet Graphs

Stephen Few's compact, information-dense alternative to gauges and meters.

## Why Bullet Graphs

Gauges and meters are the most common dashboard mistake:
- Waste enormous space showing one number
- Decorative needles, chrome, 3D effects
- Can't easily compare multiple metrics
- Require large area for minimal information

Bullet graphs solve all of this in a fraction of the space.

## Anatomy of a Bullet Graph

```
┌─────────────────────────────────────────────────────────┐
│  Revenue YTD  ████████████████████▌│                    │
│               ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░ │
│               0        50       100      150      200   │
└─────────────────────────────────────────────────────────┘

Components:
- Text label: "Revenue YTD"
- Featured measure: ████████████████████▌ (dark bar)
- Comparative measure: │ (vertical line = target)
- Qualitative ranges: ▓▓▓▓▓▓▓▓░░░░░░░░░ (background bands)
- Quantitative scale: 0, 50, 100, 150, 200
```

## The Five Components

### 1. Text Label
- Short, clear identifier
- Placed LEFT of horizontal bullet graphs
- Placed ABOVE vertical bullet graphs
- No decorative styling

### 2. Quantitative Scale
- Linear axis with tick marks
- Usually starts at zero
- Can include negative values if needed
- Minimal ticks—just enough for reference

### 3. Featured Measure (Primary Bar)
- The actual value you're tracking
- Dark, high-contrast color (often black or dark gray)
- Centered within the qualitative ranges
- If scale doesn't start at zero, use a symbol (dot) instead of bar

### 4. Comparative Measure (Target Marker)
- Reference value: target, goal, prior period
- Thin perpendicular line crossing the bar
- Less visually dominant than featured measure
- Can show multiple comparatives if needed

### 5. Qualitative Ranges (Background Bands)
- 2-5 shaded bands behind the bar
- Show performance zones: poor → satisfactory → good → excellent
- Same hue, different intensities
- Darker = worse, Lighter = better

## Qualitative Range Specifications

Few's recommended gray intensities:

| Ranges | Shades (% black) |
|--------|------------------|
| 2 | 35%, 10% |
| 3 | 40%, 25%, 10% |
| 4 | 50%, 35%, 20%, 10% |
| 5 | 50%, 35%, 20%, 10%, 3% |

## D3 Implementation

```javascript
function renderBulletGraph(container, data, options = {}) {
  const {
    width = 300,
    height = 30,
    margin = { left: 120, right: 20 }
  } = options;

  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);

  const innerWidth = width - margin.left - margin.right;

  // Scale
  const x = d3.scaleLinear()
    .domain([0, data.max || Math.max(data.target * 1.2, data.value * 1.1)])
    .range([0, innerWidth]);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`);

  // Qualitative ranges (background bands)
  const ranges = data.ranges || [
    { threshold: data.max * 0.5, shade: '#d4d4d4' },  // Poor
    { threshold: data.max * 0.75, shade: '#e5e5e5' }, // Satisfactory
    { threshold: data.max, shade: '#f5f5f5' }         // Good
  ];

  let prevThreshold = 0;
  ranges.forEach(range => {
    g.append('rect')
      .attr('x', x(prevThreshold))
      .attr('y', 2)
      .attr('width', x(range.threshold) - x(prevThreshold))
      .attr('height', height - 4)
      .attr('fill', range.shade);
    prevThreshold = range.threshold;
  });

  // Featured measure (primary bar)
  g.append('rect')
    .attr('x', 0)
    .attr('y', height / 2 - 5)
    .attr('width', x(data.value))
    .attr('height', 10)
    .attr('fill', '#333');

  // Comparative measure (target line)
  g.append('line')
    .attr('x1', x(data.target))
    .attr('x2', x(data.target))
    .attr('y1', height / 2 - 10)
    .attr('y2', height / 2 + 10)
    .attr('stroke', '#000')
    .attr('stroke-width', 2);

  // Label
  svg.append('text')
    .attr('x', margin.left - 10)
    .attr('y', height / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'end')
    .attr('font-size', '12px')
    .text(data.label);
}

// Usage
renderBulletGraph(container, {
  label: 'Revenue YTD',
  value: 275,
  target: 250,
  max: 300,
  ranges: [
    { threshold: 150, shade: '#d4d4d4' },  // Poor
    { threshold: 225, shade: '#e5e5e5' },  // Satisfactory
    { threshold: 300, shade: '#f5f5f5' }   // Good
  ]
});
```

## Handling Special Cases

### Lower-is-Better Metrics (Defects, Expenses)

Option 1: Reverse band sequence only
- Darker bands on RIGHT (high values = bad)
- Bar still grows left-to-right

Option 2: Reverse axis AND bands
- Zero on RIGHT, values increase leftward
- Bar grows right-to-left
- Visually reinforces "more = bad"

```javascript
// Lower-is-better: reverse the scale
const x = d3.scaleLinear()
  .domain([data.max, 0])  // Reversed
  .range([0, innerWidth]);
```

### Negative Values

- Extend scale to include negatives
- Use a vertical line at zero
- Bar can extend left (negative) or right (positive)

### Multiple Comparatives

- Can show multiple target lines (e.g., last year AND budget)
- Use different line styles to distinguish
- Don't add more than 2-3

## When to Use Bullet Graphs

**Use for:**
- KPI vs. target tracking
- Performance dashboards
- Any single metric with goal and context
- Compact multi-metric displays

**Don't use for:**
- Trends over time (use sparklines)
- Comparisons between categories (use bar chart)
- Part-to-whole relationships (use stacked bar)
- Geographic data (use maps)

## Stacking Multiple Bullet Graphs

The power of bullet graphs comes from stacking them:

```
Revenue        ████████████████████│░░░░░░░
Profit Margin  ██████████│░░░░░░░░░░░░░░░░░
Customer Sat   ███████████████│░░░░░░░░░░░░
On-Time Del    ██████████████████████│░░░░░
```

All metrics visible, comparable, compact. A gauge dashboard showing
these four metrics would take 4-8x the space.
