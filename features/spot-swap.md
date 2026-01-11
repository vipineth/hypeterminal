# Feature: Spot Swap Interface

## Meta

| Field | Value |
|-------|-------|
| Priority | High |
| Status | Planned |
| Created | 2026-01-10 |
| Updated | 2026-01-10 |

## Summary

A Uniswap-style spot swap interface for exchanging one spot asset for another on Hyperliquid. Supports market swaps, limit orders, and displays real-time prices and user balances.

## User Stories

- As a trader, I want to swap one token for another easily so I can rebalance my portfolio
- As a trader, I want to see the expected output before confirming so I know what I'll receive
- As a trader, I want to set limit orders for better prices so I can get favorable rates
- As a trader, I want to see my token balances so I know what I can swap
- As a trader, I want to reverse the swap direction with one click for convenience

## Requirements

### Must Have

- [ ] Token selection for "From" and "To" assets
- [ ] Display user's spot balances for each token
- [ ] Real-time price quotes from orderbook
- [ ] Market swap (instant execution at best price)
- [ ] Limit order placement at specified price
- [ ] Slippage tolerance setting
- [ ] Swap direction reversal (flip button)
- [ ] Transaction confirmation with price impact warning
- [ ] Order history for spot trades

### Nice to Have

- [ ] Multi-hop routing (e.g., TOKEN → USDC → BTC)
- [ ] Price chart for selected pair
- [ ] Favorite/recent token pairs
- [ ] TWAP orders for large swaps
- [ ] Price alerts

## Tasks

1. [ ] Create spot swap page layout and routing
2. [ ] Build token selector component with search and balances
3. [ ] Implement price fetching from orderbook via `useSubL2Book`
4. [ ] Create swap preview with estimated output and price impact
5. [ ] Add market swap execution using `useExchangeOrder`
6. [ ] Add limit order functionality
7. [ ] Implement slippage controls
8. [ ] Build order confirmation modal
9. [ ] Add spot order history section
10. [ ] Connect to user's spot balances via `useInfoSpotClearinghouseState`

## Technical Spec

### Finding the Right API

1. **Discover methods by intent** → `docs/hyperliquid-sdk-directory.md`
   - Scan "Want to..." tables to find method names
   - Note the type: (I)nfo, (E)xchange, or (S)ubscription

2. **Get full parameter schema** → `docs/hyperliquid-sdk-1.md` or `docs/hyperliquid-sdk-2.md`
   - Info methods: sdk-1 lines 1036-1775
   - Exchange methods: sdk-1 lines 1776-2054 + sdk-2 lines 1-220
   - Subscriptions: sdk-2 lines 221-540

### SDK/API Details

#### spotMeta - Get Trading Pairs

```typescript
// Request
{ type: "spotMeta" }

// Response
{
  universe: [{
    tokens: [baseTokenIndex, quoteTokenIndex],  // e.g., [1, 0] for BTC/USDC
    name: string,                                // e.g., "BTC"
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

#### spotClearinghouseState - User Balances

```typescript
// Request
{ type: "spotClearinghouseState", user: "0x..." }

// Response
{
  balances: [{
    coin: string,       // Token symbol (e.g., "USDC")
    token: number,      // Token index
    total: string,      // Total balance
    hold: string,       // Amount on hold (in orders)
    entryNtl: string    // Entry notional value
  }]
}
```

#### l2Book - Orderbook for Price

```typescript
// Request
{ coin: "BTC" }  // Use pair name from universe

// Response
{
  coin: string,
  time: number,
  levels: [
    [{ px: string, sz: string, n: number }],  // Bids
    [{ px: string, sz: string, n: number }]   // Asks
  ]
}
```

#### Order Action for Spot Swap

```typescript
// Spot order uses same structure as perp orders
// Asset ID is the spot pair index (from universe[].index)
{
  orders: [{
    a: number,      // Spot pair index
    b: boolean,     // true = buy base token, false = sell base token
    p: string,      // Limit price
    s: string,      // Size in base currency
    r: false,       // Not reduce-only for spot
    t: {
      limit: { tif: "Ioc" }  // Ioc for market swap, Gtc for limit
    }
  }],
  grouping: "na"
}

