import { describe, expect, it } from "vitest";
import { buildOrderBookRows } from "./orderbook";

describe("orderbook", () => {
	it("sorts bids descending and accumulates totals", () => {
		const rows = buildOrderBookRows(
			[
				{ px: "100", sz: "2" },
				{ px: "101", sz: "1" },
			],
			"bid",
		);

		expect(rows).toHaveLength(2);
		expect(rows[0]).toEqual({ price: 101, size: 1, total: 1 });
		expect(rows[1]).toEqual({ price: 100, size: 2, total: 3 });
	});

	it("sorts asks ascending and accumulates totals", () => {
		const rows = buildOrderBookRows(
			[
				{ px: "101", sz: "1" },
				{ px: "100", sz: "2" },
			],
			"ask",
		);

		expect(rows).toHaveLength(2);
		expect(rows[0]).toEqual({ price: 100, size: 2, total: 2 });
		expect(rows[1]).toEqual({ price: 101, size: 1, total: 3 });
	});
});
