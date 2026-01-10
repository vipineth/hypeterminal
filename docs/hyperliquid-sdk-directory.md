# Hyperliquid SDK Directory

> **Package:** `@nktkas/hyperliquid`

## How to Use This Documentation

### Step 1: Find Method by Intent (This File)
Scan the "Want to..." tables below to find the right method for your task.

### Step 2: Understand the Type
- **(I)** = Info method → read-only, no wallet needed, use `InfoClient`
- **(E)** = Exchange method → requires signing, use `ExchangeClient` with wallet
- **(S)** = Subscription → real-time WebSocket stream, use `SubscriptionClient`

### Step 3: Get Full Parameter Schema (Full Docs)
Once you know which method to use, look up the complete OpenAPI schema in:

| Content | File | Lines |
|---------|------|-------|
| Intro, Transports, Clients, Errors | `hyperliquid-sdk-1.md` | 1-1035 |
| **Info Methods** (all read-only) | `hyperliquid-sdk-1.md` | 1036-1775 |
| **Exchange Methods** (signed actions) | `hyperliquid-sdk-1.md` + `sdk-2.md` | 1776-2054 + 1-220 |
| **Subscription Methods** (WebSocket) | `hyperliquid-sdk-2.md` | 221-540 |
| **Signing Utilities** | `hyperliquid-sdk-2.md` | 799-1060 |
| Symbol Converter, Formatting | `hyperliquid-sdk-2.md` | 543-798 |

---

## Clients
| Client | Purpose | Needs Wallet |
|--------|---------|--------------|
| `InfoClient` | Read-only queries | No |
| `ExchangeClient` | Signed actions (orders, transfers) | Yes |
| `SubscriptionClient` | Real-time WebSocket streams | No |

**Wallet options:** `privateKeyToAccount("0x...")` (viem), `new Wallet("0x...")` (ethers), `new PrivateKeySigner("0x...")` (built-in, no deps)

---

## Market Data

| Want to... | Method | Type |
|------------|--------|------|
| Get all mid prices | `allMids({dex?})` | I |
| Stream mid prices | `allMids` | S |
| Get asset metadata (decimals, leverage) | `meta()` | I |
| Get prices + funding + OI together | `metaAndAssetCtxs()` | I |
| Stream asset contexts (funding, OI, volume) | `assetCtxs` | S |
| Get L2 order book snapshot | `l2Book({coin, nSigFigs?, mantissa?})` | I |
| Stream order book updates | `l2Book({coin, nSigFigs?, mantissa?})` | S |
| Stream best bid/offer only | `bbo({coin})` | S |
| Get recent public trades | `recentTrades({coin})` | I |
| Stream public trades | `trades({coin})` | S |
| Get historical candles | `candleSnapshot({coin, interval, startTime, endTime?})` | I |
| Stream candle updates | `candle({coin, interval})` | S |

**Candle intervals:** 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 8h, 12h, 1d, 3d, 1w, 1M

---

## Account State

| Want to... | Method | Type |
|------------|--------|------|
| Get perp positions + margin + PnL | `clearinghouseState({user, dex?})` | I |
| Stream perp account state | `clearinghouseState({user})` | S |
| Get spot token balances | `spotClearinghouseState({user})` | I |
| Stream spot balances | `spotState({user})` | S |
| Get everything (positions, orders, fills) | `webData2({user})` | I |
| Stream everything | `webData2({user})` | S |
| Get per-asset leverage + max trade sizes | `activeAssetData({user, coin})` | S |
| Get portfolio PnL breakdown | `portfolio({user})` | I |
| Get user display name | `userDetails({user})` | I |

---

## Orders

| Want to... | Method | Type |
|------------|--------|------|
| Place limit/market/trigger orders | `order({orders, grouping, builder?})` | E |
| Place TWAP order | `twapOrder({a, b, s, r, m, t})` | E |
| Get my open orders | `openOrders({user})` | I |
| Get open orders with display info | `frontendOpenOrders({user})` | I |
| Stream open orders | `openOrders({user, dex?})` | S |
| Stream order status changes | `orderUpdates({user})` | S |
| Get single order status | `orderStatus({user, oid})` | I |
| Get order history | `historicalOrders({user})` | I |
| Cancel by order ID | `cancel({cancels: [{a, o}]})` | E |
| Cancel by client order ID | `cancelByCloid({cancels: [{asset, cloid}]})` | E |
| Cancel TWAP | `twapCancel({a, t})` | E |
| Set dead man's switch (auto-cancel) | `scheduleCancel({time?})` | E |
| Modify order | `modify({oid, order})` | E |
| Modify multiple orders | `batchModify({modifies})` | E |

