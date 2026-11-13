import { describe, expect, it } from "vitest";
import { ORDER_PLAN_ERRORS } from "@/domain/trade/orders";
import { buildTwapPlan } from "@/domain/trade/twap";

const TWAP_BASE = {
	assetId: 173,
	side: "buy" as const,
	sizeValue: 100,
	szDecimals: 0,
	reduceOnly: false,
	minutes: 30,
	randomize: false,
};

describe("buildTwapPlan", () => {
	it("builds a twapOrder action with the full size, side, minutes and flags", () => {
		expect(buildTwapPlan(TWAP_BASE)).toEqual({
			action: { twap: { a: 173, b: true, s: "100", r: false, m: 30, t: false } },
			errors: [],
		});
	});

	it("carries sell side, reduce-only and randomize through", () => {
		const plan = buildTwapPlan({ ...TWAP_BASE, side: "sell", sizeValue: 250, reduceOnly: true, randomize: true });
		expect(plan.action).toEqual({ twap: { a: 173, b: false, s: "250", r: true, m: 30, t: true } });
	});

	it("clamps minutes to the exchange range", () => {
		expect(buildTwapPlan({ ...TWAP_BASE, minutes: 2 }).action?.twap.m).toBe(5);
		expect(buildTwapPlan({ ...TWAP_BASE, minutes: 5000 }).action?.twap.m).toBe(1440);
	});

	it("refuses a size that truncates to zero lots", () => {
		expect(buildTwapPlan({ ...TWAP_BASE, sizeValue: 0.4 })).toEqual({
			action: null,
			errors: [ORDER_PLAN_ERRORS.invalidSize],
		});
	});
});
