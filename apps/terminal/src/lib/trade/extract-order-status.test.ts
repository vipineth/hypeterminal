import type { OrderStatusResponse } from "@nktkas/hyperliquid";
import { describe, expect, it } from "vitest";
import type { PlanLeg } from "@/domain/trade/order-intent";
import {
	describeInspection,
	interpretOrderStatuses,
	NO_EXCHANGE_RESPONSE,
	reportSettlement,
	reportSubmit,
} from "@/lib/trade/extract-order-status";
import type { OrderLookup, Settlement, TwapRecord } from "@/lib/trade/order-sender";
import type { PendingRequest } from "@/lib/trade/pending-requests";

const ORDER: PlanLeg[] = [{ role: "order", price: "80.276" }];
const ENTRY_WITH_TP: PlanLeg[] = [
	{ role: "entry", price: "80.276" },
	{ role: "takeProfit", price: "90" },
];
const POSITION_TP_SL: PlanLeg[] = [
	{ role: "takeProfit", price: "90" },
	{ role: "stopLoss", price: "70" },
];
const SCALE: PlanLeg[] = ["80", "79.5", "79", "78.5", "78"].map((price) => ({ role: "scaleLeg", price }));

const FILLED = { filled: { totalSz: "1", avgPx: "80.276", oid: 11 } };
const RESTING = { resting: { oid: 12 } };
const TP_REJECTED = { error: "Invalid TP/SL price. asset=5" };

function request(kind: "order" | "twap", legs: PlanLeg[] = ORDER): PendingRequest {
	return {
		slot: "testnet:0x0000000000000000000000000000000000000001:5",
		kind,
		user: "0x0000000000000000000000000000000000000001",
		signer: "0x0000000000000000000000000000000000000002",
		asset: 5,
		body: "{}",
		nonce: 1794596065043,
		expiresAfter: 1794596095043,
		cloids: [],
		legs,
		twap: kind === "twap" ? { coin: "SOL", knownIds: [] } : null,
		parent: null,
		label: { market: "SOL", side: "buy", size: "1" },
		createdAt: 0,
	};
}

function found(status: string, isTrigger = false): OrderStatusResponse {
	return { status: "order", order: { status, statusTimestamp: 0, order: { isTrigger } } } as OrderStatusResponse;
}

const UNKNOWN: OrderStatusResponse = { status: "unknownOid" };

function orderLookup(...statuses: OrderStatusResponse[]): OrderLookup {
	return { kind: "order", statuses };
}

function twapRecord(twapId: number): TwapRecord {
	return { time: 0, status: { status: "activated" }, twapId, state: {} as TwapRecord["state"] };
}

describe("interpretOrderStatuses", () => {
	it("reports success when every leg is placed", () => {
		expect(interpretOrderStatuses([FILLED, "waitingForTrigger"], ENTRY_WITH_TP)).toEqual({
			ok: true,
			outcome: "filled",
		});
		expect(interpretOrderStatuses([RESTING, "waitingForFill"], ENTRY_WITH_TP)).toEqual({
			ok: true,
			outcome: "resting",
		});
		expect(interpretOrderStatuses(["waitingForTrigger"], ORDER)).toEqual({ ok: true, outcome: "triggerSet" });
		expect(interpretOrderStatuses(["waitingForTrigger", "waitingForTrigger"], POSITION_TP_SL)).toEqual({
			ok: true,
			outcome: "triggerSet",
		});
	});

	it("reports a scale order with filled and resting legs as partly filled, with the exact split", () => {
		expect(interpretOrderStatuses([FILLED, RESTING, RESTING, FILLED, RESTING], SCALE)).toEqual({
			ok: true,
			outcome: "partiallyFilled",
			detail: "2 of 5 legs filled, 3 placed",
		});
	});

	it("reports one failure when every leg is rejected for the same reason", () => {
		const margin = { error: "Insufficient margin to place order. asset=5" };
		expect(interpretOrderStatuses([margin, margin], ENTRY_WITH_TP)).toEqual({
			ok: false,
			status: "failed",
			error: "Insufficient margin to place order. asset=5",
		});
	});

	it("names each rejected leg when the reasons differ", () => {
		expect(interpretOrderStatuses([{ error: "a" }, { error: "b" }], ENTRY_WITH_TP)).toEqual({
			ok: false,
			status: "failed",
			error: "Entry rejected: a. Take profit rejected: b",
		});
	});

	it("reports an entry that fills with a rejected take profit per leg", () => {
		expect(interpretOrderStatuses([FILLED, TP_REJECTED], ENTRY_WITH_TP)).toEqual({
			ok: false,
			status: "failed",
			error: "Entry filled. Take profit rejected: Invalid TP/SL price. asset=5",
		});
	});

	it("reports a position take profit that is set beside a rejected stop loss", () => {
		expect(interpretOrderStatuses(["waitingForTrigger", { error: "bad sl" }], POSITION_TP_SL)).toEqual({
			ok: false,
			status: "failed",
			error: "Take profit set. Stop loss rejected: bad sl",
		});
	});

	it("names the crossing leg of a testnet bulk order", () => {
		const statuses = [
			{ resting: { oid: 65243893187, cloid: "0xb2f5734cf9ba51d0c0b4264d7f550000" } },
			{ error: "Post only order would have immediately matched, bbo was 1924.2@1924.8. asset=4" },
			{ resting: { oid: 65243893189, cloid: "0xb2f5734cf9ba51d0c0b4264d7f550002" } },
		];
		const legs: PlanLeg[] = ["1154", "1949", "1153"].map((price) => ({ role: "scaleLeg", price }));
		expect(interpretOrderStatuses(statuses, legs)).toEqual({
			ok: false,
			status: "failed",
			error:
				"2 of 3 legs placed. Leg 2 at 1949 rejected: Post only order would have immediately matched, bbo was 1924.2@1924.8. asset=4",
		});
	});

	it("fails an empty response instead of reporting silent success", () => {
		expect(interpretOrderStatuses([], ORDER)).toEqual({ ok: false, status: "failed", error: NO_EXCHANGE_RESPONSE });
	});
});

