import { describe, expect, it } from "vitest";
import { getDexFromName, getMarketKindFromName } from "@/lib/hyperliquid/markets/helper";

describe("getMarketKindFromName (canonical coin-string taxonomy)", () => {
	it("classifies a plain coin as perp", () => {
		expect(getMarketKindFromName("BTC")).toBe("perp");
		expect(getMarketKindFromName("HYPE")).toBe("perp");
	});

	it("classifies an @-prefixed pair id as spot", () => {
		expect(getMarketKindFromName("@0")).toBe("spot");
		expect(getMarketKindFromName("@107")).toBe("spot");
	});

	it("classifies a dex:coin name as builderPerp", () => {
		expect(getMarketKindFromName("xyz:SILVER")).toBe("builderPerp");
		expect(getMarketKindFromName("test:ABC")).toBe("builderPerp");
	});

	it("treats a display pair name (BTC/USDC) as builderPerp only via ':' — a '/' pair is perp", () => {
		expect(getMarketKindFromName("PURR/USDC")).toBe("perp");
	});

	it("does not (yet) model the '#'-prefixed outcome syntax — classifies it as perp", () => {
		expect(getMarketKindFromName("#10")).toBe("perp");
	});
});

describe("getDexFromName (canonical dex extraction)", () => {
	it("extracts the dex prefix from a builder name", () => {
		expect(getDexFromName("xyz:SILVER")).toBe("xyz");
		expect(getDexFromName("test:ABC")).toBe("test");
	});

	it("returns undefined for perp and spot names", () => {
		expect(getDexFromName("BTC")).toBeUndefined();
		expect(getDexFromName("@107")).toBeUndefined();
	});

	it("returns undefined for a malformed leading-colon name", () => {
		expect(getDexFromName(":BTC")).toBeUndefined();
	});
});
