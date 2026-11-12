---
name: verify-hl-subscriptions
description: Model-check and replay the hl-react WebSocket subscription runtime (packages/hl-react/src/store.ts acquire/release, retries, visibility buffer, staleness watchdog) against the @nktkas/hyperliquid SDK. Use before changing packages/hl-react/src/store.ts, hooks/utils/useSub.ts, internal/websocket/{staleness,visibility,reliability}.ts or clients.ts, after bumping @nktkas/hyperliquid, or when a book, trade feed or account stream freezes, leaks, or shows Connected without data.
---

# Verify hl-react subscriptions

Every live panel in the terminal (order book, trades, positions) is a `useSub` hook that calls `acquireSubscription` on mount and `releaseSubscription` on unmount. The store shares one SDK subscription per key, retries failures, buffers data while the tab is hidden, and reconnects the socket when a key goes stale. A bug here means a trader acts on a frozen order book that still says Connected, or the app keeps streaming books for markets nobody is looking at.

This skill checks two promises:

- **No leak.** After the last hook for a key unmounts, the SDK holds no listener for it and Hyperliquid stops streaming it. This includes an unmount that races a subscribe still in flight.
- **Recovers.** A mounted key in a visible tab ends up with live data and a status that says so, after any socket drop, failed subscribe, or tab hide and show.

Two tools check them. A TLA+ model (`model/HlSubscriptions.tla`) explores every order of mounts, unmounts, promise settlements, timers, socket events and tab flips within small bounds. A replay (`scripts/replay.ts`) runs the model's paths against the real `store.ts`, the real `useSub` updater and the real SDK `WebSocketSubscriptionManager`, with a fake socket and a fake clock.

## Run

```bash
.claude/skills/verify-hl-subscriptions/scripts/check.sh
```

It takes about 5 to 10 seconds. The first line is `PASS` or `FAIL`, then one row per check. It needs Java 17+ and `bun` on `PATH`. The first run downloads TLA+ tools v1.7.4 into `.verify/tools/` and checks its sha256 (`scripts/fetch-tla.sh`). Later runs reuse the jar. Output lands in `.verify/tlc/<run>/` (gitignored): `<world>-<property>.out` for TLC, `replay-<scenario>.out` for replays.

`PASS` means every check matched its expected verdict in the `CHECKS` and `REPLAYS` tables at the top of `check.sh`. Some expected verdicts are `finding`: known bugs in the current code, listed below. A `STALE` note on the first line means a covered file changed since the sync commit. Read **Keep it in sync** before you trust a PASS.

## Does my change touch this?

It does if it edits any covered file below, changes how `useSub`/`useSubscription` call the store, changes `createWsReconnectTrigger`, or bumps `@nktkas/hyperliquid`. The model encodes SDK 0.32.2 behavior from its `src/transport/websocket/` files, so an SDK bump needs a re-read of those files.

## Read a result

| Row says | Meaning | Do |
|---|---|---|
| `holds` expected, `finding` got | Your change broke a promise, or the model is wrong | Read the trace, then replay it (below) |
| `finding` expected, `holds` got | A known bug no longer reproduces | If you fixed it, flip the row to `holds` and move it out of **Known findings**. If not, the model drifted from the code |
| `error` | TLC or bun failed: parse error, `CHOOSE` with no free listener id (raise `MaxL`), missing tool | Read the `.out` file. This is never a product verdict |
| `ModelConsistent` breaks | The model contradicts itself | A modeling error, not a product bug |

Read every TLC result with the pstack `/statechart` skill. It turns an invariant violation into its shortest path in plain words, and charts the system when a check passes. Use `model/HlSubscriptions.tla` with one world's `.cfg` plus the `INVARIANT` line you care about, and pass `model/statechart-view.mjs` as the view. TLC's own trace is in the `.out` file too: each `State n: <Action ...>` is one step.

Before you call a new counterexample a product bug, replay it. Add a scenario to `scripts/replay.ts` that drives the same steps (mount, unmount, `socket.close()`, `socket.open()`, `socket.ack()`, `socket.errorReply()`, `socket.push()`, `setHidden()`, `advance(ms)`) and checks the same outcome. Add it to `REPLAYS` in `check.sh`. If the real code does not show the bug, the model is wrong until you prove otherwise.

## How the model maps to the code

