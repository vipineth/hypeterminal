import type { InfoClient, PerpDeployAuctionStatusResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type PerpDeployAuctionStatusData = PerpDeployAuctionStatusResponse;

export type UseInfoPerpDeployAuctionStatusOptions<TData = PerpDeployAuctionStatusData> = QueryParameter<
	PerpDeployAuctionStatusData,
	TData
>;
export type UseInfoPerpDeployAuctionStatusReturnType<TData = PerpDeployAuctionStatusData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getPerpDeployAuctionStatusQueryOptions(info: InfoClient): QueryOptions<PerpDeployAuctionStatusData> {
	return {
		queryKey: infoKeys.method("perpDeployAuctionStatus"),
		queryFn: ({ signal }) => info.perpDeployAuctionStatus(signal),
	};
}

export function useInfoPerpDeployAuctionStatus<TData = PerpDeployAuctionStatusData>(
	options: UseInfoPerpDeployAuctionStatusOptions<TData> = {},
): UseInfoPerpDeployAuctionStatusReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getPerpDeployAuctionStatusQueryOptions(info);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
