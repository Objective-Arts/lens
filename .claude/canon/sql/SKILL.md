---
name: sql
description: SQL patterns - thinking in sets, not procedures
---

# /sql — SQL Patterns

Channel Joe Celko: SQL guru, author of "SQL for Smarties" and "SQL Programming Style."

## Core Philosophy

"SQL is a set-based, declarative language. Think in sets, not loops."

**The Cardinal Sin:** Writing SQL like procedural code (cursors, row-by-row processing).

## Thinking in Sets

### Procedural vs Set-Based

```sql
-- WRONG: Procedural thinking (cursor)
DECLARE cursor_emp CURSOR FOR SELECT * FROM employees;
WHILE @@FETCH_STATUS = 0
BEGIN
  UPDATE employees SET salary = salary * 1.1 WHERE CURRENT OF cursor_emp;
  FETCH NEXT FROM cursor_emp;
END

-- RIGHT: Set-based thinking
UPDATE employees SET salary = salary * 1.1;
```

### The Celko Rules

1. **No cursors** - Almost never needed
2. **No loops** - Use set operations
3. **No temporary tables** (usually) - Use CTEs or subqueries
4. **No procedural logic** - Use CASE expressions
5. **Explicit JOINs** - Never comma-separated tables in FROM

## Data Modeling Patterns

### Hierarchies (Nested Sets)

```sql
-- Better than adjacency list for read-heavy trees
CREATE TABLE categories (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  lft INT NOT NULL,  -- left boundary
  rgt INT NOT NULL   -- right boundary
);

-- Find all descendants
SELECT child.*
FROM categories parent
JOIN categories child ON child.lft BETWEEN parent.lft AND parent.rgt
WHERE parent.id = 1;

-- Find path to root
SELECT parent.*
FROM categories child
JOIN categories parent ON child.lft BETWEEN parent.lft AND parent.rgt
WHERE child.id = 10
ORDER BY parent.lft;
```

### Temporal Data

```sql
-- Valid time modeling
CREATE TABLE employee_salaries (
  employee_id INT,
  salary DECIMAL(10,2),
  valid_from DATE,
  valid_to DATE,
  CONSTRAINT no_overlap CHECK (valid_from < valid_to),
  CONSTRAINT no_gaps -- use triggers or application logic
);

-- Current salary
SELECT salary FROM employee_salaries
WHERE employee_id = 1
AND CURRENT_DATE BETWEEN valid_from AND valid_to;
```

### Entity-Attribute-Value (EAV) - Avoid When Possible

```sql
-- AVOID: EAV anti-pattern
CREATE TABLE attributes (
  entity_id INT,
  attribute_name VARCHAR(50),
  attribute_value VARCHAR(255)
);

-- PREFER: Proper table design
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  price DECIMAL(10,2),
  weight DECIMAL(8,2)
);
```

## Query Patterns

### NULL Handling

```sql
-- NULL is not a value, it's a marker for missing information
-- Three-valued logic: TRUE, FALSE, UNKNOWN

-- WRONG: Comparing to NULL
WHERE column = NULL    -- Always UNKNOWN
WHERE column <> NULL   -- Always UNKNOWN

-- RIGHT: Testing for NULL
WHERE column IS NULL
WHERE column IS NOT NULL

-- COALESCE for defaults
SELECT COALESCE(nickname, first_name, 'Unknown') AS display_name
```

### Avoiding OR (often slow)

```sql
-- SLOW: OR can prevent index usage
SELECT * FROM orders WHERE customer_id = 1 OR product_id = 2;

-- FAST: UNION ALL (if result sets are disjoint)
SELECT * FROM orders WHERE customer_id = 1
UNION ALL
SELECT * FROM orders WHERE product_id = 2 AND customer_id <> 1;
```

### Gaps and Islands

```sql
-- Find gaps in a sequence
SELECT curr.id + 1 AS gap_start,
       (SELECT MIN(id) FROM sequence WHERE id > curr.id) - 1 AS gap_end
FROM sequence curr
WHERE NOT EXISTS (SELECT 1 FROM sequence WHERE id = curr.id + 1)
AND curr.id < (SELECT MAX(id) FROM sequence);

-- Find islands (consecutive sequences)
WITH numbered AS (
  SELECT id, id - ROW_NUMBER() OVER (ORDER BY id) AS grp
  FROM sequence
)
SELECT MIN(id) AS island_start, MAX(id) AS island_end
FROM numbered
GROUP BY grp;
```

### Running Totals

```sql
-- Window function (modern SQL)
SELECT
  transaction_date,
  amount,
  SUM(amount) OVER (ORDER BY transaction_date) AS running_total
FROM transactions;
```

## Naming Conventions

- **Tables**: Plural nouns (orders, customers)
- **Columns**: Singular, descriptive (order_date, customer_id)
- **No prefixes**: Not tbl_orders or col_order_date
- **Foreign keys**: Referenced table + _id (customer_id)
- **Boolean columns**: is_ or has_ prefix (is_active, has_shipped)

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| SELECT * | Fragile, wasteful | List columns explicitly |
| Implicit joins | Hard to read, error-prone | Use explicit JOIN syntax |
| DISTINCT as fix | Hides real problem | Fix the query/schema |
| ORDER BY ordinal | Fragile | ORDER BY column_name |
| String concatenation for SQL | SQL injection | Parameterized queries |

## References

- "SQL for Smarties" - Joe Celko
- "SQL Programming Style" - Joe Celko
- "Trees and Hierarchies in SQL for Smarties" - Joe Celko
