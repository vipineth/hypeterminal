import type { RecentTradesParameters, RecentTradesResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type RecentTradesData = RecentTradesResponse;
type RecentTradesParams = RecentTradesParameters;

export type UseInfoRecentTradesParameters = RecentTradesParams;
export type UseInfoRecentTradesOptions<TData = RecentTradesData> = QueryParameter<RecentTradesData, TData>;
export type UseInfoRecentTradesReturnType<TData = RecentTradesData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoRecentTrades<TData = RecentTradesData>(
	params: UseInfoRecentTradesParameters,
	options: UseInfoRecentTradesOptions<TData> = {},
): UseInfoRecentTradesReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("recentTrades", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.recentTrades(params, signal),
	});
}
