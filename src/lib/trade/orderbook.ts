import { parseNumber } from "@/lib/trade/numbers";

export type OrderBookRow = {
	price: number;
	size: number;
	total: number;
};

export function buildOrderBookRows(
	levels: Array<{ px: unknown; sz: unknown }> | undefined,
	side: "bid" | "ask",
): OrderBookRow[] {
	if (!levels || levels.length === 0) return [];

	const sorted = [...levels].sort((a, b) => {
		const aPx = parseNumber(a.px);
		const bPx = parseNumber(b.px);
		return side === "bid" ? bPx - aPx : aPx - bPx;
	});

	let cumulative = 0;
	return sorted.map((level) => {
		const price = parseNumber(level.px);
		const size = parseNumber(level.sz);
		cumulative += Number.isFinite(size) ? size : 0;
		return { price, size, total: cumulative };
	});
}
