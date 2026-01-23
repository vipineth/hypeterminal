import type { MetaResponse, SpotMetaResponse } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { getUnderlyingAsset } from "@/lib/tokens";
import { isBuilderPerpMarketKey, isPerpMarketKey, isSpotMarketKey, parseMarketKey } from "../market-key";
import { useInfoAllPerpMetas } from "./info/useInfoAllPerpMetas";
import { useInfoMeta } from "./info/useInfoMeta";
import { useInfoPerpDexs } from "./info/useInfoPerpDexs";
import { useInfoSpotMeta } from "./info/useInfoSpotMeta";
import {
	getBuilderPerpAssetId,
	getBuilderPerpDisplayNameFromName,
	getMarketKindFromName,
	getPerpAssetId,
	getPerpDisplayName,
	getSpotAssetId,
	getSpotDisplayName,
} from "./utils/markets";

export { getBuilderPerpAssetId, getMarketKindFromName, getPerpAssetId, getSpotAssetId };

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

export interface BuilderPerpMarkets {
	all: BuilderPerpMarket[];
	[dexName: string]: BuilderPerpMarket[];
}

export type UnifiedMarket = PerpMarket | SpotMarket | BuilderPerpMarket;

export interface UseMarketsOptions {
	perp?: boolean;
	spot?: boolean;
	builderDexs?: boolean;
}

export function useMarkets(options: UseMarketsOptions = {}) {
	const { perp = true, spot = false, builderDexs = false } = options;

	const {
		data: perpMeta,
		isLoading: perpLoading,
		error: perpError,
	} = useInfoMeta({}, { enabled: perp, refetchInterval: Infinity });

	const {
		data: spotMeta,
		isLoading: spotLoading,
		error: spotError,
	} = useInfoSpotMeta({ enabled: spot || builderDexs, refetchInterval: Infinity });

	const {
		data: perpDexs,
		isLoading: dexsLoading,
		error: dexsError,
	} = useInfoPerpDexs({ enabled: builderDexs, refetchInterval: Infinity });

	const {
		data: allPerpMetas,
		isLoading: allMetasLoading,
		error: allMetasError,
	} = useInfoAllPerpMetas({
		enabled: builderDexs,
		refetchInterval: Infinity,
	});

	const spotTokens = useMemo((): SpotToken[] => {
		return spotMeta?.tokens ?? [];
	}, [spotMeta?.tokens]);

	const nativePerpMarkets = useMemo((): PerpMarket[] => {
		if (!perpMeta?.universe) return [];
		return perpMeta.universe
			.map((asset, index) => ({
				...asset,
				kind: "perp" as const,
				displayName: getPerpDisplayName(asset.name),
				assetId: getPerpAssetId(index),
				ctxIndex: index,
			}))
			.filter((market) => !market.isDelisted);
	}, [perpMeta]);

	const spotMarkets = useMemo((): SpotMarket[] => {
		if (!spotMeta?.universe || !spotMeta?.tokens) return [];

		return spotMeta.universe
			.map((pair): SpotMarket | null => {
				const tokensInfo = pair.tokens.map((idx) => spotMeta.tokens[idx]).filter((t): t is SpotToken => !!t);

				if (tokensInfo.length < 2) return null;

				const [baseToken, quoteToken] = tokensInfo;
				const underlyingBaseToken = getUnderlyingAsset(baseToken);
				const displayName = getSpotDisplayName(underlyingBaseToken ?? baseToken.name, quoteToken.name);

				return {
					...pair,
					kind: "spot",
					displayName,
					assetId: getSpotAssetId(pair.index),
					ctxIndex: pair.index,
					tokensInfo,
					szDecimals: baseToken.szDecimals,
				};
			})
			.filter((m): m is SpotMarket => m !== null);
	}, [spotMeta]);

	const builderPerpMarkets = useMemo((): BuilderPerpMarkets => {
		const empty: BuilderPerpMarkets = { all: [] };
		if (!allPerpMetas || !perpDexs || allPerpMetas.length <= 1) return empty;

		const result: BuilderPerpMarkets = { all: [] };

		for (let dexIndex = 1; dexIndex < allPerpMetas.length; dexIndex++) {
			const meta = allPerpMetas[dexIndex];
			const dexInfo = perpDexs[dexIndex];

			if (!meta || !dexInfo) continue;

			const dexName = dexInfo.name;
			const quoteToken = spotMeta?.tokens[meta.collateralToken] ?? null;

			result[dexName] = [];

			meta.universe.forEach((asset, assetIndex) => {
				if (asset.isDelisted) return;
				const market: BuilderPerpMarket = {
					...asset,
					kind: "builderPerp",
					displayName: getBuilderPerpDisplayNameFromName(asset.name, quoteToken?.name),
					assetId: getBuilderPerpAssetId(dexIndex, assetIndex),
					dex: dexName,
					dexIndex,
					ctxIndex: assetIndex,
					quoteToken,
				};
				result[dexName].push(market);
				result.all.push(market);
			});
		}

		return result;
	}, [allPerpMetas, perpDexs, spotMeta?.tokens]);

	const markets = useMemo((): UnifiedMarket[] => {
		return [...nativePerpMarkets, ...spotMarkets, ...builderPerpMarkets.all];
	}, [nativePerpMarkets, spotMarkets, builderPerpMarkets]);

	const marketByName = useMemo(() => {
		const map = new Map<string, UnifiedMarket>();
		for (const market of markets) {
			map.set(market.name, market);
		}
		return map;
	}, [markets]);

	const spotByDisplayName = useMemo(() => {
		const map = new Map<string, SpotMarket>();
		for (const market of spotMarkets) {
			map.set(market.displayName, market);
		}
		return map;
	}, [spotMarkets]);

	const getMarket = useCallback(
		(name: string): UnifiedMarket | undefined => {
			return marketByName.get(name);
		},
		[marketByName],
	);

	const getMarketByKey = useCallback(
		(marketKey: string): UnifiedMarket | undefined => {
			if (isPerpMarketKey(marketKey)) {
				const parsed = parseMarketKey(marketKey);
				if (parsed?.kind === "perp") {
					return marketByName.get(parsed.coin);
				}
			}
			if (isSpotMarketKey(marketKey)) {
				const parsed = parseMarketKey(marketKey);
				if (parsed?.kind === "spot") {
					return spotByDisplayName.get(parsed.pair);
				}
			}
			if (isBuilderPerpMarketKey(marketKey)) {
				const parsed = parseMarketKey(marketKey);
				if (parsed?.kind === "builderPerp") {
					return marketByName.get(`${parsed.dex}:${parsed.coin}`);
				}
			}
			return undefined;
		},
		[marketByName, spotByDisplayName],
	);

	const getAssetId = useCallback(
		(name: string): number | undefined => {
			return marketByName.get(name)?.assetId;
		},
		[marketByName],
	);

	const getSzDecimals = useCallback(
		(name: string): number | undefined => {
			return marketByName.get(name)?.szDecimals;
		},
		[marketByName],
	);

	const isLoading =
		(perp && perpLoading) || (spot && spotLoading) || (builderDexs && (dexsLoading || allMetasLoading || spotLoading));

	const error = perpError ?? spotError ?? dexsError ?? allMetasError ?? null;

	return {
		markets,
		perpMarkets: nativePerpMarkets,
		spotMarkets,
		builderPerpMarkets,
		spotTokens,
		perpDexs,
		isLoading,
		error,
		getMarket,
		getMarketByKey,
		getAssetId,
		getSzDecimals,
	};
}

export type UseMarketsReturn = ReturnType<typeof useMarkets>;
