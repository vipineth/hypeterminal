# WebSocket Reliability Hardening Roadmap

## Goal
- Keep long-running websocket sessions stable without unbounded memory growth.
- Apply fixes one item at a time, benchmark after each item, then move to the next.

## Execution Protocol (Context Reset Between Items)
1. Pick one checklist item only.
2. Implement minimal focused code changes for that item.
3. Run targeted benchmark/tests for that item.
4. Record before/after numbers in this file.
5. Mark item status and move to next item.

## Current Status
- [x] Hyperliquid subscription store reconnect + cleanup hardening
- [x] Chart store reconnect + cleanup hardening
- [x] Bounded chart cache (`lastBarCache` LRU cap)
- [x] Orderbook row render stability improvements
- [x] Baseline + recovery benchmark harness
- [x] Item 1: Centralized websocket reliability limits + reconnect circuit breaker
- [x] Item 2: Subscription payload size guardrails and drop strategy
- [x] Item 3: Long-running soak test (30-60 min) with memory trend output
- [ ] Item 4: Runtime health alerts (heap slope, reconnect storms, listener growth)
- [ ] Item 5: Production incident diagnostics bundle (one-command capture)

## Benchmarks Collected So Far
- `websocket-store-benchmark`
  - `recovery`: `successfulRecoveries 200`, `subscribeCalls 201`
  - `data-overwrite`: stable overwrite behavior (`+0.02 MB` in test run)
- `chart-store-benchmark`
  - `cache-cap`: cache bounded at `256`
  - `cache-reuse`: repeated updates retain only `1` cache key

## Item 1 Scope
- Introduce shared websocket reliability limits in one module.
- Add reconnect circuit breaker cooldown to avoid runaway reconnect loops.
- Keep behavior deterministic and bounded under repeated disconnects.

## Item 1 Result
- Added shared limits module: `src/lib/websocket/reliability.ts`.
- Applied reconnect cooldown/circuit-breaker to:
  - `src/lib/hyperliquid/store.ts`
  - `src/lib/chart/store.ts`
- Benchmarks remained stable after changes:
  - `recovery`: `successfulRecoveries 200` / `subscribeCalls 201`
  - `cache-cap`: chart cache remains capped at `256`
  - `data-overwrite`: stable bounded overwrite behavior

## Next Item
- Item 4: Runtime health alerts (heap slope, reconnect storms, listener growth).

## Item 2 Result
- Added payload-size estimator + oversized detection in:
  - `src/lib/websocket/payload-guard.ts`
- Added centralized payload limits and per-method overrides in:
  - `src/lib/websocket/reliability.ts`
- Wired payload guardrails into subscription hook path:
  - `src/lib/hyperliquid/hooks/utils/useSub.ts`
- Added validation coverage:
  - `src/lib/tests/websocket-payload-guard.test.ts`
  - `src/lib/tests/websocket-store-benchmark.test.ts` (`payload-guard` scenario)
- Benchmark signal:
  - `payload-guard`: dropped oversized payloads while keeping low heap delta (`+0.03 MB` in test run)

## Item 3 Result
- Added long-running soak harness and JSON reporting:
  - `src/lib/tests/websocket-soak.test.ts`
- Added run commands:
  - `pnpm perf:ws-soak:30m`
  - `pnpm perf:ws-soak:60m`
- Report output:
  - `.output/websocket-soak-<timestamp>.json`
- Smoke soak validation run (20s) produced:
  - `heapDelta=-0.35MB`, `maxSubs=24`, `maxChartCache=256`, `droppedPayloads=151`
  - report path: `.output/websocket-soak-2026-02-07T13-38-28-414Z.json`

## Progress Log
- 2026-02-07: Roadmap created; Item 1 started.
- 2026-02-07: Item 1 completed and benchmark-validated.
- 2026-02-07: Item 2 completed and benchmark-validated.
- 2026-02-07: Item 3 completed (soak runner + smoke validation).
