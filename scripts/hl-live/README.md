# Hyperliquid live harness

These scripts send every trading action HypeTerminal supports to Hyperliquid testnet and check the account afterwards. Orders come from the app's own plan builders (`buildOrderPlan`, `buildTwapPlan`). The principal signs through the app's wallet adapter (`toHyperliquidWallet`), and the agent signs through the app's `createL1AgentWallet`. A change that breaks the wire format or signing fails a scenario here before it reaches a user.

## Commands

| Command | What it does | Signs |
|---|---|---|
| `bun scripts/hl-live/run.ts --testnet` | Runs every scenario on the main dex, then the perp scenarios on a builder dex. Prints one line per scenario per dex and a final count. | Testnet only |
| `bun scripts/hl-live/run.ts --readonly` | Builds every scenario's plan for every live mainnet market and checks each order against the SDK's price and size grid. Any request to `/exchange` throws. | Never |
| `bun scripts/hl-live/run.ts --drift` | Compares live mainnet `perpDexs` fields, `meta` fields, `marginMode` values and `userAbstraction` values with `drift-snapshot.json`. Fails on any new field or value. | Never |
| `bun scripts/hl-live/run.ts --write-drift-snapshot` | Adds the live values to the snapshot after you have handled them in the app. | Never |
| `bun scripts/hl-live/scan-wire.ts` | HL-1's scan of every mainnet market against the plan set. | Never |
| `pnpm --filter terminal test hl-live` | Unit tests for the signers, the assertion helpers and the drift check. | Throwaway keys, no network |

`--testnet` takes these options.

- `--only "market,close"` runs only the named scenarios.
- `--main DOGE`, `--spot PURR/USDC` and `--builder xyz:NVDA` choose the markets. `--builder=` skips the builder pass.

Exit code 0 means every scenario passed or was recorded as unsupported by testnet. Exit 1 means a scenario failed. Exit 2 means the run stopped before trading, for example on an unfunded principal.

## Keys

The harness reads `HL_TESTNET_PRINCIPAL_KEY` and `HL_TESTNET_AGENT_KEY` from the environment first, then from `apps/terminal/.env.local` in the main checkout. `HL_ENV_FILE` points it at another file. `HL_PRINCIPAL=2` selects `HL_TESTNET_PRINCIPAL2_KEY`. `HL_PRINCIPAL=fresh` uses a new random key, which is how you check the unfunded stop.

The agent is the one named `hl-live`. It is not the app's `HypeTerminal` agent, so a run never replaces the agent another session uses.

## Safety

- `createHarness` throws unless `transport.isTestnet` is true. Both signers check the transport again on every signature.
- The principal signs only `UsdClassTransfer`, `SendAsset` and `UserSetAbstraction`, and only when the payload says `hyperliquidChain: "Testnet"`. It can never approve an agent, approve a builder fee or withdraw.
- The agent signs only L1 `Agent` payloads with source `b`, which is testnet.
- `harness.test.ts` proves a mainnet transport refuses to sign and sends nothing.
- Keys stay in memory. Errors name the variable, never its value.

## What a run changes on the account

- It trades only the harness markets: DOGE on the main dex, PURR/USDC on spot, and the builder market. It cancels every order and closes every position on those markets after each scenario and at the start of a run. Don't trade them by hand on the same principal.
- Orders carry a cloid that starts with `0x686c6c697665`, so you can tell them apart.
- The leverage on the harness markets ends at 5x cross.
- The builder pass and the abstraction scenario switch the account to `unifiedAccount` and back. Hyperliquid has no way back to `default`, so the account ends in `disabled`, which is the same standard mode. Unified moves all perp USDC into spot. The harness moves it back and keeps a note in the OS temp dir, so a killed run restores it on the next start.
- Only one run per principal at a time. A lock file in the OS temp dir stops a second run.
- Each run costs about 5 testnet USDC in fees and spread. A PURR dust balance under one lot stays in spot.

## Scenarios

| Scenario | Signer | Runs on |
|---|---|---|
| market, limit, post-only, IOC, reduce-only, scale, TWAP, cancel, cancel all, modify | agent | main dex, builder dex |
| TP/SL with `normalTpsl` and `positionTpsl`, close, reverse, leverage update, isolated margin add and remove | agent | main dex, builder dex |
| dex `sendAsset` (principal), `agentSendAsset` (agent) | as named | main dex (perp to spot and back), builder dex (into the dex and back) |
| usd class transfer, abstraction switch | principal | account |
| `agentSetAbstraction` | agent | account |
| spot buy and sell | agent | spot |

A scenario is reported as `SKIP` only when testnet itself can't support it, and the line says why. The causes measured on 2026-11-13 are listed below.

- Every builder dex tried (`xyz`, `idx`, `osrs`, `test`, `aura`) rejects new orders with `Perp DEX open interest is at cap`, in standard and unified mode.
- `sendAsset` into a builder dex returns `Invalid send` from perp in standard mode and from spot in unified mode.
- `agentSetAbstraction` returns `Abstraction transition not allowed` from `disabled` and from `unifiedAccount`.
- A thin book is a `SKIP` only when the book shows the best price beyond the order's limit.

## CI

`.github/workflows/hl-live.yml` runs the unit tests, `--readonly` and `scan-wire.ts` on every push. It runs `--drift` and `--testnet` nightly. The nightly job needs the `HL_TESTNET_PRINCIPAL_KEY` and `HL_TESTNET_AGENT_KEY` repository secrets.
