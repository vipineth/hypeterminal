# Feature: Advanced Order Types (Scale, Stop/Take, TWAP)

## Meta

| Field | Value |
|-------|-------|
| Priority | High |
| Status | Planned |
| Created | 2026-01-19 |
| Updated | 2026-01-19 |

## Summary

Add advanced order types for Hyperliquid: scale (ladder), stop market, stop limit, take profit market, take profit limit, and TWAP. These unlock conditional entries/exits, staged liquidity, and time-distributed execution.

## User Stories

- As a trader, I want stop and take-profit orders so I can automate risk management.
- As a trader, I want scale orders so I can build positions across a price range.
- As a trader, I want TWAP orders so I can execute large sizes with less slippage.
- As a trader, I want clear order status labels so I can track triggered and active orders.

## Requirements

### Must Have

- [ ] Order type selector supports: Market, Limit, Stop Market, Stop Limit, Take Profit Market, Take Profit Limit, TWAP, Scale
- [ ] Stop/Take forms include trigger price + execution price (limit-only) with side-aware validation
- [ ] Stop/Take orders map to trigger orders in `exchange.order`
- [ ] TWAP form uses `exchange.twapOrder` and surfaces active/history in UI
- [ ] Scale form generates multiple limit orders in a single `exchange.order` call
- [ ] Open orders table shows orderType labels from `frontendOpenOrders` / `openOrders`
- [ ] Cancel and modify flows handle trigger orders and scale ladders

### Nice to Have

- [ ] Scale distribution options (linear, geometric, custom weights)
- [ ] TWAP presets (5m, 15m, 30m, 1h) with randomize toggle
- [ ] Risk guardrails (warn on trigger too close to mark, or limit too aggressive)
- [ ] Order templates for common stop/take setups

## Tasks

1. [ ] Extend order entry store to include new order types and per-type config
2. [ ] Add UI for trigger orders (stop/take) with validation and previews
3. [ ] Add UI for TWAP (duration, randomize, reduce-only)
4. [ ] Add UI for scale orders (range, levels, size distribution)
5. [ ] Implement order builders for trigger/scale types
6. [ ] Wire `useExchangeTwapOrder` and TWAP status subscriptions
7. [ ] Update open orders display to show orderType + ladder grouping
8. [ ] Add tests for order builder output and validation rules

## Technical Spec

### Finding the Right API

1. **Discover methods by intent** -> `docs/hyperliquid-sdk-directory.md`
   - Scan "Want to..." tables to find method names
   - Note the type: (I)nfo, (E)xchange, or (S)ubscription

2. **Get full parameter schema** -> `docs/hyperliquid-sdk-1.md` or `docs/hyperliquid-sdk-2.md`
   - Info methods: sdk-1 lines 1036-1775
   - Exchange methods: sdk-1 lines 1776-2054 + sdk-2 lines 1-220
   - Subscriptions: sdk-2 lines 221-540

### Order Type Mapping (How to Enable)

| UI Order Type | Order Payload | Notes |
|--------------|---------------|-------|
| Market | `t: { limit: { tif: "FrontendMarket" } }` | Uses limit order schema with market TIF. |
| Limit | `t: { limit: { tif: "Gtc" \| "Ioc" \| "Alo" } }` | `Alo` is post-only. |
| Stop Market | `t: { trigger: { isMarket: true, triggerPx, tpsl: "sl" } }` | `p` required by schema; treat as ignored. |
| Stop Limit | `t: { trigger: { isMarket: false, triggerPx, tpsl: "sl" } }` | `p` = limit price. |
| Take Profit Market | `t: { trigger: { isMarket: true, triggerPx, tpsl: "tp" } }` | Use `reduceOnly` for exit. |
| Take Profit Limit | `t: { trigger: { isMarket: false, triggerPx, tpsl: "tp" } }` | `p` = limit price. |
| TWAP | `twapOrder({ a, b, s, r, m, t })` | `m` = minutes (5-1440), `t` = randomize. |
| Scale | `order({ orders: [...] })` | Client-side ladder of limit orders. |

### SDK/API Details

