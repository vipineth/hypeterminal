export type TapAsset = "BTC" | "ETH" | "SOL";
export type BetAmount = 1 | 2 | 3 | 4 | 5;
export type MaxLeverage = 10 | 20 | 30 | 50 | 100;
export type BoxDirection = "LONG" | "SHORT";

export interface TapBox {
	id: string;
	priceLevel: number;
	distancePercent: number;
	leverage: number;
	direction: BoxDirection;
}

export type BoxState = "available" | "highlighted" | "active" | "fading";

// Grid cell for the new 2D grid layout
export interface GridCell {
	row: number;
	col: number;
	priceLevel: number;
	leverage: number;
	direction: BoxDirection;
	isActive: boolean; // Near the price line, tradeable
	isFaded: boolean; // Far from current price
}

export interface ActiveBet {
	id: string;
	coin: string;
	direction: BoxDirection;
	entryPrice: number;
	tpPrice: number;
	leverage: number;
	sizeAsset: number;
	sizeUsd: number;
	betAmount: number;
	startTime: number;
	tpOrderId: string;
	entryOrderId: string;
	estimatedLiqPrice: number;
}

export interface TapTradeSettings {
	betAmount: BetAmount;
	asset: TapAsset;
	maxLeverage: MaxLeverage;
	hasSeenSettings: boolean;
}

export interface PricePoint {
	price: number;
	timestamp: number;
}
