import type { ClearinghouseStateResponse, L2BookResponse } from "@nktkas/hyperliquid";
import { describe, expect, it } from "vitest";
import {
	depthWithinSlippage,
	expectPosition,
	expectStatuses,
	positionSize,
	priceStep,
	priceWithin,
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

describe("expectStatuses", () => {
	it("passes when every leg has the expected kind", () => {
		expect(() =>
			expectStatuses([{ filled: { totalSz: "1", avgPx: "1", oid: 1 } }, "waitingForTrigger"], ["filled", "waitingForTrigger"]),
		).not.toThrow();
	});

	it("names the actual statuses when a leg differs", () => {
		expect(() => expectStatuses([{ resting: { oid: 1 } }], ["filled"])).toThrow(/expected statuses \[filled\], got .*resting/);
	});

	it("fails on an error leg through the app's own status reading", () => {
		expect(() => expectStatuses([{ resting: { oid: 1 } }, { error: "Insufficient margin" }] as never, ["resting", "error"])).toThrow(
			/the app reads the response as a failure: Insufficient margin/,
		);
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

describe("depthWithinSlippage", () => {
	it("counts only asks a buy can reach within mark plus slippage", () => {
		expect(depthWithinSlippage(book("90", "102"), true, "100", 250).toFixed()).toBe("1");
		expect(depthWithinSlippage(book("90", "103"), true, "100", 250).toFixed()).toBe("0");
	});

	it("counts only bids a sell can reach within mark minus slippage", () => {
		expect(depthWithinSlippage(book("98", "110"), false, "100", 250).toFixed()).toBe("1");
		expect(depthWithinSlippage(book("97", "110"), false, "100", 250).toFixed()).toBe("0");
	});

	it("is zero when the side is empty", () => {
		expect(depthWithinSlippage(book("90", null), true, "100", 250).toFixed()).toBe("0");
	});
});

describe("sizeForNotional", () => {
	it("rounds a whole-lot size up to a multiple of 10 when asked, so a dropped zero changes the size", () => {
		expect(sizeForNotional("0.06525", 0, 12, true)).toBe("190");
		expect(sizeForNotional("4.53", 0, 15)).toBe("4");
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

describe("priceStep", () => {
	it("is the five significant figure step when it is coarser than the decimal cap", () => {
		expect(priceStep("0.065611", 0, "perp").toFixed()).toBe("0.000001");
		expect(priceStep("95000", 5, "perp").toFixed()).toBe("1");
		expect(priceStep("3456.7", 2, "perp").toFixed()).toBe("0.1");
	});

	it("is the decimal cap when that is coarser", () => {
		expect(priceStep("0.0000123", 0, "perp").toFixed()).toBe("0.000001");
		expect(priceStep("1.2345", 4, "spot").toFixed()).toBe("0.0001");
	});
});

describe("priceWithin", () => {
	it("allows one step plus the slack and no more", () => {
		const step = priceStep("100", 2, "perp");
		expect(priceWithin("100.01", "100", step)).toBe(true);
		expect(priceWithin("100.02", "100", step)).toBe(false);
		expect(priceWithin("100.1", "100", step, 10)).toBe(true);
		expect(priceWithin("100.12", "100", step, 10)).toBe(false);
	});
});
