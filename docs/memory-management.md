# Memory Management & Leak Detection in React

This document covers memory leak detection techniques, common patterns, and prevention strategies for long-running React applications like trading terminals.

## Why Memory Management Matters

Trading terminals run for extended periods (hours). Even small memory leaks compound over time:
- **1KB leak × 1000 interactions = 1MB retained**
- Users experience slowdowns after prolonged use
- Eventually leads to tab crashes

---

## Detection Workflow

### 1. Chrome DevTools Heap Snapshot

**Step-by-step workflow:**

1. Open DevTools → Memory tab
2. Take **Heap Snapshot** (baseline)
3. Perform user actions (navigate, trade, switch tabs)
4. Take another **Heap Snapshot**
5. Select "Comparison" view between snapshots
6. Sort by **"# Delta"** or **"Size Delta"**
7. Look for unexpected growth

**Key columns:**
- **Shallow Size**: Memory directly held by object
- **Retained Size**: Memory that would be freed if object is GC'd
- Large discrepancy = object holding references to other objects

### 2. Finding Detached DOM Nodes

1. Take heap snapshot after suspected leak
2. In the filter box, type **"Detached"**
3. Look for **"Detached HTMLDivElement"** etc.
4. These are DOM nodes no longer in the document but still referenced

```
Detached DOM Tree indicates:
- Event listener holding reference
- Closure capturing element
- Component ref not cleaned up
```

### 3. Allocation Timeline Recording

1. Memory tab → Select "Allocation instrumentation on timeline"
2. Click Record
3. Perform actions
4. Stop recording
5. Blue bars = allocations still in memory
6. Gray bars = garbage collected (good!)

### 4. Performance Monitor

1. DevTools → More tools → Performance Monitor
2. Watch "JS heap size" over time
3. Steady increase = likely leak
4. Sawtooth pattern = normal GC behavior

---

## Common React Memory Leak Patterns

### 1. Missing useEffect Cleanup

```typescript
// ❌ Memory leak: timer not cleared on unmount
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 5000);
  // Missing cleanup!
}, []);

// ✅ Proper cleanup
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 5000);
  return () => clearInterval(interval);
}, []);
```

### 2. Event Listener Leaks

```typescript
// ❌ Listener never removed
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // Missing cleanup!
}, []);

// ✅ Proper cleanup
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### 3. Async Operations After Unmount

```typescript
// ❌ State update on unmounted component
useEffect(() => {
  fetchData().then(data => {
    setData(data); // May run after unmount!
  });
}, []);

// ✅ Use AbortController
useEffect(() => {
  const controller = new AbortController();

  fetchData({ signal: controller.signal })
    .then(data => setData(data))
    .catch(err => {
      if (err.name !== 'AbortError') throw err;
    });

  return () => controller.abort();
}, []);

// ✅ Alternative: mounted flag
useEffect(() => {
  let mounted = true;

  fetchData().then(data => {
    if (mounted) setData(data);
  });

  return () => { mounted = false; };
}, []);
```

### 4. Closure Capturing Stale References

```typescript
// ❌ Closure captures entire component scope
useEffect(() => {
  const handler = () => {
    // This closure may hold references to large objects
    console.log(largeObject);
  };

  ws.addEventListener('message', handler);
  return () => ws.removeEventListener('message', handler);
}, []); // largeObject captured in closure forever

// ✅ Use ref for latest value
const largeObjectRef = useRef(largeObject);
largeObjectRef.current = largeObject;

useEffect(() => {
  const handler = () => {
    console.log(largeObjectRef.current); // Access via ref
  };

  ws.addEventListener('message', handler);
  return () => ws.removeEventListener('message', handler);
}, []);
```

### 5. TanStack Query Cache Leaks

```typescript
// ❌ Storing blobs without cleanup
const { data } = useQuery({
  queryKey: ['image', id],
  queryFn: async () => {
    const blob = await fetchImage(id);
    return URL.createObjectURL(blob); // Never revoked!
  },
});

