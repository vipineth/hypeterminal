# Feature: Leverage Management

## Meta

| Field | Value |
|-------|-------|
| Priority | High |
| Status | Implemented |
| Created | 2026-01-10 |
| Updated | 2026-01-10 |

## Summary

Proper leverage management that syncs with on-chain state. When disconnected, use default from meta (min of 10x or maxLeverage). When connected, subscribe to user's actual leverage per asset via `activeAssetData` and allow changing it with on-chain confirmation through a popover/sheet UI.

## User Stories

- As a trader, I want to see my actual on-chain leverage for each asset so that I know my real risk exposure
- As a trader, I want to change my leverage via a slider/popover and confirm it on-chain so that changes persist across sessions
- As a trader, I want to see available-to-trade amounts directly from the subscription so I can size positions correctly
- As a disconnected user, I want sensible default leverage (min of 10x or maxLeverage) so I can preview order calculations

## Requirements

### Must Have

- [x] Subscribe to `activeAssetData` for connected users to get real-time leverage
- [x] Display user's actual on-chain leverage from `leverage.value` (not local state)
- [x] Replace dropdown with clickable leverage badge showing `10x` format
- [x] Open popover (desktop) or bottom sheet (mobile) on badge click
- [x] Custom trading-style slider with marks and numeric input
- [x] Confirm button to call `useExchangeUpdateLeverage` on-chain
- [x] Use `availableToTrade[0]` (sell) and `availableToTrade[1]` (buy) directly for max size
- [x] Fall back to min(10, maxLeverage) when wallet not connected
- [x] Cross margin mode only (isolated margin hidden)

### Nice to Have

- [ ] Toast notification on leverage update success/failure
- [ ] Display `maxTradeSzs` from subscription
- [ ] Keyboard shortcuts for common leverage values

## Decisions from Interview

### State Management
- **No localStorage for leverage** - On-chain value is source of truth when connected
- **Disconnected state**: Use in-memory state, fallback to min(10, maxLeverage) on page refresh
- **Pending value**: Component local state until confirmed on-chain

### Subscription Strategy
- **Scope**: Subscribe when order-entry-panel mounts + user is connected, unsubscribe on unmount
- **Max leverage**: `maxLeverage` from meta is always the ceiling; `leverage.value` from activeAssetData is current value

### Error Handling
- **On update failure**: Keep popover open with error state, reset to fallback (10x or maxLeverage)
- **No liquidation warnings**: Trust the user to manage their own risk

### UI/UX Decisions
- **Trigger**: Clickable leverage badge with subtle hover effect (cursor pointer, slight background change)
- **Popover placement**: Floating popover on desktop, bottom sheet on mobile (responsive)
- **Slider style**: Custom trading-style with larger handle, tick marks, value tooltip
- **Slider marks**: 3-5 fixed marks based on maxLeverage
- **Slider precision**: Any integer in range (1 to maxLeverage)
- **Numeric input**: Included alongside slider for precise entry
- **Badge format**: `10x` (number with 'x' suffix)
- **Badge position**: Same row as 'Available' balance in order entry panel
- **Popover content**: Minimal - slider + numeric input + confirm button only
- **Market switch**: Close popover and fetch new leverage when market changes
- **Success feedback**: Auto-close popover 1-2s after successful update
- **Error feedback**: Keep popover open with retry/cancel options

### Data Flow
- **Available balance**: Use `availableToTrade` directly from subscription (already accounts for leverage, margin, open orders)
- **Disconnected users**: Can change leverage in popover (in-memory), affects local calculations only

## Tasks

1. [x] Create `LeverageBadge` component - clickable chip showing `10x` format with hover effect
2. [x] Create `LeveragePopover` component - desktop popover with slider, numeric input, confirm button
3. [x] Create `LeverageSheet` component - mobile bottom sheet version of popover
4. [x] Create custom trading-style slider component with marks and value tooltip
5. [x] Create `useAssetLeverage` hook combining subscription data + local pending state
6. [x] Add `useSubActiveAssetData` subscription in order-entry-panel when connected
7. [x] Replace leverage dropdown with LeverageBadge in order-entry-panel
8. [x] Implement leverage update via `useExchangeUpdateLeverage` with loading/error states
9. [x] Replace local `availableBalance` calculation with `availableToTrade` from subscription
10. [x] Update max size calculation to use `availableToTrade[0]` (sell) and `availableToTrade[1]` (buy)
11. [x] Handle disconnected state with in-memory fallback to min(10, maxLeverage)
12. [x] Close popover on market change
13. [x] Auto-close popover on success, keep open on error

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

