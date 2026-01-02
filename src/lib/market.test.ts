import { describe, expect, it } from "vitest";
import type { PerpAssetCtx } from "@/types/hyperliquid";
import { calculate24hPriceChange, calculateOpenInterestUSD } from "./market";

describe("market", () => {
	it("calculates 24h price change from mark and prev day", () => {
		const ctx = { markPx: "100", prevDayPx: "80" } as unknown as PerpAssetCtx;
		expect(calculate24hPriceChange(ctx)).toBeCloseTo(25);
	});

	it("returns null when 24h change cannot be computed", () => {
		const ctx = { markPx: "100", prevDayPx: "0" } as unknown as PerpAssetCtx;
		expect(calculate24hPriceChange(ctx)).toBeNull();
		expect(calculate24hPriceChange(undefined)).toBeNull();
	});

	it("calculates open interest in USD", () => {
		const ctx = { openInterest: "2", markPx: "100" } as unknown as PerpAssetCtx;
		expect(calculateOpenInterestUSD(ctx)).toBe(200);
	});
});