One action is one JS macrotask: a React commit's effects (`YouMount`, `YouUnmount`, ending at `CommitEnds`), a timer callback, a socket event, a server message, a visibility event. `RunMicrotask` is one promise continuation. Macrotasks wait until the microtask queue is empty, the same as the event loop. Every definition cites its `store.ts` or SDK lines.

Things that are easy to get wrong:

- The SDK adds a listener *before* it awaits the subscribe request (`_subscriptionManager.ts` L126-131). A rejected `subscribe()` keeps that listener and gives the store no handle to remove it.
- All handles for one id share one `failureController` (L98). A failed resubscribe aborts it for good (L150-152). Calls that join the id later get the already-aborted signal.
- The SDK deletes an id and sends `unsubscribe` only when its last listener goes (L114-121). On reopen it resubscribes every finished id (L145-157).
- A socket close rejects every pending request (`_postRequest.ts` L162-169).
- `useSub` builds a fresh listener closure on every `subscribe()` call (`useSub.ts` L58-86), so every retry adds a listener.
- The store's `.then`/`.catch` look the runtime up by key (`store.ts` L320, L386). A continuation from before an unmount lands in the runtime of the next mount.

`lis` is the set of SDK listeners someone can still remove. `orphan` records that the SDK holds a listener nobody can remove. The `GC` step moves a listener from `lis` to `orphan` once nothing refers to it.

## Properties

| Property | Plain sentence |
|---|---|
| `NoLeakAfterUnmount` | With no hook mounted and nothing in flight, the SDK holds no listener for the key, so Hyperliquid streams nothing for it. |
| `NoOrphanListener` | The SDK never holds a listener that nothing in the store can remove. This is the cause behind every leak. |
| `StoreHandleLive` | Once the queue drains, `runtime.subscription` is a listener the SDK still holds. |
| `RefCountMatchesHooks` | `refCount` equals the number of mounted hooks, and a runtime exists while any hook is mounted. |
| `EventuallyLive` | Once the network stops failing, a mounted key in a visible tab ends up with live data and status `active`, and stays that way. |
| `ModelConsistent` | Model sanity. A break here is a modeling error. |

Each property has been seen failing on a broken variant, so each check can fail:

- `NoOrphanListener` and `NoLeakAfterUnmount` flip in `races` when `releaseSubscription` drops its `else if (pending)` branch (`store.ts` L457-459). Replay `remount-while-subscribing` flips with them.
- `RefCountMatchesHooks` flips in every world when `acquireSubscription` drops `runtime.refCount += 1`.
- `StoreHandleLive` flips in every world when the `.then` keeps an existing `runtime.subscription` instead of replacing it.
- `EventuallyLive` flips in `network` on the current code (F2).

## Worlds and bounds

| World | Hooks on the key | Mount/unmount steps | Socket drops | Failed requests | Tab flips | States |
|---|---|---|---|---|---|---|
| `races` | 3 | 6 | 0 | 0 | 0 | 156 |
| `tab` | 3 | 6 | 0 | 0 | 4 | about 6.8k |
| `network` | 2 | 4 | 2 | 2 | 4 | about 56k |

All worlds use `MaxAttempts = 1`. The code's `maxAttemptsBeforeCooldown` is 20, and 1 keeps the cooldown branch reachable at depth 2. They also use `MaxL = 6` listener ids, which are recycled once a listener is gone. Why these bounds are enough:

- The worst remount race (unmount and remount in one commit while the subscribe is in flight, then a final unmount) needs 4 mount steps. `races` allows 6, so two remount cycles with up to 3 hooks sharing the key.
- Every known finding needs at most 1 drop and 1 failed request. `network` allows 2 of each.
- A pass covers these bounds only. More hooks or more faults are not checked.

There is no symmetry set. The model has one key and the hooks are a counter, so nothing is interchangeable. TLC symmetry is also unsound for the liveness check. The fairness is weak for draining microtasks and ending commits, and strong for timers, socket reopen, server replies and the watchdog. They are macrotasks that are enabled only between microtask drains.

## Known findings at 1b50aa2

**F1. A subscribe that fails leaves a listener nobody can remove. The key keeps streaming after its last unmount.** (`network` and `tab`: `NoOrphanListener`, `NoLeakAfterUnmount`. Replays `unmount-then-drop` and `show-during-subscribe`.)

