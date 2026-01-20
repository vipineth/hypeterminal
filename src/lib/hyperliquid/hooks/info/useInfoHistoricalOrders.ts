import type { HistoricalOrdersParameters, HistoricalOrdersResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type HistoricalOrdersData = HistoricalOrdersResponse;
type HistoricalOrdersParams = HistoricalOrdersParameters;

export type UseInfoHistoricalOrdersParameters = HistoricalOrdersParams;
export type UseInfoHistoricalOrdersOptions<TData = HistoricalOrdersData> = QueryParameter<HistoricalOrdersData, TData>;
export type UseInfoHistoricalOrdersReturnType<TData = HistoricalOrdersData> = UseQueryResult<
	TData,
	HyperliquidQueryError
> & {
	queryKey: readonly unknown[];
};

export function getHistoricalOrdersQueryOptions(
	info: InfoClient,
	params: HistoricalOrdersParams,
): QueryOptions<HistoricalOrdersData> {
	return {
		queryKey: infoKeys.method("historicalOrders", params),
		queryFn: ({ signal }) => info.historicalOrders(params, signal),
	};
}

export function useInfoHistoricalOrders<TData = HistoricalOrdersData>(
	params: UseInfoHistoricalOrdersParameters,
	options: UseInfoHistoricalOrdersOptions<TData> = {},
): UseInfoHistoricalOrdersReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getHistoricalOrdersQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return {
		...query,
		queryKey: queryOptions.queryKey,
	};
}
