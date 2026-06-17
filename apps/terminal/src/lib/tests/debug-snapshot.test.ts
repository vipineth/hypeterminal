// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSubscription } from "./harness/subscription";

let createHyperliquidStore: typeof import("@hypeterminal/hl-react/store").createHyperliquidStore;
let getStoreInternals: typeof import("@hypeterminal/hl-react/store").getStoreInternals;
let registerDebugSnapshot: typeof import("@hypeterminal/hl-react/internal/websocket/debug").registerDebugSnapshot;
let registerChaosHarness: typeof import("@hypeterminal/hl-react/internal/websocket/chaos").registerChaosHarness;
let registerHealthReport: typeof import("@hypeterminal/hl-react/internal/websocket/health").registerHealthReport;

function requireDebugSnapshot(): NonNullable<ReturnType<NonNullable<Window["__hl_debug"]>>> {
	const snapshot = window.__hl_debug?.();
	expect(snapshot).toBeDefined();
	if (!snapshot) throw new Error("missing debug snapshot");
	return snapshot;
}

describe("debug snapshot", () => {
	beforeEach(async () => {
		vi.useFakeTimers();
		vi.resetModules();
		Object.defineProperty(document, "hidden", { value: false, configurable: true });
		const storeMod = await import("@hypeterminal/hl-react/store");
		createHyperliquidStore = storeMod.createHyperliquidStore;
		getStoreInternals = storeMod.getStoreInternals;
		const debugMod = await import("@hypeterminal/hl-react/internal/websocket/debug");
		registerDebugSnapshot = debugMod.registerDebugSnapshot;
		const chaosMod = await import("@hypeterminal/hl-react/internal/websocket/chaos");
		registerChaosHarness = chaosMod.registerChaosHarness;
		const healthMod = await import("@hypeterminal/hl-react/internal/websocket/health");
		registerHealthReport = healthMod.registerHealthReport;
	});

	afterEach(() => {
		vi.useRealTimers();
		Object.defineProperty(document, "hidden", { value: false, configurable: true });
		delete window.__hl_debug;
		delete window.__hl_chaos;
		delete window.__hl_health;
	});

	it("returns snapshot with expected keys given 2 fake subscriptions", async () => {
		const store = createHyperliquidStore({ ssr: false });
		registerDebugSnapshot(store);

		const key1 = JSON.stringify(["hl", "subscription", "l2Book", { coin: "ETH" }]);
		const key2 = JSON.stringify(["hl", "subscription", "trades", { coin: "BTC" }]);
		const sub1 = createFakeSubscription();
		const sub2 = createFakeSubscription();

		store.getState().acquireSubscription(key1, sub1.subscribe);
		store.getState().acquireSubscription(key2, sub2.subscribe);
		await vi.advanceTimersByTimeAsync(0);

		store.getState().setSubscriptionData(key1, { levels: [] });
		store.getState().setSubscriptionData(key2, [{ px: "100", sz: "1" }]);

		const snapshot = requireDebugSnapshot();

		expect(snapshot).toHaveProperty("subscriptions");
		expect(snapshot).toHaveProperty("counters");
		expect(snapshot).toHaveProperty("lastMessageAt");
		expect(snapshot).toHaveProperty("transportState");

		expect(Object.keys(snapshot.subscriptions)).toHaveLength(2);
		expect(snapshot.subscriptions[key1]).toEqual({
			status: "active",
			hasData: true,
			isStale: false,
		});
		expect(snapshot.subscriptions[key2]).toEqual({
			status: "active",
			hasData: true,
			isStale: false,
		});

		expect(snapshot.counters[key1]).toEqual({ refCount: 1, reconnectAttempts: 0 });
		expect(snapshot.counters[key2]).toEqual({ refCount: 1, reconnectAttempts: 0 });

		expect(snapshot.lastMessageAt[key1]).toBeTypeOf("number");
		expect(snapshot.lastMessageAt[key2]).toBeTypeOf("number");

		expect(snapshot.transportState.wsStatus).toBe("open");
		expect(snapshot.transportState.activeSubscriptionCount).toBe(2);

		store.getState().releaseSubscription(key1);
		store.getState().releaseSubscription(key2);
	});

	it("snapshot reflects stale subscriptions", async () => {
		const triggerReconnect = vi.fn();
		const store = createHyperliquidStore({ ssr: false, triggerReconnect });
		registerDebugSnapshot(store);

		const key = JSON.stringify(["hl", "subscription", "l2Book", { coin: "ETH" }]);
		const { subscribe } = createFakeSubscription();
		store.getState().acquireSubscription(key, subscribe);
		await vi.advanceTimersByTimeAsync(0);

		store.getState().setSubscriptionData(key, {});
		await vi.advanceTimersByTimeAsync(25_000);

		const snapshot = requireDebugSnapshot();
		expect(snapshot.subscriptions[key]?.isStale).toBe(true);

		store.getState().releaseSubscription(key);
	});

	it("returns websocket health alerts for reconnect and listener growth", async () => {
		const store = createHyperliquidStore({ ssr: false });
		registerHealthReport(store);

		const key = JSON.stringify(["hl", "subscription", "l2Book", { coin: "ETH" }]);
		const { subscribe } = createFakeSubscription();
		for (let i = 0; i < 8; i++) {
			store.getState().acquireSubscription(key, subscribe);
		}
		await vi.advanceTimersByTimeAsync(0);

		const runtime = getStoreInternals(store).subscriptionRuntime.get(key);
		if (!runtime) throw new Error("missing runtime");
		runtime.reconnectAttempts = 12;

		const report = window.__hl_health?.();

		expect(report?.status).toBe("warning");
		expect(report?.metrics.maxRefCount).toBe(8);
		expect(report?.metrics.maxReconnectAttempts).toBe(12);
		expect(report?.alerts.map((alert) => alert.id)).toEqual(
			expect.arrayContaining(["listener-high-refcount", "reconnect-storm"]),
		);

		for (let i = 0; i < 8; i++) {
			store.getState().releaseSubscription(key);
		}
	});

	it("reports sustained heap growth when Chrome memory samples are available", async () => {
		const store = createHyperliquidStore({ ssr: false });
		registerHealthReport(store);
		const memory = {
			usedJSHeapSize: 10 * 1024 * 1024,
			totalJSHeapSize: 20 * 1024 * 1024,
			jsHeapSizeLimit: 256 * 1024 * 1024,
		};
		Object.defineProperty(performance, "memory", { value: memory, configurable: true });

		window.__hl_health?.();
		await vi.advanceTimersByTimeAsync(60_000);
		memory.usedJSHeapSize = 20 * 1024 * 1024;
		window.__hl_health?.();
		await vi.advanceTimersByTimeAsync(60_000);
		memory.usedJSHeapSize = 50 * 1024 * 1024;

		const report = window.__hl_health?.();

		expect(report?.status).toBe("critical");
		expect(report?.metrics.heapSlopeBytesPerMinute).toBeGreaterThanOrEqual(16 * 1024 * 1024);
		expect(report?.alerts.map((alert) => alert.id)).toContain("heap-growth");

		delete (performance as Performance & { memory?: unknown }).memory;
	});
});

