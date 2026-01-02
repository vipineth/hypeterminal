import { parseNumber } from "@/lib/trade/numbers";

export type OrderBookRow = {
	/** Numeric price for calculations (USDC conversion, limit orders) */
	price: number;
	/** Original price string from API (preserves decimal precision for display) */
	priceRaw: string;
	size: number;
	total: number;
};

/**
 * Build orderbook rows from API levels.
 * API already returns sorted data (bids desc, asks asc).
 */
export function buildOrderBookRows(
	levels: Array<{ px: unknown; sz: unknown }> | undefined,
): OrderBookRow[] {
	if (!levels || levels.length === 0) return [];

	let cumulative = 0;
	return levels.map((level) => {
		const price = parseNumber(level.px);
		const priceRaw = typeof level.px === "string" ? level.px : String(level.px);
		const size = parseNumber(level.sz);
		cumulative += Number.isFinite(size) ? size : 0;
		return { price, priceRaw, size, total: cumulative };
	});
}