#### useExchangeUpdateLeverage

```typescript
// Parameters
interface UpdateLeverageParameters {
  asset: number;      // Asset ID (from market.assetIndex)
  isCross: boolean;   // Always true (cross margin only)
  leverage: number;   // New leverage value (1 to maxLeverage)
}

// Response
interface UpdateLeverageSuccessResponse {
  status: "ok";
  response: { type: "default" };
}

// Example usage
const { mutateAsync: updateLeverage, isPending } = useExchangeUpdateLeverage();

await updateLeverage({
  asset: 0,        // BTC
  isCross: true,   // Cross margin mode
  leverage: 10     // 10x leverage
});
```

#### useSubActiveAssetData

```typescript
// Parameters
interface ActiveAssetDataWsParameters {
  coin: string;    // Asset symbol (e.g., "BTC")
  user: string;    // User wallet address
}

// Response Event
interface ActiveAssetDataWsEvent {
  user: string;                      // User address
  coin: string;                      // Asset symbol
  leverage: LeverageConfig;          // Current leverage config
  maxTradeSzs: [string, string];     // [min, max] trade size
  availableToTrade: [string, string]; // [sell, buy] available amounts - USE DIRECTLY
  markPx: string;                    // Current mark price
}

// Leverage config (cross margin only)
type LeverageConfig = { type: "cross"; value: number };

// Example usage
const { data, status } = useSubActiveAssetData(
  { coin: "BTC", user: address },
  { enabled: isConnected && !!address }
);

// data.leverage.value = current on-chain leverage
// data.availableToTrade[0] = available to sell (use directly)
// data.availableToTrade[1] = available to buy (use directly)
```

### Hooks to Use

- `useExchangeUpdateLeverage` - Update leverage on-chain (requires signature)
- `useSubActiveAssetData` - Subscribe to user's asset-specific data (leverage, available to trade)
- `useSelectedResolvedMarket` - Get current market info (assetIndex, maxLeverage)
- `useConnection` - Get wallet connection status and address

### State Management

```typescript
// NEW: useAssetLeverage hook interface
interface UseAssetLeverageReturn {
  // Values
  currentLeverage: number;           // On-chain value from subscription (or fallback)
  pendingLeverage: number | null;    // Value selected in UI but not confirmed
  maxLeverage: number;               // From market meta

  // Computed
  displayLeverage: number;           // What to show in badge (pending or current)
  isDirty: boolean;                  // pendingLeverage !== currentLeverage
  isConnected: boolean;

  // Actions
  setPendingLeverage: (value: number) => void;
  confirmLeverage: () => Promise<void>;
  resetPending: () => void;          // Clear pending, revert to current

  // Subscription data (direct from activeAssetData)
  availableToSell: number | null;    // availableToTrade[0] - use directly for max sell
  availableToBuy: number | null;     // availableToTrade[1] - use directly for max buy
  maxTradeSzs: [number, number] | null;

  // Status
  isUpdating: boolean;               // Mutation in progress
  updateError: Error | null;         // Last update error
  subscriptionStatus: "idle" | "loading" | "success" | "error";
}

// Fallback logic
function getDefaultLeverage(maxLeverage: number): number {
  return Math.min(10, maxLeverage);
}
```

## Files

### Modify

- `src/components/trade/order-entry/order-entry-panel.tsx`
  - Replace leverage dropdown with LeverageBadge component
  - Add `useSubActiveAssetData` subscription when connected
  - Use `availableToTrade` directly for max size calculation
  - Pass leverage state to LeverageBadge/Popover

- `src/stores/use-trade-settings-store.ts`
  - Remove leverage-related fields (no longer persisted)
  - Keep other settings (slippage, etc.)

### Create

- `src/components/trade/order-entry/leverage-badge.tsx`
  - Clickable badge showing `10x` format
  - Subtle hover effect (cursor pointer, background change)
  - Opens popover/sheet on click

- `src/components/trade/order-entry/leverage-popover.tsx`
  - Desktop floating popover
  - Contains slider + numeric input + confirm button
  - Handles loading/error states
  - Auto-closes on success, stays open on error

- `src/components/trade/order-entry/leverage-sheet.tsx`
  - Mobile bottom sheet version
  - Same content as popover
  - Touch-optimized slider interaction

- `src/components/trade/order-entry/leverage-slider.tsx`
  - Custom trading-style slider
  - Larger handle, tick marks (3-5 based on maxLeverage)
  - Value tooltip following cursor
  - Accepts any integer from 1 to maxLeverage

