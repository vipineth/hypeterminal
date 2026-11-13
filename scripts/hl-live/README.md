# Hyperliquid live harness

These scripts send every trading action HypeTerminal supports to Hyperliquid testnet and check the account afterwards. Orders come from the app's own plan builders (`buildOrderPlan`, `buildTwapPlan`). The principal signs through the app's wallet adapter (`toHyperliquidWallet`), and the agent signs through the app's `createL1AgentWallet`. A change that breaks the wire format or signing fails a scenario here before it reaches a user.

## Commands

| Command | What it does | Signs |
|---|---|---|
| `bun scripts/hl-live/run.ts --testnet` | Runs every scenario on the main dex, and with `--builder` the perp scenarios on a builder dex too. Prints one line per scenario per dex and a final count. | Testnet only |
| `bun scripts/hl-live/run.ts --readonly` | Builds every scenario's plan for every live mainnet market and checks each order against the SDK's price and size grid. Any request to `/exchange` throws. | Never |
| `bun scripts/hl-live/run.ts --drift` | Compares live mainnet `perpDexs` fields, `meta` fields, `marginMode` values and `userAbstraction` values with `drift-snapshot.json`. Fails on any new field or value. | Never |
| `bun scripts/hl-live/run.ts --write-drift-snapshot` | Adds the live values to the snapshot after you have handled them in the app. | Never |
| `bun scripts/hl-live/scan-wire.ts` | HL-1's scan of every mainnet market against the plan set. | Never |
| `pnpm --filter terminal test hl-live` | Unit tests for the signers, the mainnet guard, the intent checks, the assertion helpers and the drift check. `restart.test.ts` runs `run.ts --testnet` against `fake-hl.ts`, an in-memory Hyperliquid, from the state a killed run leaves. | Throwaway keys, no network |

`--testnet` takes these options.

- `--only "market,close"` runs only the named scenarios.
- `--main DOGE` and `--spot PURR/USDC` choose the markets.
- `--builder xyz:NVDA` adds the builder pass. It is off by default, because every testnet builder dex rejects new orders today and the pass enters unified mode, the riskiest step of a run. Turn it on once a testnet builder dex accepts orders.

Exit code 0 means every scenario passed or was recorded as unsupported by testnet. Exit 1 means a scenario or a cleanup failed. A cleanup failure is its own `FAIL cleanup after <scenario>` line, and the run carries on to the summary. Exit 2 means the run stopped before trading, on a key that holds mainnet funds or an unfunded principal. The unfunded stop comes after recovery.

## Keys

The harness runs only on a testnet-only principal, a key that has never held anything on mainnet. Before it signs anything, a run reads the principal's mainnet holdings from `/info`.

- `spotClearinghouseState`: any token balance, and any token escrowed on its way to HyperEVM.
- `clearinghouseState` on every dex `perpDexs` lists: any account value or position.
- `delegatorSummary`: staked, undelegated or pending-withdrawal HYPE.
- `userVaultEquities`: equity in any vault.
- `leadingVaults`: any vault the key leads.
- `subAccounts`: any sub-account, funded or not.
- `borrowLendUserState`: any supplied or borrowed token.
- `referral`: unclaimed referral rewards or builder rewards.

It stops with exit 2 if any of them shows value, if a read fails, or if a response is not the shape it expects: a dex list without the main dex first, or an amount that is not a decimal string. A key that holds mainnet funds can't run the harness. The guard can't see value off `/info`: HyperEVM balances, and Arbitrum bridge deposits or withdrawals still in flight.

By default the harness reads `HL_LIVE_PRINCIPAL_KEY` and `HL_LIVE_AGENT_KEY`, from the environment first, then from `apps/terminal/.env.local` in the main checkout. `HL_ENV_FILE` points it at another file. `HL_PRINCIPAL=2` selects `HL_TESTNET_PRINCIPAL2_KEY` with `HL_TESTNET_AGENT2_KEY`, and `HL_PRINCIPAL=1` selects `HL_TESTNET_PRINCIPAL_KEY` with `HL_TESTNET_AGENT_KEY`. `HL_PRINCIPAL=fresh` uses new random keys, which is how you check the unapproved-agent stop.

