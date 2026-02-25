---
name: nextjs
description: "Next.js App Router patterns and best practices"
allowed-tools: []
---

# Neutkens & Markbage: Server-First React

Next.js App Router is built on Sebastian Markbage's React Server Components model and Tim Neutkens' implementation. Core belief: **the server is the default, the client is the escape hatch.**

## The Foundational Principle

> "Components are server components by default. Only add 'use client' when you need browser APIs or interactivity."

If you're reaching for `'use client'`, ask whether the component truly needs browser state. Often, you can push interactivity into a smaller leaf component and keep the parent on the server.

## Core Principles

### 1. Server Components by Default

Server Components run on the server, have zero client JS bundle cost, and can directly access databases, filesystems, and secrets.

**Not this:**
```tsx
'use client';

import { useState, useEffect } from 'react';

export default function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`).then(r => r.json()).then(setUser);
  }, [userId]);

  if (!user) return <Spinner />;
  return <div>{user.name}</div>;
}
```

**This:**
```tsx
// Server Component — no directive needed, no loading state, no client JS
import { db } from '@/lib/db';

export default async function UserProfile({ userId }: { userId: string }) {
  const user = await db.user.findUnique({ where: { id: userId } });
  return <div>{user.name}</div>;
}
```

**Why it matters:**
- Zero client bundle for data display
- No loading/error state boilerplate
- Direct data access without API layer
- Secrets stay on the server

### 2. The 'use client' Boundary

`'use client'` marks the boundary where server tree ends and client tree begins. Everything imported by a client component becomes client code.

```
Server Component (default)
  ├── Server Component
  ├── Client Component ('use client')
  │   ├── Client Component (inherited)
  │   └── Client Component (inherited)
  └── Server Component
      └── Client Component ('use client')
```

**Push the boundary down:**
```tsx
// BAD: Entire page is client because of one onClick
'use client';

export default function ProductPage({ product }) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>  {/* Static — wasted client JS */}
      <p>{product.specs}</p>         {/* Static — wasted client JS */}
      <AddToCartButton id={product.id} />
    </div>
  );
}

// GOOD: Only the interactive part is client
// page.tsx (Server Component)
export default function ProductPage({ product }) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>{product.specs}</p>
      <AddToCartButton id={product.id} />
    </div>
  );
}

// add-to-cart-button.tsx
'use client';
export function AddToCartButton({ id }: { id: string }) {
  return <button onClick={() => addToCart(id)}>Add to Cart</button>;
}
```

### 3. Data Fetching in Server Components

Fetch data where you render it. No prop drilling from layouts, no global state, no client-side fetching for initial data.

```tsx
// Each component fetches its own data — Next.js deduplicates
async function Header() {
  const user = await getUser(); // Deduped if called elsewhere too
  return <nav>{user.name}</nav>;
}

async function Sidebar() {
  const user = await getUser(); // Same request, deduped by React cache
  const prefs = await getUserPreferences(user.id);
  return <aside>{/* ... */}</aside>;
}
```

**Caching and revalidation:**
```tsx
// Static by default (cached indefinitely)
const data = await fetch('https://api.example.com/posts');

// Revalidate every 60 seconds
const data = await fetch('https://api.example.com/posts', {
  next: { revalidate: 60 }
});

// No cache (dynamic)
const data = await fetch('https://api.example.com/posts', {
  cache: 'no-store'
});
```

### 4. Server Actions for Mutations

Server Actions replace API routes for mutations. They run on the server, work without JavaScript, and integrate with forms.

```tsx
// actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const body = formData.get('body') as string;

  // Validate
  if (!title || title.length < 3) {
    return { error: 'Title must be at least 3 characters' };
  }

  // Mutate
  await db.post.create({ data: { title, body } });

  // Revalidate and redirect
  revalidatePath('/posts');
  redirect('/posts');
}
```

**In a form (works without JS):**
```tsx
import { createPost } from './actions';

export default function NewPostForm() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <textarea name="body" />
      <button type="submit">Create</button>
    </form>
  );
}
```

**With client-side enhancement:**
```tsx
'use client';

import { useActionState } from 'react';
import { createPost } from './actions';

