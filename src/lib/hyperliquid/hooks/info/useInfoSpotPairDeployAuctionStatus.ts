import type { InfoClient, SpotPairDeployAuctionStatusResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type SpotPairDeployAuctionStatusData = SpotPairDeployAuctionStatusResponse;

export type UseInfoSpotPairDeployAuctionStatusOptions<TData = SpotPairDeployAuctionStatusData> = QueryParameter<
	SpotPairDeployAuctionStatusData,
	TData
>;
export type UseInfoSpotPairDeployAuctionStatusReturnType<TData = SpotPairDeployAuctionStatusData> = UseQueryResult<
	TData,
	HyperliquidQueryError
> & {
	queryKey: readonly unknown[];
};

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

	return {
		...query,
		queryKey: queryOptions.queryKey,
	};
}
