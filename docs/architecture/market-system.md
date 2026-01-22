# Market System Architecture

## Overview

This document outlines the architecture for a unified market management system that supports:
- **Perpetual markets** (main DEX)
- **Spot markets**
- **HIP-3 Builder DEX markets** (custom perp DEXs)

## Implementation Status

### ✅ Completed Infrastructure
| Component | Status | File |
|-----------|--------|------|
| Market key utilities | ✅ Done | `src/lib/hyperliquid/market-key.ts` |
| Asset ID calculations | ✅ Done | `src/lib/hyperliquid/asset-id.ts` |
| Market type definitions | ✅ Done | `src/lib/hyperliquid/types/markets.ts` |
| Unified useMarkets hook | ✅ Done | `src/lib/hyperliquid/hooks/useMarkets.ts` |
| usePerpMarkets wrapper | ✅ Done | `src/lib/hyperliquid/hooks/usePerpMarkets.ts` |
| Info hooks (spot, perpDexs) | ✅ Done | `src/lib/hyperliquid/hooks/info/` |

### ✅ Completed UI Features
| Component | Status | File |
|-----------|--------|------|
| Market Type Switcher UI | ✅ Done | `src/components/trade/chart/market-type-switcher.tsx` |
| useResolvedMarket for all types | ✅ Done | `src/lib/hyperliquid/hooks/useResolvedMarket.ts` |
| Token selector by market type | ✅ Done | `src/components/trade/chart/token-selector.tsx` |
| Market prefs store (scope/dex) | ✅ Done | `src/stores/use-market-prefs-store.ts` |
| Orderbook for all market types | ✅ Done | `src/components/trade/orderbook/orderbook-panel.tsx` |
| Trades panel for all types | ✅ Done | `src/components/trade/orderbook/trades-panel.tsx` |

### 🚧 Pending / Future Work
| Component | Status | Notes |
|-----------|--------|-------|
| Order entry for spot | 🚧 Pending | Different order structure for spot |
| Spot-specific features | 🚧 Pending | No funding, no leverage UI |
| Builder DEX icons | 🚧 Pending | Custom DEX branding |

## Existing Hooks
| Hook | Purpose | Data Source |
|------|---------|-------------|
| `useMarkets(options)` | Unified market data | All meta APIs |
| `usePerpMarkets()` | Perp market metadata (legacy wrapper) | `useMarkets` |
| `useResolvedMarket(marketKey)` | Full market data with real-time ctx | Combines meta + subscriptions |
| `useSelectedResolvedMarket()` | Selected market with defaults | `useResolvedMarket` + store |

### Market Key Format
```
perp:BTC        → Perpetual BTC on main DEX
spot:HYPE/USDC  → Spot HYPE/USDC pair
perpDex:test:ABC → Perpetual ABC on "test" builder DEX
```

### Asset ID Ranges (from SDK)
| Type | Range | Example |
|------|-------|---------|
| Perp (main) | 0-9999 | BTC = 0, ETH = 1 |
| Spot | 10000+ | HYPE/USDC = 10107 |
| Builder DEX | 100000+ | test:ABC = 110000 |

Formula: `builderDex = 100000 + dex_index * 10000 + asset_index`

---

## API Data Structures

### Perp Meta (`meta()` / `useInfoMeta`)
```typescript
{
  universe: [{
    name: string;           // "BTC", "ETH"
    szDecimals: number;     // 5 for BTC
    maxLeverage: number;    // 40
    marginTableId: number;
    onlyIsolated?: true;
    isDelisted?: true;
  }],
  marginTables: [...],
  collateralToken: number;
}
```
- Supports `dex` param: `meta({ dex: "test" })` for builder DEX

### Spot Meta (`spotMeta()` / `useInfoSpotMeta`)
```typescript
{
  universe: [{
    tokens: number[];       // [baseTokenIndex, quoteTokenIndex]
    name: string;           // "HYPE/USDC"
    index: number;          // 107 → assetId = 10107
    isCanonical: boolean;
  }],
  tokens: [{
    name: string;           // "HYPE"
    szDecimals: number;     // 2
    weiDecimals: number;    // 18
    index: number;          // token index
    tokenId: string;        // "0x..."
    isCanonical: boolean;
    fullName?: string;
  }]
}
```

