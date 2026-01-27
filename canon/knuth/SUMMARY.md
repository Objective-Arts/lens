# /knuth Summary

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
