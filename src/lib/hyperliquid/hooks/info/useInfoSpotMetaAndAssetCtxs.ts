import type { SpotMetaAndAssetCtxsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SpotMetaAndAssetCtxsData = SpotMetaAndAssetCtxsResponse;

export type UseInfoSpotMetaAndAssetCtxsOptions<TData = SpotMetaAndAssetCtxsData> = QueryParameter<
	SpotMetaAndAssetCtxsData,
	TData
>;
export type UseInfoSpotMetaAndAssetCtxsReturnType<TData = SpotMetaAndAssetCtxsData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoSpotMetaAndAssetCtxs<TData = SpotMetaAndAssetCtxsData>(
	options: UseInfoSpotMetaAndAssetCtxsOptions<TData> = {},
): UseInfoSpotMetaAndAssetCtxsReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("spotMetaAndAssetCtxs");

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.spotMetaAndAssetCtxs(signal),
	});
}
