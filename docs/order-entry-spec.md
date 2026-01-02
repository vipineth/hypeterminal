# Order Entry Panel Spec

**Goal**
- Make `src/components/trade/order-entry/order-entry-panel.tsx` fully functional for perp trading in cross mode: show withdrawable balance and current position, compute max size and drive a size slider, and place market/limit orders via `@nktkas/hyperliquid` with correct signing and rounding.
- Follow `docs/ui-ux-guidelines.md` for all UI decisions (no new colors, keep density, use shadcn components).

**Relevant Code**
- `src/components/trade/order-entry/order-entry-panel.tsx`
- `src/hooks/hyperliquid/use-clearinghouse-state.ts`
- `src/hooks/hyperliquid/use-resolved-market.ts`
- `src/lib/hyperliquid/clients.ts`
- `src/lib/hyperliquid/exchange.ts`
- `src/lib/hyperliquid/wallet.ts`
- `src/lib/hyperliquid/api-wallet.ts`
- `src/stores/use-trade-settings-store.ts`
- `docs/hyperliquid-full.txt` (order schema, asset ids, sizing/price rules, signing notes)

**Scope**
- Perp markets only (selected via `useSelectedResolvedMarket`).
- Margin mode: Cross only. Isolated tab is visible but disabled with tooltip "Coming soon".
- Order types supported: Market and Limit. Stop tab is visible but disabled with tooltip "Coming soon".
- Reduce Only and TP/SL controls remain visible but disabled with tooltip "Coming soon" (no reduce-only logic yet).
- Do not show Classic/Pro controls for now.

---

## Data Sources

- **Wallet connection**: `useConnection()` (wagmi) for `address`, `isConnected`.
- **Signing wallet**:
  - `useWalletClient()` (wagmi) -> `walletClient`.
  - Convert to Hyperliquid wallet with `toHyperliquidWallet(walletClient)` from `src/lib/hyperliquid/wallet.ts`.
  - Optional API wallet (agent) via `createApiWalletSigner()` from `src/lib/hyperliquid/api-wallet.ts`.
- **Market info**:
  - `useSelectedResolvedMarket({ ctxMode: "realtime" })` for `coin`, `assetIndex`, `szDecimals`, `maxLeverage`, `ctx.markPx`.
- **Account state**:
  - `useClearinghouseState({ user: address })` for `withdrawable`, `marginSummary`, `assetPositions`.
- **Trade settings**:
  - `useDefaultLeverageByMode()`, `useMarketLeverageByMode()` for selected leverage per mode/market.
  - `useMarketOrderSlippageBps()` for market price protection.

---

## UI State

- `mode`: `"cross"` (isolated present but disabled).
- `type`: `"market" | "limit"` (stop present but disabled). **Persisted globally** across all markets.
- `side`: `"buy" | "sell"`.
- `sizeInput`: string (user typed). **Shared between buy/sell** - persists when toggling sides.
- `sizeMode`: `"asset" | "usd"` - toggle between asset-denominated and USD-denominated sizing.
- `limitPriceInput`: string (limit only).
- `sizePercent`: number for the slider (0-100) or equivalent internal representation.
- `reduceOnly`, `tpSl`: present but disabled (no behavior yet).

---

## Display Requirements

### Balance
- Show "Available" from `clearinghouseState.withdrawable` (string -> number).
- Show "-" when not connected or data missing.
- **When balance is zero**: Disable the form inputs and show a prominent "Deposit" CTA that opens a deposit modal.
- **Always show a "Deposit" button** below the balance display (opens the deposit modal).

### Current Position
- Only render the row if the selected market has a non-zero position in `clearinghouseState.assetPositions`.
- Use sign to determine long/short styling (green/red) and show absolute size.
- **Display size only** - no entry price or PnL in this row.
- **Position row is display only** - clicking does nothing.

### Leverage
- Show current selected leverage (clamped to market max).
- **Smart defaults based on max leverage**:
  - Markets with maxLeverage ≤ 5x: default to maxLeverage.
  - Markets with maxLeverage > 5x: default to mid-point (e.g., floor(maxLeverage / 2)).
- If user has explicitly selected leverage for a specific market, prefer that stored value.
- Leverage is updated on-chain only when order is submitted (via `ensureLeverage()`).

### Tabs and Tooltips
- Isolated tab: **grayed out** (reduced opacity) with tooltip "Coming soon".
- Stop tab: **grayed out** (reduced opacity) with tooltip "Coming soon".
- Reduce Only and TP/SL: **grayed out** (reduced opacity) with tooltip "Coming soon".