// Example: Buy 0.1 BTC with USDC at market price
{
  orders: [{
    a: 1,              // BTC/USDC pair index
    b: true,           // Buy BTC
    p: "95500",        // Limit price (with slippage)
    s: "0.1",          // 0.1 BTC
    r: false,
    t: { limit: { tif: "Ioc" } }  // Fill or kill
  }],
  grouping: "na"
}
```

### Hooks to Use

| Hook | Purpose |
|------|---------|
| `useInfoSpotMeta` | Get all spot pairs and tokens |
| `useInfoSpotClearinghouseState` | Get user's spot balances |
| `useSubL2Book` | Subscribe to orderbook for real-time prices |
| `useExchangeOrder` | Place swap orders |
| `useExchangeCancel` | Cancel limit orders |
| `useInfoFrontendOpenOrders` | Get pending orders |
| `useInfoHistoricalOrders` | Get order history |

### State Management

```typescript
// Swap form state (local component state)
interface SwapFormState {
  fromToken: SpotToken | null;
  toToken: SpotToken | null;
  fromAmount: string;
  toAmount: string;
  orderType: "market" | "limit";
  limitPrice: string;
  slippageBps: number;  // Default 50 (0.5%)
}

// Derived values
interface SwapQuote {
  expectedOutput: string;
  minimumOutput: string;    // After slippage
  priceImpact: number;      // Percentage
  executionPrice: string;
  fee: string;
}
```

### Swap Execution Logic

```typescript
// For market swap (buy base token)
function buildMarketBuyOrder(
  pairIndex: number,
  baseAmount: string,
  bestAsk: string,
  slippageBps: number
): Order {
  const maxPrice = applySlippage(bestAsk, slippageBps, "up");
  return {
    a: pairIndex,
    b: true,  // Buy
    p: maxPrice,
    s: baseAmount,
    r: false,
    t: { limit: { tif: "Ioc" } }
  };
}

// For market swap (sell base token)
function buildMarketSellOrder(
  pairIndex: number,
  baseAmount: string,
  bestBid: string,
  slippageBps: number
): Order {
  const minPrice = applySlippage(bestBid, slippageBps, "down");
  return {
    a: pairIndex,
    b: false,  // Sell
    p: minPrice,
    s: baseAmount,
    r: false,
    t: { limit: { tif: "Ioc" } }
  };
}
```

## Files

### Create

- `src/app/swap/page.tsx` - Swap page
- `src/components/swap/swap-panel.tsx` - Main swap interface
- `src/components/swap/token-selector.tsx` - Token selection dropdown
- `src/components/swap/swap-preview.tsx` - Preview with price impact
- `src/components/swap/swap-settings.tsx` - Slippage settings
- `src/components/swap/swap-history.tsx` - Recent swaps
- `src/lib/swap/quote.ts` - Price calculation utilities
- `src/lib/swap/routing.ts` - Find best route for swap

### Modify

- `src/components/layout/navigation.tsx` - Add swap link
- `src/lib/hyperliquid/hooks/info/index.ts` - Export spot hooks if needed

## UI/UX

### Design Implementation

When building UI components for this feature:

1. **Use `/frontend-design` skill** - Invoke the frontend-design skill to generate production-grade components that match the app's visual style
2. **Reference existing components** - Study `src/components/trade/` for patterns like order entry panels, modals, and form inputs
3. **Follow the terminal aesthetic** - Use existing color tokens (`terminal-green`, `terminal-red`, etc.) and the monospace/tabular-nums typography
4. **Use existing UI primitives** - Leverage components from `src/components/ui/` (Button, Input, Dialog, Popover, etc.)
5. **Match the dark theme** - All new components should integrate seamlessly with the dark trading terminal theme

### Main Swap Panel Layout

```
┌─────────────────────────────────────┐
│  Swap                    ⚙️ Settings │
├─────────────────────────────────────┤
│  From                               │
│  ┌─────────────────────────────────┐│
│  │ [🔵 USDC ▼]        1,234.56    ││
│  │                    Balance: 5000││
│  └─────────────────────────────────┘│
│                                     │
│              [⇅] ← Flip button      │
│                                     │
│  To                                 │
│  ┌─────────────────────────────────┐│
│  │ [🟠 BTC ▼]         0.0129      ││
│  │                    Balance: 0.5 ││
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

