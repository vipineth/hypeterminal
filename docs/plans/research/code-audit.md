# HypeTerminal Hyperliquid integration audit (read-only)

Goal: re-found the Hyperliquid integration so it never sends wrong orders or loses funds. Trigger: user could not trade xyz:NVDA (HIP-3 builder perp).

Evidence labels: **measured** (ran code or hit live API this session), **read** (from source), **inferred** (reasoned, not run).

Scratch artifacts (rerunnable levers) in the scratchpad dir:
- `headless.ts` runs the real `buildOrderPlan` + `formatSizeForOrder` against live `allPerpMetas` + per-dex ctxs and diffs against SDK `formatPrice`/`formatSize`. Run: `cd apps/terminal && bun <scratchpad>/headless.ts`.
- `headless3.ts` runs the real `deriveOrderEntry` with an NVDA + default-mode account shape.
- `probe.py`, `defaults.py`, `btc.py` query public `/info` for leaderboard accounts by abstraction mode.

---

## 0. Severity-ordered findings

| # | Sev | Finding | Evidence |
|---|-----|---------|----------|
| 1 | P0 wrong order | `formatSizeForOrder` strips significant zeros when `szDecimals = 0`. 10→"1", 20→"2", 100→"1", 250→"25". Hits 105 live markets incl. DOGE, XRP, TRX, SEI, kPEPE, kSHIB. | measured |
| 2 | P0 fails / partial | `formatPriceForOrder` ignores `szDecimals` and perp/spot. Emits invalid ticks for 91 of 700 market-order plans on live meta (DYDX, APE, OP, APT, kPEPE...). | measured |
| 3 | P0 NVDA blocker | On `default`/`disabled` abstraction accounts, HIP-3 `availableToTrade` counts only that dex's collateral. The app disables the form and offers "Deposit", and has no way to move USDC onto the xyz dex or switch abstraction. | measured (live API, n=3 default, n=4 disabled) |
| 4 | P1 misleading | Commit 516b41c (`mode === "dexAbstraction"`) is dead code. The `abstraction` field never takes that value. | read (SDK types) + measured (info endpoint 422) |
| 5 | P1 double-exposure risk | Any errored leg in a bulk `order` makes the SDK throw. The app then reports the whole plan as failed even when the entry filled. | read (SDK `_shell.js:36`, `errors.js`) |
| 6 | P1 consent | Builder fee approval asks for 0.1% while the configured fee is 0.01%. That is 10x over-approval, and 0.1% is the perp max. | measured (`convertFeeToPercentageString(10) === "0.1%"`) |
| 7 | P2 | Limit-price rounding is `Math.round` to 5 sig figs, so a buy limit can silently round up. | read |
| 8 | P2 | Market-order slippage price can derive from a localStorage-cached mark (`loadLastMark`). | read |
| 9 | P2 latent | `pairName` collisions: xyz:NVDA and io:NVDA are both "NVDA-USDC", and STX vs para:STX. `byPairName` is last-write-wins. No live caller passes a pairName today. | measured (21 collisions) + read |
| 10 | P2 | No tests at all. Suite deleted in 601e324 (2026-11-12). Old size test never covered integer sizes ending in 0. | read |

---

## 1. End-to-end order path

