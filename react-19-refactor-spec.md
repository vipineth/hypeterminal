# React 19 Refactoring Specification

> Analysis of hypeterminal codebase for React 19 best practices migration.
> Generated: 2026-01-02

---

## Executive Summary

| Category | Count | Action |
|----------|-------|--------|
| useEffect Anti-patterns | 14 | Fix |
| useMemo to REMOVE | 18 | Remove |
| useMemo to KEEP | 39 | Keep |
| useMemo to REVIEW | 7 | Profile |
| useCallback to KEEP | 25 | Keep |
| React.memo usage | 0 | N/A |
| forwardRef usage | 0 | N/A |

**Estimated Impact**: ~18 useMemo removals, 14 useEffect fixes = cleaner, faster code.

---

## Part 1: useEffect Anti-Patterns

### HIGH PRIORITY - Must Fix

#### 1. Unnecessary Derived State
**File**: `src/components/trade/components/wallet-dialog.tsx:19-21`

```tsx
// ❌ BAD - Derived state in useEffect
useEffect(() => {
  setHasConnector(connectors.length > 0);
}, [connectors]);

// ✅ FIX - Calculate directly
const hasConnector = connectors.length > 0;
```

**Impact**: Eliminates unnecessary state + re-render cycle.

---

#### 2. LocalStorage Initialization Flash
**File**: `src/components/trade/hooks/use-persistent-layout.ts:6-16`

```tsx
// ❌ BAD - Loading in useEffect causes flash of default content
useEffect(() => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const arr = JSON.parse(stored) as number[];
      if (Array.isArray(arr) && arr.every((n) => typeof n === "number")) {
        setLayout(arr);
      }
    }
  } catch {}
}, [key]);

// ✅ FIX - Initialize from localStorage
const [layout, setLayout] = useState<number[]>(() => {
  if (typeof window === 'undefined') return [...fallback];
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const arr = JSON.parse(stored) as number[];
      if (Array.isArray(arr) && arr.every((n) => typeof n === "number")) {
        return arr;
      }
    }
  } catch {}
  return [...fallback];
});
```

**Impact**: No flash of default layout on page load.

---

#### 3. State Reset on Prop Change (Should Use Key)
**File**: `src/components/trade/order-entry/order-entry-panel.tsx:101-107`

```tsx
// ❌ BAD - Manual reset with ref tracking
useEffect(() => {
  if (market?.marketKey && market.marketKey !== prevMarketKey) {
    setSizeInput("");
    setLimitPriceInput("");
    setPrevMarketKey(market.marketKey);
  }
}, [market?.marketKey, prevMarketKey]);

// ✅ FIX - Use key prop at parent level
// In parent component:
<OrderEntryPanel key={market?.marketKey} market={market} />

// Or extract form into separate component:
<OrderEntryForm key={market?.marketKey} />
```

**Impact**: Cleaner code, React handles reset automatically.

---

#### 4. State Reset on Coin Change
**File**: `src/components/trade/orderbook/trades-view.tsx:27-29`

```tsx
// ❌ BAD - Resetting state in useEffect
useEffect(() => {
  setTradeState((prev) => (prev.coin === coin ? prev : { coin, trades: [] }));
}, [coin]);

// ✅ FIX - Use key prop
// In parent:
<TradesView key={coin} coin={coin} />
```

---

#### 5. Complex State Sync with Refs
**File**: `src/components/trade/orderbook/order-book-panel.tsx:163-174`

```tsx
// ❌ BAD - Using refs to track previous values
useEffect(() => {
  if (prevCoinRef.current !== coin) {
    prevCoinRef.current = coin;
    if (priceGroupingOptions.length > 0) {
      setSelectedOption(priceGroupingOptions[0]);
    }
  }
  if (selectedOption === null && priceGroupingOptions.length > 0) {
    setSelectedOption(priceGroupingOptions[0]);
  }
}, [coin, priceGroupingOptions, selectedOption]);

// ✅ FIX - Initialize properly + use key
const [selectedOption, setSelectedOption] = useState<PriceGroupOption | null>(
  () => priceGroupingOptions[0] ?? null
);

// Parent uses key:
<OrderBookPanel key={coin} coin={coin} />
```

