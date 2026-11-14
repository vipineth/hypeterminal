import { describe, expect, it } from "vitest";
import { type OrderQueueItem, upsertRequestRow } from "@/stores/use-order-queue-store";

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
