import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { privateKeyToAccount } from "viem/accounts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderToast } from "@/components/trade/tradebox/order-toast";
import { type OrderResult, reportSettlement, reportSubmit } from "@/lib/trade/extract-order-status";
import { createOrderSender, type Signer } from "@/lib/trade/order-sender";
import { createRequestStore, type PendingRequest, type SlotHold } from "@/lib/trade/pending-requests";
import { type OrderQueueItem, resultToQueueUpdate } from "@/stores/use-order-queue-store";
import {
	createFakeExchange,
	createMemoryKeyValue,
	createMemoryLocks,
	TEST_AGENT_KEY,
	TEST_USER,
} from "@/test/fake-exchange";

const view = vi.hoisted(() => ({
	queued: [] as OrderQueueItem[],
	pending: [] as PendingRequest[],
	holds: [] as SlotHold[],
	buttons: [] as { label: string; onClick?: () => void; disabled?: boolean }[],
	canCancel: true,
}));
const actions = vi.hoisted(() => ({
	addOrder: vi.fn(),
	updateOrder: vi.fn(),
	updateByRequestKey: vi.fn(),
	removeOrder: vi.fn(),
	retryRequest: vi.fn(async (_requestKey: string): Promise<OrderResult> => ({ ok: true, outcome: "filled" })),
	cancelRequest: vi.fn(async (_requestKey: string): Promise<OrderResult> => ({ ok: true, outcome: "filled" })),
	previewDismiss: vi.fn(async () => ({
		kind: "confirm",
		text: "The exchange never confirmed this request.",
		lookup: { kind: "order", statuses: null },
	})),
	dismissRequest: vi.fn(async () => ({ ok: true })),
	dismissUnreadable: vi.fn(async () => ({ ok: false, status: "unknown", error: "Dismissed." })),
	dismissHold: vi.fn(async () => ({ ok: false, status: "unknown", error: "Hold dismissed." })),
}));

vi.mock("@hypeterminal/ui", async (importOriginal) => ({
	...(await importOriginal<typeof import("@hypeterminal/ui")>()),
	Button: ({
		children,
		onClick,
		disabled,
		"aria-label": ariaLabel,
	}: {
		children?: ReactNode;
		onClick?: () => void;
		disabled?: boolean;
		"aria-label"?: string;
	}) => {
		view.buttons.push({ label: ariaLabel ?? String(children), onClick, disabled });
		return null;
	},
}));

vi.mock("@/stores/use-order-queue-store", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/stores/use-order-queue-store")>()),
	useOrderQueue: () => view.queued,
	useOrderQueueActions: () => ({
		addOrder: actions.addOrder,
		updateOrder: actions.updateOrder,
		updateByRequestKey: actions.updateByRequestKey,
		removeOrder: actions.removeOrder,
	}),
}));

vi.mock("@/hooks/trade/use-submit-plan", () => ({
	usePendingRequests: () => view.pending,
	useActiveHolds: () => view.holds,
	useSubmitPlan: () => ({
		retryRequest: actions.retryRequest,
		cancelRequest: actions.cancelRequest,
		previewDismiss: actions.previewDismiss,
		dismissRequest: actions.dismissRequest,
		dismissUnreadable: actions.dismissUnreadable,
		dismissHold: actions.dismissHold,
		canCancel: view.canCancel,
	}),
}));

const UNCONFIRMED_ROW: OrderQueueItem = {
	id: "order-1",
	market: "SOL",
	side: "buy",
	size: "4",
	status: "unsettled",
	error: "Not confirmed: Request timed out after 10000 ms. Retry or cancel it.",
	requestKey: "testnet:0x0000000000000000000000000000000000000001:5#1794596065043",
	createdAt: 0,
};

const LEFT_FROM_BEFORE_RELOAD: PendingRequest = {
	slot: "testnet:0x0000000000000000000000000000000000000001:4",
	kind: "order",
	user: "0x0000000000000000000000000000000000000001",
	signer: "0x0000000000000000000000000000000000000002",
	asset: 4,
	body: "{}",
	nonce: 1794596070000,
	expiresAfter: 1794596100000,
	cloids: [],
	legs: [{ role: "order", price: "1160" }],
	twap: null,
	label: { market: "ETH", side: "buy", size: "0.0104" },
	signedAt: 0,
};

