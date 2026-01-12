# Feature: Spot Swap Interface

## Meta

| Field | Value |
|-------|-------|
| Priority | High |
| Status | In Progress |
| Created | 2026-01-10 |
| Updated | 2026-01-12 |

## Summary

A spot swap interface for exchanging one spot asset for another on Hyperliquid. Current implementation covers token selection, live orderbook quotes, market/limit orders, slippage settings stored in global settings, and the trading-agent approval flow. Balances and tokens come from spot APIs (`spotState`/`spotClearinghouseState` and `spotMeta`), not perp. No confirmation modal is planned. Next work is a minimal open-orders + history section on the same page and defaulting the "From" token to USDC.

## User Stories

- As a trader, I want to swap one token for another easily so I can rebalance my portfolio
- As a trader, I want to see the expected output before confirming so I know what I'll receive
- As a trader, I want to set limit orders for better prices so I can get favorable rates
- As a trader, I want to see my token balances so I know what I can swap
- As a trader, I want to reverse the swap direction with one click for convenience
- As a trader, I want to see open limit orders and recent fills without leaving the swap page

## Requirements

### Must Have

- [x] Token selection for "From" and "To" spot assets
- [x] Spot balances from `spotState` (subscription) with optional `spotClearinghouseState` fallback
- [x] Spot tokens and pairs from `spotMeta` (not perp meta)
- [x] Real-time price quotes from spot orderbook
- [x] Market swap (IOC execution at best price)
- [x] Limit order placement at specified price (GTC)
- [x] Slippage tolerance setting (global settings)
- [x] Swap direction reversal (flip button)
- [x] Trading agent approval flow (Enable Trading)
- [x] Chain switch flow when wallet is on a non-Arbitrum chain
- [ ] Default "From" token to USDC (spot)
- [ ] Open limit orders and order history shown on the swap page (minimal layout)
- [ ] Orders list is spot-only by filtering against `spotMeta.universe` names

### Nice to Have

- [ ] Multi-hop routing (e.g., TOKEN -> USDC -> BTC)
- [ ] Price chart for selected pair
- [ ] Favorite/recent token pairs
- [ ] TWAP orders for large swaps
- [ ] Price alerts

## Tasks

1. [x] Create spot swap page layout and routing (`src/routes/swap.tsx`, `src/components/spot/swap-page.tsx`)
2. [x] Build token selector component with search and balances (`src/components/spot/swap-token-selector.tsx`)
3. [x] Implement price fetching from orderbook via `useSubL2Book`
4. [x] Create swap preview with estimated output and price impact (`src/components/spot/swap-preview.tsx`)
5. [x] Add market swap execution using `useExchangeOrder`
6. [x] Add limit order functionality (GTC)
7. [x] Implement slippage controls (`src/components/spot/swap-settings.tsx`)
8. [x] Connect to user's spot balances via `useSubSpotState`
9. [ ] Default "From" token to USDC once `spotMeta` loads
10. [ ] Add open orders section using `useInfoFrontendOpenOrders` (spot-only filter)
11. [ ] Add history section using `useInfoHistoricalOrders` (spot-only filter)
12. [ ] Add cancel action for open orders via `useExchangeCancel`

## Current Implementation Snapshot

- Route: `src/routes/swap.tsx` -> `SwapPage`
- UI: `src/components/spot/swap-page.tsx`, `src/components/spot/swap-panel.tsx`
- Token selector: `src/components/spot/swap-token-selector.tsx`
- Preview: `src/components/spot/swap-preview.tsx`
- Slippage dialog: `src/components/spot/swap-settings.tsx`
- Quote math: `src/lib/swap/quote.ts`
- Execution: `src/lib/hyperliquid/hooks/exchange/useExchangeOrder.ts`
- Agent approval: `src/lib/hyperliquid/hooks/useTradingAgent.ts` and `src/lib/hyperliquid/hooks/useAgentRegistration.ts`
- Order feedback: `src/components/trade/order-entry/order-toast.tsx`

## Technical Spec

### Finding the Right API

1. Discover methods by intent -> `docs/hyperliquid-sdk-directory.md`
   - Scan "Want to..." tables to find method names
   - Note the type: (I)nfo, (E)xchange, or (S)ubscription
2. Get full parameter schema -> `docs/hyperliquid-sdk-1.md` or `docs/hyperliquid-sdk-2.md`
   - Info methods: sdk-1 lines 1036-1775
   - Exchange methods: sdk-1 lines 1776-2054 + sdk-2 lines 1-220
   - Subscriptions: sdk-2 lines 221-540

### SDK/API Details

#### spotMeta - Get Trading Pairs (Spot Only)

