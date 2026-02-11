import { useEffect, useMemo, useState } from "react";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useSelectedMarket } from "@/stores/use-market-store";
import type { BuilderPerpMarket, PerpMarket, SpotMarket } from "../markets/types";
import { useMarkets } from "../markets/use-markets";
import { useMarketsInfoContext } from "./MarketsInfoProvider";
import type { AllDexsAssetCtxs, DexAssetCtx } from "./subscription/useSubAllDexsAssetCtxs";
import { useSubAllDexsAssetCtxs } from "./subscription/useSubAllDexsAssetCtxs";
import type { SpotAssetCtx } from "./subscription/useSubSpotAssetCtxs";
import { useSubSpotAssetCtxs } from "./subscription/useSubSpotAssetCtxs";

export type PerpMarketInfo = PerpMarket & Partial<DexAssetCtx>;
export type SpotMarketInfo = SpotMarket & Partial<SpotAssetCtx> & Partial<DexAssetCtx>;
export type BuilderPerpMarketInfo = BuilderPerpMarket & Partial<DexAssetCtx>;

export type UnifiedMarketInfo = PerpMarketInfo | SpotMarketInfo | BuilderPerpMarketInfo;

export interface BuilderPerpMarketsInfo {
	all: BuilderPerpMarketInfo[];
	[dexName: string]: BuilderPerpMarketInfo[];
}

export interface UseMarketsInfoOptions {
	updateInterval?: number;
	subscriptionKeepAliveMs?: number;
}

interface MarketsInfoResult {
	perpMarkets: PerpMarketInfo[];
	spotMarkets: SpotMarketInfo[];
	builderPerpMarkets: BuilderPerpMarketsInfo;
	markets: UnifiedMarketInfo[];
}

function useSubscriptionWarmWindow(enabled: boolean, keepAliveMs: number) {
	const [isWarm, setIsWarm] = useState(enabled);

	useEffect(() => {
		if (enabled) {
			setIsWarm(true);
			return;
		}

		if (keepAliveMs <= 0) {
			setIsWarm(false);
			return;
		}

		const timeout = setTimeout(() => {
			setIsWarm(false);
		}, keepAliveMs);

		return () => clearTimeout(timeout);
	}, [enabled, keepAliveMs]);

	return isWarm;
}

function getDexCtxs(allDexsCtxs: AllDexsAssetCtxs | undefined, dexName: string) {
	if (!allDexsCtxs) return undefined;
	const dexEntry = allDexsCtxs.find((entry) => entry[0] === dexName);
	return dexEntry?.[1];
}

export function useMarketsInfoInternal(options: UseMarketsInfoOptions = {}) {
	const { updateInterval = 5000, subscriptionKeepAliveMs = 10_000 } = options;
	const { scope } = useExchangeScope();

	const needsPerp = scope === "all" || scope === "perp" || scope === "builders-perp";
	const needsSpot = scope === "all" || scope === "spot";
	const perpSubscriptionEnabled = useSubscriptionWarmWindow(needsPerp, subscriptionKeepAliveMs);
	const spotSubscriptionEnabled = useSubscriptionWarmWindow(needsSpot, subscriptionKeepAliveMs);

	const markets = useMarkets();
	const { data: allDexsCtxsEvent } = useSubAllDexsAssetCtxs({
		enabled: perpSubscriptionEnabled,
		throttleMs: updateInterval,
	});
	const { data: spotCtxsEvent } = useSubSpotAssetCtxs({
		enabled: spotSubscriptionEnabled,
		throttleMs: updateInterval,
	});

	const result = useMemo((): MarketsInfoResult => {
		const allDexsCtxs = allDexsCtxsEvent?.ctxs;
		const perpCtxs = getDexCtxs(allDexsCtxs, "");

		const perpMarketsInfo: PerpMarketInfo[] = markets.perp.map((market) => ({
			...market,
			...perpCtxs?.[market.ctxIndex],
		}));

		const spotMarketsInfo: SpotMarketInfo[] = markets.spot.map((market) => ({
			...market,
			...spotCtxsEvent?.[market.ctxIndex],
		}));

		const builderPerpMarketsInfo: BuilderPerpMarketsInfo = { all: [] };

		for (const market of markets.builderPerp) {
			const dexCtxs = getDexCtxs(allDexsCtxs, market.dex);
			const marketInfo: BuilderPerpMarketInfo = {
				...market,
				...dexCtxs?.[market.ctxIndex],
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
		const byPairName = new Map<string, UnifiedMarketInfo>();

		for (const market of result.markets) {
			byName.set(market.name, market);
			byPairName.set(market.pairName, market);
		}

		return { byName, byPairName };
	}, [result.markets]);

	const getMarketInfo = useMemo(() => {
		return (name: string): UnifiedMarketInfo | undefined => {
			return marketLookup.byName.get(name) ?? marketLookup.byPairName.get(name);
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
