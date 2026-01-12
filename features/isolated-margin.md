# Feature: Isolated Margin Mode

## Meta

| Field | Value |
|-------|-------|
| Priority | Medium |
| Status | Planned |
| Created | 2026-01-12 |
| Updated | 2026-01-12 |
| Depends On | leverage-management.md |

## Summary

Enable isolated margin mode for perp positions, allowing users to allocate specific margin amounts per position rather than sharing margin across all positions (cross margin). Isolated margin limits potential losses to the allocated margin for each position, providing better risk management.

## Background: Cross vs Isolated Margin

| Aspect | Cross Margin | Isolated Margin |
|--------|--------------|-----------------|
| **Margin pool** | Shared across all positions | Dedicated per position |
| **Liquidation** | Account-wide (all positions at risk) | Per-position (only that position liquidates) |
| **Risk** | Higher (losses can cascade) | Contained (max loss = allocated margin) |
| **Capital efficiency** | Higher (margin can offset) | Lower (margin locked per position) |
| **Management** | Simpler | Requires margin adjustment per position |

## User Stories

- As a trader, I want to use isolated margin so that my maximum loss is limited to the margin I allocate to each position
- As a trader, I want to add margin to an isolated position so that I can reduce my liquidation risk without closing the position
- As a trader, I want to remove excess margin from an isolated position so that I can free up capital for other trades
- As a trader, I want to see my liquidation price per position so that I can manage risk appropriately
- As a trader, I want to switch between cross and isolated margin modes so that I can choose the risk profile that suits my strategy

## Requirements

### Must Have

- [ ] Toggle between cross and isolated margin mode when setting leverage
- [ ] Display margin mode indicator on position rows (Cross/Isolated badge)
- [ ] Show isolated margin amount (`rawUsd`) for isolated positions
- [ ] Add/remove margin controls for isolated positions
- [ ] Display per-position liquidation price for isolated positions
- [ ] Update `availableToTrade` calculation awareness (backend handles, UI displays)
- [ ] Prevent mode switch when position exists (Hyperliquid restriction)
- [ ] Handle different leverage config structure: `{ type: "isolated", value: number, rawUsd: string }`

### Nice to Have

- [ ] Quick margin adjustment presets (+25%, +50%, -25%, -50%)
- [ ] Liquidation price warning threshold indicator
- [ ] Margin ratio visualization per position
- [ ] Bulk margin adjustment for multiple isolated positions

## Key Implementation Differences

### Data Structure Changes

```typescript
// Cross margin (current)
interface CrossLeverageConfig {
  type: "cross";
  value: number;
}

// Isolated margin (new)
interface IsolatedLeverageConfig {
  type: "isolated";
  value: number;
  rawUsd: string;  // Margin allocated to this position
}

type LeverageConfig = CrossLeverageConfig | IsolatedLeverageConfig;
```

### Position Data Changes

```typescript
// Position in clearinghouseState.assetPositions[i].position
interface Position {
  coin: string;
  szi: string;                    // Size (signed, negative = short)
  leverage: LeverageConfig;       // Now can be cross OR isolated
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  liquidationPx: string | null;   // More relevant for isolated
  marginUsed: string;
  // ... other fields
}
```

### API Changes

| Action | Cross Margin | Isolated Margin |
|--------|--------------|-----------------|
| Set leverage | `updateLeverage({ isCross: true })` | `updateLeverage({ isCross: false })` |
| Adjust margin | N/A | `updateIsolatedMargin({ asset, isBuy, ntli })` |
| Available funds | `crossMarginSummary.accountValue` | Per-position `rawUsd` |

## Tasks

1. [ ] Update `LeverageConfig` type to union of cross/isolated
2. [ ] Add margin mode toggle (Cross/Isolated) to leverage popover
3. [ ] Update `useAssetLeverage` hook to handle both modes
4. [ ] Create `useExchangeUpdateIsolatedMargin` hook
5. [ ] Add isolated margin indicator to position row
6. [ ] Create `IsolatedMarginAdjuster` component for +/- margin
7. [ ] Update position row to show `rawUsd` for isolated positions
8. [ ] Add liquidation price display per position
9. [ ] Handle mode switch restrictions (no position exists)
10. [ ] Update `availableToTrade` display logic
11. [ ] Add margin adjustment modal/popover
12. [ ] Test edge cases (liquidation, insufficient margin, etc.)

