import { describe, expect, it } from "vitest";
import { getUsdcBalance, type UsdcBalance, validateDeposit } from "./deposit-validation";

const ready = (raw: bigint) => getUsdcBalance({ data: raw, isError: false, fetchStatus: "idle" });

describe("getUsdcBalance", () => {
	it("is loading while the read has no data and no error", () => {
		expect(getUsdcBalance({ data: undefined, isError: false, fetchStatus: "fetching" })).toEqual({ status: "loading" });
	});

	it("is an error when the read failed with no data", () => {
		expect(getUsdcBalance({ data: undefined, isError: true, fetchStatus: "idle" })).toEqual({ status: "error" });
	});

	it("formats a real balance with USDC decimals", () => {
		expect(ready(13_806_000n)).toEqual({ status: "ready", raw: 13_806_000n, formatted: "13.806" });
	});

	it("reports a real zero balance as ready, not unknown", () => {
		expect(ready(0n)).toEqual({ status: "ready", raw: 0n, formatted: "0" });
	});

	it("is an error when a refresh failed, even with a cached balance", () => {
		expect(getUsdcBalance({ data: 20_000_000n, isError: true, fetchStatus: "idle" })).toEqual({ status: "error" });
	});

	it.each(["fetching", "paused"] as const)("keeps a cached balance as refreshing while a read is %s", (fetchStatus) => {
		expect(getUsdcBalance({ data: 20_000_000n, isError: false, fetchStatus })).toEqual({
			status: "refreshing",
			raw: 20_000_000n,
			formatted: "20",
		});
	});

	it("is loading while retrying after a failed read", () => {
		expect(getUsdcBalance({ data: 20_000_000n, isError: true, fetchStatus: "fetching" })).toEqual({
			status: "loading",
		});
	});
});

describe("validateDeposit", () => {
	const unknownBalances: UsdcBalance[] = [{ status: "loading" }, { status: "error" }];

	it.each(unknownBalances)("blocks submit while the balance is $status", (balance) => {
		expect(validateDeposit("10", balance).valid).toBe(false);
	});

	it("blocks submit on a cached balance whose refresh failed or is in flight", () => {
		const failed = getUsdcBalance({ data: 20_000_000n, isError: true, fetchStatus: "idle" });
		const refreshing = getUsdcBalance({ data: 20_000_000n, isError: false, fetchStatus: "fetching" });
		expect(validateDeposit("10", failed).valid).toBe(false);
		expect(validateDeposit("10", refreshing).valid).toBe(false);
	});

	it("still flags an amount above a cached balance while it refreshes", () => {
		const refreshing = getUsdcBalance({ data: 13_806_000n, isError: false, fetchStatus: "fetching" });
		expect(validateDeposit("14", refreshing)).toEqual({ valid: false, error: "Insufficient balance" });
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
