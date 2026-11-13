# Hyperliquid foundation plan

HypeTerminal sends real orders with real funds. Since the viem bump in `5f78184`, no browser wallet can sign a Hyperliquid user action, so agent approval, builder fee approval, withdraw and send all fail. Two shared formatters also send wrong sizes and prices, and standard-mode accounts cannot fund builder (HIP-3) dexes.
This program rebuilds the Hyperliquid boundary so every order goes through one parsed market model, one wire formatter, and one result interpreter, each pinned by tests that run against live `/info` meta.
The rule the program enforces is simple. No order leaves the app unless the market model, the account mode, and the wire format all come from one checked source, and a test proves that source against every live market.
PR ids in order are HL-11, HL-1, HL-2, HL-10, HL-9, HL-3, HL-8, HL-4, HL-5, HL-6, HL-7.

## How to read this

One box is one unit of work. Every box names the evidence that checks it. A nested box is a sub-step of the box above it. Check a box only when its evidence exists, a file, a log line, a screenshot, a test run, or a SHA. The body is a how-to. The appendices explain and record.

The program runs `pstack/skills/poteto-mode/playbooks/autopilot-stack.md`. The operator lands every PR. This repo merges locally and pushes `main` with no GitHub PRs, so "PR" here means one branch with one change, fast-forwarded by the operator. HL-11, HL-1, HL-2 and HL-10 are hotfixes and should land the same day they are verified, HL-11 first. HL-9 and HL-8 follow next. Appendix F records where each PR stands.

Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Arm the program

- [ ] State the protocol and this plan to the operator, then stop. Start execution only on the operator's explicit go.
- [ ] Read these from trunk at program start. Re-read them at every tick.
  - [ ] `git show origin/main:.claude/rules/hyperliquid.md`
  - [ ] `git show origin/main:.claude/skills/verify-hypeterminal/SKILL.md`
  - [ ] `git show origin/main:.claude/skills/verify-hl-subscriptions/SKILL.md`
  - [ ] The pstack files `playbooks/autopilot-stack.md`, `playbooks/opening-a-pr.md` and `skills/swarm/SKILL.md` under the pstack root in `~/.pstack/root`.
  - [ ] This plan's Appendix D reading list.
- [ ] On the operator's go, arm the audit tick as `/loop 1h` with the tick prompt below. Never leave the cadence to memory.
- [ ] Use this tick prompt, verbatim. "Re-read the execution playbook from trunk. Audit the operation against it and fix drift in this tick. Probe every active lane and judge progress by side effects only. Stand down a stuck lane and dispatch its replacement now. Then post a short status message to the operator in chat only when the audit found a tracked change that no earlier status message reported, such as a PR opened, a code-ready head, a round launched or closed, a verdict, a merge, a stuck agent and the action taken, a blocker added or cleared, or a decision only the operator can make. Name every such change and nothing else. Do not repeat a table, the merged list, or an unchanged blocker. If the audit found none, end the turn with no reply text. Either way, log this tick's row in your decision trail. The row names the items reported, or none."
- [ ] On the operator's hold or stand-down, send every owner a zero-writes order at once.

### Spawn owners

- [ ] Spawn one owner per PR with the full lifecycle the execution playbook names. Every spawn uses the model and effort in Appendix E. Probe Codex with a one-line prompt before the first fan-out of each session.
- [ ] Follow this dependency graph. Base dependent work on the parent branch, since the execution playbook stacks.
  - [ ] HL-1 and HL-2 are independent and first. Both branch from `main`.
  - [ ] HL-3 after HL-1. It reuses the restored test harness.
  - [ ] HL-4 after HL-1.
  - [ ] HL-5 after HL-4.
  - [ ] HL-6 after HL-5.
  - [ ] HL-7 after HL-1 and HL-11. It signs user actions through HL-11's wallet adapter. It can run beside HL-3 to HL-6.
  - [ ] HL-11 is independent and first. It branches from `main`.
  - [ ] HL-8 after HL-1.
  - [ ] HL-9 is independent. It branches from `main`.
  - [ ] HL-10 is independent. It branches from `main`. It was added from an operator report on 2026-11-13.
- [ ] Hold the file boundaries.
  - [ ] HL-1 touches only `apps/terminal/src/lib/trade/**`, `apps/terminal/src/domain/trade/**`, `apps/terminal/src/hooks/trade/use-order-submit.ts`, `apps/terminal/src/hooks/trade/use-order-entry-data.ts`, `scripts/hl-live/scan-wire.ts`, `scripts/hl-live/bench-plan.ts`, test files, `vitest.config.ts` and `package.json`.
  - [ ] HL-2 touches only `packages/hl-react/src/signing/agent-utils.ts`, its test, and the builder fee display.
  - [ ] HL-7 touches only `scripts/hl-live/**` other than the two HL-1 scripts, and CI config.
  - [ ] HL-9 touches only `packages/hl-react/src/clients.ts`, `packages/hl-react/src/signing/**` other than `agent-utils.ts`, and their tests.
- [ ] Hold the review gate. HL-5 and HL-6 change an interaction. They wait for the operator's review in chat with screenshots and a video before merge.

### PR mechanics, for every PR

- [ ] Resolve the forge once. This repo has no PR flow. Each PR is a local branch the operator fast-forwards into `main`. Record that in the decision trail. Never require `gt`.
- [ ] Commit as `vipineth`. Check `git config user.email` before the first commit.
- [ ] Run `pnpm -w lint` and `pnpm --filter terminal typecheck` once before handing a head to the operator. The pre-commit hook runs lingui extract and can time out. If it does, run its steps by hand and commit with `--no-verify`.
- [ ] Run `/deslop` before each commit and `/no-comments` before review.
- [ ] Triage every AI reviewer comment per `../references/bugbot-triage.md`.
- [ ] Rebase onto current trunk before the code-ready report. Rebase again only at merge prep or on a conflict with trunk.

### Verdict and merge, for every PR

- [ ] A full swarm runs once, at the code-ready head. Another full swarm runs only for new behavior, a redesign, or a large new diff. A rebase, a merge-conflict resolution, or a minor fix gets a single verifier at the new head, and a wording-only change gets none. Run each full swarm per `skills/swarm/SKILL.md`. One gates lane. The ten live lanes from the PR's **Verify, live** block. The perf lane from its **Verify, perf** block. Two or more audit lanes, one of them on `cli:codex:gpt-6.1-sol`, that read the diff and the receipts and distrust the PR body. The root audits the receipts in the merge-ready report before the verdict.
- [ ] Judge every finding by the execution playbook's blocking rule. Any finding that can send a wrong size, a wrong price, a wrong side, a wrong asset, or a wrong reduce-only flag blocks, with no exceptions. The verdict is clean when none blocks. A failure on trunk behavior in a lane marked `Regression lane against trunk.` is recorded against trunk and does not block the PR.
- [ ] Hand the verified head to the operator. The operator fast-forwards it into `main`. A head whose patch-id matches the verified head keeps its verdict, per the patch-id rule in `playbooks/shipping.md`.

### Boot recipe, for every live lane

Each live lane runs in its own git worktree at the PR head on this machine. Drive the browser through the `verify-hypeterminal` skill, which is this repo's `control-ui`.

