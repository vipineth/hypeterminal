# Performance Optimization Guide

This is the central reference for performance optimization in Hypeterminal. It provides an overview of techniques and links to detailed documentation.

## Quick Links

| Topic | Doc | Status |
|-------|-----|--------|
| [Code Splitting](#code-splitting) | [tanstack-start-optimization.md](./tanstack-start-optimization.md) | ✅ Implemented |
| [Concurrent Rendering](#concurrent-rendering) | [concurrent-rendering.md](./concurrent-rendering.md) | 📋 Ready to implement |
| [WebSocket Optimization](#websocket-optimization) | [websocket-optimization.md](./websocket-optimization.md) | 📋 Ready to implement |
| [Memory Management](#memory-management) | [memory-management.md](./memory-management.md) | 📋 Reference |
| [Web3 Bundle](#web3-bundle-optimization) | [web3-bundle-optimization.md](./web3-bundle-optimization.md) | 📋 Ready to implement |

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| LCP (Largest Contentful Paint) | < 2.5s | TBD |
| INP (Interaction to Next Paint) | < 200ms | TBD |
| CLS (Cumulative Layout Shift) | < 0.1 | TBD |
| Initial JS (gzip) | < 450KB | 492KB |
| Index Route | < 200KB | 229KB |

---

## Code Splitting

**Status:** ✅ Implemented

Lazy load components that aren't needed on initial render.

```typescript
import { createLazyComponent } from "@/lib/lazy";

const HeavyComponent = createLazyComponent(
  () => import("./heavy-component"),
  "HeavyComponent"
);
```

**Key files:**
- `src/lib/lazy.ts` - Lazy loading utility
- `vite.config.ts` - `autoCodeSplitting: true`

**Results:** Index route reduced from 380KB → 229KB (-40%)

📖 [Full documentation](./tanstack-start-optimization.md)

---

## Concurrent Rendering

**Status:** 📋 Ready to implement

Use React 19's concurrent features to keep UI responsive during heavy updates.

### useTransition - For non-urgent state updates

```typescript
const [isPending, startTransition] = useTransition();

function handleTabChange(tab: string) {
  startTransition(() => setActiveTab(tab));
}

return <Content className={isPending ? "opacity-50" : ""} />;
```

**Use for:** Tab switching, filtering, navigation

### useDeferredValue - For expensive derived values

```typescript
const deferredData = useDeferredValue(data);
const processed = useMemo(() => heavyProcess(deferredData), [deferredData]);
```

**Use for:** Orderbook updates, search results, large lists

**Implementation targets:**
- [x] `positions-panel.tsx` - Tab switching
- [x] `orderbook-panel.tsx` - Orderbook updates
- [ ] `token-selector.tsx` - Search filtering

📖 [Full documentation](./concurrent-rendering.md)

---

## WebSocket Optimization

**Status:** 📋 Ready to implement

Optimize high-frequency real-time data updates.

### Message Batching

Buffer WebSocket messages and flush once per animation frame:

```typescript
function createBatchedUpdater<T>(flush: (items: T[]) => void) {
  let buffer: T[] = [];
  let rafId: number | null = null;

  return {
    add: (item: T) => {
      buffer.push(item);
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          flush(buffer);
          buffer = [];
          rafId = null;
        });
      }
    },
  };
}
```

**Benefits:** Reduces renders from 100+/sec to 60/sec max

### Current Architecture (Already Good)
- ✅ Zustand store with reference counting
- ✅ Ring buffer for trades
- ✅ useSyncExternalStore for concurrent mode

**Implementation targets:**
- [x] Create `src/lib/websocket/batch-updater.ts`
- [x] Integrate with `src/lib/hyperliquid/hooks/utils/useSub.ts`

📖 [Full documentation](./websocket-optimization.md)

---

## Memory Management

**Status:** 📋 Reference documentation

Prevent memory leaks in long-running trading sessions.

### Detection Workflow

1. Chrome DevTools → Memory tab
2. Take Heap Snapshot (baseline)
3. Perform user actions
4. Take another snapshot
5. Compare for growth
6. Filter by "Detached" for DOM leaks

### Key Patterns

```typescript
// Always clean up effects
useEffect(() => {
  const interval = setInterval(doSomething, 1000);
  return () => clearInterval(interval); // ✅ Cleanup
}, []);

// Abort async operations
useEffect(() => {
  const controller = new AbortController();
  fetch(url, { signal: controller.signal });
  return () => controller.abort(); // ✅ Cleanup
}, []);
```

**Audit checklist:**
- [x] useEffect cleanup functions (verified in order-entry, chart components)
- [x] Event listener removal (no leaks found)
- [x] Timer cleanup (order-toast, leverage components all have cleanup)
- [x] WebSocket unsubscribe (useSub.ts has proper cleanup)

📖 [Full documentation](./memory-management.md)

---

## Web3 Bundle Optimization

**Status:** 📋 Ready to implement

Reduce initial load by deferring wallet libraries.

### Current State
- `vendor-web3`: 246KB (75KB gzip)
- WalletConnect alone: ~50KB

### Lazy Load Connectors

```typescript
// Load WalletConnect only when needed
export async function getWalletConnectConnector() {
  const { walletConnect } = await import("wagmi/connectors");
  return walletConnect({ projectId: "..." });
}
```

**Implementation targets:**
- [ ] Lazy load WalletConnect connector
- [ ] Lazy load Coinbase connector
- [ ] Verify tree-shaking

📖 [Full documentation](./web3-bundle-optimization.md)

---

## Dev Tools

### Console API

In development, access performance tools via `window.perf`:

```javascript
window.perf.vitals()        // Core Web Vitals summary
window.perf.renders()       // Component render analysis
window.perf.memory()        // Memory trend analysis
window.perf.network()       // Network & WebSocket metrics
window.perf.snapshot()      // Take memory snapshot

// Leak detection
window.perf.leaks.enable()  // Start tracking component mounts/unmounts
window.perf.leaks.report()  // Show components that mounted but never unmounted
window.perf.leaks.get()     // Get leak data programmatically
window.perf.leaks.clear()   // Reset tracking data
```

### Production Monitoring

Web Vitals are collected in production. To send to analytics:

```typescript
import { setProductionReporter } from "@/lib/performance/web-vitals";

setProductionReporter((metrics) => {
  // Send to your analytics service
  analytics.track("web-vitals", metrics);
});
```

### Bundle Analysis

```bash
# Generate bundle visualization
pnpm build:analyze

# Compare against baseline
pnpm perf:compare
```

### React Performance Tracks

1. Chrome DevTools → Performance tab
2. Record interaction
3. Look for "React" section showing:
   - Scheduler (Blocking, Transition, Suspense, Idle)
   - Component render durations

---

## Implementation Priority

### Phase 1: Quick Wins (Low effort, high impact)
1. ✅ Code splitting with `lazyRouteComponent`
2. ✅ `useTransition` for tab switching
3. ✅ `useDeferredValue` for orderbook

### Phase 2: Medium Effort
4. 📋 Lazy load WalletConnect (~50KB savings) - requires wagmi config changes
5. ✅ rAF message batching for WebSocket
6. ✅ `useTransition` for token search

### Phase 3: Ongoing
7. ✅ Memory leak auditing tools (`window.perf.leaks`)
8. ✅ Performance monitoring in production (`setProductionReporter`)
9. 📋 React Performance Tracks profiling (use Chrome DevTools)

---

## Measuring Success

After each change, run:

```bash
pnpm build && pnpm perf:compare
```

Check for:
- Bundle size changes
- No regressions in functionality
- Improved perceived performance

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/lib/lazy.ts` | Lazy loading utility |
| `src/lib/performance/` | Performance monitoring |
| `vite.config.ts` | Build optimization |
| `perf-baseline.json` | Bundle size baseline |
| `scripts/compare-bundle.js` | Comparison script |
| `task.md` | Progress tracking |
