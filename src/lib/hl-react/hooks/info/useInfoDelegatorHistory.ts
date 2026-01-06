import type { DelegatorHistoryParameters, DelegatorHistoryResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type DelegatorHistoryData = DelegatorHistoryResponse;
type DelegatorHistoryParams = DelegatorHistoryParameters;

export type UseInfoDelegatorHistoryParameters = DelegatorHistoryParams;
export type UseInfoDelegatorHistoryOptions<TData = DelegatorHistoryData> = QueryParameter<DelegatorHistoryData, TData>;
export type UseInfoDelegatorHistoryReturnType<TData = DelegatorHistoryData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoDelegatorHistory<TData = DelegatorHistoryData>(
	params: UseInfoDelegatorHistoryParameters,
	options: UseInfoDelegatorHistoryOptions<TData> = {},
): UseInfoDelegatorHistoryReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("delegatorHistory", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.delegatorHistory(params, signal),
	});
}
