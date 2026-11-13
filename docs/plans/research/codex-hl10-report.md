HL-10 adversarial audit. The Deposit form must display a confirmed Arbitrum USDC balance and block deposits when the current balance read is unconfirmed.

Audited `3f73e7845c78f65fc293873677a4ca2b677081fb` against `main` at `f303913bc79b2ba131e1e8fe55b6f33309e89c5b`, using the supplied diff. The worktree was left unchanged. No transactions were signed or sent.

Reproduce both findings from this audit directory:

```sh
bash ./evidence/run-audit.sh
```

The [harness](evidence/adversarial.test.tsx) runs Vitest against the actual worktree hook, TanStack Query, wagmi receipt hook, and rendered DepositForm. HTTP responses are controlled fixtures. The wallet write hook is replaced by a recorder. Its passing assertions confirm that the reported defects reproduce.

**1. [P1] Cached data overrides failed or pending balance reads.**

`apps/terminal/src/lib/trade/deposit-validation.ts:20-23` returns `ready` whenever `data` exists, before checking `isError`. `useUsdcBalance` at `apps/terminal/src/lib/hyperliquid/use-deposit.ts:64-74` also drops fetching state. TanStack Query retains old data when a refetch fails or starts for a cached account.

The run first successfully reads zero, changes the simulated chain balance to 13.806 USDC, and fails the next RPC read. The actual form still displays `Available: 0 USDC`, with no retry control. A cached 20 USDC balance followed by a failed refresh permits a 10 USDC submission even when the fixture's current chain balance is zero. Switching back to an account with cached funds also enables Deposit before its refresh finishes.

Command above, exact output excerpts:

```text
failed-refetch cached zero {"simulatedChainBalance":"13806000","queryStatus":"error","queryError":true,"balance":{"status":"ready","raw":"0","formatted":"0"},"form":{"availableZeroShown":true,"retryShown":false,"submitDisabled":true,"ariaDisabled":false}}
failed-refetch cached positive {"simulatedChainBalance":"0","queryStatus":"error","queryError":true,"balance":{"status":"ready","raw":"20000000","formatted":"20"},"validation":{"valid":true,"error":null},"form":{"availableZeroShown":false,"retryShown":false,"submitDisabled":false,"ariaDisabled":false}}
account-switch refetch pending {"simulatedChainBalance":"0","queryFetchStatus":"fetching","balance":{"status":"ready","raw":"20000000","formatted":"20"},"validation":{"valid":true,"error":null},"form":{"availableZeroShown":false,"retryShown":false,"submitDisabled":false,"ariaDisabled":false}}
```

`DepositForm` enables its button from `validation.valid`, and `DepositModal.handleDepositSubmit` uses that same validation at lines 93-96. Thus the latest failed or unfinished read is treated as sufficient confirmation. These amounts were checked against an earlier successful cached value, not a successfully refreshed current balance. Prioritize read errors and carry read lifecycle validity into the balance state before allowing cached values to authorize submission.

**2. [P2] Receipt polling changes chains and can select an RPC forbidden by CSP.**

`apps/terminal/src/lib/hyperliquid/use-deposit.ts:83` calls `useWaitForTransactionReceipt({ hash })` without `chainId`. The installed wagmi hook defaults to the current configured chain. With an outstanding deposit hash and the wallet switched to Polygon, the actual hook selects chain 137, and its actual query function issues `eth_getTransactionReceipt` to `https://polygon.drpc.org`. That origin is absent from `connect-src`.

Command above, exact output:

```text
receipt after chain switch {"receiptChainId":137,"rpcOrigin":"https://polygon.drpc.org","cspAllowed":false,"observedRequest":{"url":"https://polygon.drpc.org/","method":"eth_getTransactionReceipt"}}
```

The fixture returns a synthetic receipt solely to finish this read-only probe; no transaction is created. The application config matrix in [the full output](evidence/final-verification.log) confirms that only Arbitrum and Ethereum origins are allowed among the 19 configured chains. The same deposit hash must continue to be confirmed on Arbitrum after a wallet chain switch. Pass `chainId: ARBITRUM_CHAIN_ID` to the receipt hook.

This receipt call is pre-existing and retained by HL-10, rather than introduced by this diff. Verified against main:

```sh
git -C /Users/ankit/Documents/make/hypeterminal-wt/hl-10-arbitrum-rpc show main:apps/terminal/src/lib/hyperliquid/use-deposit.ts | rg -n 'useWaitForTransactionReceipt\('
```

```text
99:	const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({ hash });
```

Verification evidence is retained in [baseline tests](evidence/baseline.log), [development CSP resolution](evidence/dev-config.log), [development transport overrides](evidence/dev-transport.log), [production build](evidence/production-build.log), and [production response checks](evidence/production-fetch.log). The original 14 tests pass. Production SSR pages return 200 and the built client and response CSP contain the supplied RPC overrides. TCP listeners were denied by the sandbox, so production responses were checked through the generated Nitro fetch handler with its listener adapter removed only in the scratch copy. The direct Deposit path uses USDC `transfer`; it has no approval or allowance read.
