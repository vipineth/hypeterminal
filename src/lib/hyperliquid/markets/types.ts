import type { MetaResponse, SpotMetaResponse } from "@nktkas/hyperliquid";

export type PerpAsset = MetaResponse["universe"][number];
export type SpotPair = SpotMetaResponse["universe"][number];
export type SpotToken = SpotMetaResponse["tokens"][number];

export interface PerpMarket extends PerpAsset {
	kind: "perp";
	displayName: string;
	assetId: number;
	ctxIndex: number;
}

export interface SpotMarket extends SpotPair {
	kind: "spot";
	displayName: string;
	assetId: number;
	ctxIndex: number;
	tokensInfo: SpotToken[];
	underlyingBaseToken?: string;
	szDecimals: number;
}

export interface BuilderPerpMarket extends PerpAsset {
	kind: "builderPerp";
	displayName: string;
	assetId: number;
	dex: string;
	dexIndex: number;
	ctxIndex: number;
	quoteToken: SpotToken | null;
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
	displayName(coin: string): string;
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

	// Token-specific lookups
	token(coin: string): SpotToken | undefined;
	tokenDisplayName(coin: string): string;
	transferDecimals(coin: string): number;

	// Status
	isLoading: boolean;
	error: Error | null;
}
