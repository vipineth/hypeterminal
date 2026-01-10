# Feature: Leverage Management

## Meta

| Field | Value |
|-------|-------|
| Priority | High |
| Status | Planned |
| Created | 2026-01-10 |
| Updated | 2026-01-10 |

## Summary

Proper leverage management that syncs with on-chain state. When disconnected, use default from meta. When connected, subscribe to user's actual leverage per asset and allow changing it with on-chain confirmation.

## User Stories

- As a trader, I want to see my actual on-chain leverage for each asset so that I know my real risk exposure
- As a trader, I want to change my leverage and confirm it on-chain so that changes persist across sessions
- As a trader, I want to see available-to-trade amounts based on my leverage so I can size positions correctly
- As a disconnected user, I want sensible default leverage from market meta so I can preview order calculations

## Requirements

### Must Have

- [ ] Subscribe to `activeAssetData` for connected users to get real-time leverage
- [ ] Display user's actual on-chain leverage (not just local state)
- [ ] Show confirm button when leverage differs from on-chain value
- [ ] Call `useExchangeUpdateLeverage` to update leverage on-chain
- [ ] Use `availableToTrade` from subscription for accurate max size calculations
- [ ] Fall back to meta defaults when wallet not connected

### Nice to Have

- [ ] Show loading state while updating leverage
- [ ] Toast notification on leverage update success/failure
- [ ] Display `maxTradeSzs` from subscription
- [ ] Remember last-used leverage per asset in local storage as initial value

## Tasks

1. [ ] Create `useAssetLeverage` hook that combines subscription + local state
2. [ ] Add `useSubActiveAssetData` subscription in order-entry-panel when connected
3. [ ] Update leverage dropdown to show on-chain value with "pending" indicator
4. [ ] Add confirm button that appears when local selection differs from on-chain
5. [ ] Implement leverage update via `useExchangeUpdateLeverage` with loading state
6. [ ] Replace local `availableBalance` calculation with `availableToTrade` from subscription
7. [ ] Update max size calculation to use subscription data
8. [ ] Handle disconnected state with meta defaults

## Technical Spec

### SDK/API Details

#### useExchangeUpdateLeverage

```typescript
// Parameters
interface UpdateLeverageParameters {
  asset: number;      // Asset ID (from market.assetIndex)
  isCross: boolean;   // true for cross leverage, false for isolated
  leverage: number;   // New leverage value (minimum: 1)
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
  availableToTrade: [string, string]; // [sell, buy] available amounts
  markPx: string;                    // Current mark price
}

// Leverage config types
type LeverageConfig =
  | { type: "cross"; value: number }
  | { type: "isolated"; value: number; rawUsd: string };

// Example usage
const { data, status } = useSubActiveAssetData(
  { coin: "BTC", user: address },
  { enabled: isConnected && !!address }
);

// data.leverage.value = current on-chain leverage
// data.availableToTrade[0] = available to sell
// data.availableToTrade[1] = available to buy
```

### Hooks to Use

- `useExchangeUpdateLeverage` - Update leverage on-chain (requires signature)
- `useSubActiveAssetData` - Subscribe to user's asset-specific data (leverage, available to trade)
- `useSelectedResolvedMarket` - Get current market info (assetIndex, maxLeverage)
- `useConnection` - Get wallet connection status and address

### State Management

```typescript
// Current store (use-trade-settings-store.ts) - keep for local UI state
interface TradeSettingsStore {
  marketLeverageByMode: Record<string, { cross?: number; isolated?: number }>;
  // ... existing fields
}

// New: Combined hook for leverage management
interface UseAssetLeverageReturn {
  // Values
  localLeverage: number;           // User's selected value in UI
  onChainLeverage: number | null;  // From subscription (null if disconnected)
  effectiveLeverage: number;       // What to use for calculations
  maxLeverage: number;             // From market meta

  // Computed
  isDirty: boolean;                // localLeverage !== onChainLeverage
  isConnected: boolean;

  // Actions
  setLocalLeverage: (value: number) => void;
  confirmLeverage: () => Promise<void>;

  // Subscription data
  availableToTrade: [number, number] | null;  // [sell, buy]
  maxTradeSzs: [number, number] | null;

  // Status
  isUpdating: boolean;
  subscriptionStatus: "idle" | "loading" | "success" | "error";
}
```

## Files

### Modify

- `src/components/trade/order-entry/order-entry-panel.tsx`
  - Add `useSubActiveAssetData` subscription
  - Use `availableToTrade` for max size calculation
  - Add confirm button for leverage changes
  - Show pending state during update

- `src/stores/use-trade-settings-store.ts`
  - Keep existing for local state
  - May add `pendingLeverageUpdate` flag

### Create

- `src/lib/trade/hooks/use-asset-leverage.ts`
  - Combined hook that manages local + on-chain leverage
  - Handles subscription and update logic
  - Provides `isDirty` and `confirmLeverage` action

## UI/UX

### Components

- **LeverageDropdown** (existing) - Select leverage value
- **LeverageConfirmButton** (new) - Appears when leverage differs from on-chain
- **LeverageIndicator** (new) - Shows on-chain vs pending state

### User Flow

1. User opens order entry panel
2. If connected: Subscribe to `activeAssetData` for current coin + user
3. Display on-chain leverage in dropdown (with sync indicator if differs from selection)
4. User selects different leverage from dropdown
5. "Confirm" button appears next to dropdown
6. User clicks confirm → Wallet signature request
7. On success: Subscription updates automatically, button disappears
8. On error: Show error toast, keep button visible

### Visual States

```
Disconnected:
┌─────────────────┐
│ 10x  ▼          │  ← Default from meta, no confirm needed
└─────────────────┘

Connected (synced):
┌─────────────────┐
│ 10x  ▼  ✓       │  ← Green checkmark = synced with on-chain
└─────────────────┘

Connected (pending change):
┌─────────────────┐ ┌──────────┐
│ 20x  ▼  ⟳       │ │ Confirm  │  ← Yellow sync icon + confirm button
└─────────────────┘ └──────────┘

Updating:
┌─────────────────┐ ┌──────────┐
│ 20x  ▼  ⟳       │ │ ···      │  ← Spinner in button
└─────────────────┘ └──────────┘
```

## Edge Cases

- User disconnects while leverage update is pending → Cancel update, clear dirty state
- Subscription returns different leverage than expected → Update local state to match
- `availableToTrade` is [0, 0] → User has no margin, show deposit prompt
- Market changes while leverage update is pending → Cancel and re-fetch for new market
- `maxLeverage` from meta is less than current on-chain leverage → Show warning
- Network error during update → Show retry option

## Research Notes

- `activeAssetData` subscription provides real-time `availableToTrade` - more accurate than local calculation
- Leverage update requires wallet signature (L1 action)
- Cross leverage is simpler (just value), isolated includes `rawUsd` allocation
- `maxTradeSzs` is [min, max] trade size allowed for the asset
- `availableToTrade` is [sell available, buy available] based on current leverage
- Current order-entry-panel calculates `availableBalance` locally - should use subscription data instead

## Open Questions

- [ ] Should we auto-sync local selection when subscription updates?
- [ ] Show isolated margin mode UI (currently disabled)?
- [ ] Cache last successful leverage per asset in localStorage?
- [ ] Add leverage presets (1x, 5x, 10x, 25x, max)?