1. The BTC book mounts. `acquireSubscription` calls `client.l2Book`, and the SDK adds the listener and sends `subscribe`.
2. The book unmounts before Hyperliquid confirms. `releaseSubscription` chains `runUnsubscribe` onto the pending promise.
3. The socket drops, which rejects the request. The store's `.catch` finds no runtime and returns `undefined`. `runUnsubscribe(undefined)` does nothing. The listener stays in the SDK.
4. The socket reopens and the SDK resubscribes BTC. Hyperliquid streams a book nobody shows, for the rest of the session.

The same hole has other doors. A tab show calls `triggerReconnect` while a subscribe is in flight. Each retry while the socket is down joins the cached rejected promise and adds one more listener. `onFailure` sets `runtime.subscription = undefined` without unsubscribing. `runUnsubscribe` skips any handle whose shared signal is already aborted (`store.ts` L451).

**F2. After one failed resubscribe, the book can freeze for good while the footer says Connected.** (`network`: `EventuallyLive`. Replay `frozen-after-resubscribe-failure`.)

1. The book is live. The socket drops and stays down for more than 20s.
2. The watchdog marks the key stale and calls `triggerReconnect`, which does nothing because the socket is already closed.
3. The socket reopens. The SDK resubscribes and Hyperliquid answers with an error, or the request times out. The SDK aborts the id's shared `failureSignal` and resolves anyway.
4. `onFailure` sets status `error` and schedules a retry. The retry's `subscribe()` joins the existing id. It sends nothing and resolves with the aborted signal, so the store sets status `active`.
5. Nothing retries again. The abort listener cannot fire twice. The watchdog already reported stale, so it never fires again. The app never reads `isStale`. Status stays `active`, `wsStatus` stays `open`, and the book never updates. Only a tab show, an `online` event, or another key's watchdog would close the socket.

## Keep it in sync

Covered code, last confirmed at sync commit **1b50aa2**:

| File | Functions |
|---|---|
| `packages/hl-react/src/store.ts` | `acquireSubscription`, `scheduleReconnect`, `startSubscription`, `releaseSubscription`, `setSubscriptionData`, `attachSingletons`, `detachSingletons`, `flushVisibilityBuffer`, `shouldPauseKey` |
| `packages/hl-react/src/hooks/utils/useSub.ts` | `useSub` effect and cleanup |
| `packages/hl-react/src/internal/websocket/staleness.ts` | `register`, `unregister`, `markFresh`, `tick` |
| `packages/hl-react/src/internal/websocket/visibility.ts` | `subscribeVisibility`, `getVisibilityState` |
| `packages/hl-react/src/internal/websocket/reliability.ts` | `isUserStreamKey`, `getStalenessThresholdForKey`, `WS_RELIABILITY_LIMITS` |
| `packages/hl-react/src/clients.ts` | `createWsReconnectTrigger` |
| `packages/hl-react/package.json` | the `@nktkas/hyperliquid` version (0.32.2) |
| SDK `src/transport/websocket/_subscriptionManager.ts`, `_postRequest.ts` | `subscribe`, `_handleOpen`, `_handleClose`, close rejection |

`check.sh` prints `STALE` when a covered file differs from the sync commit. When you change covered code on purpose:

1. Update the matching definitions in `model/HlSubscriptions.tla`, which cites each one by line. Keep one action per macrotask.
2. Update the line refs and `replay.ts` if a name or call changed.
3. Run `check.sh`. Explain every row that moved, and replay any new counterexample.
4. Only once the model and the replays describe the code at your commit, set `SYNC_COMMIT` in `check.sh` and the commit above to it.

Bring a verification that drifted back in line with the pstack `/maintain-formal-verification-skill` skill.

## Not covered

- More than one key. Cross-key effects are left out: one stale key's `triggerReconnect` closing the shared socket for every key, the 800-key limit, and the SDK's 1000-subscription and 10-user caps.
- `pauseWhenHidden: false` and user-stream keys, which never buffer. The model is an l2Book key.
- Throttle timing (`createThrottledUpdater`). The model delivers each push at once. The replay uses the real updater.
- The `offline`/`online` listener, and `freeze`/`resume`/`pageshow`. The model's tab show is the only visibility trigger.
- rews backoff timing, close events while reconnecting, and late server replies after a timeout.
- Whether components render `isStale`. The app reads only `status` and `wsStatus` today, so a stale book shows as live.
- Bounds: everything above, nothing past it.
