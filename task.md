# Performance Optimization Task - Hypeterminal

## Project Context
- **React Version**: 19.2.0 with React Compiler enabled
- **Build Tool**: Vite 7 + Rollup (TanStack Start SSR)
- **State Management**: Zustand, TanStack Query
- **Real-time**: WebSocket for trading data
- **UI**: Radix UI, TanStack Virtual/Table

---

## Phase 1: Measurement Infrastructure Setup

### 1.1 Core Web Vitals Monitoring
- [x] Install `web-vitals` library for LCP, INP, CLS tracking
- [x] Create performance monitoring utility (`src/lib/performance/web-vitals.ts`)
- [x] Set up reporting to console/analytics in dev mode

**Targets (2026 Standards):**
- LCP (Largest Contentful Paint): < 2.5s
- INP (Interaction to Next Paint): < 200ms
- CLS (Cumulative Layout Shift): < 0.1

### 1.2 Bundle Analysis Setup
- [x] Install `vite-bundle-analyzer` for treemap visualization
- [x] Install `rollup-plugin-visualizer` for circular diagrams
- [ ] Consider `sonda` for sourcemap-based accurate post-minification analysis
- [x] Add npm scripts for analysis (`pnpm build:analyze`, `pnpm perf:bundle`)

### 1.3 React 19.2 Performance Tracks
- [ ] Document how to use new Chrome DevTools React Performance Tracks
- [ ] Scheduler track analysis (Blocking, Transition, Suspense, Idle)
- [ ] Component render duration visualization

### 1.4 React DevTools Profiler Setup
- [ ] Enable "Record why each component rendered" in settings
- [ ] Document profiling workflow for the team
- [ ] Set up profiling builds (`react-dom/profiling`)

---

## Phase 2: Profiling & Measurement

### 2.1 Component Render Analysis
- [ ] Profile initial page load with React DevTools
- [ ] Identify components with excessive re-renders
- [ ] Check React Compiler effectiveness (auto-memoization)
- [ ] Identify architectural issues compiler can't fix

### 2.2 Memory Leak Detection
- [ ] Take baseline heap snapshot
- [ ] Perform typical user flows (navigate, trade, etc.)
- [ ] Compare heap snapshots for growth
- [ ] Search for "Detached DOM nodes"
- [ ] Audit useEffect cleanup functions
- [ ] Check WebSocket subscription cleanup
- [ ] Check TanStack Query subscription cleanup

### 2.3 Network Performance
- [ ] Analyze WebSocket message frequency
- [ ] Check for unnecessary full payload updates (vs delta)
- [ ] Profile API request waterfall
- [ ] Check for request deduplication (TanStack Query)

### 2.4 Bundle Analysis
- [x] Generate production build with source maps
- [x] Run bundle analyzer
- [x] Identify large dependencies
- [x] Check tree-shaking effectiveness
- [x] Identify code splitting opportunities
- [x] Store baseline metrics (`perf-baseline.json`)
- [x] Create comparison script (`pnpm perf:compare`)

---

## Phase 3: React 19 Optimization Techniques

### 3.1 Concurrent Rendering Optimization
- [ ] Audit `useTransition` usage for heavy state updates
- [ ] Implement `startTransition` for non-urgent updates
- [ ] Use `useDeferredValue` for expensive derived state
- [ ] Check proper Lane prioritization in Performance Tracks

**Use cases to check:**
- Tab switching
- Large table/list rendering
- Chart updates
- Search/filter operations

### 3.2 React Compiler Analysis
- [ ] Verify compiler is working (check build output)
- [ ] Identify patterns compiler can't optimize
- [ ] Remove manual memo/useCallback where compiler handles it
- [ ] Keep manual optimization for edge cases

### 3.3 Suspense Boundaries
- [ ] Audit Suspense boundary placement
- [ ] Check for over-nested boundaries
- [ ] Implement granular loading states

---

## Phase 4: Real-time Data Optimization