```typescript
// Request
{ type: "spotMeta" }

// Response
{
  universe: [{
    tokens: [baseTokenIndex, quoteTokenIndex],  // e.g., [1, 0] for BTC/USDC
    name: string,                                // e.g., "BTC/USDC"
    index: number,                               // Spot pair index
    isCanonical: boolean
  }],
  tokens: [{
    name: string,           // e.g., "USDC", "BTC"
    szDecimals: number,     // Decimal places for order sizes
    weiDecimals: number,    // Token's smallest unit decimals
    index: number,          // Token index
    tokenId: string,        // Hex token ID
    isCanonical: boolean,
    evmContract: { address: string } | null,
    fullName: string | null
  }]
}
```

#### spotState (subscription) - Spot Balances

```typescript
// Subscription
{ type: "spotState", user: "0x..." }

// Event payload (SpotStateWsEvent)
{
  spotState: {
    balances: [{
      coin: string,     // Token symbol (e.g., "USDC")
      total: string,    // Total balance
      hold: string      // Amount on hold
    }]
  }
}
```

#### spotClearinghouseState (info) - Spot Balances Snapshot

```typescript
// Request
{ type: "spotClearinghouseState", user: "0x..." }
```

#### l2Book - Orderbook for Price (Spot Pair Name)

```typescript
// Request
{ coin: "BTC/USDC" }  // Use pair name from spotMeta.universe
```

#### frontendOpenOrders / historicalOrders - Orders & History

```typescript
// Requests
{ type: "frontendOpenOrders", user: "0x..." }
{ type: "historicalOrders", user: "0x..." }

// Each order includes fields like:
{
  coin: string,        // Pair or asset symbol
  side: "B" | "A",
  limitPx: string,
  sz: string,
  oid: number,
  timestamp: number,
  orderType: "Market" | "Limit" | "Stop Market" | "Stop Limit" | "Take Profit Market" | "Take Profit Limit",
  tif: "Gtc" | "Ioc" | "Alo" | "FrontendMarket" | "LiquidationMarket" | null
}
```

Spot-only filtering:
- Build a Set of `spotMeta.universe[].name` values.
- Keep orders whose `coin` matches one of those names.
- Default filter: "All spot"; optional filter: "Selected pair".

#### Order Action for Spot Swap

```typescript
// Spot order uses same structure as perp orders
// Asset ID is the spot pair index (from universe[].index)
{
  orders: [{
    a: number,      // Spot pair index
    b: boolean,     // true = buy base token, false = sell base token
    p: string,      // Limit price (quote per base)
    s: string,      // Size in base currency
    r: false,       // Not reduce-only for spot
    t: {
      limit: { tif: "Ioc" }  // Ioc for market swap, Gtc for limit
    }
  }],
  grouping: "na"
}
```

### Hooks to Use

| Hook | Purpose |
|------|---------|
| `useInfoSpotMeta` | Get all spot pairs and tokens |
| `useSubSpotState` | Get user balances via subscription |
| `useInfoSpotClearinghouseState` | Snapshot fallback for balances |
| `useSubL2Book` | Subscribe to orderbook for real-time prices |
| `useTradingAgent` | Agent approval flow ("Enable Trading") |
| `useExchangeOrder` | Place swap orders |
| `useMarketOrderSlippageBps` | Read persisted slippage |
| `useGlobalSettingsActions` | Update slippage |
| `useInfoFrontendOpenOrders` | Open orders list |
| `useInfoHistoricalOrders` | History list |
| `useExchangeCancel` | Cancel open orders |

### State Management (Current)

```typescript
// Swap form state (local component state)
interface SwapFormState {
  fromToken: SpotToken | null;
  toToken: SpotToken | null;
  fromAmount: string;
  orderType: "market" | "limit";
  limitPrice: string;
  slippageBps: number;
  settingsOpen: boolean;
  tokenSelectorOpen: "from" | "to" | null;
  walletDialogOpen: boolean;
  approvalError: string | null;
}

// Derived values (src/lib/swap/quote.ts)
interface SwapQuote {
  inputAmount: number;
  outputAmount: number;
  minimumOutput: number;
  executionPrice: number;
  midPrice: number;
  priceImpactPct: number;
  fee: number;
}
```

### Swap Execution Logic (Current)

```typescript
// Calculate quote from orderbook levels
const quote = calculateSwapQuote(spotPair, side, fromAmountNum, levels, slippageBps, ORDER_FEE_RATE_TAKER);

// Determine base size for order
const baseSize = side === "buy" ? quote.outputAmount : fromAmountNum;

// Use limit price if provided, otherwise use execution price from quote
const price = orderType === "limit" ? parseNumberOrZero(limitPrice) : quote.executionPrice;

// Apply slippage in the correct direction
const priceWithSlippage = applySlippage(price, slippageBps, side === "buy" ? "up" : "down");

// Place order using IOC for market or GTC for limit
```

## Files

### Current

- `src/routes/swap.tsx`
- `src/components/spot/swap-page.tsx`
- `src/components/spot/swap-panel.tsx`
- `src/components/spot/swap-token-selector.tsx`
- `src/components/spot/swap-preview.tsx`
- `src/components/spot/swap-settings.tsx`
- `src/lib/swap/quote.ts`

