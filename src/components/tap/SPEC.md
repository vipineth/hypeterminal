# Tap Trade - Implementation Specification

## Overview

Tap Trade is a Euphoria-style box prediction trading interface for Hyperliquid. Users tap on price level boxes to bet that price will touch that level within a time window, using perpetual futures under the hood.

**Route:** `/tap-trade`

---

## Core Concept

```
USER MENTAL MODEL:
"I bet $X that BTC price will touch $Y within Z seconds.
 If it does, I win based on the multiplier.
 If it doesn't (or hits my stop), I lose my bet."
```

---

## Interview Summary - Key Decisions

### Trade Execution Model

| Decision | Choice |
|----------|--------|
| Tap behavior | Double-tap to trade (first tap highlights, second confirms within 1-2s) |
| Order sequence | Sequential: TP order → Entry position (rollback if fail) |
| Bet amount | Global setting modal, $1-5 fixed amounts, default $1 |
| Leverage | Global max leverage setting, calculated per box based on distance |
| Stop loss | **NONE** - Position can liquidate based on leverage |
| Take profit | Box upper price = TP (limit sell order) |
| Cash out | Allowed anytime - cancel TP + market close |
| Concurrent bets | Unlimited, stacking allowed |

### Simplified Trade Model

```
NO STOP LOSS - Position liquidates if price moves against user

For LONG (boxes above price):
  - Entry: Market buy at current price
  - TP: Limit sell at box upper price
  - Liquidation: Depends on leverage (no manual SL)

For SHORT (boxes below price):
  - Entry: Market sell at current price
  - TP: Limit buy at box lower price
  - Liquidation: Depends on leverage (no manual SL)
```

### Grid & Box Configuration

| Setting | Value |
|---------|-------|
| Layout | Price chart left-to-right, boxes on RIGHT side |
| Rows | Multiple rows above/below current price (0.5% increments) |
| Time columns | **REMOVED** - No time-based columns |
| Box spacing | Fixed 0.5% between price levels |
| Min distance | 0.5% from current price |
| Box content | Calculated leverage (rounded up) based on distance + max leverage |
| Box style | Sharp corners, fixed pixel size |
| Direction colors | Green (up/long above price), Red (down/short below price) |
| Box disappearing | Boxes fade/disappear as price reaches their level |

### Box Leverage Calculation

```typescript
// Each box is 0.5% away from the previous
// Leverage is calculated based on:
// - Distance from current price
// - Global max leverage setting

function calculateBoxLeverage(
  boxPriceLevel: number,
  currentPrice: number,
  maxLeverage: number
): number {
  const distancePercent = Math.abs(boxPriceLevel - currentPrice) / currentPrice * 100;
  // Higher distance = lower leverage needed for same multiplier
  // Lower distance = higher leverage needed
  const calculatedLeverage = Math.min(maxLeverage, Math.ceil(100 / distancePercent));
  return calculatedLeverage;
}

// Example with maxLeverage = 50:
// Box at 0.5% away: leverage = min(50, ceil(100/0.5)) = 50x (capped)
// Box at 1.0% away: leverage = min(50, ceil(100/1.0)) = 50x (capped)
// Box at 2.0% away: leverage = min(50, ceil(100/2.0)) = 50x
// Box at 5.0% away: leverage = min(50, ceil(100/5.0)) = 20x
```

### Visual Design (App Theme + Euphoria Layout)

| Element | Specification |
|---------|---------------|
| Color theme | Use existing app theme (bg-background, terminal colors) |
| Background | Dark with terminal-grid pattern (existing class) |
| Price chart | terminal-cyan line flowing LEFT-TO-RIGHT with historical data |
| Price dot | White/cyan glowing dot at current price (pulsing, rightmost point) |
| Layout | Price chart on LEFT, Boxes stacked on RIGHT |
| Box fill (UP/LONG) | terminal-green for boxes above current price |
| Box fill (DOWN/SHORT) | terminal-red for boxes below current price |
| Box content | Calculated leverage (e.g., "50x") + price level |
| Taken box style | terminal-amber fill with timer |
| Taken box content | Timer (seconds only) + leverage |
| Active box visibility | Always visible even if price gets close |
| Box removal | Fade transition when price REACHES that level |
| Y-axis right | Price levels next to boxes |
| X-axis bottom | Timestamps for price chart |
| Bottom bar | Balance pill (left), Bet amount + Max Leverage selectors (right) |
| Settings | Floating action button OR inline in bottom bar |

### Settings & State

