import { describe, expect, it } from "vitest";
import { hyperliquidKeys } from "./query-keys";

describe("query-keys", () => {
	it("builds stable keys for meta and user scopes", () => {
		expect(hyperliquidKeys.meta()).toEqual(["hyperliquid", "meta"]);
		expect(hyperliquidKeys.user("0xabc")).toEqual(["hyperliquid", "user", "0xabc"]);
		expect(hyperliquidKeys.clearinghouseState("0xabc")).toEqual([
			"hyperliquid",
			"user",
			"0xabc",
			"clearinghouseState",
		]);
	});
});