- [ ] `git fetch && git worktree add ../wt-<pr-id>-<n> <head SHA>`.
- [ ] `pnpm install --frozen-lockfile`, then `pnpm --filter terminal dev --port <5200+n>`. Wait for the page to render the market list.
- [ ] Start the app with `VITE_HYPERLIQUID_TESTNET=true` and connect the program's testnet wallet, principal `0x9fED7c631d8d525Ce642402C0e36A73cf5C77c1c` with approved agent `hl-live` `0x16F05e773CE03B84Fbb6c55B0642B0B7c6A1aCBb`. Keys live in `apps/terminal/.env.local`, which git ignores. Lanes that place orders use testnet only. Mainnet lanes are read-only and stop before signing. That principal key also holds 20 real mainnet USDC, so every script asserts `transport.isTestnet` before it signs.
- [ ] Deliver input only through the control skill's commands. Read-only diagnostics are the network panel, console messages, and `curl` against `/info`.
- [ ] Save every screenshot to `/tmp/swarm-<pr-id>/worker-<n>/<slug>.png` and return the paths with the report.

## Let browser wallets sign Hyperliquid user actions again (HL-11)

**Depends on.** None.

**Files.**

- [ ] Edit `packages/hl-react/src/wallet.ts`.
- [ ] Create `packages/hl-react/src/wallet.test.ts`.

**Build.**

- [ ] Send `eth_signTypedData_v4` straight to the wallet through the EIP-1193 request in both branches of `toHyperliquidWallet`, with typed data serialized by the adapter. viem 2.57.16 validates struct names and throws on `HyperliquidTransaction:*` before the wallet sees the request.
- [ ] Check every other `signTypedData` call site, including agent signing and mobile sync, and record each as fixed or unaffected.
- [ ] Record whether a viem release after 2.57.16 fixes the validation. Pin viem only as an extra guard, never as the only fix.

**You see.**

- [ ] Rabby shows the `ApproveAgent` prompt on first trade instead of the app throwing `InvalidStructTypeError`.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `wallet.test.ts` drives `toHyperliquidWallet` with a fake EIP-1193 transport for every user-signed primary type in SDK 0.33.3. It fails on trunk and passes on head.
- [ ] A recovery test signs one payload through the adapter with a local key and recovers the signer from an independently computed EIP-712 digest.
- [ ] One 1 USDC testnet `usdSend` back to the principal through the adapter returns status `ok`, with `transport.isTestnet` asserted first.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `sonnet@high` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. In the operator's browser with Rabby, try a first `xyz:NVDA` order on a fresh session at trunk and head on testnet. Save `first-trade.png`. Pass when head reaches the Rabby `ApproveAgent` prompt and trunk's error text is recorded.
- [ ] Lane 2. Approve agent on testnet through Rabby. Save `approve-agent.png`. Pass when `extraAgents` lists the new agent.
- [ ] Lane 3. Approve builder fee. Save `approve-fee.png`. Pass when `maxBuilderFee` returns 10.
- [ ] Lane 4. Send 1 USDC between two testnet addresses. Save `send.png`. Pass when the ledger shows the send.
- [ ] Lane 5. Move USDC between perp and spot. Save `class-transfer.png`. Pass when both balances change by the amount.
- [ ] Lane 6. Withdraw prompt on testnet. Save `withdraw.png`. Pass when Rabby shows the `Withdraw` prompt with the right amount, then reject it.
- [ ] Lane 7. Agent-signed order after approval. Save `agent-order.png`. Pass when the order rests with no wallet prompt.
- [ ] Lane 8. WalletConnect wallet path. Save `walletconnect.png`. Pass when the prompt reaches the phone wallet.
- [ ] Lane 9. Reject the prompt in Rabby. Save `reject.png`. Pass when the UI recovers with a clear message.
- [ ] Lane 10. Mobile layout first trade. Save `mobile-first-trade.png`. Pass when the approval prompt appears.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time from clicking Approve to the wallet prompt opening.
- [ ] Probe. Five interleaved runs at viem 2.57.0 trunk-equivalent and head through the control skill.
- [ ] Baseline. Record the 2.57.0 time first, since trunk throws and has no time.
- [ ] Rule. Fail when head exceeds the baseline by more than 100 ms.

**Review gate.** None. HL-11 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] AI reviewer triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The operator fast-forwards HL-11 into `main` first, the same day.

## Fix order wire formatting and restore tests (HL-1)

**Depends on.** None.

**Files.**

- [ ] Edit `apps/terminal/src/lib/trade/numbers.ts`.
- [ ] Edit `apps/terminal/src/domain/trade/orders.ts`.
- [ ] Edit `apps/terminal/src/domain/trade/order/price.ts`.
- [ ] Edit `apps/terminal/src/domain/trade/order-intent.ts`.
- [ ] Edit `apps/terminal/src/hooks/trade/use-order-submit.ts`.
- [ ] Edit `apps/terminal/src/hooks/trade/use-order-entry-data.ts`.
- [ ] Create `apps/terminal/src/domain/trade/twap.ts`.
- [ ] Create `scripts/hl-live/scan-wire.ts` and `scripts/hl-live/bench-plan.ts`.
- [ ] Create `apps/terminal/vitest.config.ts`.
- [ ] Create `apps/terminal/src/domain/trade/orders.test.ts`.
- [ ] Create `apps/terminal/src/domain/trade/live-meta.test.ts`.
- [ ] Edit `apps/terminal/package.json` to add a `test` script.

**Build.**

- [ ] Replace the bodies of `formatSizeForOrder` and `formatPriceForOrder` in `orders.ts` with the SDK's `formatSize(size, szDecimals)` and `formatPrice(price, szDecimals, "perp" | "spot")`. Pass `szDecimals` and market kind to every caller.
  - [ ] Thread market kind through `buildOrders`, TP/SL, trigger, scale, TWAP, close, reverse and swap callers.
  - [ ] Delete `formatDecimalFloor` in `numbers.ts`, whose `/\.?0+$/` strip turns `"100"` into `"1"`. Migrate its callers in the same commit.
- [ ] Round limit prices toward the passive side. A buy rounds down and a sell rounds up. Market IOC prices round toward the aggressive side so slippage is never tighter than requested.
- [ ] Reject a size that formats to zero and a notional under 10 collateral units before signing, with a typed error. Check notional on the final wire price and size of every leg, never on an average.
- [ ] Size quote-denominated limit orders from the limit price, not the mark. `use-order-entry-data.ts:68` passes mark as `conversionPrice`, so 100 USDC at mark 100 with a limit of 200 sends a 200 USDC order and the balance check passes on 100. Validate the balance against the wire notional plus fees.
- [ ] Allocate scale order remainders in whole lots so leg sizes sum to the requested total. Today 18 units over 5 levels sends 15.
- [ ] Move the TWAP payload out of `use-order-submit.ts` into `twap.ts` as a pure builder, and make `buildOrderPlan` reject `orderType: "twap"` instead of returning a GTC limit.
- [ ] Restore vitest. Recover the deleted cases from `git show 601e324^:apps/terminal/src/lib/tests/` for orders, order-plan, numbers and balances, and keep the ones that still describe behavior.
- [ ] Add `live-meta.test.ts`. It loads a committed snapshot of `allPerpMetas` and `spotMeta` and runs `buildOrderPlan` for every live market, both sides, every order kind, and asserts each wire price and size passes the documented tick and lot rules.

**You see.**

