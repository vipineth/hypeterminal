import { toFiniteNumber } from "@/lib/trade/numbers";

type MarketCtxLike = {
	markPx?: string | number | null;
	prevDayPx?: string | number | null;
	openInterest?: string | number | null;
	oraclePx?: string | number | null;
	dayNtlVlm?: string | number | null;
	funding?: string | number | null;
};

export type MarketCtxNumbers = {
	markPx: number | null;
	prevDayPx: number | null;
	openInterest: number | null;
	oraclePx: number | null;
	dayNtlVlm: number | null;
	funding: number | null;
};

export function getMarketCtxNumbers(ctx: MarketCtxLike | null | undefined): MarketCtxNumbers | null {
	if (!ctx) return null;
	return {
		markPx: toFiniteNumber(ctx.markPx),
		prevDayPx: toFiniteNumber(ctx.prevDayPx),
		openInterest: toFiniteNumber(ctx.openInterest),
		oraclePx: toFiniteNumber(ctx.oraclePx),
		dayNtlVlm: toFiniteNumber(ctx.dayNtlVlm),
		funding: toFiniteNumber(ctx.funding),
	};
}

export function calculate24hPriceChange(ctx: MarketCtxLike | null | undefined): number | null {
	const numbers = getMarketCtxNumbers(ctx);
	if (!numbers) return null;

	const { markPx, prevDayPx } = numbers;
	if (markPx === null || prevDayPx === null || prevDayPx === 0) return null;

	return ((markPx - prevDayPx) / prevDayPx) * 100;
}

export function calculateOpenInterestUSD(ctx: MarketCtxLike | null | undefined): number | null {
	const numbers = getMarketCtxNumbers(ctx);
	if (!numbers) return null;

	const { openInterest, markPx } = numbers;
	if (openInterest === null || markPx === null) return null;

	return openInterest * markPx;
}
