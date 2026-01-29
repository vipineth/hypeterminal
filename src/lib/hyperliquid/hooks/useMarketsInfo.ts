import { useMemo } from "react";
import type { MarketCtxNumbers } from "@/lib/market";
import { toFiniteNumber } from "@/lib/trade/numbers";
import { useSelectedMarket } from "@/stores/use-market-store";
import { useMarketsContext } from "../markets/context";
import type { BuilderPerpMarket, PerpMarket, SpotMarket } from "../markets/types";
import { useMarketsInfoContext } from "./MarketsInfoProvider";
import { useSubAllDexsAssetCtxs } from "./subscription/useSubAllDexsAssetCtxs";
import { useSubSpotAssetCtxs } from "./subscription/useSubSpotAssetCtxs";
import { useThrottledValue } from "./utils/useThrottledValue";

export type PerpMarketInfo = PerpMarket & MarketCtxNumbers;
export type SpotMarketInfo = SpotMarket & MarketCtxNumbers;
export type BuilderPerpMarketInfo = BuilderPerpMarket & MarketCtxNumbers;

export type UnifiedMarketInfo = PerpMarketInfo | SpotMarketInfo | BuilderPerpMarketInfo;

export interface BuilderPerpMarketsInfo {
	all: BuilderPerpMarketInfo[];
	[dexName: string]: BuilderPerpMarketInfo[];
}

export interface UseMarketsInfoOptions {
	updateInterval?: number;
}

interface MarketsInfoResult {
	perpMarkets: PerpMarketInfo[];
	spotMarkets: SpotMarketInfo[];
	builderPerpMarkets: BuilderPerpMarketsInfo;
	markets: UnifiedMarketInfo[];
}

export function useMarketsInfoInternal(options: UseMarketsInfoOptions = {}) {
	const { updateInterval = 5000 } = options;

	const markets = useMarketsContext();
	const perpMarkets = markets.perp;
	const spotMarkets = markets.spot;
	const marketsLoading = markets.isLoading;
	const marketsError = markets.error;

	const { data: allDexsCtxsEvent } = useSubAllDexsAssetCtxs({ enabled: true });
	const { data: spotCtxsEvent } = useSubSpotAssetCtxs({ enabled: true });

	const throttledAllDexsCtxs = useThrottledValue(allDexsCtxsEvent, updateInterval);
	const throttledSpotCtxs = useThrottledValue(spotCtxsEvent, updateInterval);

	const result = useMemo((): MarketsInfoResult => {
		const allDexsCtxs = throttledAllDexsCtxs?.ctxs;
		const perpCtxs = allDexsCtxs?.[0]?.[1];

		const perpMarketsInfo: PerpMarketInfo[] = perpMarkets.map((market) => {
			const ctx = perpCtxs?.[market.ctxIndex];
			return {
				...market,
				markPx: toFiniteNumber(ctx?.markPx),
				prevDayPx: toFiniteNumber(ctx?.prevDayPx),
				openInterest: toFiniteNumber(ctx?.openInterest),
				oraclePx: toFiniteNumber(ctx?.oraclePx),
				dayNtlVlm: toFiniteNumber(ctx?.dayNtlVlm),
				funding: toFiniteNumber(ctx?.funding),
			};
		});

		const spotMarketsInfo: SpotMarketInfo[] = spotMarkets.map((market) => {
			const ctx = throttledSpotCtxs?.[market.ctxIndex];
			return {
				...market,
				markPx: toFiniteNumber(ctx?.markPx),
				prevDayPx: toFiniteNumber(ctx?.prevDayPx),
				openInterest: null,
				oraclePx: null,
				dayNtlVlm: toFiniteNumber(ctx?.dayNtlVlm),
				funding: null,
			};
		});

		const builderPerpMarketsInfo: BuilderPerpMarketsInfo = { all: [] };
		const builderPerpsByDex = new Map<string, BuilderPerpMarket[]>();
		for (const market of markets.builderPerp) {
			const existing = builderPerpsByDex.get(market.dex) ?? [];
			existing.push(market);
			builderPerpsByDex.set(market.dex, existing);
		}

		for (const [dexName, dexMarkets] of builderPerpsByDex) {
			if (!dexMarkets.length) continue;

			const dexCtxs = allDexsCtxs?.[dexMarkets[0].dexIndex]?.[1];

			const dexMarketsInfo: BuilderPerpMarketInfo[] = dexMarkets.map((market) => {
				const ctx = dexCtxs?.[market.ctxIndex];
				return {
					...market,
					markPx: toFiniteNumber(ctx?.markPx),
					prevDayPx: toFiniteNumber(ctx?.prevDayPx),
					openInterest: toFiniteNumber(ctx?.openInterest),
					oraclePx: toFiniteNumber(ctx?.oraclePx),
					dayNtlVlm: toFiniteNumber(ctx?.dayNtlVlm),
					funding: toFiniteNumber(ctx?.funding),
				};
			});

			builderPerpMarketsInfo[dexName] = dexMarketsInfo;
			builderPerpMarketsInfo.all.push(...dexMarketsInfo);
		}

		return {
			perpMarkets: perpMarketsInfo,
			spotMarkets: spotMarketsInfo,
			builderPerpMarkets: builderPerpMarketsInfo,
			markets: [...perpMarketsInfo, ...spotMarketsInfo, ...builderPerpMarketsInfo.all],
		};
	}, [perpMarkets, spotMarkets, markets.builderPerp, throttledAllDexsCtxs, throttledSpotCtxs]);

	const marketLookup = useMemo(() => {
		const byName = new Map<string, UnifiedMarketInfo>();
		const byDisplayName = new Map<string, UnifiedMarketInfo>();

		for (const market of result.markets) {
			byName.set(market.name, market);
			byDisplayName.set(market.displayName, market);
		}

		return { byName, byDisplayName };
	}, [result.markets]);

	const getMarketInfo = useMemo(() => {
		return (name: string): UnifiedMarketInfo | undefined => {
			return marketLookup.byName.get(name) ?? marketLookup.byDisplayName.get(name);
		};
	}, [marketLookup]);

	return {
		...result,
		perpDexs: undefined,
		isLoading: marketsLoading,
		error: marketsError,
		getMarketInfo,
	};
}

export type UseMarketsInfoReturn = ReturnType<typeof useMarketsInfoInternal>;

export function useMarketsInfo(): UseMarketsInfoReturn {
	return useMarketsInfoContext();
}

export function useSelectedMarketInfo() {
	const selectedMarketName = useSelectedMarket();
	const { getMarketInfo, isLoading, error } = useMarketsInfo();

	const market = getMarketInfo(selectedMarketName);

	return {
		data: market ?? undefined,
		isLoading,
		error,
		isResolved: !!market,
	};
}