- [ ] `pnpm --filter terminal test` prints the live-meta suite green with a count of markets checked of at least 700 plans.
- [ ] A 100 DOGE close builds a reduce-only order with size `"100"`.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `orders.test.ts` gains cases for sizes 10, 100 and 250 at `szDecimals` 0, a DYDX market buy price at `szDecimals` 1, and the passive rounding direction for buy and sell limits. Run `pnpm --filter terminal test orders`.
- [ ] Cases for quote sizing with mark 100, limit 200, input 100 USDC and balance 150, which must be blocked. Scale 18 over 5 must sum to 18. Scale legs below 10 USDC must be blocked even when the average passes. `buildOrderPlan` with `twap` must error, and `twap.ts` must pin action type, size, minutes, side and reduce-only. These cases come from the Codex review in Appendix A.
- [ ] `live-meta.test.ts` asserts the order kind of each wire payload as well as its numeric strings.
- [ ] `live-meta.test.ts` fails on trunk's formatters and passes on the head. Run `pnpm --filter terminal test live-meta` on both and save both outputs.
- [ ] The scratchpad scan `headless.ts` from the audit, ported to `scripts/hl-live/scan-wire.ts`, reports 0 invalid plans across live mainnet meta. Run `bun scripts/hl-live/scan-wire.ts`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `sonnet@high` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. On testnet, open a 100 unit position on a `szDecimals` 0 market, then click Close at trunk and at head. Save `close-size.png`. Pass when the head's signed payload shows `s: "100"` and the position goes to zero, and the trunk result is recorded.
- [ ] Lane 2. Market buy on a `szDecimals` 1 market priced under 1. Save `sub-dollar-market.png`. Pass when the order fills and the payload price has at most 5 sig figs and `6 - szDecimals` decimals.
- [ ] Lane 3. Limit buy entered at a price with too many decimals. Save `limit-buy-round.png`. Pass when the sent price is at or below the typed price.
- [ ] Lane 4. Limit sell with too many decimals. Save `limit-sell-round.png`. Pass when the sent price is at or above the typed price.
- [ ] Lane 5. Entry with TP and SL on BTC. Save `tpsl.png`. Pass when all three legs rest or fill with valid prices and the TP and SL are reduce-only.
- [ ] Lane 6. Scale order of 18 units over 5 legs on a `szDecimals` 0 market. Save `scale.png`. Pass when the leg sizes sum to 18 and none is rejected.
- [ ] Lane 7. TWAP of 100 units on a `szDecimals` 0 market. Save `twap.png`. Pass when the TWAP state shows total size 100.
- [ ] Lane 8. Spot buy and sell on a spot pair. Save `spot.png`. Pass when both orders use the spot decimal rule and fill.
- [ ] Lane 9. Spot limit buy in USDC terms with the limit at twice the mark and a balance between the two notionals. Save `quote-limit.png`. Pass when the app blocks it before signing, or sizes it so the wire notional equals the typed USDC.
- [ ] Lane 10. Reverse a 250 unit position on a `szDecimals` 0 market. Save `reverse.png`. Pass when the new position is minus 250.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Median time for `buildOrderPlan` over the full live-meta plan set.
- [ ] Probe. `bun scripts/hl-live/bench-plan.ts` run 5 times interleaved at trunk and head.
- [ ] Baseline. Record the trunk median first.
- [ ] Rule. Fail when the head median exceeds trunk by more than 25 percent or a single plan exceeds 1 ms.

**Review gate.** None. HL-1 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] AI reviewer triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The operator fast-forwards HL-1 into `main` the same day.

## Fix builder fee approval amount (HL-2)

**Depends on.** None.

**Files.**

- [ ] Edit `packages/hl-react/src/signing/agent-utils.ts`.
- [ ] Create `packages/hl-react/src/signing/agent-utils.test.ts`.

**Build.**

- [ ] Fix `convertFeeToPercentageString`. The builder `f` value is in tenths of a basis point, so `f = 10` is `"0.01%"`, not `"0.1%"`. Compute it with big.js and return the string.
- [ ] Make `isBuilderFeeApproved` compare in the same unit the info query `maxBuilderFee` returns, with a test that pins the unit.

**You see.**

