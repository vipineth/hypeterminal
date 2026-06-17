import {
	type BuilderPerpMarket,
	type PerpMarket,
	type SpotMarket,
	useInfo,
	useSubscription,
} from "@hypeterminal/hl-react";
import { useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "@/config/app";
import { MARKETS_STATS_TTL_MS } from "@/config/time";
import { loadLastMark, saveLastMark } from "@/lib/last-mark-cache";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useSelectedMarket } from "@/stores/use-market-store";
import type { AllDexsAssetCtxs, DexAssetCtx, SpotAssetCtx, SpotAssetCtxs } from "@/types/hyperliquid";
import { useMarkets } from "../markets/use-markets";
import { useMarketsInfoContext } from "./MarketsInfoProvider";

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
	alwaysSubscribeAll?: boolean;
}

interface MarketsInfoResult {
	perpMarkets: PerpMarketInfo[];
	spotMarkets: SpotMarketInfo[];
	builderPerpMarkets: BuilderPerpMarketsInfo;
	markets: UnifiedMarketInfo[];
}

interface StatsCache {
	allDexsCtxs: AllDexsAssetCtxs | undefined;
	spotCtxs: SpotAssetCtxs | undefined;
	savedAt: number;
}

function loadStatsCache(): StatsCache | null {
	if (typeof window === "undefined") return null;
	try {
		const json = localStorage.getItem(STORAGE_KEYS.MARKETS_STATS);
		if (!json) return null;
		const data = JSON.parse(json) as StatsCache;
		if (Date.now() - data.savedAt > MARKETS_STATS_TTL_MS) {
			localStorage.removeItem(STORAGE_KEYS.MARKETS_STATS);
			return null;
		}
		return data;
	} catch {
		return null;
	}
}

function saveStatsCache(allDexsCtxs: AllDexsAssetCtxs | undefined, spotCtxs: SpotAssetCtxs | undefined) {
	if (typeof window === "undefined") return;
	if (!allDexsCtxs && !spotCtxs) return;
	try {
		const data: StatsCache = { allDexsCtxs, spotCtxs, savedAt: Date.now() };
		localStorage.setItem(STORAGE_KEYS.MARKETS_STATS, JSON.stringify(data));
	} catch {}
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
	const { updateInterval = 5000, subscriptionKeepAliveMs = 10_000, alwaysSubscribeAll = false } = options;
	const { scope } = useExchangeScope();

	const needsPerp = alwaysSubscribeAll || scope === "all" || scope === "perp" || scope === "builders-perp";
	const needsSpot = alwaysSubscribeAll || scope === "all" || scope === "spot";
	const perpSubscriptionEnabled = useSubscriptionWarmWindow(needsPerp, subscriptionKeepAliveMs);
	const spotSubscriptionEnabled = useSubscriptionWarmWindow(needsSpot, subscriptionKeepAliveMs);

	const markets = useMarkets();
	const { data: allDexsCtxsEvent } = useSubscription("allDexsAssetCtxs", undefined, {
		enabled: perpSubscriptionEnabled,
		throttleMs: updateInterval,
	});
	const { data: spotCtxsEvent } = useSubscription("spotAssetCtxs", undefined, {
		enabled: spotSubscriptionEnabled,
		throttleMs: updateInterval,
	});

	const [cachedStats] = useState(() => loadStatsCache());

	// HTTP snapshots bridge the gap until the first WS push (~2-10s after load).
	// Disabled once WS data or a cached copy exists; main perp dex + spot only —
	// builder-dex stats fill in when allDexsAssetCtxs arrives.
	const { data: perpSnapshot } = useInfo("metaAndAssetCtxs", undefined, {
		staleTime: Infinity,
		enabled: !allDexsCtxsEvent && !cachedStats?.allDexsCtxs,
	});
	const { data: spotSnapshot } = useInfo("spotMetaAndAssetCtxs", undefined, {
		staleTime: Infinity,
		enabled: !spotCtxsEvent && !cachedStats?.spotCtxs,
	});

	useEffect(() => {
		saveStatsCache(allDexsCtxsEvent?.ctxs, spotCtxsEvent);
	}, [allDexsCtxsEvent, spotCtxsEvent]);

	const snapshotDexsCtxs: AllDexsAssetCtxs | undefined = perpSnapshot ? [["", perpSnapshot[1]]] : undefined;
	const allDexsCtxs = allDexsCtxsEvent?.ctxs ?? cachedStats?.allDexsCtxs ?? snapshotDexsCtxs;
	const spotCtxs = spotCtxsEvent ?? cachedStats?.spotCtxs ?? spotSnapshot?.[1];

	const result = useMemo((): MarketsInfoResult => {
		const perpCtxs = getDexCtxs(allDexsCtxs, "");

		const perpMarketsInfo: PerpMarketInfo[] = markets.perp.map((market) => ({
			...market,
			...perpCtxs?.[market.ctxIndex],
		}));

		const spotMarketsInfo: SpotMarketInfo[] = markets.spot.map((market) => ({
			...market,
			...spotCtxs?.[market.ctxIndex],
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
	}, [markets.perp, markets.spot, markets.builderPerp, allDexsCtxs, spotCtxs]);

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

	useEffect(() => {
		if (!selectedMarketName || !market || market.name !== selectedMarketName) return;
		const liveMark = market.markPx;
		if (!liveMark) return;
		saveLastMark(selectedMarketName, liveMark, market.oraclePx);
	}, [selectedMarketName, market]);

	const data = useMemo(() => {
		if (!market) return undefined;
		if (market.markPx) return market;
		const cached = selectedMarketName ? loadLastMark(selectedMarketName) : null;
		if (!cached) return market;
		return { ...market, markPx: cached.markPx, oraclePx: market.oraclePx ?? cached.oraclePx };
	}, [market, selectedMarketName]);

	return {
		data,
		isLoading,
		error,
		isResolved: !!market,
	};
}
