# Hyperliquid integration research (HIP-3, abstraction modes, order correctness)

Goal: re-found HypeTerminal's Hyperliquid integration on the current official docs so it never sends a wrong order or strands funds. The trigger was a failed NVDA trade on a builder-deployed (HIP-3) dex.

Date of research: 2026-11-13. Every claim is tagged **[doc]** (GitBook, URL given), **[live]** (curl against `https://api.hyperliquid.xyz/info`, raw output saved under `scratchpad/hl/`), **[sdk]** (installed `@nktkas/hyperliquid@0.33.3` source), **[code]** (this repo), or **[inferred]**.

Doc base: `https://hyperliquid.gitbook.io/hyperliquid-docs/`. Every page is also available as raw markdown at the same URL plus `.md`. Copies are in `scratchpad/hl/docs/`.

---

## 0. Headline findings

1. **The NVDA failure is most likely a funding problem, not an order-encoding problem. This is an inference with a cheap confirm.**
   - Under standard mode (`userAbstraction` = `"disabled"` or `null`), each HIP-3 dex is a separate clearinghouse with its own balance. USDC in the main perp account does not margin `xyz:NVDA` **[doc]** ([margining](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margining), [abstraction modes](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes)).
   - The app has no path to fund a HIP-3 dex. `transfer-modal.tsx:80-86` only moves between `""` and `"spot"`. `send-modal.tsx:153` hardcodes `destinationDex: ""`. Nothing in `apps/terminal/src` calls `userSetAbstraction` or `agentSetAbstraction` **[code]**.
   - So a standard-mode user with USDC in the main dex gets `Insufficient margin to place order.` on xyz:NVDA **[inferred]**.
   - **Confirm:** query `{"type":"userAbstraction","user":U}` and `{"type":"clearinghouseState","user":U,"dex":"xyz"}` for the affected user. If the mode is `"disabled"` or `null` and the xyz `accountValue` is about 0, this is the cause.
2. **The asset-id math in the app is correct [code + live].**
   - `helper.ts:17` and `hl-react/src/asset-id.ts:18` both compute `100000 + dexIndex*10000 + index`.
   - `dexIndex` is the position in the `perpDexs` array. `allPerpMetas` has the same order (11 entries each, index 1 = xyz) **[live]**. `use-markets.tsx:103-113` walks the raw `meta.universe` index and skips `isDelisted` only after the index is fixed, so delisted entries do not shift ids **[code]**.
   - xyz:NVDA = **110002**. io:NVDA = **200014**.
3. **`balances.ts:55-57` treats `dexAbstraction` like unified/portfolio, as "quote shared with spot". That conflicts with the docs, but it is not a confirmed bug [code vs doc].** Commit `516b41c` (2026-11-12) added it on purpose. Under that mode `getPerpBalanceRows` (`balances.ts:155-168`) reports **spot** USDC as the perp balance. Settling it needs one live `dexAbstraction` account. None turned up among the 12 sampled NVDA traders.
   - Under DEX abstraction, USDC-collateral HIP-3 dexes pull from the **validator-operated USDC perps balance**. Only non-USDC dexes pull from spot ([exchange endpoint, "Enable HIP-3 DEX abstraction"](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint)).
   - The mode is also "discontinued" and "cross margin on HIP-3 DEXs does not behave intuitively" ([abstraction modes](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes)).
4. **Per-dex `clearinghouseState.withdrawable` is meaningless for unified and portfolio-margin users [doc + live].**
   - Live unified user `0x8c60…`: xyz `withdrawable` = `7.44`, but spot USDC total = `70303.54` and `activeAssetData.availableToTrade` = `69015.76`.
   - Docs: "unified account and portfolio margin show all balances and holds in the spot clearinghouse state. Individual perp dex user states are not meaningful."
   - Use `activeAssetData` (mode-aware) or spot balances plus `tokenToAvailableAfterMaintenance` for sizing.
5. **SDK 0.33.3 is the latest on npm and JSR. There is nothing to upgrade [live: `npm view`, jsr meta].** One type gap is listed in section 5.

---

## 1. HIP-3 collateral, funding, and abstraction modes

### Which dex lists NVDA (live, `metaAndAssetCtxs` per dex)

