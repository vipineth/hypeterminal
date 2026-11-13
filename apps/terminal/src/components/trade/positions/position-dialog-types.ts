import type { PerpLikeMarket } from "@/domain/market/model";

export interface TpSlPositionData {
	coin: string;
	market: PerpLikeMarket;
	isLong: boolean;
	size: number;
	entryPx: number;
	markPx: number;
	unrealizedPnl: number;
	roe: number;
	existingTpPrice?: number;
	existingSlPrice?: number;
	existingTpOrderId?: number;
	existingSlOrderId?: number;
}

export interface ClosePositionData {
	market: PerpLikeMarket;
	coin: string;
	size: string;
	markPx: string;
	isLong: boolean;
	unrealizedPnl: number;
	roe: number;
}

export interface LimitClosePositionData {
	coin: string;
	market: PerpLikeMarket;
	isLong: boolean;
	size: number;
	entryPx: number;
	markPx: number;
	unrealizedPnl: number;
	roe: number;
}
