# Withdrawal Balance Mismatch Handoff

Date: 2026-06-17

## Issue

The balances table shows the user has `1,800.00 USDC` under `PERPETUALS`, but the withdrawal modal shows `Available: 0.00 USDC` and disables withdrawal.

Screenshots provided:

- `/Users/ankit/Desktop/Screenshot 2026-06-17 at 11.08.21 AM.png`
- `/Users/ankit/Desktop/Screenshot 2026-06-17 at 11.08.26 AM.png`

The user also clarified that no trade is open. Under that condition, the visible USDC balance and the withdrawable amount should normally not diverge unless there are orders, holds, margin requirements, pending transfers, or a protocol-level withdrawal constraint.

## Current Diagnosis

This is most likely a code/data-source mismatch, not a real balance constraint.

The balances table and withdrawal modal are reading different concepts from different Hyperliquid state surfaces:

- The balances table is account-abstraction-aware and can classify shared spot USDC as a `PERPETUALS` balance.
- The withdrawal modal reads `clearinghouseState.withdrawable` from the default perps clearinghouse state and labels it as `Available`.

In Hyperliquid account abstraction modes, balances and holds are represented through spot clearinghouse state, and individual perp dex user states are not meaningful in the same way. That makes the modal's default-perps `withdrawable` source suspect for this account mode.

Primary protocol reference:

- Hyperliquid account abstraction modes: <https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes>
- Hyperliquid exchange endpoint actions, including `withdraw3`, `usdClassTransfer`, and `sendAsset`: <https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint>

## Evidence

### Balances Table Source

`apps/terminal/src/domain/trade/balances.ts`

`getPerpBalanceRows(...)` has special handling for account abstraction modes:

- `unifiedAccount`
- `portfolioMargin`
- `dexAbstraction`

When this mode is active, it looks up the spot USDC balance and returns it as a perps balance row:

```ts
if (isShared) {
  const quoteBalance = spotBalances.find((balance) => balance.coin === USDC_SYMBOL);
  const available = getSpotAvailableValue(quoteBalance, spotAvailableAfterMaintenance);

  return [
    {
      asset: USDC_SYMBOL,
      type: "perp",
      available,
      total: quoteBalance.total,
      usdValue: quoteBalance.total,
    },
  ];
}
```

That explains why the balances table can show:

```txt
PERPETUALS / USDC / Available 1,800.00
```

### Withdrawal Modal Source

`apps/terminal/src/components/trade/tradebox/deposit-modal.tsx`

The withdrawal modal uses:

```ts
const userPositions = useUserPositions();
const withdrawable = userPositions.withdrawable;
```

It then validates and renders against this value:

```ts
const validation = validateWithdrawAmount(amount, withdrawable);
```

```tsx
<WithdrawForm
  amount={amount}
  onAmountChange={setAmount}
  onWithdraw={handleWithdraw}
  isWithdrawing={isWithdrawing}
  availableBalance={withdrawable}
/>
```

`apps/terminal/src/components/trade/tradebox/deposit/withdraw-form.tsx`

The form labels that value as `Available`:

```tsx
Available: {formatNumber(availableNum, 2)} USDC
```

`packages/hl-react/src/account/use-user-positions.ts`

`withdrawable` comes from the default perps clearinghouse state:

```ts
function getWithdrawable(data: AllDexsClearinghouseState | null): number {
  return getMainDex(data)?.withdrawable
    ? Number.parseFloat(getMainDex(data)?.withdrawable ?? "0")
    : 0;
}
```

## Root Cause

The UI is mixing at least three different concepts:

1. **Balance**: visible account USDC/equity.
2. **Available balance**: balance free from holds or margin usage.
3. **Withdrawable balance**: amount Hyperliquid currently allows to be withdrawn via `withdraw3`.

The balances table displays a shared/account-abstraction-aware balance from spot state.

The withdrawal modal displays default-perps `withdrawable` and calls it `Available`.

When account abstraction is enabled, these values can diverge because they are not derived from the same normalized account model.

## Why This Is Especially Suspicious Here

The user says no trade is open.

If there are also no open orders, holds, pending transfers, or margin requirements, then a `1,800 USDC` balance should not reasonably produce `0 withdrawable`.

That strongly suggests the modal is asking the wrong source for this account mode.

## Related Risk

The same mismatch likely affects nearby actions:

- `apps/terminal/src/components/trade/positions/transfer-modal.tsx`
- `apps/terminal/src/components/trade/positions/send-modal.tsx`

Those modals recompute availability from perps account summary rather than reusing the account-abstraction-aware balance row shown in the table. A user can therefore see a positive balance in the table, then open an action modal that shows a lower or zero available amount.

## Recommended Fix

Create one normalized balance/availability model and route the balances table, withdrawal modal, transfer modal, send modal, and account panels through it.

The model should expose explicit fields instead of overloading `available`:

```ts
type NormalizedUsdBalance = {
  balance: number;
  available: number;
  withdrawable: number;
  transferableToSpot: number;
  sendable: number;
  source: "spotState" | "clearinghouseState" | "accountAbstraction";
  accountAbstraction: AccountAbstraction | null;
};
```

The withdrawal modal should then do one of the following:

1. If `withdrawable` is the right protocol constraint, label it `Withdrawable`, not `Available`, and show an explanation when it differs from visible balance.
2. If account-abstraction spot USDC is the correct withdrawal source, derive `withdrawable` from the same shared USDC balance model used by the balances table.

Do not keep separate balance math in each modal.

## Implementation Plan

1. Add a domain helper near `apps/terminal/src/domain/trade/balances.ts` that computes the normalized USDC balance for the current account mode.
2. Use that helper in:
   - `apps/terminal/src/components/trade/tradebox/deposit-modal.tsx`
   - `apps/terminal/src/components/trade/positions/transfer-modal.tsx`
   - `apps/terminal/src/components/trade/positions/send-modal.tsx`
   - `apps/terminal/src/components/trade/tradebox/account-panel.tsx`
   - `apps/terminal/src/components/trade/mobile/mobile-account-view.tsx`
3. Update withdrawal UI copy so it no longer calls protocol `withdrawable` simply `Available`.
4. Add regression tests covering:
   - account abstraction enabled
   - spot USDC balance is `1,800`
   - no positions
   - no open orders
   - withdrawal modal does not show `0` unless the normalized model has a real withdrawal constraint

## Test Coverage To Add

Existing relevant test:

- `apps/terminal/src/lib/tests/balances.test.ts`

Add coverage for:

- `getPerpBalanceRows(...)` shared USDC behavior remains correct.
- New normalized withdrawal balance helper returns the same visible available value in the no-position/no-hold account abstraction case.
- Withdrawal modal renders a non-zero amount for that case, or renders an explicit reason if `withdrawable` is intentionally zero.
- Transfer/send modals use the same normalized source and do not disagree with the balances row.

## Verification Already Run

This command passed during investigation:

```sh
pnpm --filter @hypeterminal/terminal test -- src/lib/tests/balances.test.ts
```

Result summary:

- 45 test files passed
- 1 test file skipped
- 262 tests passed
- 1 test skipped

## Suggested Acceptance Criteria

- The balances table and withdrawal modal agree for a no-position, no-order, no-hold account with `1,800 USDC`.
- If they do not agree, the UI explains the concrete constraint instead of showing `Available: 0.00 USDC`.
- The word `Available` is not used for protocol `withdrawable` unless those values are known to be equivalent in that account mode.
- Transfer and send modals do not show a different available amount from the row that opened them.