### Builder DEXs (`perpDexs()` / `useInfoPerpDexs`)
```typescript
[
  null,  // Main DEX (index 0)
  {
    name: string;           // "test"
    fullName: string;       // "Test DEX"
    deployer: Address;
    oracleUpdater?: Address;
    feeRecipient?: Address;
    // ...
  }
]
```

### All Perp Metas (`allPerpMetas()` / `useInfoAllPerpMetas`)
Returns `MetaResponse[]` for all DEXs (main + builders).

---

## Proposed Architecture

### Unified Market Types

```typescript
// Base market info shared by all types
type BaseMarketInfo = {
  marketKey: string;        // "perp:BTC", "spot:HYPE/USDC", "perpDex:test:ABC"
  coin: string;             // Display name: "BTC", "HYPE/USDC", "test:ABC"
  assetId: number;          // Numeric ID for orders
  szDecimals: number;       // Size precision
  isDelisted: boolean;
};

// Perpetual market (main DEX)
type PerpMarketInfo = BaseMarketInfo & {
  kind: "perp";
  maxLeverage: number;
  onlyIsolated: boolean;
  marginTableId: number;
};

// Spot market
type SpotMarketInfo = BaseMarketInfo & {
  kind: "spot";
  baseToken: string;        // "HYPE"
  quoteToken: string;       // "USDC"
  spotPairId: string;       // "@107" for subscriptions
  baseTokenIndex: number;
  quoteTokenIndex: number;
};

// Builder DEX perpetual
type BuilderPerpMarketInfo = BaseMarketInfo & {
  kind: "builderPerp";
  dex: string;              // "test"
  dexFullName: string;      // "Test DEX"
  dexIndex: number;         // For asset ID calculation
  maxLeverage: number;
  onlyIsolated: boolean;
};

type MarketInfo = PerpMarketInfo | SpotMarketInfo | BuilderPerpMarketInfo;
```

### Unified Markets Hook

```typescript
type UseMarketsOptions = {
  // What to load (default: perp only)
  perp?: boolean;                    // Main DEX perps (default: true)
  spot?: boolean;                    // Spot markets (default: false)
  builderDexs?: string[] | boolean;  // Specific DEXs or all (default: false)

  // Filtering
  excludeDelisted?: boolean;         // Filter out delisted (default: true)
};

type MarketsData = {
  // All markets
  markets: MarketInfo[];

  // Filtered views
  perpMarkets: PerpMarketInfo[];
  spotMarkets: SpotMarketInfo[];
  builderMarkets: BuilderPerpMarketInfo[];

  // Lookup maps
  byMarketKey: ReadonlyMap<string, MarketInfo>;
  byCoin: ReadonlyMap<string, MarketInfo>;
  byAssetId: ReadonlyMap<number, MarketInfo>;
};

type UseMarketsReturn = {
  data: MarketsData | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;

  // Lookup functions
  getAssetId: (marketKey: string) => number | undefined;
  getSzDecimals: (marketKey: string) => number | undefined;
  getMaxLeverage: (marketKey: string) => number | undefined;
  getMarketInfo: (marketKey: string) => MarketInfo | undefined;
  isDelisted: (marketKey: string) => boolean;

  // Market key utilities
  getSpotPairId: (marketKey: string) => string | undefined;  // For spot subscriptions
  getDex: (marketKey: string) => string | undefined;         // For builder perps

  // DEX-specific utilities
  availableDexs: string[];                                   // List of loaded DEX names
  getMarketsForDex: (dex: string) => BuilderPerpMarketInfo[]; // All markets for a DEX
  getDexInfo: (dex: string) => DexInfo | undefined;          // DEX metadata
};

// DEX metadata from perpDexs()
type DexInfo = {
  name: string;
  fullName: string;
  deployer: Address;
  oracleUpdater?: Address;
  feeRecipient?: Address;
  dexIndex: number;        // For asset ID calculation
};

function useMarkets(options?: UseMarketsOptions): UseMarketsReturn;
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        useMarkets(options)                       │
│  Unified hook that loads and indexes all market types           │
└─────────────────────────────────────────────────────────────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           │                      │                      │
           ▼                      ▼                      ▼
   ┌──────────────┐      ┌──────────────┐      ┌──────────────────┐
   │ useInfoMeta  │      │useInfoSpot   │      │useInfoAllPerp    │
   │    ({})      │      │   Meta()     │      │   Metas()        │
   │              │      │              │      │ (for builders)   │
   │ Main perps   │      │ Spot pairs   │      │ All DEX perps    │
   └──────┬───────┘      └──────┬───────┘      └────────┬─────────┘
          │                     │                       │
          └─────────────────────┴───────────────────────┘
                                │
                                ▼
                   ┌────────────────────────┐
                   │   Process & Index      │
                   │   - Build MarketInfo[] │
                   │   - Create lookup maps │
                   │   - Calculate assetIds │
                   └────────────────────────┘
                                │
                                ▼
           ┌────────────────────┴────────────────────┐
           │                                         │
           ▼                                         ▼
┌──────────────────────┐               ┌──────────────────────────┐
│ useResolvedMarket    │               │ Components               │
│ - Add real-time ctx  │               │ - Token selector         │
│ - Add mid prices     │               │ - Order entry            │
│ - Market resolution  │               │ - Position sizing        │
└──────────────────────┘               └──────────────────────────┘
```

