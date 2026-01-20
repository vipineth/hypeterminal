import type { InfoClient, OpenOrdersParameters, OpenOrdersResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type OpenOrdersData = OpenOrdersResponse;
type OpenOrdersParams = OpenOrdersParameters;

export type UseInfoOpenOrdersParameters = OpenOrdersParams;
export type UseInfoOpenOrdersOptions<TData = OpenOrdersData> = QueryParameter<OpenOrdersData, TData>;
export type UseInfoOpenOrdersReturnType<TData = OpenOrdersData> = UseQueryResult<TData, HyperliquidQueryError> & {
	queryKey: readonly unknown[];
};

export function getOpenOrdersQueryOptions(info: InfoClient, params: OpenOrdersParams): QueryOptions<OpenOrdersData> {
	return {
		queryKey: infoKeys.method("openOrders", params),
		queryFn: ({ signal }) => info.openOrders(params, signal),
	};
}

export function useInfoOpenOrders<TData = OpenOrdersData>(
	params: UseInfoOpenOrdersParameters,
	options: UseInfoOpenOrdersOptions<TData> = {},
): UseInfoOpenOrdersReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getOpenOrdersQueryOptions(info, params);
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
