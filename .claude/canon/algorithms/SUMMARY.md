# /algorithms Summary

> "Premature optimization is the root of all evil."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Programs as literature** | Write for humans first, machines second |
| **Prove correctness** | Don't just test—reason about invariants |
| **Know complexity** | Time, space, best/worst/average cases |
| **Optimize the 3%** | Measure first, then optimize what matters |

## Literate Programming

```c
// TRADITIONAL: Code with comment
int factorial(int n) { ... }

// LITERATE: Essay that happens to compile
@ The factorial function computes $n!$ using the recursive
definition: $0! = 1$ and $n! = n \cdot (n-1)!$
@<Calculate factorial@>=
int factorial(int n) { ... }
```

## Algorithmic Rigor

```c
// Precondition: arr is sorted, 0 <= lo <= hi <= len(arr)
// Invariant: if target exists, it's in arr[lo..hi]
// Postcondition: returns index or -1
int binary_search(int arr[], int lo, int hi, int target) {
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;  // Avoids overflow
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
```

## Edge Case Paranoia

- Empty input
- Single element
- Maximum/minimum values
- Overflow conditions
- Off-by-one errors

## The Knuth Test

1. Could this be read as prose?
2. Have I explained the *why*?
3. Do I know the complexity?
4. Have I considered edge cases?
5. Is this premature optimization?
6. Would Knuth find a bug?

## When to Use

- Algorithm documentation and explanation
- Correctness-critical code
- When code needs to read like literature

## Concrete Checks (MUST ANSWER)

1. **Complexity labeling:** For every function containing a loop or recursion, is the time and space complexity stated (e.g., O(n), O(n log n), O(n^2))? If you cannot state the complexity, you do not understand the function — analyze it before proceeding.
2. **Edge case enumeration:** Before implementing, have you listed and written tests for: empty input, single element, maximum size, duplicate values, negative/zero values, and off-by-one boundaries? Missing any of these is a latent bug.
3. **Stdlib duplication check:** Does the language's standard library already provide this algorithm (sort, binary search, map/filter/reduce, set operations, regex)? If yes, use the stdlib version — do not reimplement it.
4. **Optimization justification:** For every algorithm more complex than the brute-force O(n^2) approach, is there a measured benchmark showing the brute-force version is too slow at actual production data sizes? If no measurement exists, use brute force.
5. **Overflow and precision audit:** For every arithmetic operation on integers or floating-point numbers, can the result overflow, underflow, or lose precision at boundary values? If yes, add explicit guards or use appropriate types (BigInt, checked arithmetic).

## HARD GATES (mandatory before writing code)

- [ ] **Complexity documented:** Every function with a loop or recursion has its time and space complexity stated. If you can't state it, you don't understand the code.
- [ ] **Edge cases enumerated:** Before implementing, list: empty input, single element, max size, negative values, overflow, off-by-one. Write a test for each.
- [ ] **Stdlib check:** Does the language's standard library already provide this algorithm? Array.sort, Map, Set, binary search — don't reimplement what exists.
- [ ] **Simplest first:** Start with the brute force O(n²) solution. Only optimize if you have measured evidence that n is large enough to matter.