### Market Key Utilities

```typescript
// src/lib/hyperliquid/market-key.ts

export type MarketKind = "perp" | "spot" | "builderPerp";

// Type guards
export function isPerpMarketKey(key: string): key is `perp:${string}`;
export function isSpotMarketKey(key: string): key is `spot:${string}`;
export function isBuilderPerpMarketKey(key: string): key is `perpDex:${string}:${string}`;

// Factories
export function makePerpMarketKey(coin: string): `perp:${string}`;
export function makeSpotMarketKey(pair: string): `spot:${string}`;
export function makeBuilderPerpMarketKey(dex: string, coin: string): `perpDex:${string}:${string}`;

// Parsers
export function parseMarketKey(key: string): {
  kind: MarketKind;
  coin: string;
  dex?: string;  // Only for builderPerp
} | null;

// Helpers
export function getCoinFromMarketKey(key: string): string | null;
export function getMarketKind(key: string): MarketKind | null;
```

### Working with Specific HIP-3 DEXs

```typescript
// Example: Load only specific DEX
const { data, getMarketsForDex, getDexInfo, availableDexs } = useMarkets({
  perp: false,                    // Skip main DEX perps
  builderDexs: ["hypurr", "test"] // Only these builder DEXs
});

// Get all markets for a specific DEX
const hypurrMarkets = getMarketsForDex("hypurr");
// → [{ marketKey: "perpDex:hypurr:BTC", coin: "hypurr:BTC", ... }, ...]

// Get DEX metadata
const hypurrInfo = getDexInfo("hypurr");
// → { name: "hypurr", fullName: "Hypurr DEX", deployer: "0x...", dexIndex: 1 }

// List all loaded DEXs
console.log(availableDexs);
// → ["hypurr", "test"]

// Resolve specific market on a DEX
const { data: market } = useResolvedMarket("perpDex:hypurr:BTC");
// → { kind: "builderPerp", dex: "hypurr", coin: "hypurr:BTC", assetId: 110000, ... }

// Order with builder DEX asset
await exchange.order({
  orders: [{
    a: market.assetId,  // 110000 (100000 + 1*10000 + 0)
    b: true,
    p: "50000",
    s: "0.01",
    // ...
  }],
  grouping: "na"
});
```

### Asset ID Calculation