| Setting | Value |
|---------|-------|
| Settings modal | Auto-open on first visit |
| Settings position | Top right corner OR bottom bar inline |
| Settings content | Asset selector (BTC, ETH, SOL) + Bet amount ($1-5) + **Max Leverage** |
| Default asset | BTC |
| Default bet | $1 |
| Default max leverage | 20x (user configurable) |
| State persistence | Full localStorage (settings + active bets) |
| Page layout | Integrated with main app (keep header/sidebar) |

### Feedback & Audio

| Event | Feedback |
|-------|----------|
| Box tap | Haptic feedback on mobile |
| First tap (double-tap) | Box highlights/pulses |
| Trade error | Toast notification |
| Win (TP hit) | Minimal (green checkmark), distinct win sound |
| Loss (SL hit) | Minimal transition, distinct lose sound |
| Expiry | Instant clear, sound based on P&L |
| Sounds | Always on (no toggle) |

### Technical Behavior

| Behavior | Value |
|----------|-------|
| Price updates | Every WebSocket tick |
| Cooldown on new boxes | None |
| Authentication | Use existing Hyperliquid connection |
| Tab close | Positions persist on-chain (TP/SL orders survive) |
| Balance display | Available only |
| Multiplier display | Theoretical (pre-fees) |
| Price decimals | Asset default from Hyperliquid |
| History | None (present-focused) |
| Onboarding | None |

---

## Grid Layout Specification (New Design)

### Visual Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◆ BTC $95,234.82  ▼                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                                                    $95,712 ┌───────┐ +1.0% │
│  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · │  50x  │ LONG  │
│                                                            └───────┘       │
│                                                    $95,473 ┌───────┐ +0.5% │
│  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · │  50x  │ LONG  │
│                                                            └───────┘       │
│                                                                             │
│  ╭──────────────────────────────────────────────────●      [$95,234.82]    │
│  │                                                  ↑                       │
│  │     PRICE CHART (left-to-right)              glowing                    │
│  │     terminal-cyan line                         dot                       │
│  ╯                                                                          │
│                                                                             │
│                                                    $94,996 ┌───────┐ -0.5% │
│  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · │  50x  │ SHORT │
│                                                            └───────┘       │
│                                                    $94,759 ┌───────┐ -1.0% │
│  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · │  50x  │ SHORT │
│                                                            └───────┘       │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  💰 Available: $1,234.56         Bet: $5 ▼    Max Leverage: 50x ▼    ⚙️   │
├─────────────────────────────────────────────────────────────────────────────┤
│     10:15:00       10:15:30       10:16:00       10:16:30       10:17:00   │
└─────────────────────────────────────────────────────────────────────────────┘

BOXES ON RIGHT SIDE:
┌───────────┐
│   50x     │  ← Calculated leverage (rounded)
│ $95,473   │  ← Price level (TP target)
│   LONG    │  ← Direction indicator
└───────────┘
  terminal-green for LONG (above price)
  terminal-red for SHORT (below price)
```

### Key Visual Elements

1. **Price Chart**: terminal-cyan line flowing LEFT-TO-RIGHT showing historical price
2. **Glowing Dot**: White/cyan pulsing dot at RIGHTMOST point (current price)
3. **Boxes (LONG)**: terminal-green, stacked on RIGHT side ABOVE price line
4. **Boxes (SHORT)**: terminal-red, stacked on RIGHT side BELOW price line
5. **Box Content**: Leverage (50x) + Price level ($95,473)
6. **Box Spacing**: Each box 0.5% away from previous
7. **Y-Axis (Right side)**: Price levels aligned with boxes
8. **X-Axis (Bottom)**: Timestamps for price chart
9. **Bottom Bar**: Balance (left), Bet amount selector, Max Leverage selector, Settings
10. **Grid Background**: Use existing terminal-grid class
11. **Box Disappearing**: When price REACHES a box level, that box fades out

---

## Box States

### 1. Available State (LONG - Above Price)
- Classes: `bg-terminal-green/20 border border-terminal-green`
- Content: Leverage (e.g., "50x") + Price level + "LONG"
- Text: `text-terminal-green`
- Interaction: Tappable (double-tap to trade)

### 2. Available State (SHORT - Below Price)
- Classes: `bg-terminal-red/20 border border-terminal-red`
- Content: Leverage (e.g., "50x") + Price level + "SHORT"
- Text: `text-terminal-red`
- Interaction: Tappable (double-tap to trade)

### 3. Highlighted State (First Tap)
- Classes: `bg-terminal-cyan/30 border-2 border-terminal-cyan`
- Add pulsing animation
- Duration: 1.5 seconds waiting for second tap
- If no second tap: Returns to available state

### 4. Taken State (Active Bet)
- Classes: `bg-terminal-amber/30 border border-terminal-amber`
- Content: Timer (no time limit, shows duration) OR "ACTIVE" + Leverage
- Text: `text-terminal-amber`
- Interaction: Tappable to cash out (close position at market)

### 5. Fading/Reached State
- Opacity reducing over 250ms (`animate-fade-out`)
- Triggered when price REACHES that box's price level
- Box disappears because TP would have been hit
- Active bet boxes at that level = WIN (TP triggered)

---

## Trade Execution Flow

### Opening a Position (NO STOP LOSS)

```typescript
async function openTapTrade(box: Box, betAmount: number, maxLeverage: number) {
  // 1. Calculate trade parameters
  const params = calculateTradeParams(box, betAmount, maxLeverage);

  // 2. Place TP order first (limit order at box price)
  const tpOrder = await placeTakeProfitOrder(params);
  if (!tpOrder.success) {
    showToast("Failed to place TP order");
    return;
  }

  // 3. Open position at market
  const entry = await openPosition(params);
  if (!entry.success) {
    await cancelOrder(tpOrder.oid);
    showToast("Failed to open position");
    return;
  }

  // 4. Start monitoring (no SL - can liquidate)
  startBetMonitor(bet);
  playSound("trade_open");
}

