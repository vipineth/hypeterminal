# Order Validation Analysis

> Analysis of order creation, submission, and validation flows to identify root cause of "Trigger order has unexpected type" error.

## Error Context

### Failed Request Payload

```json
{
  "action": {
    "type": "order",
    "orders": [
      {
        "a": 0,
        "b": true,
        "p": "78948",
        "s": "0.01747",
        "r": false,
        "t": {
          "limit": {
            "tif": "FrontendMarket"
          }
        }
      },
      {
        "a": 0,
        "b": false,
        "p": "98438",
        "s": "0.01747",
        "r": true,
        "t": {
          "trigger": {
            "isMarket": true,
            "triggerPx": "98438",
            "tpsl": "tp"
          }
        }
      },
      {
        "a": 0,
        "b": false,
        "p": "70875",
        "s": "0.01747",
        "r": true,
        "t": {
          "trigger": {
            "isMarket": true,
            "triggerPx": "70875",
            "tpsl": "sl"
          }
        }
      }
    ],
    "grouping": "positionTpsl"
  }
}
```

### API Response

```json
{
  "status": "ok",
  "response": {
    "type": "order",
    "data": {
      "statuses": [
        {
          "error": "Trigger order has unexpected type."
        }
      ]
    }
  }
}
```

---

## Critical Issues Found

### Issue #1: Multi-Order Requests Only Check First Status (HIGH)

**Location:** `src/components/trade/order-entry/order-entry-panel.tsx:407`

```typescript
throwIfResponseError(result.response?.data?.statuses?.[0]);
```

**Problem:** Only checks `statuses[0]`, but orders can have multiple statuses (e.g., main order + TP + SL = 3 statuses). If the main order succeeds but TP/SL fails, errors are silently ignored.

**Fix exists:** `throwIfAnyResponseError()` at `src/domain/trade/orders.ts:245`

```typescript
// Should be:
throwIfAnyResponseError(result.response?.data?.statuses);
```

---

### Issue #2: Spot Markets Can Inherit Trigger Order Types (HIGH)

