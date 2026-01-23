import { describe, expect, it } from "vitest";
import { calculate24hPriceChange, calculateOpenInterestUSD } from "@/lib/market";

describe("market", () => {
	it("calculates 24h price change from mark and prev day", () => {
		expect(calculate24hPriceChange("80", "100")).toBeCloseTo(25);
	});

	it("returns null when 24h change cannot be computed", () => {
		expect(calculate24hPriceChange("0", "100")).toBeNull();
		expect(calculate24hPriceChange(undefined, undefined)).toBeNull();
	});

	it("calculates open interest in USD", () => {
		expect(calculateOpenInterestUSD("2", "100")).toBe(200);
	});
});
