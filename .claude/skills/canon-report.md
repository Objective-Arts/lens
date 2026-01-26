# /canon-report - Canon Masters Usage Report

Generate a D3 visualization of canon master skill invocations from the current session.

## When Invoked

Execute this workflow to generate the canon masters report:

### Step 1: Create Report Directory

```bash
mkdir -p .claude
```

### Step 2: Gather Skill Data

Search the conversation for skill invocations. Look for patterns like:
- "SKILLS INVOKED: /frost, /dodds, ..."
- "Invoking /skillname"
- "invoke: /skillname"
- Direct skill mentions in your responses

List all skills you've used or mentioned in this session with counts.

### Step 3: Generate JSON Data

Create `.claude/canon-masters.json` with this structure:

```json
{
  "session": {
    "timestamp": "<current ISO timestamp>",
    "source": "manual-session"
  },
  "skills": [
    {"name": "/skillname", "count": N, "domain": "domain-name"}
  ],
  "connections": [
    {"source": "/skill1", "target": "/skill2", "weight": N}
  ]
}
```

**Domain mappings:**
- `ui-ux`: /frost, /ive, /norman, /wroblewski, /duarte, /buxton, /curtis, /kruzeniski, /rams
- `testing-quality`: /dodds, /crockford, /simpson, /bloch, /pike, /cleary
- `architecture`: /taleb, /petroski
- `code-quality`: /abramov, /cherny
- `documentation`: /procida
- `workflow`: /plan, /review-hard

### Step 4: Generate HTML Report

Create `.claude/canon-report.html` with this template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Canon Masters Report</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #eee;
      min-height: 100vh;
    }
    .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
    h1 { text-align: center; margin-bottom: 0.5rem; color: #00d9ff; }
    .subtitle { text-align: center; color: #888; margin-bottom: 2rem; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .stat-value { font-size: 2.5rem; font-weight: bold; color: #00d9ff; }
    .stat-label { color: #888; margin-top: 0.5rem; }
    .graph-container {
      background: rgba(0,0,0,0.3);
      border-radius: 16px;
      padding: 1rem;
      margin-bottom: 2rem;
      min-height: 500px;
    }
    .legend {
      display: flex;
      justify-content: center;
      gap: 2rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .legend-item { display: flex; align-items: center; gap: 0.5rem; }
    .legend-dot { width: 12px; height: 12px; border-radius: 50%; }
    .skills-table {
      width: 100%;
      border-collapse: collapse;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      overflow: hidden;
    }
    .skills-table th, .skills-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .skills-table th { background: rgba(0,217,255,0.1); color: #00d9ff; }
    .skills-table tr:hover { background: rgba(255,255,255,0.05); }
    .domain-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
    }
    .domain-ui-ux { background: #e91e63; }
    .domain-testing-quality { background: #4caf50; }
    .domain-architecture { background: #ff9800; }
    .domain-code-quality { background: #2196f3; }
    .domain-documentation { background: #9c27b0; }
    .domain-workflow { background: #607d8b; }
    .domain-other { background: #795548; }
    svg text { font-size: 11px; fill: #fff; }
    .link { stroke: rgba(255,255,255,0.3); }
  </style>
</head>
<body>
  <div class="container">
    <h1>Canon Masters Report</h1>
    <p class="subtitle">Session Skills Analysis</p>
    <div class="stats" id="stats"></div>
    <div class="legend" id="legend"></div>
    <div class="graph-container">
      <svg id="graph" width="100%" height="500"></svg>
    </div>
    <h2 style="margin-bottom: 1rem;">Skills Invoked</h2>
    <table class="skills-table">
      <thead><tr><th>Skill</th><th>Domain</th><th>Count</th></tr></thead>
      <tbody id="skills-body"></tbody>
    </table>
  </div>
  <script>
    // DATA_PLACEHOLDER - Replace with actual JSON data
    const data = DATA_PLACEHOLDER;

    const domainColors = {
      'ui-ux': '#e91e63',
      'testing-quality': '#4caf50',
      'architecture': '#ff9800',
      'code-quality': '#2196f3',
      'documentation': '#9c27b0',
      'workflow': '#607d8b',
      'other': '#795548'
    };
    const domainLabels = {
      'ui-ux': 'UI/UX Design',
      'testing-quality': 'Testing & Quality',
      'architecture': 'Architecture',
      'code-quality': 'Code Quality',
      'documentation': 'Documentation',
      'workflow': 'Workflow',
      'other': 'Other'
    };

    // Render stats
    document.getElementById('stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${data.skills.length}</div>
        <div class="stat-label">Canon Masters</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.skills.reduce((a,b) => a + b.count, 0)}</div>
        <div class="stat-label">Total Invocations</div>
      </div>
    `;

    // Render legend
    const domains = [...new Set(data.skills.map(s => s.domain))];
    document.getElementById('legend').innerHTML = domains.map(d => `
      <div class="legend-item">
        <div class="legend-dot" style="background: ${domainColors[d]}"></div>
        <span>${domainLabels[d] || d}</span>
      </div>
    `).join('');

    // Render table
    document.getElementById('skills-body').innerHTML = data.skills.map(s => `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td><span class="domain-badge domain-${s.domain}">${domainLabels[s.domain]}</span></td>
        <td>${s.count}</td>
      </tr>
    `).join('');

    // D3 Force Graph
    const svg = d3.select('#graph');
    const width = svg.node().getBoundingClientRect().width;
    const height = 500;
    const nodes = data.skills.map(s => ({ id: s.name, count: s.count, domain: s.domain }));
    const links = (data.connections || []).filter(l =>
      nodes.find(n => n.id === l.source) && nodes.find(n => n.id === l.target)
    );

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.count) * 10 + 20));

    const link = svg.append('g').selectAll('line').data(links).join('line')
      .attr('class', 'link').attr('stroke-width', d => Math.sqrt(d.weight || 1) * 2);

    const node = svg.append('g').selectAll('g').data(nodes).join('g')
      .call(d3.drag()
        .on('start', (e,d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e,d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e,d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    node.append('circle')
      .attr('r', d => Math.sqrt(d.count) * 8 + 10)
      .attr('fill', d => domainColors[d.domain] || '#888')
      .attr('stroke', '#fff').attr('stroke-width', 2);

    node.append('text').text(d => d.id).attr('text-anchor', 'middle').attr('dy', 4);

    simulation.on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
  </script>
</body>
</html>
```

Replace `DATA_PLACEHOLDER` with the actual JSON object (not a string).

### Step 5: Output Summary

Report to the user:

```
Canon Masters Report Generated
==============================

Files created:
  .claude/canon-masters.json
  .claude/canon-report.html

Skills by Domain:
  UI/UX:          [list skills and counts]
  Testing:        [list skills and counts]
  Architecture:   [list skills and counts]
  ...

Total: X skills, Y invocations

Open report: open .claude/canon-report.html
```

## Notes

- This skill analyzes the CURRENT conversation only
- For ralph sessions, the report is auto-generated at the end
- The D3 graph is interactive - drag nodes to explore
- Colors indicate domain expertise areas
- Node size reflects usage frequency