- [ ] The approve builder fee prompt shows `0.01%` for the configured fee.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `agent-utils.test.ts` covers `f` of 1, 10 and 100 and the approved comparison. Run `pnpm --filter @hypeterminal/hl-react test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `sonnet@high` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Fresh testnet wallet starts builder fee approval at trunk and head. Save `fee-prompt.png`. Pass when the head's signed `maxFeeRate` is `0.01%` and trunk's value is recorded.
- [ ] Lane 2. After approval, query `maxBuilderFee` by curl. Save `fee-query.png`. Pass when it returns 10.
- [ ] Lane 3. Place a BTC order after approval. Save `fee-order.png`. Pass when the order carries the builder field and is accepted.
- [ ] Lane 4. Reload and place again. Save `fee-reload.png`. Pass when no second approval prompt appears.
- [ ] Lane 5. Wallet that approved 0.1% on trunk loads the head. Save `fee-legacy.png`. Pass when no new prompt appears and orders work.
- [ ] Lane 6. Reject the approval in the wallet. Save `fee-reject.png`. Pass when the UI shows a recoverable state and no order is sent.
- [ ] Lane 7. Mobile viewport approval flow. Save `fee-mobile.png`. Pass when the same fee string shows.
- [ ] Lane 8. Spot order after approval. Save `fee-spot.png`. Pass when it is accepted.
- [ ] Lane 9. HIP-3 order attempt after approval on a funded testnet builder dex, if one exists. Save `fee-hip3.png`. Pass when the order carries the builder field, or the lane records that testnet has no funded builder dex.
- [ ] Lane 10. Settings page fee display. Save `fee-settings.png`. Pass when it reads 0.01%.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time from clicking approve to the wallet prompt.
- [ ] Probe. Five interleaved runs at trunk and head through the control skill.
- [ ] Baseline. Record the trunk median first.
- [ ] Rule. Fail when the head median exceeds trunk by more than 100 ms.

**Review gate.** None. HL-2 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] AI reviewer triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The operator fast-forwards HL-2 into `main` the same day.

## Report each order leg truthfully and make retries safe (HL-3)

**Depends on.** HL-1.

**Files.**

- [ ] Edit `apps/terminal/src/hooks/trade/use-submit-plan.ts`.
- [ ] Edit `apps/terminal/src/lib/trade/extract-order-status.ts`.
- [ ] Edit `apps/terminal/src/domain/trade/order-intent.ts`.
- [ ] Create `apps/terminal/src/lib/trade/extract-order-status.test.ts`.

**Build.**

- [ ] Catch the SDK error the bulk order call throws when any leg errors, read the per-leg `statuses` it carries, and pass them to `interpretOrderStatuses`. A partial result becomes a per-leg toast, never a whole-plan failure.
- [ ] Give every order a `cloid` derived from the plan id and leg index. A retry of the same plan reuses the same cloids, so the exchange rejects a duplicate instead of doubling the position.
- [ ] After any partial failure, refresh open orders and positions before re-enabling submit.

**You see.**

- [ ] An entry that fills with a rejected TP leg shows "Entry filled. Take profit rejected" with the exchange reason.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `extract-order-status.test.ts` covers all ok, all error, filled plus error, resting plus error, and the thrown SDK error shape copied from `_base/_shell.js`. Run `pnpm --filter terminal test extract-order-status`.
- [ ] A test asserts the same plan builds the same cloids twice.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `sonnet@high` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. On testnet, place an entry with a TP priced to be rejected at trunk and head. Save `partial.png`. Pass when the head reports the fill and the TP error separately and trunk's report is recorded.
- [ ] Lane 2. Click retry after lane 1. Save `retry.png`. Pass when the position size is unchanged.
- [ ] Lane 3. Double-click submit on a market order. Save `double-click.png`. Pass when exactly one fill appears in `userFills`.
- [ ] Lane 4. Kill the network after signing and restore it. Save `offline.png`. Pass when the UI reconciles with the exchange state and shows no false failure.
- [ ] Lane 5. Scale order where one post-only leg is priced to cross the book, so only the exchange rejects it. Save `scale-partial.png`. Pass when the other legs rest and the rejected leg is named.
- [ ] Lane 6. Cancel all with one already filled order. Save `cancel-partial.png`. Pass when the UI names the order that could not be cancelled.
- [ ] Lane 7. Close position with a stale size after a partial fill elsewhere. Save `close-stale.png`. Pass when the reduce-only close never flips the position.
- [ ] Lane 8. All legs rejected. Save `all-rejected.png`. Pass when one clear failure shows.
- [ ] Lane 9. Mobile trade ticket with a partial result. Save `partial-mobile.png`. Pass when the same per-leg message shows.
- [ ] Lane 10. TWAP rejected for size. Save `twap-reject.png`. Pass when the exchange reason shows.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time from exchange response to toast render.
- [ ] Probe. Five interleaved testnet submits at trunk and head, timed from the network response event to the toast DOM node.
- [ ] Baseline. Record the trunk median first.
- [ ] Rule. Fail when the head median exceeds trunk by more than 50 ms.

**Review gate.** None. HL-3 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] AI reviewer triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The operator fast-forwards HL-3 into `main`.

## Parse one market model at the boundary (HL-4)

**Depends on.** HL-1.

**Files.**

- [ ] Create `apps/terminal/src/domain/market/model.ts`.
- [ ] Create `apps/terminal/src/domain/market/model.test.ts`.
- [ ] Edit `apps/terminal/src/lib/hyperliquid/markets/use-markets.tsx` to call the model.
- [ ] Edit `apps/terminal/src/domain/trade/orders.ts` and `apps/terminal/src/domain/trade/order-intent.ts`.
- [ ] Delete `packages/hl-react/src/asset-id.ts`.
- [ ] Delete `isPerpOnlyIsolated` in `packages/hl-react/src/types/markets.ts`.

**Build.**

- [ ] Move `createMarkets` out of the React file into `model.ts` as a pure function from `perpDexs`, `allPerpMetas` and `spotMeta` to a `Market` record keyed by full coin name.
  - [ ] `Market` holds `coin`, `dex`, `assetId`, `kind`, `szDecimals`, `maxLeverage`, `crossAllowed` from `marginMode`, `collateralToken`, `isDelisted`, and a branded `PriceWire` and `SizeWire` formatter bound to it.
  - [ ] Key every lookup by full coin, such as `xyz:NVDA`. Delete the display name lookup that lets `io:NVDA` overwrite `xyz:NVDA`.
- [ ] Order intents carry strings and the `Market`, never `number` price or size. The swap path in `order-intent.ts` moves to big.js.
- [ ] Keep one default leverage function. Delete the copy in `use-asset-leverage.ts` and pass `dex` to `hasPosition`.
- [ ] Block order entry on `isDelisted` markets and hide them from search.

**You see.**

- [ ] Searching NVDA shows only `xyz:NVDA` and `io:NVDA` with their dex labels.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `model.test.ts` runs the committed live snapshot and asserts `xyz:NVDA` is asset 110002, `io:NVDA` is 200014, delisted entries do not shift ids, and `crossAllowed` matches `marginMode` for every xyz asset. Run `pnpm --filter terminal test model`.
- [ ] `live-meta.test.ts` from HL-1 still passes with the model wired in.
- [ ] `pnpm --filter terminal typecheck` shows no `number` typed price or size reaching `buildOrders`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `sonnet@high` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Open BTC, ETH, a spot pair and a HIP-3 market at trunk and head and stop at the signing prompt. Save `asset-ids.png`. Pass when the head's asset ids equal trunk's for all four.
- [ ] Lane 2. Search NVDA on mainnet read-only. Save `search-nvda.png`. Pass when no delisted listing appears.
- [ ] Lane 3. Open a `noCross` xyz market. Save `no-cross.png`. Pass when cross is disabled with a reason.
- [ ] Lane 4. Open `xyz:NVDA`. Save `nvda-cross.png`. Pass when cross is allowed.
- [ ] Lane 5. Change leverage on a HIP-3 market with an open position on another dex. Save `leverage-dex.png`. Pass when the position check reads the right dex.
- [ ] Lane 6. Swap on testnet. Save `swap.png`. Pass when the signed size matches the big.js result exactly.
- [ ] Lane 7. Deep link to a delisted coin. Save `delisted-link.png`. Pass when entry is blocked with a message.
- [ ] Lane 8. Place a BTC limit order on testnet. Save `btc-limit.png`. Pass when it rests.
- [ ] Lane 9. Mobile market page for `io:NVDA`. Save `mobile-io-nvda.png`. Pass when the header and ticket both show `io:NVDA`.
- [ ] Lane 10. Switch between two NVDA listings quickly. Save `nvda-switch.png`. Pass when the ticket never shows the other listing's price.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time to build the market model from the three `/info` payloads, and first market list render.
- [ ] Probe. `bun scripts/hl-live/bench-model.ts` plus five interleaved page loads at trunk and head.
- [ ] Baseline. Record trunk's `createMarkets` time and first render first.
- [ ] Rule. Fail when model build exceeds trunk by more than 20 percent or first render regresses by more than 100 ms.

**Review gate.** None. HL-4 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] AI reviewer triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The operator fast-forwards HL-4 into `main`.

## Model account mode and per-dex collateral (HL-5)

**Depends on.** HL-4.

**Files.**

- [ ] Create `apps/terminal/src/domain/trade/account-mode.ts`.
- [ ] Create `apps/terminal/src/domain/trade/account-mode.test.ts`.
- [ ] Edit `apps/terminal/src/domain/trade/balances.ts`.
- [ ] Edit `apps/terminal/src/hooks/trade/use-account-balances.ts`.
- [ ] Edit `apps/terminal/src/components/trade/tradebox/account-panel.tsx` and `trade-panel.tsx`.

**Build.**

- [ ] Parse `userAbstraction` into one `AccountMode` union of `standard`, `unified` and `portfolio`. Map `"disabled"`, `"default"` and `null` to `standard`. Map the legacy `dexAbstractionEnabled` flag to a `standard` with a `legacyDexAbstraction` marker the UI can warn about.
- [ ] Revert the string cast in `isQuoteBalanceSharedWithPerps` from 516b41c and derive sharing from `AccountMode`.
- [ ] Size every order from `activeAssetData.availableToTrade`, which is mode-aware. Never read per-dex `clearinghouseState.withdrawable` for unified or portfolio accounts.
- [ ] The account panel shows the collateral that backs the selected market, per mode and per dex, not the main dex balance.
- [ ] Show the hidden error. When available is 0 on a builder dex, the ticket says which dex holds no collateral and offers the HL-6 action.

**You see.**

- [ ] A standard account with main dex USDC on `xyz:NVDA` shows "No USDC on xyz. Move funds to trade" instead of a silent Deposit button.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `account-mode.test.ts` covers every raw `userAbstraction` value seen live, including `null` and `"default"`, using fixtures captured from the public accounts in the research notes. Run `pnpm --filter terminal test account-mode`.
- [ ] `balances.test.ts` restored in HL-1 gains unified, portfolio and standard cases for a USDC builder dex and a USDH builder dex.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `sonnet@high` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Standard testnet account with main dex USDC opens a builder dex market at trunk and head. Save `standard-builder.png`. Pass when the head names the empty dex and trunk's silent Deposit state is recorded.
- [ ] Lane 2. Unified testnet account opens the same market. Save `unified-builder.png`. Pass when available equals spot USDC available.
- [ ] Lane 3. Unified account on the main dex. Save `unified-main.png`. Pass when available matches `activeAssetData`.
- [ ] Lane 4. Standard account on the main dex. Save `standard-main.png`. Pass when nothing changed from trunk.
- [ ] Lane 5. Mainnet read-only, view-as a public unified address from the research notes. Save `view-unified.png`. Pass when the panel matches `activeAssetData`.
- [ ] Lane 6. Mainnet read-only, view-as a public standard address. Save `view-standard.png`. Pass when the xyz balance matches `clearinghouseState{dex:"xyz"}`.
- [ ] Lane 7. Balances tab for a unified account. Save `balances-unified.png`. Pass when no per-dex withdrawable is shown as spendable.
- [ ] Lane 8. Mobile balances tab for a standard account with funds on two dexes. Save `balances-mobile.png`. Pass when each dex row is shown.
- [ ] Lane 9. Transfer modal for a unified account. Save `transfer-unified.png`. Pass when the meaningless perp to spot move is hidden or explained.
- [ ] Lane 10. Switch wallets between a unified and a standard account. Save `switch-mode.png`. Pass when the panel updates within one stream tick.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Extra `/info` requests and websocket subscriptions per page load.
- [ ] Probe. Count requests in the network panel over five interleaved loads at trunk and head.
- [ ] Baseline. Record the trunk counts first.
- [ ] Rule. Fail when the head adds more than one info request or one subscription per load.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 1, 2 and 7 screenshots into `docs/plans/media/HL-5-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of the standard and unified states. Save it as `docs/plans/media/HL-5-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's go.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] AI reviewer triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The operator fast-forwards HL-5 into `main`.

## Let users fund builder dexes (HL-6)

**Depends on.** HL-5.

**Files.**

- [ ] Edit `apps/terminal/src/components/trade/positions/transfer-modal.tsx`.
- [ ] Edit `apps/terminal/src/components/trade/positions/send-modal.tsx`.
- [ ] Create `apps/terminal/src/components/trade/tradebox/fund-dex-prompt.tsx`.
- [ ] Create `apps/terminal/src/domain/trade/dex-transfer.ts` and its test.

**Build.**

- [ ] Add a dex picker to the transfer modal. It moves the dex's collateral token with `sendAsset`, `sourceDex` and `destinationDex` set, and the token string `NAME:0xtokenId` from `spotMeta`.
  - [ ] Use `agentSendAsset` when an agent wallet is active, so no wallet popup is needed. Destination must equal the account address.
  - [ ] Cap withdrawals from a dex at `max(initial margin, 10 percent of position value)` left behind.
- [ ] Add the operator's chosen second path from Appendix C, offering unified account through `userSetAbstraction` with a plain explanation of what changes.
- [ ] The HL-5 ticket prompt opens this flow prefilled with the dex and the amount needed.

**You see.**

- [ ] On testnet, a standard account moves 50 USDC to a builder dex and places an order there without leaving the ticket.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `dex-transfer.test.ts` asserts the action shape for main to xyz, xyz to main, spot to a USDH dex, and the withdrawal cap. Run `pnpm --filter terminal test dex-transfer`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `sonnet@high` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Trunk lacks dex transfers, so record that and gate the new end state. A standard testnet account moves USDC to a builder dex at head. Save `fund-dex.png`. Pass when `clearinghouseState{dex}` shows the amount and an order on that dex is accepted.
- [ ] Lane 2. Move the funds back. Save `defund-dex.png`. Pass when the main dex balance is restored.
- [ ] Lane 3. Try to withdraw below the margin floor with an open position. Save `defund-cap.png`. Pass when the app blocks it before signing.
- [ ] Lane 4. Agent wallet path. Save `agent-send.png`. Pass when no wallet popup appears and the transfer lands.
- [ ] Lane 5. Main wallet path with no agent. Save `user-send.png`. Pass when the EIP-712 prompt names `SendAsset` and the transfer lands.
- [ ] Lane 6. Non-USDC dex on testnet, if one exists. Save `usdh-dex.png`. Pass when the correct token string is sent, or the lane records that testnet has none.
- [ ] Lane 7. Enable unified account through the second path. Save `enable-unified.png`. Pass when `userAbstraction` reads `unifiedAccount` and the builder market shows spot available.
- [ ] Lane 8. Ticket prompt shortcut. Save `ticket-prompt.png`. Pass when the modal opens prefilled.
- [ ] Lane 9. Mobile transfer flow. Save `mobile-fund.png`. Pass when the same move works on the mobile layout.
- [ ] Lane 10. Reject the signature. Save `fund-reject.png`. Pass when no state changes and the UI recovers.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Trunk lacks the feature. Measure the time from confirm to the destination balance updating in the UI, and the transfer modal open time at trunk and head.
- [ ] Probe. Five head runs of the transfer, and five interleaved modal opens at trunk and head.
- [ ] Baseline. Record the trunk modal open time first.
- [ ] Rule. Fail when the balance takes more than 3 s after the exchange response, or modal open regresses by more than 100 ms.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 1, 7 and 8 screenshots into `docs/plans/media/HL-6-review-<slug>.png`.
- [ ] Record a 30 to 60 second video from blocked ticket to filled order. Save it as `docs/plans/media/HL-6-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's go.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] AI reviewer triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The operator fast-forwards HL-6 into `main`.

