import type { InfoClient, SpotPairDeployAuctionStatusResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type SpotPairDeployAuctionStatusData = SpotPairDeployAuctionStatusResponse;

export type UseInfoSpotPairDeployAuctionStatusOptions<TData = SpotPairDeployAuctionStatusData> = QueryParameter<
	SpotPairDeployAuctionStatusData,
	TData
>;
export type UseInfoSpotPairDeployAuctionStatusReturnType<TData = SpotPairDeployAuctionStatusData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getSpotPairDeployAuctionStatusQueryOptions(
	info: InfoClient,
): QueryOptions<SpotPairDeployAuctionStatusData> {
	return {
		queryKey: infoKeys.method("spotPairDeployAuctionStatus"),
		queryFn: ({ signal }) => info.spotPairDeployAuctionStatus(signal),
	};
}

export function useInfoSpotPairDeployAuctionStatus<TData = SpotPairDeployAuctionStatusData>(
	options: UseInfoSpotPairDeployAuctionStatusOptions<TData> = {},
): UseInfoSpotPairDeployAuctionStatusReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getSpotPairDeployAuctionStatusQueryOptions(info);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