| coin | dex idx | asset id | collateral (token idx → name) | szDec | maxLev | marginMode | status |
|---|---|---|---|---|---|---|---|
| `xyz:NVDA` | 1 | 110002 | 0 → **USDC** | 3 | 20 | none (cross allowed) | live, OI 2.56M, mark 167.27 |
| `io:NVDA` | 10 | 200014 | 0 → USDC | 3 | 25 | none | live, small |
| `flx:NVDA` | 2 | 120001 | 360 → USDH | 2 | 10 | none | `isDelisted: true` |
| `km:NVDA` | 5 | 150015 | 360 → USDH | 3 | 12 | strictIsolated | delisted |
| `cash:NVDA` | 7 | 170002 | 268 → USDT0 | 3 | 20 | none | delisted |
| `mkts:NVDA` | 9 | 190015 | 0 → USDC | 3 | 12 | strictIsolated | delisted |

- Collateral token ids come from `spotMeta.tokens` **[live]**: 0=USDC, 360=USDH, 235=USDE, 268=USDT0.
- Dex collaterals **[live]**: xyz, abcd, para, mkts and io use USDC. flx, vntl and km use USDH. hyna uses USDE. cash uses USDT0.
- xyz:NVDA caps **[live]**:
  - `perpDexs[1].assetToStreamingOiCap` = `1000000000.0`.
  - `perpDexLimits{dex:"xyz"}`: `totalOiCap` 10B, `oiSzCapPerPerp` 20B, `maxTransferNtl` 3B.
  - Funding multiplier 0.5.
  - `perpsAtOpenInterestCap{dex:"xyz"}` = `[]`.
- The UI must hide or block `isDelisted` assets **[inferred]**. Four of the six NVDA listings are delisted, so a symbol search for "NVDA" can land on a dead market.

### Collateral rule

- "Any quote asset can be used as the collateral asset for a dex." Each perp dex "features independent margining, order books, and deployer settings" **[doc]** ([HIP-3](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals)).
- `meta{dex}.collateralToken` is the spot token index of that dex's collateral **[live]**.

### How funds reach a dex, per mode

Source: [account-abstraction-modes](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes) and [margining § HIP-3 Margin Modes](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margining).

| mode (`userAbstraction` value) | where xyz:NVDA margin comes from | cross margin sharing | what the client must do |
|---|---|---|---|
| **Standard / Manual** (`"disabled"`; live also returns `null`, see note) | That dex's own clearinghouse balance | Only within the same dex | Move collateral with `sendAsset` (`sourceDex` → `destinationDex:"xyz"`). Only the dex's collateral token can move in or out. |
| **Unified account** (`"unifiedAccount"`, "recommended for most users") | The single **spot** balance of the collateral token. USDC spot funds main perps, xyz, and USDC spot pairs. USDT spot funds cash. | Across all dexes with the same collateral | No transfer. Read balances from `spotClearinghouseState`. Per-dex states are "not meaningful". |
| **Portfolio margin** (`"portfolioMargin"`) | One portfolio over HYPE, BTC, USDC and USDT, with borrowing against LTV | All cross positions plus spot in one account. "All HIP-3 DEXs are included." | Eligibility applies: >$5M weighted volume or >$10k account value, and <$25M account value. Falls back to non-PM behaviour when caps are hit. |
| **DEX abstraction** (`"dexAbstraction"`, **discontinued**) | USDC-collateral dexes auto-pull from the **main USDC perps** balance. Others pull from spot. Collateral returns to the same source on release. | Unintuitive on HIP-3 | Don't offer it. Migrate users to unified or standard. |

Other documented constraints **[doc]**:
- Unified and PM are limited to **50k user actions/day**. Standard has no cap.
- Builder-code recipient addresses must be in **standard** mode to accrue fees.
- Sub-accounts are separate under PM.

**Note on `null` [live].**
- `userAbstraction` returned `null` for 4 of 12 active xyz:NVDA traders.
- One of them (`0x88ff…`) holds main-dex BTC with a 1.5 USDC account value, and a separate xyz account with a 9968 USDC account value. That is standard behaviour.
- The docs list the values `"unifiedAccount" | "portfolioMargin" | "disabled" | "default" | "dexAbstraction"` and never define `"default"`. Treat `null` and `"default"` as standard **[inferred]**.

**Note on `userDexAbstraction` [live].** The info query `{"type":"userDexAbstraction","user":…}` is still documented, but it returns `Failed to deserialize the JSON body into the target type`. Don't rely on it. Use `userAbstraction`.

### Transfer actions