## Build a live testnet harness for every trading action (HL-7)

**Depends on.** HL-1.

**Files.**

- [ ] Create `scripts/hl-live/run.ts`.
- [ ] Create `scripts/hl-live/scenarios/*.ts`.
- [ ] Create `scripts/hl-live/README.md`.
- [ ] Edit CI config to run the read-only scan on every push and the testnet run nightly.

**Build.**

- [ ] A harness that drives the app's own pure order builders and sends to testnet with two keys from env, a dedicated testnet principal and its approved agent. Agent scenarios sign with the agent. User-signed scenarios, `usdClassTransfer`, `sendAsset` and `userSetAbstraction`, sign with the principal. `agentSendAsset` and `agentSetAbstraction` run as separate agent scenarios. Every assertion reads the principal's account.
  - [ ] Scenarios cover market, limit, post-only, IOC, reduce-only, TP/SL with `normalTpsl` and `positionTpsl`, scale, TWAP, cancel, cancel all, modify, leverage update, isolated margin add and remove, close, reverse, spot buy and sell, usd class transfer, dex `sendAsset`, and abstraction switch.
  - [ ] Each scenario runs on the main dex and on a testnet builder dex when one is available.
  - [ ] Each scenario cleans up its positions and orders, so a rerun converges to the same start state.
- [ ] A read-only mainnet mode that only builds and validates every plan against live meta, with no signing.
- [ ] A drift check that diffs the live `perpDexs`, `meta` field names and `userAbstraction` values against the committed snapshot and fails on a new field or enum value.

**You see.**

- [ ] `bun scripts/hl-live/run.ts --testnet` prints one pass line per scenario per dex and a final count.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] The harness's assertion helpers have their own tests. Run `pnpm --filter terminal test hl-live`.
- [ ] The drift check fails when a fake new `marginMode` value is injected into the snapshot.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `sonnet@high` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Trunk lacks the harness, so record that and gate the full testnet run at head. Save `harness-run.png` of the terminal output. Pass when every scenario passes on the main dex.
- [ ] Lane 2. Same run on a testnet builder dex. Save `harness-hip3.png`. Pass when every scenario passes, or the lane records which scenarios testnet cannot support.
- [ ] Lane 3. Run twice in a row. Save `harness-rerun.png`. Pass when the second run starts from a clean account.
- [ ] Lane 4. Kill the harness mid-run and rerun. Save `harness-crash.png`. Pass when the rerun cleans up and passes.
- [ ] Lane 5. Read-only mainnet mode. Save `harness-readonly.png`. Pass when it reports 0 invalid plans and no request goes to `/exchange`.
- [ ] Lane 6. Drift check against live mainnet. Save `harness-drift.png`. Pass when it passes or names the drifted field.
- [ ] Lane 7. Break HL-1's size fix locally and run. Save `harness-catches.png`. Pass when the close scenario fails.
- [ ] Lane 8. Revoke the agent and run. Save `harness-agent.png`. Pass when agent scenarios fail with a clear agent error and principal scenarios still pass.
- [ ] Lane 9. Unfunded testnet account. Save `harness-unfunded.png`. Pass when it stops before the first order with a funding message.
- [ ] Lane 10. Check the UI after a harness run with the same wallet. Save `harness-ui.png`. Pass when the app shows the same fills and no open orders.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Trunk lacks the harness. Measure the full testnet run time and the read-only mainnet scan time at head.
- [ ] Probe. Three runs of each mode at head.
- [ ] Baseline. Record the first head run as the baseline, since trunk has no harness.
- [ ] Rule. Fail when the testnet run exceeds 10 minutes or the read-only scan exceeds 60 s.

