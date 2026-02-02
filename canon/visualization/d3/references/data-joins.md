# Data Joins: The Heart of D3

Mike Bostock's data join is the fundamental pattern that distinguishes D3 from imperative DOM manipulation.

## Thinking With Joins

From Bostock's essay "Thinking With Joins":

> Instead of instructing D3 *how* to create, update, or remove elements, tell D3 *what* you want.
> You want circle elements to correspond to data. Each data point should have exactly one circle.

The data join computes three states automatically:
- **Enter**: Data without corresponding elements (new data)
- **Update**: Data with corresponding elements (existing data)
- **Exit**: Elements without corresponding data (removed data)

## The General Update Pattern

```javascript
function update(data) {
  // 1. DATA JOIN
  // Join new data with old elements, if any
  const text = svg.selectAll("text")
    .data(data, d => d.id);  // Key function!

  // 2. EXIT
  // Remove old elements as needed
  text.exit()
    .transition()
    .attr("opacity", 0)
    .remove();

  // 3. UPDATE
  // Update existing elements
  text.transition()
    .attr("x", d => x(d.value));

  // 4. ENTER
  // Create new elements as needed
  text.enter().append("text")
    .attr("x", d => x(d.value))
    .attr("y", (d, i) => y(i))
    .attr("opacity", 0)
    .transition()
    .attr("opacity", 1);
}
```

## Modern D3 v7: selection.join()

D3 v5+ provides `.join()` for cleaner syntax:

```javascript
svg.selectAll("circle")
  .data(data, d => d.id)
  .join(
    enter => enter.append("circle")
      .attr("fill", "green")
      .attr("r", 0)
      .call(enter => enter.transition()
        .attr("r", d => r(d.value))),

    update => update
      .attr("fill", "blue")
      .call(update => update.transition()
        .attr("r", d => r(d.value))),

    exit => exit
      .attr("fill", "red")
      .call(exit => exit.transition()
        .attr("r", 0)
        .remove())
  );
```

For simple cases, just pass the element name:

```javascript
svg.selectAll("circle")
  .data(data)
  .join("circle")
  .attr("r", d => r(d.value))
  .attr("cx", d => x(d.date))
  .attr("cy", d => y(d.amount));
```

## Key Functions: Identity Over Index

**The most common mistake in D3**: relying on index-based joins.

```javascript
// WITHOUT key function: join by index
// If data reorders, elements get wrong data!
.data(data)

// WITH key function: join by identity
// Elements track their data through reordering
.data(data, d => d.id)
```

### When to Use Key Functions

Always use key functions when:
- Data might be reordered (sorting)
- Data might be filtered
- Data might have items added/removed from middle
- You want animated transitions between states

```javascript
// Sorting example - keys maintain identity
const sorted = data.slice().sort((a, b) => b.value - a.value);

bars.data(sorted, d => d.name)  // Key by name
  .transition()
  .attr("y", (d, i) => i * barHeight);  // Smooth reposition
```

### Key Function Requirements

- Must return a unique string per datum
- Must be deterministic (same input → same output)
- Should be stable across data updates

```javascript
// Good keys
d => d.id           // Unique identifier
d => d.name         // If names are unique
d => `${d.x},${d.y}` // Composite key

// Bad keys
d => Math.random()  // Not deterministic!
d => d.value        // May not be unique
(d, i) => i         // Same as no key function
```

## Nested Data Joins

For hierarchical data, nest selections:

```javascript
// Create rows
const tr = table.selectAll("tr")
  .data(matrix)
  .join("tr");

// Create cells within each row
const td = tr.selectAll("td")
  .data(d => d)  // Each row's data is an array
  .join("td")
  .text(d => d);
```

For grouped data:

```javascript
const groups = svg.selectAll("g.series")
  .data(series, d => d.name)
  .join("g")
  .attr("class", "series");

const rects = groups.selectAll("rect")
  .data(d => d.values, v => v.date)
  .join("rect")
  .attr("x", d => x(d.date))
  .attr("y", d => y(d.value))
  .attr("height", d => height - y(d.value));
```

## Data Inheritance

Bound data flows to child elements:

```javascript
// Parent has data bound
const g = svg.selectAll("g")
  .data(data)
  .join("g");

// Children inherit parent's datum
g.append("circle")
  .attr("r", function(d) {
    // d is the parent's bound datum
    return d.radius;
  });

g.append("text")
  .text(d => d.label);  // Same datum
```

## The __data__ Property

D3 stores bound data directly on DOM elements:

```javascript
// Bind data
selection.data([{x: 10, y: 20}]);

// Access bound data
selection.node().__data__  // {x: 10, y: 20}

// Useful for debugging in console:
document.querySelector("circle").__data__
```

## Null Elements and Group Structure

Selections maintain structure even with missing elements:

```javascript
// selectAll returns grouped selection
const cells = d3.selectAll("tr").selectAll("td");

// Groups correspond to tr elements
// Nulls fill slots where td doesn't exist
// This preserves index alignment
```

## Common Patterns

### Static Visualization (Enter Only)
```javascript
svg.selectAll("rect")
  .data(data)
  .join("rect")
  .attr("width", d => x(d.value))
  .attr("height", barHeight);
```

### Real-time Updates
```javascript
function tick() {
  // Shift data window
  data.push(newValue);
  data.shift();

  // Update with transition
  path.datum(data)
    .attr("d", line)
    .attr("transform", null)
    .transition()
    .attr("transform", `translate(${x(-1)},0)`);
}
```

### Filtering
```javascript
function filter(predicate) {
  svg.selectAll("circle")
    .data(data.filter(predicate), d => d.id)
    .join(
      enter => enter.append("circle")
        .attr("r", 0)
        .call(e => e.transition().attr("r", 5)),
      update => update,
      exit => exit
        .call(e => e.transition().attr("r", 0).remove())
    );
}
```

## Debugging Data Joins

```javascript
const circles = svg.selectAll("circle")
  .data(data, d => d.id);

console.log("Enter:", circles.enter().size());
console.log("Update:", circles.size());
console.log("Exit:", circles.exit().size());

// Verify data binding
circles.each(function(d, i) {
  console.log(`Element ${i}:`, d, this);
});
```
