import { describe, expect, it } from "vitest";
import { parseBuilderConfig } from "@/config/hyperliquid";

const VALID_ADDRESS = "0x744e2f0b69456B42278B3e797a58Ff57e5180A7E";

describe("parseBuilderConfig", () => {
	it("returns undefined when both env vars are unset", () => {
		expect(parseBuilderConfig({})).toBeUndefined();
	});

	it("returns undefined when both env vars are empty strings", () => {
		expect(parseBuilderConfig({ VITE_BUILDER_ADDRESS: "", VITE_BUILDER_FEE_BPS: "" })).toBeUndefined();
	});

	it("converts basis points to the API's tenth-of-a-bp unit", () => {
		const config = parseBuilderConfig({ VITE_BUILDER_ADDRESS: VALID_ADDRESS, VITE_BUILDER_FEE_BPS: "1" });
		expect(config).toEqual({ b: VALID_ADDRESS, f: 10 });
		expect(typeof config?.f).toBe("number");
	});

	it("accepts a fee of 0", () => {
		expect(parseBuilderConfig({ VITE_BUILDER_ADDRESS: VALID_ADDRESS, VITE_BUILDER_FEE_BPS: "0" })).toEqual({
			b: VALID_ADDRESS,
			f: 0,
		});
	});

	it.each([
		["0.1", 1],
		["0.5", 5],
		["0.7", 7],
		["2.5", 25],
	])("accepts one decimal place (%s bps)", (bps, expected) => {
		expect(parseBuilderConfig({ VITE_BUILDER_ADDRESS: VALID_ADDRESS, VITE_BUILDER_FEE_BPS: bps })).toEqual({
			b: VALID_ADDRESS,
			f: expected,
		});
	});

	it("accepts the maximum fee of 100 bps", () => {
		expect(parseBuilderConfig({ VITE_BUILDER_ADDRESS: VALID_ADDRESS, VITE_BUILDER_FEE_BPS: "100" })).toEqual({
			b: VALID_ADDRESS,
			f: 1000,
		});
	});

	it("rejects a fee above 100 bps", () => {
		expect(parseBuilderConfig({ VITE_BUILDER_ADDRESS: VALID_ADDRESS, VITE_BUILDER_FEE_BPS: "101" })).toBeUndefined();
	});

	it("returns undefined when only the address is set", () => {
		expect(parseBuilderConfig({ VITE_BUILDER_ADDRESS: VALID_ADDRESS })).toBeUndefined();
	});

	it("returns undefined when only the fee is set", () => {
		expect(parseBuilderConfig({ VITE_BUILDER_FEE_BPS: "1" })).toBeUndefined();
	});

	it.each([
		["too short", "0x123"],
		["missing 0x prefix", "744e2f0b69456B42278B3e797a58Ff57e5180A7E"],
		["39 hex chars", "0x744e2f0b69456B42278B3e797a58Ff57e5180A7"],
		["non-hex chars", "0x744e2f0b69456B42278B3e797a58Ff57e5180Zzz"],
	])("rejects an invalid address (%s)", (_label, address) => {
		expect(parseBuilderConfig({ VITE_BUILDER_ADDRESS: address, VITE_BUILDER_FEE_BPS: "1" })).toBeUndefined();
	});

	it.each([
		["two decimal places", "0.25"],
		["negative", "-1"],
		["non-numeric", "abc"],
		["scientific notation", "1e2"],
		["trailing dot", "1."],
	])("rejects an invalid fee (%s)", (_label, bps) => {
		expect(parseBuilderConfig({ VITE_BUILDER_ADDRESS: VALID_ADDRESS, VITE_BUILDER_FEE_BPS: bps })).toBeUndefined();
	});

	it("trims whitespace-padded values", () => {
		expect(parseBuilderConfig({ VITE_BUILDER_ADDRESS: `  ${VALID_ADDRESS}  `, VITE_BUILDER_FEE_BPS: " 1 " })).toEqual({
			b: VALID_ADDRESS,
			f: 10,
		});
	});
});
