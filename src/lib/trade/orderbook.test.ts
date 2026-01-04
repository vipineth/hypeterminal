import { describe, expect, it } from "vitest";
import { buildOrderBookRows } from "./orderbook";

describe("orderbook", () => {
	it("builds rows and accumulates totals (API returns pre-sorted)", () => {
		const rows = buildOrderBookRows([
			{ px: "101", sz: "1" },
			{ px: "100", sz: "2" },
		]);

		expect(rows).toHaveLength(2);
		expect(rows[0]).toEqual({ price: 101, priceRaw: "101", size: 1, total: 1 });
		expect(rows[1]).toEqual({ price: 100, priceRaw: "100", size: 2, total: 3 });
	});

	it("preserves price string precision", () => {
		const rows = buildOrderBookRows([{ px: "2.0001", sz: "1.5" }]);

		expect(rows).toHaveLength(1);
		expect(rows[0].priceRaw).toBe("2.0001");
		expect(rows[0].price).toBe(2.0001);
	});

	it("returns empty array for undefined/empty input", () => {
		expect(buildOrderBookRows(undefined)).toEqual([]);
		expect(buildOrderBookRows([])).toEqual([]);
	});
});
