# @hypeterminal/hl-react

React bindings for the Hyperliquid API. Wraps [`@nktkas/hyperliquid`](https://github.com/nktkas/hyperliquid) with hooks for info queries, WebSocket subscriptions, signed exchange mutations, and **agent-wallet lifecycle**.

Source-shipped workspace package — `"main": "./src/index.ts"`, no build step. Consumers import TypeScript directly.

## What it owns

Everything about talking to Hyperliquid from React:

- **Transports** — `HttpTransport` (REST) and `WebSocketTransport` (streaming), cached per environment.
- **Clients** — `InfoClient`, `SubscriptionClient`, `ExchangeClient`, assembled per-wallet.
- **Hooks** — `useInfo` (REST), `useSubscription` (WS), `useExchange` (signed mutation), plus higher-level conveniences.
- **Agent wallets** — the Hyperliquid pattern where the user approves a scoped signer once and subsequent trades sign without wallet popups.
- **Reliability** — reconnect/backoff, batch updates, payload-size guards, ring-buffer accumulation for high-frequency streams.

Anything above this layer (e.g. market metadata caches, order validation, UI state) lives in the consuming app.

## Directory layout

```
packages/hl-react/src/
├── index.ts                       public exports (also: /store, /markets/types, /registries/*, /internal/*)
├── provider.tsx                   HyperliquidProvider + context
├── store.ts                       Zustand store — subscriptions, WS status, reconnect/cooldown timers
├── clients.ts                     Cached client factories (per env, per wallet)
├── wallet.ts                      wagmi WalletClient → Hyperliquid AbstractWallet adapter
├── create-config.ts               config builder
├── capabilities.ts · asset-id.ts  asset/market helpers
├── errors.ts · explorer.ts
├── hooks/
│   ├── useClients.ts              composes info / subscription / trading / user clients
│   ├── useInfo.ts                 REST queries via TanStack Query
│   ├── useSubscription.ts         WS subscriptions with ring-buffer accumulation
│   ├── useExchange.ts             signed mutations (agent or user wallet)
│   ├── useTransport.ts            raw transport access
│   ├── useTradingGuard.ts         pre-submit validation
│   └── useApiStatus.ts
├── signing/                       agent-wallet lifecycle
│   ├── agent-storage.ts           localStorage-backed agent key, Zod-validated, StorageEvent-synced
│   ├── use-agent-wallet.ts        cached PrivateKeyAccount signer
│   ├── use-agent-registration.ts  multi-step registration mutation
│   └── use-agent-status.ts        queries registration requirements
├── account/                       useUserPositions (clearinghouse state)
├── query/keys.ts                  query/subscription key serialization
├── registries/                    per-method metadata
│   ├── subscription.ts            accumulator config (trades, fills, fundings, orders)
│   └── exchange.ts                exchange method metadata
├── types/
│   ├── clients.ts                 re-exported SDK method/param/response types
│   └── markets.ts                 perp/spot market types
└── internal/
    ├── websocket/
    │   ├── reliability.ts         exponential backoff, cooldown, limits
    │   ├── batch-updater.ts       rAF batching + throttling
    │   └── payload-guard.ts       size estimation + per-method limits
    └── circular-buffer/
        ├── ring-buffer.ts
        └── use-ring-buffer.ts
```

## Setup

```tsx
import { HyperliquidProvider } from "@hypeterminal/hl-react";

<HyperliquidProvider env="mainnet" builderConfig={builderConfig} agentName="hypeterminal">
  {/* your app */}
</HyperliquidProvider>
```

Wrap inside `WagmiProvider` and `QueryClientProvider` — the hooks depend on both.

## Hook taxonomy

All hooks are strongly typed against the SDK's method signatures — if a method exists on the underlying SDK, a typed hook path exists for it.

Endpoint coverage is intentionally generic rather than one-hook-per-endpoint:

| SDK client | React hook | Example |
|---|---|---|
| `InfoClient` | `useInfo(method, params, options)` | `useInfo("perpDexs", undefined)` |
| `SubscriptionClient` | `useSubscription(method, params, options)` | `useSubscription("allDexsAssetCtxs", undefined)` |
| `ExchangeClient` | `useExchange(method, options)` | `useExchange("sendToEvmWithData")` |

As of `@nktkas/hyperliquid` `0.32.2`, newer SDK methods such as prediction-market info (`outcomeMeta`, `perpCategories`), builder/HIP-3 info (`perpDexs`, `perpDexStatus`, `userDexAbstraction`, `perpDexLimits`), richer subscriptions (`allDexsAssetCtxs`, `allDexsClearinghouseState`), and exchange actions (`sendToEvmWithData`, `setDisplayName`, `convertToMultiSigUser`, `userSetAbstraction`, `userPortfolioMargin`) are available through the same generic hooks.

HIP-4 status: Hyperliquid's HIP-4 outcome-market API is present in the locked `0.32.2` SDK as `useInfo("outcomeMeta", undefined)`. Upstream `main` also contains additional outcome-market methods, but this package documents and tests against the pinned workspace SDK version.

### `useInfo` — REST one-shot queries

Thin wrapper around `InfoClient` methods (`meta`, `userFills`, `clearinghouseState`, `l2Book`, etc.), cached by TanStack Query via `infoKey` / `infoQueryOptions`.

```ts
const { data } = useInfo("userFills", { user: address });
```

#### `persist: true` — cross-reload caching

Pass `persist: true` to route the query through a `["persisted", ...]` key prefix. Consuming apps wire up `@tanstack/react-query-persist-client` with `shouldDehydrateQuery: (q) => q.queryKey[0] === "persisted"` so only explicitly opted-in queries survive a reload. Low-churn metadata (`spotMeta`, `allPerpMetas`, `userFees`) benefits; volatile streams (order books, fills) never should.

```ts
const { data } = useInfo("spotMeta", undefined, { persist: true, staleTime: 30 * 60_000 });
```

Key helpers: `infoKey(method, params)` (default) and `infoPersistedKey(method, params)` (prefixed). Constant: `PERSISTED_QUERY_PREFIX`.

### `useSubscription` — WebSocket streams

Wraps `SubscriptionClient` methods. The `registries/subscription.ts` config decides whether a stream accumulates into a ring buffer (e.g. `trades`, `userFills`, `userFundings`, `orderUpdates`) or replaces state (`l2Book`, `allMids`).

```ts
const { data, status } = useSubscription("trades", { coin: "BTC" });
```

Backing store tracks `status` (`idle | subscribing | active | error`) per key, refcounts subscribers, and handles reconnect automatically.

### `useExchange` — signed mutations

Wraps `ExchangeClient` methods (`order`, `cancel`, `modify`, `approveAgent`, `approveBuilderFee`, `withdraw3`, `sendToEvmWithData`, …). Returns a TanStack Query mutation. Signing comes from either the agent wallet (default, fast-path L1 trading actions) or the connected user wallet (EIP-712/user-signed actions) — `registries/exchange.ts` decides.

User-wallet routed methods currently include:

```text
approveAgent
approveBuilderFee
cDeposit
cWithdraw
convertToMultiSigUser
linkStakingUser
sendAsset
sendToEvmWithData
spotSend
tokenDelegate
usdClassTransfer
usdSend
userDexAbstraction
userPortfolioMargin
userSetAbstraction
withdraw3
```

### `useAgent*` — agent wallet lifecycle

| Hook | Role |
|---|---|
| `useAgentStatus` | Does the user need a builder-fee approval? An agent approval? What agent is registered? |
| `useAgentRegistration` | Multi-step mutation: approve builder fee → generate + persist a new agent key → `approveAgent` on Hyperliquid. States: `idle → approving_fee → approving_agent → verifying → idle/error`. |
| `useAgentWallet` | Returns `{ data, signer, address, isReady }` — the cached `PrivateKeyAccount` used for trading signatures. |

Agent keys persist to `localStorage` under `hyperliquid_agent_{env}_{userAddress}` with Zod validation. `StorageEvent` listeners keep tabs in sync.

### `useClients`, `useTransport`, `useTradingGuard`, `useApiStatus`

Composition and utility hooks — direct transport access, pre-submit validation, health checks.

## Clients & caching

`clients.ts` keeps a module-level `Map` keyed by environment + (for trading clients) wallet address:

```
http:{testnet}                   → HttpTransport
ws:{testnet}                     → WebSocketTransport
info:{testnet}                   → InfoClient
subscription:{testnet}           → SubscriptionClient
trading:{address}:{testnet}      → ExchangeClient(agent signer)
```

`createExchangeClient(wallet, isTestnet)` produces a fresh client for user-wallet signing (approvals, withdrawals) without polluting the cache.

## WebSocket reliability

Lives in `src/internal/websocket/`:

| File | Role |
|---|---|
| `reliability.ts` | Reconnect: exponential backoff (250 ms → 5 s, ±20% jitter). After 20 failed attempts → 30 s cooldown. Subscription ceiling: 800 keys. |
| `payload-guard.ts` | Estimates payload size (UTF-16, capped traversal depth 20). Per-method limits: 256 KB default, `l2Book` 1 MB, `allMids`/`assetCtxs` 512 KB, `trades` 384 KB. Oversized payloads emit a warning signal. |
| `batch-updater.ts` | `createBatchedUpdater` flushes via `requestAnimationFrame` (16 ms fallback on Node). `createThrottledUpdater` caps update rate per key. |

The Zustand store (`store.ts`) drives the lifecycle: `acquireSubscription` bumps refcount + schedules subscribe; on failure, attaches a failure listener and schedules reconnect; `releaseSubscription` tears down at refcount 0.

## Peer dependencies

```json
"@nktkas/hyperliquid":   ">=0.32.2 <1",
"@tanstack/react-query": "^5",
"react":                 "^19",
"viem":                  "^2",
"wagmi":                 "^3",
"zod":                   "^4",
"zustand":               "^5"
```

No runtime dependencies — everything is peer, so the consuming app controls versions.

## Subpath exports

Fine-grained entry points for consumers that want only part of the surface:

```ts
import { useHyperliquidStore } from "@hypeterminal/hl-react/store";
import { useExchange } from "@hypeterminal/hl-react/hooks/useExchange";
import type { PerpMarket } from "@hypeterminal/hl-react/markets/types";
import { getAccumulateConfig } from "@hypeterminal/hl-react/registries/subscription";
import { estimatePayloadSizeBytes } from "@hypeterminal/hl-react/internal/websocket/payload-guard";
import { RingBuffer } from "@hypeterminal/hl-react/internal/circular-buffer/ring-buffer";
```

## Conventions

Per `.claude/rules/hyperliquid.md`:

- **Keep strings.** The API returns exact-decimal strings; pass them through. Don't cast to `number` unless you must.
- **Use `big.js` inline** where math is needed: `Big(size).times(price).toString()`.
- **No wrapper types.** Use SDK types directly (`Meta`, `L2Book`, `OrderRequest`, …).
- **`Big.cmp()` for comparison/sorting** to preserve precision.
- Before adding a helper, ask: does the SDK already do this?
