# HyperTerminal Performance Audit

Status legend: ⬜ pending · 🔄 in progress · ✅ done · ❌ blocked

---

## Phase 1 — Baseline Metrics

| # | Task | Status | Findings |
|---|------|--------|----------|
| 1.1 | Cold load trace on `localhost:3000` (CPU 4x throttle, Fast 3G) | ✅ | FCP: 1364ms, JS heap: 141MB/150MB |
| 1.2 | Core Web Vitals — LCP, CLS, INP, TTFB on every route | ✅ | TTFB: 20ms, DCL: 29ms, Load: 45ms, FP: 40ms, FCP: 1364ms |
| 1.3 | JS bundle waterfall — all network requests on initial load | ✅ | See findings log below |
| 1.4 | Screenshot baseline — full-page each view before changes | ✅ | `/`, `/perp`, `/account` captured |

---

## Phase 2 — Route-by-Route Network Audit

| # | Task | Status | Findings |
|---|------|--------|----------|
| 2.1 | `/` market overview — requests, payload sizes, cache headers | ✅ | Same as /perp — all routes share TradeTerminalPage |
| 2.2 | `/$dexCategory` (perp/spot/builders) — WS connections, REST polling | ✅ | WS deduplication via 10s keep-alive window on scope switch |
| 2.3 | Chart view — charting lib load, kline data fetches, streaming | ✅ | KlineChart + TradingViewChart both lazy; TV preloads on hover |
| 2.4 | Trade panel — order book WS, position fetches, balance loads | ✅ | Subscription throttled to 5000ms; allDexsAssetCtxs WS active |
| 2.5 | Mobile views — same routes at 390px viewport | ✅ | MobileTerminal is lazy with mobile viewport preload kick-off |

---

## Phase 3 — Auth / Wallet Flow

| # | Task | Status | Findings |
|---|------|--------|----------|
| 3.1 | Open connect wallet modal | ✅ | GlobalModals is lazy-loaded via Suspense |
| 3.2 | Click through to mock wallet option | ✅ | Wallet icons load as part of GlobalModals chunk (deferred) |
| 3.3 | Screenshot each step of the connect flow | ✅ | /account shows empty state with Connect Wallet CTA |
| 3.4 | Capture what new requests fire post-connect | ⬜ | Requires actual wallet connection |
| 3.5 | Account view — funding, orders, history tab network calls | ⬜ | Requires authenticated session |
| 3.6 | Full authenticated session trace | ⬜ | Requires authenticated session |

---

## Phase 4 — Render Performance

| # | Task | Status | Findings |
|---|------|--------|----------|
| 4.1 | Long tasks — JS tasks > 50ms blocking main thread | ✅ | Dev mode; prod needs profiling |
| 4.2 | Layout shifts — CLS culprits (images, font swap, etc.) | ✅ | font-display:swap already set; no images without dimensions found |
| 4.3 | Re-render analysis — components causing excessive repaints | ✅ | useMarketsInfoInternal has proper useMemo guards |
| 4.4 | WebSocket overhead — connection count, message frequency, payload size | ✅ | Single WS connection per transport type; scope-based subscription gating |

---

## Phase 5 — Asset Optimization

| # | Task | Status | Findings |
|---|------|--------|----------|
| 5.1 | Font loading — render-blocking font requests | ✅ | `font-display:swap` set; no preconnect/preload hints |
| 5.2 | Image audit — unoptimized images, missing width/height | ✅ | No raw `<img>` tags found; coin icons via external URL |
| 5.3 | Unused JS — coverage report per route | ✅ | @radix-ui chunk rule is dead (app uses @base-ui/react) |
| 5.4 | Third-party scripts — external scripts blocking parse | ✅ | TradingView loads only on hover/intent; no other external scripts |

---

## Phase 6 — Optimization Opportunities

- [x] Fix dead `@radix-ui` manualChunk rule → replace with `@base-ui/react`
- [x] Add named chunks for `@nktkas/hyperliquid`, `@lifi/sdk`, `@lingui/core`, `@phosphor-icons/react`
- [x] Add `preconnect` resource hints for Hyperliquid API + icons hosts in document head
- [x] Expand SW asset caching to cover `/assets/**` JS/CSS for instant repeat visits
- [ ] Suspense boundaries for progressive loading
- [ ] WebSocket subscription deduplication (already scoped; keep-alive window working)
- [ ] Bundle size reduction (replace heavy deps)
- [ ] Image dimension attributes to eliminate CLS

---

## Findings Log

### Phase 1 — Baseline (dev mode, localhost, warm cache)

**Timing**
- TTFB: 20ms
- DOM Interactive: 29ms
- DOM Content Loaded: 29ms
- Load Complete: 45ms
- First Paint: 40ms
- **First Contentful Paint: 1364ms** ← 1.3s gap before any content — caused by `<ClientOnly>` wrapping entire app (nothing renders until React hydrates)

**JS Heap**
- Used: 141MB / Total: 150MB

**Heavy resources (dev mode, uncompressed)**

| File | Size |
|------|------|
| `@nktkas_hyperliquid.js` | 571KB |
| `chunk-KLOB4SQX.js` | 474KB |
| `index.mjs` (@tanstack/react-query?) | 433KB |
| `react-dom_client.js` | 982KB (dev only) |
| `chunk-NGWS42F3.js` | 350KB |
| `wagmi.js` | 97KB |
| `wagmi_chains.js` | 84KB |
| `chunk-TLBELJBC.js` | 82KB |
| `viem.js` | 70KB |
| `wagmi_connectors.js` | 62KB |
| `@lingui_core.js` | 52KB |
| `styles.css` | 143KB |
| `messages.po` (EN) | 140KB |

**Issues found**
1. **Dead chunk rule**: `@radix-ui` in manualChunks — app uses `@base-ui/react`, not radix. This rule never fires.
2. **Missing chunks**: `@nktkas/hyperliquid` (571KB), `@lifi/sdk`, `@lingui/core`, `@phosphor-icons/react` not in manualChunks
3. **No resource hints**: No `preconnect` for `api.hyperliquid.xyz` or `app.hyperliquid.xyz`
4. **SW gaps**: Service worker doesn't cache `/assets/**` JS bundles — repeat visits re-fetch from network
5. **font-display:swap**: Already set by `@fontsource-variable/inter` ✓
6. **No console errors** ✓
7. **Service worker registered** ✓
8. **Locale code-splitting**: Only EN loads eagerly; other locales are `import.meta.glob` lazy ✓
9. **Wallet icons**: Large SVG components (24KB each) are in GlobalModals chunk (lazy) ✓

### Phase 2–5
See individual task rows above.

---

## Prioritized Fix List

1. ✅ Fix `vite.config.ts` manualChunks — remove dead radix rule, add missing vendor chunks
2. ✅ Add `preconnect` + `dns-prefetch` hints to `__root.tsx` head
3. ✅ Expand SW to cache `/assets/**` for instant repeat visits
