import { useMemo } from "react";
import { DEFAULT_MARKET_KEY } from "@/constants/app";
import { usePerpMarkets } from "@/lib/hl-react";
import { useSubActiveAssetCtx, useSubAllMids } from "@/lib/hl-react/hooks/subscription";
import type { PerpMarketKey } from "@/lib/hyperliquid/market-key";
import { isPerpMarketKey, perpCoinFromMarketKey } from "@/lib/hyperliquid/market-key";
import { getMarketCtxNumbers, type MarketCtxNumbers } from "@/lib/market";
import { toFiniteNumber } from "@/lib/trade/numbers";
import { useSelectedMarketKey } from "@/stores/use-market-prefs-store";
import type { PerpAssetCtx } from "@/types/hyperliquid";
import { usePerpAssetCtxsSnapshot } from "./use-perp-asset-ctxs-snapshot";

export type ResolvedPerpMarket = {
	kind: "perp";
	marketKey: PerpMarketKey;
	coin: string;
	assetIndex?: number;
	assetId?: number;
	szDecimals: number;
	maxLeverage?: number;
	isDelisted?: boolean;
	ctx?: PerpAssetCtx;
	ctxNumbers?: MarketCtxNumbers | null;
	midPx?: string;
	midPxNumber?: number | null;
};

export type ResolvedMarket = ResolvedPerpMarket;

export type UseResolvedMarketOptions = {
	enabled?: boolean;
	ctxMode?: "realtime" | "snapshot" | "none";
	snapshotIntervalMs?: number;
};

const DEFAULT_RESOLVED_MARKET: ResolvedPerpMarket = {
	kind: "perp",
	marketKey: DEFAULT_MARKET_KEY as PerpMarketKey,
	coin: perpCoinFromMarketKey(DEFAULT_MARKET_KEY as PerpMarketKey),
	szDecimals: 5,
	maxLeverage: 40,
};

export function useResolvedMarket(marketKey: string | undefined, options: UseResolvedMarketOptions = {}) {
	const { enabled = true, ctxMode = "realtime", snapshotIntervalMs } = options;

	const perpMarkets = usePerpMarkets();
	const { getAssetId, getSzDecimals, getMaxLeverage, isDelisted, data: marketsData } = perpMarkets;

	const perpMarketKey = marketKey && isPerpMarketKey(marketKey) ? marketKey : undefined;
	const coin = perpMarketKey ? perpCoinFromMarketKey(perpMarketKey) : undefined;

	const assetIndex = coin ? getAssetId(coin) : undefined;
	const szDecimals = coin ? getSzDecimals(coin) : undefined;
	const maxLeverage = coin ? getMaxLeverage(coin) : undefined;
	const coinIsDelisted = coin ? isDelisted(coin) : undefined;

	const { data: midsEvent } = useSubAllMids(
		{},
		{
			enabled: enabled && ctxMode !== "none",
		},
	);
	const mids = midsEvent?.mids;

	const { data: activeCtxEvent } = useSubActiveAssetCtx(
		{ coin: coin ?? "" },
		{
			enabled: enabled && ctxMode === "realtime" && !!coin,
		},
	);
	const activeCtx = activeCtxEvent?.ctx as PerpAssetCtx | undefined;

	const snapshotCtxs = usePerpAssetCtxsSnapshot({
		enabled: enabled && ctxMode === "snapshot",
		intervalMs: snapshotIntervalMs,
	});

	const ctx =
		ctxMode === "realtime"
			? activeCtx
			: ctxMode === "snapshot" && typeof assetIndex === "number"
				? snapshotCtxs?.[assetIndex]
				: undefined;

	const resolved = useMemo<ResolvedMarket | undefined>(() => {
		if (!perpMarketKey || !coin) return undefined;

		const ctxNumbers = getMarketCtxNumbers(ctx);
		const midPx = coin ? mids?.[coin] : undefined;
		const midPxNumber = toFiniteNumber(midPx);

		return {
			kind: "perp",
			marketKey: perpMarketKey,
			coin,
			assetIndex,
			assetId: assetIndex,
			szDecimals: szDecimals ?? DEFAULT_RESOLVED_MARKET.szDecimals,
			maxLeverage,
			isDelisted: coinIsDelisted,
			ctx,
			ctxNumbers,
			midPx,
			midPxNumber,
		};
	}, [perpMarketKey, coin, assetIndex, szDecimals, maxLeverage, coinIsDelisted, ctx, mids]);

	return {
		data: resolved,
		isLoading: perpMarkets.isLoading,
		error: perpMarkets.error,
		refetch: perpMarkets.refetch,
		markets: marketsData,
	};
}

export function useSelectedResolvedMarket(options?: Omit<UseResolvedMarketOptions, "enabled">) {
	const selectedMarketKey = useSelectedMarketKey();
	const result = useResolvedMarket(selectedMarketKey, { ...options, ctxMode: options?.ctxMode ?? "realtime" });

	const dataWithDefaults = useMemo<ResolvedPerpMarket>(() => {
		if (result.data) return result.data;
		if (!selectedMarketKey || !isPerpMarketKey(selectedMarketKey)) return DEFAULT_RESOLVED_MARKET;
		return {
			...DEFAULT_RESOLVED_MARKET,
			marketKey: selectedMarketKey,
			coin: perpCoinFromMarketKey(selectedMarketKey),
		};
	}, [result.data, selectedMarketKey]);

	return { ...result, data: dataWithDefaults };
}
