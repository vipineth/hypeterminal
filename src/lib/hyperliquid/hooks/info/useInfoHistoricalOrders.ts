import type { HistoricalOrdersParameters, HistoricalOrdersResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type HistoricalOrdersData = HistoricalOrdersResponse;
type HistoricalOrdersParams = HistoricalOrdersParameters;

export type UseInfoHistoricalOrdersParameters = HistoricalOrdersParams;
export type UseInfoHistoricalOrdersOptions<TData = HistoricalOrdersData> = QueryParameter<HistoricalOrdersData, TData>;
export type UseInfoHistoricalOrdersReturnType<TData = HistoricalOrdersData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoHistoricalOrders<TData = HistoricalOrdersData>(
	params: UseInfoHistoricalOrdersParameters,
	options: UseInfoHistoricalOrdersOptions<TData> = {},
): UseInfoHistoricalOrdersReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("historicalOrders", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.historicalOrders(params, signal),
	});
}