### Planned

- `src/components/spot/swap-orders-panel.tsx` (open + history tabs)
- `src/components/spot/swap-orders-list.tsx` (shared row renderer)

### Related

- `src/lib/hyperliquid/hooks/subscription/useSubSpotState.ts`
- `src/lib/hyperliquid/hooks/subscription/useSubL2Book.ts`
- `src/lib/hyperliquid/hooks/info/useInfoSpotClearinghouseState.ts`
- `src/lib/hyperliquid/hooks/info/useInfoFrontendOpenOrders.ts`
- `src/lib/hyperliquid/hooks/info/useInfoHistoricalOrders.ts`
- `src/lib/hyperliquid/hooks/exchange/useExchangeCancel.ts`
- `src/components/trade/order-entry/order-toast.tsx`

## UI/UX

### Design Implementation

When building UI components for this feature:

1. Use `/frontend-design` skill for new UI work
2. Reference existing components in `src/components/trade/` for patterns
3. Follow the terminal aesthetic using existing color tokens and monospace typography
4. Use existing UI primitives from `src/components/ui/`
5. Match the dark terminal theme

### Main Swap Panel Layout

```
┌─────────────────────────────────────┐
│  Swap                    ⚙️ Settings │
├─────────────────────────────────────┤
│  From                               │
│  ┌─────────────────────────────────┐│
│  │ [USDC ▼]            1,234.56   ││
│  │                    Balance: 5000││
│  └─────────────────────────────────┘│
│                                     │
│              [⇅] ← Flip button      │
│                                     │
│  To                                 │
│  ┌─────────────────────────────────┐│
│  │ [Select ▼]         0.0000     ││
│  │                    Balance: 0.0 ││
│  └─────────────────────────────────┘│
│                                     │
│  ○ Market  ● Limit                  │
│  Price: [________] USDC             │
│                                     │
│  ─────────────────────────────────  │
│  Rate: 1 BTC = 95,432 USDC          │
│  Price Impact: 0.12%                │
│  Min. Received: 0.0128 BTC          │
│  Fee: ~$0.25                        │
│  ─────────────────────────────────  │
│                                     │
│  ┌─────────────────────────────────┐│
│  │         Swap                    ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Orders + History (Minimal, Same Page)

```
┌─────────────────────────────────────┐
│  Orders                             │
│  [Open] [History]                   │
├─────────────────────────────────────┤
│  Side  Pair     Price   Size   Time │
│  B     BTC/USDC 95500   0.10   2m    │
│  A     ETH/USDC 3200    1.50   9m    │
│  [Cancel] on open orders only       │
└─────────────────────────────────────┘
```

Notes:
- Keep it compact: one-line rows, 4-5 columns max, truncate where needed.
- Default filter: "All spot" with optional "Selected pair".
- History shows status (filled/canceled) and hides cancel actions.
- Set a max height for the orders container and make the list scrollable.

### Settings Dialog (Current)

```
┌─────────────────────────────────────┐
│  Swap Settings                      │
├─────────────────────────────────────┤
│  Slippage Tolerance                 │
│  [0.1%] [0.25%] [0.5%] [1.0%]       │
│  Custom: [__] %                     │
└─────────────────────────────────────┘
```

### User Flow (Current)

1. User navigates to /swap
2. "From" defaults to USDC; "To" is unselected
3. User connects wallet if not connected
4. If chain mismatch, user switches to Arbitrum
5. User selects a "To" token
6. Orderbook subscription loads; preview shows rate/impact/min received
7. If agent not approved, user clicks "Enable Trading" and signs
8. User enters amount and clicks "Swap" (or places limit order)
9. Orders and history list update below the swap panel (All spot by default)

### Visual States (Current)

```
Disconnected:
[Connect Wallet]

Needs approval:
[Enable Trading]

No balance:
Insufficient balance

Loading price:
Orderbook error or Loading...

Orders empty:
No open orders / No history yet
```

## Edge Cases

- No direct pair exists (no quote / Swap disabled)
- "To" token not selected (disable submit)
- Insufficient balance disables submit and shows error
- Min notional below $10 (ORDER_MIN_NOTIONAL_USD) disables submit
- Orderbook subscription error disables submit
- Chain mismatch requires switch to Arbitrum
- Same token selected auto-swaps the other side
- Token has no liquidity (no quote)

## Research Notes

- Spot pairs in `spotMeta.universe` have `tokens: [baseIndex, quoteIndex]`
- Spot tokens list is `spotMeta.tokens` (do not use perp `meta`)
- Spot balances come from `spotState` or `spotClearinghouseState`
- `b: true` = buy base token (spend quote), `b: false` = sell base token
- `tif: "Ioc"` for market, `tif: "Gtc"` for limit
- Price impact = (execution price - mid price) / mid price
- `parseSpotBalances` uses total - hold for available balance
- Slippage is persisted in global settings

## Open Questions

- How many history rows should we show by default, and do we need pagination or infinite scroll?