All from the [exchange endpoint](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint) **[doc]**.
- **`sendAsset`.** User-signed EIP-712 (`HyperliquidTransaction:SendAsset` **[sdk]**). Fields: `destination, sourceDex, destinationDex, token ("NAME:0xtokenId"), amount, fromSubAccount, nonce`. `""` is the default USDC perp dex and `"spot"` is spot. "Only the collateral token can be transferred to or from a perp DEX." To fund xyz from the main dex: `sourceDex:"", destinationDex:"xyz", token:"USDC:0x6d1e7cde53ba9467b783cb7c530ce054"`. For flx you would move USDH from `"spot"` to `"flx"`.
- **`agentSendAsset`.** Same as above but agent-signable (an L1 action). `destination` must equal the source address. This is the way to fund a dex from an API wallet without a wallet popup.
- **`usdClassTransfer`.** Moves USDC between spot and the **main** perp only. No dex field. Legacy for this purpose.
- Margin transfer rule **[doc]**: removing margin requires `max(initial_margin_required, 0.1 * total_position_value)` to remain ([margining](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margining)).

### Enabling a mode

All **[doc]** (exchange endpoint) and **[sdk]**.
- **`userSetAbstraction`.**
  - User-signed EIP-712 `HyperliquidTransaction:UserSetAbstraction`.
  - Fields: `{hyperliquidChain, signatureChainId, user, abstraction: "disabled"|"unifiedAccount"|"portfolioMargin", nonce}`.
  - `user` "can be a sub-account of the user".
  - Needs the **main wallet** signature (user-signed actions are signed by the account key).
- **`agentSetAbstraction`.**
  - An L1 action, so an **API/agent wallet can sign it**.
  - `{"type":"agentSetAbstraction","abstraction":"i"|"u"|"p"}`, where i=disabled, u=unified, p=portfolio. The SDK maps the long names to these letters.
- **`userDexAbstraction` / `agentEnableDexAbstraction`.** Deprecated. The agent variant only goes `null → true`.
- Read the current mode with `{"type":"userAbstraction","user":U}`.

---

## 2. Order placement on builder dexes

- **Asset id [doc]** ([asset-ids](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/asset-ids)): `100000 + perp_dex_index * 10000 + index_in_meta`. `perp_dex_index` is the index in `perpDexs`, where index 0 is `null` (the main dex). `index_in_meta` is the index in `meta{dex}.universe`, and it **includes delisted entries**, so never filter before indexing **[inferred]**. Main perps use the bare meta index. Spot uses `10000 + spotMeta.universe index`. Outcomes use `100000000 + 10*outcome + side`.
- **Coin naming [doc + live].** HIP-3 names are always `{dex}:{coin}` (e.g. `xyz:NVDA`) in meta, fills, l2Book, candles, trades, activeAssetData and fastAssetCtxs. `l2Book{coin:"xyz:NVDA"}` works **[live]**. Candle snapshots need the prefix **[doc]**.
- **Margin modes [doc]** ([perpetuals info](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals), [margining](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margining)):
  - `marginMode: "strictIsolated"` means isolated only, and margin cannot be removed.
  - `"noCross"` means isolated only, and margin removal is allowed.
  - `onlyIsolated: true` is **deprecated** and means either of the two.
  - A missing field means cross is allowed.
  - Enabling cross on a HIP-3 asset is irreversible for the deployer.
  - Live xyz: 115 `noCross`, 7 `strictIsolated`, 22 unrestricted (xyz:NVDA is unrestricted) **[live]**.
- **Code inconsistency [code].** `hl-react/src/types/markets.ts:12 isPerpOnlyIsolated` checks only the deprecated `onlyIsolated`. `capabilities.ts:24` correctly checks `onlyIsolated || marginMode in {noCross, strictIsolated}`. `isPerpOnlyIsolated` has no callers besides its export, so it is not currently a live bug, but it is a trap.
- **Leverage [doc].**
  - `updateLeverage {asset, isCross, leverage}`. Leverage is an **integer** in 1..maxLeverage.
  - "Leverage is only checked upon opening a position."
  - For isolated-only assets `isCross` must be false **[inferred from marginMode semantics]**.
  - Set leverage and mode **before** the order, because the order uses the leverage stored for the asset.
  - Use `topUpIsolatedOnlyMargin {asset, leverage}` to target a leverage on isolated-only positions.
  - Where `marginTableId < 50` and `marginTables` has no matching entry (e.g. xyz id 20), it looks like a default single-tier table at that leverage **[inferred, live shows no entry]**.
