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
- [ ] Analyze current chunk strategy
- [ ] Implement route-based splitting (TanStack Router)
- [ ] Lazy load heavy components (charts, modals)
- [ ] Check vendor chunk optimization

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

### Bundle Breakdown (Client) - Analyzed Jan 23
| Chunk | Size | Gzip | Notes |
|-------|------|------|-------|
| **main** | 582KB | 173KB | ⚠️ App code - NEEDS SPLITTING |
| **index** | 380KB | 112KB | ⚠️ Index route - large |
| vendor-web3 | 251KB | 77KB | viem, wagmi - expected |
| vendor-radix | 155KB | 49KB | Radix UI components |
| vendor-tanstack | 101KB | 28KB | Query, Table, Virtual |
| init (perf) | 6KB | 2.5KB | Performance monitoring |
| styles | 125KB | 19KB | CSS (Tailwind) |
| i18n messages | ~67KB | ~29KB | 5 locale files |

**Total Client JS: ~1.54MB (gzip: ~470KB)**

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
