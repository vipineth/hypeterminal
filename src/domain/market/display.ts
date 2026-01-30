import type { MarketKind } from "./types";

export const PERP_MARKET_NAME_SEPARATOR = "-";
export const SPOT_MARKET_NAME_SEPARATOR = "/";

export const BUILDER_DEX_SEPARATOR = ":";

function getMarketSeparator(kind: MarketKind): string {
	if (kind === "spot") return SPOT_MARKET_NAME_SEPARATOR;
	return PERP_MARKET_NAME_SEPARATOR;
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
