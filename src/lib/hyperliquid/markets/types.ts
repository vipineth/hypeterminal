import type { MetaResponse, SpotMetaResponse } from "@nktkas/hyperliquid";

export type PerpAsset = MetaResponse["universe"][number];
export type SpotPair = SpotMetaResponse["universe"][number];
export type SpotToken = SpotMetaResponse["tokens"][number] & {
	displayName: string;
	iconUrl: string | undefined;
	transferDecimals: number;
	isWrapped: boolean;
};

export type MarketKind = "perp" | "spot" | "builderPerp";

interface BaseMarket {
	kind: MarketKind;
	displayName: string;
	assetId: number;
	ctxIndex: number;
	iconUrl: string | undefined;
}

export interface PerpMarket extends PerpAsset, BaseMarket {
	kind: "perp";
}

export interface SpotMarket extends SpotPair, BaseMarket {
	kind: "spot";
	tokensInfo: SpotToken[];
	szDecimals: number;
}

export interface BuilderPerpMarket extends PerpAsset, BaseMarket {
	kind: "builderPerp";
	dex: string;
	dexIndex: number;
	quoteToken: SpotToken | undefined;
}

export type UnifiedMarket = PerpMarket | SpotMarket | BuilderPerpMarket;

export interface Markets {
	readonly all: readonly UnifiedMarket[];
	readonly perp: readonly PerpMarket[];
	readonly spot: readonly SpotMarket[];
	readonly builderPerp: readonly BuilderPerpMarket[];
	readonly tokens: readonly SpotToken[];
	readonly isLoading: boolean;
	readonly error: Error | null;

	getMarket(coin: string): UnifiedMarket | undefined;
	getSzDecimals(coin: string): number;
	getAssetId(coin: string): number | undefined;
}
