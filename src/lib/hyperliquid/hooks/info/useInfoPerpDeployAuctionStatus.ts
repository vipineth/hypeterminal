import type { InfoClient, PerpDeployAuctionStatusResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type PerpDeployAuctionStatusData = PerpDeployAuctionStatusResponse;

export type UseInfoPerpDeployAuctionStatusOptions<TData = PerpDeployAuctionStatusData> = QueryParameter<
	PerpDeployAuctionStatusData,
	TData
>;
export type UseInfoPerpDeployAuctionStatusReturnType<TData = PerpDeployAuctionStatusData> = UseQueryResult<
	TData,
	HyperliquidQueryError
> & {
	queryKey: readonly unknown[];
};

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

	return {
		...query,
		queryKey: queryOptions.queryKey,
	};
}
