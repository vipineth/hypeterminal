import type { MarketKind } from "./types";

export const PERP_NAME_SEPARATOR = "-";
export const SPOT_NAME_SEPARATOR = "/";

function getMarketSeparator(kind: MarketKind): string {
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
