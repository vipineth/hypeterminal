# Hyperliquid React SDK Migration Spec

## Overview

Migrate the entire app to use `@/lib/hyperliquid/` for all Hyperliquid-related functionality. Currently, hooks and functions are scattered across `hooks/hyperliquid/` and `lib/hyperliquid/`. This migration consolidates everything into the new React SDK.

## Key Decisions (from interview)

### Architecture
- **Exchange API**: Use new `useExchange*` hooks (useExchangeOrder, useExchangeCancel, etc.) - not direct function calls
- **Agent Management**: Provider-only - remove old `useTradingAgent` hook, use `HyperliquidContext` exclusively
- **Signing Mode**: Keep in global store (`use-trade-settings-store`), pass to provider as single source of truth
- **Chain Validation**: Centralize in `HyperliquidProvider` - provider validates chain and exposes status via context

### Migration Approach
- **Order**: Subscriptions first (already partially done), then queries, then exchange actions
- **Cleanup**: Full removal of old code (`lib/hyperliquid/clients.ts`, `exchange.ts`, `market-registry.ts`)
- **Mixed Imports**: One file at a time - never mix old/new imports in same file
- **Mobile/Desktop**: Migrate in parallel - shared hooks where possible

### Data Fetching
- **useResolvedMarket**: Rewrite internals to use new hl-react hooks (keep the abstraction)
- **Subscriptions**: Direct replace - no wrappers, update all usages immediately
- **History Data**: Use subscription hooks (`useSub*`) for real-time updates in all tabs
- **Mark Prices**: Use `useSubAssetCtxs` for real-time (replace polling)
- **Market Metadata**: `usePerpMarkets` becomes single source of truth, delete `market-registry.ts`

### State & Mutations
- **Mutation Style**: Adopt `useExchange*` hooks fully, remove manual `isSubmitting`/`error` state
- **Validation**: Keep simple - provider exposes `isReady`, `needsApproval`, etc. via context
- **Agent Store Migration**: Users re-register agents (no auto-migration utility)

### UX & Error Handling
- **Error Display**: Standardize - toasts for actions, inline for loading states
- **Signing UI**: Keep current Agent/Direct dropdown, wire to new context

### Chart
- **Chart Data**: Migrate fully to hl-react. If hooks don't work in TradingView callbacks, use SDK functions as fallback

### Folder Structure
- Delete `hooks/hyperliquid/` folder entirely after migration
- App-specific hooks move to `lib/hyperliquid/` or appropriate location

### Testing
- Add tests to separate `tests/` folder (not co-located with source files)

---

## Files to Migrate

### Phase 1: Subscription Hooks (Already Started)
These components already use new `useSub*` hooks:
- [x] `components/trade/orderbook/orderbook-panel.tsx` - uses `useSubL2Book`
- [x] `components/trade/orderbook/trades-panel.tsx` - uses `useSubTrades`

### Phase 2: Remaining Subscription Migrations

| File | Old Hook | New Hook | Status |
|------|----------|----------|--------|
| `components/trade/header/favorites-strip.tsx` | `useAllMidsSubscription` | `useSubAllMids` | TODO |
| `hooks/hyperliquid/use-resolved-market.ts` | `useAllMidsSubscription`, `useAssetCtxsSubscription` | `useSubAllMids`, `useSubAssetCtxs` | TODO |
| `components/trade/mobile/mobile-book-view.tsx` | old L2Book | `useSubL2Book` | TODO |

### Phase 3: Query Hook Migrations

| File | Old Hook | New Hook | Status |
|------|----------|----------|--------|
| `components/trade/positions/positions-tab.tsx` | `useClearinghouseState`, `usePerpAssetCtxsSnapshot` | `useSubClearinghouseState`, `useSubAssetCtxs` | TODO |
| `components/trade/positions/orders-tab.tsx` | `useOpenOrders` | `useSubOpenOrders` | TODO |
| `components/trade/positions/history-tab.tsx` | `useUserFills` | `useSubUserFills` | TODO |
| `components/trade/positions/funding-tab.tsx` | `useUserFunding` | `useSubUserFundings` | TODO |
| `components/trade/positions/twap-tab.tsx` | `useTwapHistory` | `useSubUserTwapHistory` | TODO |
| `components/trade/positions/balances-tab.tsx` | `useSpotClearinghouseState` | `useSubSpotState` | TODO |
| `components/trade/order-entry/account-panel.tsx` | `useClearinghouseState` | `useSubClearinghouseState` | TODO |

