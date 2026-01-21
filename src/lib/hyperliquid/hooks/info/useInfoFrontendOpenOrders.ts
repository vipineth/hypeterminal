import type { FrontendOpenOrdersParameters, FrontendOpenOrdersResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

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

export function getFrontendOpenOrdersQueryOptions(
	info: InfoClient,
	params: FrontendOpenOrdersParams,
): QueryOptions<FrontendOpenOrdersData> {
	return {
		queryKey: infoKeys.method("frontendOpenOrders", params),
		queryFn: ({ signal }) => info.frontendOpenOrders(params, signal),
	};
}

export function useInfoFrontendOpenOrders<TData = FrontendOpenOrdersData>(
	params: UseInfoFrontendOpenOrdersParameters,
	options: UseInfoFrontendOpenOrdersOptions<TData> = {},
): UseInfoFrontendOpenOrdersReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getFrontendOpenOrdersQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