## Technical Spec

### Finding the Right API

1. **Discover methods by intent** → `docs/hyperliquid-sdk-directory.md`
   - `updateLeverage` - Set leverage and margin mode
   - `updateIsolatedMargin` - Add/remove isolated margin

2. **Get full parameter schema** → `docs/hyperliquid-sdk-1.md` or `docs/hyperliquid-sdk-2.md`
   - Exchange methods: sdk-2 lines 106-131

### SDK/API Details

#### updateLeverage (Mode Selection)

```typescript
// Parameters
interface UpdateLeverageParameters {
  asset: number;      // Asset ID (from market.assetIndex)
  isCross: boolean;   // true = cross, false = isolated
  leverage: number;   // Leverage value (1 to maxLeverage)
}

// Example: Switch to isolated 10x
await exchange.updateLeverage({
  asset: 0,           // BTC
  isCross: false,     // Isolated mode
  leverage: 10,
});

// Example: Switch to cross 10x
await exchange.updateLeverage({
  asset: 0,           // BTC
  isCross: true,      // Cross mode
  leverage: 10,
});
```

#### updateIsolatedMargin (Margin Adjustment)

```typescript
// Parameters
interface UpdateIsolatedMarginParameters {
  asset: number;      // Asset ID
  isBuy: boolean;     // true = long position, false = short position
  ntli: number;       // Amount to add (positive) or remove (negative)
}

// Example: Add $100 margin to long position
await exchange.updateIsolatedMargin({
  asset: 0,           // BTC
  isBuy: true,        // Long position
  ntli: 100,          // Add $100
});

// Example: Remove $50 margin from short position
await exchange.updateIsolatedMargin({
  asset: 0,           // BTC
  isBuy: false,       // Short position
  ntli: -50,          // Remove $50
});
```

#### Reading Isolated Position Data

```typescript
// From clearinghouseState subscription
const { data } = useSubClearinghouseState({ user: address });

const position = data?.clearinghouseState?.assetPositions?.find(
  p => p.position.coin === "BTC"
);

if (position?.position.leverage.type === "isolated") {
  const isolatedMargin = position.position.leverage.rawUsd;
  const liquidationPx = position.position.liquidationPx;
  console.log(`Isolated margin: $${isolatedMargin}`);
  console.log(`Liquidation price: $${liquidationPx}`);
}
```

#### activeAssetData Response (Updated)

```typescript
interface ActiveAssetDataWsEvent {
  user: string;
  coin: string;
  leverage: LeverageConfig;           // Can be cross OR isolated now
  maxTradeSzs: [string, string];
  availableToTrade: [string, string]; // Backend recalculates for isolated
  markPx: string;
}

// Isolated leverage includes rawUsd
type LeverageConfig =
  | { type: "cross"; value: number }
  | { type: "isolated"; value: number; rawUsd: string };
```

### Hooks to Use

- `useExchangeUpdateLeverage` - Set leverage AND margin mode (existing)
- `useExchangeUpdateIsolatedMargin` - Add/remove margin (new)
- `useSubClearinghouseState` - Get position data including isolated margin
- `useSubActiveAssetData` - Get real-time leverage config and availableToTrade
- `useSelectedResolvedMarket` - Get market info (assetIndex, maxLeverage)

### State Management

```typescript
// Extended useAssetLeverage hook interface
interface UseAssetLeverageReturn {
  // Existing fields...
  currentLeverage: number;
  pendingLeverage: number | null;
  maxLeverage: number;
  displayLeverage: number;
  isDirty: boolean;
  isConnected: boolean;

  // NEW: Margin mode fields
  marginMode: "cross" | "isolated";
  pendingMarginMode: "cross" | "isolated" | null;

  // NEW: Isolated margin fields (only relevant when mode = isolated)
  isolatedMargin: number | null;        // Current rawUsd
  pendingIsolatedMargin: number | null; // Pending adjustment

  // NEW: Actions
  setMarginMode: (mode: "cross" | "isolated") => void;
  adjustIsolatedMargin: (delta: number) => Promise<void>;

  // Existing actions...
  setPendingLeverage: (value: number) => void;
  confirmLeverage: () => Promise<void>;
  resetPending: () => void;

  // Status
  isUpdating: boolean;
  isAdjustingMargin: boolean;           // NEW
  updateError: Error | null;
  marginAdjustError: Error | null;      // NEW
}
```

