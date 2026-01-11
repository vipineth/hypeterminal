import type { DelegatorSummaryParameters, DelegatorSummaryResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type DelegatorSummaryData = DelegatorSummaryResponse;
type DelegatorSummaryParams = DelegatorSummaryParameters;

export type UseInfoDelegatorSummaryParameters = DelegatorSummaryParams;
export type UseInfoDelegatorSummaryOptions<TData = DelegatorSummaryData> = QueryParameter<DelegatorSummaryData, TData>;
export type UseInfoDelegatorSummaryReturnType<TData = DelegatorSummaryData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoDelegatorSummary<TData = DelegatorSummaryData>(
	params: UseInfoDelegatorSummaryParameters,
	options: UseInfoDelegatorSummaryOptions<TData> = {},
): UseInfoDelegatorSummaryReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("delegatorSummary", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.delegatorSummary(params, signal),
	});
}
