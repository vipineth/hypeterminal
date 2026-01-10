import type { MetaAndAssetCtxsParameters, MetaAndAssetCtxsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type MetaAndAssetCtxsData = MetaAndAssetCtxsResponse;
type MetaAndAssetCtxsParams = MetaAndAssetCtxsParameters;

export type UseInfoMetaAndAssetCtxsParameters = MetaAndAssetCtxsParams;
export type UseInfoMetaAndAssetCtxsOptions<TData = MetaAndAssetCtxsData> = QueryParameter<MetaAndAssetCtxsData, TData>;
export type UseInfoMetaAndAssetCtxsReturnType<TData = MetaAndAssetCtxsData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoMetaAndAssetCtxs<TData = MetaAndAssetCtxsData>(
	params: UseInfoMetaAndAssetCtxsParameters,
	options: UseInfoMetaAndAssetCtxsOptions<TData> = {},
): UseInfoMetaAndAssetCtxsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("metaAndAssetCtxs", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.metaAndAssetCtxs(params, signal),
	});
}
