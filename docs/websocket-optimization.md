# WebSocket Optimization for Real-Time Trading Data

This document covers optimization techniques for high-frequency WebSocket data in trading terminals.

## Current Architecture

Our WebSocket implementation uses:
- **Zustand store** for centralized subscription management
- **Reference counting** for shared subscriptions across components
- **Ring buffer** for trades with efficient fixed-size storage
- **useSyncExternalStore** for React concurrent mode compatibility

```
┌─────────────────────────────────────────────────────────────┐
│                     WebSocket Server                         │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  @nktkas/hyperliquid                         │
│                  (WebSocket Client)                          │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Zustand Store                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  subscriptions: {                                    │    │
│  │    "l2Book:BTC": { data, status, refCount }         │    │
│  │    "trades:BTC": { data, status, refCount }         │    │
│  │  }                                                   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Components                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ OrderbookPanel│  │ TradesPanel  │  │ ChartPanel   │      │
│  │ useSubL2Book  │  │ useSubTrades │  │ useSubCandle │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Problem Areas

### 1. High Message Frequency
Trading data can flood the UI with updates:
- **Orderbook**: Updates every 50-100ms during active trading
- **Trades**: Bursts of 100+ trades per second during volatility
- **Price updates**: Continuous stream of mid-price changes

### 2. Re-render Cascades
Each WebSocket message triggers:
```
setSubscriptionData → zustand state update → component re-render
```
At 100+ messages/second, this causes jank and dropped frames.

### 3. Main Thread Blocking
Heavy data processing (orderbook aggregation, trade deduplication) competes with rendering.

---

## Optimization Techniques

### 1. Message Batching with requestAnimationFrame

Buffer incoming messages and flush once per frame:

```typescript
// Pattern: Batch updates to align with display refresh
function createBatchedUpdater<T>() {
  let buffer: T[] = [];
  let rafId: number | null = null;
  let flushCallback: ((items: T[]) => void) | null = null;

  const flush = () => {
    rafId = null;
    if (buffer.length > 0 && flushCallback) {
      flushCallback(buffer);
      buffer = [];
    }
  };

  return {
    add: (item: T) => {
      buffer.push(item);
      if (rafId === null) {
        rafId = requestAnimationFrame(flush);
      }
    },
    setFlushCallback: (cb: (items: T[]) => void) => {
      flushCallback = cb;
    },
    dispose: () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    },
  };
}
```

**Benefits:**
- Reduces render frequency from 100+/sec to 60/sec (matching display)
- Groups multiple updates into single state change
- Up to 65% reduction in CPU usage

### 2. Delta Updates vs Full Snapshots

Instead of sending full orderbook snapshots, process deltas:

```typescript
// Current: Full snapshot on every update
type L2BookEvent = {
  levels: [PriceLevel[], PriceLevel[]]; // Full bids/asks
};

// Optimized: Delta updates
type L2BookDelta = {
  bids: { price: string; size: string; op: 'add' | 'update' | 'remove' }[];
  asks: { price: string; size: string; op: 'add' | 'update' | 'remove' }[];
};

// Apply delta to cached state
function applyDelta(book: L2Book, delta: L2BookDelta): L2Book {
  // Mutate in place for performance, return new reference
  const newBook = { ...book };
  // Apply bid/ask changes...
  return newBook;
}
```

**Benefits:**
- Traffic reduction: 5KB snapshot → 200B delta (~70% less bandwidth)
- Less parsing overhead on client
- Note: Requires server-side support

### 3. Ref-Based Updates for High-Frequency Data

Skip React state for data that updates faster than render:

```typescript
function useHighFrequencyData<T>(subscribe: (cb: (data: T) => void) => () => void) {
  const dataRef = useRef<T | null>(null);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    let rafId: number | null = null;
    let hasUpdate = false;

    const unsubscribe = subscribe((data) => {
      dataRef.current = data;
      hasUpdate = true;

      // Only schedule one render per frame
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          if (hasUpdate) {
            hasUpdate = false;
            forceUpdate();
          }
        });
      }
    });

    return () => {
      unsubscribe();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [subscribe]);

  return dataRef.current;
}
```

**When to use:**
- Price tickers updating multiple times per frame
- Data where only the latest value matters
- Animations driven by WebSocket data

### 4. Web Worker Offloading

Move heavy processing off the main thread:

```typescript
// worker.ts
self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'PROCESS_ORDERBOOK':
      const processed = aggregateOrderbook(payload, payload.grouping);
      self.postMessage({ type: 'ORDERBOOK_PROCESSED', payload: processed });
      break;
    case 'PROCESS_TRADES':
      const deduped = deduplicateTrades(payload);
      self.postMessage({ type: 'TRADES_PROCESSED', payload: deduped });
      break;
  }
};

// Main thread
const worker = new Worker(new URL('./orderbook.worker.ts', import.meta.url));

