# React 19 Concurrent Rendering Optimization

This document covers `useTransition`, `useDeferredValue`, Suspense optimization, and React Performance Tracks for trading terminal optimization.

## Current State

**This codebase does not currently use `useTransition` or `useDeferredValue`.**

This presents an opportunity to improve perceived performance for:
- Tab switching in positions panel
- Token selector search/filtering
- Large table renders
- Chart symbol changes

---

## Core Concepts

### Urgent vs Non-Urgent Updates

React 19's concurrency model divides updates into:

| Priority | Examples | Behavior |
|----------|----------|----------|
| **Urgent** | Typing, clicking, selecting | Immediate render |
| **Transition** | Filtering, data loading, tab content | Can be interrupted |
| **Deferred** | Search results, secondary UI | Uses stale value during urgent updates |

**Key insight:** Transitions don't make code faster—they make the UI feel faster by prioritizing urgent updates.

---

## useTransition

### What It Does

Marks state updates as non-urgent, allowing React to interrupt them if urgent updates arrive.

```typescript
const [isPending, startTransition] = useTransition();

function handleTabChange(newTab: string) {
  // Urgent: update selected tab immediately
  setSelectedTab(newTab);

  // Non-urgent: render tab content can be interrupted
  startTransition(() => {
    setTabContent(loadTabContent(newTab));
  });
}
```

### When to Use

| Good Use Cases | Bad Use Cases |
|----------------|---------------|
| Tab switching | Form input values |
| Filter/search results | Toggle states |
| Large list renders | Modal open/close |
| Chart updates | Critical user feedback |
| Navigation | Payment flows |

### Trading Terminal Opportunities

#### 1. Positions Panel Tab Switching

```typescript
// src/components/trade/positions/positions-panel.tsx

function PositionsPanel() {
  const [selectedTab, setSelectedTab] = useState('positions');
  const [isPending, startTransition] = useTransition();

  const handleTabChange = (tab: string) => {
    startTransition(() => {
      setSelectedTab(tab);
    });
  };

  return (
    <Tabs value={selectedTab} onValueChange={handleTabChange}>
      {/* Tab content renders with lower priority */}
      <TabsContent value="positions" className={isPending ? 'opacity-70' : ''}>
        <PositionsTab />
      </TabsContent>
    </Tabs>
  );
}
```

#### 2. Token Selector Search

```typescript
// src/components/trade/chart/token-selector.tsx

function TokenSelector({ value, onValueChange }) {
  const [search, setSearch] = useState('');
  const [filteredTokens, setFilteredTokens] = useState(allTokens);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (query: string) => {
    setSearch(query); // Urgent: update input immediately

    startTransition(() => {
      // Non-urgent: filtering can be interrupted
      setFilteredTokens(
        allTokens.filter(t =>
          t.name.toLowerCase().includes(query.toLowerCase())
        )
      );
    });
  };

  return (
    <>
      <Input value={search} onChange={(e) => handleSearch(e.target.value)} />
      <TokenList tokens={filteredTokens} isLoading={isPending} />
    </>
  );
}
```

---

## useDeferredValue

### What It Does

Returns a deferred version of a value that "lags behind" during urgent updates.

```typescript
const deferredQuery = useDeferredValue(query);
const isStale = query !== deferredQuery;
```

### When to Use

Use `useDeferredValue` when:
- You don't control the state update (it comes from props)
- The consuming component is expensive to render
- Showing slightly stale data is acceptable

### Trading Terminal Opportunities

#### 1. Orderbook with Deferred Updates

```typescript
// src/components/trade/orderbook/orderbook-panel.tsx

function OrderbookPanel() {
  const { data: orderbook } = useSubL2Book({ coin: selectedMarket.coin });

  // Defer orderbook during other updates
  const deferredOrderbook = useDeferredValue(orderbook);
  const isStale = orderbook !== deferredOrderbook;

  // Process deferred value (won't block urgent updates)
  const bids = useMemo(
    () => processLevels(deferredOrderbook?.levels[0], VISIBLE_ROWS),
    [deferredOrderbook?.levels]
  );

  return (
    <div className={isStale ? 'opacity-80' : ''}>
      {bids.map(level => <OrderbookRow key={level.price} level={level} />)}
    </div>
  );
}
```

#### 2. Trades Panel with High-Frequency Updates

```typescript
function TradesPanel() {
  const { data: trades } = useSubTrades({ coin });

  // Defer trade list during other interactions
  const deferredTrades = useDeferredValue(trades);

  const processed = useMemo(
    () => processTrades(deferredTrades),
    [deferredTrades]
  );

  return <TradesList trades={processed} />;
}
```

---

## React 19 Improvements

### Automatic Batching in Transitions

```typescript
// React 18: May cause 2 renders
startTransition(() => {
  setState1(value1);
  setState2(value2);
});

// React 19: Automatically batched into 1 render
startTransition(() => {
  setState1(value1);
  setState2(value2);
});
```