describe("chaos harness", () => {
	beforeEach(async () => {
		vi.useFakeTimers();
		vi.resetModules();
		Object.defineProperty(document, "hidden", { value: false, configurable: true });
		const storeMod = await import("@hypeterminal/hl-react/store");
		createHyperliquidStore = storeMod.createHyperliquidStore;
		const chaosMod = await import("@hypeterminal/hl-react/internal/websocket/chaos");
		registerChaosHarness = chaosMod.registerChaosHarness;
		const debugMod = await import("@hypeterminal/hl-react/internal/websocket/debug");
		registerDebugSnapshot = debugMod.registerDebugSnapshot;
	});

	afterEach(() => {
		vi.useRealTimers();
		Object.defineProperty(document, "hidden", { value: false, configurable: true });
		delete window.__hl_chaos;
		delete window.__hl_debug;
	});

	it("freezeMessages swallows data for the specified duration", async () => {
		const store = createHyperliquidStore({ ssr: false });
		registerChaosHarness(store);

		const key = JSON.stringify(["hl", "subscription", "l2Book", { coin: "ETH" }]);
		const { subscribe } = createFakeSubscription();
		store.getState().acquireSubscription(key, subscribe);
		await vi.advanceTimersByTimeAsync(0);

		store.getState().setSubscriptionData(key, { v: 1 });
		expect(store.getState().subscriptions[key]?.data).toEqual({ v: 1 });

		window.__hl_chaos?.freezeMessages(1_000);

		store.getState().setSubscriptionData(key, { v: 2 });
		expect(store.getState().subscriptions[key]?.data).toEqual({ v: 1 });

		await vi.advanceTimersByTimeAsync(1_100);

		store.getState().setSubscriptionData(key, { v: 3 });
		expect(store.getState().subscriptions[key]?.data).toEqual({ v: 3 });

		store.getState().releaseSubscription(key);
	});

	it("closeSocket calls triggerReconnect", () => {
		const triggerReconnect = vi.fn();
		const store = createHyperliquidStore({ ssr: false, triggerReconnect });
		registerChaosHarness(store);

		window.__hl_chaos?.closeSocket();
		expect(triggerReconnect).toHaveBeenCalledOnce();
	});

	it("dropReconnects causes next N reconnect attempts to fail", async () => {
		const store = createHyperliquidStore({ ssr: false });
		registerChaosHarness(store);

		window.__hl_chaos?.dropReconnects(2);

		const key = JSON.stringify(["hl", "subscription", "l2Book", { coin: "ETH" }]);
		const { subscribe } = createFakeSubscription();
		store.getState().acquireSubscription(key, subscribe);
		await vi.advanceTimersByTimeAsync(0);

		expect(store.getState().subscriptions[key]?.status).toBe("error");
		expect(store.getState().subscriptions[key]?.error).toBeInstanceOf(Error);

		store.getState().releaseSubscription(key);
	});

	it("simulateOffline drives network singleton and triggers store reconnect", async () => {
		const triggerReconnect = vi.fn();
		const store = createHyperliquidStore({ ssr: false, triggerReconnect });
		registerChaosHarness(store);

		const key = JSON.stringify(["hl", "subscription", "l2Book", { coin: "ETH" }]);
		const { subscribe } = createFakeSubscription();
		store.getState().acquireSubscription(key, subscribe);
		await vi.advanceTimersByTimeAsync(0);

		window.__hl_chaos?.simulateOffline(500);

		await vi.advanceTimersByTimeAsync(600);

		expect(triggerReconnect).toHaveBeenCalled();

		store.getState().releaseSubscription(key);
	});

	it("simulateHidden drives visibility singleton and buffers market data", async () => {
		const triggerReconnect = vi.fn();
		const store = createHyperliquidStore({ ssr: false, triggerReconnect });
		registerChaosHarness(store);

		const key = JSON.stringify(["hl", "subscription", "l2Book", { coin: "ETH" }]);
		const { subscribe } = createFakeSubscription();
		store.getState().acquireSubscription(key, subscribe);
		await vi.advanceTimersByTimeAsync(0);

		store.getState().setSubscriptionData(key, { v: 1 });

		window.__hl_chaos?.simulateHidden();
		Object.defineProperty(document, "hidden", { value: true, configurable: true });

		store.getState().setSubscriptionData(key, { v: 2 });
		expect(store.getState().subscriptions[key]?.data).toEqual({ v: 1 });

		window.__hl_chaos?.simulateVisible();
		Object.defineProperty(document, "hidden", { value: false, configurable: true });

		expect(store.getState().subscriptions[key]?.data).toEqual({ v: 2 });

		store.getState().releaseSubscription(key);
	});

	it("full cycle: freeze → stale → triggerReconnect → unfreeze → markFresh clears isStale", async () => {
		const triggerReconnect = vi.fn();
		const store = createHyperliquidStore({ ssr: false, triggerReconnect });
		registerChaosHarness(store);

		const key = JSON.stringify(["hl", "subscription", "l2Book", { coin: "ETH" }]);
		const { subscribe } = createFakeSubscription();
		store.getState().acquireSubscription(key, subscribe);
		await vi.advanceTimersByTimeAsync(0);

		// Initial fresh data: subscription starts non-stale.
		store.getState().setSubscriptionData(key, { v: 1 });
		expect(store.getState().subscriptions[key]?.isStale).toBeFalsy();

		// Freeze message delivery and advance past the 20s market threshold.
		window.__hl_chaos?.freezeMessages(60_000);
		store.getState().setSubscriptionData(key, { v: 2 }); // swallowed by freeze
		triggerReconnect.mockClear();

		await vi.advanceTimersByTimeAsync(25_000);

		expect(store.getState().subscriptions[key]?.isStale).toBe(true);
		expect(triggerReconnect).toHaveBeenCalled();
		// Data remained at v:1 because the freeze dropped v:2.
		expect(store.getState().subscriptions[key]?.data).toEqual({ v: 1 });

		// Unfreeze and deliver fresh data; watchdog clears isStale on markFresh.
		await vi.advanceTimersByTimeAsync(40_000); // past freeze window (60s total)
		store.getState().setSubscriptionData(key, { v: 3 });

		expect(store.getState().subscriptions[key]?.data).toEqual({ v: 3 });
		expect(store.getState().subscriptions[key]?.isStale).toBe(false);

		store.getState().releaseSubscription(key);
	});

	it("visibility buffer stays bounded under high-frequency market updates while hidden", async () => {
		const store = createHyperliquidStore({ ssr: false, triggerReconnect: vi.fn() });
		registerChaosHarness(store);
		registerDebugSnapshot(store);

		const key = JSON.stringify(["hl", "subscription", "l2Book", { coin: "ETH" }]);
		const { subscribe } = createFakeSubscription();
		store.getState().acquireSubscription(key, subscribe);
		await vi.advanceTimersByTimeAsync(0);

		window.__hl_chaos?.simulateHidden();
		Object.defineProperty(document, "hidden", { value: true, configurable: true });

		// Emit 1000 updates for the same key while hidden.
		for (let i = 0; i < 1000; i++) {
			store.getState().setSubscriptionData(key, { v: i });
		}

		// Buffer holds only the latest value per key — 1 entry, not 1000.
		const snapshot = window.__hl_debug?.();
		expect(snapshot?.transportState.visibilityBufferSize).toBe(1);

		window.__hl_chaos?.simulateVisible();
		Object.defineProperty(document, "hidden", { value: false, configurable: true });

		// On flush, the buffered latest value (v:999) lands in store state.
		expect(store.getState().subscriptions[key]?.data).toEqual({ v: 999 });

		store.getState().releaseSubscription(key);
	});
});
