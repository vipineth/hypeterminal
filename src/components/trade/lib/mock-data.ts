import type {
	BalanceRow,
	FundingRow,
	HistoryRow,
	Market,
	OrderBookRow,
	OrderRow,
	PositionRow,
	TwapOrder,
} from "./types";

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

export const balances: BalanceRow[] = [
	{ asset: "USDC", available: 12543.21, inOrder: 2500.0, total: 15043.21, usdValue: 15043.21 },
	{ asset: "ETH", available: 2.4521, inOrder: 0.5, total: 2.9521, usdValue: 6912.42 },
	{ asset: "BTC", available: 0.1234, inOrder: 0.0, total: 0.1234, usdValue: 5370.53 },
	{ asset: "AAVE", available: 45.32, inOrder: 12.3, total: 57.62, usdValue: 5903.12 },
	{ asset: "SOL", available: 124.5, inOrder: 0.0, total: 124.5, usdValue: 12298.74 },
];

export const orders: OrderRow[] = [
	{
		id: "ord-001",
		coin: "AAVE",
		side: "buy",
		type: "limit",
		price: 95.5,
		size: 10.0,
		filled: 0,
		status: "open",
		createdAt: "2024-01-15T10:23:45Z",
	},
	{
		id: "ord-002",
		coin: "ETH",
		side: "sell",
		type: "stop-limit",
		price: 3200.0,
		size: 0.5,
		filled: 0,
		status: "open",
		createdAt: "2024-01-15T09:15:30Z",
	},
	{
		id: "ord-003",
		coin: "BTC",
		side: "buy",
		type: "limit",
		price: 42000.0,
		size: 0.05,
		filled: 0.02,
		status: "partial",
		createdAt: "2024-01-15T08:45:12Z",
	},
	{
		id: "ord-004",
		coin: "SOL",
		side: "sell",
		type: "limit",
		price: 105.0,
		size: 25.0,
		filled: 0,
		status: "open",
		createdAt: "2024-01-15T07:30:00Z",
	},
];

export const twapOrders: TwapOrder[] = [
	{
		id: "twap-001",
		coin: "BTC",
		side: "buy",
		totalSize: 0.5,
		executedSize: 0.32,
		avgPrice: 43102.45,
		startTime: "2024-01-15T08:00:00Z",
		endTime: "2024-01-15T12:00:00Z",
		status: "active",
	},
	{
		id: "twap-002",
		coin: "ETH",
		side: "sell",
		totalSize: 5.0,
		executedSize: 5.0,
		avgPrice: 2356.78,
		startTime: "2024-01-14T10:00:00Z",
		endTime: "2024-01-14T18:00:00Z",
		status: "completed",
	},
];

export const history: HistoryRow[] = [
	{
		id: "hist-001",
		coin: "AAVE",
		side: "buy",
		type: "market",
		price: 98.32,
		size: 12.3,
		fee: 1.21,
		pnl: 0,
		executedAt: "2024-01-15T06:23:45Z",
	},
	{
		id: "hist-002",
		coin: "ETH",
		side: "sell",
		type: "limit",
		price: 3102.12,
		size: 0.84,
		fee: 2.61,
		pnl: 0,
		executedAt: "2024-01-14T22:15:30Z",
	},
	{
		id: "hist-003",
		coin: "BTC",
		side: "buy",
		type: "market",
		price: 43250.0,
		size: 0.1,
		fee: 4.33,
		pnl: 0,
		executedAt: "2024-01-14T18:45:12Z",
	},
	{
		id: "hist-004",
		coin: "SOL",
		side: "sell",
		type: "limit",
		price: 102.5,
		size: 50.0,
		fee: 5.13,
		pnl: 245.5,
		executedAt: "2024-01-14T14:30:00Z",
	},
	{
		id: "hist-005",
		coin: "LINK",
		side: "buy",
		type: "market",
		price: 14.12,
		size: 100.0,
		fee: 1.41,
		pnl: 0,
		executedAt: "2024-01-14T10:00:00Z",
	},
];

export const fundingPayments: FundingRow[] = [
	{ coin: "AAVE", rate: 0.0001, payment: -0.42, positionSize: 12.3, timestamp: "2024-01-15T08:00:00Z" },
	{ coin: "ETH", rate: -0.00015, payment: 0.12, positionSize: -0.84, timestamp: "2024-01-15T08:00:00Z" },
	{ coin: "AAVE", rate: 0.00008, payment: -0.34, positionSize: 12.3, timestamp: "2024-01-15T00:00:00Z" },
	{ coin: "ETH", rate: -0.0001, payment: 0.08, positionSize: -0.84, timestamp: "2024-01-15T00:00:00Z" },
	{ coin: "AAVE", rate: 0.00012, payment: -0.51, positionSize: 12.3, timestamp: "2024-01-14T16:00:00Z" },
];
