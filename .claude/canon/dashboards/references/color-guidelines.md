# Color Guidelines

Stephen Few's rules for using color effectively in dashboards.

## Core Philosophy

> "Use as little color as necessary."

Color is a **scarce resource**. When used sparingly, it draws attention. When used everywhere, it becomes noise.

## The Grayscale-First Approach

**Default state**: Most of your dashboard should be grayscale.
- Text: Black or dark gray
- Axes, gridlines: Light to medium gray
- Backgrounds: White or very light gray
- Data: Medium gray (unless highlighted)

**Color only for**:
- Alerts and exceptions
- Categorical distinctions (when necessary)
- Highlighting important data
- Status indicators

## When to Use Color vs. Grayscale

| Element | Use Grayscale | Use Color |
|---------|---------------|-----------|
| Normal data | ✓ | |
| Exception data | | ✓ |
| Labels | ✓ | |
| Gridlines | ✓ | |
| Backgrounds | ✓ | |
| Alerts | | ✓ |
| Categories (if needed) | | ✓ |
| Trends (if comparing) | | ✓ |

## Alert Colors

Reserve bright, saturated colors for alerts:

```
🔴 Red (#e74c3c)     - Critical, requires immediate action
🟠 Orange (#f39c12)  - Warning, needs attention soon
🟡 Yellow (#f1c40f)  - Caution (use sparingly, low contrast)
🟢 Green (#27ae60)   - Good, on target (use as absence of red)
```

### Alert Color Rules

1. **Red means action required** - Don't use red for decoration
2. **Green is the default** - Absence of red, not celebration
3. **Always include values** - Never traffic lights alone
4. **Consider colorblind users** - Add shapes or text

```javascript
// Alert indicator with value
function renderAlert(container, value, threshold) {
  const status = value >= threshold ? 'good' : 'alert';
  const color = status === 'good' ? '#27ae60' : '#e74c3c';

  container.append('span')
    .attr('class', 'alert-indicator')
    .style('color', color)
    .text(status === 'good' ? '●' : '▲');

  container.append('span')
    .attr('class', 'alert-value')
    .text(value);  // Always show the value!
}
```

## Color for Categories

When you must distinguish categories:

1. **Use as few colors as possible** - Can you use 2 instead of 5?
2. **Choose distinguishable hues** - Not red and orange together
3. **Same saturation level** - All muted OR all bright, not mixed
4. **Consistent meaning** - Same category = same color everywhere

### Recommended Categorical Palette

```javascript
const categoricalColors = [
  '#4e79a7',  // Blue
  '#f28e2c',  // Orange
  '#e15759',  // Red
  '#76b7b2',  // Teal
  '#59a14f',  // Green
  '#edc949',  // Yellow
  '#af7aa1',  // Purple
  '#ff9da7',  // Pink
];

// Limit to what you need
const twoCategories = categoricalColors.slice(0, 2);
const threeCategories = categoricalColors.slice(0, 3);
```

## Sequential Color (Intensity)

For ordered data (low to high), use single-hue variations:

```javascript
// Single hue, varying intensity
const sequentialBlue = [
  '#f7fbff',  // Lightest (low)
  '#deebf7',
  '#c6dbef',
  '#9ecae1',
  '#6baed6',
  '#4292c6',
  '#2171b5',
  '#084594'   // Darkest (high)
];
```

**Why single hue?** Rainbow scales (red-yellow-green) imply categorical differences. Single hue shows magnitude.

## Diverging Color

For data with a meaningful center (e.g., profit/loss, above/below target):

```javascript
// Diverging from center
const divergingScale = [
  '#d73027',  // Negative extreme (red)
  '#f46d43',
  '#fdae61',
  '#fee08b',
  '#ffffbf',  // Neutral center (light yellow)
  '#d9ef8b',
  '#a6d96a',
  '#66bd63',
  '#1a9850'   // Positive extreme (green)
];
```

## Common Color Mistakes

### 1. Rainbow Everything
**Problem**: Using full spectrum for continuous data
**Fix**: Use single-hue sequential scale

### 2. Red and Green for Categories
**Problem**: ~8% of men are red-green colorblind
**Fix**: Use blue-orange or add pattern/shape

### 3. Color Without Value
**Problem**: Traffic light with no numbers
**Fix**: Always show value + color

### 4. Inconsistent Meaning
**Problem**: Red means "sales" here, "alert" there
**Fix**: Same color = same meaning always

### 5. Low Contrast
**Problem**: Light yellow on white background
**Fix**: Ensure WCAG AA contrast (4.5:1)

### 6. Too Many Colors
**Problem**: 12-color legend for 12 categories
**Fix**: Aggregate to 4-5 categories max, or use interaction

## Colorblind-Safe Palettes

```javascript
// Safe for most color vision deficiencies
const colorblindSafe = [
  '#000000',  // Black
  '#E69F00',  // Orange
  '#56B4E9',  // Sky blue
  '#009E73',  // Bluish green
  '#F0E442',  // Yellow
  '#0072B2',  // Blue
  '#D55E00',  // Vermillion
  '#CC79A7'   // Reddish purple
];

// For alert status (not relying on red/green alone)
// Always add shape or text
function renderStatus(container, status) {
  const config = {
    good: { color: '#009E73', symbol: '●', label: 'OK' },
    warning: { color: '#E69F00', symbol: '▲', label: 'Warning' },
    critical: { color: '#D55E00', symbol: '■', label: 'Critical' }
  };

  const c = config[status];
  container.html(`<span style="color:${c.color}">${c.symbol}</span> ${c.label}`);
}
```

## Background Color Rules

1. **Data area**: White or very light gray only
2. **No gradients**: Distort color perception
3. **No textures**: Add visual noise
4. **Consistent across dashboard**: Same background everywhere
5. **Borders/separators**: Very light gray if needed, not black lines

## Quick Reference

```
Default for most things:    Grayscale (#333, #666, #999, #ccc, #f5f5f5)
Alerts/exceptions:          Saturated red/orange/green
Categories (if needed):     4-5 distinguishable muted hues
Magnitude (sequential):     Single hue, light to dark
Diverging (pos/neg):        Two hues meeting at neutral center
Always:                     Add shape/text for colorblind users
```
