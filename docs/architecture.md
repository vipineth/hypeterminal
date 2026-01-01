# Project Architecture

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

HyperTerminal is a trading terminal interface for Hyperliquid DEX built with React 19, TanStack Start (SSR), and TailwindCSS 4. It provides real-time market data via WebSocket subscriptions and wallet connectivity for trading perpetuals and spot markets.

## Commands

```bash
pnpm dev       # Start development server
pnpm build     # Production build
pnpm serve     # Preview production build
pnpm check     # Run Biome linter and formatter checks
pnpm lint      # Run Biome linter only
pnpm format    # Run Biome formatter only
```

## Architecture

### Routing & SSR
- Uses TanStack Router with file-based routing in `src/routes/`
- Route tree is auto-generated to `src/routeTree.gen.ts` (do not edit)
- SSR powered by TanStack Start with Nitro backend (`vite.config.ts`)
- React Query integration for SSR data hydration

### State Management
- **Zustand stores** in `src/stores/` for client-side state
  - Stores use the pattern of separating `actions` into a nested object
  - Many stores use `persist` middleware with localStorage
  - `createSelectors` utility generates auto-memoized selectors
- **React Query** for server state and API data
- **Market preferences** stored in `use-market-prefs-store.ts` with Zod validation

### Hyperliquid Integration (`src/lib/hyperliquid/`, `src/hooks/hyperliquid/`)
- Uses `@nktkas/hyperliquid` SDK for API and WebSocket connections
- **Singleton clients** in `clients.ts`: `getInfoClient()`, `getSubscriptionClient()`
- **WebSocket hooks** follow a subscription pattern:
  - `useHyperliquidWs(method, { params, enabled, select })` - generic hook
  - Individual hooks like `useL2BookSubscription`, `useAllMidsSubscription`
  - Subscription state stored in `use-hyperliquid-ws-store.ts`
- **Market registry** pattern: `buildPerpMarketRegistry()` creates lookup maps from API metadata
- Market keys use format `"perp:BTC"` or `"spot:ETH"` (see `market-key.ts`)
- Testnet toggle via `VITE_HYPERLIQUID_TESTNET=true` env var

### Wallet Integration
- Wagmi v3 for wallet connections (Arbitrum chain)
- Config in `src/config/wagmi.ts`
- Mock connector auto-enabled in dev mode
- Requires `VITE_WALLET_CONNECT_PROJECT_ID` env var for WalletConnect

### UI Components
- shadcn/ui (new-york style) in `src/components/ui/`
- Use `pnpm dlx shadcn@latest add <component>` to add new components
- Path alias `@/*` maps to `src/*`

### Trade Terminal Structure (`src/components/trade/`)
- `TradeTerminalPage` - main layout container
- `TopNav` - header with market selector, favorites
- `MainWorkspace` - resizable panels for chart, orderbook, positions
- `OrderEntryPanel` - order form
- `TradingViewChart` - embedded TradingView charting library

## TradingView Charting Library

The app uses TradingView's Advanced Charts library loaded from CDN. Implementation is in `src/components/trade/chart/`.

### Widget Constructor (`trading-view-chart.tsx`)
Key configuration passed to `new window.TradingView.widget({...})`:
- `container` / `library_path` - required DOM element and static files path
- `datafeed` - implements `IBasicDataFeed` interface (see below)
- `symbol` / `interval` - initial chart symbol and timeframe
- `theme` - "light" or "dark"
- `enabled_features` / `disabled_features` - toggle UI features
- `overrides` - customize colors, styles (see `darkOverrides`/`lightOverrides`)
- `custom_css_url` - external stylesheet for deeper theming

### Datafeed API (`datafeed.ts`)
The datafeed is the bridge between TradingView and Hyperliquid data. Required methods:

**`onReady(callback)`** - Called first, returns configuration:
```ts
callback({
  exchanges: [...],
  supported_resolutions: ["1", "5", "15", "60", "240", "1D", ...],
  supports_marks: false,
  supports_time: true,
})
```

**`resolveSymbol(symbolName, onResolve, onError)`** - Returns symbol metadata:
```ts
onResolve({
  name, ticker, description, type: "crypto",
  session: "24x7", timezone: "Etc/UTC",
  pricescale,  // e.g., 100 for 2 decimals, 10000 for 4
  minmov: 1,
  has_intraday: true,
  supported_resolutions,
})
```

**`getBars(symbolInfo, resolution, periodParams, onResult, onError)`** - Fetches historical OHLCV:
- `periodParams`: `{ from, to, countBack }` (Unix timestamps in seconds)
- Returns bars in **ascending order** by time
- Bar format: `{ time, open, high, low, close, volume? }` (time in ms)
- Return `onResult([], { noData: true })` when no more history

**`subscribeBars(symbolInfo, resolution, onTick, listenerGuid)`** - Real-time updates:
- Call `onTick(bar)` whenever new candle data arrives
- Same `time` value updates the current bar; new `time` creates new bar
- Cannot update historical bars (causes "time violation" error)
- Track `listenerGuid` to match with `unsubscribeBars`

**`unsubscribeBars(listenerGuid)`** - Cleanup WebSocket subscription

**`searchSymbols(userInput, exchange, symbolType, onResult)`** - Symbol search

### Resolution Mapping
TradingView resolutions map to Hyperliquid candle intervals:
- `"1"` → `"1m"`, `"5"` → `"5m"`, `"60"` → `"1h"`, `"240"` → `"4h"`, `"1D"` → `"1d"`

### Current Implementation Notes
- Uses `getSubscriptionClient().candle()` for real-time WebSocket updates
- Caches last bar per symbol/resolution to avoid gaps
- Manages multiple listeners per stream (shared subscriptions)
- Infers `pricescale` from `allMids` API response decimal places

## Code Style

- Biome for linting/formatting (tabs, double quotes, 120 line width)
- React Compiler enabled via babel plugin
- Strict TypeScript with `noUnusedLocals` and `noUnusedParameters`