**Order structure:** `{a: assetId, b: isBuy, p: price, s: size, r: reduceOnly, t: orderType, c?: cloid}`
**Order types:** `{limit: {tif: "Gtc"|"Ioc"|"Alo"}}` or `{trigger: {isMarket, triggerPx, tpsl: "tp"|"sl"}}`
**Grouping:** `"na"` (standalone), `"normalTpsl"` (fixed TP/SL size), `"positionTpsl"` (TP/SL scales with position)

---

## Position & Margin

| Want to... | Method | Type |
|------------|--------|------|
| Set leverage for asset | `updateLeverage({asset, isCross, leverage})` | E |
| Add/remove isolated margin | `updateIsolatedMargin({asset, isBuy, ntli})` | E |
| Get margin tier requirements | `marginTable({tableId})` | I |
| Get max market order sizes | `maxMarketOrderNtls()` | I |

---

## Transfers & Withdrawals

| Want to... | Method | Type |
|------------|--------|------|
| Send USDC to address | `usdSend({destination, amount, ...})` | E |
| Send spot tokens | `spotSend({destination, token, amount, ...})` | E |
| Transfer between DEXs/sub-accounts | `sendAsset({destination, sourceDex, destinationDex, token, amount})` | E |
| Move USDC between perp↔spot | `usdClassTransfer({amount, toPerp, ...})` | E |
| Withdraw to Arbitrum L1 | `withdraw3({destination, amount, ...})` | E |
| Validate transfer before sending | `preTransferCheck({user, destination, amount})` | I |

---

## Fills & Funding

| Want to... | Method | Type |
|------------|--------|------|
| Get my recent fills | `userFills({user, aggregateByTime?})` | I |
| Get fills by time range | `userFillsByTime({user, startTime, endTime?})` | I |
| Stream my fills | `userFills({user})` | S |
| Get historical funding rates | `fundingHistory({coin, startTime, endTime?})` | I |
| Get my funding payments | `userFunding({user, startTime, endTime?})` | I |
| Get predicted next funding | `predictedFundings({dex?})` | I |
| Stream my funding payments | `userFundings({user})` | S |
| Get ledger (deposits, withdrawals, liquidations) | `userNonFundingLedgerUpdates({user, startTime, endTime?})` | I |
| Stream all user events | `userEvents({user})` | S |

---

## Sub-Accounts

| Want to... | Method | Type |
|------------|--------|------|
| List my sub-accounts | `subAccounts({user})` | I |
| Create sub-account | `createSubAccount({name})` | E |
| Transfer USD to/from sub-account | `subAccountTransfer({subAccountUser, isDeposit, usd})` | E |
| Transfer spot to/from sub-account | `subAccountSpotTransfer({subAccountUser, isDeposit, token, amount})` | E |
| Rename sub-account | `subAccountModify({subAccountUser, name})` | E |

---

## Vaults

| Want to... | Method | Type |
|------------|--------|------|
| Get vault details | `vaultDetails({vaultAddress, user?})` | I |
| Get all vaults | `vaultSummaries()` | I |
| Get top performing vaults | `leadingVaults({...})` | I |
| Get my vault positions | `userVaultEquities({user})` | I |
| Deposit/withdraw from vault | `vaultTransfer({vaultAddress, isDeposit, usd})` | E |
| Create vault | `createVault({...})` | E |
| Modify vault settings | `vaultModify({vaultAddress, ...})` | E |

---

## Staking

| Want to... | Method | Type |
|------------|--------|------|
| Get my delegations | `delegations({user})` | I |
| Get delegation summary | `delegatorSummary({user})` | I |
| Get staking rewards | `delegatorRewards({user})` | I |
| Get all validators | `validatorSummaries()` | I |
| Delegate/undelegate tokens | `tokenDelegate({validator, amount, isUndelegate})` | E |
| Claim staking rewards | `claimRewards()` | E |

---

## Agents & Builders

| Want to... | Method | Type |
|------------|--------|------|
| Approve agent wallet for trading | `approveAgent({agentAddress, agentName?, nonce})` | E |
| List my approved agents | `extraAgents({user})` | I |
| Approve builder fee | `approveBuilderFee({builder, maxFeeRate, nonce})` | E |
| Check max approved builder fee | `maxBuilderFee({user, builder})` | I |

**Using builder in orders:** `builder: {b: "0xAddress", f: feeRate}` where f is tenths of basis point (10 = 0.01%)

---

## Account Info

