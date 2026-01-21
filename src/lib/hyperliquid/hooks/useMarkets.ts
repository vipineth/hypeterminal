import { useMemo, useCallback } from "react";
import type { Address } from "viem";
import { calculateAssetId } from "../asset-id";
import {
	makePerpMarketKey,
	makeSpotMarketKey,
	makeBuilderPerpMarketKey,
	parseMarketKey,
} from "../market-key";
import type {
	MarketInfo,
	PerpMarketInfo,
	SpotMarketInfo,
	BuilderPerpMarketInfo,
	MarketsData,
	DexInfo,
	UseMarketsOptions,
	UseMarketsReturn,
} from "../types/markets";
import { useInfoMeta } from "./info/useInfoMeta";
import { useInfoSpotMeta } from "./info/useInfoSpotMeta";
import { useInfoPerpDexs } from "./info/useInfoPerpDexs";
import { useInfoAllPerpMetas } from "./info/useInfoAllPerpMetas";

const DEFAULT_OPTIONS: Required<UseMarketsOptions> = {
	perp: true,
	spot: false,
	builderDexs: false,
	excludeDelisted: true,
};

export function useMarkets(options: UseMarketsOptions = {}): UseMarketsReturn {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	const { data: perpMeta, isLoading: perpLoading, error: perpError, refetch: refetchPerp } = useInfoMeta(
		{},
		{ enabled: opts.perp },
	);

	const { data: spotMeta, isLoading: spotLoading, error: spotError, refetch: refetchSpot } = useInfoSpotMeta({
		enabled: opts.spot,
	});

	const loadBuilderDexs = opts.builderDexs === true || (Array.isArray(opts.builderDexs) && opts.builderDexs.length > 0);

	const { data: perpDexs, isLoading: dexsLoading, error: dexsError, refetch: refetchDexs } = useInfoPerpDexs({
		enabled: loadBuilderDexs,
	});

	const { data: allPerpMetas, isLoading: allMetasLoading, error: allMetasError, refetch: refetchAllMetas } =
		useInfoAllPerpMetas({
			enabled: loadBuilderDexs,
		});

	const dexInfoMap = useMemo((): ReadonlyMap<string, DexInfo> => {
		if (!perpDexs) return new Map();

		const map = new Map<string, DexInfo>();
		perpDexs.forEach((dex, index) => {
			if (dex === null) return;
			map.set(dex.name, {
				name: dex.name,
				fullName: dex.fullName,
				deployer: dex.deployer as Address,
				oracleUpdater: (dex.oracleUpdater as Address) ?? null,
				feeRecipient: (dex.feeRecipient as Address) ?? null,
				dexIndex: index,
			});
		});
		return map;
	}, [perpDexs]);

	const marketsData = useMemo((): MarketsData | undefined => {
		const markets: MarketInfo[] = [];
		const perpMarkets: PerpMarketInfo[] = [];
		const spotMarkets: SpotMarketInfo[] = [];
		const builderMarkets: BuilderPerpMarketInfo[] = [];
		const byMarketKey = new Map<string, MarketInfo>();
		const byCoin = new Map<string, MarketInfo>();
		const byAssetId = new Map<number, MarketInfo>();

		if (opts.perp && perpMeta?.universe) {
			perpMeta.universe.forEach((asset, index) => {
				if (opts.excludeDelisted && asset.isDelisted) return;

				const marketKey = makePerpMarketKey(asset.name);
				const assetId = calculateAssetId("perp", index);

				const info: PerpMarketInfo = {
					kind: "perp",
					marketKey,
					coin: asset.name,
					assetId,
					szDecimals: asset.szDecimals,
					maxLeverage: asset.maxLeverage,
					isDelisted: asset.isDelisted === true,
					onlyIsolated: asset.onlyIsolated === true,
					marginTableId: asset.marginTableId,
				};

				markets.push(info);
				perpMarkets.push(info);
				byMarketKey.set(marketKey, info);
				byCoin.set(asset.name, info);
				byAssetId.set(assetId, info);
			});
		}

		if (opts.spot && spotMeta?.universe && spotMeta?.tokens) {
			const tokenMap = new Map(spotMeta.tokens.map((t) => [t.index, t]));

			spotMeta.universe.forEach((pair) => {
				const [baseIdx, quoteIdx] = pair.tokens;
				const baseToken = tokenMap.get(baseIdx);
				const quoteToken = tokenMap.get(quoteIdx);

				if (!baseToken || !quoteToken) return;

				const marketKey = makeSpotMarketKey(pair.name);
				const assetId = calculateAssetId("spot", pair.index);
				const spotPairId = pair.isCanonical ? `@${pair.index}` : pair.name;

				const info: SpotMarketInfo = {
					kind: "spot",
					marketKey,
					coin: pair.name,
					assetId,
					szDecimals: baseToken.szDecimals,
					isDelisted: false,
					baseToken: baseToken.name,
					quoteToken: quoteToken.name,
					spotPairId,
					pairIndex: pair.index,
					baseTokenIndex: baseIdx,
					quoteTokenIndex: quoteIdx,
				};

				markets.push(info);
				spotMarkets.push(info);
				byMarketKey.set(marketKey, info);
				byCoin.set(pair.name, info);
				byAssetId.set(assetId, info);
			});
		}

		if (loadBuilderDexs && allPerpMetas && perpDexs) {
			const dexFilter = Array.isArray(opts.builderDexs) ? new Set(opts.builderDexs) : null;

			allPerpMetas.forEach((meta, dexIndex) => {
				if (dexIndex === 0) return;

				const dexInfo = perpDexs[dexIndex];
				if (!dexInfo) return;

				if (dexFilter && !dexFilter.has(dexInfo.name)) return;

				meta.universe.forEach((asset, assetIndex) => {
					if (opts.excludeDelisted && asset.isDelisted) return;

					const marketKey = makeBuilderPerpMarketKey(dexInfo.name, asset.name);
					const assetId = calculateAssetId("builderPerp", assetIndex, dexIndex);
					const displayCoin = `${dexInfo.name}:${asset.name}`;

					const info: BuilderPerpMarketInfo = {
						kind: "builderPerp",
						marketKey,
						coin: displayCoin,
						assetId,
						szDecimals: asset.szDecimals,
						maxLeverage: asset.maxLeverage,
						isDelisted: asset.isDelisted === true,
						onlyIsolated: asset.onlyIsolated === true,
						marginTableId: asset.marginTableId,
						dex: dexInfo.name,
						dexFullName: dexInfo.fullName,
						dexIndex,
					};

					markets.push(info);
					builderMarkets.push(info);
					byMarketKey.set(marketKey, info);
					byCoin.set(displayCoin, info);
					byAssetId.set(assetId, info);
				});
			});
		}

		if (markets.length === 0 && (opts.perp || opts.spot || loadBuilderDexs)) {
			return undefined;
		}

		return {
			markets,
			perpMarkets,
			spotMarkets,
			builderMarkets,
			byMarketKey,
			byCoin,
			byAssetId,
			dexes: dexInfoMap,
		};
	}, [perpMeta, spotMeta, allPerpMetas, perpDexs, dexInfoMap, opts.perp, opts.spot, opts.builderDexs, opts.excludeDelisted, loadBuilderDexs]);

	const getAssetId = useCallback(
		(marketKey: string): number | undefined => marketsData?.byMarketKey.get(marketKey)?.assetId,
		[marketsData],
	);

	const getSzDecimals = useCallback(
		(marketKey: string): number | undefined => marketsData?.byMarketKey.get(marketKey)?.szDecimals,
		[marketsData],
	);

	const getMaxLeverage = useCallback(
		(marketKey: string): number | undefined => {
			const info = marketsData?.byMarketKey.get(marketKey);
			if (!info) return undefined;
			if (info.kind === "spot") return undefined;
			return info.maxLeverage;
		},
		[marketsData],
	);

	const getMarketInfo = useCallback(
		(marketKey: string): MarketInfo | undefined => marketsData?.byMarketKey.get(marketKey),
		[marketsData],
	);

	const isDelisted = useCallback(
		(marketKey: string): boolean => marketsData?.byMarketKey.get(marketKey)?.isDelisted ?? false,
		[marketsData],
	);

	const getSpotPairId = useCallback(
		(marketKey: string): string | undefined => {
			const info = marketsData?.byMarketKey.get(marketKey);
			if (!info || info.kind !== "spot") return undefined;
			return info.spotPairId;
		},
		[marketsData],
	);

	const getDex = useCallback(
		(marketKey: string): string | undefined => {
			const parsed = parseMarketKey(marketKey);
			if (!parsed || parsed.kind !== "builderPerp") return undefined;
			return parsed.dex;
		},
		[],
	);

	const availableDexs = useMemo((): string[] => {
		return Array.from(dexInfoMap.keys());
	}, [dexInfoMap]);

	const getMarketsForDex = useCallback(
		(dex: string): BuilderPerpMarketInfo[] => {
			if (!marketsData) return [];
			return marketsData.builderMarkets.filter((m) => m.dex === dex);
		},
		[marketsData],
	);

	const getDexInfo = useCallback(
		(dex: string): DexInfo | undefined => dexInfoMap.get(dex),
		[dexInfoMap],
	);

	const refetch = useCallback(async () => {
		const promises: Promise<unknown>[] = [];
		if (opts.perp) promises.push(refetchPerp());
		if (opts.spot) promises.push(refetchSpot());
		if (loadBuilderDexs) {
			promises.push(refetchDexs());
			promises.push(refetchAllMetas());
		}
		await Promise.all(promises);
	}, [opts.perp, opts.spot, loadBuilderDexs, refetchPerp, refetchSpot, refetchDexs, refetchAllMetas]);

	const isLoading = (opts.perp && perpLoading) || (opts.spot && spotLoading) || (loadBuilderDexs && (dexsLoading || allMetasLoading));

	const error = perpError ?? spotError ?? dexsError ?? allMetasError ?? null;

	return {
		data: marketsData,
		isLoading,
		error,
		refetch,
		getAssetId,
		getSzDecimals,
		getMaxLeverage,
		getMarketInfo,
		isDelisted,
		getSpotPairId,
		getDex,
		availableDexs,
		getMarketsForDex,
		getDexInfo,
	};
}