- `src/lib/trade/hooks/use-asset-leverage.ts`
  - Combined hook managing subscription + pending state
  - Provides `confirmLeverage` action
  - Handles fallback logic for disconnected users
  - Exposes `availableToSell` and `availableToBuy` directly

## UI/UX

### Components

- **LeverageBadge** - Clickable chip showing leverage (e.g., "10x") with hover effect
- **LeveragePopover** - Desktop floating popover with slider and confirm
- **LeverageSheet** - Mobile bottom sheet with same content
- **LeverageSlider** - Custom trading-style slider with marks and tooltip

### User Flow

1. User opens order entry panel
2. If connected: Subscribe to `activeAssetData` for current coin + user
3. Display on-chain leverage in badge (e.g., "10x")
4. User clicks badge → Opens popover (desktop) or sheet (mobile)
5. User adjusts slider or types in numeric input
6. "Confirm" button becomes active
7. User clicks confirm → Wallet signature request
8. Popover shows loading state while updating
9. On success: Subscription updates automatically, popover auto-closes after 1-2s
10. On error: Error message shown in popover, retry/cancel options available

### Visual States

```
Order Entry Panel Header:
┌─────────────────────────────────────────────┐
│ Available: $1,234.56     Leverage: [10x ▾]  │  ← Badge with hover effect
└─────────────────────────────────────────────┘

Popover (Desktop):
┌─────────────────────────────────┐
│ Leverage                    [X] │
├─────────────────────────────────┤
│ ○────●────○────○────○ max      │  ← Slider with marks
│ 1x   5x   10x  20x  50x        │
│                                 │
│ Value: [  10  ]x               │  ← Numeric input
│                                 │
│         [ Confirm ]            │  ← Only enabled when dirty
└─────────────────────────────────┘

Loading State:
┌─────────────────────────────────┐
│ Leverage                    [X] │
├─────────────────────────────────┤
│ ○────●────○────○────○ max      │
│                                 │
│ Value: [  10  ]x               │
│                                 │
│         [ ···     ]            │  ← Spinner in button
└─────────────────────────────────┘

Error State:
┌─────────────────────────────────┐
│ Leverage                    [X] │
├─────────────────────────────────┤
│ ○────●────○────○────○ max      │
│                                 │
│ Value: [  10  ]x               │
│                                 │
│ ⚠ Update failed                │
│ [ Cancel ]  [ Retry ]          │
└─────────────────────────────────┘

Mobile Sheet:
┌─────────────────────────────────┐
│ ═══════════════                 │  ← Drag handle
│ Leverage                        │
├─────────────────────────────────┤
│                                 │
│ ○────●────○────○────○ max      │  ← Larger touch targets
│ 1x   5x   10x  20x  50x        │
│                                 │
│ Value: [  10  ]x               │
│                                 │
│ ┌─────────────────────────────┐ │
│ │         Confirm             │ │  ← Full-width button
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## Edge Cases

- User disconnects while popover is open → Close popover, reset to disconnected state
- Market changes while popover is open → Close popover, fetch new market's leverage
- `availableToTrade` is [0, 0] → User has no margin, show deposit prompt (existing behavior)
- `maxLeverage` from meta is very low (e.g., 3x) → Use 3x as both default and max
- Network error during update → Show error in popover, offer retry
- User clicks badge while disconnected → Opens popover with local state, can adjust but only affects local calculations
- Subscription returns before popover opens → Badge shows correct on-chain value immediately

## Research Notes

- `activeAssetData` subscription provides real-time `availableToTrade` - use directly, no multiplication needed
- `availableToTrade[0]` = maximum sell amount considering current leverage, margin, open orders
- `availableToTrade[1]` = maximum buy amount considering current leverage, margin, open orders
- Leverage update requires wallet signature (L1 action)
- Cross margin is the only supported mode for now (isolated hidden)
- `maxTradeSzs` is [min, max] trade size allowed for the asset
- Current order-entry-panel calculates `availableBalance` locally - should use `availableToTrade` directly instead

## Open Questions

- [x] Should we auto-sync local selection when subscription updates? → **No, on-chain is source of truth**
- [x] Show isolated margin mode UI? → **No, cross only for now**
- [x] Cache leverage in localStorage? → **No, in-memory only for disconnected state**
- [x] Add leverage presets? → **Yes, as slider marks (3-5 based on maxLeverage)**
