import { calc, toFiniteNumber } from "@/lib/trade/numbers";
import { PERP_NAME_SEPARATOR, SPOT_NAME_SEPARATOR } from "./tokens";

type MarketCtxLike = object | null | undefined;
type MarketKind = "perp" | "spot" | "builderPerp";

export interface MarketCtxNumbers {
	markPx: number | null;
	prevDayPx: number | null;
	openInterest: number | null;
	oraclePx: number | null;
	dayNtlVlm: number | null;
	funding: number | null;
}

export function getMarketCtxNumbers(ctx: MarketCtxLike): MarketCtxNumbers | null {
	if (!ctx) return null;

	const rawCtx = ctx as Record<string, unknown>;
	return {
		markPx: toFiniteNumber(rawCtx.markPx),
		prevDayPx: toFiniteNumber(rawCtx.prevDayPx),
		openInterest: toFiniteNumber(rawCtx.openInterest),
		oraclePx: toFiniteNumber(rawCtx.oraclePx),
		dayNtlVlm: toFiniteNumber(rawCtx.dayNtlVlm),
		funding: toFiniteNumber(rawCtx.funding),
	};
}

export function calculate24hPriceChange(prevDayPx: unknown, markPx: unknown): number | null {
	return calc.percentChange(prevDayPx, markPx);
}

export function calculateOpenInterestUSD(openInterest: unknown, markPx: unknown): number | null {
	return calc.multiply(openInterest, markPx);
}

export function getMarketSeparator(kind: MarketKind): string {
	if (kind === "spot") return SPOT_NAME_SEPARATOR;
	return PERP_NAME_SEPARATOR;
}

export function getBaseQuoteFromDisplayName(
	displayName: string,
	kind: MarketKind,
): { baseToken: string; quoteToken: string } {
	const separator = getMarketSeparator(kind);
	const [baseToken, quoteToken] = displayName.split(separator);

	return { baseToken, quoteToken };
}

export function getBaseToken(displayName: string, kind: MarketKind): string {
	return getBaseQuoteFromDisplayName(displayName, kind).baseToken;
}

export function getQuoteToken(displayName: string, kind: MarketKind): string {
	return getBaseQuoteFromDisplayName(displayName, kind).quoteToken;
}
