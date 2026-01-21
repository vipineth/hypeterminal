import type { ActiveAssetDataParameters, ActiveAssetDataResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type ActiveAssetDataData = ActiveAssetDataResponse;
type ActiveAssetDataParams = ActiveAssetDataParameters;

export type UseInfoActiveAssetDataParameters = ActiveAssetDataParams;
export type UseInfoActiveAssetDataOptions<TData = ActiveAssetDataData> = QueryParameter<ActiveAssetDataData, TData>;
export type UseInfoActiveAssetDataReturnType<TData = ActiveAssetDataData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getActiveAssetDataQueryOptions(
	info: InfoClient,
	params: ActiveAssetDataParams,
): QueryOptions<ActiveAssetDataData> {
	return {
		queryKey: infoKeys.method("activeAssetData", params),
		queryFn: ({ signal }) => info.activeAssetData(params, signal),
	};
}

export function useInfoActiveAssetData<TData = ActiveAssetDataData>(
	params: UseInfoActiveAssetDataParameters,
	options: UseInfoActiveAssetDataOptions<TData> = {},
): UseInfoActiveAssetDataReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getActiveAssetDataQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