### Size Input
- **Toggle between USD and Asset modes**: Add a toggle to switch between:
  - Asset mode: Size in asset units (e.g., "0.5" BTC).
  - USD mode: Size in USD (e.g., "$1000").
- Editing one mode updates the other internally based on current price.
- **Clear size when switching markets** - different assets require different sizing.
- **No shorthand notation** - only accept plain decimal numbers.

### Limit Price Helper
- Do not auto-fill limit price.
- Show the current mark price on the right in smaller digits; use `formatUSD(markPx)` for display.
- Clicking the mark price fills the limit input with a valid, rounded price string (no currency symbol, trailing zeros removed).
- **No warning for marketable limits** (buy above mark, sell below mark) - user knows what they're doing.

### Fees and Slippage
- **Show estimated fee in USD** based on order value and applicable rate.
- Fees display uses API-provided values if available; otherwise show static fallback `0.0450% / 0.0150%` (taker / maker) per docs.
- **Slippage configurable in global settings modal** (not in order panel).
- Default slippage: **0.25% (25 bps)**. Allow custom values in settings.

### Validation Styling
- Inputs turn red as the user types invalid values.
- **Over max size**: Allow typing, show red error state, disable submit button.

### Liquidation Price
- Show calculated liquidation price using docs formula.
- **Color warning**: Show liq price in red/orange when **within 5% of entry price**.
- If inputs are missing, show "-" (do not block submission).

---

## Calculations

### Helpers
Existing in `src/lib/trade/numbers.ts`:
- `parsePositiveDecimalInput`, `floorToDecimals`, `formatDecimalFloor`.

### Price Source
- Market order: use `markPx` (from `selectedMarket.ctx.markPx`).
- Limit order: use `limitPriceInput`.

### Max Size (Position-Aware)
```
available = parseNumber(withdrawable)
price = marketPriceOrLimit
leverage = selectedLeverage
existingPosition = position for current market (signed: + long, - short)

maxNotional = available * leverage

// For sells: can close existing long + open new short
// For buys: can close existing short + open new long
if (side === "sell" && existingPosition > 0):
  maxSizeRaw = (maxNotional / price) + existingPosition
else if (side === "buy" && existingPosition < 0):
  maxSizeRaw = (maxNotional / price) + abs(existingPosition)
else:
  maxSizeRaw = maxNotional / price

maxSize = floorToDecimals(maxSizeRaw, szDecimals)
```

### Slider
- **Continuous** (0-100%, no snap points).
- Slider represents percent of `maxSize`.
- Slider updates `sizeInput` using `maxSize * percent`.

### Real-Time Recalculation
- **Live recalculation**: Continuously update maxSize as mark price moves.
- Slider percentage stays the same, but absolute size changes.

### Order Value & Margin
- Order value: `size * price`
- Margin required: `orderValue / leverage`

### Liquidation Price
Use docs formula from `docs/hyperliquid-full.txt`:
```
liq_price = price - side * margin_available / position_size / (1 - l * side)
side = 1 (long) or -1 (short)
l = 1 / MAINTENANCE_LEVERAGE (use the applicable tier when available)
margin_available (cross) = account_value - maintenance_margin_required
```

---

## Rounding and Validation

From `docs/hyperliquid-full.txt`:
- Size must be rounded to `szDecimals` (perps): e.g. `szDecimals = 3` allows `1.001` but not `1.0001`.
- Price rules (perps):
  - Up to 5 significant figures.
  - Max decimal places = `6 - szDecimals`.
  - Integers always valid.
- Trailing zeroes should be removed before signing.
- Minimum order notional: `$10` (reject if `orderValue < 10`).
- Asset id:
  - Perps use `assetIndex` from `meta.universe` (already in `selectedMarket.assetIndex`).

---

## Order Construction (SDK Mapping)

Order payload (from `docs/hyperliquid-full.txt`):
- `a`: asset id (number)
- `b`: isBuy (true = long, false = short)
- `p`: price string
- `s`: size string
- `r`: reduceOnly boolean
- `t`: order type
  - Market: `{ limit: { tif: "FrontendMarket" } }`
  - Limit: `{ limit: { tif: "Gtc" } }`
  - Stop (optional): `{ trigger: { isMarket, triggerPx, tpsl } }`

Use `placeSingleOrder()` from `src/lib/hyperliquid/exchange.ts` with `grouping: "na"`.

---

## Market Order Price Protection

- Use `marketOrderSlippageBps` from store (default: 25 bps / 0.25%).
- Compute price:
  - Buy: `price = markPx * (1 + slippageBps / 10000)`
  - Sell: `price = markPx * (1 - slippageBps / 10000)`
- Apply rounding rules and remove trailing zeros.

---

## Leverage Updates