// NO STOP LOSS - Position outcomes:
// 1. TP Hit: Price reaches box level → Limit sell triggers → WIN
// 2. Liquidation: Price moves against → Position liquidated → LOSE
// 3. Cash Out: User manually closes → Market close → Variable PnL
```

### Cash Out Flow

```typescript
async function cashOut(bet: ActiveBet) {
  // 1. Cancel TP order
  await cancelOrder(bet.tpOrderId);

  // 2. Market close position (NO SL to cancel)
  await closePositionAtMarket(bet.coin, bet.size);

  // 3. Calculate and display result
  const pnl = await calculatePnL(bet);
  playSound(pnl >= 0 ? "win" : "lose");
}
```

---

## Calculation Formulas

### Leverage Calculation Per Box

```typescript
function calculateBoxLeverage(
  boxPriceLevel: number,
  currentPrice: number,
  maxLeverage: number
): number {
  const distancePercent = Math.abs(boxPriceLevel - currentPrice) / currentPrice * 100;

  // Calculate leverage needed to achieve ~2x return at this distance
  // Formula: leverage = 100 / distancePercent (for ~2x return)
  const calculatedLeverage = Math.ceil(100 / distancePercent);

  // Cap at user's max leverage setting
  return Math.min(maxLeverage, calculatedLeverage);
}

// Examples with maxLeverage = 50:
// Box at +0.5%: ceil(100/0.5) = 200 → capped to 50x
// Box at +1.0%: ceil(100/1.0) = 100 → capped to 50x
// Box at +2.0%: ceil(100/2.0) = 50 → 50x
// Box at +5.0%: ceil(100/5.0) = 20 → 20x
```

### Position Size Calculation

```typescript
function calculatePositionSize(
  betAmount: number,
  leverage: number,
  currentPrice: number
): { sizeUsd: number; sizeAsset: number } {
  // Position size = bet amount * leverage
  const sizeUsd = betAmount * leverage;
  const sizeAsset = sizeUsd / currentPrice;

  return { sizeUsd, sizeAsset };
}

// Example:
// Bet: $5, Leverage: 50x, Price: $95,000
// Size USD: $5 * 50 = $250
// Size Asset: $250 / $95,000 = 0.00263 BTC
```

### Expected PnL Calculation

```typescript
function calculateExpectedPnL(
  sizeAsset: number,
  entryPrice: number,
  tpPrice: number,
  direction: 'LONG' | 'SHORT'
): number {
  const priceDiff = tpPrice - entryPrice;

  if (direction === 'LONG') {
    return sizeAsset * priceDiff; // Positive if TP > entry
  } else {
    return sizeAsset * -priceDiff; // Positive if TP < entry
  }
}
```

### Liquidation Price (Approximate)

```typescript
function estimateLiquidationPrice(
  entryPrice: number,
  leverage: number,
  direction: 'LONG' | 'SHORT'
): number {
  // Simplified: liquidation ~= entry ± (entry / leverage)
  // Actual depends on maintenance margin, but this gives rough estimate
  const liqDistance = entryPrice / leverage;

  if (direction === 'LONG') {
    return entryPrice - liqDistance; // Liquidated if price drops
  } else {
    return entryPrice + liqDistance; // Liquidated if price rises
  }
}