### Token Selector Modal

```
┌─────────────────────────────────────┐
│  Select Token               ✕       │
├─────────────────────────────────────┤
│  🔍 [Search by name or address   ] │
├─────────────────────────────────────┤
│  Popular                            │
│  [USDC] [BTC] [ETH] [HYPE]          │
├─────────────────────────────────────┤
│  Your Tokens                        │
│  ┌─────────────────────────────────┐│
│  │ 🔵 USDC          5,000.00      ││
│  │ 🟠 BTC              0.5000     ││
│  │ 🔷 ETH              2.5000     ││
│  │ 🟣 HYPE         1,234.00       ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Settings Popover

```
┌─────────────────────────────────────┐
│  Transaction Settings               │
├─────────────────────────────────────┤
│  Slippage Tolerance                 │
│  [0.1%] [0.5%] [1.0%] [Custom: __]  │
│                                     │
│  Transaction Deadline               │
│  [30] minutes                       │
└─────────────────────────────────────┘
```

### User Flow

1. User navigates to /swap
2. "From" defaults to USDC, "To" is empty
3. User clicks "To" token selector → modal with available tokens
4. User selects BTC → price fetched from orderbook
5. User enters amount in "From" field → "To" amount auto-calculates
6. Preview shows rate, price impact, min received
7. User clicks "Swap" → confirmation modal
8. User confirms → wallet signature
9. Order submitted → toast shows result
10. Balances update on success

### Visual States

```
Disconnected:
[Connect Wallet to Swap]

No balance:
[Insufficient USDC balance]

High price impact (>2%):
⚠️ Price Impact Warning
Price impact is 3.5%. Your trade may be frontrun.
[Swap Anyway] [Cancel]

Loading price:
[Fetching best price...]

Success:
✅ Swapped 1,000 USDC for 0.0105 BTC
```

## Edge Cases

- **No direct pair exists** - Route through USDC (TOKEN1 → USDC → TOKEN2)
- **Insufficient balance** - Disable swap button, show error
- **High price impact (>2%)** - Show warning, require confirmation
- **Order partially filled** - Show actual received vs expected
- **Slippage exceeded** - Show "Price moved" error, suggest retry
- **Token has no liquidity** - Show "No liquidity" message
- **Same token selected** - Disable swap, show message
- **Very small amounts** - Check against min order size

## Research Notes

- Spot pairs in `universe` have `tokens: [baseIndex, quoteIndex]`
- Most pairs are quoted in USDC (token index 0)
- Order `b: true` = buy base token (spend quote), `b: false` = sell base token (receive quote)
- `tif: "Ioc"` ensures immediate fill or nothing (for market orders)
- `tif: "Gtc"` for limit orders that rest on book
- Price impact = (execution price - mid price) / mid price
- Best ask (lowest) for buying, best bid (highest) for selling
- Spot has no leverage - simple asset exchange

## Open Questions

- [ ] Should we support multi-hop routing (A → USDC → B)?
- [ ] Show mini chart in swap panel?
- [ ] Add "Max" button that uses full balance minus gas?
- [ ] Support TWAP for large swaps?
- [ ] Show historical swaps or link to existing order history?
- [ ] Add price comparison with external sources?