- **Price [doc]** ([tick-and-lot-size](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size)): at most 5 significant figures and at most `6 - szDecimals` decimals for perps (8 for spot). Integers are always valid. For xyz:NVDA (szDec 3) that means at most 3 decimals and 5 sig figs, so `167.27` is valid and `167.275` is not. Strip trailing zeros before signing.
- **Size [doc].** Round to `szDecimals`. For xyz:NVDA, `1.001` is valid and `1.0001` is not.
- **Min notional [doc]** ([error responses](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/error-responses)): `Order must have minimum value of $10.` For dexes collateralised in USDH, USDT0 or USDE it is presumably 10 units of collateral **[inferred]**. The spot analogue is the documented `10 {quote_token}`.
- **Market orders.**
  - The protocol has no native market order. Send an aggressive IOC limit.
  - The official Python SDK uses `DEFAULT_SLIPPAGE = 0.05`. It prices from `allMids(dex)[coin]` times (1 ± slippage), then rounds to 5 sig figs and `(6 or 8) - szDecimals` decimals **[source: hyperliquid-python-sdk `exchange.py` L81, L112-131]**. Use `allMids` with `dex:"xyz"`, because the default `allMids` only covers the first dex.
  - Prices far from the reference fail with `Order price too far from oracle` or are rejected in pre-validation **[doc]**.
  - `maxMarketOrderNtls` returns `[[25,"30000000.0"],[20,"5000000.0"],[10,"2000000.0"],[1,"500000.0"]]` **[live, undocumented in GitBook]**. Reading it as a max market-order notional per max-leverage bucket is **[inferred]**.
- **TP/SL [doc]** ([tp-sl](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/take-profit-and-stop-loss-orders-tp-sl)):
  - Triggers on **mark** price.
  - Market TP/SL slippage tolerance is 10%.
  - `grouping: "normalTpsl"` ties children to the parent. Children stay untriggered until the parent fills, and they are cancelled with it.
  - `"positionTpsl"` sizes to the position.
  - Non-reduce-only TP/SL orders are rejected in pre-validation.
  - At ≥1000 open orders, reduce-only and trigger orders are rejected.
- **HIP-3-relevant error strings [doc]**:
  - `Order would increase open interest while open interest is capped`
  - `Order rejected due to price more aggressive than oracle while at open interest cap`
  - `Order would increase open interest too quickly`
  - `Order price too far from oracle`
  - `Insufficient margin to place order.`, which is the likely NVDA error under standard mode
  - `Order would cause position to exceed margin tier limit at current leverage`
  - Signature mismatch shows up as `User or API Wallet 0x… does not exist.` or `Must deposit before performing actions.` ([signing](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/signing)).
- **Fees [doc].** HIP-3 deployers add 0-300% of the fee share. Growth mode (xyz:NVDA has `growthMode: "enabled"`) cuts fees, rebates and rate-limit contribution by about 90% ([fees](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees)).

---

## 3. Queries that need `dex`

| query | `dex` param? | behaviour | evidence |
|---|---|---|---|
| `meta`, `metaAndAssetCtxs` | yes | per dex | [doc] perpetuals |
| `allPerpMetas` | n/a | all dexes, same order as `perpDexs` | [doc] + [live] |
| `clearinghouseState` (info and ws) | yes | **per dex**. Main returned acctVal 99,979, `dex:"xyz"` returned 201,477 for `0x0b1a…` | [doc] + [live] |
| `openOrders`, `frontendOpenOrders` | yes | **per dex**. Spot orders only appear with the first dex. `0x88ff…`: main = 0, xyz = 29 | [doc] + [live] |
| `allMids` (info and ws) | yes | per dex. Spot mids only with the first dex. | [doc] |
| `twapStates` (ws) | yes | per dex | [doc] |
| `perpsAtOpenInterestCap`, `perpDexLimits`, `perpDexStatus` | yes (required for limits) | per dex | [doc] + [live] |
| `userFills`, `userFillsByTime`, ws `userFills` | no | **aggregates all dexes** (`0x88ff…` fills include `BTC`, `io:*`, `xyz:*`) | [live] |
| `activeAssetData` (info and ws) | no (coin carries the dex) | **mode-aware**: unified user sees spot-backed `availableToTrade` | [live] |
| `l2Book`, `trades`, `candle`, `bbo`, `activeAssetCtx` | no | coin carries the dex | [doc] + [live] |
| `allDexsClearinghouseState`, `allDexsAssetCtxs` (ws) | n/a | all dexes in one stream | [doc] subscriptions |
| `webData3` (ws) | no | `perpDexStates[]` holds one entry per dex. `userState.dexAbstractionEnabled` | [doc] |
| `orderUpdates`, `userEvents`, `notification`, `userFundings`, `userNonFundingLedgerUpdates` | no | probably user-wide across dexes | **[inferred]** from the missing dex param. Not observed live. |
| `spotClearinghouseState` / ws `spotState` | no | the source of truth for unified/PM balances. Includes `tokenToAvailableAfterMaintenance` | [doc] + [live] |
| `predictedFundings` | no | **first dex only** | [doc] |

