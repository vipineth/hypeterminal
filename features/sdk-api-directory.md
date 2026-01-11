# Feature: SDK API Directory

## Meta

| Field | Value |
|-------|-------|
| Priority | Medium |
| Status | Planned |
| Created | 2026-01-10 |
| Updated | 2026-01-10 |

## Summary

Create a condensed API directory file that serves as a quick-reference guide to discover the right Hyperliquid SDK methods for specific tasks. The directory maps use cases to method names with one-line descriptions, reducing context window usage while enabling efficient API discovery.

## Problem Statement

The full SDK documentation (`hyperliquid-sdk-1.md` + `hyperliquid-sdk-2.md`) is ~400KB+ and consumes significant context when loaded. Developers need a way to:
1. Quickly discover which API to use for a specific task
2. Understand method purposes without reading full OpenAPI schemas
3. Navigate to detailed docs only when needed

## User Stories

- As a developer, I want a quick reference to find the right API for my task without loading full docs
- As Claude, I want minimal context usage when answering "which API should I use for X"
- As a developer, I want use-case-based organization so I can find methods by what I want to do

## Requirements

### Must Have

- [ ] Single markdown file under 15KB for minimal context usage
- [ ] Use-case/task-based organization (not alphabetical)
- [ ] One-line description per method
- [ ] Clear categorization: Info (read), Exchange (write), Subscription (realtime)
- [ ] Reference to full docs file for detailed schemas

### Nice to Have

- [ ] Common parameters noted inline (e.g., "requires `user` address")
- [ ] Related methods grouped together
- [ ] Example use case scenarios as section headers

## File Structure

Create: `docs/hyperliquid-sdk-directory.md`

## Proposed Organization

### By Task Category

```
1. Market Data (prices, orderbook, trades)
2. Account State (balances, positions, PnL)
3. Order Management (place, cancel, modify)
4. Position Management (leverage, margin, close)
5. Transfers & Withdrawals
6. Real-time Subscriptions
7. Historical Data (fills, funding, candles)
8. Staking & Delegation
9. Spot Trading
10. Advanced (vaults, sub-accounts, multi-sig)
```

### Method Entry Format

```markdown
### Get Order Book
**Info:** `l2Book({ coin, nSigFigs?, mantissa? })` - L2 order book with optional aggregation
**Sub:** `l2Book({ coin })` - Real-time order book updates
```

## Technical Spec

### Directory File Structure