### 4.1 WebSocket Optimization
- [ ] Implement message batching (buffer in ref, flush on interval)
- [ ] Audit re-render frequency on WebSocket messages
- [ ] Consider delta updates for orderbook/trades
- [ ] Implement backpressure control if needed

### 4.2 Virtualization Audit
- [ ] Check TanStack Virtual usage for large lists
- [ ] Ensure orderbook uses virtualization
- [ ] Ensure trade history uses virtualization
- [ ] Check positions/orders tables

### 4.3 Heavy Computation Offloading
- [ ] Identify CPU-intensive calculations
- [ ] Consider Web Workers for:
  - Large data aggregation
  - Chart calculations
  - Price formatting at scale

---

## Phase 5: Memory Management

### 5.1 Subscription Cleanup
- [ ] Audit all useEffect hooks for proper cleanup
- [ ] Check WebSocket listeners removal
- [ ] Check event listener cleanup
- [ ] Check interval/timeout cleanup
- [ ] Verify TanStack Query unsubscribe on unmount

### 5.2 Reference Management
- [ ] Check for closures holding stale references
- [ ] Audit large object retention
- [ ] Check for detached DOM node patterns

---

## Phase 6: Build Optimization

### 6.1 Code Splitting
- [x] Analyze current chunk strategy
- [x] Implement route-based splitting (TanStack Router `autoCodeSplitting: true`)
- [x] Lazy load heavy components using `lazyRouteComponent`:
  - TradingViewChart, MobileTerminal, GlobalModals
  - DepositModal, GlobalSettingsDialog
  - All position tabs (Balances, Funding, History, Orders, Positions, Twap)
- [x] Check vendor chunk optimization (radix, tanstack, web3)
- [x] Created `src/lib/lazy.ts` utility for consistent lazy loading
- [x] Created `docs/tanstack-start-optimization.md` documentation

### 6.2 Tree Shaking Verification
- [ ] Verify ESM imports throughout
- [ ] Check sideEffects in package.json
- [ ] Audit barrel imports (avoid re-exporting everything)
- [ ] Check icon library tree-shaking

### 6.3 Asset Optimization
- [ ] Check image optimization
- [ ] Verify font loading strategy
- [ ] Check CSS delivery (Tailwind purging)

---

## Tools & Commands Reference

### Bundle Analysis
```bash
# Generate bundle visualization (opens treemap in browser)
pnpm build:analyze

# Alternative: quick bundle visualizer
pnpm perf:bundle

# Compare current build to baseline (run after pnpm build)
pnpm perf:compare
```

### Dev Console Performance API
In development mode, access performance tools via `window.perf`:
```javascript
// Core Web Vitals summary
window.perf.vitals()

// Component render analysis
window.perf.renders()

// Memory trend analysis
window.perf.memory()

// Network & resource analysis
window.perf.network()

// Take memory snapshot
window.perf.snapshot()
```

### Profiling Build
```typescript
// For production profiling
import { createRoot } from 'react-dom/profiling'
```

### Memory Profiling (Chrome DevTools)
1. Open DevTools → Memory tab
2. Take Heap Snapshot (baseline)
3. Perform user actions
4. Take another snapshot
5. Compare snapshots
6. Filter by "Detached" to find leaks

### React Performance Tracks (Chrome DevTools)
1. Open DevTools → Performance tab
2. Record interaction
3. Look for "React" tracks:
   - Scheduler (Blocking, Transition, Suspense, Idle)
   - Components render duration

---

## Research Sources

