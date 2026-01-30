import type { MetaResponse, PerpDexsResponse, SpotMetaResponse } from "@nktkas/hyperliquid";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import { getIconUrlFromMarketName, getTokenDisplayName, getUnderlyingAsset } from "@/domain/market/tokens";
import { useInfoAllPerpMetas } from "../hooks/info/useInfoAllPerpMetas";
import { useInfoMeta } from "../hooks/info/useInfoMeta";
import { useInfoPerpDexs } from "../hooks/info/useInfoPerpDexs";
import { useInfoSpotMeta } from "../hooks/info/useInfoSpotMeta";
import {
	getBuilderPerpAssetId,
	getBuilderPerpDisplayName,
	getPerpAssetId,
	getPerpDisplayName,
	getSpotAssetId,
	getSpotDisplayName,
} from "./helper";
import type { BuilderPerpMarket, Markets, PerpMarket, SpotMarket, SpotToken, UnifiedMarket } from "./types";

interface CreateMarketsParams {
	perpMeta: MetaResponse | undefined;
	spotMeta: SpotMetaResponse | undefined;
	allPerpMetas: MetaResponse[] | undefined;
	perpDexs: PerpDexsResponse | undefined;
	isLoading: boolean;
	error: Error | null;
}

function createMarkets(params: CreateMarketsParams): Markets {
	const { perpMeta, spotMeta, allPerpMetas, perpDexs, isLoading, error } = params;

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
				iconUrl: getIconUrlFromMarketName(asset.name, "perp"),
			});
		}
	}

	const spotMarkets: SpotMarket[] = [];
	const spotTokens: SpotToken[] = (spotMeta?.tokens ?? []).map((token) => {
		const displayName = getTokenDisplayName(token);
		return {
			...token,
			displayName,
			iconUrl: getIconUrlFromMarketName(getUnderlyingAsset(token) ?? token.name, "spot"),
			transferDecimals: token.weiDecimals + (token.evmContract?.evm_extra_wei_decimals ?? 0),
			isWrapped: displayName !== token.name,
		};
	});

	if (spotMeta?.universe && spotTokens.length > 0) {
		for (const pair of spotMeta.universe) {
			const tokensInfo = pair.tokens.map((idx) => spotTokens[idx]).filter((t): t is SpotToken => !!t);

			if (tokensInfo.length < 2) continue;

			const [baseToken, quoteToken] = tokensInfo;
			const displayName = getSpotDisplayName(baseToken.displayName, quoteToken.displayName);

			spotMarkets.push({
				...pair,
				kind: "spot",
				displayName,
				assetId: getSpotAssetId(pair.index),
				ctxIndex: pair.index,
				tokensInfo,
				szDecimals: baseToken.szDecimals,
				iconUrl: getIconUrlFromMarketName(getUnderlyingAsset(baseToken) ?? baseToken.name, "spot"),
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
			const quoteToken = spotTokens[meta.collateralToken] ?? null;

			for (let assetIndex = 0; assetIndex < meta.universe.length; assetIndex++) {
				const asset = meta.universe[assetIndex];
				if (asset.isDelisted) continue;

				builderPerpMarkets.push({
					...asset,
					kind: "builderPerp",
					displayName: getBuilderPerpDisplayName(asset.name, quoteToken?.displayName),
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

	const allMarkets: UnifiedMarket[] = [...perpMarkets, ...spotMarkets, ...builderPerpMarkets];

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

	const spotDisplayNameById = new Map<string, string>();
	if (spotMeta?.universe && spotTokens.length > 0) {
		for (const pair of spotMeta.universe) {
			if (pair.tokens.length < 2) continue;
			const baseToken = spotTokens[pair.tokens[0]];
			const quoteToken = spotTokens[pair.tokens[1]];
			if (baseToken && quoteToken) {
				spotDisplayNameById.set(pair.name, `${baseToken.displayName}/${quoteToken.displayName}`);
			}
		}
	}

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

		getDisplayName(coin: string): string {
			if (coin.startsWith("@")) {
				return spotDisplayNameById.get(coin) ?? coin;
			}
			const market = marketByName.get(coin);
			if (!market) return coin;
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

		getIconUrl(coin: string): string | undefined {
			const market = marketByName.get(coin);
			if (!market) return undefined;
			if (market.kind === "spot") {
				const [base] = market.tokensInfo;
				return getIconUrlFromMarketName(getUnderlyingAsset(base) ?? base.name, market.kind);
			}
			return getIconUrlFromMarketName(market.name, market.kind);
		},

		getToken(coin: string): SpotToken | undefined {
			return tokenByName.get(coin);
		},
	};
}

function createEmptyMarkets(): Markets {
	return createMarkets({
		perpMeta: undefined,
		spotMeta: undefined,
		allPerpMetas: undefined,
		perpDexs: undefined,
		isLoading: true,
		error: null,
	});
}

const MarketsContext = createContext<Markets | null>(null);

interface Props {
	children: ReactNode;
}

export function MarketsProvider({ children }: Props) {
	const { data: perpMeta, isLoading: perpLoading, error: perpError } = useInfoMeta({}, { refetchInterval: Infinity });

	const { data: spotMeta, isLoading: spotLoading, error: spotError } = useInfoSpotMeta({ refetchInterval: Infinity });

	const { data: perpDexs, isLoading: dexsLoading, error: dexsError } = useInfoPerpDexs({ refetchInterval: Infinity });

	const {
		data: allPerpMetas,
		isLoading: allMetasLoading,
		error: allMetasError,
	} = useInfoAllPerpMetas({ refetchInterval: Infinity });

	const isLoading = perpLoading || spotLoading || dexsLoading || allMetasLoading;
	const error = perpError ?? spotError ?? dexsError ?? allMetasError ?? null;

	const markets = useMemo(
		() =>
			createMarkets({
				perpMeta,
				spotMeta,
				allPerpMetas,
				perpDexs,
				isLoading,
				error,
			}),
		[perpMeta, spotMeta, allPerpMetas, perpDexs, isLoading, error],
	);

	return <MarketsContext.Provider value={markets}>{children}</MarketsContext.Provider>;
}

export function useMarkets(): Markets {
	const context = useContext(MarketsContext);

	if (!context) {
		throw new Error("useMarkets must be used within a MarketsProvider");
	}
	return context;
}

export { createEmptyMarkets };
