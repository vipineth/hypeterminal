import { describe, expect, it } from "vitest";
import { getMarketFeeRates } from "@/domain/market/fees";
import type { Market } from "@/domain/market/model";

const TIER_ZERO = { takerRate: 0.00045, makerRate: 0.00015 };

function builderPerp(deployerFeeScale: number | null, growthMode: boolean) {
	return { kind: "builderPerp", deployerFeeScale, growthMode } as Market;
}

describe("fee rates a market charges", () => {
	it("keeps the user's rates on a validator perp", () => {
		expect(getMarketFeeRates(TIER_ZERO, { kind: "perp" } as Market)).toEqual(TIER_ZERO);
	});

	it("doubles a tier-0 taker on a builder dex with deployer fee scale 1", () => {
		expect(getMarketFeeRates(TIER_ZERO, builderPerp(1, false)).takerRate).toBeCloseTo(0.0009, 12);
	});

	it("matches the 0.009% testnet charged on xyz:TSLA, growth mode at scale 1", () => {
		expect(getMarketFeeRates(TIER_ZERO, builderPerp(1, true)).takerRate).toBeCloseTo(0.00009, 12);
	});

	it("adds the scale below 1 instead of doubling it", () => {
		expect(getMarketFeeRates(TIER_ZERO, builderPerp(0.5, false)).takerRate).toBeCloseTo(0.000675, 12);
	});

	it("charges the 300% worst case when a builder asset names no scale", () => {
		expect(getMarketFeeRates(TIER_ZERO, builderPerp(null, false)).takerRate).toBeCloseTo(0.0027, 12);
	});

	it("scales a maker rebate by growth mode only", () => {
		const rates = getMarketFeeRates({ takerRate: 0.00045, makerRate: -0.00002 }, builderPerp(1, true));
		expect(rates.makerRate).toBeCloseTo(-0.000002, 12);
	});
});