```typescript
// Position row data helper
interface PositionMarginInfo {
  mode: "cross" | "isolated";
  leverage: number;
  marginUsed: number;
  isolatedMargin: number | null;  // Only for isolated
  liquidationPx: number | null;
  canAddMargin: boolean;
  canRemoveMargin: boolean;
  maxRemovable: number;           // Max margin that can be removed
}

function getPositionMarginInfo(position: Position): PositionMarginInfo {
  const isIsolated = position.leverage.type === "isolated";
  return {
    mode: position.leverage.type,
    leverage: position.leverage.value,
    marginUsed: parseFloat(position.marginUsed),
    isolatedMargin: isIsolated ? parseFloat(position.leverage.rawUsd) : null,
    liquidationPx: position.liquidationPx ? parseFloat(position.liquidationPx) : null,
    canAddMargin: isIsolated,
    canRemoveMargin: isIsolated && parseFloat(position.leverage.rawUsd) > 0,
    maxRemovable: isIsolated ? calculateMaxRemovable(position) : 0,
  };
}
```

## Files

### Modify

- `src/components/trade/order-entry/order-entry-panel.tsx`
  - Add margin mode toggle to leverage section
  - Pass margin mode to leverage popover

- `src/components/trade/order-entry/leverage-popover.tsx`
  - Add Cross/Isolated toggle switch
  - Show warning when switching modes with existing position
  - Update confirm action to include `isCross` parameter

- `src/hooks/trade/use-asset-leverage.ts`
  - Add `marginMode` and `pendingMarginMode` state
  - Add `setMarginMode` action
  - Update `confirmLeverage` to pass `isCross`
  - Handle isolated leverage config parsing

- `src/components/trade/positions/positions-tab.tsx`
  - Add margin mode badge to position rows
  - Add isolated margin column/display
  - Add +/- margin buttons for isolated positions

- `src/lib/hyperliquid/hooks/exchange/index.ts`
  - Export new `useExchangeUpdateIsolatedMargin` hook

### Create

- `src/lib/hyperliquid/hooks/exchange/useExchangeUpdateIsolatedMargin.ts`
  - Hook wrapper for `updateIsolatedMargin` action
  - Handle loading/error states

- `src/components/trade/positions/isolated-margin-adjuster.tsx`
  - Popover/modal for adjusting isolated margin
  - Input field for margin amount
  - Add/Remove buttons
  - Shows current margin, max removable
  - Loading/error states

- `src/components/trade/order-entry/margin-mode-toggle.tsx`
  - Toggle switch component for Cross/Isolated
  - Disabled state when position exists
  - Tooltip explaining the modes

- `src/lib/trade/isolated-margin.ts`
  - Helper functions for isolated margin calculations
  - `calculateMaxRemovable(position)`
  - `calculateNewLiquidationPx(position, marginDelta)`
  - `isIsolatedPosition(position)`

## UI/UX

### Components

- **MarginModeToggle** - Switch between Cross and Isolated in leverage popover
- **IsolatedMarginBadge** - Shows "Isolated" badge on position row
- **IsolatedMarginDisplay** - Shows allocated margin amount in position row
- **IsolatedMarginAdjuster** - Popover for +/- margin adjustment

### User Flows

#### Flow 1: Setting Isolated Margin on New Position

1. User opens leverage popover (no existing position)
2. User toggles from "Cross" to "Isolated"
3. User adjusts leverage slider
4. User clicks "Confirm"
5. Wallet signature request
6. On success: Future orders on this asset use isolated margin
7. When order fills: Position created with isolated margin

#### Flow 2: Adjusting Isolated Margin on Existing Position

1. User sees position row with "Isolated" badge
2. User clicks margin amount or +/- button
3. Margin adjustment popover opens
4. Shows: Current margin, Liquidation price, Max removable
5. User enters amount to add or remove
6. Preview shows: New margin, New liquidation price
7. User clicks "Confirm"
8. Wallet signature request
9. On success: Margin updated, liquidation price recalculated

#### Flow 3: Switching Mode (Restricted)

