import { useMemo } from "react";
import { useMetaAndAssetCtxs } from "./use-meta-and-asset-ctxs";

interface UseMarketOptions {
	enabled?: boolean;
}

export function useMarket(coin: string, options?: UseMarketOptions) {
	const { data, isLoading, error, refetch } = useMetaAndAssetCtxs({
		enabled: options?.enabled ?? !!coin,
	});

	const market = useMemo(() => {
		if (!data || !coin) return null;

		const [meta, ctxs] = data;
		const assetIndex = meta.universe.findIndex((a) => a.name === coin);

		if (assetIndex === -1) return null;

		const assetMeta = meta.universe[assetIndex];
		const assetCtx = ctxs[assetIndex];

		return {
			coin,
			name: assetMeta.name,
			markPrice: assetCtx?.markPx,
			indexPrice: assetCtx?.oraclePx,
			fundingRate: assetCtx?.funding,
			openInterest: assetCtx?.openInterest,
			volume24h: assetCtx?.dayNtlVlm,
			maxLeverage: assetMeta.maxLeverage,
			szDecimals: assetMeta.szDecimals,
		};
	}, [data, coin]);

	return { data: market, isLoading, error, refetch };
}

interface MarketsOptions {
	enabled?: boolean;
}

export function useMarkets(options?: MarketsOptions) {
	const { data, isLoading, error, refetch } = useMetaAndAssetCtxs({
		enabled: options?.enabled,
	});

	const markets = useMemo(() => {
		if (!data) return [];

		const [meta, ctxs] = data;

		return meta.universe
			.map((assetMeta, index) => {
				const assetCtx = ctxs[index];

				return {
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
	}, [data]);

	return { data: markets, isLoading, error, refetch };
}
