# Feature: TP/SL Orders (Take Profit / Stop Loss)

## Meta

| Field | Value |
|-------|-------|
| Priority | High |
| Status | Ready for Implementation |
| Created | 2026-01-10 |
| Updated | 2026-01-11 |

## Summary

Enable Take Profit and Stop Loss orders for both new and existing positions with configurable defaults and quick percentage suggestions.

## User Stories

- As a trader, I want to set TP/SL when placing an order so that I can manage risk automatically
- As a trader, I want to add TP/SL to existing positions so that I can protect open trades
- As a trader, I want default TP/SL percentages so that I don't have to configure every trade
- As a trader, I want quick percentage buttons so that I can set common levels with one click

## Requirements

### Must Have

- [x] Set TP/SL when placing new orders via order entry panel
- [x] Add TP/SL to existing positions via positions table
- [x] Price input for trigger price with calculated % display
- [x] Separate quick percentage buttons for TP and SL (5%, 10%, 25%, 50%)
- [x] Display pending TP/SL orders in orders table with distinct TP/SL badges
- [x] Cancel TP/SL orders (standard cancel, no special warning)
- [x] Show estimated P&L in TP/SL section (format: +$1,234 / -$500)

### Nice to Have

- [x] Global default TP/SL percentages in settings (below slippage setting)
- [x] Auto-add TP/SL toggle: when enabled, auto-check TP/SL checkbox and pre-fill from defaults
- [x] Edit existing TP/SL orders via position modal (shows current values, replaces on save)

## Design Decisions

### Order Behavior
- **Position sizing**: TP/SL always covers the full position size (no partial)
- **Atomicity**: Orders submitted as atomic batch using `grouping: "positionTpsl"` - all succeed or all fail
- **Adding to position**: New TP/SL applies only to the new order size, existing TP/SL unchanged
- **Market orders**: Supported - uses mark price for % calculations

### Price Calculation
- **Reference price for %**: Limit price for limit orders, mark price for market orders
- **Trigger reference**: Mark Price (more stable, standard for perps)
- **% display**: Always show calculated % next to price input (e.g., `$105.50 (5.5%)`)

### UI/UX Decisions
- **Initial state**: When TP/SL checkbox enabled, inputs start empty (unless auto-add is on in settings)
- **Auto-add behavior**: If enabled in settings with default %, checkbox auto-checked and prices pre-filled on new positions
- **Single checkbox**: One TP/SL checkbox shows section; user clears individual input to skip TP or SL
- **Quick buttons**: Separate row of % buttons for each field (TP has its own, SL has its own)
- **Input format**: Price input + % quick buttons (clicking % fills calculated price)
- **Validation**: On blur/submit only (not real-time)
- **Mobile**: Same layout, panel scrolls naturally
- **Keyboard**: Standard tab navigation only

### Orders Display
- **Trigger orders**: Shown in existing orders table with distinct 'TP' or 'SL' badge
- **Data source**: Use existing `useSubOpenOrders` hook, filter by order type
- **Cancel**: No special warning when canceling TP/SL orders

### Position Modal (Existing Positions)
- **Context display**: Show position summary (entry, size, mark, current P&L) at top of modal
- **Existing TP/SL**: Pre-fill modal with current values; saving cancels old + creates new orders

### Settings
- **Location**: Global settings dialog, below slippage setting
- **Configuration**: Separate TP% and SL% inputs (independent, not R:R ratio)
- **Auto-add toggle**: Checkbox to auto-enable TP/SL on new positions

## Tasks

1. [ ] Add TP/SL settings to global settings store
2. [ ] Create TpSlSection component for order entry panel
3. [ ] Enable TP/SL checkbox in order-entry-panel.tsx
4. [ ] Create TP/SL calculation utilities in lib/trade/tpsl.ts
5. [ ] Extend order submission to include TP/SL trigger orders
6. [ ] Add TP/SL modal for existing positions
7. [ ] Display trigger orders in open orders table with badges
8. [ ] Add TP/SL settings UI to global settings dialog

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

