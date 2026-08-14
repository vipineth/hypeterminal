import { describe, expect, it } from "vitest";
import { parseBuilderConfig } from "@/config/hyperliquid";

const VALID_ADDRESS = "0x744e2f0b69456B42278B3e797a58Ff57e5180A7E";

describe("parseBuilderConfig", () => {
	it("returns undefined when both env vars are unset", () => {
		expect(parseBuilderConfig({})).toBeUndefined();
	});

	it("returns undefined when both env vars are empty strings", () => {
		expect(parseBuilderConfig({ VITE_BUILDER_ADDRESS: "", VITE_BUILDER_FEE_TENTH_BPS: "" })).toBeUndefined();
	});

	it("parses a valid address and fee pair", () => {
		const config = parseBuilderConfig({ VITE_BUILDER_ADDRESS: VALID_ADDRESS, VITE_BUILDER_FEE_TENTH_BPS: "10" });
		expect(config).toEqual({ b: VALID_ADDRESS, f: 10 });
		expect(typeof config?.f).toBe("number");
	});

	it("accepts a fee of 0", () => {
		expect(parseBuilderConfig({ VITE_BUILDER_ADDRESS: VALID_ADDRESS, VITE_BUILDER_FEE_TENTH_BPS: "0" })).toEqual({
			b: VALID_ADDRESS,
			f: 0,
		});
	});

	it("accepts the maximum fee of 1000", () => {
		expect(parseBuilderConfig({ VITE_BUILDER_ADDRESS: VALID_ADDRESS, VITE_BUILDER_FEE_TENTH_BPS: "1000" })).toEqual({
			b: VALID_ADDRESS,
			f: 1000,
		});
	});

	it("rejects a fee above 1000", () => {
		expect(
			parseBuilderConfig({ VITE_BUILDER_ADDRESS: VALID_ADDRESS, VITE_BUILDER_FEE_TENTH_BPS: "1001" }),
		).toBeUndefined();
	});

	it("returns undefined when only the address is set", () => {
		expect(parseBuilderConfig({ VITE_BUILDER_ADDRESS: VALID_ADDRESS })).toBeUndefined();
	});

	it("returns undefined when only the fee is set", () => {
		expect(parseBuilderConfig({ VITE_BUILDER_FEE_TENTH_BPS: "10" })).toBeUndefined();
	});

	it.each([
		["too short", "0x123"],
		["missing 0x prefix", "744e2f0b69456B42278B3e797a58Ff57e5180A7E"],
		["39 hex chars", "0x744e2f0b69456B42278B3e797a58Ff57e5180A7"],
		["non-hex chars", "0x744e2f0b69456B42278B3e797a58Ff57e5180Zzz"],
	])("rejects an invalid address (%s)", (_label, address) => {
		expect(parseBuilderConfig({ VITE_BUILDER_ADDRESS: address, VITE_BUILDER_FEE_TENTH_BPS: "10" })).toBeUndefined();
	});

	it.each([
		["decimal", "10.5"],
		["negative", "-1"],
		["non-numeric", "abc"],
		["scientific notation", "1e2"],
	])("rejects an invalid fee (%s)", (_label, fee) => {
		expect(
			parseBuilderConfig({ VITE_BUILDER_ADDRESS: VALID_ADDRESS, VITE_BUILDER_FEE_TENTH_BPS: fee }),
		).toBeUndefined();
	});

	it("trims whitespace-padded values", () => {
		expect(
			parseBuilderConfig({ VITE_BUILDER_ADDRESS: `  ${VALID_ADDRESS}  `, VITE_BUILDER_FEE_TENTH_BPS: " 10 " }),
		).toEqual({ b: VALID_ADDRESS, f: 10 });
	});
});
