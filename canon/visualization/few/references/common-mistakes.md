# The 13 Common Dashboard Design Mistakes

Stephen Few's catalog of mistakes that undermine dashboard effectiveness.

## 1. Exceeding Single-Screen Boundaries

**The Mistake**: Requiring users to scroll to see all information.

**Why It Fails**:
- Breaks "at-a-glance" requirement
- Forces users to hold information in memory while scrolling
- Hidden information gets ignored

**Fix**: Ruthlessly prioritize. If it doesn't fit, it's not important enough for THIS dashboard.

## 2. Supplying Inadequate Context for Data

**The Mistake**: Showing values without comparison points.

**Why It Fails**:
- "Sales: $1.2M" — Is that good or bad?
- Numbers without context are meaningless

**Fix**: Always show:
- Comparison to target/goal
- Comparison to prior period
- Qualitative ranges (poor/acceptable/good)

## 3. Displaying Excessive Detail or Precision

**The Mistake**: Showing $1,234,567.89 when $1.2M suffices.

**Why It Fails**:
- Clutters the display
- Takes longer to read
- Implies false precision
- Executives don't need decimal places

**Fix**: Match precision to audience and purpose.
- Strategic: Rounded numbers, millions/thousands
- Analytical: Full precision available on drill-down
- Operational: What's needed for action

## 4. Choosing Deficient Measures

**The Mistake**: Displaying metrics that don't drive decisions.

**Why It Fails**:
- Vanity metrics look good but don't inform action
- Missing critical metrics means missing problems

**Fix**: For each metric ask:
- What decision does this inform?
- What action would I take if this changed?
- Is this a leading or lagging indicator?

## 5. Choosing Inappropriate Display Media

**The Mistake**: Using gauges, pie charts, 3D effects.

**Why It Fails**:
- Gauges waste space (show one number in large area)
- Pie charts encode via angle (humans judge poorly)
- 3D distorts perception

**Fix**:
- Gauges → Bullet graphs
- Pie charts → Bar charts or bullet graphs
- 3D anything → 2D equivalent

## 6. Introducing Meaningless Variety

**The Mistake**: Using different chart types just for visual interest.

**Why It Fails**:
- Forces users to learn multiple encodings
- Suggests false distinctions between similar data
- "Dashboard as art gallery" syndrome

**Fix**: Use the SAME display type for the SAME data type.
All KPIs as bullet graphs. All trends as sparklines. Consistency aids scanning.

## 7. Using Poorly Designed Display Media

**The Mistake**: Charts with bad defaults—gridlines, legends, borders.

**Why It Fails**:
- Chartjunk competes with data
- Heavy gridlines obscure patterns
- Legends require eye movement away from data

**Fix**:
- Remove or lighten gridlines
- Direct-label instead of legends
- Remove borders, boxes, backgrounds

## 8. Encoding Quantitative Data Inaccurately

**The Mistake**: Truncated axes, inconsistent scales, area encoding.

**Why It Fails**:
- Truncated Y-axis exaggerates small changes
- Different scales make comparison impossible
- Humans misjudge area (bubble charts)

**Fix**:
- Start quantitative axes at zero (or clearly mark if not)
- Use consistent scales for comparable items
- Prefer length encoding over area

## 9. Arranging Data Poorly

**The Mistake**: Random placement, poor grouping, buried priorities.

**Why It Fails**:
- Eye doesn't know where to look first
- Related items separated
- Most important info not prominent

**Fix**:
- Most important: top-left quadrant
- Group related metrics
- Create clear visual hierarchy
- Use whitespace to separate groups

## 10. Highlighting Important Data Ineffectively (or Not at All)

**The Mistake**: Exceptions look the same as normal values.

**Why It Fails**:
- User must scan everything to find problems
- Alerts hidden in sea of sameness
- Defeats "at-a-glance" purpose

**Fix**:
- Use color ONLY for exceptions/alerts
- Make problems visually prominent
- Consider conditional formatting

## 11. Cluttering the Display with Useless Decoration

**The Mistake**: Gradients, 3D effects, background images, logos in data area.

**Why It Fails**:
- Every non-data pixel costs attention
- Decoration competes with information
- "Looks professional" ≠ communicates well

**Fix**:
- Remove all decoration from data area
- Flat colors only
- White or very light backgrounds
- Logos/branding in header only, small

## 12. Misusing or Overusing Color

**The Mistake**: Rainbow palettes, bright colors for everything.

**Why It Fails**:
- When everything is colorful, nothing stands out
- Inconsistent color meaning confuses
- Some colors hard to distinguish

**Fix**:
- Default to grayscale
- Reserve bright colors for alerts/exceptions
- Same color = same meaning everywhere
- Consider colorblind users

## 13. Designing an Unattractive Visual Display

**The Mistake**: Assuming ugly is okay if functional.

**Why It Fails**:
- Users avoid looking at ugly dashboards
- Poor aesthetics suggest poor data
- Professional context demands polish

**Fix**:
- Align elements precisely
- Consistent spacing and sizing
- Harmonious (not flashy) color palette
- Clean typography
- Aesthetics through simplicity, not decoration
