import type { FundingHistoryParameters, FundingHistoryResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type FundingHistoryData = FundingHistoryResponse;
type FundingHistoryParams = FundingHistoryParameters;

export type UseInfoFundingHistoryParameters = FundingHistoryParams;
export type UseInfoFundingHistoryOptions<TData = FundingHistoryData> = QueryParameter<FundingHistoryData, TData>;
export type UseInfoFundingHistoryReturnType<TData = FundingHistoryData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getFundingHistoryQueryOptions(
	info: InfoClient,
	params: FundingHistoryParams,
): QueryOptions<FundingHistoryData> {
	return {
		queryKey: infoKeys.method("fundingHistory", params),
		queryFn: ({ signal }) => info.fundingHistory(params, signal),
	};
}

export function useInfoFundingHistory<TData = FundingHistoryData>(
	params: UseInfoFundingHistoryParameters,
	options: UseInfoFundingHistoryOptions<TData> = {},
): UseInfoFundingHistoryReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getFundingHistoryQueryOptions(info, params);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
