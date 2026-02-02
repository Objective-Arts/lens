# Sparklines

Small, intense, word-sized graphics for showing trends in minimal space.

## What Are Sparklines

Coined by Edward Tufte, championed by Few for dashboards:
- **Word-sized**: Fit inline with text or in small cells
- **No axes**: The shape IS the message
- **No labels**: Context comes from surrounding text
- **High data density**: Many points in tiny space

## Why Sparklines on Dashboards

Full charts waste space when you only need to answer:
- Is it going up or down?
- Is it stable or volatile?
- Are there any spikes or dips?

Sparklines answer these instantly in a fraction of the space.

## Sparkline Types

### Line Sparkline (most common)
```
Revenue  ─╱╲─╱──    Upward trend with volatility
Margin   ──────     Stable
Churn    ──╱╱╱─     Concerning upward trend
```

### Bar Sparkline
```
Volume   ▁▂▃▅▇▅▃▂   Peak in middle
Sales    ▇▅▃▂▁▂▃▅   U-shape recovery
```

### Win/Loss Sparkline
```
Results  ▌▌▐▐▌▌▌▐   More wins than losses
```

## Anatomy of a Sparkline

```
Revenue ─╱╲─╱──• $1.2M
        ↑      ↑   ↑
        │      │   └── Current value (optional)
        │      └────── End point marker
        └───────────── Line showing trend
```

Optional enhancements:
- **End point**: Dot at final value
- **Min/Max markers**: Dots at extremes
- **Reference line**: Horizontal line at target or zero
- **Shaded range**: Normal band (deviations stand out)

## D3 Implementation

### Basic Line Sparkline

```javascript
function renderSparkline(container, data, options = {}) {
  const {
    width = 80,
    height = 20,
    strokeColor = '#333',
    strokeWidth = 1.5,
    showEndpoint = true,
    showMinMax = false
  } = options;

  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);

  const x = d3.scaleLinear()
    .domain([0, data.length - 1])
    .range([2, width - 2]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data))
    .range([height - 2, 2]);

  // Line
  const line = d3.line()
    .x((d, i) => x(i))
    .y(d => y(d));

  svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', strokeColor)
    .attr('stroke-width', strokeWidth)
    .attr('d', line);

  // End point
  if (showEndpoint) {
    svg.append('circle')
      .attr('cx', x(data.length - 1))
      .attr('cy', y(data[data.length - 1]))
      .attr('r', 2)
      .attr('fill', strokeColor);
  }

  // Min/Max markers
  if (showMinMax) {
    const minIdx = data.indexOf(Math.min(...data));
    const maxIdx = data.indexOf(Math.max(...data));

    svg.append('circle')
      .attr('cx', x(minIdx))
      .attr('cy', y(data[minIdx]))
      .attr('r', 2)
      .attr('fill', '#e74c3c');

    svg.append('circle')
      .attr('cx', x(maxIdx))
      .attr('cy', y(data[maxIdx]))
      .attr('r', 2)
      .attr('fill', '#27ae60');
  }
}
```

### Bar Sparkline

```javascript
function renderBarSparkline(container, data, options = {}) {
  const {
    width = 80,
    height = 20,
    barColor = '#666',
    gap = 1
  } = options;

  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);

  const barWidth = (width - gap * (data.length - 1)) / data.length;

  const y = d3.scaleLinear()
    .domain([0, Math.max(...data)])
    .range([0, height]);

  svg.selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', (d, i) => i * (barWidth + gap))
    .attr('y', d => height - y(d))
    .attr('width', barWidth)
    .attr('height', d => y(d))
    .attr('fill', barColor);
}
```

### With Reference Line

```javascript
function renderSparklineWithReference(container, data, target, options = {}) {
  const { width = 80, height = 20 } = options;

  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);

  const y = d3.scaleLinear()
    .domain([Math.min(target, ...data), Math.max(target, ...data)])
    .range([height - 2, 2]);

  // Reference line (target)
  svg.append('line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', y(target))
    .attr('y2', y(target))
    .attr('stroke', '#ddd')
    .attr('stroke-dasharray', '2,2');

  // Sparkline
  const x = d3.scaleLinear()
    .domain([0, data.length - 1])
    .range([2, width - 2]);

  const line = d3.line()
    .x((d, i) => x(i))
    .y(d => y(d));

  svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#333')
    .attr('stroke-width', 1.5)
    .attr('d', line);
}
```

## Sparkline Grid Pattern

Common dashboard layout—metrics with sparklines:

```javascript
function renderMetricRow(container, metric) {
  const row = container.append('div')
    .attr('class', 'metric-row')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '12px');

  // Label
  row.append('span')
    .style('width', '100px')
    .text(metric.label);

  // Sparkline
  renderSparkline(row, metric.history, {
    width: 80,
    height: 20,
    showEndpoint: true
  });

  // Current value
  row.append('span')
    .style('width', '60px')
    .style('text-align', 'right')
    .style('font-weight', '600')
    .text(metric.format(metric.current));

  // Change indicator
  const change = metric.current - metric.history[0];
  row.append('span')
    .style('color', change >= 0 ? '#27ae60' : '#e74c3c')
    .text(change >= 0 ? `▲ ${change}` : `▼ ${Math.abs(change)}`);
}
```

## When to Use Sparklines

**Use for:**
- Showing trend direction
- Comparing patterns across metrics
- Adding temporal context to KPIs
- Space-constrained displays

**Don't use when:**
- Exact values matter (add labels or use full chart)
- Comparing absolute magnitudes (scales differ)
- Single data point (just show the number)
- Audience unfamiliar with sparklines

## Sparkline Best Practices

1. **Consistent time periods**: All sparklines should cover same duration
2. **Consistent sizing**: Same width/height across dashboard
3. **Meaningful scale**: Each sparkline scales to its own range
4. **End markers**: Help reader see current position
5. **No axes**: The point is compression; axes defeat purpose
6. **Context via labels**: Surrounding text provides meaning
