import type {
	BuilderPerpMarket,
	PerpMarket,
	SpotMarket,
	MarketSpotToken as SpotToken,
	UnifiedMarket,
} from "@hypeterminal/hl-react";
import type { MetaResponse, PerpDexsResponse, SpotMetaResponse } from "@nktkas/hyperliquid";
import { getIconUrlFromMarketName, getTokenDisplayName, getUnderlyingAsset } from "@/domain/market/tokens";
import {
	getBuilderPerpAssetId,
	getBuilderPerpDisplayName,
	getBuilderPerpShortName,
	getPerpAssetId,
	getPerpDisplayName,
	getSpotAssetId,
	getSpotDisplayName,
} from "@/lib/hyperliquid/markets/helper";

export interface MetaPayloads {
	perpDexs: PerpDexsResponse;
	allPerpMetas: MetaResponse[];
	spotMeta: SpotMetaResponse;
}

export interface MarketModel {
	all: readonly UnifiedMarket[];
	perp: readonly PerpMarket[];
	spot: readonly SpotMarket[];
	builderPerp: readonly BuilderPerpMarket[];
	tokens: readonly SpotToken[];
	byName: ReadonlyMap<string, UnifiedMarket>;
	tokenByName: ReadonlyMap<string, SpotToken>;
}

export function parseMarkets({ perpDexs, allPerpMetas, spotMeta }: MetaPayloads): MarketModel {
	const perpMeta = allPerpMetas[0];

	const perpMarkets: PerpMarket[] = [];
	if (perpMeta?.universe) {
		for (let i = 0; i < perpMeta.universe.length; i++) {
			const market = perpMeta.universe[i];
			if (market.isDelisted) continue;
			perpMarkets.push({
				...market,
				kind: "perp",
				shortName: market.name,
				pairName: getPerpDisplayName(market.name),
				assetId: getPerpAssetId(i),
				ctxIndex: i,
				iconUrl: getIconUrlFromMarketName(market.name, "perp"),
			});
		}
	}

	const spotMarkets: SpotMarket[] = [];
	const realNames = new Set(spotMeta.tokens.map((token) => token.name));
	const strippedNames = spotMeta.tokens.map(getTokenDisplayName).filter((name) => !realNames.has(name));
	const spotTokens: SpotToken[] = spotMeta.tokens.map((token) => {
		const strippedName = getTokenDisplayName(token);
		const isUnique = strippedNames.indexOf(strippedName) === strippedNames.lastIndexOf(strippedName);
		return {
			...token,
			displayName: realNames.has(strippedName) || !isUnique ? token.name : strippedName,
			iconUrl: getIconUrlFromMarketName(getUnderlyingAsset(token) ?? token.name, "spot"),
			transferDecimals: token.weiDecimals + (token.evmContract?.evm_extra_wei_decimals ?? 0),
			isWrapped: strippedName !== token.name,
		};
	});

	const tokenByIndex = new Map(spotTokens.map((token) => [token.index, token]));

	if (spotTokens.length > 0) {
		for (const pair of spotMeta.universe) {
			const tokensInfo: SpotToken[] = [];
			for (const idx of pair.tokens) {
				const token = tokenByIndex.get(idx);
				if (token) tokensInfo.push(token);
			}

			if (tokensInfo.length < 2) continue;

			const [baseToken, quoteToken] = tokensInfo;
			const displayName = getSpotDisplayName(baseToken.displayName, quoteToken.displayName);

			spotMarkets.push({
				...pair,
				kind: "spot",
				shortName: baseToken.displayName,
				pairName: displayName,
				assetId: getSpotAssetId(pair.index),
				ctxIndex: pair.index,
				tokensInfo,
				szDecimals: baseToken.szDecimals,
				iconUrl: getIconUrlFromMarketName(getUnderlyingAsset(baseToken) ?? baseToken.name, "spot"),
			});
		}
	}

	const builderPerpMarkets: BuilderPerpMarket[] = [];
	if (allPerpMetas.length > 1) {
		for (let dexIndex = 1; dexIndex < allPerpMetas.length; dexIndex++) {
			const meta = allPerpMetas[dexIndex];
			const dexInfo = perpDexs[dexIndex];
			if (!meta || !dexInfo) continue;

			const dexName = dexInfo.name;
			const quoteToken = tokenByIndex.get(meta.collateralToken);

			for (let assetIndex = 0; assetIndex < meta.universe.length; assetIndex++) {
				const asset = meta.universe[assetIndex];
				if (asset.isDelisted) continue;

				builderPerpMarkets.push({
					...asset,
					kind: "builderPerp",
					shortName: getBuilderPerpShortName(asset.name),
					pairName: getBuilderPerpDisplayName(asset.name, quoteToken?.displayName),
					assetId: getBuilderPerpAssetId(dexIndex, assetIndex),
					dex: dexName,
					dexIndex,
					ctxIndex: assetIndex,
					quoteToken,
					iconUrl: getIconUrlFromMarketName(asset.name, "builderPerp"),
				});
			}
		}
	}

	const all: UnifiedMarket[] = [...perpMarkets, ...spotMarkets, ...builderPerpMarkets];

	const byName = new Map<string, UnifiedMarket>();
	for (const market of all) {
		byName.set(market.name, market);
	}

	const tokenByName = new Map(spotTokens.map((token) => [token.name, token]));

	return {
		all,
		perp: perpMarkets,
		spot: spotMarkets,
		builderPerp: builderPerpMarkets,
		tokens: spotTokens,
		byName,
		tokenByName,
	};
}
