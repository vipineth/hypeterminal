import type { FrontendOpenOrdersParameters, FrontendOpenOrdersResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type FrontendOpenOrdersData = FrontendOpenOrdersResponse;
type FrontendOpenOrdersParams = FrontendOpenOrdersParameters;

export type UseInfoFrontendOpenOrdersParameters = FrontendOpenOrdersParams;
export type UseInfoFrontendOpenOrdersOptions<TData = FrontendOpenOrdersData> = QueryParameter<
	FrontendOpenOrdersData,
	TData
>;
export type UseInfoFrontendOpenOrdersReturnType<TData = FrontendOpenOrdersData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoFrontendOpenOrders<TData = FrontendOpenOrdersData>(
	params: UseInfoFrontendOpenOrdersParameters,
	options: UseInfoFrontendOpenOrdersOptions<TData> = {},
): UseInfoFrontendOpenOrdersReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("frontendOpenOrders", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.frontendOpenOrders(params, signal),
	});
}
