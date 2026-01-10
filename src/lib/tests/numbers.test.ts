import { describe, expect, it } from "vitest";
import {
	clampInt,
	floorToDecimals,
	formatDecimal,
	formatDecimalFloor,
	parseNumber,
	parseNumberOr,
	parseNumberOrZero,
	parsePositiveDecimalInput,
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
		expect(parseNumberOr("2.5", 0)).toBe(2.5);
		expect(parseNumberOr("nope", 7)).toBe(7);
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

	it("formats decimals and floors correctly", () => {
		expect(formatDecimal(1.23456, 2)).toBe("1.23");
		expect(formatDecimal(1.0, 2)).toBe("1");
		expect(floorToDecimals(1.239, 2)).toBe(1.23);
		expect(formatDecimalFloor(1.239, 2)).toBe("1.23");
	});

	it("parses positive decimal inputs", () => {
		expect(parsePositiveDecimalInput("1")).toBe(1);
		expect(parsePositiveDecimalInput("1.25")).toBe(1.25);
		expect(parsePositiveDecimalInput("1.")).toBe(1);
		expect(parsePositiveDecimalInput("0")).toBeNull();
		expect(parsePositiveDecimalInput("-1")).toBeNull();
		expect(parsePositiveDecimalInput("1e3")).toBeNull();
	});
});
