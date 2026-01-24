# Unified Markets Implementation Guide

## Overview

This document provides a comprehensive guide for implementing a unified market system that supports:
- **Perpetual markets** (main DEX)
- **Spot markets**
- **HIP-3 Builder DEX markets** (custom perp DEXs)

**Philosophy:** Keep data raw. Extend API types with only what's necessary for routing (`marketKey`, `kind`). No renaming fields, no computed display names in types.

---

## Table of Contents

1. [Market Types Summary](#1-market-types-summary)
2. [Data Architecture](#2-data-architecture)
3. [Type Definitions](#3-type-definitions)
4. [Hooks](#4-hooks)
5. [Market Key System](#5-market-key-system)
6. [Asset Context Handling](#6-asset-context-handling)
7. [UI Component Architecture](#7-ui-component-architecture)
8. [Market Selector Architecture](#8-market-selector-architecture)
9. [Order Entry Architecture](#9-order-entry-architecture)
10. [Implementation Checklist](#10-implementation-checklist)

---

## 1. Market Types Summary

### Comparison Table

| Feature | Perp (Main DEX) | Spot | Builder DEX (HIP-3) |
|---------|-----------------|------|---------------------|
| **Market Key** | `perp:BTC` | `spot:HYPE/USDC` | `perpDex:test:ABC` |
| **Leverage** | Yes (1-50x) | No | Yes (1-50x) |
| **Margin Mode** | Cross/Isolated | N/A | Based on `marginMode` |
| **Funding Rate** | Yes | No | Yes |
| **Liquidation** | Yes | No | Yes |
| **TP/SL Orders** | Yes | No | Yes |
| **Advanced Orders** | SL, TP, Stop Limit, SCALE, TWAP | SCALE, TWAP | SL, TP, Stop Limit, SCALE, TWAP |
| **Position** | Long/Short | Holdings only | Long/Short |

### Market Kind

```typescript
type MarketKind = "perp" | "spot" | "builderPerp";

const isLeveraged = market.kind !== "spot";  // true for perp & builderPerp
```

### Raw API Data Structures

**Perp Market (from `meta()`):**
```typescript
{
  name: string,              // "BTC"
  szDecimals: number,        // 3
  maxLeverage: number,       // 50
  marginTableId: number,
  onlyIsolated?: boolean,
  isDelisted?: boolean,
  marginMode?: "noCross" | "strictIsolated",
}
```

**Spot Pair (from `spotMeta().universe`):**
```typescript
{
  tokens: [number, number],  // [baseTokenIndex, quoteTokenIndex]
  name: string,              // "HYPE/USDC"
  index: number,             // Pair index
  isCanonical: boolean,
}
```

**Spot Token (from `spotMeta().tokens`):**
```typescript
{
  name: string,              // "HYPE"
  szDecimals: number,
  weiDecimals: number,
  index: number,
  tokenId: string,
  isCanonical: boolean,
  evmContract: { address: string, evm_extra_wei_decimals: number } | null,
  fullName: string | null,
  deployerTradingFeeShare: string,
}
```

---

## 2. Data Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EXISTING INFO HOOKS (React Query)                │
│                    staleTime: Infinity for meta                     │
├─────────────────────────────────────────────────────────────────────┤
│  useInfoMeta({})        │  useInfoSpotMeta()    │ useInfoPerpDexs() │
│  useInfoAllPerpMetas()  │                       │                   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │     useMarkets()         │
                    │   Combines & transforms  │
                    │   → MarketsData          │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
┌─────────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│ useMarketsCtxs()    │  │ useMarketCtx()  │  │ getMarketCapabilities│
│ All markets + ctxs  │  │ Single market   │  │ Pure function        │
│ For market selector │  │ For chart/order │  │ Derives UI flags     │
└─────────────────────┘  └─────────────────┘  └─────────────────────┘
```

### Static vs Dynamic Data

| Hook | Data | Caching |
|------|------|---------|
| `useInfoMeta({})` | Perp metadata | **Static** - `staleTime: Infinity` |
| `useInfoSpotMeta()` | Spot pairs + tokens | **Static** - `staleTime: Infinity` |
| `useInfoPerpDexs()` | DEX list | **Static** - `staleTime: Infinity` |
| `useInfoAllPerpMetas()` | Builder DEX metas | **Static** - `staleTime: Infinity` |
| `useSubAssetCtxs({})` | Perp contexts | **Dynamic** - WebSocket |
| `useSubSpotAssetCtxs()` | Spot contexts | **Dynamic** - WebSocket |
| `useSubAllDexsAssetCtxs()` | Builder contexts | **Dynamic** - WebSocket |

---

## 3. Type Definitions

### Philosophy: Extend Raw Types

We spread raw API data and only add fields needed for routing:

```typescript
// src/types/market.ts

import type { MetaResponse, SpotMetaResponse } from "@nktkas/hyperliquid";

// ============ MARKET KEY TYPES ============
type PerpMarketKey = `perp:${string}`;
type SpotMarketKey = `spot:${string}`;
type BuilderPerpMarketKey = `perpDex:${string}:${string}`;
type MarketKey = PerpMarketKey | SpotMarketKey | BuilderPerpMarketKey;

type MarketKind = "perp" | "spot" | "builderPerp";

// ============ PERP MARKET ============
type PerpUniverseEntry = MetaResponse["universe"][number];

interface PerpMarket extends PerpUniverseEntry {
  kind: "perp";
  marketKey: PerpMarketKey;
  assetIndex: number;  // Position in universe array (for ctx lookup)
}

// ============ SPOT MARKET ============
type SpotUniverseEntry = SpotMetaResponse["universe"][number];
type SpotToken = SpotMetaResponse["tokens"][number];

interface SpotMarket extends SpotUniverseEntry {
  kind: "spot";
  marketKey: SpotMarketKey;
  baseToken: SpotToken;   // Reference to tokens[tokens[0]]
  quoteToken: SpotToken;  // Reference to tokens[tokens[1]]
}

// ============ BUILDER PERP MARKET ============
interface BuilderPerpMarket extends PerpUniverseEntry {
  kind: "builderPerp";
  marketKey: BuilderPerpMarketKey;
  dex: string;           // DEX name for API calls
  dexIndex: number;      // Position in dexList
  assetIndex: number;    // Position in that dex's universe array
}

// ============ DISCRIMINATED UNION ============
type UnifiedMarket = PerpMarket | SpotMarket | BuilderPerpMarket;

// ============ LOOKUPS ============
interface MarketsData {
  all: UnifiedMarket[];
  perps: PerpMarket[];
  spots: SpotMarket[];
  builderPerps: BuilderPerpMarket[];
  byKey: Map<MarketKey, UnifiedMarket>;
  byName: Map<string, UnifiedMarket>;  // "BTC" -> PerpMarket
  dexList: string[];
}
```

### What We Add vs What's Raw

| Field | Source | Notes |
|-------|--------|-------|
| `name` | Raw API | Perp: `"BTC"`, Spot: `"HYPE/USDC"` |
| `szDecimals` | Raw API | Used for formatting |
| `maxLeverage` | Raw API | Perp only |
| `tokens` | Raw API | Spot: `[baseIdx, quoteIdx]` |
| `marketKey` | **Added** | For routing: `"perp:BTC"` |
| `kind` | **Added** | Discriminator |
| `assetIndex` | **Added** | Context lookup |
| `dex` | **Added** | Builder perp only |
| `baseToken` | **Added** | Spot only: token reference |

---

## 4. Hooks

### Hook Overview

| Hook | Purpose | Returns | Use Case |
|------|---------|---------|----------|
| `useMarkets()` | Static market data | `MarketsData` | Lookups, getting market info |
| `useMarketsCtxs()` | All markets + contexts | `MarketsCtxsData` | Market selector list |
| `useMarketCtx(key)` | Single market + context | `MarketCtxData` | Chart, order entry |

### useMarkets (Static Data)

```typescript
export function useMarkets() {
  const perpMeta = useInfoMeta({}, STATIC_QUERY_OPTIONS);
  const spotMeta = useInfoSpotMeta(STATIC_QUERY_OPTIONS);
  const perpDexs = useInfoPerpDexs(STATIC_QUERY_OPTIONS);
  const allPerpMetas = useInfoAllPerpMetas(STATIC_QUERY_OPTIONS);

  const data = useMemo<MarketsData | undefined>(() => {
    if (!perpMeta.data || !spotMeta.data) return undefined;

    const perps = transformPerpMeta(perpMeta.data);
    const spots = transformSpotMeta(spotMeta.data);
    const builderPerps = transformBuilderPerpMeta(perpDexs.data, allPerpMetas.data);

    const all = [...perps, ...spots, ...builderPerps];
    const byKey = new Map(all.map(m => [m.marketKey, m]));
    const byName = new Map(all.map(m => [m.name, m]));

    return { all, perps, spots, builderPerps, byKey, byName, dexList: perpDexs.data ?? [] };
  }, [perpMeta.data, spotMeta.data, perpDexs.data, allPerpMetas.data]);

  return { data, isLoading: perpMeta.isLoading || spotMeta.isLoading };
}
```

### useMarketsCtxs (All Markets + Contexts)

**Location:** `src/lib/hyperliquid/hooks/useMarketsCtxs.ts`

```typescript
interface MarketWithCtx<T extends MarketInfo = MarketInfo> {
  market: T;
  ctx: MarketCtx;
  midPx: string | null;
  change24h: number | null;
  change24hPercent: string | null;
}

interface MarketsCtxsData {
  all: MarketWithCtx[];
  perps: MarketWithCtx<PerpMarketInfo>[];
  spots: MarketWithCtx<SpotMarketInfo>[];
  builderPerps: MarketWithCtx<BuilderPerpMarketInfo>[];
}

// Usage:
const { data, isLoading, error } = useMarketsCtxs({
  perp: true,
  spot: true,
  builderDexs: true,
  enabled: true,
});
```

### useMarketCtx (Single Market)

**Location:** `src/lib/hyperliquid/hooks/useMarketCtx.ts`

```typescript
interface MarketCtxData {
  market: MarketInfo;
  ctx: MarketCtx;
  midPx: string | null;
  change24h: number | null;
  change24hPercent: string | null;
}

// Usage:
const data = useMarketCtx("perp:BTC");

// For selected market:
const data = useSelectedMarketCtx();
```

### getMarketCapabilities (Pure Function)

**Location:** `src/lib/hyperliquid/capabilities.ts`

```typescript
interface MarketCapabilities {
  isLeveraged: boolean;
  hasMarginMode: boolean;
  hasFunding: boolean;
  hasAdvancedOrders: boolean;
  maxLeverage: number | null;
  allowsCrossMargin: boolean;
}

// Usage:
const capabilities = getMarketCapabilities(market);

if (capabilities.isLeveraged) {
  // Show leverage control
}

if (capabilities.hasMarginMode) {
  // Show margin mode toggle
}
```

---

## 5. Market Key System

### Format

```
perp:{coin}              → perp:BTC
spot:{base}/{quote}      → spot:HYPE/USDC
perpDex:{dex}:{coin}     → perpDex:test:ABC
```

### Utilities

```typescript
// Factories
makePerpMarketKey(coin: string): PerpMarketKey
makeSpotMarketKey(pair: string): SpotMarketKey
makeBuilderPerpMarketKey(dex: string, coin: string): BuilderPerpMarketKey

// Parser
parseMarketKey(key: MarketKey): { kind: MarketKind; coin: string; dex?: string } | null

// Type guards
isPerpMarket(market: UnifiedMarket): market is PerpMarket
isSpotMarket(market: UnifiedMarket): market is SpotMarket
isBuilderPerpMarket(market: UnifiedMarket): market is BuilderPerpMarket
isLeveragedMarket(market: UnifiedMarket): boolean  // perp or builderPerp

// API params
getApiParams(market: UnifiedMarket): { coin: string; dex?: string }
```

---

## 6. Asset Context Handling

### Context Fields by Market Type

| Field | Perp | Spot | Notes |
|-------|------|------|-------|
| `markPx` | ✓ | ✓ | Mark price |
| `midPx` | ✓ | ✓ | Mid price |
| `prevDayPx` | ✓ | ✓ | For 24h change |
| `dayNtlVlm` | ✓ | ✓ | 24h volume (USD) |
| `oraclePx` | ✓ | ✗ | Oracle price |
| `funding` | ✓ | ✗ | Funding rate |
| `openInterest` | ✓ | ✗ | Open interest |
| `circulatingSupply` | ✗ | ✓ | Token supply |
| `totalSupply` | ✗ | ✓ | Token supply |

### Context Lookup

| Type | Lookup Method |
|------|---------------|
| Perp | `ctxs[market.assetIndex]` |
| Spot | `ctxMap.get(market.name)` |
| Builder | `dexCtxs[market.dex].ctxs[market.assetIndex]` |

### Subscription Parameters

```typescript
// Perp
useSubL2Book({ coin: "BTC" })
useSubAssetCtxs({ dex: "" })

// Spot (use spotPairId format)
useSubL2Book({ coin: "@107" })

// Builder DEX
useSubL2Book({ coin: "ABC", dex: "test" })
useSubAssetCtxs({ dex: "test" })
```

---

## 7. UI Component Architecture

### Separate Components Approach

**Rationale:** Separate main components for perp and spot with shared sub-components. No conditional logic in main components, clean separation.

```
order-entry/
├── perp-order-entry.tsx      # Full perp features
├── spot-order-entry.tsx      # Simplified spot
├── shared/
│   ├── size-input.tsx        # Size + slider + %
│   ├── price-input.tsx       # Limit price
│   ├── order-submit.tsx      # Button + errors
│   └── available-balance.tsx # Balance display
├── perp/
│   ├── side-toggle.tsx       # Long/Short + icons
│   ├── leverage-control.tsx
│   ├── margin-mode-toggle.tsx
│   ├── tp-sl-section.tsx
│   └── order-summary.tsx     # Liq, margin, fee
└── spot/
    ├── side-toggle.tsx       # Buy/Sell simple
    └── order-summary.tsx     # Value + fee only
```

### Router Pattern

```typescript
export function OrderEntryPanel() {
  const data = useSelectedMarketCtx();

  if (data?.market.kind === "spot") {
    return <SpotOrderEntryPanel />;
  }
  return <PerpOrderEntryPanel />;
}
```

### Element Differences

| Element | Perp | Spot |
|---------|------|------|
| `LeverageControl` | ✓ | Hidden |
| `MarginModeToggle` | ✓ (if cross allowed) | Hidden |
| `AdvancedOrderDropdown` | SL, TP, Stop Limit, SCALE, TWAP | SCALE, TWAP |
| `SideToggle` | Long/Short + icons | Buy/Sell |
| `ReduceOnly` | ✓ | Hidden |
| `TP/SL` | ✓ | Hidden |
| `OrderSummary` | Liq, margin, fee | Value, fee |

### Shared Components with Market Kind

Components that differ by market type accept a `marketKind` prop:

```typescript
interface Props {
  marketKind?: "perp" | "spot";  // defaults to "perp"
}
```

**AdvancedOrderDropdown:**
```typescript
const ORDER_TYPES_BY_MARKET: Record<"perp" | "spot", AdvancedOrderType[]> = {
  perp: ["stopLoss", "takeProfit", "stopLimit", "scale", "twap"],
  spot: ["scale", "twap"],
};

export function AdvancedOrderDropdown({ marketKind = "perp" }: Props) {
  const allowedTypes = ORDER_TYPES_BY_MARKET[marketKind];
  // Render based on allowedTypes
}

// Usage:
<AdvancedOrderDropdown />                    // Perp - default
<AdvancedOrderDropdown marketKind="spot" />  // Spot
```

This pattern keeps market-specific knowledge inside the component rather than at call sites.

---

## 8. Market Selector Architecture

### Component Structure

```
chart/
├── token-selector.tsx           # Router + popover
├── market-scope-tabs.tsx        # Perp | Spot | HIP-3
├── shared/
│   ├── market-search.tsx
│   ├── market-row.tsx           # Base: icon, name, price, 24h
│   └── market-list-container.tsx # Virtual scroll
├── perp/
│   ├── perp-market-list.tsx
│   ├── perp-market-row.tsx      # + OI, funding, leverage badge
│   └── use-perp-market-list.ts
├── spot/
│   ├── spot-market-list.tsx
│   ├── spot-market-row.tsx      # + supply, canonical warning
│   └── use-spot-market-list.ts
└── builder/
    ├── builder-market-list.tsx
    ├── builder-market-row.tsx   # + DEX badge
    ├── builder-dex-filter.tsx
    └── use-builder-market-list.ts
```

### Column Differences

| Column | Perp | Spot | Builder |
|--------|------|------|---------|
| Icon + Name | ✓ | ✓ | ✓ |
| Price | ✓ | ✓ | ✓ |
| 24h Change | ✓ | ✓ | ✓ |
| Leverage badge | ✓ | ✗ | ✓ |
| Open Interest | ✓ | ✗ | ✓ |
| Volume | ✓ | ✓ | ✓ |
| Funding | ✓ | ✗ | ✓ |
| Supply | ✗ | ✓ | ✗ |
| DEX badge | ✗ | ✗ | ✓ |
| Canonical ⚠️ | ✗ | If false | ✗ |

### Market Scope Tabs

```typescript
type MarketScope = "perp" | "spot" | "builder";

export function TokenSelector() {
  const [scope, setScope] = useState<MarketScope>("perp");

  return (
    <Popover>
      <MarketSearch />
      <MarketScopeTabs value={scope} onChange={setScope} />

      {scope === "perp" && <PerpMarketList />}
      {scope === "spot" && <SpotMarketList />}
      {scope === "builder" && <BuilderMarketList />}
    </Popover>
  );
}
```

---

## 9. Order Entry Architecture

### Perp Order Entry

```typescript
export function PerpOrderEntryPanel() {
  const data = useSelectedMarketCtx();
  const capabilities = getMarketCapabilities(data?.market ?? null);

  return (
    <div>
      {/* Perp header */}
      <div className="flex justify-between">
        {capabilities.hasMarginMode && <MarginModeToggle />}
        <LeverageControl />
      </div>

      {/* Order type + advanced */}
      <div className="flex justify-between">
        <OrderTypeTabs types={["market", "limit"]} />
        <AdvancedOrderDropdown />
      </div>

      <PerpSideToggle />           {/* Long/Short */}
      <AvailableBalance />         {/* Shared */}
      <SizeInput />                {/* Shared */}
      <PriceInput />               {/* Shared - if limit */}
      <ReduceOnlyCheckbox />
      <TpSlSection />
      <OrderSubmit />              {/* Shared */}
      <PerpOrderSummary />         {/* Liq, margin, fee */}
    </div>
  );
}
```

### Spot Order Entry

```typescript
export function SpotOrderEntryPanel() {
  return (
    <div>
      {/* No header - no leverage/margin */}

      {/* Order type + advanced (SCALE, TWAP only) */}
      <div className="flex justify-between">
        <OrderTypeTabs types={["market", "limit"]} />
        <AdvancedOrderDropdown marketKind="spot" />
      </div>

      <SpotSideToggle />           {/* Buy/Sell */}
      <AvailableBalance />         {/* Shared */}
      <SizeInput />                {/* Shared */}
      <PriceInput />               {/* Shared - if limit */}
      {/* No reduce-only, no TP/SL */}
      <OrderSubmit />              {/* Shared */}
      <SpotOrderSummary />         {/* Value, fee only */}
    </div>
  );
}
```

### Chart Stats by Market Type

| Stat | Perp | Spot |
|------|------|------|
| MARK | ✓ | ✓ |
| ORACLE | ✓ | ✗ |
| VOL | ✓ | ✓ |
| OI | ✓ | ✗ |
| FUNDING | ✓ | ✗ |
| 24H CHG | Optional | ✓ |
| SUPPLY | ✗ | ✓ |

---

## 10. Implementation Checklist

### Phase 1: Data Layer ✅
- [x] Market types in `src/lib/hyperliquid/types/markets.ts` (existed)
- [x] Market key utilities in `src/lib/hyperliquid/market-key.ts` (existed)
- [x] `useMarkets()` hook in `src/lib/hyperliquid/hooks/useMarkets.ts` (existed)
- [x] `useMarketsCtxs()` hook in `src/lib/hyperliquid/hooks/useMarketsCtxs.ts` (new)
- [x] `useMarketCtx()` hook in `src/lib/hyperliquid/hooks/useMarketCtx.ts` (new)
- [x] `getMarketCapabilities()` function in `src/lib/hyperliquid/capabilities.ts` (new)
- [x] Exports added to `src/lib/hyperliquid/index.ts`

### Phase 2: Market Selector
- [ ] Extract shared components (`MarketSearch`, `MarketRow`)
- [ ] Create `PerpMarketList` with hook
- [ ] Create `SpotMarketList` with hook
- [ ] Create `BuilderMarketList` with hook
- [ ] Create `MarketScopeTabs`
- [ ] Update `TokenSelector` as router

### Phase 3: Market Stats Display
- [ ] Update `ChartPanel` with conditional stats
- [ ] Update `MarketOverview` with conditional stats

### Phase 4: Order Entry
- [ ] Extract shared components (`SizeInput`, `PriceInput`, `OrderSubmit`)
- [ ] Create `SpotSideToggle` (Buy/Sell)
- [ ] Create `SpotOrderSummary`
- [ ] Create `SpotOrderEntryPanel`
- [ ] Rename current panel to `PerpOrderEntryPanel`
- [ ] Create router `OrderEntryPanel`

### Phase 5: Testing
- [ ] Perp market selection and order placement
- [ ] Spot market selection and order placement
- [ ] Builder DEX market selection
- [ ] Subscription stability on market switch
- [ ] Mobile responsive

---

## File Structure

```
src/
├── lib/
│   └── hyperliquid/
│       ├── market-key.ts              # MarketKey types & utilities
│       ├── capabilities.ts            # getMarketCapabilities (NEW)
│       ├── types/
│       │   └── markets.ts             # MarketInfo types
│       └── hooks/
│           ├── useMarkets.ts          # Static market data
│           ├── useMarketsCtxs.ts      # All markets + contexts (NEW)
│           └── useMarketCtx.ts        # Single market + context (NEW)
├── stores/
│   └── use-market-prefs-store.ts      # selectedMarketKey, favorites
└── components/
    └── trade/
        ├── chart/
        │   ├── token-selector.tsx
        │   ├── market-scope-tabs.tsx   # (to be created)
        │   ├── shared/
        │   ├── perp/
        │   ├── spot/
        │   └── builder/
        └── order-entry/
            ├── perp-order-entry.tsx    # (to be created)
            ├── spot-order-entry.tsx    # (to be created)
            ├── shared/
            ├── perp/
            └── spot/
```

---

## Summary

| Aspect | Implementation |
|--------|----------------|
| **Raw data philosophy** | Extend API types, don't transform fields |
| **Minimal additions** | Only add `marketKey`, `kind`, `dex`, `assetIndex`, `baseToken` |
| **useMarkets()** | Static market data with `byKey` and `byName` lookups |
| **useMarketsCtxs()** | All markets + contexts for market selector |
| **useMarketCtx()** | Single market + context for focused views |
| **getMarketCapabilities()** | Pure function, not a hook |
| **Component architecture** | Separate perp/spot components with shared sub-components |
| **No conditional hell** | Router pattern switches between dedicated components |
