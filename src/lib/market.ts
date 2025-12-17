import type { PerpAssetCtx } from "@/hooks/hyperliquid/use-perp-asset-ctxs-snapshot";

export function calculate24hPriceChange(ctx: PerpAssetCtx | undefined): number | null {
	if (!ctx?.markPx || !ctx?.prevDayPx) return null;

	const markPx = Number(ctx.markPx);
	const prevDayPx = Number(ctx.prevDayPx);

	if (prevDayPx === 0) return null;

	return ((markPx - prevDayPx) / prevDayPx) * 100;
}

export function calculateOpenInterestUSD(ctx: PerpAssetCtx | undefined): number | null {
	if (!ctx?.openInterest || !ctx?.markPx) return null;

	const openInterest = Number(ctx.openInterest);
	const markPx = Number(ctx.markPx);

	return openInterest * markPx;
}