describe("reportSettlement", () => {
	it("keeps an unconfirmed request retryable by its key", () => {
		expect(reportSettlement({ kind: "pending", request: request("order"), error: "Failed to fetch" })).toEqual({
			ok: false,
			status: "unsettled",
			error: "Not confirmed: Failed to fetch. Retry or cancel it.",
			requestKey: "testnet:0x0000000000000000000000000000000000000001:5#1794596065043",
		});
	});

	it("reports the statuses the exchange answered", () => {
		const response = { type: "order", data: { statuses: [FILLED] } };
		expect(reportSettlement({ kind: "answered", request: request("order"), response })).toEqual({
			ok: true,
			outcome: "filled",
		});
	});

	it("reports what a lookup found after a duplicate nonce, naming canceled and rejected legs apart", () => {
		const legs: PlanLeg[] = [
			{ role: "scaleLeg", price: "82" },
			{ role: "scaleLeg", price: "79" },
			{ role: "scaleLeg", price: "76" },
		];
		const settlement: Settlement = {
			kind: "consumed",
			request: request("order", legs),
			lookup: orderLookup(found("filled"), found("canceled"), found("badAloPxRejected")),
		};
		expect(reportSettlement(settlement)).toEqual({
			ok: false,
			status: "failed",
			error: "1 of 3 legs placed. Leg 2 at 79 canceled. Leg 3 at 76 rejected",
		});
	});

	it("calls a consumed order the exchange has not listed unknown, never failed", () => {
		const settlement: Settlement = { kind: "consumed", request: request("order"), lookup: orderLookup(UNKNOWN) };
		expect(reportSettlement(settlement)).toEqual({
			ok: false,
			status: "unknown",
			error: "Order not found on the exchange. It will not be sent again. Check open orders.",
		});
		expect(reportSettlement({ ...settlement, lookup: { kind: "order", statuses: null } })).toEqual({
			ok: false,
			status: "unknown",
			error: "Order sent. Its status could not be read. It will not be sent again. Check open orders.",
		});
	});

	it("says an expired order placed nothing, and upgrades it only when its cloid is found", () => {
		const settlement: Settlement = { kind: "expired", request: request("order"), lookup: orderLookup(UNKNOWN) };
		expect(reportSettlement(settlement)).toEqual({
			ok: false,
			status: "failed",
			error: "Not placed. The request expired before the exchange took it.",
		});
		expect(reportSettlement({ ...settlement, lookup: orderLookup(found("filled")) })).toEqual({
			ok: true,
			outcome: "filled",
		});
	});

	it("reports a TWAP started only from the exchange's own reply", () => {
		const running = { type: "twapOrder", data: { status: { running: { twapId: 7 } } } };
		const refused = { type: "twapOrder", data: { status: { error: "TWAP order value too small. Min is $100." } } };
		expect(reportSettlement({ kind: "answered", request: request("twap"), response: running })).toEqual({
			ok: true,
			outcome: "twapStarted",
		});
		expect(reportSettlement({ kind: "answered", request: request("twap"), response: refused })).toEqual({
			ok: false,
			status: "failed",
			error: "TWAP order value too small. Min is $100.",
		});
	});

	it("calls a TWAP whose reply was lost unknown, however many matching TWAPs history shows", () => {
		const consumed = (matches: TwapRecord[] | null): Settlement => ({
			kind: "consumed",
			request: request("twap"),
			lookup: { kind: "twap", matches },
		});
		expect(reportSettlement(consumed([twapRecord(7)]))).toEqual({
			ok: false,
			status: "unknown",
			error:
				"TWAP status unknown. A matching TWAP appeared in your history, but it can't be confirmed as this one. It will not be sent again. Check the TWAP tab.",
		});
		const plain = {
			ok: false,
			status: "unknown",
			error: "TWAP status unknown. It will not be sent again. Check the TWAP tab.",
		};
		expect(reportSettlement(consumed([]))).toEqual(plain);
		expect(reportSettlement(consumed([twapRecord(7), twapRecord(8)]))).toEqual(plain);
		expect(reportSettlement(consumed(null))).toEqual({
			ok: false,
			status: "unknown",
			error: "TWAP sent. Its status could not be read. It will not be sent again. Check the TWAP tab.",
		});
	});

	it("reports an expired TWAP as not started", () => {
		expect(reportSettlement({ kind: "expired", request: request("twap"), lookup: null })).toEqual({
			ok: false,
			status: "failed",
			error: "Not started. The request expired before the exchange took it.",
		});
	});

	it("reports a canceled request as placing nothing", () => {
		expect(reportSettlement({ kind: "canceled", request: request("order") })).toEqual({
			ok: false,
			status: "failed",
			error: "Canceled. Nothing was placed.",
		});
	});

	it("reports a dismissed request as unknown unless its cloid was found", () => {
		expect(reportSettlement({ kind: "dismissed", request: request("order"), lookup: orderLookup(UNKNOWN) })).toEqual({
			ok: false,
			status: "unknown",
			error: "Dismissed without confirmation. It may have executed. Check open orders.",
		});
		expect(
			reportSettlement({ kind: "dismissed", request: request("order"), lookup: orderLookup(found("open")) }),
		).toEqual({
			ok: true,
			outcome: "resting",
			detail: "Found by lookup after you dismissed it. The exchange never confirmed the request.",
		});
		const twap: Settlement = {
			kind: "dismissed",
			request: request("twap"),
			lookup: { kind: "twap", matches: [twapRecord(7)] },
		};
		expect(reportSettlement(twap)).toEqual({
			ok: false,
			status: "unknown",
			error: "Dismissed without confirmation. Check the TWAP tab.",
		});
	});
});

