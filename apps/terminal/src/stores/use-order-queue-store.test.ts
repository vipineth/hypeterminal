import { describe, expect, it } from "vitest";
import { interpretOrderStatuses } from "@/lib/trade/extract-order-status";
import { type OrderQueueItem, resultToQueueUpdate, upsertRequestRow } from "@/stores/use-order-queue-store";

const KEY = "testnet:0x0000000000000000000000000000000000000001:5#1794596065043";
const LABEL = { market: "SOL", side: "buy" as const, size: "1" };
const UNSETTLED = {
	status: "unsettled" as const,
	error: "Not confirmed: Failed to fetch. Retry, cancel or dismiss it.",
	requestKey: KEY,
	canDismiss: true,
};

describe("upsertRequestRow", () => {
	it("adds a row for a request no row shows yet, so its Retry, Cancel and Dismiss appear", () => {
		expect(upsertRequestRow([], KEY, LABEL, UNSETTLED)).toEqual([expect.objectContaining({ ...LABEL, ...UNSETTLED })]);
	});

	it("updates the row that already shows the request instead of adding another", () => {
		const shown: OrderQueueItem = {
			id: "order-1",
			...LABEL,
			price: "90",
			status: "pending",
			requestKey: KEY,
			createdAt: 0,
		};
		expect(upsertRequestRow([shown], KEY, LABEL, UNSETTLED)).toEqual([
			{ ...shown, ...UNSETTLED, completedAt: undefined },
		]);
	});
});

describe("resultToQueueUpdate price", () => {
	const ORDER = [{ role: "order" as const, price: "59.993" }];

	it("shows the average fill price, not the slippage limit, on a filled market order", () => {
		const filled = { filled: { totalSz: "1", avgPx: "58.58", oid: 1 } };
		expect(resultToQueueUpdate(interpretOrderStatuses([filled], ORDER))).toMatchObject({
			status: "success",
			outcome: "filled",
			price: "58.58",
		});
	});

	it("keeps the limit price on a resting order", () => {
		const update = resultToQueueUpdate(interpretOrderStatuses([{ resting: { oid: 1 } }], ORDER));
		expect(update).toMatchObject({ status: "success", outcome: "resting" });
		expect(update).not.toHaveProperty("price");
	});

	it("leaves the price alone on a fill whose average price the exchange did not report", () => {
		expect(resultToQueueUpdate({ ok: true, outcome: "filled" })).not.toHaveProperty("price");
	});

	it("shows no single fill price on a scale order with several filled legs", () => {
		const legs = [
			{ role: "scaleLeg" as const, price: "90" },
			{ role: "scaleLeg" as const, price: "95" },
		];
		const fill = (avgPx: string) => ({ filled: { totalSz: "1", avgPx, oid: 1 } });
		expect(resultToQueueUpdate(interpretOrderStatuses([fill("90"), fill("95")], legs))).not.toHaveProperty("price");
	});
});
