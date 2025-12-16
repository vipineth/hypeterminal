export type MarketKind = "perp" | "spot" | "builderPerp";

export type PerpMarketKey = `perp:${string}`;

export function makePerpMarketKey(coin: string): PerpMarketKey {
	return `perp:${coin}`;
}

export function isPerpMarketKey(marketKey: string): marketKey is PerpMarketKey {
	return marketKey.startsWith("perp:") && marketKey.length > "perp:".length;
}

export function perpCoinFromMarketKey(marketKey: PerpMarketKey): string {
	return marketKey.slice("perp:".length);
}

export function marketKindFromMarketKey(marketKey: string): MarketKind | null {
	if (isPerpMarketKey(marketKey)) return "perp";
	if (marketKey.startsWith("spot:")) return "spot";
	if (marketKey.startsWith("perpDex:")) return "builderPerp";
	return null;
}

