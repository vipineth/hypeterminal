import { useMemo } from "react";
import type { MarketCtxNumbers } from "@/lib/market";
import { toFiniteNumber } from "@/lib/trade/numbers";
import { useSelectedMarket } from "@/stores/use-market-store";
import type { BuilderPerpMarket, PerpMarket, SpotMarket } from "../markets/types";
import { useMarkets } from "../markets/use-markets";
import { useMarketsInfoContext } from "./MarketsInfoProvider";
import type { AllDexsAssetCtxs } from "./subscription/useSubAllDexsAssetCtxs";
import { useSubAllDexsAssetCtxs } from "./subscription/useSubAllDexsAssetCtxs";
import { useSubSpotAssetCtxs } from "./subscription/useSubSpotAssetCtxs";

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

function getDexCtxs(allDexsCtxs: AllDexsAssetCtxs | undefined, dexName: string) {
	if (!allDexsCtxs) return undefined;
	const dexEntry = allDexsCtxs.find((entry) => entry[0] === dexName);
	return dexEntry?.[1];
}

function getPerpCtxNumbers(
	ctx:
		| {
				markPx?: string;
				prevDayPx?: string;
				openInterest?: string;
				oraclePx?: string;
				dayNtlVlm?: string;
				funding?: string;
		  }
		| undefined,
): MarketCtxNumbers {
	return {
		markPx: toFiniteNumber(ctx?.markPx),
		prevDayPx: toFiniteNumber(ctx?.prevDayPx),
		openInterest: toFiniteNumber(ctx?.openInterest),
		oraclePx: toFiniteNumber(ctx?.oraclePx),
		dayNtlVlm: toFiniteNumber(ctx?.dayNtlVlm),
		funding: toFiniteNumber(ctx?.funding),
	};
}

function getSpotCtxNumbers(
	ctx: { markPx?: string; prevDayPx?: string; dayNtlVlm?: string } | undefined,
): MarketCtxNumbers {
	return {
		markPx: toFiniteNumber(ctx?.markPx),
		prevDayPx: toFiniteNumber(ctx?.prevDayPx),
		openInterest: null,
		oraclePx: null,
		dayNtlVlm: toFiniteNumber(ctx?.dayNtlVlm),
		funding: null,
	};
}

export function useMarketsInfoInternal(options: UseMarketsInfoOptions = {}) {
	const { updateInterval = 5000 } = options;

	const markets = useMarkets();
	const { data: allDexsCtxsEvent } = useSubAllDexsAssetCtxs({ enabled: true, throttleMs: updateInterval });
	const { data: spotCtxsEvent } = useSubSpotAssetCtxs({ enabled: true, throttleMs: updateInterval });

	const result = useMemo((): MarketsInfoResult => {
		const allDexsCtxs = allDexsCtxsEvent?.ctxs;
		const perpCtxs = getDexCtxs(allDexsCtxs, "");

		const perpMarketsInfo: PerpMarketInfo[] = markets.perp.map((market) => ({
			...market,
			...getPerpCtxNumbers(perpCtxs?.[market.ctxIndex]),
		}));

		const spotMarketsInfo: SpotMarketInfo[] = markets.spot.map((market) => ({
			...market,
			...getSpotCtxNumbers(spotCtxsEvent?.[market.ctxIndex]),
		}));

		const builderPerpMarketsInfo: BuilderPerpMarketsInfo = { all: [] };

		for (const market of markets.builderPerp) {
			const dexCtxs = getDexCtxs(allDexsCtxs, market.dex);
			const marketInfo: BuilderPerpMarketInfo = {
				...market,
				...getPerpCtxNumbers(dexCtxs?.[market.ctxIndex]),
			};

			builderPerpMarketsInfo.all.push(marketInfo);

			if (!builderPerpMarketsInfo[market.dex]) {
				builderPerpMarketsInfo[market.dex] = [];
			}
			builderPerpMarketsInfo[market.dex].push(marketInfo);
		}

		return {
			perpMarkets: perpMarketsInfo,
			spotMarkets: spotMarketsInfo,
			builderPerpMarkets: builderPerpMarketsInfo,
			markets: [...perpMarketsInfo, ...spotMarketsInfo, ...builderPerpMarketsInfo.all],
		};
	}, [markets.perp, markets.spot, markets.builderPerp, allDexsCtxsEvent, spotCtxsEvent]);

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
		isLoading: markets.isLoading,
		error: markets.error,
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
