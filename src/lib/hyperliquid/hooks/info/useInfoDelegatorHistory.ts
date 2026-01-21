import type { DelegatorHistoryParameters, DelegatorHistoryResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type DelegatorHistoryData = DelegatorHistoryResponse;
type DelegatorHistoryParams = DelegatorHistoryParameters;

export type UseInfoDelegatorHistoryParameters = DelegatorHistoryParams;
export type UseInfoDelegatorHistoryOptions<TData = DelegatorHistoryData> = QueryParameter<DelegatorHistoryData, TData>;
export type UseInfoDelegatorHistoryReturnType<TData = DelegatorHistoryData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getDelegatorHistoryQueryOptions(
	info: InfoClient,
	params: DelegatorHistoryParams,
): QueryOptions<DelegatorHistoryData> {
	return {
		queryKey: infoKeys.method("delegatorHistory", params),
		queryFn: ({ signal }) => info.delegatorHistory(params, signal),
	};
}

export function useInfoDelegatorHistory<TData = DelegatorHistoryData>(
	params: UseInfoDelegatorHistoryParameters,
	options: UseInfoDelegatorHistoryOptions<TData> = {},
): UseInfoDelegatorHistoryReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getDelegatorHistoryQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
