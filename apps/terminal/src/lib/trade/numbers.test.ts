import { describe, expect, it } from "vitest";
import { clampInt, floorToDecimals, toNumber, toNumberOrZero, truncateDecimals } from "@/lib/trade/numbers";

describe("trade numbers", () => {
	it("parses numbers from strings and returns null for invalid input", () => {
		expect(toNumber(1.5)).toBe(1.5);
		expect(toNumber("2.5")).toBe(2.5);
		expect(toNumber("nope")).toBeNull();
		expect(toNumber(null)).toBeNull();
		expect(toNumber(Number.POSITIVE_INFINITY)).toBeNull();
		expect(toNumber(Number.NaN)).toBeNull();
		expect(toNumber("  ")).toBeNull();
	});

	it("parses numbers with zero fallback", () => {
		expect(toNumberOrZero("2.5")).toBe(2.5);
		expect(toNumberOrZero("nope")).toBe(0);
		expect(toNumberOrZero(null)).toBe(0);
		expect(toNumberOrZero(undefined)).toBe(0);
	});

	it("clamps integers to bounds", () => {
		expect(clampInt(3.6, 1, 5)).toBe(4);
		expect(clampInt(-10, 1, 5)).toBe(1);
		expect(clampInt(10, 1, 5)).toBe(5);
	});

	it("floors decimals correctly", () => {
		expect(floorToDecimals(1.239, 2)).toBe(1.23);
		expect(truncateDecimals(1.239, 2)).toBe("1.23");
	});

	it("truncates to size decimals without dropping integer zeros", () => {
		expect(truncateDecimals(100, 0)).toBe("100");
		expect(truncateDecimals(250.9, 0)).toBe("250");
		expect(truncateDecimals(-100, 0)).toBe("-100");
		expect(truncateDecimals(1.2, 3)).toBe("1.2");
		expect(truncateDecimals(0.4, 0)).toBe("0");
	});
});
