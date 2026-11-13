import type { ClearinghouseStateResponse, L2BookResponse } from "@nktkas/hyperliquid";
import { describe, expect, it } from "vitest";
import {
	bookTooThin,
	expectPosition,
	expectStatuses,
	harnessOrders,
	isHarnessCloid,
	newCloid,
	positionSize,
	sizeForNotional,
	validateOrder,
} from "./assert";

function stateWith(positions: { coin: string; szi: string }[]): ClearinghouseStateResponse {
	return {
		assetPositions: positions.map((position) => ({ type: "oneWay", position })),
	} as unknown as ClearinghouseStateResponse;
}

function book(bid: string | null, ask: string | null): L2BookResponse {
	const level = (px: string) => [{ px, sz: "1", n: 1 }];
	return { coin: "DOGE", time: 0, levels: [bid ? level(bid) : [], ask ? level(ask) : []] } as L2BookResponse;
}

describe("cloids", () => {
	it("tags every harness cloid with the prefix and 16 bytes", () => {
		const cloid = newCloid();
		expect(cloid).toMatch(/^0x[0-9a-f]{32}$/);
		expect(isHarnessCloid(cloid)).toBe(true);
	});

	it("leaves other cloids and untagged orders alone", () => {
		expect(isHarnessCloid(`0x${"ab".repeat(16)}`)).toBe(false);
		expect(isHarnessCloid(null)).toBe(false);
		const orders = [
			{ coin: "DOGE", cloid: newCloid() },
			{ coin: "DOGE", cloid: null },
			{ coin: "BTC", cloid: newCloid() },
		];
		expect(harnessOrders(orders as never, "DOGE")).toHaveLength(1);
		expect(harnessOrders(orders as never)).toHaveLength(2);
	});
});

describe("expectStatuses", () => {
	it("passes when every leg has the expected kind", () => {
		expect(() =>
			expectStatuses([{ filled: { totalSz: "1", avgPx: "1", oid: 1 } }, "waitingForTrigger"], ["filled", "waitingForTrigger"]),
		).not.toThrow();
	});

	it("names the actual statuses when a leg differs", () => {
		expect(() => expectStatuses([{ resting: { oid: 1 } }], ["filled"])).toThrow(/expected statuses \[filled\], got .*resting/);
	});

	it("counts a missing leg as a mismatch", () => {
		expect(() => expectStatuses([{ resting: { oid: 1 } }], ["resting", "resting"])).toThrow();
	});
});

describe("positions", () => {
	it("reads a coin's signed size and 0 when flat", () => {
		const state = stateWith([{ coin: "DOGE", szi: "-200.0" }]);
		expect(positionSize(state, "DOGE")).toBe("-200.0");
		expect(positionSize(state, "BTC")).toBe("0");
	});

	it("compares sizes numerically", () => {
		const state = stateWith([{ coin: "DOGE", szi: "200.0" }]);
		expect(() => expectPosition(state, "DOGE", "200")).not.toThrow();
		expect(() => expectPosition(state, "DOGE", 0)).toThrow("expected DOGE position 0, got 200.0");
	});
});

describe("bookTooThin", () => {
	it("is thin when the best ask is above a buy limit", () => {
		expect(bookTooThin(book("90", "110"), true, "105")).toBe(true);
		expect(bookTooThin(book("90", "110"), true, "110")).toBe(false);
	});

	it("is thin when the best bid is below a sell limit", () => {
		expect(bookTooThin(book("90", "110"), false, "95")).toBe(true);
		expect(bookTooThin(book("90", "110"), false, "90")).toBe(false);
	});

	it("is thin when the side is empty", () => {
		expect(bookTooThin(book("90", null), true, "1000")).toBe(true);
	});
});

describe("sizeForNotional", () => {
	it("rounds a whole-lot size up to a multiple of 10", () => {
		expect(sizeForNotional("0.06525", 0, 12)).toBe("190");
	});

	it("rounds a fractional size up to the lot", () => {
		expect(sizeForNotional("378.38", 3, 12)).toBe("0.032");
	});
});

describe("validateOrder", () => {
	const order = { a: 1, b: true, p: "0.065", s: "200", r: false, t: { limit: { tif: "Gtc" as const } } };

	it("accepts an order on the wire grid", () => {
		expect(validateOrder(order, "perp", 0, "0.065")).toEqual([]);
	});

	it("flags a size the formatter would change, such as 100 sent as 1", () => {
		expect(validateOrder({ ...order, s: "1.5" }, "perp", 0, "0.065")[0]).toMatch(/^size 1.5 is not on the wire grid/);
	});

	it("flags a price past the market's decimal cap", () => {
		expect(validateOrder({ ...order, p: "0.092424" }, "perp", 2, "0.09")[0]).toMatch(/^price 0.092424/);
	});

	it("flags an opening order below the minimum notional but not a reduce-only one", () => {
		expect(validateOrder({ ...order, s: "100" }, "perp", 0, "0.065")).toEqual(["notional below 10"]);
		expect(validateOrder({ ...order, s: "100", r: true }, "perp", 0, "0.065")).toEqual([]);
	});

	it("checks a trigger price", () => {
		const trigger = { ...order, t: { trigger: { isMarket: true, triggerPx: "0.0712345", tpsl: "tp" as const } } };
		expect(validateOrder(trigger, "perp", 0, "0.065")[0]).toMatch(/^trigger 0.0712345/);
	});
});