---

#### 6. Store-Driven State Updates
**File**: `src/components/trade/order-entry/order-entry-panel.tsx:109-115`

```tsx
// ❌ BAD - useEffect to sync from store
useEffect(() => {
  if (selectedPrice !== null) {
    setType("limit");
    setLimitPriceInput(String(selectedPrice));
    useOrderbookActionsStore.getState().clearSelectedPrice();
  }
}, [selectedPrice]);

// ✅ FIX - Handle via callback/event
// Option 1: Subscribe with callback in store
const handlePriceClick = (price: number) => {
  setType("limit");
  setLimitPriceInput(String(price));
};

// Pass to orderbook component
<OrderBook onPriceClick={handlePriceClick} />
```

---

### MEDIUM PRIORITY - Should Fix

#### 7. Selected Orders Cleanup
**File**: `src/components/trade/positions/orders-tab.tsx:44-59`

```tsx
// ❌ BAD - Syncing selection state with data
useEffect(() => {
  setSelectedOrderIds((prev) => {
    if (prev.size === 0) return prev;
    const next = new Set<number>();
    const openIds = new Set(openOrders.map((order) => order.oid));
    let changed = false;
    for (const id of prev) {
      if (openIds.has(id)) {
        next.add(id);
      } else {
        changed = true;
      }
    }
    return changed ? next : prev;
  });
}, [openOrders]);

// ✅ FIX - Derive valid selection during render
const validSelectedIds = useMemo(() => {
  if (selectedOrderIds.size === 0) return selectedOrderIds;
  const openIds = new Set(openOrders.map(o => o.oid));
  const valid = new Set([...selectedOrderIds].filter(id => openIds.has(id)));
  return valid.size === selectedOrderIds.size ? selectedOrderIds : valid;
}, [selectedOrderIds, openOrders]);

// Use validSelectedIds instead of selectedOrderIds in render
```

---

#### 8. Hydration Mount Flag
**File**: `src/components/trade/header/user-menu.tsx:42-44`

```tsx
// ❌ BAD - Mount flag for hydration
useEffect(() => {
  setMounted(true);
}, []);

// ✅ FIX - Use useSyncExternalStore or suppressHydrationWarning
// Option 1: For client-only content
{typeof window !== 'undefined' && <ClientOnlyContent />}

// Option 2: suppressHydrationWarning for minor mismatches
<span suppressHydrationWarning>{clientValue}</span>
```

---

#### 9. Interdependent Effects
**File**: `src/hooks/hyperliquid/use-perp-asset-ctxs-snapshot.ts:23-38`

```tsx
// ❌ BAD - Two effects managing related state
useEffect(() => {
  latestRef.current = liveCtxs;
  setSnapshot((prev) => (prev === undefined && liveCtxs !== undefined ? liveCtxs : prev));
}, [liveCtxs]);

useEffect(() => {
  if (!enabled) return;
  setSnapshot(latestRef.current);
  const id = window.setInterval(() => {
    setSnapshot(latestRef.current);
  }, intervalMs);
  return () => window.clearInterval(id);
}, [enabled, intervalMs]);

// ✅ FIX - Combine into single effect
useEffect(() => {
  if (!enabled) return;

  // Initialize with current value
  if (liveCtxs !== undefined) {
    setSnapshot(liveCtxs);
  }

  // Set up interval
  const id = setInterval(() => {
    if (liveCtxs !== undefined) {
      setSnapshot(liveCtxs);
    }
  }, intervalMs);

  return () => clearInterval(id);
}, [enabled, intervalMs, liveCtxs]);
```

---

#### 10. Complex Timer Management
**File**: `src/components/trade/order-entry/order-toast.tsx:116-140`