### React 19 Performance
- [React Performance Tracks](https://react.dev/reference/dev-tools/react-performance-tracks)
- [React Profiler Component](https://react.dev/reference/react/Profiler)
- [useTransition](https://react.dev/reference/react/useTransition)

### Core Web Vitals
- [web-vitals Library](https://github.com/GoogleChrome/web-vitals)
- [Web.dev Vitals Guide](https://web.dev/articles/vitals)

### Memory Leaks
- [Chrome DevTools Memory](https://developer.chrome.com/docs/devtools/memory-problems)
- [Heap Snapshots](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots)

### Bundle Analysis
- [vite-bundle-analyzer](https://github.com/nonzzz/vite-bundle-analyzer)
- [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer)
- [Sonda (sourcemap-based)](https://sonda.dev/)

---

## Progress Log

### Day 1 - Research & Setup
- [x] Researched React 19.2 performance measurement techniques
- [x] Documented React Performance Tracks (new in 19.2)
- [x] Documented Core Web Vitals targets
- [x] Created measurement infrastructure plan
- [x] Installed web-vitals library
- [x] Set up bundle analyzers (vite-bundle-analyzer, rollup-plugin-visualizer)
- [x] Created performance monitoring utilities:
  - `src/lib/performance/web-vitals.ts` - Core Web Vitals tracking (LCP, INP, CLS, FCP, TTFB)
  - `src/lib/performance/memory.ts` - Heap memory monitoring & leak detection
  - `src/lib/performance/render-tracker.ts` - Component render profiling
  - `src/lib/performance/network.ts` - Network & WebSocket metrics
  - `src/lib/performance/profiler.tsx` - React Profiler wrapper component
  - `src/lib/performance/init.ts` - Auto-initialization for dev mode
- [x] Integrated performance monitoring into RootProvider
- [x] Added `window.perf` dev tools API for console access
- [x] Configured Vite with manual chunks for better code splitting
- [x] Created initial profiling baseline (`perf-baseline.json`)
- [x] Ran bundle analysis and identified optimization targets
- [x] Created `pnpm perf:compare` script for tracking improvements

### Day 1 - Code Splitting Implementation
- [x] Researched TanStack Start/Router code splitting best practices
- [x] Enabled `autoCodeSplitting: true` in TanStack Start vite plugin
- [x] Created `src/lib/lazy.ts` utility using `lazyRouteComponent`
- [x] Implemented component-level code splitting:
  - `MobileTerminal` (46.7KB split from main)
  - `GlobalModals` including DepositModal & GlobalSettingsDialog
  - `TradingViewChart` (14.6KB split)
  - All 6 position tabs (Balances, Funding, History, Orders, Positions, Twap)
- [x] Created `docs/tanstack-start-optimization.md` documentation
- [x] **Results**: Index route reduced from 380KB to 229KB (-40%)

### Day 2 - Runtime Performance Research & Documentation
- [x] Created `docs/websocket-optimization.md`:
  - Message batching with requestAnimationFrame
  - Backpressure control patterns
  - Web Worker offloading strategies
  - Delta updates vs full snapshots
- [x] Created `docs/memory-management.md`:
  - Chrome DevTools heap snapshot workflow
  - Common React memory leak patterns
  - useEffect cleanup checklist
  - TanStack Query cache cleanup
- [x] Created `docs/concurrent-rendering.md`:
  - useTransition for non-urgent updates
  - useDeferredValue for expensive renders
  - React 19.2 Performance Tracks
  - Suspense boundary optimization
- [x] Created `docs/web3-bundle-optimization.md`:
  - wagmi/viem lazy loading challenges
  - Connector lazy loading strategies
  - Tree-shaking verification

---

## Phase 2: Runtime Performance Optimization ✅ COMPLETE

### Task 1: WebSocket Optimization ✅
- [x] Researched message batching strategies (buffer + rAF flush)
- [x] Researched backpressure handling for high-frequency updates
- [x] Researched delta updates vs full payload patterns
- [x] Researched Web Worker offloading for message processing
- [x] Created `docs/websocket-optimization.md`

**Key findings:**
- Current architecture uses Zustand store with reference counting (good)
- Ring buffer already implemented for trades (good)
- Opportunities: rAF batching, ref-based updates, Web Workers

### Task 2: Memory Management & Leak Detection ✅
- [x] Documented Chrome DevTools heap snapshot workflow
- [x] Documented common React memory leak patterns
- [x] Audited useEffect cleanup patterns in codebase
- [x] Documented TanStack Query cleanup strategies
- [x] Documented WebSocket listener cleanup patterns
- [x] Created `docs/memory-management.md`

**Key findings:**
- Most cleanup patterns are implemented correctly
- useSub hook has proper cleanup
- Ring buffer uses useSyncExternalStore correctly

### Task 3: React 19 Concurrent Rendering ✅
- [x] Researched useTransition for tab switching, filters
- [x] Researched useDeferredValue for expensive derived state
- [x] Researched Suspense boundary optimization
- [x] Documented React Performance Tracks usage
- [x] Created `docs/concurrent-rendering.md`

**Key findings:**
- No useTransition/useDeferredValue currently used
- Opportunities: positions panel tabs, token selector, orderbook

### Task 4: Defer vendor-web3 Loading ✅
- [x] Researched dynamic import patterns for wagmi
- [x] Identified wallet-dependent code paths (31 files)
- [x] Documented lazy connector loading approach
- [x] Created `docs/web3-bundle-optimization.md`

**Key findings:**
- Full lazy load difficult due to provider requirement
- WalletConnect connector (~50KB) can be lazy loaded
- Tree-shaking already in use

---

## Metrics to Track

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| LCP | < 2.5s | TBD (run app) | 🔴 |
| INP | < 200ms | TBD (run app) | 🔴 |
| CLS | < 0.1 | TBD (run app) | 🔴 |
| Bundle Size (JS) | < 500KB main | 568KB | 🟡 |
| Memory (idle) | TBD | TBD | 🔴 |
| Memory (after 10min) | TBD | TBD | 🔴 |

### Bundle Breakdown (Client) - Updated Jan 23 (After Code Splitting)
| Chunk | Size | Gzip | Notes |
|-------|------|------|-------|
| **main** | 568KB | 169KB | Core app code (-14KB) |
| **index** | 229KB | 70KB | ✅ Index route (-151KB, -40%) |
| vendor-web3 | 246KB | 75KB | viem, wagmi |
| vendor-radix | 152KB | 48KB | Radix UI components |
| vendor-tanstack | 99KB | 28KB | Query, Table, Virtual |
| init (perf) | 6KB | 2.5KB | Performance monitoring |
| styles | 123KB | 19KB | CSS (Tailwind) |
| i18n messages | ~66KB | ~28KB | 5 locale files |
| **code-split chunks** | 153KB | 54KB | Lazy-loaded components |

**Total Client JS: ~1.64MB (gzip: ~494KB)**

### Code-Split Chunks Created
| Component | Size | Gzip |
|-----------|------|------|
| mobile-terminal | 46.7KB | 15.2KB |
| deposit-modal | 26.8KB | 8.6KB |
| positions-tab | 15.4KB | 5.0KB |
| trading-view-chart | 14.6KB | 5.2KB |
| orders-tab | 13.2KB | 5.3KB |
| global-settings-dialog | 10.2KB | 3.6KB |
| twap-tab | 6.6KB | 2.6KB |
| history-tab | 6.2KB | 2.5KB |
| funding-tab | 5.8KB | 2.4KB |
| balances-tab | 5.2KB | 2.2KB |

### Key Optimization Opportunities
1. **main.js (582KB)** - Split by feature/route
   - Trading components
   - Chart components (recharts)
   - Order entry forms

2. **index.js (380KB)** - Lazy load non-critical
   - Modals/dialogs
   - Settings panels

3. **vendor-web3 (251KB)** - Load on wallet connect
   - Defer until user needs wallet features

4. **Locale files** - Load only user's language

---

## Notes

### What React Compiler Can't Fix
1. **Architectural Issues** - Rendering too many components upfront
2. **Virtualization** - Must be manually implemented
3. **Data Fetching Patterns** - N+1 queries, waterfalls
4. **WebSocket Flooding** - Batching still needed
5. **Heavy Computations** - Web Workers still needed

### React 19 Features to Leverage
1. **React Compiler** - Auto memoization (already enabled ✅)
2. **useTransition** - Non-blocking UI updates
3. **useDeferredValue** - Deferred expensive renders
4. **Suspense** - Granular loading states
5. **Performance Tracks** - Chrome DevTools integration
