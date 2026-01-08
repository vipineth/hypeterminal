import type { PerpDeployAuctionStatusResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type PerpDeployAuctionStatusData = PerpDeployAuctionStatusResponse;

export type UseInfoPerpDeployAuctionStatusOptions<TData = PerpDeployAuctionStatusData> = QueryParameter<
	PerpDeployAuctionStatusData,
	TData
>;
export type UseInfoPerpDeployAuctionStatusReturnType<TData = PerpDeployAuctionStatusData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoPerpDeployAuctionStatus<TData = PerpDeployAuctionStatusData>(
	options: UseInfoPerpDeployAuctionStatusOptions<TData> = {},
): UseInfoPerpDeployAuctionStatusReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("perpDeployAuctionStatus");

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.perpDeployAuctionStatus(signal),
	});
}
