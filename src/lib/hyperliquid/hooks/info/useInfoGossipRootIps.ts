import type { GossipRootIpsResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type GossipRootIpsData = GossipRootIpsResponse;

export type UseInfoGossipRootIpsOptions<TData = GossipRootIpsData> = QueryParameter<GossipRootIpsData, TData>;
export type UseInfoGossipRootIpsReturnType<TData = GossipRootIpsData> = UseQueryResult<TData, HyperliquidQueryError> & {
	queryKey: readonly unknown[];
};

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

	return {
		...query,
		queryKey: queryOptions.queryKey,
	};
}
