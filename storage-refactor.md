# Storage Architecture - Final State

## Overview

The stores have been consolidated from 9 files to 6 files, removing dead code and merging related functionality.

---

## Final Store Inventory

### 1. `use-global-settings-store.ts`
**Purpose:** All user preferences (UI, chart, and trading settings)
**Persistence:** localStorage (`global-settings-v1`)

| Field | Type | Default | Used In |
|-------|------|---------|---------|
| `showOrdersOnChart` | boolean | `true` | `trading-view-chart.tsx` |
| `showPositionsOnChart` | boolean | `true` | `trading-view-chart.tsx` |
| `showExecutionsOnChart` | boolean | `false` | `trading-view-chart.tsx` |
| `showOrderbookInUsd` | boolean | `false` | `orderbook-panel.tsx`, `trades-panel.tsx`, `mobile-book-view.tsx` |
| `showChartScanlines` | boolean | `true` | `trading-view-chart.tsx` |
| `numberFormatLocale` | string | `"auto"` | `format.ts` |
| `marketOrderSlippageBps` | number | `25` | `order-entry-panel.tsx`, `positions-tab.tsx`, `mobile-trade-view.tsx` |

**Exported Hooks:**
- `useGlobalSettings()` - Returns UI settings (shallow)
- `useGlobalSettingsActions()` - Returns all setter actions
- `useMarketOrderSlippageBps()` - Returns slippage value
- `useResolvedFormatLocale()` - Returns resolved locale string
- `getResolvedFormatLocale()` - Non-React getter

---

### 2. `use-market-prefs-store.ts`
**Purpose:** Market selection and favorites
**Persistence:** localStorage (`market-prefs-v1`)

| Field | Type | Default | Used In |
|-------|------|---------|---------|
| `selectedMarketKey` | string | `"perp:BTC"` | `useResolvedMarket.ts`, `favorites-strip.tsx` |
| `favoriteMarketKeys` | string[] | `[]` | `favorites-strip.tsx`, `use-token-selector.ts` |

**Exported Hooks:**
- `useSelectedMarketKey()` - Returns selected market
- `useFavoriteMarketKeys()` - Returns favorites array
- `useMarketPrefsActions()` - Returns `setSelectedMarketKey`, `toggleFavoriteMarketKey`

---

### 3. `use-api-wallet-store.ts`
**Purpose:** Agent wallet storage for Hyperliquid trading
**Persistence:** localStorage (dynamic key per user/env)

| Field | Type | Used In |
|-------|------|---------|
| `privateKey` | `0x${string}` | `useAgentRegistration.ts` |
| `publicKey` | `0x${string}` | `useAgentRegistration.ts` |

**Exported Hooks:**
- `useAgentWallet(env, userAddress)` - Returns agent wallet or null
- `useAgentWalletActions()` - Returns `setAgent`, `clearAgent`

---

### 4. `use-orderbook-actions-store.ts`
**Purpose:** Bridge between orderbook clicks and order entry
**Persistence:** None (in-memory only)

| Field | Type | Used In |
|-------|------|---------|
| `selectedPrice` | `number \| null` | `order-entry-panel.tsx`, `orderbook-row.tsx` |

**Exported Hooks:**
- `useSelectedPrice()` - Returns selected price
- `useSetSelectedPrice()` - Returns setter

---

### 5. `use-order-queue-store.ts`
**Purpose:** Order submission queue for toast notifications
**Persistence:** None (in-memory only)

| Field | Type | Used In |
|-------|------|---------|
| `orders` | `OrderQueueItem[]` | `order-entry-panel.tsx`, `order-toast.tsx` |

**Exported Hooks:**
- `useOrderQueue()` - Returns orders array
- `useOrderQueueActions()` - Returns `addOrder`, `updateOrder`, `removeOrder`

---

### 6. `validated-storage.ts`
**Purpose:** Zod-validated localStorage adapter for Zustand persist

---

## Changes Made

### Deleted (Dead Code)
- `use-hyperliquid-ws-store.ts` - Never imported/used
- `create-selectors.ts` - Only used by the above

### Merged
- `use-trade-settings-store.ts` → merged into `use-global-settings-store.ts`
  - `marketOrderSlippageBps` now lives in global settings
  - `useMarketOrderSlippageBps()` hook preserved for backward compatibility

### Simplified
- `use-market-prefs-store.ts`:
  - Removed `marketScope` (never used)
  - Removed `lastSelectedByScope` (internal, never exposed)
  - Removed `setMarketScope` action (never used)
  - Removed `addFavoriteMarketKey` action (never used)
  - Removed `removeFavoriteMarketKey` action (never used)
  - Removed `setFavoriteMarketKeys` action (never used)
  - Removed `useMarketScope()` export (never imported)

### Config Changes
- Removed `STORAGE_KEYS.TRADE_SETTINGS` (no longer needed)

---

## Final Structure

```
src/stores/
├── validated-storage.ts          # Shared Zod validation utility
├── use-global-settings-store.ts  # All user preferences (persisted)
├── use-market-prefs-store.ts     # Market selection (persisted)
├── use-api-wallet-store.ts       # Agent wallet (persisted, per-user)
├── use-orderbook-actions-store.ts # Cross-component state (memory)
└── use-order-queue-store.ts      # Order queue (memory)
```

**Total: 6 files (down from 9)**

---

## Store Categories

### Persisted Stores (localStorage)
| Store | Storage Key | Purpose |
|-------|-------------|---------|
| `use-global-settings-store` | `global-settings-v1` | User preferences |
| `use-market-prefs-store` | `market-prefs-v1` | Market selection |
| `use-api-wallet-store` | `hyperliquid_agent_{env}_{address}` | Trading agent keys |

### In-Memory Stores
| Store | Purpose |
|-------|---------|
| `use-orderbook-actions-store` | Orderbook → Order entry communication |
| `use-order-queue-store` | Order submission feedback |

---

## Usage Patterns

### Reading Settings
```tsx
// Get all UI settings
const { showOrdersOnChart, showOrderbookInUsd } = useGlobalSettings();

// Get specific values
const slippageBps = useMarketOrderSlippageBps();
const selectedMarket = useSelectedMarketKey();
const favorites = useFavoriteMarketKeys();
```

### Updating Settings
```tsx
const { setShowOrdersOnChart, setMarketOrderSlippageBps } = useGlobalSettingsActions();
const { setSelectedMarketKey, toggleFavoriteMarketKey } = useMarketPrefsActions();
```

### Format Locale (non-React)
```tsx
import { getResolvedFormatLocale } from "@/stores/use-global-settings-store";
const locale = getResolvedFormatLocale(); // Works outside React
```