```tsx
// ❌ BAD - Multiple timers in single effect
useEffect(() => {
  const timers: NodeJS.Timeout[] = [];
  for (const order of orders) {
    if (order.status === "success" && order.completedAt) {
      const elapsed = Date.now() - order.completedAt;
      const remaining = ORDER_TOAST_SUCCESS_DURATION_MS - elapsed;
      if (remaining > 0) {
        const timer = setTimeout(() => removeOrder(order.id), remaining);
        timers.push(timer);
      } else {
        removeOrder(order.id);
      }
    }
  }
  return () => timers.forEach(clearTimeout);
}, [orders, removeOrder]);

// ✅ FIX - Extract to custom hook per order
function useAutoRemove(order: OrderQueueItem, onRemove: (id: string) => void) {
  useEffect(() => {
    if (order.status !== "success" || !order.completedAt) return;

    const elapsed = Date.now() - order.completedAt;
    const remaining = Math.max(0, ORDER_TOAST_SUCCESS_DURATION_MS - elapsed);

    if (remaining === 0) {
      onRemove(order.id);
      return;
    }

    const timer = setTimeout(() => onRemove(order.id), remaining);
    return () => clearTimeout(timer);
  }, [order.id, order.status, order.completedAt, onRemove]);
}

// Then map orders to individual components with the hook
```

---

### LOW PRIORITY - Consider Fixing

#### 11. TradingView Chart Complexity
**File**: `src/components/trade/chart/trading-view-chart.tsx:55-156`

Extract into custom hook `useTradingViewWidget` for better organization.

#### 12. Footer Clock
**File**: `src/components/trade/footer/footer-bar.tsx:10-13`

Consider visibility-aware timer or shared timer utility.

#### 13. Virtualizer Measurement
**File**: `src/components/trade/chart/use-token-selector.ts:142-149`

Valid use but could be extracted to reusable hook.

---

## Part 2: useMemo to Remove

These are safe to remove - React 19's compiler will handle them:

### order-entry-panel.tsx (10 removals)

| Line | Variable | Reason |
|------|----------|--------|
| 117-121 | `availableBalance` | Simple arithmetic |
| 128-130 | `positionSize` | Number parsing |
| 168-174 | `sizeValue` | Conditional math |
| 176-178 | `orderValue` | Multiplication |
| 180-183 | `marginRequired` | Division |
| 185-188 | `estimatedFee` | Multiplication |
| 190-195 | `liqPrice` | Arithmetic |
| 197-200 | `liqWarning` | Comparison |
| 446-448 | `sliderValue` | Simple conditional |
| 451-453 | `buttonContent` | String conditional |

### Other Files (8 removals)

| File | Line | Variable | Reason |
|------|------|----------|--------|
| positions-tab.tsx | 36-40 | `signer` | Simple conditional |
| orders-tab.tsx | 35-39 | `signer` | Simple conditional |
| orders-tab.tsx | 41 | `openOrders` | Fallback `?? []` |
| balances-tab.tsx | 83 | `totalValue` | Simple reduce |
| field.tsx | 173-180 | `content` | Conditional JSX |
| slider.tsx | 14-22 | `_values` | Array conditional |
| chart.tsx | 118+ | `tooltipLabel` | String formatting |
| account-panel.tsx | - | `hasData` | Boolean check |

---

## Part 3: useMemo to Keep

These require explicit memoization:

### Data Transformations (Keep)

| File | Variable | Reason |
|------|----------|--------|
| order-book-panel.tsx | `bids`, `asks` | `buildOrderBookRows()` transformation |
| order-book-panel.tsx | `maxTotal`, `mid`, `spread`, `spreadPct` | Cascading calculations |
| order-book-panel.tsx | `priceGroupingOptions` | Array generation |
| trades-view.tsx | `tradeRows` | Date formatting + mapping |
| twap-tab.tsx | `orders`, `activeOrders`, `tableRows` | Sorting + filtering |
| funding-tab.tsx | `updates`, `totalFunding`, `tableRows` | Sorting + aggregation |
| history-tab.tsx | `fills`, `tableRows` | Sorting + transformation |
| positions-panel.tsx | `positionsCount` | Aggregation loop |
| positions-tab.tsx | `positions`, `tableRows` | Filter + complex mapping |
| balances-tab.tsx | `balances`, `displayRows` | Aggregation + sorting |
| account-panel.tsx | `accountMetrics`, `summaryRows` | Loop calculations |
| favorites-strip.tsx | `favoriteData` | Registry lookups |

### Hooks & Utilities (Keep)

