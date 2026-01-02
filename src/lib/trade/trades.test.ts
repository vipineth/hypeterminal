import { describe, expect, it } from "vitest";
import { getTradeKey } from "./trades";

describe("trades", () => {
	it("builds stable trade keys", () => {
		expect(getTradeKey("0xabc", 123)).toBe("0xabc:123");
		expect(getTradeKey("hash", "tid")).toBe("hash:tid");
	});
});
