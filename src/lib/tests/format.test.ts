import { describe, expect, it } from "vitest";
import {
	formatNumber,
	formatPercent,
	formatPrice,
	formatPriceRaw,
	formatToken,
	formatUSD,
	shortenAddress,
	szDecimalsToPriceDecimals,
} from "@/lib/format";

describe("format", () => {
	it("formats USD values with fixed digits", () => {
		expect(formatUSD(1234.56)).toBe("$1,234.56");
		expect(formatUSD(1234.56, 0)).toBe("$1,235");
	});

	it("formats prices using szDecimals", () => {
		expect(szDecimalsToPriceDecimals(4)).toBe(2);
		expect(formatPrice(88140.123, { szDecimals: 4 })).toBe("$88,140.12");
		expect(formatPriceRaw(88140.123, 4)).toBe("88,140.12");
	});

	it("formats token amounts and percentages", () => {
		expect(formatToken(1.23456, 2)).toBe("1.23");
		expect(formatToken(1.23456, { digits: 3, symbol: "ETH" })).toBe("1.235 ETH");
		expect(formatPercent(0.125, 2)).toBe("+12.50%");
	});

	it("formats numbers and shortens addresses", () => {
		expect(formatNumber(1234.56, 1)).toBe("1,234.6");
		expect(shortenAddress("0x1234567890123456789012345678901234567890")).toBe("0x1234...7890");
	});
});