const HELD_SCALE: SlotHold = {
	slot: "testnet:0x0000000000000000000000000000000000000001:5",
	hold: {
		nonce: 1794596065043,
		user: "0x0000000000000000000000000000000000000001",
		cloids: [],
		legs: [
			{ role: "scaleLeg", price: "90" },
			{ role: "scaleLeg", price: "95" },
		],
		buy: true,
		fates: ["placed", "unknown"],
		since: null,
		label: { market: "SOL", side: "buy", size: "2" },
	},
};

function buttonsNamed(label: string) {
	return view.buttons.filter((button) => button.label === label);
}

describe("order toast", () => {
	beforeEach(() => {
		view.queued = [UNCONFIRMED_ROW];
		view.pending = [LEFT_FROM_BEFORE_RELOAD];
		view.holds = [];
		view.buttons = [];
		view.canCancel = true;
		vi.clearAllMocks();
	});

	it("offers Retry and Cancel on an unconfirmed order and on one left from before a reload", () => {
		const html = renderToString(<OrderToast />).replaceAll("<!-- -->", "");
		expect(buttonsNamed("Retry")).toHaveLength(2);
		expect(buttonsNamed("Cancel")).toHaveLength(2);
		expect(html).toContain("2 unconfirmed");
		expect(html).toContain("ETH");
		expect(html).toContain("Not confirmed: Request timed out after 10000 ms. Retry or cancel it.");
	});

	it("says on a row left from before a reload that Retry resends that order as placed", () => {
		view.queued = [];
		const html = renderToString(<OrderToast />).replaceAll("<!-- -->", "");
		expect(html).toContain("Retry resends this order as you placed it: Order at 1160.");
	});

	it("retries an unconfirmed order by its request key", () => {
		renderToString(<OrderToast />);
		buttonsNamed("Retry")[1].onClick?.();
		expect(actions.retryRequest).toHaveBeenCalledWith(UNCONFIRMED_ROW.requestKey);
		expect(actions.addOrder).not.toHaveBeenCalled();
	});

	it("adds a row for a request left from before a reload before it cancels it", () => {
		renderToString(<OrderToast />);
		buttonsNamed("Cancel")[0].onClick?.();
		expect(actions.addOrder).toHaveBeenCalledWith(
			expect.objectContaining({
				market: "ETH",
				status: "pending",
				requestKey: `${LEFT_FROM_BEFORE_RELOAD.slot}#${LEFT_FROM_BEFORE_RELOAD.nonce}`,
			}),
		);
		expect(actions.cancelRequest).toHaveBeenCalledWith(
			`${LEFT_FROM_BEFORE_RELOAD.slot}#${LEFT_FROM_BEFORE_RELOAD.nonce}`,
		);
	});

	it("leaves a request out of the leftover rows once a queued row already shows it", () => {
		view.pending = [
			{
				...LEFT_FROM_BEFORE_RELOAD,
				slot: "testnet:0x0000000000000000000000000000000000000001:5",
				nonce: 1794596065043,
			},
		];
		renderToString(<OrderToast />);
		expect(buttonsNamed("Retry")).toHaveLength(1);
	});

	it("asks before it dismisses an unconfirmed order, and shows what the lookup said", async () => {
		view.queued = [{ ...UNCONFIRMED_ROW, canDismiss: true }];
		renderToString(<OrderToast />);
		expect(buttonsNamed("Dismiss")).toHaveLength(1);
		buttonsNamed("Dismiss")[0].onClick?.();
		await vi.waitFor(() =>
			expect(actions.updateByRequestKey).toHaveBeenLastCalledWith(UNCONFIRMED_ROW.requestKey, {
				status: "unsettled",
				confirmDismiss: {
					text: "The exchange never confirmed this request.",
					lookup: { kind: "order", statuses: null },
				},
			}),
		);
		expect(actions.dismissRequest).not.toHaveBeenCalled();
		view.queued = [
			{ ...UNCONFIRMED_ROW, confirmDismiss: { text: "Lookup line.", lookup: { kind: "order", statuses: null } } },
		];
		view.pending = [];
		view.buttons = [];
		const html = renderToString(<OrderToast />);
		expect(html).toContain("Lookup line.");
		expect(buttonsNamed("Retry")).toHaveLength(0);
		buttonsNamed("Yes, dismiss it")[0].onClick?.();
		expect(actions.dismissRequest).toHaveBeenCalledWith(UNCONFIRMED_ROW.requestKey, { kind: "order", statuses: null });
	});

	it("offers no Retry or Cancel on an order whose outcome is unknown", () => {
		view.queued = [{ ...UNCONFIRMED_ROW, status: "unknown", requestKey: undefined, error: "TWAP status unknown." }];
		view.pending = [];
		const html = renderToString(<OrderToast />).replaceAll("<!-- -->", "");
		expect(html).toContain("TWAP status unknown.");
		expect(buttonsNamed("Retry")).toHaveLength(0);
		expect(buttonsNamed("Cancel")).toHaveLength(0);
	});

	it("shows an unconfirmed buy left from before a reload beside the sell press it blocked", () => {
		const buyLeftOver: PendingRequest = {
			...LEFT_FROM_BEFORE_RELOAD,
			slot: "testnet:0x0000000000000000000000000000000000000001:5",
			label: { market: "SOL", side: "buy", size: "1" },
		};
		const blockedSell = resultToQueueUpdate(
			reportSubmit({
				kind: "blocked",
				earlier: { kind: "pending", request: buyLeftOver, error: "Failed to fetch", dismissible: false },
			}),
		);
		view.queued = [
			{ id: "row-2", market: "SOL", side: "sell", size: "5", status: "pending", createdAt: 0, ...blockedSell },
		];
		view.pending = [buyLeftOver];
		const html = renderToString(<OrderToast />).replaceAll("<!-- -->", "");
		expect(html).toContain(">buy<");
		expect(html).toContain(">sell<");
		expect(buttonsNamed("Retry")).toHaveLength(1);
		buttonsNamed("Retry")[0].onClick?.();
		expect(actions.retryRequest).toHaveBeenCalledWith(
			`testnet:0x0000000000000000000000000000000000000001:5#${LEFT_FROM_BEFORE_RELOAD.nonce}`,
		);
		expect(actions.addOrder).toHaveBeenCalledWith(expect.objectContaining({ side: "buy", size: "1" }));
	});

	it("disables Cancel on a row left from before a reload until the trading wallet is ready, and says why", () => {
		view.queued = [];
		view.canCancel = false;
		const html = renderToString(<OrderToast />).replaceAll("<!-- -->", "");
		expect(buttonsNamed("Cancel").map((button) => button.disabled)).toEqual([true]);
		expect(buttonsNamed("Retry").map((button) => button.disabled)).toEqual([undefined]);
		expect(html).toContain("Connect your trading wallet to cancel it.");
	});

	it("puts a leftover row back with its buttons and the reason when its Cancel is not sent", async () => {
		const leftOverKey = `${LEFT_FROM_BEFORE_RELOAD.slot}#${LEFT_FROM_BEFORE_RELOAD.nonce}`;
		actions.cancelRequest.mockResolvedValueOnce({
			ok: false,
			status: "notSent",
			error: "Wallet is required for exchange actions",
		});
		view.queued = [];
		renderToString(<OrderToast />);
		buttonsNamed("Cancel")[0].onClick?.();
		await vi.waitFor(() =>
			expect(actions.updateByRequestKey).toHaveBeenLastCalledWith(
				leftOverKey,
				expect.objectContaining({ status: "unsettled", error: "Wallet is required for exchange actions" }),
			),
		);
		view.queued = [{ ...actions.addOrder.mock.calls[0][0], id: "adopted", ...lastUpdateFor(leftOverKey) }];
		view.pending = [LEFT_FROM_BEFORE_RELOAD];
		view.holds = [];
		view.buttons = [];
		const html = renderToString(<OrderToast />).replaceAll("<!-- -->", "");
		expect(html).not.toContain("1 pending");
		expect(html).toContain("1 unconfirmed");
		expect(buttonsNamed("Retry")).toHaveLength(1);
		expect(buttonsNamed("Cancel")).toHaveLength(1);
	});

	it("puts a leftover row back with the refusal when its Retry is refused", async () => {
		const leftOverKey = `${LEFT_FROM_BEFORE_RELOAD.slot}#${LEFT_FROM_BEFORE_RELOAD.nonce}`;
		const refusal = "Can't save order state in this browser. Enable site storage to trade.";
		actions.retryRequest.mockResolvedValueOnce({ ok: false, status: "notSent", error: refusal });
		view.queued = [];
		renderToString(<OrderToast />);
		buttonsNamed("Retry")[0].onClick?.();
		await vi.waitFor(() =>
			expect(actions.updateByRequestKey).toHaveBeenLastCalledWith(
				leftOverKey,
				expect.objectContaining({ status: "unsettled", error: refusal }),
			),
		);
	});

	it("offers Dismiss only on a row whose request can no longer execute or whose signer is gone", () => {
		view.queued = [
			UNCONFIRMED_ROW,
			{ ...UNCONFIRMED_ROW, id: "order-2", requestKey: `${UNCONFIRMED_ROW.requestKey}2`, canDismiss: true },
		];
		renderToString(<OrderToast />);
		expect(buttonsNamed("Retry")).toHaveLength(3);
		expect(buttonsNamed("Dismiss")).toHaveLength(1);
		buttonsNamed("Dismiss")[0].onClick?.();
		expect(actions.previewDismiss).toHaveBeenCalledWith(`${UNCONFIRMED_ROW.requestKey}2`);
	});

	it("shows a held press with the legs that placed and no partial resend", async () => {
		const held = await pressHeldScale();
		view.queued = [
			{
				id: "row-held",
				market: "SOL",
				side: "buy",
				size: "2",
				createdAt: 0,
				...resultToQueueUpdate(reportSubmit(held)),
			} as OrderQueueItem,
		];
		view.pending = [];
		const html = renderToString(<OrderToast />).replaceAll("<!-- -->", "");
		expect(view.buttons.map((button) => button.label)).not.toContain("Send only the rejected legs");
		expect(html).toContain("Leg 1 at 90 placed, Leg 2 at 95 rejected");
	});

	it("shows every hold as a row whose confirmed Dismiss names the placed and unknown legs", async () => {
		view.queued = [];
		view.pending = [];
		view.holds = [HELD_SCALE];
		const html = renderToString(<OrderToast />).replaceAll("<!-- -->", "");
		expect(html).toContain(
			"The same order is held on this market. Last result: Leg 1 at 90 placed, Leg 2 at 95 not confirmed.",
		);
		buttonsNamed("Dismiss hold")[0].onClick?.();
		expect(actions.addOrder).toHaveBeenCalledWith(expect.objectContaining({ held: HELD_SCALE, confirmHold: true }));
		view.queued = [{ ...actions.addOrder.mock.calls[0][0], id: "row-hold" }];
		view.buttons = [];
		expect(renderToString(<OrderToast />)).toContain(
			"Known placed: Leg 1 at 90. Unknown: Leg 2 at 95. Dismiss the hold? Sending the same order again could place an already placed leg twice.",
		);
		expect(buttonsNamed("Dismiss hold")).toHaveLength(0);
		buttonsNamed("Yes, dismiss hold")[0].onClick?.();
		await vi.waitFor(() => expect(actions.dismissHold).toHaveBeenCalledWith(HELD_SCALE));
		await vi.waitFor(() =>
			expect(actions.updateOrder).toHaveBeenLastCalledWith(
				"row-hold",
				expect.objectContaining({ status: "unknown", error: "Hold dismissed.", held: undefined }),
			),
		);
	});

	it("shows an IOC order the exchange filled only in part as partly filled, with the filled size and the rest", () => {
		const request: PendingRequest = {
			...LEFT_FROM_BEFORE_RELOAD,
			body: JSON.stringify({ action: { type: "order", orders: [{ s: "1" }] } }),
			label: { market: "SOL", side: "buy", size: "1" },
		};
		const response = { type: "order", data: { statuses: [{ filled: { totalSz: "0.2", avgPx: "90", oid: 1 } }] } };
		view.queued = [
			{
				id: "row-ioc",
				...request.label,
				createdAt: 0,
				...resultToQueueUpdate(reportSettlement({ kind: "answered", request, response })),
			} as OrderQueueItem,
		];
		view.pending = [];
		const html = renderToString(<OrderToast />).replaceAll("<!-- -->", "");
		expect(html).not.toContain(">Filled<");
		expect(html).toContain(">Partly filled<");
		expect(html).toContain("Order partially filled: 0.2 of 1, 0.8 not filled");
	});

	it("keeps a hold's open confirm above the refused presses that stack after it", async () => {
		const refusedRow = {
			id: "row-refused",
			market: "SOL",
			side: "buy",
			size: "2",
			createdAt: 0,
			...resultToQueueUpdate(reportSubmit(await pressHeldScale())),
		} as OrderQueueItem;
		const confirmingHold: OrderQueueItem = {
			id: "row-hold",
			...HELD_SCALE.hold.label,
			status: "unsettled",
			held: HELD_SCALE,
			confirmHold: true,
			createdAt: 0,
		};
		view.queued = [refusedRow, { ...refusedRow, id: "row-refused-2" }, confirmingHold];
		view.pending = [];
		view.holds = [HELD_SCALE];
		const html = renderToString(<OrderToast />).replaceAll("<!-- -->", "");
		const confirmAt = html.indexOf("Known placed: Leg 1 at 90.");
		expect(confirmAt).toBeGreaterThan(-1);
		expect(confirmAt).toBeLessThan(html.indexOf("Not sent. Your last order on this market"));
	});

	it("counts a refused press and a canceled order apart from failed ones", async () => {
		const request: PendingRequest = { ...LEFT_FROM_BEFORE_RELOAD, label: { market: "SOL", side: "buy", size: "1" } };
		const rejected = reportSettlement({
			kind: "answered",
			request,
			response: { type: "order", data: { statuses: [{ error: "Insufficient margin to place order. asset=5" }] } },
		});
		const rows = [reportSubmit(await pressHeldScale()), reportSettlement({ kind: "canceled", request }), rejected].map(
			(result, index) => ({ id: `row-${index}`, ...request.label, createdAt: 0, ...resultToQueueUpdate(result) }),
		);
		view.queued = rows as OrderQueueItem[];
		view.pending = [];
		const html = renderToString(<OrderToast />).replaceAll("<!-- -->", "");
		expect(html).toContain("1 failed");
		expect(html).toContain("1 not sent");
		expect(html).toContain("1 canceled");
	});

	it("offers a confirmed Dismiss on a press refused over a pending order it can't read", async () => {
		const unreadable = { slot: LEFT_FROM_BEFORE_RELOAD.slot, raw: '{"state":"pending"}' };
		const refused = reportSubmit({ kind: "refused", reason: "unreadableRecord", ...unreadable });
		const row = {
			id: "row-3",
			market: "ETH",
			side: "buy",
			size: "1",
			createdAt: 0,
			...resultToQueueUpdate(refused),
		} as OrderQueueItem;
		view.queued = [row];
		view.pending = [];
		const html = renderToString(<OrderToast />)
			.replaceAll("<!-- -->", "")
			.replaceAll("&#x27;", "'");
		expect(html).toContain("Can't read a pending order for this market.");
		buttonsNamed("Dismiss pending order")[0].onClick?.();
		expect(actions.updateOrder).toHaveBeenCalledWith("row-3", { confirmUnreadable: true });
		view.queued = [{ ...row, confirmUnreadable: true }];
		view.buttons = [];
		expect(renderToString(<OrderToast />)).toContain("It may still execute.");
		buttonsNamed("Yes, dismiss it")[0].onClick?.();
		await vi.waitFor(() => expect(actions.dismissUnreadable).toHaveBeenCalledWith(unreadable.slot, unreadable.raw));
		await vi.waitFor(() =>
			expect(actions.updateOrder).toHaveBeenLastCalledWith("row-3", expect.objectContaining({ status: "unknown" })),
		);
	});
});