Always query with the **account address**, never the agent address. An agent address returns empty data **[doc]** ([nonces](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets)).

---

## 4. Correctness checklist (documented rules)

**Asset and market**
- [ ] The asset id comes from `perpDexs` index and raw `meta{dex}.universe` index, not a filtered list. *[doc asset-ids]*
- [ ] Block `isDelisted` assets. *[live]*
- [ ] Derive cross/isolated from `marginMode` (`noCross` / `strictIsolated`), not only from the deprecated `onlyIsolated`. *[doc perpetuals]*
- [ ] Check `perpsAtOpenInterestCap{dex}` and `perpDexStatus` before allowing position increases. *[doc]*

**Price, size and notional**
- [ ] Price: 5 sig figs and `6 - szDecimals` decimals (perp) or `8 - szDecimals` (spot), integers always OK, trailing zeros stripped. *[doc tick-and-lot-size, signing]*
- [ ] Size: truncate to `szDecimals`. Reject a size that truncates to zero. *[doc]*
- [ ] Notional ≥ $10 (or 10 quote units). *[doc error-responses]*
- [ ] Market order = IOC limit at mid × (1 ± slippage), re-rounded. Python SDK default slippage is 5%. Use the `dex`-scoped `allMids`. *[python-sdk]*
- [ ] TP/SL must be reduce-only, triggers use mark price, market TP/SL has 10% slippage. *[doc]*

**Margin and balances**
- [ ] Before the first order on a HIP-3 dex, read `userAbstraction`. If standard (`disabled` / `null` / `default`), check `clearinghouseState{dex}` balance and offer `sendAsset` into that dex. If unified/PM, use spot balances. *[doc + live]*
- [ ] Integer leverage in [1, maxLeverage]. Send `updateLeverage` before the order. `isCross:false` on isolated-only assets. *[doc]*
- [ ] Transfers out must leave `max(IM, 10% of notional)`. *[doc margining]*

**Signing, nonces and agents**
- [ ] Nonce: unique per **signer**, larger than the smallest of the signer's 100 highest nonces, and inside `(T − 2d, T + 1d)`. Use one agent per session or process. Agents shared across sub-accounts share a nonce set. *[doc nonces]*
- [ ] Do not reuse a deregistered agent address. Pruned nonce state allows **replay** of old signed actions. Generate a fresh key. *[doc nonces]*
- [ ] Agent limits: 1 unnamed plus 3 named per account, and 2 named per sub-account. `valid_until` is at most 180 days. Agents are pruned when deregistered, expired, or the account has no funds. *[doc approveAgent, nonces]*
- [ ] Two signing schemes. L1 actions (order, cancel, updateLeverage, agentSendAsset, agentSetAbstraction) can be agent-signed. User-signed EIP-712 actions (sendAsset, usdClassTransfer, withdraw3, approveAgent, approveBuilderFee, userSetAbstraction) need the main wallet. *[sdk: executeL1Action vs executeUserSignedAction per method; doc builder-codes for approveBuilderFee]* msgpack field order matters. Lowercase addresses. *[doc signing]*
- [ ] `expiresAfter`: L1 actions only, and user-signed actions reject it. A stale `expiresAfter` costs 5× rate-limit weight. *[doc exchange]* The app sets no `expiresAfter` today. A grep of `apps/terminal/src` and `packages/hl-react/src` found nothing. *[code]*
- [ ] `vaultAddress` for sub-accounts and vaults, signed by the master. *[doc exchange]*