**Review gate.** None. HL-7 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] AI reviewer triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The operator fast-forwards HL-7 into `main`.

## Validate position triggers against mark price (HL-8)

**Depends on.** HL-1.

**Files.**

- [ ] Edit `apps/terminal/src/components/trade/positions/position-tpsl-modal.tsx`.
- [ ] Edit `apps/terminal/src/lib/trade/tpsl.ts`.
- [ ] Create `apps/terminal/src/lib/trade/tpsl.test.ts`.

**Build.**

- [ ] Validate TP and SL placement against the current mark price, since Hyperliquid triggers on mark. Keep entry price for PnL display only. Today `position-tpsl-modal.tsx:61` uses entry, so a long at 100 marked at 120 cannot set a stop at 110, and a long marked at 80 can set an already crossed stop at 90.
- [ ] Error copy names mark, as in "SL must be below mark".
- [ ] Apply the same rule in the order ticket TP/SL path that `use-order-submit.ts` uses for a new position.

**You see.**

- [ ] A profitable long can set a stop between entry and mark.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `tpsl.test.ts` covers long and short, profitable and losing, and already crossed triggers, using the Codex `stop-profit` cases. Run `pnpm --filter terminal test tpsl`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `sonnet@high` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. On testnet, open a long, wait for mark above entry, and set a stop between entry and mark at trunk and head. Save `profit-stop.png`. Pass when the head accepts it and the stop rests, and trunk's rejection is recorded.
- [ ] Lane 2. Long with mark below entry, stop above mark. Save `crossed-stop.png`. Pass when the head blocks it with a mark-based message.
- [ ] Lane 3. Short with mark below entry, stop between mark and entry. Save `short-profit-stop.png`. Pass when it is accepted.
- [ ] Lane 4. Short with mark above entry, stop below mark. Save `short-crossed.png`. Pass when it is blocked.
- [ ] Lane 5. TP on a long below mark. Save `tp-crossed.png`. Pass when it is blocked.
- [ ] Lane 6. TP and SL together on a profitable long. Save `tp-sl-both.png`. Pass when both rest as reduce-only.
- [ ] Lane 7. Mark moves while the modal is open. Save `mark-moves.png`. Pass when validation updates to the new mark.
- [ ] Lane 8. HIP-3 position on a funded testnet builder dex, if one exists. Save `hip3-tpsl.png`. Pass when it behaves like lane 1, or the lane records that testnet has none.
- [ ] Lane 9. Mobile position sheet stop edit. Save `mobile-tpsl.png`. Pass when the same rule applies.
- [ ] Lane 10. New order ticket with TP/SL attached. Save `ticket-tpsl.png`. Pass when the ticket uses the same mark-based rule.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Modal render count per mark tick.
- [ ] Probe. React profiler over 30 s of mark updates with the modal open, interleaved at trunk and head.
- [ ] Baseline. Record trunk's count first.
- [ ] Rule. Fail when the head renders more than one extra time per tick.

**Review gate.** None. HL-8 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] AI reviewer triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The operator fast-forwards HL-8 into `main`.

## Keep agent nonces unique across tabs (HL-9)

**Depends on.** None.

**Files.**

- [ ] Edit `packages/hl-react/src/clients.ts`.
- [ ] Edit `packages/hl-react/src/signing/agent-storage.ts`.
- [ ] Create `packages/hl-react/src/signing/nonce.ts` and its test.

**Build.**

- [ ] Pass a nonce manager to every `ExchangeClient` that allocates across tabs sharing one agent. Each tab leases one of 16 residue lanes with `navigator.locks`. A shared localStorage counter under a lock was measured at 21 to 34 duplicates per 6000 in Chromium, so it is rejected. Guard browser APIs for SSR.
- [ ] Never let a lane run ahead of the clock by more than one stride. Wait for the clock instead. Persist each lane's high-water mark, written only by its lock owner, so a reacquired lane never reissues a nonce. Keep fallback callers off every leased residue. These come from the Codex round 1 findings in Appendix A.
- [ ] Keep the per-signer rule from the docs. Nonces stay inside the T minus 2 days to T plus 1 day window.

**You see.**

- [ ] Two tabs placing orders in the same millisecond both get accepted.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `nonce.test.ts` runs two managers against shared storage with a frozen clock and asserts all issued nonces are distinct and increasing, using the Codex `nonce` repro. Run `pnpm --filter @hypeterminal/hl-react test nonce`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `sonnet@high` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Two tabs on one testnet agent fire an order and a cancel at once, 20 times, at trunk and head. Save `two-tabs.png`. Pass when the head shows zero nonce rejections and trunk's count is recorded.
- [ ] Lane 2. One tab, rapid 10 order burst. Save `burst.png`. Pass when all are accepted.
- [ ] Lane 3. Close one tab mid-burst. Save `tab-close.png`. Pass when the other tab keeps working.
- [ ] Lane 4. Reload during a burst. Save `reload.png`. Pass when no nonce goes backwards.
- [ ] Lane 5. Mobile and desktop on the same agent in two browsers. Save `two-browsers.png`. Pass when the failure is recorded, since storage is not shared, and the plan's Appendix C risk is confirmed or cleared.
- [ ] Lane 6. Cancel all from two tabs. Save `cancel-race.png`. Pass when every order ends cancelled and no error shows.
- [ ] Lane 7. SSR page load. Save `ssr.png`. Pass when the server render has no browser API error.
- [ ] Lane 8. Clock skew of plus 5 minutes in one tab. Save `skew.png`. Pass when both tabs keep working.
- [ ] Lane 9. Private window with storage blocked. Save `no-storage.png`. Pass when orders still work in one tab.
- [ ] Lane 10. Leverage update and order from two tabs at once. Save `leverage-race.png`. Pass when both are accepted.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time spent allocating a nonce per signed action.
- [ ] Probe. Instrument the manager over 100 actions, interleaved at trunk and head.
- [ ] Baseline. Record trunk's default manager time first.
- [ ] Rule. Fail when the head median exceeds 2 ms.

**Review gate.** None. HL-9 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] AI reviewer triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The operator fast-forwards HL-9 into `main`.

## Show the real Arbitrum USDC balance on deposit (HL-10)

**Depends on.** None.

**Files.**

- [ ] Edit `apps/terminal/src/config/wagmi.ts`.
- [ ] Edit `apps/terminal/src/config/security-headers.ts`.
- [ ] Edit `apps/terminal/src/lib/hyperliquid/use-deposit.ts` and `apps/terminal/src/components/trade/tradebox/deposit-modal.tsx`.

**Build.**

- [ ] Give Arbitrum an explicit, env-overridable RPC and allow it in `connect-src`. Today the transport falls back to `arb1.arbitrum.io`, which the production CSP blocks, so `balanceOf` fails.
- [ ] Derive the CSP RPC entries from the same list as the wagmi transports so they cannot drift.
- [ ] Show loading or an error instead of `0` when the balance read has not succeeded, and block submit until it does.

**You see.**

