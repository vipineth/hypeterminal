import type { SpotPairDeployAuctionStatusResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type SpotPairDeployAuctionStatusData = SpotPairDeployAuctionStatusResponse;

export type UseInfoSpotPairDeployAuctionStatusOptions<TData = SpotPairDeployAuctionStatusData> = QueryParameter<
	SpotPairDeployAuctionStatusData,
	TData
>;
export type UseInfoSpotPairDeployAuctionStatusReturnType<TData = SpotPairDeployAuctionStatusData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoSpotPairDeployAuctionStatus<TData = SpotPairDeployAuctionStatusData>(
	options: UseInfoSpotPairDeployAuctionStatusOptions<TData> = {},
): UseInfoSpotPairDeployAuctionStatusReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("spotPairDeployAuctionStatus");

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.spotPairDeployAuctionStatus(signal),
	});
}