### Entry order (desktop + mobile share `useTradeTicket`)
1. UI: `components/trade/tradebox/trade-panel.tsx`, `trade-form-fields.tsx` (form disabled when `availableBalance <= 0`, line 94). Mobile: `mobile/mobile-trade-ticket-body.tsx`.
2. Ticket hook: `hooks/trade/use-trade-ticket.ts:63`. `markPx = toNumberOrZero(market.markPx)` (:79). Price via `getOrderPrice` (:144). Metrics via `getOrderMetrics` / `getLiquidationInfo` (:156-157). The liq estimate is a heuristic `px ± px/lev*0.9`, not HL's maintenance-margin formula (`domain/trade/order/metrics.ts:40`).
3. Derivation: `hooks/trade/use-order-entry-data.ts:70`, then `domain/trade/order/derive.ts:59 deriveOrderEntry`. For perp and builderPerp, `availableBalance = activeAssetData.availableToTrade[side]` (`derive.ts:71-72`, from `hooks/trade/use-asset-leverage.ts:215`). `maxSize = activeAssetData.maxTradeSzs` (`order/size.ts:64`).
4. Validation: `lib/trade/use-order-validation.ts:73` → `lib/errors/stacks/perp-order.ts:80` / `spot-order.ts`. `noBalanceValidator` (`definitions/balance.ts`) fails when `availableBalance <= 0`. The button then becomes "Deposit" (`lib/trade/use-button-content.ts:70`). `trade-panel.tsx:47` hides validation errors when `availableBalance <= 0`, so the user gets no explanation.
5. Submit: `hooks/trade/use-order-submit.ts:67` formats size and price again for the queue display (:94-95), then `buildOrderPlan({kind:"entry"})` (`domain/trade/order-intent.ts:72`) → `buildOrders` (`domain/trade/orders.ts:43`).
6. Formatting: `formatPriceForOrder` (`orders.ts:259`), `formatSizeForOrder` (`orders.ts:287` → `lib/trade/numbers.ts:83 formatDecimalFloor`).
7. Asset id: precomputed in `lib/hyperliquid/markets/use-markets.tsx:46/85/113` via `markets/helper.ts:9-19`. `packages/hl-react/src/asset-id.ts calculateAssetId` is a second, unused copy.
8. Exchange: `hooks/trade/use-submit-plan.ts:21` → `packages/hl-react/src/hooks/useExchange.ts:22`. The builder `{b,f}` is injected into every `order` (`registries/exchange.ts:32`). The trading client is `clients.ts:93 getTradingClient`, which wraps the agent `PrivateKeyAccount` in `signing/l1-agent-wallet.ts:34`, a hand-rolled EIP-712 digest for L1 actions.
9. Response: SDK `assertSuccessResponse` throws `ApiRequestError` when any status has `error` (SDK `api/exchange/_methods/_base/_shell.js:36`, `errors.js isBulkError`). `use-submit-plan.ts:23` catches it and returns `{ok:false}`, which drops the per-leg statuses. `lib/trade/extract-order-status.ts:7 interpretOrderStatuses` therefore only ever sees all-success arrays, so its error branch is effectively dead. `use-order-submit.ts:159` calls `resetForm()` even on failure.

### Other actions
| Action | Path | Notes |
|---|---|---|
| Leverage / margin mode | `hooks/trade/use-asset-leverage.ts:134,149,175` → `updateLeverage({asset, isCross, leverage})` | Isolated-only detection in `packages/hl-react/src/capabilities.ts:23` (`onlyIsolated`, `marginMode` noCross/strictIsolated). `hasPosition(baseToken)` at `:91` passes no dex, unlike `use-trade-ticket.ts:141`. A second `getDefaultLeverage` lives at `:44`, distinct from `orders.ts:249`. |
| Cancel | `components/trade/positions/orders-tab.tsx:113` `markets.getAssetId(order.coin)`. Mobile: `mobile-orders-tab.tsx`. | Silently skips orders whose coin is missing from markets (`:114`). |
| Market close / reverse | `positions/positions-tab.tsx:83` → `buildMarketClosePlan` / `buildReversePlan` (`order-intent.ts:120,168`). Mobile: `mobile-positions-tab.tsx:82`. | Size bug #1 applies. Reverse sends `2*size` with `r:false` and the same bug. |
| Limit close | `positions/position-limit-close-modal.tsx:48,76` | Prefills size with `formatDecimalFloor(position.size, szDecimals)`, so a 100-DOGE position shows and sends "1". Initial price uses yet another helper, `lib/format.ts:143 szDecimalsToPriceDecimals`. |
| Position TP/SL | `positions/position-tpsl-modal.tsx:76-87` → `buildPositionTpSlPlan` (`order-intent.ts:100`), size "0" + `positionTpsl` grouping | Price bug #2 applies. Open question: with `isMarket:true`, does `p` act as a worst-price cap? Unverified. |
| Swap (spot) | `components/trade/components/spot-swap-modal.tsx:167` → `buildSwapPlan` (`order-intent.ts:189`) | Float slippage math (`markPx * (1+bps/1e4)`), and spot's 8-decimal tick rule is ignored. |
| TWAP | `use-order-submit.ts:114` | Size bug #1 applies. `throwIfResponseError` (:124) is redundant because the SDK already throws. |
| Perp↔spot transfer | `positions/transfer-modal.tsx:80` `sendAsset` with `sourceDex/destinationDex` only `""`↔`"spot"` | No HIP-3 dex destination is offered anywhere. |
| Send | `positions/send-modal.tsx:150,158` (`sendAsset` / `spotSend`) | |
| Withdraw | `tradebox/deposit-modal.tsx:79,100` `withdraw3({amount: withdrawAmount})` (raw string); `lib/trade/withdraw-validation.ts` uses float compare | `getNormalizedWithdrawable` (`domain/trade/balances.ts:222`) inherits the dead dexAbstraction branch. |
| Deposit | `lib/hyperliquid/use-deposit.ts:54,114` `parseUnits(string, 6)` | Clean: no float on the funds path. |
| Agent + builder fee | `packages/hl-react/src/signing/use-agent-registration.ts:75-98`; `agent-utils.ts:21` | Fee bug #6. |
| Abstraction switch | `userSetAbstraction` / `userDexAbstraction` are listed in `registries/exchange.ts:24-26` | No caller. The UI cannot change modes. |

