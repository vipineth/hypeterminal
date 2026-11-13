import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LockManagerLike } from "@/lib/trade/order-sender";
import {
	createFakeExchange,
	createMemoryKeyValue,
	createMemoryLocks,
	type FakeExchange,
	type MemoryKeyValue,
} from "@/test/fake-exchange";

const net = vi.hoisted(() => ({
	venue: null as unknown as FakeExchange,
	storage: null as unknown as MemoryKeyValue,
	locks: null as unknown as LockManagerLike,
	tradingReady: true,
}));
const queue = vi.hoisted(() => ({
	addOrder: vi.fn(),
	updateOrder: vi.fn(),
	updateByRequestKey: vi.fn(),
	removeOrder: vi.fn(),
}));

vi.mock("wagmi", () => ({
	useConnection: () => ({ address: "0x0000000000000000000000000000000000000001" }),
}));

vi.mock("@hypeterminal/hl-react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@hypeterminal/hl-react")>()),
	useHyperliquidClients: () => ({ trading: net.tradingReady ? net.venue.trading : undefined }),
}));

vi.mock("@/lib/trade/browser-env", () => ({
	getBrowserKeyValue: () => net.storage,
	getBrowserLocks: () => net.locks,
	getBrowserChangeBus: () => ({ post() {}, subscribe: () => () => {} }),
}));

vi.mock("@/stores/use-order-queue-store", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/stores/use-order-queue-store")>()),
	useOrderQueueActions: () => queue,
}));

vi.mock("@/lib/hyperliquid", async (importOriginal) => {
	const { DEFAULT_BUILDER_CONFIG } = await import("@/config/hyperliquid");
	return {
		...(await importOriginal<typeof import("@/lib/hyperliquid")>()),
		useHyperliquid: () => ({ builderConfig: DEFAULT_BUILDER_CONFIG, isTestnet: true }),
		getInfoClient: () => net.venue.info,
	};
});

type SubmitPlanHook = ReturnType<typeof import("@/hooks/trade/use-submit-plan").useSubmitPlan>;

interface Props {
	onHook: (hook: SubmitPlanHook) => void;
	use: () => SubmitPlanHook;
}

function HookProbe({ onHook, use }: Props) {
	onHook(use());
	return null;
}

async function mountSubmitPlan(): Promise<SubmitPlanHook> {
	vi.resetModules();
	const { useSubmitPlan } = await import("@/hooks/trade/use-submit-plan");
	const hooks: SubmitPlanHook[] = [];
	renderToString(<HookProbe use={useSubmitPlan} onHook={(hook) => hooks.push(hook)} />);
	return hooks[0];
}

const MARKET_BUY = {
	grouping: "na" as const,
	orders: [{ a: 5, b: true, p: "90", s: "1", r: false, t: { limit: { tif: "FrontendMarket" as const } } }],
};

async function settle<T>(promise: Promise<T>): Promise<T> {
	await vi.advanceTimersByTimeAsync(12_000);
	return promise;
}