- [ ] The Deposit tab shows the same Arbitrum USDC as the Bridge tab, with no CSP error in the console.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] A test asserts every direct-read transport URL is allowed by `connect-src`, plus tests for the loading, error and loaded balance states. Run `pnpm --filter terminal test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `sonnet@high` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Open Deposit with a wallet holding Arbitrum USDC at trunk and head on the production build. Save `deposit-balance.png`. Pass when the head shows the real balance and trunk's `0` plus CSP error is recorded.
- [ ] Lane 2. Console errors on the Deposit tab. Save `deposit-console.png`. Pass when `console-errors.txt` is empty.
- [ ] Lane 3. Wallet with 0 Arbitrum USDC. Save `deposit-zero.png`. Pass when it shows 0 after a successful read.
- [ ] Lane 4. Block the RPC host in the browser. Save `deposit-rpc-down.png`. Pass when an error shows and Deposit is disabled.
- [ ] Lane 5. Wallet on Ethereum mainnet. Save `deposit-wrong-chain.png`. Pass when the switch network screen shows.
- [ ] Lane 6. Switch to Arbitrum from that screen. Save `deposit-switched.png`. Pass when the balance loads without a reload.
- [ ] Lane 7. Max button. Save `deposit-max.png`. Pass when it fills the exact balance.
- [ ] Lane 8. Amount above balance. Save `deposit-over.png`. Pass when Insufficient balance shows.
- [ ] Lane 9. Mobile deposit sheet. Save `deposit-mobile.png`. Pass when the same balance shows.
- [ ] Lane 10. Bridge tab after the change. Save `bridge-tab.png`. Pass when LI.FI balances still load.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time from opening Deposit to the balance rendering.
- [ ] Probe. Five interleaved opens at trunk and head on the production build.
- [ ] Baseline. Record trunk's time to its `0` render first.
- [ ] Rule. Fail when the head takes more than 1.5 s on a warm page.

**Review gate.** None. HL-10 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] AI reviewer triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The operator fast-forwards HL-10 into `main`.

## Close the program

- [ ] Every box above is checked with its evidence.
- [ ] Run a mainnet smoke test with the operator's small funded wallet, after every PR has landed. The operator signs each action in their own wallet. The agent never holds a mainnet key.
  - [ ] Open and close a minimum size position on a `szDecimals` 0 market. Pass when the close leaves size zero.
  - [ ] Place and cancel a passive limit order on BTC. Pass when the cancel succeeds.
  - [ ] Attach a TP and SL to an open position, then close it. Pass when both triggers cancel with the position.
  - [ ] Move 11 USDC into `xyz` and buy the minimum `xyz:NVDA` size, then close it and move the USDC back. Pass when the main dex balance returns minus fees.
- [ ] Rewrite `.claude/rules/hyperliquid.md` to point at the market model, the wire formatter, the account mode, and the harness as the only allowed paths, and delete rules the code now enforces.
- [ ] Reply to the operator with the report the execution playbook names.

## Appendix A. Prototype evidence

Two read-only probes ran on 2026-11-13 against `main` at `f303913` and live mainnet `/info`. No order was signed.

- For standard-mode accounts, collateral placement blocks NVDA, proven by running `deriveOrderEntry` with a standard account that holds 73,414 spot USDC. It returns `availableBalance 0` on `xyz:NVDA`. Public accounts show the same split by mode. A disabled account with 7.38M main perp has 0 available on NVDA, and a unified account with 14.7M spot has 14.7M available.
- That is not the operator's blocker. The operator's mainnet account `0x9242...9a4e` is `unifiedAccount` with 13.6 spot USDC, and `activeAssetData` for `xyz:NVDA` returns `availableToTrade` 13.6 and `maxTradeSzs` 1.659.
- The likely operator blocker is the viem regression that HL-11 fixes. A fresh session must sign `ApproveAgent` and `ApproveBuilderFee` before its first order, and viem 2.57.16 throws `InvalidStructTypeError` on both before the wallet sees them. Probe `scratchpad/viem-check/t.mjs` shows 2.52.2, 2.55.0, 2.56.0 and 2.57.0 reach the wallet and 2.57.16 does not. The operator's exact error is unconfirmed, so HL-11 lane 1 reproduces it in the operator's browser.
- The NVDA order itself is valid. `buildOrderPlan` gives asset 110002, price `171.07`, size `0.123`. `xyz:NVDA` has no `marginMode`, so cross is allowed.
- The size bug is proven by reading `formatDecimalFloor` in `apps/terminal/src/lib/trade/numbers.ts:84`. `floorToString(100, 0)` is `"100"` and the regex strips it to `"1"`. 105 live markets have `szDecimals` 0.
- The price bug is proven by the scan. 91 of 700 market order plans had an invalid price, such as DYDX `0.092424` where the SDK gives `0.09242`.
- The builder fee bug is proven by reading `convertFeeToPercentageString`, which maps `f = 10` to `0.1%`.
- Scripts and notes are copied to `docs/plans/research/` as `headless.ts`, `headless3.ts`, `probe.py`, `defaults.py`, `code-audit.md` and `hl-docs-research.md`. HL-1 and HL-7 port the scripts into `scripts/hl-live/`.

A Codex adversary (`gpt-6.1-sol` at high effort) interrogated this plan on 2026-11-13 against `f303913`. It reproduced claims (a) to (d) and found seven more issues. Each was rerun and reproduced before it changed this plan. The repro script and report are copied to `docs/plans/research/codex-review.ts` and `docs/plans/research/codex-report.md`.

- Quote-sized limit orders size from mark and validate the wrong notional. Folded into HL-1.
- Scale orders lose the remainder and check average notional. Folded into HL-1.
- The position stop editor validates against entry instead of mark. New PR HL-8.
- Two tabs sharing one agent issue identical nonces. New PR HL-9.
- HL-1's file boundary blocked its own callers and scripts. Fixed in the program checklist.
- HL-7 needed a principal key for user-signed actions. Fixed in HL-7.
- `buildOrderPlan` silently turns TWAP into a GTC limit. Folded into HL-1.

Codex audited code-ready heads too. HL-2 had no verified findings. HL-9 round 1 had four, all rerun and reproduced, all from one cause. A tab that signs faster than once per 16 ms runs its nonces ahead of the clock. That lets a reloaded tab reissue a nonce, drops another tab below the stored-100 floor, and under sustained load reaches T plus 1 day. Lock fallback also collided with lane 0. HL-9 round 2 fixes them. The report is in `docs/plans/research/codex-hl9-report.md`.

The operator reported HL-10 on 2026-11-13. The Deposit tab showed 0 Arbitrum USDC while the Bridge tab showed 13.806. A curl of the production CSP showed no Arbitrum RPC in `connect-src`.

The testnet principal `0x9fED...7c1c` holds 999 testnet USDC from the faucet. The agent `hl-live` was approved on testnet with status `ok`. The approval needed a hand-rolled EIP-712 signer, because viem 2.57.16 also rejects these struct names for local accounts. That is how the HL-11 defect was found.

Still unproven.

- Whether `sendAsset` with `destinationDex: "xyz"` moves USDC onto xyz for a standard account. HL-6 lane 1 proves it on testnet.
- Whether a testnet builder dex accepts orders. Testnet `perpDexs` lists builder dexes such as `test` and `unit`. HL-7 lane 2 records which ones trade.
- The exact error the operator saw on NVDA. HL-11 lane 1 captures it.
- Whether the market TP/SL `p` field bounds slippage on a gap.

## Appendix B. Alternatives rejected

- Pin viem back to 2.57.0 as the HL-11 fix. Any later bump would break signing again with no test to catch it. The adapter sends the request itself, and a test pins every primary type.
- Wrap the whole SDK in a custom client layer. The SDK already validates request shape with valibot and ships `formatPrice`, `formatSize` and `SymbolConverter`. A second layer would duplicate it. The program adds only what the SDK lacks, a parsed market model, an account mode, and per-leg result handling.
- Keep the app's own rounding and fix the regex. The app's formatter also ignores the `6 - szDecimals` decimal rule. Using the SDK formatter removes both bugs and a whole class of drift.
- Rely on mocked unit tests alone. The size bug survived because its only test checked `1.2`. Snapshot tests over every live market plus a testnet harness catch whole classes, not single cases.
- Offer dex abstraction. Hyperliquid marks it discontinued and calls HIP-3 cross margin under it unintuitive.

## Appendix C. Risks

- LI.FI bridge execution on about 60 chains uses RPC hosts that `connect-src` blocks (measured hosts, failure inferred). Park it as a follow-up PR after HL-10.
- The test principal key holds 20 real mainnet USDC until the operator asks for it back. Scripts must assert testnet before signing.
- The HL-6 product call belongs to the operator. Unified account is the documented recommendation and makes builder dexes just work, but it caps the account at 50k actions a day, changes liquidation behavior across dexes, and breaks builder fee accrual for a builder address. Per-dex `sendAsset` keeps risk isolated but adds a step. The default in this plan is to ship per-dex transfers and offer unified as an explained opt-in. The operator can choose unified-first instead.
- HL-1 changes every order's wire output. Lane 1 of HL-1 and the live-meta suite are the guard. Land it fast, since trunk is sending wrong closes today.
- HL-3 cloids change the order payload. Confirm the exchange accepts the cloid format on testnet before HL-3 merges.
- HL-5 changes what users see as available. Users in legacy dex abstraction may see a lower number than before. The UI must explain it.
- Testnet may lack builder dexes. HIP-3 coverage then falls back to mainnet read-only checks plus a tiny real-funds smoke test the operator runs by hand.
- Commit 516b41c's intent is unclear. HL-5 reverts it based on the SDK type and the 422 from `userDexAbstraction`. Confirm with the operator what account prompted it.

## Appendix D. Links and reading list

- Hyperliquid docs. Exchange endpoint, info endpoint perpetuals and spot, asset ids, tick and lot size, nonces and API wallets, error responses, HIP-3, account abstraction modes, margining. Base URL `https://hyperliquid.gitbook.io/hyperliquid-docs/`.
- `@nktkas/hyperliquid` 0.33.3, the latest on npm. Read `formatPrice`, `formatSize`, `SymbolConverter`, and the bulk order error path in `_base/_shell.js`.
- `hyperliquid-python-sdk` `exchange.py` for the reference market order slippage math.
- HL-1, HL-4 and HL-5 get `skills/how/SKILL.md` before editing and `skills/interrogate/SKILL.md` with a Codex adversary at code-ready.
- The decision trail per `skills/show-me-your-work/SKILL.md` lives at `docs/plans/hyperliquid-foundation-trail.md`.