function useOrderbookWorker() {
  const [data, setData] = useState(null);

  useEffect(() => {
    worker.onmessage = (e) => {
      if (e.data.type === 'ORDERBOOK_PROCESSED') {
        setData(e.data.payload);
      }
    };
  }, []);

  const process = useCallback((raw: RawOrderbook) => {
    worker.postMessage({ type: 'PROCESS_ORDERBOOK', payload: raw });
  }, []);

  return { data, process };
}
```

**What to offload:**
- Orderbook aggregation by price level
- Trade deduplication and sorting
- Large data transformations
- Price calculations at scale

**Libraries:**
- [Comlink](https://github.com/GoogleChromeLabs/comlink) - Simplifies worker communication
- [workerize-loader](https://github.com/developit/workerize-loader) - Vite/Webpack integration

### 5. Backpressure Control

Prevent overwhelming the client when data arrives faster than it can be processed:

```typescript
function createBackpressureQueue<T>(
  process: (items: T[]) => void,
  options: {
    maxQueueSize: number;
    flushInterval: number;
    dropStrategy: 'oldest' | 'newest';
  }
) {
  const queue: T[] = [];
  let intervalId: NodeJS.Timeout | null = null;

  const flush = () => {
    if (queue.length > 0) {
      process([...queue]);
      queue.length = 0;
    }
  };

  const start = () => {
    if (!intervalId) {
      intervalId = setInterval(flush, options.flushInterval);
    }
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    flush(); // Process remaining
  };

  const add = (item: T) => {
    if (queue.length >= options.maxQueueSize) {
      if (options.dropStrategy === 'oldest') {
        queue.shift(); // Remove oldest
      } else {
        return; // Drop new item
      }
    }
    queue.push(item);
  };

  return { add, start, stop, flush };
}
```

**Strategies:**
- **Bounded buffer**: Limit queue size, drop oldest when full
- **Sampling**: Only process every Nth message
- **Throttling**: Limit processing rate regardless of input rate
- **Server-side slowdown**: Signal server to reduce rate (requires protocol support)

### 6. Subscription Multiplexing

Share subscriptions across components:

```typescript
// Current implementation already does this!
// src/lib/hyperliquid/store.ts uses refCount

acquireSubscription: (key, subscribe) => {
  let runtime = subscriptionRuntime.get(key);
  if (!runtime) {
    runtime = { refCount: 0 };
    subscriptionRuntime.set(key, runtime);
  }
  runtime.refCount += 1; // Multiple components share one subscription
  // ...
};
```

### 7. Virtualization for Large Lists

Already implemented with TanStack Virtual. Ensure it's used for:
- Trade history (100+ items)
- Order lists
- Position tables

---

## Implementation Priority

| Technique | Impact | Effort | Current State |
|-----------|--------|--------|---------------|
| Subscription multiplexing | High | Low | ✅ Implemented |
| Ring buffer for trades | High | Medium | ✅ Implemented |
| Virtualization | High | Medium | ✅ Implemented |
| rAF batching | High | Medium | ❌ Not implemented |
| Ref-based updates | Medium | Low | ❌ Not implemented |
| Web Worker offloading | Medium | High | ❌ Not implemented |
| Delta updates | High | High | ⚠️ Requires server changes |
| Backpressure control | Medium | Medium | ❌ Not implemented |

---

## Monitoring WebSocket Performance

Use the performance tools we set up:

```javascript
// In dev console
window.perf.network()  // Shows WebSocket message rates

// Custom monitoring
let messageCount = 0;
const interval = setInterval(() => {
  console.log(`Messages/sec: ${messageCount}`);
  messageCount = 0;
}, 1000);
```

---

## Anti-Patterns to Avoid

### 1. State Update Per Message
```typescript
// ❌ Bad: Every message triggers state update
ws.onmessage = (e) => {
  setState(JSON.parse(e.data));
};

// ✅ Good: Batch updates
ws.onmessage = (e) => {
  batcher.add(JSON.parse(e.data));
};
```

### 2. Creating New Objects Unnecessarily
```typescript
// ❌ Bad: New array every message
const newLevels = [...levels, newLevel];

// ✅ Good: Mutate and signal change
levels.push(newLevel);
notifyChange();
```

### 3. Processing in Render
```typescript
// ❌ Bad: Heavy computation in render
function OrderbookPanel() {
  const processed = aggregateByPrice(raw, 50); // Runs every render!
}

// ✅ Good: useMemo or move to effect/worker
const processed = useMemo(
  () => aggregateByPrice(raw, grouping),
  [raw, grouping]
);
```

---

## References

- [Real-time State Management with WebSockets](https://moldstud.com/articles/p-real-time-state-management-in-react-using-websockets-boost-your-apps-performance)
- [React WebSocket High-Load Platform Guide](https://maybe.works/blogs/react-websocket)
- [WebSocket Architecture Best Practices](https://ably.com/topic/websocket-architecture-best-practices)
- [Backpressure in WebSocket Streams](https://skylinecodes.substack.com/p/backpressure-in-websocket-streams)
- [React App with WebSocket in WebWorker](https://jpsam7.medium.com/react-app-with-websocket-implemented-inside-webworker-aba6374e54f0)
- [Offload Work to Web Workers](https://web.dev/articles/off-main-thread)
- [requestAnimationFrame Batching Pattern](https://gist.github.com/glenjamin/3e8d65944d4f4761e521)