Each principal has its own agent named `hl-live`. Hyperliquid binds an agent address to one principal, so two principals can't share one. The `hl-live` agent is not the app's `HypeTerminal` agent, so a run never replaces the agent another session uses.

## Safety

- `openHarness` throws unless `transport.isTestnet` is true. Both signers check the transport again on every signature.
- `openHarness` reads `userRole` for the agent address before it builds any signer, and refuses unless the agent signs for the configured principal. Recovery, cleanup and every scenario take that harness, so nothing signs through an agent bound to another account. The run stops with exit 2 instead.
- The principal signs only `UsdClassTransfer`, `SendAsset` and `UserSetAbstraction`, and only when the payload says `hyperliquidChain: "Testnet"`. It can never approve an agent, approve a builder fee or withdraw.
- The agent signs only L1 `Agent` payloads with source `b`, which is testnet.
- `harness.test.ts` proves a mainnet transport refuses to sign and sends nothing.
- Keys stay in memory. Errors name the variable, never its value.

## What a run changes on the account

- It trades only the harness markets: DOGE on the main dex, PURR/USDC on spot, and the builder market. It cancels every order and closes every position on those markets after each scenario and at the start of a run. Don't trade them by hand on the same principal.
- Orders go out byte for byte as the app builds them, with no cloid. The harness finds its orders by the `oid` in each response.
- The leverage on the harness markets ends at 5x cross.
- The abstraction scenario, and the builder pass when it is on, switch the account to `unifiedAccount` and back. Hyperliquid has no way back to `default`, so the account ends in `disabled`, which is the same standard mode. Unified moves all perp USDC into spot. On the way out the harness keeps 30 USDC in spot and moves the rest back to perp with `sendAsset`, the call the app's transfer modal makes. It reads the live mode and balances and keeps no state on disk, so the next start restores a killed run, on CI as well as locally.
- A run starts by recovering the account from its live state, before the funding check, so a killed run that left the account in unified mode with under 100 USDC still recovers. Recovery closes positions, cancels orders and stops TWAPs on this run's markets. If the account reads `unifiedAccount`, an earlier run was killed inside a unified window. The harness opens that window only from a flat account, so recovery also sweeps every perp dex and cleans every position, order and TWAP it finds there, whatever markets this run was started with. That holds only on a principal nothing else puts in unified mode: if another session leaves the principal unified, the next start closes that session's positions and orders too. It then moves any USDC left on this run's builder dex, or on any builder dex the sweep found, back to spot in unified mode or to perp otherwise. Last it leaves unified and restores the spot float. If any of that fails, no scenario runs and the run reports why. The builder pass ends with the same recovery. Recovery keeps nothing on disk.
- A builder `sendAsset` round trip refuses to start when the builder dex already holds USDC, so a balance an earlier run stranded is never taken as the baseline.
- A 429 on an `/info` read is retried with backoff up to five times. `/exchange` requests are never retried.
- The harness switches to unified only from standard mode, and only when the principal has no running TWAP, no position on any perp dex, and no open order. It reads positions from `clearinghouseState` on every perp dex, and orders from `frontendOpenOrders` with `ALL_DEXS` plus every dex that holds collateral. Hyperliquid refuses to leave unified while anything is open, so another session trading the same principal would strand it there. Give the harness a principal nobody else trades. Until then, the abstraction scenarios fail with that reason whenever someone else has activity on the account.
- Only one run per principal at a time. A lock file in the OS temp dir stops a second run.
- Spot USDC is held at 30 so the spot scenario has funds, and the rest stays in perp. A run restores that split at the start and after every unified window.
- Each run costs about 5 testnet USDC in fees and spread. A PURR dust balance under one lot stays in spot.

## Scenarios