### Phase 4: Exchange Action Migrations

| File | Current Approach | New Approach | Status |
|------|------------------|--------------|--------|
| `components/trade/order-entry/order-entry-panel.tsx` | `makeExchangeConfig`, `placeSingleOrder`, `ensureLeverage` | `useExchangeOrder`, `useExchangeUpdateLeverage` | TODO |
| `components/trade/positions/positions-tab.tsx` | `placeSingleOrder` (close position) | `useExchangeOrder` | TODO |
| `components/trade/positions/orders-tab.tsx` | `cancelOrders` | `useExchangeCancel` | TODO |

### Phase 5: Agent/Trading Context Migration

| File | Old Pattern | New Pattern | Status |
|------|-------------|-------------|--------|
| `components/trade/order-entry/order-entry-panel.tsx` | `useTradingAgent` from hooks/hyperliquid | `useHyperliquidContext` | TODO |
| `components/trade/positions/positions-tab.tsx` | `useTradingAgent` | `useHyperliquidContext` | TODO |
| `components/trade/positions/orders-tab.tsx` | `useTradingAgent` | `useHyperliquidContext` | TODO |

### Phase 6: Chart Migration

| File | Current | Target | Status |
|------|---------|--------|--------|
| `components/trade/chart/datafeed.ts` | `getInfoClient()`, `getSubscriptionClient()` | SDK functions or hooks where possible | TODO |
| `components/trade/chart/chart-panel.tsx` | `getInfoClient()` | hl-react hooks/SDK | TODO |

### Phase 7: Mobile Components (Parallel with Desktop)

| File | Dependencies | Status |
|------|--------------|--------|
| `components/trade/mobile/mobile-terminal.tsx` | Various hooks | TODO |
| `components/trade/mobile/mobile-trade-view.tsx` | Various hooks | TODO |
| `components/trade/mobile/mobile-chart-view.tsx` | Chart deps | TODO |
| `components/trade/mobile/mobile-positions-view.tsx` | Position deps | TODO |
| `components/trade/mobile/mobile-account-view.tsx` | Account deps | TODO |

### Phase 8: Low Priority

| File | Notes | Status |
|------|-------|--------|
| `components/pages/builder-page.tsx` | Builder fee approval | TODO |

---

## Files to Delete After Migration

### hooks/hyperliquid/ (entire folder)
- `socket/use-active-asset-ctx-subscription.ts`
- `socket/use-all-mids-subscription.ts`
- `socket/use-asset-ctxs-subscription.ts`
- `socket/use-l2-book-subscription.ts`
- `socket/use-subscription.ts`
- `socket/use-trades-subscription.ts`
- `socket/use-hyperliquid-ws.ts`
- `use-clearinghouse-state.ts`
- `use-market-registry.ts`
- `use-meta.ts`
- `use-open-orders.ts`
- `use-spot-clearinghouse-state.ts`
- `use-twap-history.ts`
- `use-user-fills.ts`
- `use-user-funding.ts`
- `use-extra-agents.ts`
- `use-trading-agent.ts`
- `use-resolved-market.ts` (rewrite then move to hl-react)
- `use-perp-asset-ctxs-snapshot.ts`

### lib/hyperliquid/
- `clients.ts` - singleton clients (replaced by provider)
- `exchange.ts` - exchange functions (replaced by useExchange* hooks)
- `market-registry.ts` - market metadata (replaced by usePerpMarkets)
- `wallet.ts` - wallet helpers (review if still needed)
- `api-wallet.ts` - API wallet helpers (replaced by agent store in hl-react)

### stores/
- `use-api-wallet-store.ts` - old agent wallet store (replaced by hl-react agent store)

---

