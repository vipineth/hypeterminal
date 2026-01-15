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

### Phase 1: Cross/Isolated Switch (This PR)

- [x] Replace Cross/Isolated tabs with toggle switch in order entry panel
- [x] Toggle switch opens confirmation modal on click
- [x] Modal shows detailed comparison table (Cross vs Isolated differences)
- [x] Modal "Confirm" button triggers wallet signature
- [x] Modal auto-closes immediately on successful signature
- [x] Show toast notification on signature error/failure
- [x] Lock icon on toggle when position exists, clicking shows modal with "Cannot switch leverage type with open position" message
- [x] Per-asset margin mode (each asset tracks its own mode independently)
- [x] Remember last selected mode in localStorage for new assets
- [x] Display "ISO" badge on isolated position rows in positions panel
- [x] Terminal-cyan accent styling for toggle switch

### Phase 2: Margin Adjustment (Follow-up)

- [ ] Show isolated margin amount (`rawUsd`) for isolated positions
- [ ] Add/remove margin controls for isolated positions
- [ ] Display per-position liquidation price for isolated positions
- [ ] Quick margin adjustment presets (+25%, +50%, -25%, -50%)
- [ ] Liquidation price warning threshold indicator

## Switch Implementation Spec

### Toggle Switch Component

**Location**: Replaces the current `<Tabs value="cross">` in `order-entry-panel.tsx` (lines 501-515)

**Visual Design**:
```
┌─────────────────────────────────────────────────┐
│  [Cross ○────────● Isolated]   20x [▼]         │
│   ↑ Toggle switch              ↑ Leverage      │
└─────────────────────────────────────────────────┘
```

**Styling**:
- Terminal-cyan accent for active/selected state
- Labels: "Cross" and "Isolated" (full names, not abbreviated)
- Compact inline layout alongside leverage control
- Lock icon overlay when position exists

### Confirmation Modal

**Trigger**: Clicking the toggle switch (either direction)

**Modal Content - Normal State** (no position):
```
┌─────────────────────────────────────────────────┐
│  Switch to [Isolated/Cross] Margin         [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Description text based on target mode]        │
│                                                 │
│         [ Cancel ]     [ Confirm ]             │
│                         ↑ Triggers signature   │
└─────────────────────────────────────────────────┘
```

**Modal Description Text**:

When switching to **Cross**:
> All cross positions share the same cross margin as collateral. In the event of liquidation, your cross margin balance and any remaining open positions under assets in this mode may be forfeited.

When switching to **Isolated**:
> Manage your risk on individual positions by restricting the amount of margin allocated to each. If the margin ratio of an isolated position reaches 100%, the position will be liquidated. Margin can be added or removed to individual positions in this mode.

**Modal Content - Locked State** (position exists):
```
┌─────────────────────────────────────────────────┐
│  Cannot Switch Margin Mode                 [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│  ⚠️ Cannot switch leverage type with open      │
│     position.                                   │
│                                                 │
│  Close your [ASSET] position first to change   │
│  between Cross and Isolated margin modes.      │
│                                                 │
│                    [ OK ]                       │
└─────────────────────────────────────────────────┘
```

### State Management

**Per-Asset Mode Tracking**:
- Each asset maintains its own margin mode
- Mode is fetched from `useSubActiveAssetData` → `leverage.type`
- When switching assets, toggle reflects that asset's current mode

**Default for New Assets**:
- Check localStorage for `hyperliquid:lastMarginMode`
- If stored preference exists, use it
- Otherwise default to "cross"
- On successful mode switch, update localStorage preference

**State Flow**:
```
User clicks toggle
    ↓
Modal opens (show comparison or locked message)
    ↓
User clicks "Confirm" (if allowed)
    ↓
Call updateLeverage({ asset, isCross: newMode === "cross", leverage: currentLeverage })
    ↓
Wallet signature prompt
    ↓
On success: Modal auto-closes, toggle updates, update localStorage
On error: Modal closes, show toast with error message
```

### Error Handling

**Toast Notification on Error**:
- Position: Bottom-right corner
- Style: Terminal-red accent
- Content: Error message from API or "Failed to switch margin mode"
- Auto-dismiss after 5 seconds
- Include retry action in toast (optional)

### Position Badge

**Location**: Position rows in `positions-tab.tsx`

**Design**:
```
┌──────────────────────────────────────────────────────────────┐
│ BTC   Long   0.5 BTC   $95,000   +$234.56   [ISO]   [Close] │
│                                              ↑ Badge        │
└──────────────────────────────────────────────────────────────┘
```

**Badge Styling**:
- Text: "ISO" (short for Isolated)
- Background: `terminal-cyan/15`
- Border: `terminal-cyan/30`
- Text color: `terminal-cyan`
- Font: `text-4xs uppercase`
- Only shown for isolated positions (cross positions show no badge)

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

### Phase 1: Switch Implementation

1. [ ] Create `MarginModeToggle` component with terminal-cyan styling
2. [ ] Create `MarginModeSwitchModal` component with comparison table
3. [ ] Create `MarginModeLockedModal` component for position-exists state
4. [ ] Update `order-entry-panel.tsx` to use toggle instead of tabs
5. [ ] Add localStorage persistence for last selected mode
6. [ ] Update `useAssetLeverage` hook to expose margin mode and switch action
7. [ ] Add toast notification system for errors (if not already present)
8. [ ] Create `IsolatedBadge` component for position rows
9. [ ] Update `positions-tab.tsx` to show badge for isolated positions
10. [ ] Test mode switching flow end-to-end

### Phase 2: Margin Adjustment (Future)

