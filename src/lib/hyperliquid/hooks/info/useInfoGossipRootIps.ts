import type { GossipRootIpsResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type GossipRootIpsData = GossipRootIpsResponse;

export type UseInfoGossipRootIpsOptions<TData = GossipRootIpsData> = QueryParameter<GossipRootIpsData, TData>;
export type UseInfoGossipRootIpsReturnType<TData = GossipRootIpsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getGossipRootIpsQueryOptions(info: InfoClient): QueryOptions<GossipRootIpsData> {
	return {
		queryKey: infoKeys.method("gossipRootIps"),
		queryFn: ({ signal }) => info.gossipRootIps(signal),
	};
}

export function useInfoGossipRootIps<TData = GossipRootIpsData>(
	options: UseInfoGossipRootIpsOptions<TData> = {},
): UseInfoGossipRootIpsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getGossipRootIpsQueryOptions(info);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