**Problem:** `orderType` is persisted in localStorage. When switching from perps to spot with a trigger order selected (e.g., `stopMarket`), the order type persists but:
1. The dropdown only FILTERS options (doesn't reset)
2. Spot validation doesn't check trigger fields
3. Order can be submitted as a trigger order to spot API

**Flow:**
1. User on perps selects `stopMarket`
2. User switches to spot market
3. `orderType` stays `stopMarket` (persisted)
4. Dropdown hides trigger options but doesn't reset
5. Submit sends trigger order to spot → API error

**Locations:**
- Persisted orderType: `src/stores/use-order-entry-store.ts:83`
- Filtering only (no reset): `src/components/trade/order-entry/advanced-order-dropdown.tsx:65`
- Order type drives trigger logic: `src/components/trade/order-entry/order-entry-panel.tsx:160`
- Spot validation ignores trigger fields: `src/lib/errors/stacks/spot-order.ts` (no trigger validators)

**Fix:** Reset `orderType` to `"market"` or `"limit"` when switching to spot if current type is a trigger order.

---

### Issue #3: Wrong Grouping Type for New Orders with TP/SL (HIGH)

**Location:** `src/domain/trade/orders.ts:115`

```typescript
return { orders, grouping: hasTp || hasSl ? "positionTpsl" : "na" };
```

**Problem:** The code uses `positionTpsl` for ALL orders with TP/SL attached, but this is semantically incorrect for **new entry orders**.

**SDK Documentation Reference** (`docs/hyperliquid-sdk-directory.md:109`):

> **Grouping:**
> - `"na"`: Standard order without grouping
> - `"normalTpsl"`: TP/SL order with fixed size that doesn't adjust with position changes
> - `"positionTpsl"`: TP/SL order that adjusts proportionally with the position size

**API Schema Reference** (`docs/hyperliquid-sdk-1.md:1984` - OpenAPI spec):

```json
"grouping": {
  "enum": ["na", "normalTpsl", "positionTpsl"],
  "description": "Order grouping strategy:
    - `na`: Standard order without grouping.
    - `normalTpsl`: TP/SL order with fixed size that doesn't adjust with position changes.
    - `positionTpsl`: TP/SL order that adjusts proportionally with the position size."
}
```

**Trigger Order Schema** (from same file):

```json
"trigger": {
  "type": "object",
  "properties": {
    "isMarket": { "type": "boolean", "description": "Is market order?" },
    "triggerPx": { "type": "string", "description": "Trigger price." },
    "tpsl": { "enum": ["tp", "sl"], "description": "Indicates whether it is take profit or stop loss." }
  },
  "required": ["isMarket", "triggerPx", "tpsl"]
}
```

**The Difference:**

| Grouping | Use Case | TP/SL Behavior | Visibility |
|----------|----------|----------------|------------|
| `na` | Standalone orders | No TP/SL linking | N/A |
| `normalTpsl` | **New entry orders with TP/SL** | Fixed size (stays at entry size) | Separate trigger orders in orders list |
| `positionTpsl` | Adding TP/SL to existing positions (edit modal) | Scales with position changes | Attached to position row |

**Verified on official Hyperliquid app:** New entry orders with TP/SL use `normalTpsl`, position edit modal uses `positionTpsl`.

**Current Behavior:**
- `position-tpsl-modal.tsx:115` correctly uses `positionTpsl` because it's adding TP/SL to an EXISTING position
- `buildOrders()` incorrectly uses the same grouping for NEW orders

**Hypothesis:**
When using `positionTpsl` with a `FrontendMarket` order (which fills immediately), the API may:
1. Process the main order → creates position
2. Try to attach TP/SL to position BUT the order type (`limit` with `FrontendMarket`) is unexpected in this context
3. Return "Trigger order has unexpected type" because it expected pure trigger orders

---

### Issue #2: Missing `normalTpsl` in Type Definition

**Location:** `src/lib/trade/types.ts:51`

```typescript
export type OrderGrouping = "na" | "positionTpsl";
```

**Problem:** `normalTpsl` is completely missing from the codebase's type definition, even though the SDK supports it.

**SDK Type Definition** (from `node_modules/@nktkas/hyperliquid`):

```typescript
grouping: "na" | "normalTpsl" | "positionTpsl"
```

---

### Issue #3: Documentation Example Uses `Gtc`, Not `FrontendMarket`

**SDK Example** (`docs/hyperliquid-sdk-directory.md:318-326`):

```typescript
// Order with TP/SL
await exchangeClient.order({
  orders: [
    {a: 0, b: true, p: "95000", s: "0.01", r: false, t: {limit: {tif: "Gtc"}}},  // <- Gtc, not FrontendMarket
    {a: 0, b: false, p: "100000", s: "0.01", r: true, t: {trigger: {isMarket: true, triggerPx: "100000", tpsl: "tp"}}},
    {a: 0, b: false, p: "90000", s: "0.01", r: true, t: {trigger: {isMarket: true, triggerPx: "90000", tpsl: "sl"}}}
  ],
  grouping: "positionTpsl"
});
```

**Key Observation:** The official example uses `Gtc` (resting limit order), NOT `FrontendMarket` (market order). This suggests `positionTpsl` may not be compatible with immediately-filling orders.

**Hypothesis:** `FrontendMarket` + `positionTpsl` might be an invalid combination because:
1. `FrontendMarket` fills immediately (like IOC)
2. The position doesn't exist when TP/SL triggers are being validated in the batch
3. API rejects the trigger orders as having "unexpected type" for this grouping context

---

### Issue #4: Trigger Orders Can Be Sent with reduceOnly: false (MEDIUM)

**Problem:** Trigger orders (stop/take-profit) should always be reduce-only, but users can uncheck the reduce-only checkbox after selecting a trigger order type.

**Flow:**
1. User selects `stopMarket` → `reduceOnly` is auto-set to `true` (line 107)
2. User unchecks reduce-only checkbox → allowed (line 127)
3. Submit sends trigger order with `r: false`
4. Hyperliquid may reject or behave unexpectedly

**Locations:**
- Force on type change only: `src/stores/use-order-entry-store.ts:103-109`
- UI allows toggling regardless of type: `src/components/trade/order-entry/order-entry-panel.tsx:769-788`

**Fix:** Either:
1. Disable reduce-only checkbox for trigger orders
2. Or force `reduceOnly: true` in `buildTriggerOrder()`

---

### Issue #5: TIF Can Persist as "Ioc" When Switching to Scale (MEDIUM)

**Problem:** Time-in-force (`tif`) persists when changing order types. Scale orders only support `Gtc` and `Alo`, but if user was on limit with `Ioc`, switching to scale keeps `Ioc`.

**Flow:**
1. User on limit order sets `tif: "Ioc"`
2. User switches to scale order
3. UI shows only Gtc/Alo options but stored `tif` stays `"Ioc"`
4. `buildScaleOrders` uses stored `tif` directly
5. API may reject scale orders with `Ioc`

**Locations:**
- Available options filtered: `src/components/trade/order-entry/order-entry-panel.tsx:184`
- `buildScaleOrders` uses tif directly: `src/domain/trade/orders.ts:145`

**Fix:** Reset `tif` to `"Gtc"` when switching to scale order if current `tif` is not in allowed options.

---

### Issue #6: Type Definitions Narrower Than API (LOW)

**Location:** `src/lib/trade/types.ts`

**Problem:** Local types are narrower than Hyperliquid's actual API, causing type drift:

```typescript
// Line 39-41: Missing Ioc, Alo
export interface OrderTimeInForce {
  limit: { tif: "FrontendMarket" | "Gtc" };  // Missing: "Ioc" | "Alo" | "LiquidationMarket"
}

// Line 51: Missing normalTpsl
export type OrderGrouping = "na" | "positionTpsl";  // Missing: "normalTpsl"
```

**API supports:**
- TIF: `"Gtc" | "Ioc" | "Alo" | "FrontendMarket" | "LiquidationMarket"`
- Grouping: `"na" | "normalTpsl" | "positionTpsl"`

**Fix:** Update types to match SDK types from `@nktkas/hyperliquid`

---

## Code Flow Analysis

### Order Submission Flow

```
OrderEntryPanel.handleSubmit()
    ↓
buildOrders({
    orderType: "market",
    tpSlEnabled: true,
    canUseTpSl: true,
    tpPriceNum: 98438,
    slPriceNum: 70875,
    ...
})
    ↓
buildStandardOrder()
    → { t: { limit: { tif: "FrontendMarket" } } }
    ↓
buildTpSlOrder() for TP
    → { t: { trigger: { isMarket: true, tpsl: "tp", triggerPx: "98438" } } }
    ↓
buildTpSlOrder() for SL
    → { t: { trigger: { isMarket: true, tpsl: "sl", triggerPx: "70875" } } }
    ↓
return {
    orders: [main, tp, sl],
    grouping: "positionTpsl"  // ← WRONG: should be "normalTpsl"
}
    ↓
placeOrder({ orders, grouping })
    ↓
API returns: "Trigger order has unexpected type."
```

### Correct Flow (Position TP/SL Modal)

```
PositionTpSlModal.handleSubmit()
    ↓
// Only trigger orders, no entry order
orders = [
    { t: { trigger: { isMarket: true, tpsl: "tp", ... } } },
    { t: { trigger: { isMarket: true, tpsl: "sl", ... } } }
]
    ↓
placeOrder({ orders, grouping: "positionTpsl" })  // ← CORRECT for existing positions
    ↓
API returns: Success
```

---

## Files Involved

| File | Line | Function | Issue |
|------|------|----------|-------|
| `src/components/trade/order-entry/order-entry-panel.tsx` | 407 | `handleSubmit()` | Only checks first status |
| `src/stores/use-order-entry-store.ts` | 83 | persisted state | `orderType` persists across market switches |
| `src/components/trade/order-entry/advanced-order-dropdown.tsx` | 65 | filtering | Only filters, doesn't reset orderType |
| `src/lib/errors/stacks/spot-order.ts` | - | validators | No trigger order validators |
| `src/domain/trade/orders.ts` | 115 | `buildOrders()` | Uses `positionTpsl` instead of `normalTpsl` |
| `src/stores/use-order-entry-store.ts` | 103-109 | `setOrderType()` | Only forces reduceOnly on type change |
| `src/components/trade/order-entry/order-entry-panel.tsx` | 184 | TIF options | Filters display but not stored value |
| `src/domain/trade/orders.ts` | 145 | `buildScaleOrders()` | Uses stored TIF without validation |
| `src/lib/trade/types.ts` | 39, 51 | types | Narrower than API types |
| `src/components/trade/positions/position-tpsl-modal.tsx` | 88-112 | `handleSubmit()` | Was sending size instead of "0" |

---

## Recommended Fixes

### Fix #1: Check All Order Statuses (HIGH)

**File:** `src/components/trade/order-entry/order-entry-panel.tsx:407`

```typescript
// Before
throwIfResponseError(result.response?.data?.statuses?.[0]);

// After
throwIfAnyResponseError(result.response?.data?.statuses);
```

### Fix #2: Reset Order Type When Switching to Spot (HIGH)

**File:** `src/components/trade/order-entry/order-entry-panel.tsx` or a new effect

```typescript
// Add effect to reset orderType when switching to spot with trigger type
useEffect(() => {
  if (isSpotMarket && isTriggerOrderType(orderType)) {
    setOrderType("market");
  }
}, [isSpotMarket, orderType]);
```

Or in `advanced-order-dropdown.tsx`, reset when filtering removes current selection.

### Fix #3: Use `normalTpsl` for New Orders with TP/SL (HIGH)

**File:** `src/domain/trade/orders.ts:115`

```typescript
// Before
return { orders, grouping: hasTp || hasSl ? "positionTpsl" : "na" };

// After
return { orders, grouping: hasTp || hasSl ? "normalTpsl" : "na" };
```

### Fix #4: Force reduceOnly for Trigger Orders (MEDIUM)

**Option A:** Disable checkbox in UI for trigger orders

**File:** `src/components/trade/order-entry/order-entry-panel.tsx:776`

```typescript
<Checkbox
  disabled={isFormDisabled || isTriggerOrderType(orderType)}
  checked={isTriggerOrderType(orderType) ? true : reduceOnly}
  // ...
/>
```

**Option B:** Force in build function

**File:** `src/domain/trade/orders.ts:169`

```typescript
r: true,  // Always reduce-only for trigger orders
```

### Fix #5: Reset TIF When Switching to Scale (MEDIUM)

**File:** `src/stores/use-order-entry-store.ts:103`

```typescript
setOrderType: (orderType) => {
  const isTrigger = isTriggerOrderType(orderType);
  const isScale = orderType === "scale";
  set((state) => ({
    orderType,
    reduceOnly: isTrigger ? true : state.reduceOnly,
    tpSlEnabled: isTrigger ? false : state.tpSlEnabled,
    tif: isScale && state.tif === "Ioc" ? "Gtc" : state.tif,  // Reset invalid TIF
  }));
},
```

### Fix #6: Update Type Definitions (LOW)

**File:** `src/lib/trade/types.ts`

```typescript
// Update OrderTimeInForce to match API
export interface OrderTimeInForce {
  limit: { tif: "Gtc" | "Ioc" | "Alo" | "FrontendMarket" | "LiquidationMarket" };
}

// Update OrderGrouping to match API
export type OrderGrouping = "na" | "normalTpsl" | "positionTpsl";
```

---

## Alternative Fix: Use `Gtc` Instead of `FrontendMarket` with TP/SL

If `normalTpsl` doesn't resolve the issue, the problem might be `FrontendMarket` + any TP/SL grouping.

**File:** `src/domain/trade/orders.ts:209`

```typescript
// Current: Always uses FrontendMarket for market orders
t: params.orderType === "market"
    ? { limit: { tif: "FrontendMarket" as const } }
    : { limit: { tif: params.tif } },

// Alternative: Use Gtc when TP/SL is attached to allow proper grouping
t: params.orderType === "market" && !hasTpSl
    ? { limit: { tif: "FrontendMarket" as const } }
    : params.orderType === "market" && hasTpSl
        ? { limit: { tif: "Ioc" as const } }  // or "Gtc" with aggressive price
        : { limit: { tif: params.tif } },
```

---

### Issue #7: Position Row Shows All TP/SL Orders Instead of Position-Attached Only (FIXED)

**Location:** `src/components/trade/positions/positions-tab.tsx:257-279`

**Problem:** The position row was displaying ALL TP/SL trigger orders for a coin, regardless of whether they were:
- `normalTpsl` orders (from entry, `isPositionTpsl: false`) - should only show in orders list
- `positionTpsl` orders (position-attached, `isPositionTpsl: true`) - should show on position row

**Old Code:**
```typescript
const tpSlOrdersByCoin = useMemo(() => {
  const map = new Map<string, TpSlOrderInfo>();
  for (const order of openOrders) {
    const orderType = (order as { orderType?: string }).orderType;
    const isTp = orderType === "Take Profit Market" || orderType === "Take Profit Limit";
    const isSl = orderType === "Stop Market" || orderType === "Stop Limit";
    if (!isTp && !isSl) continue;
    // ❌ NOT checking isPositionTpsl
    ...
  }
  return map;
}, [openOrders]);
```

**Fix:** Created helper function in `src/lib/trade/open-orders.ts`:
```typescript
export function getPositionTpSlByCoin(orders: OpenOrder[]): Map<string, PositionTpSlInfo> {
  const map = new Map<string, PositionTpSlInfo>();
  for (const order of orders) {
    if (!order.isTrigger || !order.isPositionTpsl) continue;  // ✅ Only position-attached
    ...
  }
  return map;
}
```

**Also Fixed:** Uses `order.isTrigger` boolean and existing `isTakeProfitOrder()`/`isStopOrder()` helpers instead of string comparison on `orderType`.

---

### Issue #8: Position TP/SL Sent With Size Instead of Zero (HIGH - FIXED)

**Location:** `src/components/trade/positions/position-tpsl-modal.tsx:88-112`

**Problem:** Position TP/SL modal was sending the actual position size instead of `"0"`. This caused:
- Orders created with `isPositionTpsl: false` instead of `true`
- TP/SL not appearing on position row
- TP/SL not scaling with position size changes

**Discovery:** Comparing official Hyperliquid app payload vs ours:

| Field | Official | Ours (was wrong) |
|-------|----------|------------------|
| `s` | `"0"` | `"0.01728"` |
| `grouping` | `"positionTpsl"` | `"positionTpsl"` |

When `s: "0"` + `positionTpsl` → API sets `isPositionTpsl: true` (position-attached)
When `s: "0.01728"` + `positionTpsl` → API sets `isPositionTpsl: false` (fixed-size)

**Old Code:**
```typescript
const formattedSize = formatSizeForOrder(position.size, position.szDecimals);
orders.push({
  ...
  s: formattedSize,  // ❌ Was sending actual size
  ...
});
```

**Fix:**
```typescript
orders.push({
  ...
  s: "0",  // ✅ Zero = position-attached, scales with position
  ...
});
```

---

## Verification Checklist

- [ ] Test new order with TP only + `normalTpsl` grouping
- [ ] Test new order with SL only + `normalTpsl` grouping
- [ ] Test new order with TP + SL + `normalTpsl` grouping
- [ ] Test market order with TP/SL + `normalTpsl` grouping
- [ ] Test limit order with TP/SL + `normalTpsl` grouping
- [ ] Test existing position TP/SL modal still works with `positionTpsl`
- [ ] Verify all order statuses are checked in response
- [ ] Verify position TP/SL modal creates orders with `isPositionTpsl: true`
- [ ] Verify position row shows TP/SL from position modal
- [ ] Verify entry order TP/SL (`normalTpsl`) also shows on position row

---

## SDK Reference Summary

### Order Types

```typescript
// Limit order
{ limit: { tif: "Gtc" | "Ioc" | "Alo" | "FrontendMarket" | "LiquidationMarket" } }

// Trigger order (TP/SL)
{ trigger: { isMarket: boolean, triggerPx: string, tpsl: "tp" | "sl" } }
```

### Trigger Order Mapping

| Order Type | isMarket | tpsl | triggerPx |
|------------|----------|------|-----------|
| Stop Market | `true` | `"sl"` | stop price |
| Stop Limit | `false` | `"sl"` | stop price (p = limit) |
| Take Profit Market | `true` | `"tp"` | take price |
| Take Profit Limit | `false` | `"tp"` | take price (p = limit) |

### Grouping Types

| Grouping | Description | Use Case |
|----------|-------------|----------|
| `na` | No grouping | Standalone orders |
| `normalTpsl` | Fixed TP/SL size | New orders with attached TP/SL |
| `positionTpsl` | Scaling TP/SL size | TP/SL on existing positions (via edit modal) |

### Grouping Behavior Details

#### Official Hyperliquid App Behavior

| Action | Grouping Used | TP/SL Visibility |
|--------|---------------|------------------|
| New entry order + TP/SL | `normalTpsl` | Visible as separate trigger orders in orders list |
| Edit TP/SL on existing position | `positionTpsl` | Visible on position row, attached to position |

#### Critical: Size Field for Position-Attached TP/SL (FIXED)

**Discovery:** The `isPositionTpsl` flag on orders is determined by the `s` (size) field, NOT just the grouping:

| Size (`s`) | Grouping | Result | `isPositionTpsl` |
|------------|----------|--------|------------------|
| `"0"` | `positionTpsl` | Position-attached, scales with position | `true` |
| `"0.01728"` | `positionTpsl` | Fixed-size, doesn't scale | `false` |

**Official Hyperliquid payload (position edit modal):**
```json
{
  "s": "0",  // ← Size is ZERO
  "t": { "trigger": { "isMarket": true, "tpsl": "tp", "triggerPx": "81000" } }
}
```

**Our incorrect payload was:**
```json
{
  "s": "0.01728",  // ← Size was specified
  "t": { "trigger": { "isMarket": true, "tpsl": "tp", "triggerPx": "90000" } }
}
```

**Fix:** In `position-tpsl-modal.tsx`, changed from `s: formattedSize` to `s: "0"` for position-attached TP/SL orders.

The `isPositionTpsl` flag on trigger orders indicates whether they are position-attached.

#### Position Size Change Behavior

**Scenario: Open 1 BTC long with TP/SL, then ADD 0.5 BTC (now 1.5 BTC total)**

| Grouping | TP/SL Size After Add | Result |
|----------|---------------------|--------|
| `normalTpsl` | Still 1 BTC | 0.5 BTC is **uncovered** by TP/SL |
| `positionTpsl` | Auto-adjusts to 1.5 BTC | Entire position covered |

**Scenario: Open 1 BTC long with TP/SL, then PARTIAL close 0.5 BTC (now 0.5 BTC left)**

| Grouping | TP/SL Size After Partial Close | Result |
|----------|-------------------------------|--------|
| `normalTpsl` | Still 1 BTC | Would try to close **more than position size** |
| `positionTpsl` | Auto-adjusts to 0.5 BTC | Matches remaining position |

**Scenario: Fully close position**

| Grouping | Result |
|----------|--------|
| `normalTpsl` | TP/SL cancels (nothing left to close) |
| `positionTpsl` | TP/SL cancels (nothing left to close) |

#### Key Insight

Both grouping types cancel when the position fully closes. The critical difference is **scaling behavior**:
- `normalTpsl` = Fixed size, set-and-forget, can become mismatched with position
- `positionTpsl` = Dynamic size, always matches current position size

---

## Conclusion

The primary issue is using `positionTpsl` grouping for new entry orders with attached TP/SL. The correct grouping should be `normalTpsl` because:

1. `normalTpsl` = Fixed TP/SL size (appropriate for new entries where size is known)
2. `positionTpsl` = Scaling TP/SL (appropriate for existing positions where size may change)

**Verified against official Hyperliquid app:**
- New entry orders with TP/SL use `normalTpsl` → Creates separate trigger orders visible in orders list
- Position edit modal uses `positionTpsl` → Attaches TP/SL to position, visible on position row

Both grouping types auto-cancel when position fully closes. The difference is behavior when position size **changes**:
- `normalTpsl`: TP/SL stays fixed at original size (can become mismatched)
- `positionTpsl`: TP/SL auto-adjusts to match current position size

The error "Trigger order has unexpected type" likely occurs because the Hyperliquid API expects a different order structure when using `positionTpsl` with a `FrontendMarket` entry order. The `positionTpsl` grouping is designed for the position edit modal flow, not for new entry orders.

**Priority of fixes:**

| Priority | Issue | Fix |
|----------|-------|-----|
| **HIGH** | Multi-order status checking | Use `throwIfAnyResponseError()` |
| **HIGH** | Spot inherits trigger order types | Reset orderType when switching to spot |
| **HIGH** | Wrong grouping for new orders | Change `positionTpsl` → `normalTpsl` |
| **HIGH** | Position TP/SL sent with size | Send `s: "0"` for position-attached |
| **MEDIUM** | Trigger orders with reduceOnly: false | Disable checkbox or force in build |
| **MEDIUM** | TIF persists incorrectly for scale | Reset TIF on order type change |
| **LOW** | Type drift | Update types to match SDK |

**Root cause of "Trigger order has unexpected type" error:**
Most likely a combination of:
1. Wrong grouping (`positionTpsl` instead of `normalTpsl`)
2. Spot market with persisted trigger order type
3. Silent failures from only checking first status

---

## Verification Sources

### Primary SDK Documentation

| Source | Location | Content |
|--------|----------|---------|
| OpenAPI Schema | `docs/hyperliquid-sdk-1.md:1984` | Full order API spec with grouping enum |
| Directory | `docs/hyperliquid-sdk-directory.md:109` | Grouping descriptions |
| Directory | `docs/hyperliquid-sdk-directory.md:318-326` | TP/SL example with `positionTpsl` |
| SDK Types | `node_modules/@nktkas/hyperliquid/.../order.d.ts` | TypeScript type definitions |

### Key Findings from SDK Docs

1. **`hyperliquid-sdk-1.md:1984`** - The OpenAPI schema explicitly defines:
   - `normalTpsl`: "TP/SL order with fixed size that doesn't adjust with position changes"
   - `positionTpsl`: "TP/SL order that adjusts proportionally with the position size"

2. **`hyperliquid-sdk-1.md` & `hyperliquid-sdk-2.md`** - All basic examples use `grouping: "na"`:
   - Line 93: `grouping: "na"` (basic order)
   - Line 294: `grouping: "na"` (limit order)
   - Line 649: `grouping: "na"` (reduce-only close)
   - No examples of `normalTpsl` in these files

3. **`hyperliquid-sdk-directory.md:318-326`** - The only TP/SL example uses:
   - Entry order: `t: {limit: {tif: "Gtc"}}` (NOT `FrontendMarket`)
   - Grouping: `positionTpsl`
   - This example may be for adding TP/SL to an order that will create a position

### Documentation Gap (Resolved via App Analysis)

The SDK docs lack explicit examples showing:
- `normalTpsl` usage pattern
- New market order (`FrontendMarket`) with TP/SL
- Difference between `normalTpsl` vs `positionTpsl` in practice

**Resolution:** Verified behavior by analyzing the official Hyperliquid app:
- New entry orders with TP/SL → `normalTpsl` (fixed-size trigger orders)
- Position edit modal → `positionTpsl` (position-attached, scaling TP/SL)
- Both auto-cancel on full position close
- Key difference: `positionTpsl` scales when position size changes, `normalTpsl` stays fixed
