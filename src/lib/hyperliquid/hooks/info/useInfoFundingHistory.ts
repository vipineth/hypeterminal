import type { FundingHistoryParameters, FundingHistoryResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type FundingHistoryData = FundingHistoryResponse;
type FundingHistoryParams = FundingHistoryParameters;

export type UseInfoFundingHistoryParameters = FundingHistoryParams;
export type UseInfoFundingHistoryOptions<TData = FundingHistoryData> = QueryParameter<FundingHistoryData, TData>;
export type UseInfoFundingHistoryReturnType<TData = FundingHistoryData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoFundingHistory<TData = FundingHistoryData>(
	params: UseInfoFundingHistoryParameters,
	options: UseInfoFundingHistoryOptions<TData> = {},
): UseInfoFundingHistoryReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("fundingHistory", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.fundingHistory(params, signal),
	});
}
