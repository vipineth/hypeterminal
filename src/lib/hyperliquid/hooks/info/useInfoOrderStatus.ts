import type { InfoClient, OrderStatusParameters, OrderStatusResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type OrderStatusData = OrderStatusResponse;
type OrderStatusParams = OrderStatusParameters;

export type UseInfoOrderStatusParameters = OrderStatusParams;
export type UseInfoOrderStatusOptions<TData = OrderStatusData> = QueryParameter<OrderStatusData, TData>;
export type UseInfoOrderStatusReturnType<TData = OrderStatusData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getOrderStatusQueryOptions(info: InfoClient, params: OrderStatusParams): QueryOptions<OrderStatusData> {
	return {
		queryKey: infoKeys.method("orderStatus", params),
		queryFn: ({ signal }) => info.orderStatus(params, signal),
	};
}

export function useInfoOrderStatus<TData = OrderStatusData>(
	params: UseInfoOrderStatusParameters,
	options: UseInfoOrderStatusOptions<TData> = {},
): UseInfoOrderStatusReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getOrderStatusQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