| Want to... | Method | Type |
|------------|--------|------|
| Get my fee tier/rates | `userFees({user})` | I |
| Get API rate limit status | `userRateLimit({user})` | I |
| Get my referral info | `referral({user})` | I |
| Set referral code I'm using | `setReferrer({code})` | E |
| Register as referrer | `registerReferrer({code})` | E |
| Check VIP status | `isVip({user})` | I |
| Set display name | `setDisplayName({displayName})` | E |

---

## Advanced

### Multi-sig
| Want to... | Method | Type |
|------------|--------|------|
| Get multi-sig signers | `userToMultiSigSigners({user})` | I |
| Convert to multi-sig account | `convertToMultiSigUser({...})` | E |

### DEX Abstraction (HIP-3)
| Want to... | Method | Type |
|------------|--------|------|
| Check if DEX abstraction enabled | `userDexAbstraction({user})` | I |
| Enable/disable DEX abstraction | `userDexAbstraction({...})` | E |

### Explorer/Blockchain
| Want to... | Method | Type |
|------------|--------|------|
| Get block details | `blockDetails({height})` | I |
| Get transaction details | `txDetails({hash})` | I |
| Stream blocks | `explorerBlock` | S |
| Stream transactions | `explorerTxs` | S |

### Token/Perp Deployment
| Want to... | Method | Type |
|------------|--------|------|
| Deploy spot token | `spotDeploy({...})` | E |
| Deploy perp | `perpDeploy({...})` | E |
| Get token details | `tokenDetails({tokenId})` | I |
| Get deploy auction status | `spotPairDeployAuctionStatus`, `perpDeployAuctionStatus` | I |

### DEX Info
| Want to... | Method | Type |
|------------|--------|------|
| Get all perp DEXs | `perpDexs()` | I |
| Get perp DEX status | `perpDexStatus({dex})` | I |
| Get assets at open interest cap | `perpsAtOpenInterestCap({dex?})` | I |
| Get exchange status | `exchangeStatus()` | I |

### Liquidations
| Want to... | Method | Type |
|------------|--------|------|
| Get liquidatable accounts | `liquidatable()` | I |

---

## Signing (Advanced)

`ExchangeClient` handles signing automatically. For custom wallet integrations:

```typescript
import { signL1Action, signUserSignedAction, signMultiSigAction, PrivateKeySigner } from "@nktkas/hyperliquid/signing";
```

| Function | Use for |
|----------|---------|
| `signL1Action` | Orders, cancels, leverage, TWAP, vault ops |
| `signUserSignedAction` | Withdraw, usdSend, spotSend, approveAgent (EIP-712) |
| `signMultiSigAction` | Multi-sig operations |

**Params:** `{wallet, action, nonce, isTestnet?, vaultAddress?, expiresAfter?}`

---

## Utilities

### SymbolConverter
```typescript
const converter = await SymbolConverter.create({transport});
converter.getAssetId("BTC");        // 0 (perp)
converter.getAssetId("HYPE/USDC");  // 10107 (spot)
converter.getSzDecimals("BTC");     // 5
await converter.reload();           // Refresh after new listings
```

**Asset ID ranges:** Perp: 0-9999, Spot: 10000+, Builder DEX: 100000+

### Formatting
```typescript
formatPrice(price, szDecimals, "perp"|"spot"); // Max 5 sig figs
formatSize(size, szDecimals);                   // Truncate to decimals
```

---

## Code Patterns

```typescript
// Limit order
await exchangeClient.order({
  orders: [{a: 0, b: true, p: "95000", s: "0.01", r: false, t: {limit: {tif: "Gtc"}}}],
  grouping: "na"
});

// Market order (IOC with slippage)
await exchangeClient.order({
  orders: [{a: 0, b: true, p: slippagePrice, s: "0.01", r: false, t: {limit: {tif: "Ioc"}}}],
  grouping: "na"
});

// Order with TP/SL
await exchangeClient.order({
  orders: [
    {a: 0, b: true, p: "95000", s: "0.01", r: false, t: {limit: {tif: "Gtc"}}},
    {a: 0, b: false, p: "100000", s: "0.01", r: true, t: {trigger: {isMarket: true, triggerPx: "100000", tpsl: "tp"}}},
    {a: 0, b: false, p: "90000", s: "0.01", r: true, t: {trigger: {isMarket: true, triggerPx: "90000", tpsl: "sl"}}}
  ],
  grouping: "positionTpsl"
});

// Cancel all orders for asset
const orders = await infoClient.openOrders({user});
await exchangeClient.cancel({cancels: orders.filter(o => o.coin === "BTC").map(o => ({a: assetId, o: o.oid}))});

// Subscribe to order book
const sub = await subscriptionClient.l2Book({coin: "BTC"}, (book) => console.log(book.levels[0][0]));
await sub.unsubscribe();
```
