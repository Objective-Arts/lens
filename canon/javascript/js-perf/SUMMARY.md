# /js-perf Summary

> "The fastest code is the code you don't ship."

## Core Web Vitals Targets

| Metric | Target | What It Measures |
|--------|--------|------------------|
| **LCP** | < 2.5s | Largest Contentful Paint |
| **INP** | < 200ms | Interaction to Next Paint |
| **CLS** | < 0.1 | Cumulative Layout Shift |

## Loading Strategy

```html
<!-- Critical CSS inline -->
<style>/* Above-fold only */</style>

<!-- Preload critical resources -->
<link rel="preload" href="critical.js" as="script">
<link rel="preload" href="hero.webp" as="image">

<!-- Defer non-critical -->
<script defer src="analytics.js"></script>

<!-- Preconnect to third parties -->
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
```

## Image Optimization

```html
<!-- Modern formats with fallback -->
<picture>
  <source srcset="hero.avif" type="image/avif">
  <source srcset="hero.webp" type="image/webp">
  <img src="hero.jpg" loading="lazy" decoding="async" alt="...">
</picture>

<!-- LCP image: eager load, high priority -->
<img src="hero.jpg" loading="eager" fetchpriority="high" alt="...">
```

## Code Splitting

```javascript
// Route-based (React)
const Dashboard = React.lazy(() => import('./Dashboard'));

// Prefetch during idle
import(/* webpackPrefetch: true */ './HeavyComponent');
```

## Runtime Performance

```javascript
// Break up long tasks
requestIdleCallback(processChunk);

// Debounce/throttle expensive handlers
const handleScroll = throttle(updateUI, 100);
```

## Bundle Rules

```javascript
// BAD - imports entire library
import _ from 'lodash';

// GOOD - imports only what's needed
import debounce from 'lodash/debounce';
```

## Concrete Checks (MUST ANSWER)

- [ ] Have you identified hot loops or repeated DOM queries and confirmed they are necessary with a profiler (not guesswork)?
- [ ] Are DOM reads grouped before DOM writes to avoid forced synchronous layout (no interleaved read/write sequences)?
- [ ] Are scroll, resize, and input event handlers debounced or throttled with an explicit interval?
- [ ] Does every `import` pull in only the specific function/module needed, not an entire library namespace?
- [ ] Is the LCP element loaded with `fetchpriority="high"` and `loading="eager"` (not lazy)?
- [ ] Have you verified bundle size impact of any new dependency with `bundlephobia` or equivalent before adding it?