```typescript
// Trigger order structure (from @nktkas/hyperliquid SDK)
{
  a: number,           // Asset ID
  b: boolean,          // Position side (true=long, false=short)
  p: string,           // Limit price (execution price when triggered)
  s: string,           // Size in base currency
  r: boolean,          // Reduce only (true for TP/SL)
  t: {
    trigger: {
      isMarket: boolean,   // true = market order, false = limit
      triggerPx: string,   // Price that triggers the order (Mark Price)
      tpsl: "tp" | "sl"    // Take profit or stop loss
    }
  }
}

// Grouping options
grouping: "na" | "normalTpsl" | "positionTpsl"
// - "na": Standard order
// - "normalTpsl": Fixed size TP/SL
// - "positionTpsl": Adjusts with position size (REQUIRED for atomic batch)

// Example: Main order + TP + SL submission
await placeOrder({
  orders: [
    // Main order
    {
      a: assetIndex,
      b: isBuy,
      p: entryPrice,
      s: size,
      r: false,
      t: { limit: { tif: "Gtc" } }
    },
    // Take Profit order
    {
      a: assetIndex,
      b: !isBuy,         // Opposite side to close
      p: tpLimitPrice,
      s: size,
      r: true,           // Reduce only
      t: {
        trigger: {
          isMarket: true,
          triggerPx: tpTriggerPrice,
          tpsl: "tp"
        }
      }
    },
    // Stop Loss order
    {
      a: assetIndex,
      b: !isBuy,
      p: slLimitPrice,
      s: size,
      r: true,
      t: {
        trigger: {
          isMarket: true,
          triggerPx: slTriggerPrice,
          tpsl: "sl"
        }
      }
    }
  ],
  grouping: "positionTpsl"
});
```

### Hooks to Use

- `useExchangeOrder` - Existing hook, already supports trigger orders
- `useExchangeCancel` - For canceling TP/SL orders
- `useSubClearinghouseState` - Get current positions
- `useSubOpenOrders` - Get pending orders including triggers (filter for TP/SL display)

### State Management

```typescript
// Add to use-global-settings-store.ts
interface TpSlSettings {
  autoAddTpSl: boolean;        // Auto-check TP/SL on new positions
  defaultTpPercent: number;    // Default TP % (e.g., 25)
  defaultSlPercent: number;    // Default SL % (e.g., 10)
}

// Default values
const DEFAULT_TPSL_SETTINGS = {
  autoAddTpSl: false,
  defaultTpPercent: 10,
  defaultSlPercent: 5,
};
```

### Calculation Utilities (lib/trade/tpsl.ts)

```typescript
interface TpSlCalcParams {
  referencePrice: number;    // Limit price or mark price
  side: "buy" | "sell";      // Position side
  size: number;              // Position size
}

// Calculate TP price from percentage
function calculateTpPrice(params: TpSlCalcParams, tpPercent: number): number;

// Calculate SL price from percentage
function calculateSlPrice(params: TpSlCalcParams, slPercent: number): number;

// Calculate percentage from absolute price
function calculatePercentFromPrice(params: TpSlCalcParams, price: number, type: "tp" | "sl"): number;

// Calculate estimated P&L
function calculateEstimatedPnl(params: TpSlCalcParams, targetPrice: number): number;

// Validate TP price (must be profitable direction)
function validateTpPrice(params: TpSlCalcParams, tpPrice: number): boolean;

// Validate SL price (must be loss direction)
function validateSlPrice(params: TpSlCalcParams, slPrice: number): boolean;
```

## Files

### Modify

- `src/components/trade/order-entry/order-entry-panel.tsx` - Enable TP/SL checkbox, add TpSlSection
- `src/stores/use-global-settings-store.ts` - Add TP/SL default settings
- `src/components/trade/positions/orders-tab.tsx` - Add TP/SL badge display for trigger orders
- `src/components/trade/positions/positions-tab.tsx` - Wire up TP/SL button to modal
- Global settings dialog component - Add TP/SL settings section

### Create

