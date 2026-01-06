import type { GossipRootIpsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type GossipRootIpsData = GossipRootIpsResponse;

export type UseInfoGossipRootIpsOptions<TData = GossipRootIpsData> = QueryParameter<GossipRootIpsData, TData>;
export type UseInfoGossipRootIpsReturnType<TData = GossipRootIpsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoGossipRootIps<TData = GossipRootIpsData>(
	options: UseInfoGossipRootIpsOptions<TData> = {},
): UseInfoGossipRootIpsReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("gossipRootIps");

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.gossipRootIps(signal),
	});
}
