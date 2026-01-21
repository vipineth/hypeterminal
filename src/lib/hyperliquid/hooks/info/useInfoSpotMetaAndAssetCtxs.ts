import type { InfoClient, SpotMetaAndAssetCtxsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type SpotMetaAndAssetCtxsData = SpotMetaAndAssetCtxsResponse;

export type UseInfoSpotMetaAndAssetCtxsOptions<TData = SpotMetaAndAssetCtxsData> = QueryParameter<
	SpotMetaAndAssetCtxsData,
	TData
>;
export type UseInfoSpotMetaAndAssetCtxsReturnType<TData = SpotMetaAndAssetCtxsData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getSpotMetaAndAssetCtxsQueryOptions(info: InfoClient): QueryOptions<SpotMetaAndAssetCtxsData> {
	return {
		queryKey: infoKeys.method("spotMetaAndAssetCtxs"),
		queryFn: ({ signal }) => info.spotMetaAndAssetCtxs(signal),
	};
}

export function useInfoSpotMetaAndAssetCtxs<TData = SpotMetaAndAssetCtxsData>(
	options: UseInfoSpotMetaAndAssetCtxsOptions<TData> = {},
): UseInfoSpotMetaAndAssetCtxsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getSpotMetaAndAssetCtxsQueryOptions(info);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