---

## 2. Builder (HIP-3) special-casing and the NVDA failure

### Where builder markets are special-cased
- Market build: `lib/hyperliquid/markets/use-markets.tsx:94-122`. `dexIndex` is the position in `allPerpMetas`/`perpDexs`, and `quoteToken = spotTokens[meta.collateralToken]`. Live check: 0 violations of the `name.startsWith(perpDexs[i].name + ":")` invariant.
- Live ctxs: `lib/hyperliquid/hooks/useMarketsInfo.ts:113-180`. Builder `markPx` arrives only via WS `allDexsAssetCtxs` or the localStorage cache. The HTTP snapshot covers the main dex only (:124-141).
- Quote token / balances: `domain/trade/balances.ts:14,125,143`, all keyed on spot balances. The `quoteAvailable` they compute for builder perps is display only and is not what gates trading.
- Abstraction: `isQuoteBalanceSharedWithPerps` (`balances.ts:55`). It is used for balance rows and withdrawable only, not for trade gating.
- Accounts: `hooks/trade/use-account-balances.ts:48` subscribes to `allDexsClearinghouseState`, but `useDefaultDexBalances` (:89) only reads the `""` dex. `account-panel.tsx:31` shows main-dex balances, so the user sees funds while the NVDA form is disabled.
- Margin mode: `capabilities.ts:23`, `use-asset-leverage.ts:80`.

### Live facts for xyz:NVDA (measured, mainnet /info, 2026-11-13)
- `perpDexs[1] = xyz`, `collateralToken 0` (USDC), universe index 2. Asset id 110002 matches `getBuilderPerpAssetId(1,2)`.
- `szDecimals 3`, `maxLeverage 20`, no `onlyIsolated`/`marginMode`, so cross is allowed. io:NVDA (id 200014) is also live with the same pairName.
- Headless `buildOrderPlan` for NVDA market buy: `{"a":110002,"b":true,"p":"171.07","s":"0.123","r":false,"t":{"limit":{"tif":"FrontendMarket"}}}`. That is valid.

### `availableToTrade` for xyz:NVDA by abstraction mode (measured, public leaderboard accounts)
| mode | example | xyz:NVDA availableToTrade |
|---|---|---|
| unifiedAccount | spot USDC 14.74M | 14.74M (spot USDC is usable) |
| portfolioMargin | spot USDC 3.88M | 3.39M |
| disabled | main perp withdrawable 7.38M, xyz 0 | **0** |
| disabled | main 5.24M, xyz 442K | 453K (xyz only) |
| default | spot USDC 73.4K, main 0 | **0** (BTC also 0) |
| default | spot 56.9K, main 10 | **0** (BTC = 10) |

So `default` is classic split margin. Spot USDC is not perp collateral, and main-perp USDC is not HIP-3 collateral. Only unified and portfolio-margin accounts pool collateral across dexes.

### NVDA hypotheses, ranked
1. **Collateral not on the xyz dex** (strong; measured mechanism). The user is likely on `default`/`disabled` with USDC in spot or the main perp. `availableToTrade = 0` → `derive.ts:72` → form disabled (`trade-form-fields.tsx:94`), "Deposit" CTA (`use-button-content.ts:70`), errors hidden (`trade-panel.tsx:47`). Reproduced headless: `deriveOrderEntry` with 73,414 spot USDC gives `availableBalance 0, maxSize 0`. HL would reject the order server-side anyway, so this is a missing feature rather than a client bug. Fix options:
   - (a) `sendAsset` with `destinationDex:"xyz"` from `""` or `"spot"`. Unverified that it works for USDC; the SDK supports dex names.
   - (b) Offer `userSetAbstraction("unifiedAccount")`.
   - (c) Explain the state in the ticket instead of showing "Deposit".
   The user's suspicion that collateral can't be used on builder dexes is correct for non-unified accounts.
