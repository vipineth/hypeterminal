import { formatDecimalFloor } from "@/lib/trade/numbers";

export function getDefaultLeverage(maxLeverage: number): number {
	if (maxLeverage <= 5) return maxLeverage;
	return Math.floor(maxLeverage / 2);
}

/**
 * Format price according to Hyperliquid's tick size rules.
 * Prices must have at most 5 significant figures.
 * The number of decimal places depends on the price magnitude.
 */
export function formatPriceForOrder(price: number): string {
	if (!Number.isFinite(price) || price <= 0) return "0";

	const maxSignificantFigures = 5;
	const log10Price = Math.log10(price);
	const integerDigits = Math.floor(log10Price) + 1;

	let decimals: number;
	if (price >= 1) {
		decimals = Math.max(0, maxSignificantFigures - integerDigits);
	} else {
		decimals = maxSignificantFigures - integerDigits;
	}

	decimals = Math.min(decimals, 8);

	const multiplier = 10 ** decimals;
	const rounded = Math.round(price * multiplier) / multiplier;

	if (decimals === 0) {
		return rounded.toFixed(0);
	}

	return rounded
		.toFixed(decimals)
		.replace(/(\.\d*?)0+$/, "$1")
		.replace(/\.$/, "");
}

export function formatSizeForOrder(size: number, szDecimals: number): string {
	return formatDecimalFloor(size, szDecimals);
}
