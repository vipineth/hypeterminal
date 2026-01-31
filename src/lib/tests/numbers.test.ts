import { describe, expect, it } from "vitest";
import {
	clampInt,
	floorToDecimals,
	formatDecimalFloor,
	parseNumber,
	parseNumberOrZero,
	toFiniteNumber,
} from "@/lib/trade/numbers";

describe("trade numbers", () => {
	it("parses numbers from strings and returns NaN for invalid input", () => {
		expect(parseNumber(1.5)).toBe(1.5);
		expect(parseNumber("2.5")).toBe(2.5);
		expect(Number.isNaN(parseNumber("nope"))).toBe(true);
		expect(Number.isNaN(parseNumber(null))).toBe(true);
		expect(Number.isNaN(parseNumber(Number.POSITIVE_INFINITY))).toBe(true);
		expect(Number.isNaN(parseNumber(Number.NaN))).toBe(true);
	});

	it("parses numbers with fallbacks", () => {
		expect(parseNumberOrZero("2.5")).toBe(2.5);
		expect(parseNumberOrZero("nope")).toBe(0);
	});

	it("normalizes to finite numbers", () => {
		expect(toFiniteNumber("  ")).toBeNull();
		expect(toFiniteNumber("12.5")).toBe(12.5);
		expect(toFiniteNumber(Number.NEGATIVE_INFINITY)).toBeNull();
		expect(toFiniteNumber(Number.NaN)).toBeNull();
	});

	it("clamps integers to bounds", () => {
		expect(clampInt(3.6, 1, 5)).toBe(4);
		expect(clampInt(-10, 1, 5)).toBe(1);
		expect(clampInt(10, 1, 5)).toBe(5);
	});

	it("floors decimals correctly", () => {
		expect(floorToDecimals(1.239, 2)).toBe(1.23);
		expect(formatDecimalFloor(1.239, 2)).toBe("1.23");
	});
});