function lastUpdateFor(requestKey: string): Partial<OrderQueueItem> {
	const updates = actions.updateByRequestKey.mock.calls
		.filter(([key]) => key === requestKey)
		.map(([, update]) => update);
	return Object.assign({}, ...updates);
}

async function pressHeldScale() {
	const venue = createFakeExchange();
	venue.state.legOutcome = (order) =>
		order.p === "95" ? { status: { error: "bad price" }, lookup: "rejected" } : undefined;
	const keyValue = createMemoryKeyValue();
	const locks = createMemoryLocks();
	const sender = createOrderSender({
		info: () => venue.info,
		store: createRequestStore(() => keyValue),
		clock: { now: async () => Date.now(), estimate: () => Date.now(), warm() {} },
		locks: () => locks,
		sleep: async () => {},
	});
	const signer: Signer = {
		user: TEST_USER,
		config: { transport: venue.transport, wallet: privateKeyToAccount(TEST_AGENT_KEY) },
	};
	let cloid = 0;
	function scale(prices: string[]) {
		return {
			kind: "order" as const,
			params: {
				orders: prices.map((p) => ({
					a: 5,
					b: true,
					p,
					s: "1",
					r: false,
					t: { limit: { tif: "FrontendMarket" as const } },
					c: `0xd0${(++cloid).toString(16).padStart(30, "0")}` as `0x${string}`,
				})),
				grouping: "na" as const,
			},
			legs: prices.map((price) => ({ role: "scaleLeg" as const, price })),
			label: { market: "SOL", side: "buy" as const, size: String(prices.length) },
		};
	}
	await sender.submit(signer, scale(["90", "95"]));
	return sender.submit(signer, scale(["90", "96"]));
}