| Scenario | Signer | Code path | Runs on |
|---|---|---|---|
| market, limit, post-only, IOC, reduce-only, scale, TWAP, cancel, cancel all | agent | app | main dex, builder dex |
| TP/SL with `normalTpsl` and `positionTpsl`, close, reverse, leverage update | agent | app | main dex, builder dex |
| modify, isolated margin add and remove | agent | SDK wire only | main dex, builder dex |
| dex `sendAsset` | principal | app | main dex (perp to spot and back), builder dex (into the dex and back) |
| `agentSendAsset` | agent | SDK wire only | as dex `sendAsset` |
| usd class transfer, abstraction switch | principal | SDK wire only | account |
| `agentSetAbstraction` | agent | SDK wire only | account |
| spot buy and sell | agent | app | spot |

"app" means the scenario builds its request with the app's own code: `buildOrderPlan` and `buildTwapPlan` for orders, the app's `parseMarkets(...).byName.get(coin).assetId` for cancel and TWAP cancel asset ids (the cancel list itself is a copy of the orders tab's, since the app keeps it inside the component), the transfer modal's `sendAsset` call, and `interpretOrderStatuses` to read each response. "SDK wire only" means the app never sends that action, so the scenario only proves the SDK's wire format and testnet's handling. Those lines print `[SDK wire only]`.

Each check compares what Hyperliquid reports against the scenario's intent, not against the app's own output, so a builder bug can't move the expected value with it.

- A limit order rests at the input price, which the scenario puts on the tick first, with the intended lot size, side and TIF.
- Every market, close, reverse and swap order goes out as `FrontendMarket` and caps its price at mark plus or minus 250 bps, within one tick and 10 bps.
- Each scale level rests at its interpolated price, within one tick.
- An IOC that can't fill is rejected and leaves nothing open.
- A TWAP's side, size, minutes, reduce-only and randomize flags match in `twapHistory`.
- Each TP and SL matches a distinct open trigger by kind, side, trigger price and size.

A scenario is reported as `SKIP` only when testnet itself can't support it, and the line says why. The causes measured on 2026-11-13 are listed below.

- Every builder dex tried (`xyz`, `idx`, `osrs`, `test`, `aura`) rejects new orders with `Perp DEX open interest is at cap`, in standard and unified mode.
- `sendAsset` into a builder dex returns `Invalid send` from perp in standard mode and from spot in unified mode.
- `agentSetAbstraction` returns `Abstraction transition not allowed` from `disabled` and from `unifiedAccount`.
- Testnet reports a `Gtc` order that `modify` moved as `Alo` in `frontendOpenOrders`, so the modify check covers side, price and size, not TIF.
- A thin book is a `SKIP` only when the book has no depth within the app's 250 bps slippage of mark. The band is computed from mark, never from the order's own price, so a broken slippage price still fails. A spot buy that fills part of its size is a `SKIP` only when no depth is left inside that band.

## CI

`.github/workflows/hl-live.yml` runs the unit tests, `--readonly` and `scan-wire.ts` on every push, with no secrets. The `testnet` job runs `--testnet` and `--drift` nightly and on manual dispatch, only from `refs/heads/main`, inside the `hl-testnet` environment. Every action is pinned by commit SHA.

The operator sets this up once in the repository settings.

1. Generate a new principal key and a new agent key. Don't reuse a key that has ever held mainnet funds, and never use principal 1. The harness refuses such a key at runtime anyway.
2. Fund the principal with at least 100 testnet USDC, and approve the agent as `hl-live` on testnet. The harness principal refuses `ApproveAgent` by design, so do it once with the SDK's `approveAgent`, signed by the principal on an `HttpTransport({ isTestnet: true })`.
3. Create the `hl-testnet` environment. Add required reviewers, and limit its deployment branches to `main`.
4. Add `HL_LIVE_PRINCIPAL_KEY` and `HL_LIVE_AGENT_KEY` as secrets of the `hl-testnet` environment, not as repository secrets. Only a job that names the environment and passes its review can read them. Any workflow on any branch can read a repository secret.
