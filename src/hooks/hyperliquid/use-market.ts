import { useMemo } from "react";
import { makePerpMarketKey } from "@/lib/hyperliquid";
import { useMeta } from "./use-meta";
import { usePerpAssetCtxsSnapshot } from "./use-perp-asset-ctxs-snapshot";

interface MarketsOptions {
	enabled?: boolean;
}

export function useMarkets(options?: MarketsOptions) {
	const enabled = options?.enabled ?? true;
	const { data: meta, isLoading, error, refetch } = useMeta();
	const ctxs = usePerpAssetCtxsSnapshot({ enabled, intervalMs: 10_000 });

	const markets = useMemo(() => {
		if (!meta || !ctxs) return [];

		return meta.universe
			.map((assetMeta, index) => {
				const assetCtx = ctxs[index];

				return {
					marketKey: makePerpMarketKey(assetMeta.name),
					coin: assetMeta.name,
					name: assetMeta.name,
					markPrice: assetCtx?.markPx,
					indexPrice: assetCtx?.oraclePx,
					fundingRate: assetCtx?.funding,
					openInterest: assetCtx?.openInterest,
					volume24h: assetCtx?.dayNtlVlm,
					maxLeverage: assetMeta.maxLeverage,
					szDecimals: assetMeta.szDecimals,
					isDelisted: assetMeta.isDelisted,
				};
			})
			.filter((market) => !market.isDelisted);
	}, [meta, ctxs]);

	return { data: markets, isLoading, error, refetch };
}