| File | Variable | Reason |
|------|----------|--------|
| use-market-registry.ts | `registry` | `buildPerpMarketRegistry()` |
| use-resolved-market.ts | `info`, `resolved` | Complex lookups |
| use-token-selector.ts | `markets`, `favoriteSet`, `filteredMarkets`, `sortedMarkets` | Filtering/sorting |
| use-hyperliquid-ws.ts | `key`, `data` | WebSocket subscription keys |
| use-trading-agent.ts | `apiWalletPrivateKey`, `agentAddress`, `isApproved`, `apiWalletSigner` | Crypto operations |
| sidebar.tsx | `contextValue` | Context optimization |

---

## Part 4: useMemo to Review (Profile First)

| File | Variable | Notes |
|------|----------|-------|
| order-entry-panel.tsx:134 | `leverage` | Object lookups |
| order-entry-panel.tsx:142 | `markPx` | Fallback chain |
| order-entry-panel.tsx:149 | `price` | Type conditional |
| order-entry-panel.tsx:154 | `maxSize` | Conditional math |
| order-entry-panel.tsx:204 | `validation` | Complex validation |
| positions-tab.tsx:112 | `handleClosePosition` | Async callback deps |
| use-token-selector.ts:84 | `handleSortingChange` | Empty dep callback |

---

## Part 5: Benchmarking Plan

### Metrics to Capture

1. **Render Performance**
   - Component render time (React DevTools Profiler)
   - Commit count per interaction
   - Total blocking time

2. **Bundle Size**
   - Before/after useMemo removal
   - Tree-shaking improvements

3. **Runtime Memory**
   - Heap snapshots
   - Memoization cache overhead

### Benchmark Script

```tsx
// src/benchmarks/react-19-benchmark.tsx
import { Profiler, ProfilerOnRenderCallback } from 'react';

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  console.log({
    component: id,
    phase,
    actualDuration: `${actualDuration.toFixed(2)}ms`,
    baseDuration: `${baseDuration.toFixed(2)}ms`,
    startTime,
    commitTime,
  });
};

// Wrap components to benchmark
<Profiler id="OrderEntryPanel" onRender={onRender}>
  <OrderEntryPanel />
</Profiler>
```

### Test Scenarios

1. **Order Entry Panel**
   - Type in price input (10 keystrokes)
   - Change leverage slider
   - Toggle buy/sell

2. **Order Book**
   - WebSocket updates (measure 100 updates)
   - Price grouping change

3. **Positions Table**
   - Initial render with 50 positions
   - Close position action

---

## Migration Order

### Phase 1: Quick Wins (Low Risk)
1. Remove derived state useEffect (`wallet-dialog.tsx`)
2. Fix localStorage initialization (`use-persistent-layout.ts`)
3. Remove simple useMemo calls (18 instances)

### Phase 2: Key Prop Migration (Medium Risk)
1. Add key props for market/coin changes
2. Remove related useEffect reset logic
3. Test form state preservation

### Phase 3: Complex Refactors (Higher Risk)
1. Store-driven state updates
2. Timer consolidation
3. Effect combination

### Phase 4: Validation
1. Run benchmarks before/after
2. Profile with React DevTools
3. Verify no regressions

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `wallet-dialog.tsx` | Remove useEffect, use direct calculation |
| `use-persistent-layout.ts` | Move localStorage to useState initializer |
| `order-entry-panel.tsx` | Remove 10 useMemo, fix 2 useEffect |
| `trades-view.tsx` | Use key prop instead of useEffect |
| `order-book-panel.tsx` | Use key prop, simplify initialization |
| `orders-tab.tsx` | Remove 2 useMemo, fix selection sync |
| `positions-tab.tsx` | Remove 1 useMemo |
| `user-menu.tsx` | Remove mount flag |
| `use-perp-asset-ctxs-snapshot.ts` | Combine effects |
| `order-toast.tsx` | Extract timer hook |
| `balances-tab.tsx` | Remove 1 useMemo |
| `field.tsx` | Remove 1 useMemo |
| `slider.tsx` | Remove 1 useMemo |
| `chart.tsx` | Remove 1 useMemo |