**Builder fee**
- [ ] `approveBuilderFee` signed by the **main wallet**, not an agent. The builder needs ≥100 USDC perps account value and **standard** mode. Max 0.1% perps and 1% spot. At most 10 active approvals per user. The `f` field is in tenths of a bp. Check `maxBuilderFee{user,builder}` before attaching `builder`. *[doc builder-codes]*

**Responses and limits**
- [ ] HTTP 200 with `status:"ok"` can still carry per-order `{"error": …}` statuses. Pre-validation failures return **one** error for the whole batch. *[doc error-responses]* The SDK throws `ApiRequestError` when any status has `error`. *[sdk errors.js]*
- [ ] Rate limits: 1200 weight per minute per IP. Address budget is 1 request per 1 USDC traded plus a 10k starting buffer. Open orders are capped at 1000 base, up to 5000. Websocket: 10 connections, 1000 subscriptions, and 10 unique users across user subscriptions. *[doc rate-limits]*

---

## 5. SDK (`@nktkas/hyperliquid`)

- **Version.** The pinned `0.33.3` (`apps/terminal/package.json:22`) **is** npm `latest` and JSR latest (published 2026-08-02) **[live]**. No upgrade is available. `hl-react` peer range is `>=0.33.3 <1`. Stray `0.32.2` copies remain in `node_modules/.pnpm`, but `pnpm why` lists only 0.33.3, so they are stale store entries **[live]**.
- **Validation [sdk].**
  - Every request (exchange and info) is built with **valibot** schemas and run through `parse()` before signing. Order schema examples: `p` is an `UnsignedDecimal > 0`, `f` is at most 1000, and `r`/`s` are 66-char hex.
  - `canonicalize()` fixes msgpack key order.
  - It does **not** check tick size, szDecimals, min notional or margin mode. That is the app's job.
- **Utils [sdk]** (`@nktkas/hyperliquid/utils`):
  - `formatPrice(price, szDecimals, "perp"|"spot")` follows the 5-sig-fig and decimal rules.
  - `formatSize(size, szDecimals)` truncates.
  - Both throw `FormatError` when the value is non-finite or **truncates to 0**.
  - `SymbolConverter.create({transport, dexs: true | string[]})` maps `xyz:NVDA` to an asset id and szDecimals.
  - Builder dexes are **off by default**. Pass `dexs`.
  - It uses the `perpDexs` index, the same formula as the app.
- **Exchange methods present [sdk]:** `sendAsset`, `agentSendAsset`, `userSetAbstraction`, `agentSetAbstraction`, `userDexAbstraction`, `agentEnableDexAbstraction`, `topUpIsolatedOnlyMargin`, `hip3LiquidatorTransfer`, `approveBuilderFee`, `approveAgent`, `updateLeverage`, `order` (with `grouping`, `builder`, priority fee `p`).
- **Info and subscription methods [sdk]:** `userAbstraction`, `allPerpMetas`, `perpDexs`, `perpDexLimits`, `perpDexStatus`, `perpsAtOpenInterestCap`, `maxMarketOrderNtls`, `preTransferCheck` (checks the user exists before a transfer), `usdcRouting` (live returns `{"depositRoute":"cctp","withdrawalRoute":"cctp"}`), plus ws `allDexsClearinghouseState`, `allDexsAssetCtxs` and `webData3`.
- **Nonce manager [sdk `_nonce.js`].** Per-key monotonic: `max(Date.now(), last+1)`. It is safe within one tab. Two tabs sharing one agent key can still collide **[inferred]**.
- **Type gap [sdk vs live/doc].** `UserAbstractionResponse = "unifiedAccount" | "portfolioMargin" | "disabled" | "default"`. It omits `"dexAbstraction"`, which the docs list, and `null`, which the live API returns. Narrow defensively in `balances.ts`.
- **Version-history items worth knowing [live: GitHub commits 2026-08-01/02]:** `marginTable` gained a `dex` param. `subAccounts2` gained an `abstraction` field. `usdcRouting` was added. `orderType` and `OrderProcessingStatus` were widened. `twapOrder` gained `details`. The individual 0.32 → 0.33 release notes were not read. GitHub's releases API call failed because of a shell quoting error.

---

## Evidence files

- `scratchpad/hl/perpDexs.json`, `mac_<dex>.json`, `allPerpMetas.json`, `spotMeta.json`, `rt.json`: raw live API output.
- `scratchpad/hl/docs/*.md`: raw GitBook pages.
- `scratchpad/hl/exchange.py`: official Python SDK, for the slippage rule.
