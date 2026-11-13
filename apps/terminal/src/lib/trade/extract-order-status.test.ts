import { ApiRequestError, HttpRequestError } from "@nktkas/hyperliquid";
import { describe, expect, it } from "vitest";
import type { PlanLeg } from "@/domain/trade/order-intent";
import { interpretOrderStatuses, NO_EXCHANGE_RESPONSE, readThrownStatuses } from "@/lib/trade/extract-order-status";

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

const POST_ONLY_REJECTION = {
	status: "ok",
	response: {
		type: "order",
		data: {
			statuses: [{ error: "Post only order would have immediately matched, bbo was 1922.9@1923.7. asset=4" }],
		},
	},
};

describe("interpretOrderStatuses", () => {
	it("reports success when every leg is placed", () => {
		expect(interpretOrderStatuses([FILLED, "waitingForTrigger"], ENTRY_WITH_TP)).toEqual({
			result: { ok: true, outcome: "filled" },
			settled: true,
		});
		expect(interpretOrderStatuses([RESTING, "waitingForFill"], ENTRY_WITH_TP).result).toEqual({
			ok: true,
			outcome: "resting",
		});
		expect(interpretOrderStatuses(["waitingForTrigger"], ORDER).result).toEqual({ ok: true, outcome: "triggerSet" });
	});

	it("reports one failure when every leg is rejected for the same reason", () => {
		const margin = { error: "Insufficient margin to place order. asset=5" };
		expect(interpretOrderStatuses([margin, margin], ENTRY_WITH_TP)).toEqual({
			result: { ok: false, error: "Insufficient margin to place order. asset=5" },
			settled: true,
		});
		expect(interpretOrderStatuses([margin], ORDER).result).toEqual({
			ok: false,
			error: "Insufficient margin to place order. asset=5",
		});
	});

	it("names each rejected leg when the reasons differ", () => {
		expect(interpretOrderStatuses([{ error: "a" }, { error: "b" }], ENTRY_WITH_TP).result).toEqual({
			ok: false,
			error: "Entry rejected: a. Take profit rejected: b",
		});
	});

	it("reports an entry that fills with a rejected take profit per leg", () => {
		expect(interpretOrderStatuses([FILLED, TP_REJECTED], ENTRY_WITH_TP)).toEqual({
			result: { ok: false, error: "Entry filled. Take profit rejected: Invalid TP/SL price. asset=5" },
			settled: false,
		});
	});

	it("reports a resting entry with a rejected take profit per leg", () => {
		expect(interpretOrderStatuses([RESTING, TP_REJECTED], ENTRY_WITH_TP).result).toEqual({
			ok: false,
			error: "Entry placed. Take profit rejected: Invalid TP/SL price. asset=5",
		});
	});

	it("reports a position take profit that is set beside a rejected stop loss", () => {
		expect(interpretOrderStatuses(["waitingForTrigger", { error: "bad sl" }], POSITION_TP_SL).result).toEqual({
			ok: false,
			error: "Take profit set. Stop loss rejected: bad sl",
		});
	});

	it("names the one scale leg the exchange rejected", () => {
		const statuses = [RESTING, RESTING, { error: "Post only order would have immediately matched" }, RESTING, RESTING];
		expect(interpretOrderStatuses(statuses, SCALE).result).toEqual({
			ok: false,
			error: "4 of 5 legs placed. Leg 3 at 79 rejected: Post only order would have immediately matched",
		});
	});

	it("fails an empty response instead of reporting silent success", () => {
		expect(interpretOrderStatuses([], ORDER)).toEqual({
			result: { ok: false, error: NO_EXCHANGE_RESPONSE },
			settled: false,
		});
	});
});

describe("readThrownStatuses", () => {
	it("reads the per-leg statuses the SDK throws when one bulk leg errors", () => {
		const thrown = new ApiRequestError(POST_ONLY_REJECTION, "order 0: Post only order would have immediately matched");
		expect(readThrownStatuses(thrown)).toEqual(POST_ONLY_REJECTION.response.data.statuses);
	});

	it("reads a thrown fill beside a rejected take profit as a partial result", () => {
		const response = { status: "ok", response: { type: "order", data: { statuses: [FILLED, TP_REJECTED] } } };
		const statuses = readThrownStatuses(new ApiRequestError(response, "order 1: Invalid TP/SL price. asset=5"));
		expect(interpretOrderStatuses(statuses ?? [], ENTRY_WITH_TP).result).toEqual({
			ok: false,
			error: "Entry filled. Take profit rejected: Invalid TP/SL price. asset=5",
		});
	});

	it("names the crossing leg of a testnet bulk order the SDK threw on", () => {
		const response = {
			status: "ok",
			response: {
				type: "order",
				data: {
					statuses: [
						{ resting: { oid: 65243893187, cloid: "0xb2f5734cf9ba51d0c0b4264d7f550000" } },
						{ error: "Post only order would have immediately matched, bbo was 1924.2@1924.8. asset=4" },
						{ resting: { oid: 65243893189, cloid: "0xb2f5734cf9ba51d0c0b4264d7f550002" } },
					],
				},
			},
		};
		const thrown = new ApiRequestError(response, "order 1: Post only order would have immediately matched");
		const legs: PlanLeg[] = ["1154", "1949", "1153"].map((price) => ({ role: "scaleLeg", price }));
		expect(interpretOrderStatuses(readThrownStatuses(thrown) ?? [], legs)).toEqual({
			result: {
				ok: false,
				error:
					"2 of 3 legs placed. Leg 2 at 1949 rejected: Post only order would have immediately matched, bbo was 1924.2@1924.8. asset=4",
			},
			settled: false,
		});
	});

	it("finds no statuses in a whole-request rejection or a transport failure", () => {
		const rejected = { status: "err", response: "User or API Wallet 0x1 does not exist." };
		expect(readThrownStatuses(new ApiRequestError(rejected, rejected.response))).toBeNull();
		expect(readThrownStatuses(new HttpRequestError({ detail: "Request timed out after 10000 ms" }))).toBeNull();
	});
});
