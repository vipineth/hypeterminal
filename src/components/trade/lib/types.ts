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