describe("reportSubmit", () => {
	it("gives a press blocked by an unconfirmed order its own not-sent result with no request key", () => {
		const earlier: Settlement = { kind: "pending", request: request("order"), error: "Failed to fetch" };
		expect(reportSubmit({ kind: "blocked", earlier })).toEqual({
			ok: false,
			status: "notSent",
			error: "Not sent. An earlier order on this market is not confirmed yet. Retry, cancel or dismiss it first.",
		});
	});

	it("says nothing was sent and the earlier order filled when the earlier one settles on this press", () => {
		const earlier: Settlement = {
			kind: "consumed",
			request: request("order"),
			lookup: orderLookup(found("filled")),
		};
		expect(reportSubmit({ kind: "blocked", earlier })).toEqual({
			ok: false,
			status: "notSent",
			error:
				"Not sent. An earlier order on this market was still unconfirmed: it filled. Press again to send a new order.",
		});
	});

	it("names an earlier order that settled on this press in one sentence per fact", () => {
		const earlier: Settlement = { kind: "expired", request: request("order"), lookup: orderLookup(UNKNOWN) };
		expect(reportSubmit({ kind: "blocked", earlier })).toEqual({
			ok: false,
			status: "notSent",
			error:
				"Not sent. An earlier order on this market was still unconfirmed: Not placed. The request expired before the exchange took it. Press again to send a new order.",
		});
	});

	it("names why a browser or a moved slot refused the press", () => {
		expect(reportSubmit({ kind: "refused", reason: "storage" })).toEqual({
			ok: false,
			status: "notSent",
			error: "Can't save order state in this browser. Enable site storage to trade.",
		});
		expect(reportSubmit({ kind: "refused", reason: "locks" })).toMatchObject({ status: "notSent" });
		expect(reportSubmit({ kind: "refused", reason: "slotMoved", to: "settled" })).toEqual({
			ok: false,
			status: "notSent",
			error: "Not sent. Another order on this market was just settled in another tab. Press again to send a new one.",
		});
		expect(reportSubmit({ kind: "refused", reason: "offerStale" })).toEqual({
			ok: false,
			status: "notSent",
			error:
				"Not sent. The last order on this market changed after these legs were offered. Press submit again to see what is left.",
		});
	});

	it("holds a resubmit after a partial and names the legs that went through", () => {
		const partial = {
			roles: ["scaleLeg", "scaleLeg"] as PlanLeg["role"][],
			buy: true,
			grouping: "na" as const,
			fates: ["placed", "rejected"] as ("placed" | "rejected")[],
			settledAt: 0,
		};
		expect(reportSubmit({ kind: "held", partial, offer: null })).toEqual({
			ok: false,
			status: "notSent",
			error:
				"Not sent. Your last order on this market partly went through: Leg 1 placed, Leg 2 rejected. Sending it again would place the same legs twice. Set the rejected take profit or stop loss on the position instead.",
		});
	});
});

describe("describeInspection", () => {
	it("says an unconfirmed order can still execute until its expiry", () => {
		const text = describeInspection({
			kind: "inspected",
			request: request("order"),
			lookup: orderLookup(UNKNOWN),
			canStillExecute: true,
		});
		expect(text).toMatch(/It can still execute until .+\. Dismiss it\?/);
		const expired = describeInspection({
			kind: "inspected",
			request: request("order"),
			lookup: { kind: "order", statuses: null },
			canStillExecute: false,
		});
		expect(expired).toBe(
			"The exchange never confirmed this request. Its status could not be read. Dismiss it? Your next order on this market will be sent as a new one.",
		);
	});
});
