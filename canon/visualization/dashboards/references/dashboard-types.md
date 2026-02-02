# Dashboard Types

Stephen Few categorizes dashboards by role and purpose. Each type has different design requirements.

## The Three Primary Types

### Strategic Dashboards

**Purpose**: Long-term organizational oversight

**Audience**: Executives, board members, senior leadership

**Characteristics**:
- Updated daily, weekly, or monthly (not real-time)
- High-level KPIs and trends
- Comparison to strategic targets
- Minimal interactivity required
- Focus on "are we on track?"

**Design Implications**:
- Emphasize trends over point values
- Show comparison to goals/benchmarks
- Use sparklines heavily
- Aggregate to highest meaningful level
- Exception-based alerts (only show problems)

**Example Metrics**:
- Revenue vs. target
- Market share trend
- Customer satisfaction index
- Employee engagement
- Strategic initiative status

### Analytical Dashboards

**Purpose**: Deep investigation and root cause analysis

**Audience**: Analysts, managers investigating issues

**Characteristics**:
- Updated as needed for analysis
- Rich interactivity (filter, drill-down, pivot)
- Multiple views of same data
- Comparison and correlation tools
- Focus on "why is this happening?"

**Design Implications**:
- Enable drill-down to detail
- Provide filtering controls
- Show relationships between metrics
- Allow time period selection
- Include more data, less aggregation

**Example Metrics**:
- Sales by region/product/rep with drill-down
- Customer churn with segment analysis
- Cost breakdown with category exploration
- Performance by multiple dimensions

### Operational Dashboards

**Purpose**: Real-time monitoring and immediate action

**Audience**: Operations staff, call centers, production floors

**Characteristics**:
- Updated in real-time or near-real-time
- Current state emphasis
- Alert-driven
- Minimal historical context
- Focus on "what needs attention NOW?"

**Design Implications**:
- Prominent alerts and exceptions
- Current values over trends
- Status indicators (red/yellow/green + values)
- Minimal interaction (no time to click)
- Auto-refresh

**Example Metrics**:
- Active system alerts
- Current queue depth
- Live transaction volume
- Real-time inventory levels
- Active incidents count

## Comparison Table

| Aspect | Strategic | Analytical | Operational |
|--------|-----------|------------|-------------|
| Update frequency | Daily/Weekly | On demand | Real-time |
| Time focus | Historical trends | Any period | Right now |
| Interactivity | Low | High | Very low |
| Detail level | Aggregated | Drill-down | Current state |
| Primary question | On track? | Why? | What now? |
| Alert emphasis | Exception-based | Investigation | Prominent |

## Critical Rule: One Type Per Dashboard

**Don't mix types.** A dashboard trying to be strategic AND operational:
- Confuses the audience
- Serves neither purpose well
- Creates visual clutter

If you need multiple types, create multiple dashboards:
- Executive Summary (Strategic)
- Performance Analysis (Analytical)
- Operations Monitor (Operational)

## Secondary Classifications

Few also categorizes by:

### Data Type
- **Quantitative**: Numbers, metrics (most common)
- **Non-quantitative**: Status, text, categories

### Data Domain
- **Sales**: Revenue, pipeline, conversion
- **Finance**: Budget, cash flow, expenses
- **Operations**: Production, quality, efficiency
- **HR**: Headcount, turnover, engagement
- **IT**: Uptime, incidents, capacity

### Data Span
- **Enterprise-wide**: Across all business units
- **Business unit**: Single department or division
- **Individual**: Personal performance

### Update Mechanism
- **Push**: Auto-refresh, streaming
- **Pull**: User-initiated refresh

### Interactivity Level
- **Static**: View only
- **Interactive**: Filter, drill, explore

### Display Mechanism
- **Dedicated display**: Wall monitors, kiosks
- **Desktop**: Individual workstations
- **Mobile**: Phones, tablets

## Choosing the Right Type

```
What's the primary question?

"Are we meeting our goals?"
    → Strategic Dashboard

"Why did this metric change?"
    → Analytical Dashboard

"What needs attention right now?"
    → Operational Dashboard
```

## Design Patterns by Type

### Strategic Pattern
```
┌────────────────────────────────────────┐
│  KPI Cards (bullet graphs)             │
│  ████│░░  ███│░░░  ██████│░░  ████│░░  │
├────────────────────────────────────────┤
│  Trend Sparklines    │  Status Summary │
│  Revenue ─╱──        │  ● 12 On Track  │
│  Margin  ──╲─        │  ● 3 At Risk    │
│  NPS     ─╱╲─        │  ● 1 Behind     │
└────────────────────────────────────────┘
```

### Analytical Pattern
```
┌─────────────┬──────────────────────────┐
│  Filters    │  Primary Visualization   │
│  ☐ Region   │  (chart with drill-down) │
│  ☐ Product  │                          │
│  ☐ Period   │                          │
├─────────────┼──────────────────────────┤
│  Segments   │  Detail Table            │
│  (click to  │  (updates on selection)  │
│   filter)   │                          │
└─────────────┴──────────────────────────┘
```

### Operational Pattern
```
┌────────────────────────────────────────┐
│  🔴 ALERTS (3)                         │
│  Server CPU > 90%  │  Queue > 1000     │
├────────────────────────────────────────┤
│  Current Status         │  Live Feed   │
│  Active Users: 1,234    │  ▓▓▓░░░░░░░  │
│  Transactions/min: 456  │  [streaming] │
│  Error Rate: 0.02%      │              │
└────────────────────────────────────────┘
```
