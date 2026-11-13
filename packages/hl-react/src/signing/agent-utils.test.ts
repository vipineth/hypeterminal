import { describe, expect, it } from "vitest";
import { convertFeeToPercentageString, isBuilderFeeApproved } from "./agent-utils";

const SDK_PERCENT_PATTERN = /^[0-9]+(\.[0-9]+)?%$/;

describe("convertFeeToPercentageString", () => {
	it.each([
		[1, "0.001%"],
		[10, "0.01%"],
		[100, "0.1%"],
		["10", "0.01%"],
	])("maps builder fee %s tenths of a basis point to %s", (fee, expected) => {
		const result = convertFeeToPercentageString(fee);
		expect(result).toBe(expected);
		expect(result).toMatch(SDK_PERCENT_PATTERN);
	});
});

describe("isBuilderFeeApproved", () => {
	it("approves when maxBuilderFee equals the required fee", () => {
		expect(isBuilderFeeApproved(10, 10)).toBe(true);
	});

	it("rejects when maxBuilderFee is below the required fee", () => {
		expect(isBuilderFeeApproved(9, 10)).toBe(false);
		expect(isBuilderFeeApproved(0, 10)).toBe(false);
	});

	it("keeps a wallet that approved 0.1% on the old conversion approved for f=10", () => {
		expect(isBuilderFeeApproved(100, 10)).toBe(true);
	});

	it("rejects when either side is unknown", () => {
		expect(isBuilderFeeApproved(undefined, 10)).toBe(false);
		expect(isBuilderFeeApproved(10, undefined)).toBe(false);
	});
});