```typescript
// Stop Limit (short entry example)
await exchange.order({
  orders: [{
    a: assetId,
    b: false,
    p: "25000",        // Limit price
    s: "0.5",
    r: false,
    t: {
      trigger: {
        isMarket: false,
        triggerPx: "25200",
        tpsl: "sl",
      },
    },
  }],
  grouping: "na",
});

// Take Profit Market (reduce-only exit)
await exchange.order({
  orders: [{
    a: assetId,
    b: true,
    p: "0",            // Required by schema, ignored for market trigger
    s: "0.5",
    r: true,
    t: {
      trigger: {
        isMarket: true,
        triggerPx: "24000",
        tpsl: "tp",
      },
    },
  }],
  grouping: "na",
});

// TWAP (buy 1.0 over 30 minutes, randomized)
await exchange.twapOrder({
  a: assetId,
  b: true,
  s: "1",
  r: false,
  m: 30,
  t: true,
});
```

### Scale Order Builder

1. Inputs: startPrice, endPrice, levels, totalSize, distribution.
2. Generate a price ladder and split sizes across levels.
3. Submit multiple limit orders in one call:

```typescript
const orders = ladder.map(({ price, size }) => ({
  a: assetId,
  b: isBuy,
  p: price,
  s: size,
  r: reduceOnly,
  t: { limit: { tif: "Gtc" } },
}));

await exchange.order({ orders, grouping: "na" });
```

### Hooks to Use

- `useExchangeOrder` - Standard limit/market/trigger orders
- `useExchangeTwapOrder` - TWAP submission
- `useSubOpenOrders` - Open orders + orderType labels
- `useSubOrderUpdates` - Triggered and fill status changes
- `useSubUserTwapHistory` - TWAP status/history

### State Management

```typescript
type OrderType =
  | "market"
  | "limit"
  | "stopMarket"
  | "stopLimit"
  | "takeProfitMarket"
  | "takeProfitLimit"
  | "twap"
  | "scale";

type TriggerConfig = {
  triggerPx: string;
  limitPx?: string;
  tpsl: "tp" | "sl";
  isMarket: boolean;
};

type TwapConfig = {
  minutes: number;
  randomize: boolean;
};

type ScaleConfig = {
  startPrice: string;
  endPrice: string;
  levels: number;
  distribution: "linear" | "geometric";
};
```

## Files

### Modify

- `src/stores/use-order-entry-store.ts` - extend order types and config
- `src/components/trade/order-entry/order-entry-panel.tsx` - new order type UI + validation
- `src/lib/trade/orders.ts` - order builder utilities for trigger/scale
- `src/components/trade/orders/open-orders-table.tsx` - show orderType labels, ladder grouping

### Create

- `src/components/trade/order-entry/trigger-order-section.tsx` - stop/take inputs
- `src/components/trade/order-entry/scale-order-section.tsx` - ladder config UI
- `src/components/trade/order-entry/twap-order-section.tsx` - TWAP inputs
- `src/lib/trade/scale-order.ts` - ladder generation helpers

## UI/UX

### Components

- **OrderTypeSelect** - Dropdown with advanced types and descriptions
- **TriggerOrderSection** - Trigger + execution price inputs with side-aware hints
- **ScaleOrderSection** - Range sliders, level count, and ladder preview
- **TwapOrderSection** - Duration and randomize controls

### User Flow

1. User selects an advanced order type.
2. UI reveals the relevant configuration inputs.
3. System validates prices and size, then submits the right API call.

## Edge Cases

- Trigger price on the wrong side of mark price (reject before submit).
- Stop market orders may be rejected if liquidity is insufficient.
- Trigger order rejected for bad trigger price (`badTriggerPxRejected`).
- Scale ladder sizes below minimum notional.
- Open interest cap rejections for large ladders.
- Reduce-only orders that do not reduce position.

## Research Notes

- `frontendOpenOrders` / `openOrders` include `orderType` values: Market, Limit, Stop Market, Stop Limit, Take Profit Market, Take Profit Limit.
- Trigger orders are defined by `t: { trigger: { isMarket, triggerPx, tpsl } }` in `exchange.order`.
- TWAP orders use `exchange.twapOrder` with `m` (minutes) and `t` (randomize).
- Scale/ladder orders are not native; implement as multiple limit orders.

### Known vs Missing (API)

- **Known:** Market, Limit, Stop Market, Stop Limit, Take Profit Market, Take Profit Limit, TWAP.
- **Missing (client-side or not exposed):** Trailing stop, OCO, iceberg, VWAP, POV, FOK (explicit), bracket entry+TP+SL (beyond `positionTpsl` grouping).

## Open Questions

- [ ] Should stop/take orders be allowed for entry or reduce-only exits only?
- [ ] Should scale ladders be cancel-grouped via client cloid prefix?
- [ ] Do we want to allow TWAP for spot as well as perp?