// Example:
// Entry: $95,000, Leverage: 50x, Direction: LONG
// Liq Distance: $95,000 / 50 = $1,900
// Liq Price: $95,000 - $1,900 = $93,100
```

---

## Configuration Constants

```typescript
export const TAP_TRADE_CONFIG = {
  // Grid
  BOX_SPACING_PERCENT: 0.5,      // Each box 0.5% away from previous
  MIN_DISTANCE_PERCENT: 0.5,     // Minimum distance from current price
  MAX_BOXES_PER_SIDE: 10,        // Max boxes above/below price

  // NO TIME WINDOWS - Positions stay open until TP hit or liquidation

  // Leverage
  MAX_LEVERAGE_OPTIONS: [10, 20, 30, 50, 100] as const,
  DEFAULT_MAX_LEVERAGE: 20,

  // Betting
  BET_AMOUNTS: [1, 2, 3, 4, 5] as const,
  DEFAULT_BET: 1,

  // Assets
  SUPPORTED_ASSETS: ['BTC', 'ETH', 'SOL'] as const,
  DEFAULT_ASSET: 'BTC',

  // UI
  DOUBLE_TAP_WINDOW_MS: 1500,
  FADE_DURATION_MS: 250,
  PRICE_CHART_DURATION_MS: 60000, // 1 minute of historical data

  // Colors - Use existing app theme CSS variables
  COLORS: {
    // Box states (Tailwind classes to use)
    BOX_LONG: 'bg-terminal-green/20 border-terminal-green text-terminal-green',
    BOX_SHORT: 'bg-terminal-red/20 border-terminal-red text-terminal-red',
    BOX_ACTIVE: 'bg-terminal-amber/30 border-terminal-amber text-terminal-amber',
    BOX_HIGHLIGHT: 'bg-terminal-cyan/30 border-terminal-cyan',

    // Price line
    PRICE_LINE: 'stroke-terminal-cyan',
    PRICE_DOT: 'fill-white stroke-terminal-cyan',
  },

  // Audio
  SOUNDS: {
    TAP: '/sounds/tap.mp3',
    TRADE_OPEN: '/sounds/trade_open.mp3',
    WIN: '/sounds/win.mp3',
    LOSE: '/sounds/lose.mp3',
  },
} as const;
```

---

## Storage Schema

```typescript
// localStorage key: 'tap-trade-settings-v1'
interface TapTradeSettings {
  betAmount: 1 | 2 | 3 | 4 | 5;
  asset: 'BTC' | 'ETH' | 'SOL';
  maxLeverage: 10 | 20 | 30 | 50 | 100;
  hasSeenSettings: boolean;
}

// localStorage key: 'tap-trade-active-bets-v1'
interface TapTradeActiveBets {
  bets: ActiveBet[];
}

