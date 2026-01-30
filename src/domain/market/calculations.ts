import { calc } from "@/lib/trade/numbers";

export interface MarketCtxNumbers {
	markPx: number | null;
	prevDayPx: number | null;
	openInterest: number | null;
	oraclePx: number | null;
	dayNtlVlm: number | null;
	funding: number | null;
}

export function calculate24hPriceChange(prevDayPx: unknown, markPx: unknown): number | null {
	return calc.percentChange(prevDayPx, markPx);
}

export function calculateOpenInterestUSD(openInterest: unknown, markPx: unknown): number | null {
	return calc.multiply(openInterest, markPx);
}