```typescript
// src/lib/hyperliquid/asset-id.ts

export function calculateAssetId(
  kind: MarketKind,
  index: number,
  dexIndex?: number
): number {
  switch (kind) {
    case "perp":
      return index;  // 0-9999
    case "spot":
      return 10000 + index;  // 10000+
    case "builderPerp":
      return 100000 + (dexIndex! * 10000) + index;  // 100000+
  }
}

export function parseAssetId(assetId: number): {
  kind: MarketKind;
  index: number;
  dexIndex?: number;
} {
  if (assetId >= 100000) {
    const adjusted = assetId - 100000;
    return {
      kind: "builderPerp",
      dexIndex: Math.floor(adjusted / 10000),
      index: adjusted % 10000,
    };
  }
  if (assetId >= 10000) {
    return { kind: "spot", index: assetId - 10000 };
  }
  return { kind: "perp", index: assetId };
}
```

---

## Implementation Plan

### Phase 1: Core Infrastructure
1. **Update market-key.ts** - Add spot and builderPerp support
2. **Create asset-id.ts** - Asset ID calculation utilities
3. **Create useMarkets hook** - Unified market data hook

### Phase 2: Data Processing
1. **Process perp meta** - Transform to PerpMarketInfo[]
2. **Process spot meta** - Transform to SpotMarketInfo[]
3. **Process builder DEX meta** - Transform to BuilderPerpMarketInfo[]
4. **Build lookup indexes** - byMarketKey, byCoin, byAssetId

### Phase 3: Integration
1. **Update useResolvedMarket** - Support all market types
2. **Update market prefs store** - Support new market key formats
3. **Migrate usePerpMarkets usages** - Switch to useMarkets

### Phase 4: Subscriptions
1. **Spot subscriptions** - Handle `@107` format for spotPairId
2. **Builder DEX subscriptions** - Pass dex param to subscriptions
3. **Update useSubAllMids** - Handle spot mids format

---

## Migration Strategy

### Backward Compatibility

Keep `usePerpMarkets` as a thin wrapper:

```typescript
export function usePerpMarkets(): UsePerpMarketsReturn {
  const { data, isLoading, error, refetch, getAssetId, getSzDecimals, getMaxLeverage, isDelisted, getMarketInfo } =
    useMarkets({ perp: true, spot: false, builderDexs: false });

  // Transform to existing shape for compatibility
  const perpMarketsData = useMemo(() => {
    if (!data) return undefined;
    return {
      markets: data.perpMarkets,
      coinToMarket: new Map(data.perpMarkets.map(m => [m.coin, m])),
      assetIndexToCoin: data.perpMarkets.map(m => m.coin),
    };
  }, [data]);

  return {
    data: perpMarketsData,
    isLoading,
    error,
    refetch,
    // Wrap lookups to use coin instead of marketKey
    getAssetId: (coin) => getAssetId(`perp:${coin}`),
    getSzDecimals: (coin) => getSzDecimals(`perp:${coin}`),
    getMaxLeverage: (coin) => getMaxLeverage(`perp:${coin}`),
    isDelisted: (coin) => isDelisted(`perp:${coin}`),
    getMarketInfo: (coin) => getMarketInfo(`perp:${coin}`) as PerpMarketInfo | undefined,
  };
}
```

### Gradual Migration

1. New code uses `useMarkets` directly
2. Existing code continues using `usePerpMarkets` (wrapper)
3. Migrate components one by one
4. Eventually deprecate `usePerpMarkets`

---

---

## HIP-3 DEX Support Details

### DEX Selection Modes

```typescript
// Mode 1: Static - Load specific DEXs at mount
useMarkets({ builderDexs: ["hypurr"] })

// Mode 2: Dynamic - Load all, filter at runtime
const { data, getMarketsForDex } = useMarkets({ builderDexs: true });
const marketsForSelectedDex = getMarketsForDex(userSelectedDex);

// Mode 3: Single DEX hook - For components that only need one DEX
function useBuilderDexMarkets(dex: string) {
  return useMarkets({
    perp: false,
    spot: false,
    builderDexs: [dex]
  });
}
```

### Market Key → API Parameter Mapping

When making API calls (subscriptions, orders), we need to pass the `dex` param:

| Market Key | API `dex` Param | API `coin` Param |
|------------|-----------------|------------------|
| `perp:BTC` | `""` (empty) | `"BTC"` |
| `perpDex:test:ABC` | `"test"` | `"ABC"` |
| `spot:HYPE/USDC` | N/A | `"@107"` or `"HYPE/USDC"` |

