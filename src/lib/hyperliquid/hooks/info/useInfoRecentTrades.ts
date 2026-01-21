import type { InfoClient, RecentTradesParameters, RecentTradesResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type RecentTradesData = RecentTradesResponse;
type RecentTradesParams = RecentTradesParameters;

export type UseInfoRecentTradesParameters = RecentTradesParams;
export type UseInfoRecentTradesOptions<TData = RecentTradesData> = QueryParameter<RecentTradesData, TData>;
export type UseInfoRecentTradesReturnType<TData = RecentTradesData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getRecentTradesQueryOptions(
	info: InfoClient,
	params: RecentTradesParams,
): QueryOptions<RecentTradesData> {
	return {
		queryKey: infoKeys.method("recentTrades", params),
		queryFn: ({ signal }) => info.recentTrades(params, signal),
	};
}

export function useInfoRecentTrades<TData = RecentTradesData>(
	params: UseInfoRecentTradesParameters,
	options: UseInfoRecentTradesOptions<TData> = {},
): UseInfoRecentTradesReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getRecentTradesQueryOptions(info, params);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
