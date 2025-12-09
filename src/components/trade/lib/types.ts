export type Market = {
	symbol: string;
	base: string;
	changePct: number;
	price: number;
	volume: string;
};

export type OrderBookRow = {
	price: number;
	size: number;
	total: number;
};

export type PositionRow = {
	coin: string;
	size: number;
	positionValue: number;
	entryPrice: number;
	markPrice: number;
	pnl: number;
	roePct: number;
	liqPrice: number;
	margin: number;
	funding: number;
};

export type BalanceRow = {
	asset: string;
	available: number;
	inOrder: number;
	total: number;
	usdValue: number;
};

export type OrderRow = {
	id: string;
	coin: string;
	side: "buy" | "sell";
	type: "limit" | "market" | "stop-limit" | "stop-market";
	price: number;
	size: number;
	filled: number;
	status: "open" | "partial" | "cancelled";
	createdAt: string;
};

export type TwapOrder = {
	id: string;
	coin: string;
	side: "buy" | "sell";
	totalSize: number;
	executedSize: number;
	avgPrice: number;
	startTime: string;
	endTime: string;
	status: "active" | "completed" | "cancelled";
};

export type HistoryRow = {
	id: string;
	coin: string;
	side: "buy" | "sell";
	type: "limit" | "market";
	price: number;
	size: number;
	fee: number;
	pnl: number;
	executedAt: string;
};

export type FundingRow = {
	coin: string;
	rate: number;
	payment: number;
	positionSize: number;
	timestamp: string;
};
