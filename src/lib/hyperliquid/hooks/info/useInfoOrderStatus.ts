import type { OrderStatusParameters, OrderStatusResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

type OrderStatusData = OrderStatusResponse;
type OrderStatusParams = OrderStatusParameters;

export type UseInfoOrderStatusParameters = OrderStatusParams;
export type UseInfoOrderStatusOptions<TData = OrderStatusData> = QueryParameter<OrderStatusData, TData>;
export type UseInfoOrderStatusReturnType<TData = OrderStatusData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoOrderStatus<TData = OrderStatusData>(
	params: UseInfoOrderStatusParameters,
	options: UseInfoOrderStatusOptions<TData> = {},
): UseInfoOrderStatusReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("orderStatus", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.orderStatus(params, signal),
	});
}