## Appendix E. Model roles

Claude writes all code. Codex never writes code in this program. It reviews, attacks and audits, so every verdict has a second model family behind it. Nothing runs at max effort. Xhigh is kept for the PRs where a bug moves money or races.

| Job | Model and effort | Runs for | Why this model |
|---|---|---|---|
| Root coordinator, plan owner, final verdict | Claude Opus 5.5, this chat | Whole program | Holds the plan, audits receipts, decides merge-ready. Never delegated. |
| PR owner writing code, fund-risk or concurrency | Claude Opus at xhigh | HL-1, HL-3, HL-9 | Wrong sizes, retries and nonces lose money. Hardest-tasks tier. |
| PR owner writing code, everything else | Claude Opus at medium | HL-2, HL-4, HL-5, HL-6, HL-7, HL-8 | Standard feature tier. |
| Design bakeoff before code | Claude Opus at high and Codex `gpt-6.1-sol` at high, one design each | HL-4 market model, HL-5 account mode, HL-9 nonce manager | Two families sketch competing shapes. The root picks one. |
| Adversarial review at code-ready | Claude Opus at high and Codex `gpt-6.1-sol` at high | Every PR | Each finding must come with a command that reproduces it. The root reruns it before it counts. |
| Audit lanes in the merge swarm | Codex `gpt-6.1-sol` at high, plus one Claude Opus at high | Every PR | Reads the diff and receipts, distrusts the PR body. |
| Live browser lanes, ten per PR | Claude Sonnet at high | Every PR | Drives the app through `verify-hypeterminal`. Codex has no driver for this browser setup. |
| Gates lane, lint, typecheck, unit tests | Claude Sonnet at high | Every PR | Mechanical. Runs commands and reports output. |
| Single verifier after a rebase or small fix | Codex `gpt-6.1-sol` at medium | Any PR head that changes after a verdict | Cheap second-family check at the new head. |
| File search and code sweeps | Claude Haiku 5.5 at medium | Any step | Returns paths and line numbers only. |
| Prose, plan edits, status messages | Claude Opus at high | Whole program | Judgment and writing tier. |

Fallbacks. If the Codex probe fails, the root reseats that job on Claude Opus at high and says in the status message that the panel was single-family. If an Opus slug is rejected, the job drops to the role default and then to the parent model, and the status message names the model that actually ran. The source of these assignments is `~/.pstack/models.md`. Edit that file to change them for every run.

## Appendix F. Program state

State on 2026-11-13. The operator paused execution to finish the plan. In-flight owners finish their current round on local branches and nothing new starts until the operator's go. The hourly tick is cancelled.

| PR | Branch head | State |
|---|---|---|
| HL-11 | `hl-11-typed-data-signing` | Owner building, P0 |
| HL-1 | `hl-1-wire-format` | Owner building |
| HL-2 | `714bf5b` | Code-ready, root reran 8 of 8 tests, Codex clean, live lanes pending |
| HL-10 | `3f73e78` | Needs round 2. Codex found two issues, both rerun and reproduced. A cached balance outranks a failed or pending refetch, so Deposit can be enabled on stale funds. The receipt wait follows the wallet's current chain to a CSP-blocked RPC instead of staying on Arbitrum. Report in `docs/plans/research/codex-hl10-report.md` |
| HL-9 | `a1f596a` | Round 2 done. Root reran the hl-react suite. Exhaustion, burst, reload and window fixed. Two tabs with no lock support can still collide within 17 ms. Needs a single Codex verifier at the new head and the live lanes |
| HL-3, HL-4, HL-5, HL-6, HL-7, HL-8 | none | Not started |

Resume from this table on the operator's go, not from scratch. Worktrees live in `../hypeterminal-wt/<branch>`.

- [ ] HL-11 starts first with a fresh owner on `hl-11-typed-data-signing`. It has no commits.
- [ ] HL-1 continues on `hl-1-wire-format` from `77f0367` with its untracked `live-meta.test.ts`, `live-plan-set.ts`, `fixtures/` and `scripts/`. Finish the fail-on-trunk and pass-on-head proof, then `scan-wire.ts` and `bench-plan.ts`.
- [ ] HL-10 runs round 2 on `hl-10-arbitrum-rpc` for the two findings in `docs/plans/research/codex-hl10-report.md`.
- [ ] HL-2 at `714bf5b` and HL-9 at `a1f596a` each get one Codex verifier at the head, then their live lanes.
- [ ] HL-3, HL-4, HL-7 and HL-8 start once HL-1 is verified. HL-5 follows HL-4 and HL-6 follows HL-5.
- [ ] No owner or script prints, logs or commits a key from `apps/terminal/.env.local`.
- [ ] The root reruns every reviewer finding before it changes code or a verdict.

The decision trail is `docs/plans/hyperliquid-foundation-trail.md`.