2. **516b41c doesn't do what its title says** (certain; read). SDK `api/subscription/_methods/webData3.d.ts:48` types `abstraction` as `"unifiedAccount" | "portfolioMargin" | "disabled"`. Dex abstraction is a separate boolean, `dexAbstractionEnabled` (:46). The `info userDexAbstraction` endpoint now returns HTTP 422, and the exchange action is `@deprecated use userSetAbstraction`. The string cast at `balances.ts:56` exists because the comparison doesn't typecheck. `AccountAbstraction` also lacks `"default"`, which `info userAbstraction` returns.
3. **No mark price yet** (weak). If WS `allDexsAssetCtxs` hasn't arrived and the cache is empty, `markPx = 0` and market orders show "No mark price" (`definitions/market.ts noMarkPriceValidator`).
4. **Ruled out**: asset id, NVDA price/size decimals, isolated-only, leverage update (cross is allowed on xyz:NVDA).

---

## 3. Structural issues

### Bug 1: size truncation (P0, measured)
`lib/trade/numbers.ts:84`: `floorToString(value, decimals).replace(/\.?0+$/, "")`. With `decimals = 0` there's no "." to anchor on, so trailing integer zeros get stripped. Callers:
- `orders.ts:287 formatSizeForOrder`, which covers every order kind: entry, scale, TWAP, close, reverse, limit close, swap.
- `order/size.ts:43`, the percent-slider output written into the size input.
- `position-limit-close-modal.tsx:48,98`.
- `trade-form-fields.tsx:158,218`, display.

It always under-sizes. Worst case is a reduce-only close: closing 100 DOGE sends 1 and leaves 99 exposed. Present since at least 7767994 (2026-03-30). The deleted test only asserted `formatSizeForOrder(1.2, 0) === "1"`.

### Bug 2: price ticks (P0, measured)
`orders.ts:259` uses 5 sig figs capped at `HL_PRICE_MAX_DECIMALS = 8` (`config/trade.ts:24`). HL's rule is max `6 - szDecimals` decimals for perp (`8 - szDecimals` for spot), and integers are exempt from the sig-fig cap. Example: DYDX (szDecimals 1, mark 0.09017) buy gives "0.092424" (6 decimals > 5), which HL rejects. The SDK gives "0.09242". Every caller of `formatPriceForOrder` is affected: entry, trigger, TP/SL, scale, close, reverse, swap. Scale orders on such assets get partially rejected, which combines with finding 5.

### Single source of truth violations
- Two price formatters (`orders.ts:259`, `lib/format.ts:143 szDecimalsToPriceDecimals` + `limitDecimalInput`), and neither matches HL. The SDK ships the right ones: `formatPrice(price, szDecimals, "perp"|"spot")` and `formatSize` from `@nktkas/hyperliquid/utils`. `formatPrice` throws when the price truncates to 0, so callers must handle that. It rounds down regardless of side.
- Two asset-id implementations: `apps/.../markets/helper.ts:17` and `packages/hl-react/src/asset-id.ts:8`, which is exported and unused. The SDK also ships `SymbolConverter` (`utils/_symbolConverter.js`).
- Two `getDefaultLeverage` (`orders.ts:249`, `use-asset-leverage.ts:44`), with different rules.
- Size/price are formatted twice per submit: the queue display (`use-order-submit.ts:94-107`) and the plan.
- The global `marginMode` setting (`stores/use-global-settings-store.ts:44`) is not per-asset. It is only used while disconnected.

### Numbers become floats
- Intent types are all `number`: `EntryOrderParams` (`orders.ts:16-36`) and every `*Intent` in `order-intent.ts:17-62`. The pipeline goes string (API) → `toNumber` → `Big` → `.toNumber()` → `Big` → string. The repo's own rule says keep strings.
- `use-asset-leverage.ts:209-220` converts `maxTradeSzs`/`availableToTrade` to numbers.
- `order/size.ts:56,76` produce floats before flooring. `order/metrics.ts` is all number.
- `buildSwapPlan` (`order-intent.ts:190`) is pure float.
- `definitions/scale.ts scaleLevelMinNotionalValidator` is float math. `withdraw-validation.ts` uses a float compare.
- `isBuilderFeeApproved` uses `Number`.

