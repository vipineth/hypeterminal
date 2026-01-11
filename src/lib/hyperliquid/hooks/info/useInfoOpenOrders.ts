import type { OpenOrdersParameters, OpenOrdersResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type OpenOrdersData = OpenOrdersResponse;
type OpenOrdersParams = OpenOrdersParameters;

export type UseInfoOpenOrdersParameters = OpenOrdersParams;
export type UseInfoOpenOrdersOptions<TData = OpenOrdersData> = QueryParameter<OpenOrdersData, TData>;
export type UseInfoOpenOrdersReturnType<TData = OpenOrdersData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoOpenOrders<TData = OpenOrdersData>(
	params: UseInfoOpenOrdersParameters,
	options: UseInfoOpenOrdersOptions<TData> = {},
): UseInfoOpenOrdersReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("openOrders", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.openOrders(params, signal),
	});
}
