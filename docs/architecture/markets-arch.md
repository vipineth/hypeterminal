# Unified Markets Architecture

## Overview

This document describes the architecture for a unified market system that supports:
- **Perpetual markets** (main DEX)
- **Spot markets**
- **HIP-3 Builder DEX markets** (custom perp DEXs)

The system uses existing hooks from `@/lib/hyperliquid/hooks/` without creating new stores.

---

## Table of Contents

1. [Data Flow](#1-data-flow)
2. [Market Types](#2-market-types)
3. [API Methods](#3-api-methods)
4. [Asset ID System](#4-asset-id-system)
5. [Market Key System](#5-market-key-system)
6. [Naming Convention](#6-naming-convention)
7. [Type Definitions](#7-type-definitions)
8. [Data Strategy](#8-data-strategy)
9. [Transform Functions](#9-transform-functions)
10. [Hooks](#10-hooks)
11. [Helper Functions](#11-helper-functions)
12. [Component Usage](#12-component-usage)
13. [File Structure](#13-file-structure)

---

## 1. Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EXISTING INFO HOOKS (React Query)                │
│                    staleTime: Infinity for meta                     │
├─────────────────────────────────────────────────────────────────────┤
│  useInfoMeta({})          │  useInfoSpotMeta()     │ useInfoPerpDexs()│
│  useInfoAllPerpMetas()    │                        │                  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │   useMarkets() (NEW)     │
                    │   Combines & transforms  │
                    │   → UnifiedMarket[]      │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
┌─────────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│ EXISTING SUB HOOKS  │  │ useMarketCtx()  │  │ useMarketsCtxs()   │
│ (Zustand internally)│  │ (marketKey)     │  │ (for selector)     │
├─────────────────────┤  │ NEW - single    │  │ NEW - all markets  │
│ useSubAssetCtxs     │  │ market + ctx    │  │ + all ctxs         │
│ useSubSpotAssetCtxs │  └─────────────────┘  └─────────────────────┘
│ useSubAllMids       │
│ useSubAllDexsAssetCtxs│
└─────────────────────┘
```

---

## 2. Market Types

### Comparison Table

| Feature | Perp (Main DEX) | Spot | Builder DEX (HIP-3) |
|---------|-----------------|------|---------------------|
| **Market Key** | `perp:BTC` | `spot:HYPE/USDC` | `perpDex:test:ABC` |
| **Asset ID Range** | 0-9,999 | 10,000-99,999 | 100,000+ |
| **Leverage** | Yes (1-50x) | No | Yes (1-50x) |
| **Margin Mode** | Cross/Isolated | N/A | Based on `marginMode` |
| **Funding Rate** | Yes | No | Yes |
| **Liquidation** | Yes | No | Yes |
| **TP/SL Orders** | Yes | No | Yes |
| **Advanced Orders** | All 8 types | Market + Limit only | All 8 types |
| **Position** | Long/Short | Holdings only | Long/Short |
| **Quote Asset** | USDC | Base/Quote pair | USDC |

### Market Kind

```typescript
type MarketKind = "perp" | "spot" | "builderPerp";

// Simplified check for UI logic
const isLeveraged = market.kind !== "spot";  // true for perp & builderPerp
```

---

## 3. API Methods

### Getting All Markets (Static - Fetch Once)

| Market Type | Method | Returns |
|-------------|--------|---------|
| **Perp** | `meta()` / `useInfoMeta({})` | `{ universe: [...], marginTables: [...] }` |
| **Spot** | `spotMeta()` / `useInfoSpotMeta()` | `{ universe: [...], tokens: [...] }` |
| **Builder DEX List** | `perpDexs()` / `useInfoPerpDexs()` | `["dex1", "dex2", ...]` |
| **Builder DEX Metas** | `allPerpMetas()` / `useInfoAllPerpMetas()` | `Meta[]` for each DEX |

> **Note:** HIP-3 only supports perpetual markets. There is no `spotDexs()` or spot markets on builder DEXs.

### Real-Time Data (Subscriptions)

| Data | Hook | Returns |
|------|------|---------|
| **Perp Contexts** | `useSubAssetCtxs({})` | `{ ctxs: PerpAssetCtx[] }` |
| **Spot Contexts** | `useSubSpotAssetCtxs()` | `{ ctxs: SpotAssetCtx[] }` |
| **Builder Contexts** | `useSubAllDexsAssetCtxs()` | `{ dex, ctxs }[]` |
| **All Mid Prices** | `useSubAllMids({})` | `{ mids: Record<string, string> }` |

### Asset Context Fields

| Field | Perp | Spot | Notes |
|-------|------|------|-------|
| `markPx` | ✓ | ✓ | Mark price |
| `midPx` | ✓ | ✓ | Mid price (bid+ask/2) |
| `prevDayPx` | ✓ | ✓ | For 24h change calc |
| `dayNtlVlm` | ✓ | ✓ | 24h volume (USD) |
| `dayBaseVlm` | ✓ | ✓ | 24h volume (base) |
| `oraclePx` | ✓ | ✗ | Oracle price |
| `funding` | ✓ | ✗ | Funding rate |
| `openInterest` | ✓ | ✗ | Open interest |
| `premium` | ✓ | ✗ | Premium over oracle |
| `impactPxs` | ✓ | ✗ | `[bidImpact, askImpact]` |
| `circulatingSupply` | ✗ | ✓ | Token supply |
| `totalSupply` | ✗ | ✓ | Token supply |

---

## 4. Asset Index System

> **No synthetic IDs.** We use `assetIndex` - the position in the universe array - for context lookups. The API uses `name` (coin/pair) for most operations.

### How Context Lookup Works

| Type | Context Lookup | API Calls |
|------|----------------|-----------|
| Perp | `ctxs[market.assetIndex]` | `{ coin: market.name }` |
| Spot | `ctxMap.get(market.name)` | `{ coin: market.name }` |
| Builder DEX | `dexCtxs[market.dex].ctxs[market.assetIndex]` | `{ coin: market.name, dex: market.dex }` |

### Fields We Add

```typescript
// Perp & BuilderPerp
assetIndex: number;  // Index in universe array

// BuilderPerp only
dex: string;         // DEX name for API calls
dexIndex: number;    // Index in dexList (for finding dex contexts)
```

---

## 5. Market Key System

### Format

```
perp:{coin}              → perp:BTC
spot:{base}/{quote}      → spot:HYPE/USDC
perpDex:{dex}:{coin}     → perpDex:test:ABC
```

### Type Definitions

```typescript
type PerpMarketKey = `perp:${string}`;
type SpotMarketKey = `spot:${string}`;
type BuilderPerpMarketKey = `perpDex:${string}:${string}`;
type MarketKey = PerpMarketKey | SpotMarketKey | BuilderPerpMarketKey;
```

### Utility Functions

```typescript
// Factories
function makePerpMarketKey(coin: string): PerpMarketKey {
  return `perp:${coin}`;
}

function makeSpotMarketKey(pair: string): SpotMarketKey {
  return `spot:${pair}`;
}

function makeBuilderPerpMarketKey(dex: string, coin: string): BuilderPerpMarketKey {
  return `perpDex:${dex}:${coin}`;
}

// Parser
function parseMarketKey(key: MarketKey): {
  kind: MarketKind;
  coin: string;
  dex?: string;
} | null {
  if (key.startsWith("perp:")) {
    return { kind: "perp", coin: key.slice(5) };
  }
  if (key.startsWith("spot:")) {
    return { kind: "spot", coin: key.slice(5) };
  }
  if (key.startsWith("perpDex:")) {
    const [, dex, coin] = key.split(":");
    return { kind: "builderPerp", coin, dex };
  }
  return null;
}

// Type guards
function isPerpMarket(market: UnifiedMarket): market is PerpMarket {
  return market.kind === "perp";
}

function isSpotMarket(market: UnifiedMarket): market is SpotMarket {
  return market.kind === "spot";
}

function isBuilderPerpMarket(market: UnifiedMarket): market is BuilderPerpMarket {
  return market.kind === "builderPerp";
}

function isLeveragedMarket(market: UnifiedMarket): market is PerpMarket | BuilderPerpMarket {
  return market.kind !== "spot";
}
```

---

## 6. Naming Convention

> **Use raw fields.** The API's `name` field serves most purposes. We only add `marketKey` for internal routing.

### Raw Fields (from API)

| Field | Perp | Spot | Builder Perp |
|-------|------|------|--------------|
| `name` | `"BTC"` | `"HYPE/USDC"` | `"ABC"` |
| `szDecimals` | `3` | N/A (use `baseToken.szDecimals`) | `2` |
| `maxLeverage` | `50` | N/A | `20` |

### Added Fields

| Field | Purpose | Perp | Spot | Builder Perp |
|-------|---------|------|------|--------------|
| `marketKey` | Internal routing | `"perp:BTC"` | `"spot:HYPE/USDC"` | `"perpDex:test:ABC"` |
| `kind` | Type discrimination | `"perp"` | `"spot"` | `"builderPerp"` |
| `assetIndex` | Context lookup | `0` | N/A | `0` |
| `baseToken` | Token info | N/A | `{ name: "HYPE", ... }` | N/A |
| `dex` | DEX name | N/A | N/A | `"test"` |

### Usage

```typescript
// For API calls - use getApiParams from market-key.ts
const params = getApiParams(market.marketKey);
// Returns: { coin: "BTC", dex: "" } or { coin: "ABC", dex: "test" }

// For display - derive from raw fields
const displayName = market.kind === "spot" ? market.name : `${market.name}-PERP`;

// For base asset (icons, size labels)
const baseAsset = market.kind === "spot" ? market.baseToken.name : market.name;
```

---

## 7. Type Definitions

> **Philosophy: Keep data raw.** We extend API types with only what's necessary for routing (`marketKey`, `kind`). No renaming fields, no computed display names.

```typescript
// src/types/market.ts

import type { MetaResponse, SpotMetaResponse } from "@nktkas/hyperliquid";

// ============ MARKET KEY TYPES ============
// (Already exist in src/lib/hyperliquid/market-key.ts)
type PerpMarketKey = `perp:${string}`;
type SpotMarketKey = `spot:${string}`;
type BuilderPerpMarketKey = `perpDex:${string}:${string}`;
type MarketKey = PerpMarketKey | SpotMarketKey | BuilderPerpMarketKey;

type MarketKind = "perp" | "spot" | "builderPerp";
type MarketScope = "all" | "perp" | "spot" | "hip3";

// ============ RAW API TYPES (from @nktkas/hyperliquid) ============
// Perp universe entry: { name, szDecimals, maxLeverage, marginTableId, onlyIsolated?, isDelisted?, marginMode? }
// Spot universe entry: { tokens: [baseIdx, quoteIdx], name, index, isCanonical }
// Spot token: { name, szDecimals, weiDecimals, index, tokenId, isCanonical, ... }

// ============ PERP MARKET ============
// Extends raw API type, adds only: marketKey, kind, assetIndex
type PerpUniverseEntry = MetaResponse["universe"][number];

interface PerpMarket extends PerpUniverseEntry {
  kind: "perp";
  marketKey: PerpMarketKey;
  assetIndex: number;  // Position in universe array (used for ctx lookup)
}

// ============ SPOT MARKET ============
// Extends raw API type, adds only: marketKey, kind, baseToken, quoteToken refs
type SpotUniverseEntry = SpotMetaResponse["universe"][number];
type SpotToken = SpotMetaResponse["tokens"][number];

interface SpotMarket extends SpotUniverseEntry {
  kind: "spot";
  marketKey: SpotMarketKey;
  baseToken: SpotToken;   // Reference to tokens[tokens[0]]
  quoteToken: SpotToken;  // Reference to tokens[tokens[1]]
}

// ============ BUILDER PERP MARKET ============
// Extends raw API type, adds only: marketKey, kind, dex, dexIndex, assetIndex
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

  // Primary lookup - by marketKey
  byKey: Map<MarketKey, UnifiedMarket>;

  // Lookup by API name (for matching fills/orders)
  byName: Map<string, UnifiedMarket>;  // "BTC" -> PerpMarket, "HYPE/USDC" -> SpotMarket

  // Raw responses
  rawPerpMeta: MetaResponse;
  rawSpotMeta: SpotMetaResponse;
  dexList: string[];
  rawDexMetas: MetaResponse[];
}

// ============ GLOBAL STORE STATE ============
interface MarketStoreState {
  selectedMarketKey: MarketKey | null;
  marketScope: MarketScope;

  setSelectedMarket: (key: MarketKey) => void;
  setMarketScope: (scope: MarketScope) => void;
}
```

### What We Add vs What's Raw

| Field | Source | Notes |
|-------|--------|-------|
| `name` | Raw API | Perp: `"BTC"`, Spot: `"HYPE/USDC"` |
| `szDecimals` | Raw API | Used for formatting |
| `maxLeverage` | Raw API | Perp only |
| `tokens` | Raw API | Spot: `[baseIdx, quoteIdx]` |
| `index` | Raw API | Spot pair index (Hyperliquid's identifier) |
| `marketKey` | **Added** | For routing: `"perp:BTC"` |
| `kind` | **Added** | For discrimination: `"perp" \| "spot" \| "builderPerp"` |
| `dex` | **Added** | Builder perp only: DEX name |
| `dexIndex` | **Added** | Builder perp only: Position in dexList |
| `baseToken` | **Added** | Spot only: Reference to token object |

### Global Store

```typescript
// src/stores/use-market-store.ts

import { create } from "zustand";
import type { MarketKey, MarketScope } from "@/types/market";

interface MarketStoreState {
  selectedMarketKey: MarketKey | null;
  marketScope: MarketScope;

  setSelectedMarket: (key: MarketKey) => void;
  setMarketScope: (scope: MarketScope) => void;
}

export const useMarketStore = create<MarketStoreState>((set) => ({
  selectedMarketKey: null,
  marketScope: "all",

  setSelectedMarket: (key) => set({ selectedMarketKey: key }),
  setMarketScope: (scope) => set({ marketScope: scope }),
}));
```

---

## 8. Data Strategy

### Static Data (React Query)

```typescript
const STATIC_QUERY_OPTIONS = {
  staleTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
};
```

| Hook | Data | Caching |
|------|------|---------|
| `useInfoMeta({})` | Perp metadata | **Static** - fetch once |
| `useInfoSpotMeta()` | Spot pairs + tokens | **Static** - fetch once |
| `useInfoPerpDexs()` | DEX list | **Static** - fetch once |
| `useInfoAllPerpMetas()` | All DEX perp metas | **Static** - fetch once |

### Dynamic Data (WebSocket Subscriptions)

| Hook | Data | Updates |
|------|------|---------|
| `useSubAssetCtxs({})` | Perp contexts | Real-time |
| `useSubSpotAssetCtxs()` | Spot contexts | Real-time |
| `useSubAllDexsAssetCtxs()` | Builder contexts | Real-time |
| `useSubAllMids({})` | All mid prices | Real-time |

---

## 9. Transform Functions

> **Minimal transforms.** We spread raw API data and only add the fields needed for routing.

```typescript
// src/lib/markets/transforms.ts

import type { MetaResponse, SpotMetaResponse } from "@nktkas/hyperliquid";
import { makePerpMarketKey, makeSpotMarketKey, makeBuilderPerpMarketKey } from "@/lib/hyperliquid/market-key";
import type { PerpMarket, SpotMarket, BuilderPerpMarket } from "@/types/market";

export function transformPerpMeta(meta: MetaResponse): PerpMarket[] {
  return meta.universe.map((asset, assetIndex) => ({
    ...asset,  // Spread raw: name, szDecimals, maxLeverage, marginTableId, onlyIsolated, isDelisted, marginMode
    kind: "perp" as const,
    marketKey: makePerpMarketKey(asset.name),
    assetIndex,
  }));
}

export function transformSpotMeta(meta: SpotMetaResponse): SpotMarket[] {
  return meta.universe.map((pair) => ({
    ...pair,  // Spread raw: tokens, name, index, isCanonical
    kind: "spot" as const,
    marketKey: makeSpotMarketKey(pair.name),
    baseToken: meta.tokens[pair.tokens[0]],
    quoteToken: meta.tokens[pair.tokens[1]],
  }));
}

export function transformBuilderPerpMeta(
  dexList: string[],
  allMetas: MetaResponse[]
): BuilderPerpMarket[] {
  const markets: BuilderPerpMarket[] = [];

  dexList.forEach((dex, dexIndex) => {
    const meta = allMetas[dexIndex];
    if (!meta) return;

    meta.universe.forEach((asset, assetIndex) => {
      markets.push({
        ...asset,  // Spread raw: name, szDecimals, maxLeverage, etc.
        kind: "builderPerp" as const,
        marketKey: makeBuilderPerpMarketKey(dex, asset.name),
        dex,
        dexIndex,
        assetIndex,
      });
    });
  });

  return markets;
}
```

### Filtering Decisions

**Question:** Should we filter delisted markets in transforms or let consumers filter?

**Option A: Filter in transforms** (current)
- Pro: Simpler for most use cases
- Con: Can't show delisted markets for historical positions

**Option B: Keep all, filter in hooks/components**
- Pro: Flexibility for edge cases
- Con: Every consumer needs to remember to filter

**Recommendation:** Keep all markets, provide a helper:
```typescript
// In hook or component
const activeMarkets = markets.perps.filter(m => !m.isDelisted);
// Or
const activeMarkets = markets.perps.filter(isActiveMarket);
```

---

## 10. Hooks

### Hook Overview

| Hook | Purpose | Returns | Use Case |
|------|---------|---------|----------|
| `useMarkets()` | Static market data | `MarketsData` | Lookups, getting market info |
| `useMarketsCtxs()` | All markets + contexts | `MarketsCtxsData` | Market selector list |
| `useMarketCtx(key)` | Single market + context | `MarketCtxData` | Focused views (chart, order entry) |

```
┌─────────────────────────────────────────────────────────────────────┐
│                          useMarkets()                                │
│  • Static market data only                                          │
│  • Returns: all[], perps[], spots[], builderPerps[]                 │
│  • Lookup Maps: byKey, byName                                       │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐
│        useMarketsCtxs()             │  │      useMarketCtx(marketKey)        │
│  • ALL markets + real-time contexts │  │  • SINGLE market + real-time ctx    │
│  • For market selector              │  │  • For chart, order entry           │
└─────────────────────────────────────┘  └─────────────────────────────────────┘
```

### When to Use Each

**`useMarkets()`** - Static market data:

```typescript
const { data: markets } = useMarkets();

// Get market from fill/order
const market = markets?.byName.get(order.coin);  // "BTC" or "HYPE/USDC"

// Access static info
const decimals = market.szDecimals;
const maxLev = market.maxLeverage;
```

**`useMarketsCtxs()`** - All markets + real-time contexts (for lists):

```typescript
const { data, isLoading } = useMarketsCtxs();

// Filtered lists with real-time data
data.perps       // MarketWithCtx[] - perp markets
data.spots       // MarketWithCtx[] - spot markets
data.builderPerps // MarketWithCtx[] - HIP-3 markets
data.all         // all combined

// Each item has market + context
data.perps[0].market      // static market info
data.perps[0].ctx         // raw context
data.perps[0].midPx       // current price
data.perps[0].change24hPercent  // "+2.45%"
```

**`useMarketCtx(key)`** - Single market + context (for focused views):

```typescript
const data = useMarketCtx("perp:BTC");
// or
const data = useSelectedMarketCtx();

data.market      // static market info
data.ctx         // raw context
data.midPx       // current price
data.change24h   // 24h change %
```

### Market Selector Pattern

```typescript
function MarketSelector() {
  const { data, isLoading } = useMarketsCtxs();
  const scope = useMarketStore((s) => s.marketScope);
  const setSelectedMarket = useMarketStore((s) => s.setSelectedMarket);

  const filtered = useMemo(() => {
    if (!data) return [];
    switch (scope) {
      case "perp": return data.perps;
      case "spot": return data.spots;
      case "hip3": return data.builderPerps;
      default: return data.all;
    }
  }, [data, scope]);

  if (isLoading) return <Skeleton />;

  return (
    <div>
      {filtered.map((item) => (
        <MarketRow
          key={item.market.marketKey}
          item={item}
          onClick={() => setSelectedMarket(item.market.marketKey)}
        />
      ))}
    </div>
  );
}
```

---

### useMarkets (Static Data)

```typescript
// src/hooks/markets/use-markets.ts

import { useMemo } from "react";
import { useInfoMeta } from "@/lib/hyperliquid/hooks/info/useInfoMeta";
import { useInfoSpotMeta } from "@/lib/hyperliquid/hooks/info/useInfoSpotMeta";
import { useInfoPerpDexs } from "@/lib/hyperliquid/hooks/info/useInfoPerpDexs";
import { useInfoAllPerpMetas } from "@/lib/hyperliquid/hooks/info/useInfoAllPerpMetas";
import { transformPerpMeta, transformSpotMeta, transformBuilderPerpMeta } from "@/lib/markets/transforms";
import type { UnifiedMarket, MarketsData, MarketKey } from "@/types/market";

const STATIC_QUERY_OPTIONS = {
  staleTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
};

export function useMarkets() {
  const perpMeta = useInfoMeta({}, STATIC_QUERY_OPTIONS);
  const spotMeta = useInfoSpotMeta(STATIC_QUERY_OPTIONS);
  const perpDexs = useInfoPerpDexs(STATIC_QUERY_OPTIONS);
  const allPerpMetas = useInfoAllPerpMetas(STATIC_QUERY_OPTIONS);

  const isLoading =
    perpMeta.isLoading || spotMeta.isLoading || perpDexs.isLoading || allPerpMetas.isLoading;
  const isError =
    perpMeta.isError || spotMeta.isError || perpDexs.isError || allPerpMetas.isError;

  const data = useMemo<MarketsData | undefined>(() => {
    if (!perpMeta.data || !spotMeta.data || !perpDexs.data || !allPerpMetas.data) {
      return undefined;
    }

    const perps = transformPerpMeta(perpMeta.data);
    const spots = transformSpotMeta(spotMeta.data);
    const builderPerps = transformBuilderPerpMeta(perpDexs.data, allPerpMetas.data);

    const all: UnifiedMarket[] = [...perps, ...spots, ...builderPerps];

    // Lookup maps
    const byKey = new Map<MarketKey, UnifiedMarket>();
    const byName = new Map<string, UnifiedMarket>();

    for (const market of all) {
      byKey.set(market.marketKey, market);
      byName.set(market.name, market);
    }

    return {
      all,
      perps,
      spots,
      builderPerps,
      byKey,
      byName,
      rawPerpMeta: perpMeta.data,
      rawSpotMeta: spotMeta.data,
      dexList: perpDexs.data,
      rawDexMetas: allPerpMetas.data,
    };
  }, [perpMeta.data, spotMeta.data, perpDexs.data, allPerpMetas.data]);

  return { data, isLoading, isError };
}
```

### useMarketsCtxs (All Markets + Contexts)

```typescript
// src/hooks/markets/use-markets-ctxs.ts

import { useMemo } from "react";
import { useMarkets } from "./use-markets";
import { useSubAssetCtxs } from "@/lib/hyperliquid/hooks/subscription/useSubAssetCtxs";
import { useSubSpotAssetCtxs } from "@/lib/hyperliquid/hooks/subscription/useSubSpotAssetCtxs";
import { useSubAllDexsAssetCtxs } from "@/lib/hyperliquid/hooks/subscription/useSubAllDexsAssetCtxs";
import { useSubAllMids } from "@/lib/hyperliquid/hooks/subscription/useSubAllMids";
import { calcChange24h } from "@/lib/markets/context";
import type { UnifiedMarket, PerpMarket, SpotMarket, BuilderPerpMarket } from "@/types/market";

interface MarketWithCtx {
  market: UnifiedMarket;
  ctx: unknown;
  midPx: string | null;
  change24h: number | null;
  change24hPercent: string | null;
}

interface MarketsCtxsData {
  all: MarketWithCtx[];
  perps: MarketWithCtx[];
  spots: MarketWithCtx[];
  builderPerps: MarketWithCtx[];
}

export function useMarketsCtxs() {
  const { data: markets, isLoading: marketsLoading, isError } = useMarkets();

  const perpCtxs = useSubAssetCtxs({});
  const spotCtxs = useSubSpotAssetCtxs();
  const builderCtxs = useSubAllDexsAssetCtxs();
  const allMids = useSubAllMids({});

  const isLoading = marketsLoading || perpCtxs.status === "pending" || spotCtxs.status === "pending";

  // Build spot context Map for O(1) lookup
  const spotCtxMap = useMemo(() => {
    const map = new Map<string, unknown>();
    spotCtxs.data?.ctxs?.forEach((ctx) => map.set(ctx.coin, ctx));
    return map;
  }, [spotCtxs.data]);

  const data = useMemo<MarketsCtxsData | undefined>(() => {
    if (!markets) return undefined;

    function resolve(market: UnifiedMarket): MarketWithCtx {
      let ctx: unknown = null;
      let midPx: string | null = null;

      if (market.kind === "perp") {
        const index = markets.perps.indexOf(market as PerpMarket);
        ctx = perpCtxs.data?.ctxs?.[index] ?? null;
        midPx = (ctx as any)?.midPx ?? allMids.data?.mids?.[market.name] ?? null;
      } else if (market.kind === "spot") {
        ctx = spotCtxMap.get(market.name) ?? null;
        midPx = (ctx as any)?.midPx ?? allMids.data?.mids?.[market.name] ?? null;
      } else if (market.kind === "builderPerp") {
        const bm = market as BuilderPerpMarket;
        const dexCtxs = builderCtxs.data?.find((d) => d.dex === bm.dex);
        const index = markets.builderPerps.filter(m => m.dex === bm.dex).indexOf(bm);
        ctx = dexCtxs?.ctxs?.[index] ?? null;
        midPx = (ctx as any)?.midPx ?? null;
      }

      const { change24h, change24hPercent } = calcChange24h(midPx, (ctx as any)?.prevDayPx);
      return { market, ctx, midPx, change24h, change24hPercent };
    }

    const perps = markets.perps.map(resolve);
    const spots = markets.spots.map(resolve);
    const builderPerps = markets.builderPerps.map(resolve);

    return {
      all: [...perps, ...spots, ...builderPerps],
      perps,
      spots,
      builderPerps,
    };
  }, [markets, perpCtxs.data, spotCtxMap, builderCtxs.data, allMids.data]);

  return { data, isLoading, isError };
}
```

### useMarketCtx (Single Market + Subscription)

> **Use for focused views** (chart, order entry, header). This hook combines a single market with its real-time context.

```typescript
// src/hooks/markets/use-market-ctx.ts

import { useMemo } from "react";
import { useMarkets } from "./use-markets";
import { useMarketStore } from "@/stores/use-market-store";
import { useSubAssetCtxs } from "@/lib/hyperliquid/hooks/subscription/useSubAssetCtxs";
import { useSubSpotAssetCtxs } from "@/lib/hyperliquid/hooks/subscription/useSubSpotAssetCtxs";
import { useSubAllDexsAssetCtxs } from "@/lib/hyperliquid/hooks/subscription/useSubAllDexsAssetCtxs";
import { useSubAllMids } from "@/lib/hyperliquid/hooks/subscription/useSubAllMids";
import { calcChange24h } from "@/lib/markets/context";
import type { MarketKey, UnifiedMarket, PerpMarket, BuilderPerpMarket } from "@/types/market";

interface MarketCtxData {
  market: UnifiedMarket;
  ctx: unknown;  // Raw perp or spot context
  midPx: string | null;
  change24h: number | null;
  change24hPercent: string | null;
}

export function useMarketCtx(marketKey: MarketKey | null): MarketCtxData | null {
  const { data: markets } = useMarkets();

  const perpCtxs = useSubAssetCtxs({});
  const spotCtxs = useSubSpotAssetCtxs();
  const builderCtxs = useSubAllDexsAssetCtxs();
  const allMids = useSubAllMids({});

  // Build spot context Map for O(1) lookup
  const spotCtxMap = useMemo(() => {
    const map = new Map<string, unknown>();
    spotCtxs.data?.ctxs?.forEach((ctx) => map.set(ctx.coin, ctx));
    return map;
  }, [spotCtxs.data]);

  return useMemo(() => {
    if (!marketKey || !markets) return null;

    const market = markets.byKey.get(marketKey);
    if (!market) return null;

    let ctx: unknown = null;
    let midPx: string | null = null;

    if (market.kind === "perp") {
      // Perp context is indexed by position in universe array
      const perpMarket = market as PerpMarket;
      const index = markets.perps.indexOf(perpMarket);
      ctx = perpCtxs.data?.ctxs?.[index] ?? null;
      midPx = (ctx as any)?.midPx ?? allMids.data?.mids?.[market.name] ?? null;
    } else if (market.kind === "spot") {
      ctx = spotCtxMap.get(market.name) ?? null;
      midPx = (ctx as any)?.midPx ?? allMids.data?.mids?.[market.name] ?? null;
    } else if (market.kind === "builderPerp") {
      const builderMarket = market as BuilderPerpMarket;
      const dexCtxs = builderCtxs.data?.find((d) => d.dex === builderMarket.dex);
      const index = markets.builderPerps
        .filter(m => m.dex === builderMarket.dex)
        .indexOf(builderMarket);
      ctx = dexCtxs?.ctxs?.[index] ?? null;
      midPx = (ctx as any)?.midPx ?? null;
    }

    const { change24h, change24hPercent } = calcChange24h(midPx, (ctx as any)?.prevDayPx);

    return { market, ctx, midPx, change24h, change24hPercent };
  }, [marketKey, markets, perpCtxs.data, spotCtxMap, builderCtxs.data, allMids.data]);
}

export function useSelectedMarketCtx(): MarketCtxData | null {
  const selectedMarketKey = useMarketStore((s) => s.selectedMarketKey);
  return useMarketCtx(selectedMarketKey);
}
```

### getMarketCapabilities (Pure Function)

> **Changed from hook to function.** Capabilities are derived from static market data, no need for a hook.

```typescript
// src/lib/markets/capabilities.ts

import type { UnifiedMarket, PerpMarket, BuilderPerpMarket } from "@/types/market";

interface MarketCapabilities {
  isLeveraged: boolean;
  hasMarginMode: boolean;
  hasFunding: boolean;
  hasAdvancedOrders: boolean;
  maxLeverage: number | null;
  allowsCrossMargin: boolean;
}

export function getMarketCapabilities(market: UnifiedMarket | null): MarketCapabilities {
  if (!market || market.kind === "spot") {
    return {
      isLeveraged: false,
      hasMarginMode: false,
      hasFunding: false,
      hasAdvancedOrders: false,
      maxLeverage: null,
      allowsCrossMargin: false,
    };
  }

  // Perp or BuilderPerp
  const perpMarket = market as PerpMarket | BuilderPerpMarket;
  return {
    isLeveraged: true,
    hasMarginMode: !perpMarket.onlyIsolated && perpMarket.marginMode !== "strictIsolated",
    hasFunding: true,
    hasAdvancedOrders: true,
    maxLeverage: perpMarket.maxLeverage,
    allowsCrossMargin: perpMarket.marginMode !== "noCross" && perpMarket.marginMode !== "strictIsolated",
  };
}

// Usage in component:
// const capabilities = getMarketCapabilities(market);
```

---

## 11. Helper Functions

### Context Helpers

```typescript
// src/lib/markets/context.ts

export function calcChange24h(
  midPx: string | null | undefined,
  prevDayPx: string | null | undefined
): { change24h: number | null; change24hPercent: string | null } {
  if (!midPx || !prevDayPx) {
    return { change24h: null, change24hPercent: null };
  }

  const current = parseFloat(midPx);
  const prev = parseFloat(prevDayPx);

  if (prev === 0) {
    return { change24h: null, change24hPercent: null };
  }

  const change24h = ((current - prev) / prev) * 100;
  const change24hPercent = `${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}%`;

  return { change24h, change24hPercent };
}
```

### API Helpers

> **Note:** `getApiParams` already exists in `src/lib/hyperliquid/market-key.ts`

```typescript
// Additional helpers if needed

import type { UnifiedMarket, MarketsData } from "@/types/market";

/**
 * Find market by name (coin for perp, pair for spot)
 */
export function findMarketByName(
  markets: MarketsData,
  name: string,
  dex?: string
): UnifiedMarket | undefined {
  if (dex) {
    return markets.builderPerps.find((m) => m.name === name && m.dex === dex);
  }

  if (name.includes("/")) {
    return markets.spots.find((m) => m.name === name);
  }

  return markets.perps.find((m) => m.name === name);
}

/**
 * Check if market is active (not delisted)
 */
export function isActiveMarket(market: UnifiedMarket): boolean {
  return !market.isDelisted;
}
```

### Display Helpers

> **Philosophy:** Components can access raw fields directly. Only add helpers for genuinely complex formatting.

```typescript
// src/lib/markets/display.ts

import type { UnifiedMarket, SpotMarket } from "@/types/market";

/**
 * Get display name for market
 * Perp: "BTC-PERP", Spot: "HYPE/USDC", BuilderPerp: "ABC-PERP"
 */
export function getDisplayName(market: UnifiedMarket): string {
  if (market.kind === "spot") {
    return market.name;  // Already "HYPE/USDC"
  }
  return `${market.name}-PERP`;
}

/**
 * Get base asset name for icons
 */
export function getBaseAsset(market: UnifiedMarket): string {
  if (market.kind === "spot") {
    return (market as SpotMarket).baseToken.name;
  }
  return market.name;
}

/**
 * Get quote asset name
 */
export function getQuoteAsset(market: UnifiedMarket): string {
  if (market.kind === "spot") {
    return (market as SpotMarket).quoteToken.name;
  }
  return "USD";
}

/**
 * Format for chart title (includes DEX badge for builder perps)
 */
export function formatChartTitle(market: UnifiedMarket): string {
  const name = getDisplayName(market);
  if (market.kind === "builderPerp") {
    return `${name} (${market.dex})`;
  }
  return name;
}
```

---

## 12. Component Usage

### Market Selector

```typescript
// components/market-selector.tsx

import { useMemo } from "react";
import { useMarketsCtxs } from "@/hooks/markets/use-markets-ctxs";
import { useMarketStore } from "@/stores/use-market-store";
import { getDisplayName } from "@/lib/markets/display";
import { formatCompact, formatFunding } from "@/lib/format";
import { cn } from "@/lib/cn";

export function MarketSelector() {
  const { data, isLoading } = useMarketsCtxs();
  const setSelectedMarket = useMarketStore((s) => s.setSelectedMarket);
  const setMarketScope = useMarketStore((s) => s.setMarketScope);
  const scope = useMarketStore((s) => s.marketScope);

  const filtered = useMemo(() => {
    if (!data) return [];
    switch (scope) {
      case "perp": return data.perps;
      case "spot": return data.spots;
      case "hip3": return data.builderPerps;
      default: return data.all;
    }
  }, [data, scope]);

  if (isLoading) return <Skeleton />;

  return (
    <div>
      {/* Scope tabs */}
      <div className="flex gap-1">
        {(["all", "perp", "spot", "hip3"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setMarketScope(s)}
            className={cn("px-3 py-1", scope === s && "bg-accent")}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Market list */}
      <div className="mt-4 space-y-1">
        {filtered.map((item) => {
          const { market, ctx, midPx, change24h, change24hPercent } = item;
          const displayName = getDisplayName(market);
          const isPerp = market.kind !== "spot";
          const perpCtx = ctx as { funding?: string; openInterest?: string; dayNtlVlm?: string } | null;

          return (
            <button
              key={market.marketKey}
              onClick={() => setSelectedMarket(market.marketKey)}
              className="flex items-center justify-between w-full p-2 hover:bg-accent/50"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{displayName}</span>
                {market.kind === "builderPerp" && (
                  <span className="text-xs px-1 bg-purple-500/20 text-purple-400 rounded">
                    {market.dex}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm">
                {isPerp && perpCtx && (
                  <>
                    <span className="text-muted-foreground">
                      {formatFunding(perpCtx.funding)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCompact(perpCtx.openInterest)}
                    </span>
                  </>
                )}
                <span className="text-muted-foreground">
                  {formatCompact(perpCtx?.dayNtlVlm)}
                </span>
                <span className={cn(
                  change24h && change24h >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {change24hPercent ?? "-"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

### Market Overview

```typescript
// components/market-overview.tsx

import { useSelectedMarketCtx } from "@/hooks/markets/use-market-ctx";
import { getMarketCapabilities } from "@/lib/markets/capabilities";
import { formatPrice, formatCompact, formatFunding } from "@/lib/format";

export function MarketOverview() {
  const data = useSelectedMarketCtx();

  if (!data) return <Skeleton />;

  const { market, ctx, midPx, change24hPercent } = data;
  const capabilities = getMarketCapabilities(market);

  // ctx is raw - cast to access fields
  const perpCtx = ctx as { oraclePx?: string; funding?: string; openInterest?: string; dayNtlVlm?: string } | null;
  const spotCtx = ctx as { circulatingSupply?: string; dayNtlVlm?: string } | null;

  return (
    <div className="flex gap-4">
      <Stat label="PRICE" value={formatPrice(midPx)} />
      <Stat label="24H" value={change24hPercent} />
      <Stat label="VOL" value={formatCompact(perpCtx?.dayNtlVlm ?? spotCtx?.dayNtlVlm)} />

      {capabilities.isLeveraged && perpCtx && (
        <>
          <Stat label="ORACLE" value={formatPrice(perpCtx.oraclePx)} />
          <Stat label="FUNDING" value={formatFunding(perpCtx.funding)} />
          <Stat label="OI" value={formatCompact(perpCtx.openInterest)} />
        </>
      )}

      {!capabilities.isLeveraged && spotCtx && (
        <Stat label="SUPPLY" value={formatCompact(spotCtx.circulatingSupply)} />
      )}
    </div>
  );
}
```

### Order Entry Panel

```typescript
// components/order-entry-panel.tsx

import { useSelectedMarketCtx } from "@/hooks/markets/use-market-ctx";
import { getMarketCapabilities } from "@/lib/markets/capabilities";
import type { SpotMarket } from "@/types/market";

export function OrderEntryPanel() {
  const data = useSelectedMarketCtx();

  if (!data) return null;

  const { market } = data;
  const capabilities = getMarketCapabilities(market);

  // Get szDecimals based on market type
  const szDecimals = market.kind === "spot"
    ? (market as SpotMarket).baseToken.szDecimals
    : market.szDecimals;

  return (
    <div className="space-y-4">
      {/* Side Toggle */}
      <SideToggle labels={capabilities.isLeveraged ? ["Long", "Short"] : ["Buy", "Sell"]} />

      {/* Order Type */}
      <OrderTypeSelector
        types={
          capabilities.hasAdvancedOrders
            ? ["market", "limit", "stopMarket", "stopLimit", "tpMarket", "tpLimit"]
            : ["market", "limit"]
        }
      />

      {/* Price & Size */}
      <PriceInput szDecimals={szDecimals} />
      <SizeInput szDecimals={szDecimals} />

      {/* Reduce Only - perp only */}
      {capabilities.isLeveraged && <ReduceOnlyCheckbox />}

      <SubmitOrderButton market={market} />
    </div>
  );
}
```

---

## 13. File Structure

```
src/
├── types/
│   └── market.ts                      # Market type definitions (extends raw API types)
├── lib/
│   ├── hyperliquid/
│   │   ├── market-key.ts              # EXISTING - MarketKey types & utilities
│   │   └── hooks/                     # EXISTING - no changes needed
│   │       ├── info/
│   │       │   ├── useInfoMeta.ts
│   │       │   ├── useInfoSpotMeta.ts
│   │       │   ├── useInfoPerpDexs.ts
│   │       │   └── useInfoAllPerpMetas.ts
│   │       └── subscription/
│   │           ├── useSubAssetCtxs.ts
│   │           ├── useSubSpotAssetCtxs.ts
│   │           ├── useSubAllDexsAssetCtxs.ts
│   │           └── useSubAllMids.ts
│   └── markets/
│       ├── transforms.ts              # Minimal transforms (spread raw + add kind/marketKey)
│       ├── context.ts                 # calcChange24h helper
│       ├── capabilities.ts            # getMarketCapabilities function
│       └── display.ts                 # getDisplayName, getBaseAsset, etc.
├── stores/
│   └── use-market-store.ts            # selectedMarketKey, marketScope
└── hooks/
    └── markets/
        ├── use-markets.ts             # Static data (combines info hooks)
        ├── use-markets-ctxs.ts        # All markets + real-time contexts
        └── use-market-ctx.ts          # Single market + real-time context
```

---

## Summary

| Aspect | Implementation |
|--------|----------------|
| **Raw data philosophy** | Extend API types, don't transform fields |
| **Minimal additions** | Only add `marketKey`, `kind`, `dex`, `dexIndex`, `baseToken` |
| **Global store** | `useMarketStore` for `selectedMarketKey` and `marketScope` |
| **useMarkets()** | Static market data with `byKey` and `byName` lookups |
| **useMarketsCtxs()** | All markets + contexts for market selector |
| **useMarketCtx()** | Single market + context for focused views |
| **getMarketCapabilities()** | Pure function, not a hook |
| **Type-safe** | Discriminated union with `kind` field |

### Key Design Decisions

1. **No context normalization** - Components cast raw ctx to access fields
2. **Simple hooks** - `useMarketsCtxs` combines all data for easy consumption
3. **Keep delisted markets** - Let consumers filter if needed
4. **Pure function for capabilities** - Derived from static market data
5. **Two lookup Maps** - `byKey` for routing, `byName` for matching fills/orders