1. [ ] Create `useExchangeUpdateIsolatedMargin` hook
2. [ ] Create `IsolatedMarginAdjuster` component
3. [ ] Add margin amount display to position rows
4. [ ] Add liquidation price display
5. [ ] Implement quick adjustment presets

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

#### updateIsolatedMargin (Margin Adjustment - Phase 2)

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
- `useExchangeUpdateIsolatedMargin` - Add/remove margin (Phase 2)
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
  hasPosition: boolean;              // Whether position exists for this asset

  // NEW: Actions
  switchMarginMode: (mode: "cross" | "isolated") => Promise<void>;

  // Existing actions...
  setPendingLeverage: (value: number) => void;
  confirmLeverage: () => Promise<void>;
  resetPending: () => void;

  // Status
  isUpdating: boolean;
  isSwitchingMode: boolean;          // NEW
  updateError: Error | null;
  switchModeError: Error | null;     // NEW
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

### Phase 1: Modify

- `src/components/trade/order-entry/order-entry-panel.tsx`
  - Replace Cross/Isolated tabs with `MarginModeToggle` component
  - Add modal trigger on toggle click

- `src/hooks/trade/use-asset-leverage.ts`
  - Add `marginMode` from subscription data
  - Add `hasPosition` check
  - Add `switchMarginMode` action
  - Add `isSwitchingMode` and `switchModeError` status

- `src/components/trade/positions/positions-tab.tsx`
  - Add `IsolatedBadge` to position rows

### Phase 1: Create

- `src/components/trade/order-entry/margin-mode-toggle.tsx`
  - Toggle switch component
  - Props: `mode`, `disabled`, `onClick`
  - Terminal-cyan accent styling
  - Lock icon overlay when disabled

- `src/components/trade/order-entry/margin-mode-switch-modal.tsx`
  - Confirmation modal with comparison table
  - Props: `open`, `onOpenChange`, `targetMode`, `asset`, `onConfirm`, `isLoading`
  - Auto-closes on success

- `src/components/trade/order-entry/margin-mode-locked-modal.tsx`
  - Modal explaining position restriction
  - Props: `open`, `onOpenChange`, `asset`
  - Simple "OK" dismissal

- `src/components/trade/positions/isolated-badge.tsx`
  - Small "ISO" badge component
  - Terminal-cyan styling

- `src/lib/trade/margin-mode.ts`
  - `getStoredMarginModePreference(): "cross" | "isolated"`
  - `setStoredMarginModePreference(mode: "cross" | "isolated"): void`
  - `isIsolatedPosition(position: Position): boolean`

### Phase 2: Create (Future)

- `src/lib/hyperliquid/hooks/exchange/useExchangeUpdateIsolatedMargin.ts`
- `src/components/trade/positions/isolated-margin-adjuster.tsx`
- `src/lib/trade/isolated-margin.ts`

## User Flows

### Flow 1: Switching to Isolated (No Position)

1. User sees toggle switch showing "Cross" state
2. User clicks toggle
3. Modal opens with comparison table: "Switch to Isolated Margin"
4. User reviews comparison table
5. User clicks "Confirm"
6. Wallet signature prompt appears
7. On success: Modal auto-closes, toggle shows "Isolated"
8. localStorage updated with preference

### Flow 2: Switching Mode (Position Exists)

1. User has existing BTC position
2. User clicks toggle switch (shows lock icon)
3. Modal opens: "Cannot Switch Margin Mode"
4. Modal explains: "Cannot switch leverage type with open position"
5. User clicks "OK" to dismiss
6. Toggle remains unchanged

### Flow 3: Signature Error

1. User clicks toggle
2. Modal opens with comparison
3. User clicks "Confirm"
4. Wallet signature prompt appears
5. User rejects or error occurs
6. Modal closes
7. Toast notification appears: "Failed to switch margin mode"
8. Toggle remains in original state

### Flow 4: Switching Assets

1. User is on BTC (Cross mode)
2. User switches to ETH (previously set to Isolated)
3. Toggle updates to show "Isolated" state
4. Mode reflects ETH's actual on-chain mode

## Edge Cases

### Mode Switching Restrictions
- **Position exists** → Show lock icon on toggle, clicking opens locked modal
- **Open orders exist** → May need to cancel orders first (verify behavior)
- **Zero position after close** → Can switch modes freely

### Margin Adjustment Limits (Phase 2)
- **Remove too much** → Error: "Insufficient margin, would cause liquidation"
- **Add more than available** → Error: "Insufficient account balance"
- **Remove all margin** → Not allowed, minimum margin required

### Liquidation Scenarios (Phase 2)
- **Isolated position liquidated** → Only that position closed, other positions unaffected
- **Approaching liquidation** → Show warning indicator when margin ratio critical
- **Margin call** → Consider adding margin suggestion

### Data Consistency
- **Subscription delay** → Toggle reflects actual mode from subscription, not optimistic
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

- [x] Can we switch modes with open orders (no position)? → Need to verify
- [ ] Is there a minimum isolated margin requirement per asset?
- [ ] Should we show projected liquidation price before confirming leverage change? (Phase 2)
- [ ] How does isolated margin interact with sub-accounts?
- [ ] Should we warn users when isolated margin is close to liquidation threshold? (Phase 2)
- [ ] Do we need to handle partial liquidations differently for isolated? (Phase 2)

## References

- `docs/hyperliquid-sdk-directory.md` - Position & Margin section
- `docs/hyperliquid-sdk-2.md` - updateLeverage, updateIsolatedMargin schemas
- `features/leverage-management.md` - Current cross-margin-only implementation