- `src/components/trade/order-entry/tp-sl-section.tsx` - TP/SL inputs and quick buttons
- `src/components/trade/positions/position-tpsl-modal.tsx` - Modal for existing positions
- `src/lib/trade/tpsl.ts` - Calculation utilities

## UI/UX

### TpSlSection Component

```
┌─────────────────────────────────────────────────┐
│ Take Profit                                     │
│ ┌─────────────────────────────┐                 │
│ │ $105.50              (5.5%) │                 │
│ └─────────────────────────────┘                 │
│ [5%] [10%] [25%] [50%]                          │
│ Est. P&L: +$1,234                               │
│                                                 │
│ Stop Loss                                       │
│ ┌─────────────────────────────┐                 │
│ │ $95.00              (-5.0%) │                 │
│ └─────────────────────────────┘                 │
│ [5%] [10%] [25%] [50%]                          │
│ Est. P&L: -$500                                 │
└─────────────────────────────────────────────────┘
```

### Position TP/SL Modal

```
┌─────────────────────────────────────────────────┐
│ Set TP/SL for BTC Position                   X  │
├─────────────────────────────────────────────────┤
│ Position Summary                                │
│ Side: Long    Size: 0.5 BTC                     │
│ Entry: $100,000    Mark: $101,500               │
│ P&L: +$750 (1.5%)                               │
├─────────────────────────────────────────────────┤
│ Take Profit                                     │
│ ┌─────────────────────────────────────────┐     │
│ │ $110,000                        (10.0%) │     │
│ └─────────────────────────────────────────┘     │
│ [5%] [10%] [25%] [50%]                          │
│ Est. P&L: +$5,000                               │
│                                                 │
│ Stop Loss                                       │
│ ┌─────────────────────────────────────────┐     │
│ │ $95,000                         (-5.0%) │     │
│ └─────────────────────────────────────────┘     │
│ [5%] [10%] [25%] [50%]                          │
│ Est. P&L: -$2,500                               │
├─────────────────────────────────────────────────┤
│                              [Cancel] [Confirm] │
└─────────────────────────────────────────────────┘
```

### Orders Table Badge

```
┌──────┬────────┬─────────┬────────┬────────┐
│ □    │ Asset  │ Type    │ Price  │ Size   │
├──────┼────────┼─────────┼────────┼────────┤
│ □    │ BTC    │ TP      │ $110K  │ 0.5    │
│ □    │ BTC    │ SL      │ $95K   │ 0.5    │
│ □    │ ETH    │ limit   │ $3,500 │ 2.0    │
└──────┴────────┴─────────┴────────┴────────┘
```

### User Flow

1. User enables TP/SL checkbox in order entry
2. TP/SL section expands with price inputs (empty, or pre-filled if auto-add enabled)
3. User enters prices manually or clicks % buttons
4. Shows calculated % and estimated P&L for each
5. User submits order
6. Main order + TP + SL orders are submitted as atomic batch
7. Orders appear in open orders table with "TP" or "SL" badge

## Edge Cases

- TP trigger for long: must be > entry price
- SL trigger for long: must be < entry price
- TP trigger for short: must be < entry price
- SL trigger for short: must be > entry price
- User can set only TP, only SL, or both (clear input to skip)
- If position is closed manually, TP/SL orders remain (user must cancel)
- Adding to position: new TP/SL only for the additional size
- Editing existing TP/SL: cancels old orders, creates new ones

## Validation Rules

- TP/SL prices validated on blur and submit (not real-time)
- TP must be in profit direction relative to reference price
- SL must be in loss direction relative to reference price
- At least one of TP or SL must have a value if section is enabled
- Trigger price must be valid number > 0

## Research Notes

- Response status `waitingForTrigger` = successful trigger order
- `isMarket: true` recommended for TP/SL to ensure fills
- `r: true` (reduce only) required for TP/SL orders
- TP/SL are opposite side orders (sell to close long, buy to close short)
- Mark Price used as trigger reference (not Last Price)
- `grouping: "positionTpsl"` required for atomic batch behavior