Before placing order, call `ensureLeverage()`:
- `asset`: selected `assetIndex`
- `isCross`: `mode === "cross"`
- `leverage`: selected leverage
- `current`: existing leverage from position if available (`position.leverage`)

**Silent update** - no warning shown when leverage changes.

---

## Signing and Execution

Use SDK to avoid manual signing:
```ts
const transport = getHttpTransport()
const wallet = toHyperliquidWallet(walletClient)
const config = makeExchangeConfig(transport, wallet)
await placeSingleOrder(config, { order })
```

SDK handles:
- Nonce generation and ordering.
- EIP-712 signatures.
- Submission to `/exchange`.

### API Wallet Flow
If using API wallet:
- Create signer with `createApiWalletSigner(privateKey)`.
- Ensure agent approval via `useExtraAgents` + `isAgentApproved`.
- **If not approved**: Show **inline approval prompt** in the order panel. After approval, auto-submit the pending order.
- Use agent signer for `placeSingleOrder`, but still use the main address for info queries.

---

## Order Queue and Submission

### Multi-Order Queue
- **Allow queuing multiple orders** - no blocking on rapid submissions.
- **Single toast tracks all orders**: Show a persistent toast with list of queued/pending orders.
- Each order in the toast shows:
  - Market (e.g., "BTC")
  - Side (Buy/Sell)
  - Size
  - Status: spinner (pending), green check (success), red X (failed)
  - For fills: show percentage filled (e.g., "75% filled")
- **Auto-remove successful orders after 5 seconds** of completion.
- **Keep failed orders** in toast until user dismisses.
- **Independent of market switching** - orders complete in background, toast shows results regardless of currently selected market.

### Timing Constants
Create `src/constants/ui-timing.ts`:
```ts
export const ORDER_TOAST_SUCCESS_DURATION_MS = 5000;
export const ORDER_TOAST_STALE_THRESHOLD_MS = 30000;
```

### Post-Submit Behavior
- **Reset form completely** after successful submission: clear size, slider to 0, clear limit price.
- **Keep form filled** on error so user can adjust and retry.

---

## Button States

### Submit Button Text
- When connected with valid form: **"Buy"** or **"Sell"** (simple, based on side).
- When not connected: **"Connect Wallet"** - clicking triggers wallet connection modal.
- When zero balance: **"Deposit"** - clicking opens deposit modal.

### Keyboard Support
- **Enter key submits** when focused on the form.
- No other keyboard shortcuts.

---

## Error Handling

### Validation Errors (Pre-Submit)
Do not block interaction pre-submit. On submit, block only if:
- Not connected, wallet client missing, no market selected.
- Missing price for limit orders or missing `markPx` for market orders.
- Invalid size/price or `orderValue < 10`.

Inputs show red error state as the user types invalid values.

### API Errors (Post-Submit)
- Surface API errors (from order response `statuses[].error`) in the order toast.
- Handle common errors: `minTradeNtlRejected`, `marketOrderNoLiquidityRejected`, `perpMaxPositionRejected`.

---

## Connectivity Handling

### Wallet Not Connected
- Show "Connect Wallet" button instead of Buy/Sell.
- Form is visible but submission triggers wallet connection.

### Zero Balance
- **Disable form inputs**.
- Show prominent "Deposit" CTA that opens deposit modal.
- Show "Deposit" button below balance at all times.

### WebSocket Disconnect
- **Silent reconnect** in background.
- No user-facing indication unless extended outage.
- Orders can still be submitted (API still works).

---

## Acceptance Criteria

1. Balance and position update when wallet connects/disconnects.
2. Leverage dropdown reflects stored settings and clamps to market max.
3. Smart leverage defaults: max for ≤5x markets, mid-point for >5x markets.
4. Size slider uses max size (position-aware) and updates size input.
5. Toggle between USD and asset sizing modes works correctly.
6. Order submission uses SDK and succeeds for connected users.
7. Order queue toast tracks multiple orders with individual status.
8. Successful orders auto-remove from toast after 5s.
9. Form resets completely after successful order.
10. Form preserved on error for retry.
11. Isolated and Stop tabs are grayed out with "Coming soon" tooltips.
12. Reduce Only and TP/SL are grayed out with "Coming soon" tooltips.
13. Mark price helper shows on the right and fills limit input on click.
14. Liquidation price shows color warning when within 5% of entry.
15. Zero balance shows disabled form with deposit CTA.
16. "Connect Wallet" button shown when not connected.
17. Inline agent approval flow works and auto-submits after approval.
18. Estimated fee in USD is displayed based on order value.
19. Enter key submits the form.
20. Size clears when switching markets.