```typescript
// Helper to extract API params from market key
function getApiParams(marketKey: string): { dex: string; coin: string } {
  const parsed = parseMarketKey(marketKey);
  if (!parsed) throw new Error("Invalid market key");

  switch (parsed.kind) {
    case "perp":
      return { dex: "", coin: parsed.coin };
    case "builderPerp":
      return { dex: parsed.dex!, coin: parsed.coin.split(":")[1] };
    case "spot":
      // For spot, coin stays as-is or use spotPairId
      return { dex: "", coin: parsed.coin };
  }
}
```

### Subscriptions with Builder DEX

```typescript
// Current: subscription hooks don't support dex param
useSubL2Book({ coin: "BTC" })

// Needed: Pass dex for builder DEX markets
useSubL2Book({ coin: "ABC", dex: "test" })

// OR: Accept market key directly
useSubL2Book({ marketKey: "perpDex:test:ABC" })
```

---

## Open Questions

1. **Spot subscriptions**: How should we handle spot market real-time data?
   - Spot uses `@107` format for l2Book, trades, etc.
   - Need to map between `spot:HYPE/USDC` and `@107`

2. **Builder DEX selection**: Should we load all builder DEXs or require explicit selection?
   - Option A: Load all with `builderDexs: true`
   - Option B: Only load specific ones with `builderDexs: ["test", "other"]`
   - Recommendation: Default to false, let user opt-in

3. **Market preference storage**: Should favorites support all market types?
   - Current: `["perp:BTC", "perp:ETH", "perp:HYPE"]`
   - Future: `["perp:BTC", "spot:HYPE/USDC", "perpDex:test:ABC"]`

4. **Order entry**: How to handle different order structures for spot vs perp?
   - Spot orders may have different fields
   - May need separate order entry components or conditional logic

---

## File Structure

```
src/lib/hyperliquid/
├── market-key.ts           # Market key utilities (updated)
├── asset-id.ts             # Asset ID calculations (new)
├── hooks/
│   ├── useMarkets.ts       # Unified markets hook (new)
│   ├── usePerpMarkets.ts   # Backward-compatible wrapper (updated)
│   ├── useResolvedMarket.ts # Market resolution (updated)
│   └── info/
│       ├── useInfoMeta.ts
│       ├── useInfoSpotMeta.ts
│       └── useInfoAllPerpMetas.ts
└── types/
    └── markets.ts          # Market type definitions (new)
```

---

## Market Type Switcher Feature

### Overview

The Market Type Switcher allows users to switch between different market types:
- **Perp** - Main DEX perpetual markets (default)
- **Spot** - Spot trading pairs
- **HIP-3** - Builder DEX perpetual markets

### UI Components

#### MarketTypeSwitcher
Located in chart panel header, provides a dropdown to switch market types:

```typescript
type MarketScope = "perp" | "spot" | "builderDex";

// Store: src/stores/use-market-prefs-store.ts
interface MarketPrefsStore {
  selectedMarketKey: string;     // e.g., "perp:BTC", "spot:HYPE/USDC"
  selectedMarketScope: MarketScope;  // Current market type filter
  selectedDex?: string;          // For HIP-3, which DEX is selected
  favoriteMarketKeys: string[];
  actions: {
    setSelectedMarketKey: (key: string) => void;
    setSelectedMarketScope: (scope: MarketScope) => void;
    setSelectedDex: (dex: string | undefined) => void;
    toggleFavoriteMarketKey: (key: string) => void;
  };
}
```

### Data Flow for Market Type Switching