1. User has existing BTC position in cross margin
2. User opens leverage popover for BTC
3. "Isolated" toggle is disabled with tooltip: "Close position to change margin mode"
4. User must close position first, then can switch modes

### Visual States

```
Leverage Popover (Updated):
┌─────────────────────────────────┐
│ Leverage                    [X] │
├─────────────────────────────────┤
│                                 │
│ Margin Mode:                    │
│ ┌─────────┬──────────┐          │
│ │ Cross   │ Isolated │ ←───────── Toggle (disabled if position exists)
│ └─────────┴──────────┘          │
│                                 │
│ ○────●────○────○────○ max      │
│ 1x   5x   10x  20x  50x        │
│                                 │
│ Value: [  10  ]x               │
│                                 │
│         [ Confirm ]            │
└─────────────────────────────────┘

Position Row (Isolated):
┌──────────────────────────────────────────────────────────────────┐
│ BTC   Long   0.5   $95,000   +$234.56   [Isolated]   $500   [±]  │
│                                          ↑ Badge      ↑ Margin ↑ Adjust
└──────────────────────────────────────────────────────────────────┘

Margin Adjustment Popover:
┌─────────────────────────────────┐
│ Adjust Isolated Margin      [X] │
├─────────────────────────────────┤
│                                 │
│ Current Margin:     $500.00    │
│ Liquidation Price:  $89,234    │
│ Max Removable:      $200.00    │
│                                 │
│ Amount: [ +100    ] USD        │
│         ↑ Positive = add       │
│         ↑ Negative = remove    │
│                                 │
│ Preview:                        │
│ New Margin:         $600.00    │
│ New Liq. Price:     $87,123    │
│                                 │
│  [ Cancel ]    [ Confirm ]     │
└─────────────────────────────────┘

Quick Adjust Buttons (Alternative):
┌─────────────────────────────────┐
│ Margin: $500    [+] [-]        │
│                                 │
│ Quick: [+25%] [+50%] [-25%]    │
└─────────────────────────────────┘
```

## Edge Cases

### Mode Switching Restrictions
- **Position exists** → Cannot switch modes, show disabled toggle with tooltip
- **Open orders exist** → May need to cancel orders first (verify behavior)
- **Zero position after close** → Can switch modes freely

### Margin Adjustment Limits
- **Remove too much** → Error: "Insufficient margin, would cause liquidation"
- **Add more than available** → Error: "Insufficient account balance"
- **Remove all margin** → Not allowed, minimum margin required

### Liquidation Scenarios
- **Isolated position liquidated** → Only that position closed, other positions unaffected
- **Approaching liquidation** → Show warning indicator when margin ratio critical
- **Margin call** → Consider adding margin suggestion

### Data Consistency
- **Subscription delay** → Optimistic update UI, revert if actual differs
- **Multiple positions** → Each has independent isolated margin
- **Mode mismatch** → Ensure UI reflects actual on-chain mode

### Backend Handling (What You DON'T Need to Implement)
- ✅ `availableToTrade` recalculation - Backend handles automatically
- ✅ Liquidation price calculation - Backend provides in position data
- ✅ Margin ratio monitoring - Backend handles liquidation engine
- ✅ Cross-position offset - Backend handles in cross mode only

## Research Notes

- `updateLeverage` with `isCross: false` sets isolated mode
- `updateIsolatedMargin` only works when position is already in isolated mode
- Cannot switch modes while position exists (Hyperliquid restriction)
- Isolated margin is stored in `leverage.rawUsd` field
- `availableToTrade` is recalculated by backend for both modes
- Liquidation price is per-position in isolated mode
- Cross margin uses `crossMarginSummary` for account-wide metrics
- Isolated uses per-position fields in `assetPositions[].position`

## Open Questions

- [ ] Can we switch modes with open orders (no position)?
- [ ] Is there a minimum isolated margin requirement per asset?
- [ ] Should we show projected liquidation price before confirming leverage change?
- [ ] How does isolated margin interact with sub-accounts?
- [ ] Should we warn users when isolated margin is close to liquidation threshold?
- [ ] Do we need to handle partial liquidations differently for isolated?

## References

- `docs/hyperliquid-sdk-directory.md` - Position & Margin section
- `docs/hyperliquid-sdk-2.md` - updateLeverage, updateIsolatedMargin schemas
- `features/leverage-management.md` - Current cross-margin-only implementation