### Smarter isPending

React 19 optimizes `isPending` to only trigger when the transition state actually changes, reducing unnecessary re-renders.

---

## Suspense Boundaries

### Current Usage

The codebase uses Suspense for lazy-loaded components:

```typescript
// src/components/trade/trade-terminal-page.tsx
<Suspense fallback={<MobileLoadingFallback />}>
  <MobileTerminal />
</Suspense>
```

### Optimization Tips

#### 1. Granular Boundaries

```typescript
// ❌ One boundary for entire page
<Suspense fallback={<PageLoader />}>
  <Header />
  <Chart />
  <Orderbook />
  <Positions />
</Suspense>

// ✅ Granular boundaries for independent sections
<Header />
<Suspense fallback={<ChartSkeleton />}>
  <Chart />
</Suspense>
<Suspense fallback={<OrderbookSkeleton />}>
  <Orderbook />
</Suspense>
<Suspense fallback={<PositionsSkeleton />}>
  <Positions />
</Suspense>
```

#### 2. Nested Boundaries for Priority

```typescript
// Critical content loads first
<Suspense fallback={<CriticalLoader />}>
  <CriticalContent />

  {/* Secondary content can load after */}
  <Suspense fallback={<SecondaryLoader />}>
    <SecondaryContent />
  </Suspense>
</Suspense>
```

### React 19.2 Suspense Batching

React 19.2 batches Suspense boundary reveals:
- Content that streams close together reveals together
- Improves animation experience
- Respects LCP thresholds (stops batching near 2.5s)

---

## React Performance Tracks

### What They Show

React 19.2 adds custom tracks to Chrome DevTools Performance panel:

| Track | Shows |
|-------|-------|
| **Scheduler** | Work scheduling across priority levels |
| **Blocking** | High-priority user interactions |
| **Transition** | Work wrapped in startTransition |
| **Suspense** | Fallback display and content reveal |
| **Idle** | Low-priority background work |
| **Components** | Individual component render times |

### How to Use

1. Open Chrome DevTools → Performance tab
2. Click Record
3. Interact with app
4. Stop recording
5. Look for "React" section in timeline

### What to Look For

- **Long blocking bars**: User interactions taking too long
- **Transition interruptions**: React properly deprioritizing work
- **Component flamegraph**: Which components take longest to render
- **Suspense timing**: How long fallbacks are shown

---

## Implementation Checklist

### Quick Wins (Low Effort, High Impact)

- [ ] Add `useTransition` to positions panel tab switching
- [ ] Add `useTransition` to token selector search
- [ ] Add `useDeferredValue` to orderbook renders

### Medium Effort

- [ ] Add `useTransition` to market switching
- [ ] Profile with React Performance Tracks
- [ ] Add loading states for `isPending`

### Higher Effort

- [ ] Audit all Suspense boundary placement
- [ ] Add granular skeletons per section
- [ ] Implement `useDeferredValue` for WebSocket data

---

## Common Mistakes

### 1. Wrapping Urgent Updates

```typescript
// ❌ Don't defer form input
startTransition(() => {
  setInputValue(e.target.value); // User expects immediate feedback!
});

// ✅ Only defer expensive derived state
setInputValue(e.target.value);
startTransition(() => {
  setFilteredResults(filterByQuery(e.target.value));
});
```

### 2. Expecting Faster Code

```typescript
// Transitions don't speed up slow code
startTransition(() => {
  processMillionRows(); // Still slow!
});

// They just prevent blocking urgent updates
```

### 3. Forgetting Loading States

```typescript
// ❌ No indication that content is updating
startTransition(() => setTab(newTab));

// ✅ Show pending state
const [isPending, startTransition] = useTransition();
startTransition(() => setTab(newTab));
return <Content className={isPending ? 'opacity-50' : ''} />;
```

---

## References

- [useTransition - React Docs](https://react.dev/reference/react/useTransition)
- [useDeferredValue - React Docs](https://react.dev/reference/react/useDeferredValue)
- [React Performance Tracks](https://react.dev/reference/dev-tools/react-performance-tracks)
- [React 19.2 Release Notes](https://react.dev/blog/2025/10/01/react-19-2)
- [React 19 Concurrency Deep Dive](https://dev.to/a1guy/react-19-concurrency-deep-dive-mastering-usetransition-and-starttransition-for-smoother-uis-51eo)
- [React 19 useDeferredValue Deep Dive](https://dev.to/a1guy/react-19-usedeferredvalue-deep-dive-how-to-keep-your-ui-smooth-when-things-get-heavy-1gdl)
- [useTransition Performance Analysis](https://www.developerway.com/posts/use-transition)
- [React 19.2 INP Optimization](https://calendar.perfplanet.com/2025/react-19-2-further-advances-inp-optimization/)