## Provider Updates Required

### HyperliquidProvider Changes
1. Accept `signingMode` from external store (use-trade-settings-store)
2. Add chain validation - expose `chainStatus` via context
3. Expose simpler status for UI:
   - `isReady` - can trade
   - `needsApproval` - agent mode but no valid agent
   - `needsChainSwitch` - wrong chain
   - `isRegistering` - agent registration in progress

### Context Value Updates
```typescript
interface HyperliquidContextValue {
  // Trading readiness
  status: TradingStatus; // 'ready' | 'needs_approval' | 'no_wallet' | 'wrong_chain' | 'no_signer'
  isReady: boolean;

  // Signing
  signingMode: SigningMode;
  activeSigner: AbstractWallet | null;

  // Agent management
  agentStatus: AgentStatus;
  agentRegisterStatus: AgentRegisterStatus;
  approveAgent: () => Promise<`0x${string}`>;
  resetAgent: () => void;

  // Chain
  chainStatus: 'correct' | 'wrong' | 'unknown';

  // Config
  userAddress: `0x${string}` | undefined;
  env: HyperliquidEnv;
  builderConfig?: BuilderConfig;
}
```

---

## useResolvedMarket Rewrite

Current implementation uses old hooks. Rewrite to use:
- `usePerpMarkets` for market metadata
- `useSubAllMids` for real-time mid prices (when ctxMode: 'realtime')
- `useSubAssetCtxs` for full context data

Keep the same interface:
```typescript
function useResolvedMarket(params: { ctxMode: 'realtime' | 'none' }): {
  data: ResolvedMarket;
  status: 'pending' | 'success' | 'error';
  error: Error | null;
}
```

---

## Error Handling Standardization

### Actions (toasts)
- Order placement success/failure
- Order cancellation success/failure
- Agent registration success/failure
- Position close success/failure

### Loading States (inline)
- Data fetching errors
- WebSocket connection errors
- Validation errors

Create shared utilities in `lib/trade/errors.ts` or similar.

---

## Migration Checklist

### Pre-Migration
- [ ] Review all hl-react hooks exist for needed functionality
- [ ] Verify hl-react exchange hooks support all needed operations
- [ ] Check if any SDK functions need to be exported for non-hook contexts

### Phase 1-2: Subscriptions
- [ ] Migrate favorites-strip.tsx
- [ ] Rewrite use-resolved-market.ts
- [ ] Migrate mobile-book-view.tsx
- [ ] Verify all subscription migrations work

### Phase 3: Queries
- [ ] Migrate positions-tab.tsx (data only)
- [ ] Migrate orders-tab.tsx (data only)
- [ ] Migrate history-tab.tsx
- [ ] Migrate funding-tab.tsx
- [ ] Migrate twap-tab.tsx
- [ ] Migrate balances-tab.tsx
- [ ] Migrate account-panel.tsx

### Phase 4: Exchange Actions
- [ ] Migrate order-entry-panel.tsx (order placement)
- [ ] Migrate positions-tab.tsx (close position)
- [ ] Migrate orders-tab.tsx (cancel orders)
- [ ] Update leverage handling

### Phase 5: Agent/Context
- [ ] Update provider with chain validation
- [ ] Migrate all useTradingAgent usages to useHyperliquidContext
- [ ] Remove old useTradingAgent hook

### Phase 6: Chart
- [ ] Migrate datafeed.ts
- [ ] Migrate chart-panel.tsx
- [ ] Test TradingView integration

### Phase 7: Mobile
- [ ] Migrate all mobile components in parallel with desktop

### Phase 8: Low Priority
- [ ] Migrate builder-page.tsx

### Cleanup
- [ ] Delete hooks/hyperliquid/ folder
- [ ] Delete unused lib/hyperliquid/ files
- [ ] Delete old agent store
- [ ] Run type check
- [ ] Run tests
- [ ] Manual testing of all flows

---

## Notes

- Each file should be fully migrated before moving to next (no mixed imports)
- Mobile and desktop versions of same feature migrate together
- Tests go in separate `tests/` folder
- Users will need to re-register trading agents after migration
