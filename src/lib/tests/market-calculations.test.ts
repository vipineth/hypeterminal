import { describe, expect, it } from "vitest";
import { get24hChange, getOiUsd } from "@/domain/market";

describe("market calculations", () => {
	it("returns 24h change in percentage points", () => {
		expect(get24hChange(100, 110)).toBeCloseTo(10);
		expect(get24hChange("100", "90")).toBeCloseTo(-10);
	});

	it("converts back to decimal ratio by dividing by 100", () => {
		const changePct = get24hChange("100", "110");
		expect(changePct !== null ? changePct / 100 : null).toBeCloseTo(0.1);
	});

	it("handles zero edge cases safely", () => {
		expect(get24hChange(0, 100)).toBeNull();
		expect(get24hChange("0", "100")).toBeNull();
		expect(get24hChange(100, 0)).toBeCloseTo(-100);
	});

	it("calculates open interest USD", () => {
		expect(getOiUsd(2, 100)).toBeCloseTo(200);
		expect(getOiUsd("2.5", "100")).toBeCloseTo(250);
		expect(getOiUsd(null, 100)).toBeNull();
	});
});