describe("retry and cancel on an unconfirmed order", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		net.venue = createFakeExchange();
		net.storage = createMemoryKeyValue();
		net.locks = createMemoryLocks();
		net.tradingReady = true;
		queue.updateByRequestKey.mockClear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	async function sendUnconfirmed(hook: SubmitPlanHook): Promise<string> {
		net.venue.nextExchangeRequests("inTransit", "lost", "lost", "lost");
		const result = await settle(hook.submitPlan(MARKET_BUY));
		if (result.ok || result.status !== "unsettled") throw new Error("expected an unconfirmed order");
		return result.requestKey;
	}

	it("Retry resends the stored body byte for byte and reports the order it placed", async () => {
		const hook = await mountSubmitPlan();
		const requestKey = await sendUnconfirmed(hook);
		const result = await settle(hook.retryRequest(requestKey));
		net.venue.deliverInTransit();
		expect(result).toEqual({ ok: true, outcome: "filled" });
		expect(new Set(net.venue.exchangeRequests).size).toBe(1);
		expect(net.venue.state.placedLegs).toBe(1);
	});

	it("Cancel sends a noop at the stored nonce, so the original arriving late places nothing", async () => {
		const hook = await mountSubmitPlan();
		const requestKey = await sendUnconfirmed(hook);
		const result = await settle(hook.cancelRequest(requestKey));
		const [lateArrival] = net.venue.deliverInTransit();
		expect(result).toEqual({ ok: false, status: "failed", error: "Canceled. Nothing was placed." });
		expect(lateArrival).toMatchObject({
			status: "err",
			response: expect.stringMatching(/^Invalid nonce: duplicate nonce/),
		});
		expect(net.venue.state.placedLegs).toBe(0);
	});

	it("labels an unconfirmed close by its side and size so a later tab can show it", async () => {
		const hook = await mountSubmitPlan();
		net.venue.nextExchangeRequests("lost", "lost", "lost", "lost");
		const closeShort = { grouping: "na" as const, orders: [{ ...MARKET_BUY.orders[0], s: "2.5", r: true }] };
		await settle(hook.submitPlan(closeShort));
		expect(storedSlot().request.label).toEqual({ market: "", side: "buy", size: "2.5" });
	});

	it("says a request is already settled when Retry finds it gone", async () => {
		const hook = await mountSubmitPlan();
		const requestKey = await sendUnconfirmed(hook);
		await settle(hook.retryRequest(requestKey));
		expect(await settle(hook.retryRequest(requestKey))).toEqual({
			ok: false,
			status: "unknown",
			error: "This request was already settled. Check open orders.",
		});
		expect(net.venue.state.placedLegs).toBe(1);
	});

	it("dismisses an unconfirmed order only after showing what a lookup says, and records the dismissal", async () => {
		const hook = await mountSubmitPlan();
		net.venue.nextExchangeRequests("lost", "lost", "lost", "lost");
		const result = await settle(hook.submitPlan(MARKET_BUY));
		if (result.ok || result.status !== "unsettled") throw new Error("expected an unconfirmed order");
		const early = await settle(hook.previewDismiss(result.requestKey));
		expect(early).toMatchObject({ kind: "result", result: { status: "unsettled", canDismiss: false } });
		await vi.advanceTimersByTimeAsync(30_000);
		net.venue.nextExchangeRequests("lost", "lost");
		const preview = await settle(hook.previewDismiss(result.requestKey));
		if (preview.kind !== "confirm") throw new Error("expected a confirmation");
		expect(preview.text).toBe(
			"The exchange never confirmed this request. A lookup did not find it, which does not prove it never executed. It can no longer execute. Dismiss it? Your next order on this market will be sent as a new one.",
		);
		expect(storedSlot().state).toBe("pending");
		const dismissed = await settle(hook.dismissRequest(result.requestKey, preview.lookup));
		expect(dismissed).toEqual({
			ok: false,
			status: "unknown",
			error: "Dismissed without confirmation. It may have executed. Check open orders.",
		});
		expect(storedDismissal(result.requestKey)).toMatchObject({
			request: { nonce: storedSlot().nonce },
			lookup: { kind: "order", statuses: [{ status: "unknownOid" }] },
		});
		const next = await settle(hook.submitPlan(MARKET_BUY));
		expect(next).toEqual({ ok: true, outcome: "filled" });
	});

	it("reports a dismissed order a lookup found as filled, never as nothing placed", async () => {
		const hook = await mountSubmitPlan();
		net.venue.nextExchangeRequests("noReply");
		net.venue.state.onSend = () => {
			net.venue.state.exchangeDown = true;
			net.venue.state.onSend = null;
		};
		const result = await settle(hook.submitPlan(MARKET_BUY));
		if (result.ok || result.status !== "unsettled") throw new Error("expected an unconfirmed order");
		await vi.advanceTimersByTimeAsync(30_000);
		const preview = await settle(hook.previewDismiss(result.requestKey));
		if (preview.kind !== "confirm") throw new Error("expected a confirmation");
		expect(preview.text).toContain("A lookup found it: it filled.");
		const dismissed = await settle(hook.dismissRequest(result.requestKey, preview.lookup));
		expect(dismissed).toMatchObject({ ok: true, outcome: "filled" });
		expect(net.venue.state.placedLegs).toBe(1);
	});
});

describe("cancel before the trading wallet is ready", () => {
	beforeEach(() => {
		net.venue = createFakeExchange();
		net.storage = createMemoryKeyValue();
		net.locks = createMemoryLocks();
	});

	it("says Cancel can run only once a trading wallet can sign it", async () => {
		net.tradingReady = false;
		expect((await mountSubmitPlan()).canCancel).toBe(false);
		net.tradingReady = true;
		expect((await mountSubmitPlan()).canCancel).toBe(true);
	});
});

function storedDismissal(requestKey: string) {
	return net.storage.items.get(`hypeterminal:dismissed-request:v1:${requestKey}`) as { request: { nonce: number } };
}

function storedSlot() {
	return net.storage.items.get(
		"hypeterminal:pending-request:v2:testnet:0x0000000000000000000000000000000000000001:5",
	) as { state: string; nonce: number; request: { label: unknown } };
}
