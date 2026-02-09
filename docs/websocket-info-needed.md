# WebSocket Tuning Inputs Needed

## Why This File Exists
- These inputs let us tune limits for your real traffic profile instead of guessing.
- If unknown, we use defaults and iterate from benchmark data.

## Required Inputs
- [ ] Expected max concurrent channels/subscriptions per user session
- [ ] Typical and peak messages/sec for hot channels (orderbook, trades, account)
- [ ] Largest observed payload sizes (bytes) per channel
- [ ] Session duration targets (e.g., 8h, 24h, always-on)
- [ ] Device profile split (desktop/mobile, low-RAM share)
- [ ] Memory budget target for renderer process (MB)
- [ ] Reconnect policy preference (aggressive freshness vs conservative stability)
- [ ] Acceptable staleness budget after disconnect (ms/s)
- [ ] Which streams are critical vs non-critical during degradation
- [ ] Whether to drop intermediate ticks under pressure (yes/no)

## Optional but High Value
- [ ] Real crash traces (`chrome://crashes`, renderer logs, console errors)
- [ ] Heap snapshots before/after 10+ minutes
- [ ] Network traces around disconnect storms
- [ ] Production telemetry samples for reconnect/error rates

## Defaults We Can Use Immediately
- Active subscriptions cap: high watermark below transport hard limit
- Reconnect backoff: exponential + jitter with cooldown after repeated failures
- UI update throttle: keep last-value semantics for high-frequency streams
- Cache strategy: LRU caps for all in-memory websocket-derived caches

## Current Step
- Item 3 soak runner is complete; this file is needed to tune thresholds before Item 4 alerts.
