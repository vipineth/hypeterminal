export type MarketKind = "perp" | "spot" | "builderPerp";

export type PerpMarketKey = `perp:${string}`;
export type SpotMarketKey = `spot:${string}`;
export type BuilderPerpMarketKey = `perpDex:${string}:${string}`;
export type MarketKey = PerpMarketKey | SpotMarketKey | BuilderPerpMarketKey;

export type ParsedMarketKey =
	| { kind: "perp"; coin: string }
	| { kind: "spot"; pair: string; base: string; quote: string }
	| { kind: "builderPerp"; dex: string; coin: string };

export function makePerpMarketKey(coin: string): PerpMarketKey {
	return `perp:${coin}`;
}

export function makeSpotMarketKey(pair: string): SpotMarketKey {
	return `spot:${pair}`;
}

export function makeBuilderPerpMarketKey(dex: string, coin: string): BuilderPerpMarketKey {
	return `perpDex:${dex}:${coin}`;
}

export function isPerpMarketKey(marketKey: string): marketKey is PerpMarketKey {
	return marketKey.startsWith("perp:") && marketKey.length > "perp:".length;
}

export function isSpotMarketKey(marketKey: string): marketKey is SpotMarketKey {
	return marketKey.startsWith("spot:") && marketKey.length > "spot:".length;
}

export function isBuilderPerpMarketKey(marketKey: string): marketKey is BuilderPerpMarketKey {
	if (!marketKey.startsWith("perpDex:")) return false;
	const rest = marketKey.slice("perpDex:".length);
	return rest.includes(":") && rest.split(":").length === 2;
}

export function marketKindFromMarketKey(marketKey: string): MarketKind | null {
	if (isPerpMarketKey(marketKey)) return "perp";
	if (isSpotMarketKey(marketKey)) return "spot";
	if (isBuilderPerpMarketKey(marketKey)) return "builderPerp";
	return null;
}

export function parseMarketKey(marketKey: string): ParsedMarketKey | null {
	if (isPerpMarketKey(marketKey)) {
		return { kind: "perp", coin: marketKey.slice("perp:".length) };
	}

	if (isSpotMarketKey(marketKey)) {
		const pair = marketKey.slice("spot:".length);
		const [base, quote] = pair.split("/");
		if (!base || !quote) return null;
		return { kind: "spot", pair, base, quote };
	}

	if (isBuilderPerpMarketKey(marketKey)) {
		const rest = marketKey.slice("perpDex:".length);
		const [dex, coin] = rest.split(":");
		if (!dex || !coin) return null;
		return { kind: "builderPerp", dex, coin };
	}

	return null;
}

export function perpCoinFromMarketKey(marketKey: PerpMarketKey): string {
	return marketKey.slice("perp:".length);
}

export function spotPairFromMarketKey(marketKey: SpotMarketKey): string {
	return marketKey.slice("spot:".length);
}

export function builderPerpFromMarketKey(marketKey: BuilderPerpMarketKey): { dex: string; coin: string } {
	const rest = marketKey.slice("perpDex:".length);
	const [dex, coin] = rest.split(":");
	return { dex, coin };
}

export function getCoinFromMarketKey(marketKey: string): string | null {
	const parsed = parseMarketKey(marketKey);
	if (!parsed) return null;

	switch (parsed.kind) {
		case "perp":
			return parsed.coin;
		case "spot":
			return parsed.pair;
		case "builderPerp":
			return `${parsed.dex}:${parsed.coin}`;
	}
}

export function getApiParams(marketKey: string): { dex: string; coin: string } | null {
	const parsed = parseMarketKey(marketKey);
	if (!parsed) return null;

	switch (parsed.kind) {
		case "perp":
			return { dex: "", coin: parsed.coin };
		case "spot":
			return { dex: "", coin: parsed.pair };
		case "builderPerp":
			return { dex: parsed.dex, coin: parsed.coin };
	}
}
