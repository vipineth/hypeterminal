import { getSdkReconnectionDelayMs } from "@hypeterminal/hl-react/internal/websocket/reliability";
import { describe, expect, it, vi } from "vitest";

describe("SDK reconnect backoff constant", () => {
	it("doubles up to a 30s cap", () => {
		expect(getSdkReconnectionDelayMs(0)).toBe(500);
		expect(getSdkReconnectionDelayMs(1)).toBe(1_000);
		expect(getSdkReconnectionDelayMs(2)).toBe(2_000);
		expect(getSdkReconnectionDelayMs(3)).toBe(4_000);
		expect(getSdkReconnectionDelayMs(4)).toBe(8_000);
		expect(getSdkReconnectionDelayMs(5)).toBe(16_000);
		expect(getSdkReconnectionDelayMs(6)).toBe(30_000);
		expect(getSdkReconnectionDelayMs(7)).toBe(30_000);
		expect(getSdkReconnectionDelayMs(100)).toBe(30_000);
	});
});

describe("createWsReconnectTrigger SDK coupling", () => {
	// Regression guard: if @nktkas/hyperliquid ever hides or renames
	// WebSocketTransport.socket, the guard in clients.ts silently returns a
	// no-op. Observable-behavior check: construct a real transport, spy on the
	// underlying socket's close method, invoke the trigger, and assert close
	// was called non-permanently. Surfaces any SDK breakage in tests rather
	// than silently in production.
	it("invokes socket.close(undefined, undefined, false) against a real WebSocketTransport", async () => {
		const { WebSocketTransport } = await import("@nktkas/hyperliquid");
		const { createWsReconnectTrigger, getWsTransport } = await import("@hypeterminal/hl-react/clients");

		// Retrieve the module-cached transport the trigger will target.
		const transport = getWsTransport(true);
		expect(transport).toBeInstanceOf(WebSocketTransport);
		const socket = (transport as InstanceType<typeof WebSocketTransport>).socket as {
			close: (code?: number, reason?: string, permanent?: boolean) => void;
		};
		expect(typeof socket?.close).toBe("function");
		const spy = vi.spyOn(socket, "close").mockImplementation(() => {});

		try {
			const trigger = createWsReconnectTrigger(true);
			trigger();
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy).toHaveBeenCalledWith(undefined, undefined, false);
		} finally {
			spy.mockRestore();
		}
	});
});

describe("store reconnect with fake subscriptions", () => {
	it("store acquires and releases subscriptions correctly", async () => {
		const { createHyperliquidStore } = await import("@hypeterminal/hl-react/store");
		const store = createHyperliquidStore({ ssr: false });

		const failureController = new AbortController();
		store.getState().acquireSubscription("test:key", async () => ({
			unsubscribe: async () => {},
			failureSignal: failureController.signal,
		}));

		await new Promise<void>((r) => setTimeout(r, 0));

		const state = store.getState();
		expect(state.subscriptions["test:key"]).toBeDefined();
		expect(state.subscriptions["test:key"].status).toBe("active");

		store.getState().releaseSubscription("test:key");
		await new Promise<void>((r) => setTimeout(r, 0));

		expect(store.getState().subscriptions["test:key"]).toBeUndefined();
	});

	it("store schedules reconnect on subscription failure", async () => {
		const { createHyperliquidStore } = await import("@hypeterminal/hl-react/store");
		const store = createHyperliquidStore({ ssr: false });

		const failureController = new AbortController();
		store.getState().acquireSubscription("test:reconnect", async () => ({
			unsubscribe: async () => {},
			failureSignal: failureController.signal,
		}));

		await new Promise<void>((r) => setTimeout(r, 0));
		expect(store.getState().subscriptions["test:reconnect"].status).toBe("active");

		failureController.abort(new Error("Connection lost"));
		await new Promise<void>((r) => setTimeout(r, 0));

		expect(store.getState().subscriptions["test:reconnect"].status).toBe("error");

		store.getState().releaseSubscription("test:reconnect");
	});

	it("recovers after repeated failures: cycles through errors then lands active", async () => {
		const { createHyperliquidStore } = await import("@hypeterminal/hl-react/store");
		const store = createHyperliquidStore({ ssr: false });

		const key = "test:retry-then-success";
		let attempt = 0;
		let currentController = new AbortController();

		const subscribe = async () => {
			attempt += 1;
			if (attempt <= 2) {
				const err = new Error(`attempt ${attempt} failed`);
				// Fire the failure signal on next tick so the store transitions
				// active -> error -> schedules reconnect, just like a real
				// post-open disconnect.
				const controller = new AbortController();
				setTimeout(() => controller.abort(err), 0);
				return { unsubscribe: async () => {}, failureSignal: controller.signal };
			}
			currentController = new AbortController();
			return { unsubscribe: async () => {}, failureSignal: currentController.signal };
		};

		store.getState().acquireSubscription(key, subscribe);

		// Let the store work through: active -> error -> reconnect -> error -> reconnect -> active.
		// Poll the status rather than over-specifying wait durations.
		const deadline = Date.now() + 5_000;
		while (Date.now() < deadline) {
			if (store.getState().subscriptions[key]?.status === "active" && attempt >= 3) break;
			await new Promise<void>((r) => setTimeout(r, 50));
		}

		expect(attempt).toBeGreaterThanOrEqual(3);
		expect(store.getState().subscriptions[key]?.status).toBe("active");

		store.getState().releaseSubscription(key);
	});
});