```
┌─────────────────────────────────────────────────────────────┐
│                  MarketTypeSwitcher                          │
│  [Perp ▼] [Spot] [HIP-3 ▼]                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ setSelectedMarketScope()
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              useMarketPrefsStore                             │
│  selectedMarketScope: "perp" | "spot" | "builderDex"        │
│  selectedDex?: string (for HIP-3)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
           ▼                       ▼
┌──────────────────┐     ┌──────────────────────────┐
│  TokenSelector   │     │  useResolvedMarket       │
│  - Filters by    │     │  - Gets market info      │
│    marketScope   │     │  - Subscribes to ctx     │
│  - Shows DEX     │     │  - Handles all types     │
│    selector for  │     └──────────┬───────────────┘
│    HIP-3         │                │
└──────────────────┘                ▼
                       ┌──────────────────────────┐
                       │  Subscriptions           │
                       │  - L2Book (with dex)     │
                       │  - Trades (with dex)     │
                       │  - AllMids               │
                       │  - AssetCtx              │
                       └──────────────────────────┘
```

### Subscription Parameter Handling

For different market types, subscriptions need different parameters:

```typescript
// Perp (main DEX)
useSubL2Book({ coin: "BTC" })
useSubTrades({ coin: "BTC" })
useSubActiveAssetCtx({ coin: "BTC" })

// Spot
useSubL2Book({ coin: "@107" })  // Use spotPairId
useSubTrades({ coin: "@107" })
useSubActiveSpotAssetCtx({ coin: "@107" })

// Builder DEX (HIP-3)
useSubL2Book({ coin: "ABC", dex: "test" })
useSubTrades({ coin: "ABC", dex: "test" })
useSubActiveAssetCtx({ coin: "ABC", dex: "test" })
```

### Default Market Selection by Type

When switching market types, select a sensible default:

| Scope | Default Market |
|-------|---------------|
| perp | `perp:BTC` |
| spot | First available spot pair |
| builderDex | First market on first available DEX |

### Market Icon Display

- **Perp**: Token icon (e.g., BTC icon)
- **Spot**: Base token icon (e.g., HYPE for HYPE/USDC)
- **HIP-3**: Base token icon extracted from `dex:COIN` format

---

## Implementation Learnings

### Subscription Coin Formats

Different market types require different coin formats for WebSocket subscriptions:

| Market Type | Display Coin | Subscription Coin | Example |
|-------------|--------------|-------------------|---------|
| Perp | `BTC` | `BTC` | `useSubL2Book({ coin: "BTC" })` |
| Spot | `PURR/USDC` | `@{pairIndex}` | `useSubL2Book({ coin: "@0" })` |
| Builder DEX | `test:ABC` | `ABC` | `useSubL2Book({ coin: "ABC" })` |

**Important**: For spot markets, the API uses the `spotPairId` format (`@0`, `@1`, etc.) NOT the display pair name.

### Context Data Structures

The SDK returns different structures for perp vs spot asset contexts:

```typescript
// Perp Asset Contexts (AssetCtxsEvent)
{
  dex: string;           // DEX name (empty for main)
  ctxs: PerpAssetCtx[];  // Array indexed by assetId
}

// Spot Asset Contexts (SpotAssetCtxsEvent)
SpotAssetCtx[]  // Array directly (NO wrapper object)
// Each item has a `coin` field (e.g., "@0") for identification
```

**Gotcha**: Spot contexts are an array directly, NOT `{ ctxs: [] }`. Access them differently:
```typescript
// Perp
const perpCtxs = perpCtxsEvent?.ctxs;
const ctx = perpCtxs?.[assetId];

// Spot - create a map by coin for lookup
const spotCtxMap = new Map(spotCtxs.map(ctx => [ctx.coin, ctx]));
const ctx = spotCtxMap.get(market.spotPairId);  // e.g., "@0"
```

### Builder DEX Context Subscriptions

For HIP-3 builder DEX markets, pass the `dex` parameter:

```typescript
// Main DEX perps
useSubAssetCtxs({ dex: "" })

// Builder DEX perps
useSubAssetCtxs({ dex: "test" })  // Pass the DEX name
```

The returned contexts are indexed by `assetIndex` within that DEX (not global assetId).

### Display Name Extraction

Extract display names for icons and headers:

```typescript
// Perp: coin is already the token name
const displayCoin = "BTC";  // from market.coin

// Spot: extract base token from pair
const displayCoin = market.coin.split("/")[0];  // "PURR" from "PURR/USDC"

// Builder DEX: extract token from dex:coin format
const displayCoin = market.coin.split(":")[1];  // "ABC" from "test:ABC"
// Or use: market.coin.split(":").pop()
```

### Size Asset Display

For orderbook/trades Size column headers:

| Market Type | Size Asset | Example Header |
|-------------|------------|----------------|
| Perp | The coin itself | `Size (BTC)` |
| Spot | Base token | `Size (PURR)` |
| Builder DEX | The coin (after `:`) | `Size (ABC)` |

```typescript
const sizeAsset = selectedMarket.kind === "spot"
  ? selectedMarket.coin.split("/")[0]  // Base token for spot
  : selectedMarket.kind === "builderPerp"
    ? selectedMarket.coin.split(":")[1]  // Token for builder
    : selectedMarket.coin;               // Coin for perp
```

### Subscription Stability

To prevent repeated WebSocket connections, memoize subscription parameters:

```typescript
// ❌ Bad - creates new object each render
useSubL2Book({
  coin: subscriptionCoin ?? "",
  nSigFigs: selectedOption?.nSigFigs,  // undefined becomes null in JSON
  mantissa: selectedOption?.mantissa,
});

// ✅ Good - memoize and omit undefined values
const subscriptionParams = useMemo(() => ({
  coin: subscriptionCoin ?? "",
  ...(selectedOption?.nSigFigs !== undefined && { nSigFigs: selectedOption.nSigFigs }),
  ...(selectedOption?.mantissa !== undefined && { mantissa: selectedOption.mantissa }),
}), [subscriptionCoin, selectedOption?.nSigFigs, selectedOption?.mantissa]);

useSubL2Book(subscriptionParams, { enabled: canSubscribe });
```

### Resolved Market Fields by Type

| Field | Perp | Spot | Builder DEX |
|-------|------|------|-------------|
| `kind` | `"perp"` | `"spot"` | `"builderPerp"` |
| `coin` | `"BTC"` | `"PURR/USDC"` | `"test:ABC"` |
| `spotPairId` | - | `"@0"` | - |
| `baseToken` | - | `"PURR"` | - |
| `quoteToken` | - | `"USDC"` | - |
| `dex` | - | - | `"test"` |
| `assetIndex` | `assetId` | `assetId` | Index within DEX |
| `maxLeverage` | `number` | `undefined` | `number` |

### Price Grouping Options

When generating price tick options, avoid floating point precision issues:

```typescript
// ❌ Bad - can produce 0.000049999999999999996
String(10 ** (magnitude - 4) * 5)

// ✅ Good - format with proper decimals
function formatTickLabel(value: number): string {
  if (value >= 1) return String(Math.round(value));
  const decimals = Math.max(0, -Math.floor(Math.log10(value)));
  return value.toFixed(decimals);
}
```

### Spot Market Name Construction

The API may return spot pair names as `@{index}` format. Always construct display names from tokens:

```typescript
// In useMarkets hook
const displayCoin = `${baseToken.name}/${quoteToken.name}`;  // "PURR/USDC"
const marketKey = makeSpotMarketKey(displayCoin);            // "spot:PURR/USDC"
const spotPairId = pair.isCanonical ? `@${pair.index}` : pair.name;  // "@0" for API
```

### Common Patterns

#### Getting Subscription Coin
```typescript
const subscriptionCoin = useMemo(() => {
  if (selectedMarket.kind === "spot") {
    return selectedMarket.spotPairId;  // "@0" format
  }
  if (selectedMarket.kind === "builderPerp") {
    return selectedMarket.coin.split(":")[1];  // Just the token
  }
  return selectedMarket.coin;  // Perp uses coin directly
}, [selectedMarket]);
```

#### Conditional Subscription
```typescript
const canSubscribe = !!subscriptionCoin;
useSubL2Book(params, { enabled: canSubscribe });
```

#### Icon URL Token
```typescript
const iconToken = market.kind === "spot"
  ? market.coin.split("/")[0]
  : market.coin.includes(":")
    ? market.coin.split(":")[1]
    : market.coin;
```