```markdown
# Hyperliquid SDK Quick Reference

> Full documentation: `docs/hyperliquid-sdk-1.md`, `docs/hyperliquid-sdk-2.md`

## Clients
- `InfoClient` - Read-only queries (HTTP)
- `ExchangeClient` - Signed actions (HTTP, requires wallet)
- `SubscriptionClient` - WebSocket subscriptions

---

## 1. Market Data

### Prices
- **Info:** `allMids()` - All mid prices
- **Info:** `meta()` - Asset metadata (decimals, leverage limits)
- **Sub:** `allMids` - Real-time price updates

### Order Book
- **Info:** `l2Book({ coin, nSigFigs?, mantissa? })` - L2 snapshot
- **Sub:** `l2Book({ coin, nSigFigs?, mantissa? })` - Real-time updates
- **Sub:** `bbo({ coin })` - Best bid/offer only

### Trades
- **Info:** `recentTrades({ coin })` - Recent public trades
- **Sub:** `trades({ coin })` - Real-time trades

---

## 2. Account State

### Perp Account
- **Info:** `clearinghouseState({ user })` - Positions, margin, PnL
- **Sub:** `clearinghouseState({ user })` - Real-time account updates
- **Sub:** `activeAssetData({ user, coin })` - Per-asset leverage, available-to-trade

### Spot Account
- **Info:** `spotClearinghouseState({ user })` - Spot balances
- **Sub:** `spotState({ user })` - Real-time spot balance

### Orders
- **Info:** `openOrders({ user })` - All open orders
- **Info:** `frontendOpenOrders({ user })` - Orders with display info
- **Info:** `orderStatus({ user, oid })` - Single order status
- **Sub:** `openOrders({ user })` - Real-time open orders
- **Sub:** `orderUpdates({ user })` - Order status changes

---

## 3. Order Management

### Place Orders
- **Exchange:** `order({ orders, grouping, builder? })` - Place limit/market/trigger orders
  - `grouping`: "na" | "normalTpsl" | "positionTpsl"
  - Order types: limit (Gtc/Ioc/Alo), trigger (tp/sl)

### Cancel Orders
- **Exchange:** `cancel({ cancels })` - Cancel by asset + oid
- **Exchange:** `cancelByCloid({ cancels })` - Cancel by client order ID
- **Exchange:** `scheduleCancel({ time? })` - Dead man's switch

### Modify Orders
- **Exchange:** `modify({ oid, order })` - Modify single order
- **Exchange:** `batchModify({ modifies })` - Modify multiple orders

### TWAP Orders
- **Exchange:** `twapOrder({ ... })` - Place TWAP order
- **Exchange:** `twapCancel({ ... })` - Cancel TWAP
- **Info:** `twapHistory({ user })` - TWAP history
- **Sub:** `twapStates({ user })` - Real-time TWAP state

---

## 4. Position Management

### Leverage
- **Exchange:** `updateLeverage({ asset, isCross, leverage })` - Set leverage
- **Sub:** `activeAssetData({ user, coin })` - Current leverage + max trade sizes

### Margin
- **Exchange:** `updateIsolatedMargin({ asset, isBuy, ntli })` - Adjust isolated margin

---

## 5. Transfers & Withdrawals

### Internal Transfers
- **Exchange:** `usdSend({ destination, amount, ... })` - Send USDC to address
- **Exchange:** `spotSend({ destination, token, amount, ... })` - Send spot tokens
- **Exchange:** `sendAsset({ ... })` - Transfer between DEXs/spot/sub-accounts

### Withdrawals
- **Exchange:** `withdraw3({ destination, amount, ... })` - Withdraw USDC

### USD Class Transfers
- **Exchange:** `usdClassTransfer({ ... })` - Transfer between perp/spot USD

---

## 6. Real-time Subscriptions

### Market Data
- `allMids` - All mid prices
- `l2Book({ coin })` - Order book
- `bbo({ coin })` - Best bid/offer
- `trades({ coin })` - Public trades
- `candle({ coin, interval })` - Candlestick updates
- `assetCtxs` - All perp asset contexts
- `spotAssetCtxs` - All spot asset contexts

### User Data
- `clearinghouseState({ user })` - Account state
- `spotState({ user })` - Spot balances
- `openOrders({ user })` - Open orders
- `orderUpdates({ user })` - Order status changes
- `userFills({ user })` - Trade fills
- `userFundings({ user })` - Funding payments
- `userEvents({ user })` - All user events
- `notification({ user })` - Notifications
- `activeAssetData({ user, coin })` - Per-asset data

---

## 7. Historical Data

### Fills & Trades
- **Info:** `userFills({ user })` - Recent fills
- **Info:** `userFillsByTime({ user, startTime, endTime? })` - Fills by time range

### Funding
- **Info:** `fundingHistory({ coin, startTime, endTime? })` - Funding rates
- **Info:** `userFunding({ user, startTime, endTime? })` - User funding payments
- **Info:** `predictedFundings()` - Predicted funding rates

### Candles
- **Info:** `candleSnapshot({ coin, interval, startTime, endTime? })` - OHLCV data
  - Intervals: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 8h, 12h, 1d, 3d, 1w, 1M

### Orders
- **Info:** `historicalOrders({ user })` - Order history
- **Sub:** `userHistoricalOrders({ user })` - Real-time order history

---

## 8. Staking & Delegation

- **Info:** `delegations({ user })` - Current delegations
- **Info:** `delegatorSummary({ user })` - Delegation summary
- **Info:** `delegatorHistory({ user })` - Delegation history
- **Info:** `delegatorRewards({ user })` - Staking rewards
- **Info:** `validatorSummaries()` - All validators
- **Exchange:** `tokenDelegate({ ... })` - Delegate/undelegate
- **Exchange:** `claimRewards()` - Claim staking rewards

---

## 9. Spot Trading

- **Info:** `spotMeta()` - Spot asset metadata
- **Info:** `spotMetaAndAssetCtxs()` - Spot meta + contexts
- **Info:** `spotClearinghouseState({ user })` - Spot balances
- **Exchange:** `spotUser({ ... })` - Spot-specific actions
- **Sub:** `spotAssetCtxs` - Spot asset contexts
- **Sub:** `spotState({ user })` - Spot balances

---

## 10. Advanced Features

### Sub-Accounts
- **Info:** `subAccounts({ user })` - List sub-accounts
- **Exchange:** `createSubAccount({ name })` - Create sub-account
- **Exchange:** `subAccountTransfer({ ... })` - Transfer to/from sub-account
- **Exchange:** `subAccountModify({ ... })` - Modify sub-account

### Vaults
- **Info:** `vaultDetails({ vaultAddress })` - Vault info
- **Info:** `userVaultEquities({ user })` - User vault positions
- **Exchange:** `vaultTransfer({ ... })` - Deposit/withdraw from vault

### Agent Wallets
- **Exchange:** `approveAgent({ ... })` - Approve agent wallet
- **Info:** `extraAgents({ user })` - List approved agents

### Multi-Sig
- **Info:** `userToMultiSigSigners({ user })` - Multi-sig signers
- **Exchange:** `convertToMultiSigUser({ ... })` - Convert to multi-sig

---

## Utilities

### Symbol Conversion
```typescript
import { SymbolConverter } from "@nktkas/hyperliquid";
const converter = new SymbolConverter({ transport });
converter.getAssetId("BTC"); // => 0
converter.getSzDecimals("BTC"); // => 5
```

### Price/Size Formatting
```typescript
import { formatPrice, formatSize } from "@nktkas/hyperliquid";
formatPrice("1234.5", 4, 5); // Format to 4 sig figs, 5 decimals
formatSize("0.001", 5); // Format size with 5 decimals
```

---

## Common Patterns

### Place Limit Order
```typescript
await exchangeClient.order({
  orders: [{
    a: 0, b: true, p: "95000", s: "0.01", r: false,
    t: { limit: { tif: "Gtc" } }
  }],
  grouping: "na"
});
```

### Place Order with TP/SL
```typescript
await exchangeClient.order({
  orders: [mainOrder, tpOrder, slOrder],
  grouping: "positionTpsl" // Links TP/SL to position
});
```

### Market Order (IOC)
```typescript
{ ...order, t: { limit: { tif: "Ioc" } }, p: slippagePrice }
```