export default function NewPostForm() {
  const [state, formAction, isPending] = useActionState(createPost, null);

  return (
    <form action={formAction}>
      <input name="title" required />
      {state?.error && <p className="error">{state.error}</p>}
      <button disabled={isPending}>
        {isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

### 5. App Router File Conventions

The file system is the router. Special files control behavior:

```
app/
  layout.tsx        # Shared UI, persists across navigation
  page.tsx          # Unique UI for route, makes route accessible
  loading.tsx       # Suspense fallback for page
  error.tsx         # Error boundary for segment ('use client' required)
  not-found.tsx     # 404 UI
  route.ts          # API endpoint (GET, POST, etc.)
  template.tsx      # Like layout but remounts on navigation

  dashboard/
    layout.tsx      # Nested layout (wraps dashboard pages)
    page.tsx        # /dashboard
    settings/
      page.tsx      # /dashboard/settings

  blog/
    [slug]/
      page.tsx      # /blog/:slug (dynamic segment)

  (marketing)/      # Route group — no URL impact
    about/
      page.tsx      # /about
    pricing/
      page.tsx      # /pricing
```

**Layouts persist, templates remount:**
```tsx
// layout.tsx — state preserved across child navigations
export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />     {/* Does NOT remount when navigating */}
      <main>{children}</main>
    </div>
  );
}
```

### 6. Loading and Error States

Use file conventions instead of manual Suspense/ErrorBoundary wiring:

```tsx
// loading.tsx — automatic Suspense boundary
export default function Loading() {
  return <Skeleton />;
}

// error.tsx — automatic error boundary (must be 'use client')
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

**Streaming with Suspense for granular loading:**
```tsx
export default async function Page() {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* Shows immediately */}
      <Suspense fallback={<Skeleton />}>
        <SlowChart />  {/* Streams in when ready */}
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <SlowTable />  {/* Streams independently */}
      </Suspense>
    </div>
  );
}
```

### 7. Middleware

Runs before every request at the edge. Use for auth checks, redirects, rewrites — not heavy computation.

```tsx
// middleware.ts (project root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

---

## Anti-Patterns

### Don't Make Everything a Client Component

```tsx
// BAD: 'use client' on a page that just displays data
'use client';
export default function AboutPage() {
  return <div>About us</div>;  // No interactivity — should be server
}
```

### Don't Fetch in Client Components When Server Works

```tsx
// BAD: useEffect fetch for data available at render time
'use client';
export default function Posts() {
  const [posts, setPosts] = useState([]);
  useEffect(() => { fetch('/api/posts').then(/*...*/) }, []);
}

// GOOD: Server Component with direct data access
export default async function Posts() {
  const posts = await db.post.findMany();
  return <PostList posts={posts} />;
}
```

### Don't Create API Routes Just to Fetch in Server Components

```tsx
// BAD: API route → fetch from server component
// app/api/users/route.ts
export async function GET() { return Response.json(await getUsers()); }
// app/page.tsx
const res = await fetch('http://localhost:3000/api/users'); // Pointless roundtrip

// GOOD: Call the function directly
const users = await getUsers();
```

### Don't Pass Server-Only Data Through Client Boundaries

```tsx
// BAD: Serializing a database connection or secret through props
<ClientComponent dbConnection={db} />  // Will fail

// GOOD: Fetch on server, pass serializable data
const data = await db.query('SELECT ...');
<ClientComponent data={data} />
```

---

## Decision Framework

### When to Use 'use client'

| Need | Directive |
|------|-----------|
| Display data from DB/API | Server (default) |
| onClick, onChange, onSubmit handlers | `'use client'` |
| useState, useReducer, useEffect | `'use client'` |
| Browser APIs (window, localStorage) | `'use client'` |
| Forms with progressive enhancement | Server action + optional `'use client'` |
| Third-party client library (e.g., chart lib) | `'use client'` |

### When to Use Route Handlers vs Server Actions

| Operation | Use |
|-----------|-----|
| Form submission, data mutation | Server Action |
| Webhook endpoint | Route Handler |
| Third-party API proxy | Route Handler |
| File upload/download | Route Handler |
| GET request from external client | Route Handler |

### When to Use Static vs Dynamic Rendering

| Content | Rendering |
|---------|-----------|
| Blog post, docs, marketing page | Static (default) |
| User-specific dashboard | Dynamic (`no-store` or `cookies()`) |
| Periodically updated data | ISR (`revalidate: N`) |
| Real-time data | Dynamic + client polling or WebSocket |

---

## Reference: Best Practices by Topic

### File Conventions
See [file-conventions.md](./file-conventions.md) — project structure, special files, route segments, parallel/intercepting routes

### RSC Boundaries
See [rsc-boundaries.md](./rsc-boundaries.md) — async client component detection, non-serializable props, Server Action exceptions

### Async Patterns
See [async-patterns.md](./async-patterns.md) — Next.js 15+ async `params`, `searchParams`, `cookies()`, `headers()`

### Runtime Selection
See [runtime-selection.md](./runtime-selection.md) — Node.js vs Edge runtime

### Directives
See [directives.md](./directives.md) — `'use client'`, `'use server'`, `'use cache'`

### Functions
See [functions.md](./functions.md) — navigation hooks, server functions, generate functions

### Error Handling
See [error-handling.md](./error-handling.md) — error/not-found files, redirect, `unstable_rethrow`

### Data Patterns
See [data-patterns.md](./data-patterns.md) — Server Components vs Server Actions vs Route Handlers, avoiding waterfalls

### Route Handlers
See [route-handlers.md](./route-handlers.md) — `route.ts` basics, GET conflicts, when to use vs Server Actions

### Metadata & OG Images
See [metadata.md](./metadata.md) — static/dynamic metadata, `generateMetadata`, OG image generation

### Image Optimization
See [image.md](./image.md) — `next/image`, remote images, responsive sizes, blur placeholders, LCP priority

### Font Optimization
See [font.md](./font.md) — `next/font`, Google/local fonts, Tailwind integration, preloading

### Bundling
See [bundling.md](./bundling.md) — server-incompatible packages, CSS imports, ESM/CJS, bundle analysis

### Scripts
See [scripts.md](./scripts.md) — `next/script`, inline script IDs, loading strategies, `@next/third-parties`

### Hydration Errors
See [hydration-error.md](./hydration-error.md) — common causes, debugging, fixes

### Suspense Boundaries
See [suspense-boundaries.md](./suspense-boundaries.md) — CSR bailout, which hooks need Suspense

### Parallel & Intercepting Routes
See [parallel-routes.md](./parallel-routes.md) — modal patterns, `default.tsx` fallbacks, `router.back()`

### Self-Hosting
See [self-hosting.md](./self-hosting.md) — standalone output, Docker, cache handlers, multi-instance ISR

### Debug Tricks
See [debug-tricks.md](./debug-tricks.md) — MCP debugging endpoint, `--debug-build-paths`

---

## Code Review Checklist

- [ ] No `'use client'` on components that only display data
- [ ] Client boundary pushed to smallest interactive leaf
- [ ] Data fetched in server components, not via useEffect
- [ ] Server Actions used for mutations, not custom API routes
- [ ] Proper loading.tsx and error.tsx for each route segment
- [ ] Suspense boundaries around slow async components
- [ ] Middleware is thin — auth checks and redirects only
- [ ] No secrets or DB connections crossing client boundary
- [ ] Dynamic segments use generateStaticParams where possible
- [ ] Metadata exported for SEO (title, description, openGraph)

## When NOT to Use This Skill

Use a different skill when:
- **React component patterns** (hooks, state, composition) → Use `react-state`
- **React testing** → Use `react-test`
- **TypeScript types** → Use `typescript`
- **General frontend UI** → Use `components`, `visual`, `usability`

This is the **Next.js architecture skill** — use it for App Router structure, server/client boundaries, data fetching, and Server Actions.

## Sources

- Neutkens, Next.js App Router RFC and documentation
- Markbage, React Server Components RFC
- Vercel, "Thinking in Server Components"
- Next.js documentation (nextjs.org/docs)

---

*"Server Components let you move data fetching to the server, close to your data source."* — Sebastian Markbage
