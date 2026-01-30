import type { MetaResponse, SpotMetaResponse } from "@nktkas/hyperliquid";

export type PerpAsset = MetaResponse["universe"][number];
export type SpotPair = SpotMetaResponse["universe"][number];
export type SpotToken = SpotMetaResponse["tokens"][number] & {
	displayName: string;
	iconUrl: string | undefined;
	transferDecimals: number;
	isWrapped: boolean;
};

export interface PerpMarket extends PerpAsset {
	kind: "perp";
	displayName: string;
	assetId: number;
	ctxIndex: number;
	iconUrl: string | undefined;
}

export interface SpotMarket extends SpotPair {
	kind: "spot";
	displayName: string;
	assetId: number;
	ctxIndex: number;
	tokensInfo: SpotToken[];
	szDecimals: number;
	iconUrl: string | undefined;
}

export interface BuilderPerpMarket extends PerpAsset {
	kind: "builderPerp";
	displayName: string;
	assetId: number;
	dex: string;
	dexIndex: number;
	ctxIndex: number;
	quoteToken: SpotToken | null;
	iconUrl: string | undefined;
}

export type UnifiedMarket = PerpMarket | SpotMarket | BuilderPerpMarket;

export interface Markets {
	// Arrays - when you need to iterate
	all: UnifiedMarket[];
	perp: PerpMarket[];
	spot: SpotMarket[];
	builderPerp: BuilderPerpMarket[];
	tokens: SpotToken[];

	// Lookups - O(1) access
	get(coin: string): UnifiedMarket | undefined;
	getDisplayName(coin: string): string;
	szDecimals(coin: string): number;

	/**
	 * Get asset ID for a coin.
	 * - For Perpetuals, use the coin name (e.g., "BTC").
	 * - For Spot markets, use the "BASE/QUOTE" format (e.g., "HYPE/USDC").
	 * - For Builder Dex assets, use the "DEX_NAME:ASSET_NAME" format (e.g., "test:ABC").
	 *
	 * @example "BTC" → 0, "HYPE/USDC" → 10107, "test:ABC" → 110000
	 */
	assetId(coin: string): number | undefined;

	/**
	 * Get coin name from asset ID.
	 * Returns the display name format:
	 * - Perpetuals: "BTC"
	 * - Spot: "HYPE/USDC"
	 * - Builder Perp: "test:ABC"
	 *
	 * @example 0 → "BTC", 10107 → "HYPE/USDC", 110000 → "test:ABC"
	 */
	assetIdToCoin(assetId: number): string | undefined;
	getIconUrl(coin: string): string | undefined;
	getToken(coin: string): SpotToken | undefined;

	// Status
	isLoading: boolean;
	error: Error | null;
}
