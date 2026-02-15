# Visual Perception Science

The cognitive foundations of effective dashboard design.

## Why Perception Matters

Dashboard design is not about aesthetics—it's about leveraging how the human visual system works. Design with perception, not against it.

## Preattentive Attributes

Visual features processed **before conscious attention** (<250ms):

### What the Eye Catches Instantly

| Attribute | Example | Use For |
|-----------|---------|---------|
| **Color hue** | Red among gray | Alerts, exceptions |
| **Color intensity** | Dark among light | Emphasis, magnitude |
| **Size** | Large among small | Importance, quantity |
| **Orientation** | Tilted among straight | Outliers |
| **Length** | Long bar among short | Magnitude comparison |
| **Width** | Thick among thin | Emphasis |
| **Shape** | Circle among squares | Category |
| **Position** | Offset from group | Exception |
| **Motion** | Moving among static | Alerts (use sparingly) |
| **Enclosure** | Boxed item | Grouping |

### Using Preattentive Attributes

```javascript
// Exception stands out via color (preattentive)
function highlightException(svg, data) {
  svg.selectAll('.data-point')
    .attr('fill', d => d.isException ? '#e74c3c' : '#999');  // Red pops
}

// Size encodes importance (preattentive)
function sizeByImportance(svg, data) {
  svg.selectAll('.metric-card')
    .style('font-size', d => d.isPrimary ? '24px' : '14px');
}
```

### Rules for Preattentive Processing

1. **One attribute per encoding** - Don't use red AND large for same meaning
2. **Sparse use** - If everything is red, nothing stands out
3. **Consistent meaning** - Red always means alert
4. **Contrast matters** - Difference must be large enough to detect

## Gestalt Principles

How we perceive groups and relationships:

### Proximity
**Items close together are seen as related.**

```
Good:                      Bad:
┌─────────────────────┐    ┌─────────────────────┐
│ Revenue   $1.2M     │    │ Revenue             │
│ Margin    23%       │    │                     │
│                     │    │ $1.2M               │
│ Customers 45,000    │    │                     │
│ Churn     2.3%      │    │ Margin              │
└─────────────────────┘    │ 23%                 │
                           └─────────────────────┘
```

**Application**: Group related metrics with whitespace separation.

### Similarity
**Similar items are seen as related.**

```
○ ○ ○ ● ● ● △ △ △
└─────┘ └─────┘ └─────┘
Group 1  Group 2  Group 3
```

**Application**: Use consistent styling for same-category items.

### Enclosure
**Items within a boundary are seen as a group.**

```
┌─────────────┐  ┌─────────────┐
│ Sales KPIs  │  │ Ops KPIs    │
│ ─────────── │  │ ─────────── │
│ Revenue     │  │ Uptime      │
│ Pipeline    │  │ Incidents   │
└─────────────┘  └─────────────┘
```

**Application**: Use subtle borders or backgrounds to group sections.

### Connection
**Connected items are seen as related.**

```
[Revenue] ──────── [Margin]
                      │
                   [Profit]
```

**Application**: Use lines to show relationships (sparingly).

### Closure
**We mentally complete incomplete shapes.**

```
○ ○ ○       We see a triangle
  ○
```

**Application**: Minimal borders can suggest structure.

### Continuity
**We follow smooth paths.**

```
───────╱─────    Eye follows the line
       ╲─────
```

**Application**: Sparklines leverage this for trend perception.

## Working Memory Limits

**7 ± 2 items** - The capacity of working memory

### Implications for Dashboard Design

1. **Limit categories** - No more than 5-7 distinct colors/shapes
2. **Chunk information** - Group related items
3. **Don't require memory** - All context on screen
4. **Avoid scrolling** - Information off-screen is forgotten

### Reducing Cognitive Load

```javascript
// Bad: User must remember legend while scanning chart
Legend: ● Sales  ■ Marketing  ▲ Support

// Good: Direct labeling
        ● Sales $1.2M
       ■ Marketing $800K
      ▲ Support $400K
```

## Visual Hierarchy

**Where the eye goes first:**

1. **Large items** before small
2. **Bright/saturated** before muted
3. **Isolated items** before grouped
4. **Top-left** before bottom-right (Western reading)
5. **Moving** before static

### Creating Hierarchy

```javascript
// Primary metric: large, prominent position
// Secondary: smaller, supporting position
// Tertiary: smallest, detail on demand

const hierarchy = {
  primary: { fontSize: '32px', color: '#000', position: 'top-left' },
  secondary: { fontSize: '18px', color: '#333', position: 'top' },
  tertiary: { fontSize: '12px', color: '#666', position: 'below' }
};
```

## Pattern Recognition

Humans excel at recognizing patterns. Design to leverage this:

### Consistent Layout
```
Every KPI card:
┌─────────────────┐
│ Label           │
│ VALUE  ─╱╲──    │
│ vs target       │
└─────────────────┘

User learns pattern once, applies everywhere.
```

### Deviation from Pattern = Signal
```
Normal:  ▓▓▓▓▓▓▓▓▓▓
Normal:  ▓▓▓▓▓▓▓▓▓▓
ALERT:   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← Length deviation catches eye
Normal:  ▓▓▓▓▓▓▓▓▓▓
```

## Accuracy of Perceptual Judgments

How accurately we judge visual encodings (best to worst):

1. **Position along common scale** - Most accurate
2. **Position along identical scales**
3. **Length**
4. **Angle/Slope**
5. **Area**
6. **Volume**
7. **Color saturation**
8. **Color hue** - Least accurate for magnitude

### Implications

- Use bar charts (length) over pie charts (angle)
- Use position (scatter, line) for precise comparison
- Avoid bubble charts (area) for precise values
- Never use 3D (volume distorts everything)

```javascript
// Good: Length encoding (bar chart)
data.forEach(d => {
  bar.attr('width', scale(d.value));  // Length = value
});

// Bad: Area encoding (bubble chart)
data.forEach(d => {
  circle.attr('r', Math.sqrt(scale(d.value)));  // Area harder to judge
});
```

## Change Blindness

**We fail to notice changes we're not watching.**

### Implications

1. **Highlight changes** - Don't assume user will notice updates
2. **Animation for attention** - Brief flash on change (not looping)
3. **Change indicators** - Show deltas, not just new values

```javascript
// Highlight value change
function updateValue(element, oldValue, newValue) {
  element.text(newValue);

  if (newValue !== oldValue) {
    element
      .style('background', '#ffffcc')  // Brief highlight
      .transition()
      .duration(2000)
      .style('background', 'transparent');
  }
}
```
