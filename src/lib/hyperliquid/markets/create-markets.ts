import type { MetaResponse, PerpDexsResponse, SpotMetaResponse } from "@nktkas/hyperliquid";
import { getUnderlyingAsset } from "@/lib/tokens";
import type { BuilderPerpMarket, Markets, PerpMarket, SpotMarket, SpotToken, UnifiedMarket } from "./types";

const PERP_NAME_SEPARATOR = "-";
const SPOT_NAME_SEPARATOR = "/";

function getPerpAssetId(index: number): number {
	return index;
}

function getSpotAssetId(pairIndex: number): number {
	return 10000 + pairIndex;
}

function getBuilderPerpAssetId(dexIndex: number, assetIndex: number): number {
	return 100000 + dexIndex * 10000 + assetIndex;
}

function getPerpDisplayName(name: string, quoteToken?: string): string {
	return `${name}${PERP_NAME_SEPARATOR}${quoteToken ?? "USDC"}`;
}

function getSpotDisplayName(baseToken: string, quoteToken: string): string {
	return `${baseToken}${SPOT_NAME_SEPARATOR}${quoteToken}`;
}

function getBuilderPerpDisplayName(name: string, quoteToken?: string | null): string {
	const baseName = name.includes(":") ? name.split(":")[1] : name;
	return `${baseName}-${quoteToken ?? "USDC"}`;
}

export interface CreateMarketsParams {
	perpMeta: MetaResponse | undefined;
	spotMeta: SpotMetaResponse | undefined;
	allPerpMetas: MetaResponse[] | undefined;
	perpDexs: PerpDexsResponse | undefined;
	isLoading: boolean;
	error: Error | null;
}

export function createMarkets(params: CreateMarketsParams): Markets {
	const { perpMeta, spotMeta, allPerpMetas, perpDexs, isLoading, error } = params;

	// Build perp markets
	const perpMarkets: PerpMarket[] = [];
	if (perpMeta?.universe) {
		for (let i = 0; i < perpMeta.universe.length; i++) {
			const asset = perpMeta.universe[i];
			if (asset.isDelisted) continue;
			perpMarkets.push({
				...asset,
				kind: "perp",
				displayName: getPerpDisplayName(asset.name),
				assetId: getPerpAssetId(i),
				ctxIndex: i,
			});
		}
	}

	// Build spot markets
	const spotMarkets: SpotMarket[] = [];
	const spotTokens: SpotToken[] = spotMeta?.tokens ?? [];

	if (spotMeta?.universe && spotMeta?.tokens) {
		for (const pair of spotMeta.universe) {
			const tokensInfo = pair.tokens.map((idx) => spotMeta.tokens[idx]).filter((t): t is SpotToken => !!t);

			if (tokensInfo.length < 2) continue;

			const [baseToken, quoteToken] = tokensInfo;
			const underlyingBaseToken = getUnderlyingAsset(baseToken);
			const displayName = getSpotDisplayName(underlyingBaseToken ?? baseToken.name, quoteToken.name);

			spotMarkets.push({
				...pair,
				kind: "spot",
				displayName,
				assetId: getSpotAssetId(pair.index),
				ctxIndex: pair.index,
				tokensInfo,
				underlyingBaseToken,
				szDecimals: baseToken.szDecimals,
			});
		}
	}

	const builderPerpMarkets: BuilderPerpMarket[] = [];
	if (allPerpMetas && perpDexs && allPerpMetas.length > 1) {
		for (let dexIndex = 1; dexIndex < allPerpMetas.length; dexIndex++) {
			const meta = allPerpMetas[dexIndex];
			const dexInfo = perpDexs[dexIndex];
			if (!meta || !dexInfo) continue;

			const dexName = dexInfo.name;
			const quoteToken = spotMeta?.tokens[meta.collateralToken] ?? null;

			for (let assetIndex = 0; assetIndex < meta.universe.length; assetIndex++) {
				const asset = meta.universe[assetIndex];
				if (asset.isDelisted) continue;

				builderPerpMarkets.push({
					...asset,
					kind: "builderPerp",
					displayName: getBuilderPerpDisplayName(asset.name, quoteToken?.name),
					assetId: getBuilderPerpAssetId(dexIndex, assetIndex),
					dex: dexName,
					dexIndex,
					ctxIndex: assetIndex,
					quoteToken,
				});
			}
		}
	}

	// Build all markets array
	const allMarkets: UnifiedMarket[] = [...perpMarkets, ...spotMarkets, ...builderPerpMarkets];

	// Build lookup maps
	const marketByName = new Map<string, UnifiedMarket>();
	const assetIdToMarket = new Map<number, UnifiedMarket>();
	for (const market of allMarkets) {
		marketByName.set(market.name, market);
		assetIdToMarket.set(market.assetId, market);
	}

	const tokenByName = new Map<string, SpotToken>();
	for (const token of spotTokens) {
		tokenByName.set(token.name, token);
	}

	// Build spot display name map (@107 -> HYPE/USDC)
	const spotDisplayNameById = new Map<string, string>();
	if (spotMeta?.universe && spotMeta?.tokens) {
		const tokenNames = new Map<number, string>();
		for (const token of spotMeta.tokens) {
			tokenNames.set(token.index, getUnderlyingAsset(token) ?? token.name);
		}

		for (const pair of spotMeta.universe) {
			if (pair.tokens.length < 2) continue;
			const baseName = tokenNames.get(pair.tokens[0]);
			const quoteName = tokenNames.get(pair.tokens[1]);
			if (baseName && quoteName) {
				spotDisplayNameById.set(pair.name, `${baseName}/${quoteName}`);
			}
		}
	}

	// Return Markets object
	return {
		all: allMarkets,
		perp: perpMarkets,
		spot: spotMarkets,
		builderPerp: builderPerpMarkets,
		tokens: spotTokens,
		isLoading,
		error,

		get(coin: string): UnifiedMarket | undefined {
			return marketByName.get(coin);
		},

		displayName(coin: string): string {
			// Spot pair IDs like @107
			if (coin.startsWith("@")) {
				return spotDisplayNameById.get(coin) ?? coin;
			}
			const market = marketByName.get(coin);
			if (!market) return coin;
			// For spot, return displayName (e.g., "HYPE/USDC")
			// For perp/builderPerp, return name (e.g., "BTC", "test:ABC")
			return market.kind === "spot" ? market.displayName : market.name;
		},

		szDecimals(coin: string): number {
			return marketByName.get(coin)?.szDecimals ?? 4;
		},

		assetId(coin: string): number | undefined {
			return marketByName.get(coin)?.assetId;
		},

		assetIdToCoin(assetId: number): string | undefined {
			const market = assetIdToMarket.get(assetId);
			if (!market) return undefined;
			return market.kind === "spot" ? market.displayName : market.name;
		},

		token(coin: string): SpotToken | undefined {
			return tokenByName.get(coin);
		},

		tokenDisplayName(coin: string): string {
			const token = tokenByName.get(coin);
			if (!token) return coin;
			return getUnderlyingAsset(token) ?? token.name;
		},

		transferDecimals(coin: string): number {
			const token = tokenByName.get(coin);
			if (!token) return 2;
			return token.weiDecimals + (token.evmContract?.evm_extra_wei_decimals ?? 0);
		},
	};
}

// Empty markets object for initial state
export function createEmptyMarkets(): Markets {
	return createMarkets({
		perpMeta: undefined,
		spotMeta: undefined,
		allPerpMetas: undefined,
		perpDexs: undefined,
		isLoading: true,
		error: null,
	});
}
