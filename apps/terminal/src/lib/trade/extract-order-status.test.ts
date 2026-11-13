import type { OrderStatusResponse } from "@nktkas/hyperliquid";
import { describe, expect, it } from "vitest";
import type { PlanLeg } from "@/domain/trade/order-intent";
import {
	interpretOrderStatuses,
	NO_EXCHANGE_RESPONSE,
	reportSettlement,
	reportSubmit,
} from "@/lib/trade/extract-order-status";
import type { Lookup, Settlement, TwapRecord } from "@/lib/trade/order-sender";
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
		label: { market: "SOL", side: "buy", size: "1" },
		createdAt: 0,
	};
}

function found(status: string, isTrigger = false): OrderStatusResponse {
	return { status: "order", order: { status, statusTimestamp: 0, order: { isTrigger } } } as OrderStatusResponse;
}

const UNKNOWN: OrderStatusResponse = { status: "unknownOid" };

function orderLookup(...statuses: OrderStatusResponse[]): Lookup {
	return { kind: "order", statuses };
}

function twapMatch(status: TwapRecord["status"]): Lookup {
	return { kind: "twap", match: { time: 0, status, twapId: 7, state: {} as TwapRecord["state"] }, readable: true };
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
			error: "Insufficient margin to place order. asset=5",
		});
	});

	it("names each rejected leg when the reasons differ", () => {
		expect(interpretOrderStatuses([{ error: "a" }, { error: "b" }], ENTRY_WITH_TP)).toEqual({
			ok: false,
			error: "Entry rejected: a. Take profit rejected: b",
		});
	});

	it("reports an entry that fills with a rejected take profit per leg", () => {
		expect(interpretOrderStatuses([FILLED, TP_REJECTED], ENTRY_WITH_TP)).toEqual({
			ok: false,
			error: "Entry filled. Take profit rejected: Invalid TP/SL price. asset=5",
		});
	});

	it("reports a position take profit that is set beside a rejected stop loss", () => {
		expect(interpretOrderStatuses(["waitingForTrigger", { error: "bad sl" }], POSITION_TP_SL)).toEqual({
			ok: false,
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
			error:
				"2 of 3 legs placed. Leg 2 at 1949 rejected: Post only order would have immediately matched, bbo was 1924.2@1924.8. asset=4",
		});
	});

	it("fails an empty response instead of reporting silent success", () => {
		expect(interpretOrderStatuses([], ORDER)).toEqual({ ok: false, error: NO_EXCHANGE_RESPONSE });
	});
});

describe("reportSettlement", () => {
	it("keeps an unconfirmed request retryable by its key", () => {
		expect(reportSettlement({ kind: "pending", request: request("order"), error: "Failed to fetch" })).toEqual({
			ok: false,
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
			rejection: null,
		};
		expect(reportSettlement(settlement)).toEqual({
			ok: false,
			error: "1 of 3 legs placed. Leg 2 at 79 canceled. Leg 3 at 76 rejected",
		});
	});

	it("says a consumed order the exchange has not listed will not be sent again", () => {
		const settlement: Settlement = {
			kind: "consumed",
			request: request("order"),
			lookup: orderLookup(UNKNOWN),
			rejection: null,
		};
		expect(reportSettlement(settlement)).toEqual({
			ok: false,
			error: "Order not found on the exchange. It will not be sent again. Check open orders.",
		});
	});

	it("says an expired order placed nothing once its lookup confirms it", () => {
		const settlement: Settlement = {
			kind: "expired",
			request: request("order"),
			lookup: orderLookup(UNKNOWN),
			rejection: null,
		};
		expect(reportSettlement(settlement)).toEqual({
			ok: false,
			error: "Not placed. The request expired before the exchange took it.",
		});
	});

	it("reports the exchange's reason when a rejection consumed the nonce and nothing was found", () => {
		const settlement: Settlement = {
			kind: "consumed",
			request: request("order"),
			lookup: orderLookup(UNKNOWN),
			rejection: "Asset 899999 is out of range.",
		};
		expect(reportSettlement(settlement)).toEqual({ ok: false, error: "Asset 899999 is out of range." });
	});

	it("tells the user why a request lapsed when every send was refused", () => {
		const reason = "User or API Wallet 0x6117f1250ff313fa510bf05b8b2e359411c431d7 does not exist.";
		const settlement: Settlement = {
			kind: "lapsed",
			request: request("order"),
			lookup: orderLookup(UNKNOWN),
			rejection: reason,
		};
		expect(reportSettlement(settlement)).toEqual({ ok: false, error: `Not sent: ${reason}` });
	});

	it("reports a TWAP found after an expired or lapsed request as started, never as not started", () => {
		const settlement: Settlement = {
			kind: "lapsed",
			request: request("twap"),
			lookup: twapMatch({ status: "activated" }),
			rejection: "User or API Wallet 0x1 does not exist.",
		};
		expect(reportSettlement(settlement)).toEqual({ ok: true, outcome: "twapStarted" });
		expect(reportSettlement({ ...settlement, kind: "expired", rejection: null })).toEqual({
			ok: true,
			outcome: "twapStarted",
		});
	});

	it("reports a found TWAP's error instead of calling it running", () => {
		const settlement: Settlement = {
			kind: "consumed",
			request: request("twap"),
			lookup: twapMatch({ status: "error", description: "Insufficient margin" }),
			rejection: null,
		};
		expect(reportSettlement(settlement)).toEqual({ ok: false, error: "TWAP failed: Insufficient margin" });
		expect(reportSettlement({ ...settlement, lookup: twapMatch({ status: "activated" }) } as Settlement)).toEqual({
			ok: true,
			outcome: "twapStarted",
		});
	});

	it("reports a canceled request as placing nothing", () => {
		expect(reportSettlement({ kind: "canceled", request: request("order") })).toEqual({
			ok: false,
			error: "Canceled. Nothing was placed.",
		});
	});
});

describe("reportSubmit", () => {
	it("refuses a new order while an earlier one on the market is still unconfirmed", () => {
		const earlier: Settlement = { kind: "pending", request: request("order"), error: "Failed to fetch" };
		expect(reportSubmit({ kind: "blocked", earlier })).toEqual({
			ok: false,
			error: "Not sent. An earlier order on this market is not confirmed yet. Retry or cancel it first.",
			requestKey: "testnet:0x0000000000000000000000000000000000000001:5#1794596065043",
		});
	});

	it("says nothing was sent and the earlier order filled when the earlier one settles on this press", () => {
		const earlier: Settlement = {
			kind: "consumed",
			request: request("order"),
			lookup: orderLookup(found("filled")),
			rejection: null,
		};
		expect(reportSubmit({ kind: "blocked", earlier })).toEqual({
			ok: false,
			error:
				"Not sent. An earlier order on this market was still unconfirmed: it filled. Press again to send a new order.",
		});
	});
});
