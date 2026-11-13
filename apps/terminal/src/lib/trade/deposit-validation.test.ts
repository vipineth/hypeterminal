import { describe, expect, it } from "vitest";
import { getUsdcBalance, type UsdcBalance, validateDeposit } from "./deposit-validation";

const ready = (raw: bigint) => getUsdcBalance({ data: raw, isError: false });

describe("getUsdcBalance", () => {
	it("is loading while the read has no data and no error", () => {
		expect(getUsdcBalance({ data: undefined, isError: false })).toEqual({ status: "loading" });
	});

	it("is an error when the read failed with no data", () => {
		expect(getUsdcBalance({ data: undefined, isError: true })).toEqual({ status: "error" });
	});

	it("formats a real balance with USDC decimals", () => {
		expect(ready(13_806_000n)).toEqual({ status: "ready", raw: 13_806_000n, formatted: "13.806" });
	});

	it("reports a real zero balance as ready, not unknown", () => {
		expect(ready(0n)).toEqual({ status: "ready", raw: 0n, formatted: "0" });
	});
});

describe("validateDeposit", () => {
	const unknownBalances: UsdcBalance[] = [{ status: "loading" }, { status: "error" }];

	it.each(unknownBalances)("blocks submit while the balance is $status", (balance) => {
		expect(validateDeposit("10", balance).valid).toBe(false);
	});

	it("allows a deposit within a known balance", () => {
		expect(validateDeposit("10", ready(13_806_000n))).toEqual({ valid: true, error: null });
	});

	it("rejects a deposit above a known balance", () => {
		expect(validateDeposit("14", ready(13_806_000n))).toEqual({ valid: false, error: "Insufficient balance" });
	});

	it("rejects anything below the minimum", () => {
		expect(validateDeposit("4.99", ready(13_806_000n))).toEqual({ valid: false, error: "Minimum deposit is 5 USDC" });
	});
});
