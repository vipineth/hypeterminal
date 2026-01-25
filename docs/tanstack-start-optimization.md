# TanStack Start Performance Optimization Guide

This document covers performance optimization techniques specific to TanStack Start and TanStack Router.

## Code Splitting

### Automatic Route Code Splitting

TanStack Start supports automatic code splitting at the route level. Enable it in `vite.config.ts`:

```typescript
tanstackStart({
  router: {
    autoCodeSplitting: true,
  },
})
```

This automatically splits route components, loaders, and error boundaries into separate chunks.

### Component-Level Code Splitting with `lazyRouteComponent`

For heavy components within routes, use `lazyRouteComponent` instead of `React.lazy()`:

```typescript
import { lazyRouteComponent } from "@tanstack/react-router";

const HeavyChart = lazyRouteComponent(
  () => import("./heavy-chart"),
  "HeavyChart"
);
```

**Benefits over `React.lazy()`:**
- `.preload()` method for prefetching on hover/intent
- Auto-reload on stale builds (module not found recovery)
- Uses React 19's `React.use()` for better suspense integration

### Our Utility Wrapper

We provide a typed wrapper in `src/lib/lazy.ts`:

```typescript
import { createLazyComponent } from "@/lib/lazy";

// Named export
const Chart = createLazyComponent(() => import("./chart"), "Chart");

// Preload on hover
<button onMouseEnter={() => Chart.preload()}>Show Chart</button>
```

## What to Lazy Load

### Good Candidates (lazy load these)
- **Modals and dialogs** - Not visible on initial render
- **Mobile-only components** - Not needed on desktop
- **Tab content** - Only the active tab needs to load initially
- **Charts and visualizations** - Heavy and often not in viewport
- **Settings panels** - Rarely accessed immediately

### Bad Candidates (keep synchronous)
- **Above-the-fold content** - Causes layout shift
- **Core layout components** - Always visible
- **Small utility components** - Overhead not worth it

## Code Splitting Configuration

### Manual Chunk Grouping

In `vite.config.ts`, we configure manual chunks for vendor dependencies:

```typescript
function createManualChunks(id: string) {
  if (id.includes('node_modules')) {
    if (id.includes('@radix-ui')) return 'vendor-radix'
    if (id.includes('@tanstack/react-query') ||
        id.includes('@tanstack/react-table') ||
        id.includes('@tanstack/react-virtual')) return 'vendor-tanstack'
    if (id.includes('viem') || id.includes('wagmi')) return 'vendor-web3'
  }
}
```

### Code Split Groupings (Advanced)

For fine-grained control over what gets split per route:

```typescript
tanstackStart({
  router: {
    codeSplittingOptions: {
      defaultBehavior: [
        ['component'],
        ['pendingComponent'],
        ['errorComponent'],
        ['notFoundComponent'],
      ],
    },
  },
})
```

## Route-Level Code Splitting with `.lazy.tsx`

For routes with heavy components, split using the `.lazy.tsx` pattern:

**`routes/dashboard.tsx`** (critical path):
```typescript
export const Route = createFileRoute('/dashboard')({
  head: () => buildPageHead({ title: 'Dashboard' }),
})
```

**`routes/dashboard.lazy.tsx`** (code-split component):
```typescript
export const Route = createLazyFileRoute('/dashboard')({
  component: Dashboard,
})
```

## Preloading Strategies

### Link-Based Preloading

TanStack Router's `<Link>` component supports preloading:

```tsx
<Link
  to="/dashboard"
  preload="intent" // preload on hover/focus
>
  Dashboard
</Link>
```

Options:
- `"intent"` - Preload on hover/focus
- `"viewport"` - Preload when link enters viewport
- `"render"` - Preload immediately on render

### Programmatic Preloading

```typescript
const router = useRouter()

// Preload a route
router.preloadRoute({ to: '/dashboard' })

// Preload a lazy component
HeavyComponent.preload()
```

## Bundle Analysis

Run bundle analysis to identify optimization opportunities:

```bash
# Generate treemap visualization
pnpm build:analyze

# Compare against baseline
pnpm perf:compare
```

## Current Bundle Status

| Chunk | Size | Gzip | Notes |
|-------|------|------|-------|
| main | 568KB | 169KB | Core app code |
| index | 229KB | 70KB | Index route |
| vendor-web3 | 246KB | 75KB | viem, wagmi |
| vendor-radix | 152KB | 48KB | UI components |
| vendor-tanstack | 99KB | 28KB | Query, Table, Virtual |

### Code-Split Components
- trading-view-chart: 14.6KB
- mobile-terminal: 46.7KB
- deposit-modal: 26.8KB
- positions tabs: ~5-15KB each

## Best Practices

1. **Measure first** - Use `pnpm perf:compare` before and after changes
2. **Split by visibility** - Lazy load what's not immediately visible
3. **Group related code** - Keep related components in the same chunk
4. **Preload on intent** - Use hover/focus preloading for likely navigation
5. **Monitor chunk count** - Too many small chunks hurt HTTP/2 performance