### Untyped / unvalidated responses
- `interpretOrderStatuses(statuses: unknown[])` and `throwIfResponseError(status: unknown)` duck-type the response.
- `RawSpotState` adds `tokenToAvailableAfterMaintenance` by cast (`use-account-balances.ts:7`).
- `balances.ts:56` widens to `string` to compare against a non-existent enum value.
- Market metadata from `useInfo(..., {persist: true})` is cached for 30 minutes (`use-markets.tsx:181-193`). Asset ids depend on array positions across two independently cached queries (`perpDexs`, `allPerpMetas`). Nothing checks they agree. A cheap guard is the `name.startsWith(dex + ":")` invariant.

### Other risks
- Partial-fill masking (finding 5). In an entry + TP/SL bundle, the entry can fill while a TP leg errors. The UI says "failed", so the user retries and doubles the position.
- `getMarketInfo` falls back to `byPairName` (`useMarketsInfo.ts:196`). There are 21 collisions on live meta. Remove the fallback or key it by `dex`.
- `useSelectedMarketInfo` substitutes a cached `markPx` from localStorage (`useMarketsInfo.ts:229-232`), so market-order slippage bounds can be based on a stale price.

### Tests
- No test files, no `test` script, no vitest in any `package.json`. Commit 601e324 ("chore: remove test suite, benchmarks and vitest setup", 2026-11-12) deleted 50+ tests, including `orders.test.ts`, `order-plan.test.ts` (characterization of `buildOrderPlan`/`getExecutedPrice`), `numbers.test.ts`, `balances.test.ts`, `errors.test.ts`, `l1-agent-signing.test.ts`, and `hyperliquid-registries.test.ts`. They are recoverable with `git show 601e324^:<path>`.
- None of them tested against live meta, and none covered integer sizes at `szDecimals = 0` or tick validity per `szDecimals`.
- Known constraint (memory): vitest can't transform the lingui `t` macro.

---

## 4. Headless (no signing) order building

Measured with `bun` from `apps/terminal`. Bun resolves the `@/` tsconfig paths with no config.

| Function | File | Headless? |
|---|---|---|
| `buildOrderPlan` (all 6 intent kinds) | `domain/trade/order-intent.ts:72` | Yes (ran over 350 live markets) |
| `buildOrders`, `formatPriceForOrder`, `formatSizeForOrder` | `domain/trade/orders.ts:43,259,287` | Yes |
| `getOrderPrice`, `getExecutedPrice` | `domain/trade/order/price.ts:14,39` | Yes |
| `deriveOrderEntry` | `domain/trade/order/derive.ts:59` | Yes (ran the NVDA scenario) |
| `getMaxSizeForOrderEntry`, `getSizeValueFromInput`, `getSizeForPercent` | `domain/trade/order/size.ts` | Yes (imported via derive) |
| `getSpotBalanceData`, `getPerpBalanceRows`, `isQuoteBalanceSharedWithPerps`, `getNormalizedWithdrawable` | `domain/trade/balances.ts` | Yes (loads) |
| `interpretOrderStatuses` | `lib/trade/extract-order-status.ts:7` | Yes (loads) |
| `getMarketCapabilities` | `packages/hl-react/src/capabilities.ts:27` | Pure, likely yes (not run) |
| `validatePerpOrder` / `validateSpotOrder` | `lib/errors/stacks/*.ts` | Module loads, but throws once any validator fails (lingui `t` macro outside compilation). Needs a lingui macro plugin, or messages moved out of validators. |
| `createMarkets` | `lib/hyperliquid/markets/use-markets.tsx:35` | Not exported and lives in a React `.tsx`. Extract to a pure module to test asset ids and quote tokens against live `perpDexs` + `allPerpMetas` + `spotMeta`. |

Suggested lever: a `bun` script/test that, for every live market in `allPerpMetas` + `spotMeta`, builds each intent kind and asserts:
- the price is a valid tick per `szDecimals` and perp/spot;
- the size equals SDK `formatSize`;
- the asset id round-trips through SDK `SymbolConverter`.

With a signing-free `ExchangeClient`, this can stop at the action payload. HL also offers testnet for an end-to-end submit.

## Open questions
- Does `p` cap slippage on `isMarket:true` trigger orders (TP/SL)? If not, a gapped stop is unbounded. Unverified.
- Does `sendAsset` accept `destinationDex:"xyz"` for USDC from the main perp and from spot? This is the likely NVDA unblock for non-unified users. Unverified.
- What does `webData3.userState.abstraction` send for `default` accounts, given that `info userAbstraction` says "default"? Unverified, so the app may also see an untyped value there.
