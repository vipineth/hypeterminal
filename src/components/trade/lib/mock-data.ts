import type { Market, OrderBookRow, PositionRow } from "./types";

export const markets: Market[] = [
	{ symbol: "AAVE-USDC", base: "AAVE", changePct: 2.34, price: 102.45, volume: "42.3M" },
	{ symbol: "BTC-USDC", base: "BTC", changePct: -0.84, price: 43521.3, volume: "892.1M" },
	{ symbol: "ETH-USDC", base: "ETH", changePct: 1.12, price: 2341.8, volume: "421.5M" },
	{ symbol: "SOL-USDC", base: "SOL", changePct: 3.41, price: 98.72, volume: "156.2M" },
	{ symbol: "LINK-USDC", base: "LINK", changePct: -1.09, price: 14.23, volume: "32.1M" },
	{ symbol: "OP-USDC", base: "OP", changePct: 0.6, price: 2.14, volume: "18.4M" },
	{ symbol: "ARB-USDC", base: "ARB", changePct: -2.1, price: 1.23, volume: "24.6M" },
	{ symbol: "TIA-USDC", base: "TIA", changePct: 4.21, price: 8.92, volume: "12.8M" },
];

function genBookRows(count: number, start: number, step: number, dir: "up" | "down"): OrderBookRow[] {
	return Array.from({ length: count }).map((_, i) => {
		const price = dir === "up" ? start + i * step : start - i * step;
		const size = Number((Math.random() * 12 + 0.1).toFixed(3));
		const total = Number((size * (Math.random() * 3 + 1)).toFixed(3));
		return { price: Number(price.toFixed(2)), size, total };
	});
}

export const asks: OrderBookRow[] = genBookRows(20, 102.5, 0.05, "up");
export const bids: OrderBookRow[] = genBookRows(20, 102.45, 0.05, "down");

export const positions: PositionRow[] = [
	{
		coin: "AAVE",
		size: 12.3,
		positionValue: 1254.23,
		entryPrice: 98.32,
		markPrice: 102.45,
		pnl: 51.12,
		roePct: 9.2,
		liqPrice: 72.12,
		margin: 213.4,
		funding: -0.42,
	},
	{
		coin: "ETH",
		size: -0.84,
		positionValue: 2864.12,
		entryPrice: 3102.12,
		markPrice: 3056.8,
		pnl: 39.41,
		roePct: 1.6,
		liqPrice: 3502.0,
		margin: 562.3,
		funding: 0.12,
	},
];

