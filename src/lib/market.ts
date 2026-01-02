type MarketCtxLike = {
	markPx?: string | number;
	prevDayPx?: string | number;
	openInterest?: string | number;
};

export function calculate24hPriceChange(ctx: MarketCtxLike | undefined): number | null {
	if (!ctx?.markPx || !ctx?.prevDayPx) return null;

	const markPx = Number(ctx.markPx);
	const prevDayPx = Number(ctx.prevDayPx);

	if (prevDayPx === 0) return null;

	return ((markPx - prevDayPx) / prevDayPx) * 100;
}

export function calculateOpenInterestUSD(ctx: MarketCtxLike | undefined): number | null {
	if (!ctx?.openInterest || !ctx?.markPx) return null;

	const openInterest = Number(ctx.openInterest);
	const markPx = Number(ctx.markPx);

	return openInterest * markPx;
}