// ✅ Subscribe to cache removal
useEffect(() => {
  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'removed' && event.query.queryKey[0] === 'image') {
      URL.revokeObjectURL(event.query.state.data);
    }
  });
  return unsubscribe;
}, [queryClient]);
```

### 6. WebSocket Subscription Leaks

```typescript
// Our codebase handles this correctly in useSub.ts:
useEffect(() => {
  if (!enabled) return;
  const state = store.getState();
  state.acquireSubscription(key, () =>
    subscribeRef.current((data) => state.setSubscriptionData(key, data))
  );
  return () => store.getState().releaseSubscription(key); // ✅ Cleanup
}, [enabled, key, store]);
```

---

## Codebase Audit Checklist

### Files to Review

| File | Risk Area | Status |
|------|-----------|--------|
| `src/lib/hyperliquid/store.ts` | WebSocket subscriptions | ✅ Has cleanup |
| `src/lib/hyperliquid/hooks/utils/useSub.ts` | Subscription cleanup | ✅ Has cleanup |
| `src/components/trade/chart/trading-view-chart.tsx` | Timers, DOM refs | ✅ Has cleanup |
| `src/components/trade/chart/datafeed.ts` | Subscriptions | Needs review |
| `src/components/trade/order-entry/*.tsx` | Timers | Needs review |
| `src/stores/*.ts` | Zustand subscriptions | Needs review |

### What to Look For

1. **Every `useEffect` with side effects** should have a cleanup function
2. **Every `addEventListener`** should have matching `removeEventListener`
3. **Every `setInterval/setTimeout`** should have `clearInterval/clearTimeout`
4. **Every `subscribe`** should have matching `unsubscribe`
5. **Every `URL.createObjectURL`** should have `URL.revokeObjectURL`

---

## React 19 Considerations

### Automatic Cleanup Improvements

React 19's Strict Mode double-invokes effects in development, helping catch missing cleanups earlier.

### useSyncExternalStore

Our ring buffer uses `useSyncExternalStore` which handles cleanup correctly:

```typescript
// src/lib/circular-buffer/use-ring-buffer.ts
const items = useSyncExternalStore(
  store.subscribe,    // Subscribe function
  store.getSnapshot,  // Get current value
  store.getSnapshot   // Server snapshot
);
// React handles unsubscribe automatically
```

### React Compiler

The React Compiler (enabled in this project) doesn't affect cleanup behavior - you still need manual cleanup for side effects.

---

## Prevention Strategies

### 1. ESLint Rules

```json
{
  "rules": {
    "react-hooks/exhaustive-deps": "error"
  }
}
```

### 2. Custom Hooks for Common Patterns

```typescript
// useEventListener with automatic cleanup
function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Window | HTMLElement = window
) {
  const savedHandler = useRef(handler);
  savedHandler.current = handler;

  useEffect(() => {
    const listener = (event: Event) => savedHandler.current(event as WindowEventMap[K]);
    element.addEventListener(eventName, listener);
    return () => element.removeEventListener(eventName, listener);
  }, [eventName, element]);
}
```

### 3. Strict Cleanup Pattern

```typescript
// Template for effects with cleanup
useEffect(() => {
  // 1. Setup
  const cleanup = setup();

  // 2. Always return cleanup
  return () => {
    cleanup();
  };
}, [deps]);
```

---

## Monitoring Tools

### In Development

```javascript
// Use our performance tools
window.perf.memory()    // Memory trend analysis
window.perf.snapshot()  // Take memory snapshot
```

### Production Monitoring

Consider integrating:
- **Sentry** - Tracks JS heap size anomalies
- **LogRocket** - Session replay with memory metrics
- **Custom analytics** - Track heap size at intervals

---

## Testing for Leaks

### Manual Testing Protocol

1. Open app in incognito (clean state)
2. Take baseline heap snapshot
3. Perform action 10 times (e.g., switch tabs)
4. Force GC (DevTools Memory → trash can icon)
5. Take snapshot
6. Compare: Retained size should be similar to baseline

### Automated Testing (Experimental)

```typescript
// Using Puppeteer/Playwright
const metrics1 = await page.metrics();
// Perform actions
const metrics2 = await page.metrics();

const heapGrowth = metrics2.JSHeapUsedSize - metrics1.JSHeapUsedSize;
expect(heapGrowth).toBeLessThan(1_000_000); // < 1MB growth
```

---

## References

- [Chrome DevTools Memory Problems](https://developer.chrome.com/docs/devtools/memory-problems)
- [Understanding Memory Leaks in React](https://medium.com/@ignatovich.dm/understanding-memory-leaks-in-react-how-to-find-and-fix-them-fc782cf182be)
- [How to Identify and Fix Memory Leaks in React](https://dev.to/emmanuelo/how-to-identify-and-fix-memory-leaks-in-react-3bbh)
- [Sneaky React Memory Leaks: Closures vs React Query](https://www.schiener.io/2024-05-29/react-query-leaks)
- [TanStack Query Garbage Collection](https://tanstack.com/query/v4/docs/framework/react/guides/caching)
- [Memory Leaks in React Applications](https://shiftasia.com/community/memory-leaks-in-react-application-how-to-avoid/)