interface ActiveBet {
  id: string;
  coin: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  tpPrice: number;              // Box price level (TP target)
  // NO slPrice - position can liquidate
  leverage: number;             // Actual leverage used for this trade
  sizeAsset: number;            // Position size in asset units
  sizeUsd: number;              // Position size in USD
  betAmount: number;            // Original bet amount
  startTime: number;            // When position was opened
  // NO expiresAt - position stays open until TP or liquidation
  tpOrderId: string;            // Hyperliquid order ID for TP
  entryOrderId: string;         // Hyperliquid order ID for entry
  estimatedLiqPrice: number;    // Approximate liquidation price
}
```

---

## Component Structure

```
src/components/tap/
├── SPEC.md                    # This file
├── tap-trade-page.tsx         # Main page component
├── components/
│   ├── tap-grid.tsx           # The box grid
│   ├── tap-box.tsx            # Individual box
│   ├── price-line.tsx         # Current price line with animated dot
│   ├── settings-modal.tsx     # Asset + bet amount settings
│   └── active-bet-overlay.tsx # Timer overlay for taken boxes
├── hooks/
│   ├── use-tap-trade-store.ts # Zustand store
│   ├── use-box-grid.ts        # Grid calculation logic
│   └── use-trade-execution.ts # Trade placement logic
├── lib/
│   ├── calculations.ts        # Multiplier, position size, SL formulas
│   └── constants.ts           # Configuration constants
└── types.ts                   # TypeScript types
```

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Main App Header - TopNav]                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  ◆ BTC $95,234.82 ▼                                                   │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │                                                                       │  │
│  │                                              $95,950 ┌──────┐ +0.75% │  │
│  │  · · · · · · · · · · · · · · · · · · · · · · · · · · │ 50x  │  LONG  │  │
│  │                                                      │      │        │  │
│  │                                                      └──────┘        │  │
│  │                                              $95,712 ┌──────┐ +0.50% │  │
│  │  · · · · · · · · · · · · · · · · · · · · · · · · · · │ 50x  │  LONG  │  │
│  │                                                      │      │        │  │
│  │                                                      └──────┘        │  │
│  │                                              $95,473 ┌──────┐ +0.25% │  │
│  │  · · · · · · · · · · · · · · · · · · · · · · · · · · │ 50x  │  LONG  │  │
│  │                                                      └──────┘        │  │
│  │                                                                       │  │
│  │  ╭─────────────────────────────────────────────●    [$95,234.82]     │  │
│  │  │      PRICE CHART (terminal-cyan)            ↑                     │  │
│  │  │      flows left-to-right               glowing                    │  │
│  │  ╯                                          dot                      │  │
│  │                                                                       │  │
│  │                                              $94,996 ┌──────┐ -0.25% │  │
│  │  · · · · · · · · · · · · · · · · · · · · · · · · · · │ 50x  │ SHORT  │  │
│  │                                                      └──────┘        │  │
│  │                                              $94,759 ┌──────┐ -0.50% │  │
│  │  · · · · · · · · · · · · · · · · · · · · · · · · · · │ 50x  │ SHORT  │  │
│  │                                                      └──────┘        │  │
│  │                                              $94,521 ┌──────┐ -0.75% │  │
│  │  · · · · · · · · · · · · · · · · · · · · · · · · · · │ 50x  │ SHORT  │  │
│  │                                                      └──────┘        │  │
│  │                                                                       │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │  💰 $1,234.56     Bet: $5 ▼     Max Lev: 50x ▼                   ⚙️  │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │  10:15:00         10:15:30         10:16:00         10:16:30         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Main App Footer - FooterBar]                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sound Files Needed

| Sound | File | Trigger |
|-------|------|---------|
| Tap | tap.mp3 | Any box tap (first of double-tap) |
| Trade Open | trade_open.mp3 | Position successfully opened |
| Win | win.mp3 | TP hit OR expiry with profit |
| Lose | lose.mp3 | SL hit OR expiry with loss |

---

## Edge Cases

### Price Movement During Double-Tap
If price moves such that the highlighted box would need to fade:
- Keep box highlighted until second tap window expires
- If user completes double-tap, validate box is still valid before executing
- If invalid, show toast "Price moved - box no longer valid"

### Multiple Bets on Same Box
- Allowed (stacking)
- Each bet tracked independently
- Multiple timers shown (or aggregate view)

### Network Failure Mid-Execution
- Rollback any successfully placed orders
- Show toast with error
- User can retry

### Page Refresh with Active Bets
- Restore from localStorage
- Re-query chain for position status
- Sync timers based on expiresAt timestamp

---

## API Integration Points

Uses existing Hyperliquid hooks from the codebase:
- `useAllMidsSubscription` - Real-time price updates
- `useClearinghouseState` - Balance/margin data
- `useApiWalletStore` - Trading wallet/signer

New API calls needed:
- Place limit order (for TP)
- Place stop order (for SL)
- Place market order (for entry)
- Cancel order
- Close position at market

---

## Testing Checklist

- [ ] Double-tap to open trade
- [ ] Single tap highlights then resets after 1.5s
- [ ] TP triggers correctly when price reaches box level
- [ ] Position can liquidate (no SL protection)
- [ ] Cash out cancels TP order and closes position at market
- [ ] Settings modal auto-opens first visit
- [ ] Settings persist across refresh (bet amount, max leverage, asset)
- [ ] Active bets restore on refresh
- [ ] Price chart updates in real-time (left-to-right flow)
- [ ] Boxes disappear when price reaches their level
- [ ] Active bet boxes stay visible
- [ ] Sounds play correctly (tap, open, win, lose)
- [ ] Haptic feedback on mobile
- [ ] Error toast on failures
- [ ] Multiple concurrent bets allowed
- [ ] All three assets work (BTC, ETH, SOL)
- [ ] Max leverage selector works correctly
- [ ] Leverage per box calculated correctly based on distance
- [ ] Liquidation price estimate shown/calculated

---

*Specification Version: 1.0*
*Based on interview conducted: January 2025*
