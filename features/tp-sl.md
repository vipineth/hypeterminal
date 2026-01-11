# Feature: TP/SL Orders (Take Profit / Stop Loss)

## Meta

| Field | Value |
|-------|-------|
| Priority | High |
| Status | Planned |
| Created | 2026-01-10 |
| Updated | 2026-01-10 |

## Summary

Enable Take Profit and Stop Loss orders for both new and existing positions with configurable defaults and quick percentage suggestions.

## User Stories

- As a trader, I want to set TP/SL when placing an order so that I can manage risk automatically
- As a trader, I want to add TP/SL to existing positions so that I can protect open trades
- As a trader, I want default TP/SL percentages so that I don't have to configure every trade
- As a trader, I want quick percentage buttons so that I can set common levels with one click

## Requirements

### Must Have

- [ ] Set TP/SL when placing new orders via order entry panel
- [ ] Add TP/SL to existing positions via positions table
- [ ] Price input for trigger price
- [ ] Quick percentage buttons (5%, 10%, 25%, 50%)
- [ ] Display pending TP/SL orders in orders table
- [ ] Cancel TP/SL orders

### Nice to Have

- [ ] Global default TP/SL percentages in settings
- [ ] Auto-add TP/SL to all new positions toggle
- [ ] Edit existing TP/SL orders
- [ ] Visual link between position and its TP/SL orders

## Tasks

1. [ ] Add TP/SL settings to trade settings store
2. [ ] Create TpSlSection component for order entry panel
3. [ ] Enable TP/SL checkbox in order-entry-panel.tsx
4. [ ] Create TP/SL calculation utilities in lib/trade/tpsl.ts
5. [ ] Extend order submission to include TP/SL trigger orders
6. [ ] Add TP/SL modal for existing positions
7. [ ] Display trigger orders in open orders table
8. [ ] Add cancel functionality for trigger orders

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
      triggerPx: string,   // Price that triggers the order
      tpsl: "tp" | "sl"    // Take profit or stop loss
    }
  }
}

// Grouping options
grouping: "na" | "normalTpsl" | "positionTpsl"
// - "na": Standard order
// - "normalTpsl": Fixed size TP/SL
// - "positionTpsl": Adjusts with position size (recommended)

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
- `useInfoFrontendOpenOrders` - Get pending orders including triggers

### State Management

```typescript
// Add to use-trade-settings-store.ts
interface TpSlDefaults {
  enabled: boolean;           // Auto-add to new positions
  tpPercent: number | null;   // Default TP % (e.g., 25)
  slPercent: number | null;   // Default SL % (e.g., 10)
  usePositionTpsl: boolean;   // Use positionTpsl grouping
}
```

## Files

### Modify

- `src/components/trade/order-entry/order-entry-panel.tsx` - Enable TP/SL checkbox, add TpSlSection
- `src/stores/use-trade-settings-store.ts` - Add TP/SL default settings

### Create

- `src/components/trade/order-entry/tp-sl-section.tsx` - TP/SL inputs and quick buttons
- `src/components/trade/positions/position-tpsl-modal.tsx` - Modal for existing positions
- `src/lib/trade/tpsl.ts` - Calculation utilities

## UI/UX

### Components

- **TpSlSection** - Collapsible section with TP price input, SL price input, and percentage buttons
- **TpSlQuickButtons** - Row of percentage buttons (5%, 10%, 25%, 50%)
- **PositionTpSlModal** - Modal triggered from position row to add TP/SL

### User Flow

1. User enables TP/SL checkbox in order entry
2. TP/SL section expands with price inputs
3. User enters prices manually or clicks % buttons
4. User submits order
5. Main order + TP + SL orders are submitted together
6. Orders appear in open orders table with "Trigger" indicator

## Edge Cases

- TP trigger for long: must be > entry price
- SL trigger for long: must be < entry price
- TP trigger for short: must be < entry price
- SL trigger for short: must be > entry price
- User can set only TP, only SL, or both
- If position is closed manually, TP/SL orders remain (user must cancel)
- Partial fills: use `positionTpsl` grouping to adjust size

## Research Notes

- Response status `waitingForTrigger` = successful trigger order
- `isMarket: true` recommended for TP/SL to ensure fills
- `r: true` (reduce only) required for TP/SL orders
- TP/SL are opposite side orders (sell to close long, buy to close short)

## Open Questions

- [ ] Should TP/SL auto-cancel when position is fully closed?
- [ ] Show estimated P&L in TP/SL section?
- [ ] Support trailing stop loss in future iteration?
