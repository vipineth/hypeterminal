import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import { getStalenessThresholdForKey, WS_RELIABILITY_LIMITS } from "./reliability";
import { createStalenessWatchdog } from "./staleness";

const MEASURED_MAX_GAP_MS = 30_592;
const ACTIVE_ASSET_CTX_MAX_GAP_MS = 2_130;
const ACTIVE_ASSET_CTX_DEAD_LINK_BOUND_MS = 6_000;
const SAFETY_MARGIN = 1.5;
const TEN_MINUTES_MS = 10 * 60_000;
const QUIET_USER = "0x0000000000000000000000000000000000000001";

function countStaleEvents(key: string, frameGapsMs: number[]) {
	const watchdog = createStalenessWatchdog(WS_RELIABILITY_LIMITS.staleness.checkIntervalMs);
	watchdog.register(key, getStalenessThresholdForKey(key));
	let staleEvents = 0;
	watchdog.subscribe(key, (stale) => {
		if (stale) staleEvents += 1;
	});
	watchdog.markFresh(key);
	for (const gap of frameGapsMs) {
		vi.advanceTimersByTime(gap);
		watchdog.markFresh(key);
	}
	watchdog.destroy();
	return staleEvents;
}

describe("staleness thresholds against measured push cadence", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it.each([
		"allDexsAssetCtxs",
		"spotAssetCtxs",
	])("does not mark %s stale when it pushes every 30 s with a 1.5x margin", (method) => {
		const key = serializeKey(subscriptionKeys.method(method, undefined));
		const gaps = Array.from({ length: 10 }, () => Math.ceil(MEASURED_MAX_GAP_MS * SAFETY_MARGIN));
		expect(countStaleEvents(key, gaps)).toBe(0);
	});

	it.each([
		["userFills", { user: QUIET_USER, aggregateByTime: true }],
		["userFundings", { user: QUIET_USER }],
		["userHistoricalOrders", { user: QUIET_USER }],
		["trades", { coin: "TNSR" }],
		["candle", { coin: "TNSR", interval: "1m" }],
	])("does not mark event-driven %s stale after ten silent minutes", (method, params) => {
		const key = serializeKey(subscriptionKeys.method(method, params));
		expect(countStaleEvents(key, [TEN_MINUTES_MS])).toBe(0);
	});

	it("does not mark activeAssetCtx stale when it pushes at 1.5x its measured max gap", () => {
		const key = serializeKey(subscriptionKeys.method("activeAssetCtx", { coin: "TNSR" }));
		const gaps = Array.from({ length: 200 }, () => Math.ceil(ACTIVE_ASSET_CTX_MAX_GAP_MS * SAFETY_MARGIN));
		expect(countStaleEvents(key, gaps)).toBe(0);
	});

	it("marks activeAssetCtx stale within 6 s of its last frame", () => {
		const key = serializeKey(subscriptionKeys.method("activeAssetCtx", { coin: "BTC" }));
		const watchdog = createStalenessWatchdog(WS_RELIABILITY_LIMITS.staleness.checkIntervalMs);
		watchdog.register(key, getStalenessThresholdForKey(key));
		let staleAfterMs: number | undefined;
		const lastFrameAt = Date.now();
		watchdog.subscribe(key, (stale) => {
			if (stale) staleAfterMs ??= Date.now() - lastFrameAt;
		});
		watchdog.markFresh(key);
		vi.advanceTimersByTime(30_000);
		watchdog.destroy();
		expect(staleAfterMs).toBeLessThanOrEqual(ACTIVE_ASSET_CTX_DEAD_LINK_BOUND_MS);
	});

	it("still marks allDexsAssetCtxs stale when it goes silent for ten minutes", () => {
		const key = serializeKey(subscriptionKeys.method("allDexsAssetCtxs", undefined));
		expect(countStaleEvents(key, [TEN_MINUTES_MS])).toBe(1);
	});
});
