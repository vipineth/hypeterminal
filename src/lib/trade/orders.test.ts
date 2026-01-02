import { describe, expect, it } from "vitest";
import { formatPriceForOrder, formatSizeForOrder, getDefaultLeverage } from "./orders";

describe("orders", () => {
	it("chooses smart leverage defaults", () => {
		expect(getDefaultLeverage(5)).toBe(5);
		expect(getDefaultLeverage(6)).toBe(3);
		expect(getDefaultLeverage(50)).toBe(25);
	});

	it("formats order prices with 5 significant figures", () => {
		expect(formatPriceForOrder(100)).toBe("100");
		expect(formatPriceForOrder(1234.56)).toBe("1234.6");
		expect(formatPriceForOrder(0.012345)).toBe("0.012345");
	});

	it("formats order sizes using size decimals", () => {
		expect(formatSizeForOrder(1.234567, 3)).toBe("1.234");
		expect(formatSizeForOrder(1.2, 0)).toBe("1");
	});
});
