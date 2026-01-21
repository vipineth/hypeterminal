import type { DelegatorSummaryParameters, DelegatorSummaryResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type DelegatorSummaryData = DelegatorSummaryResponse;
type DelegatorSummaryParams = DelegatorSummaryParameters;

export type UseInfoDelegatorSummaryParameters = DelegatorSummaryParams;
export type UseInfoDelegatorSummaryOptions<TData = DelegatorSummaryData> = QueryParameter<DelegatorSummaryData, TData>;
export type UseInfoDelegatorSummaryReturnType<TData = DelegatorSummaryData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getDelegatorSummaryQueryOptions(
	info: InfoClient,
	params: DelegatorSummaryParams,
): QueryOptions<DelegatorSummaryData> {
	return {
		queryKey: infoKeys.method("delegatorSummary", params),
		queryFn: ({ signal }) => info.delegatorSummary(params, signal),
	};
}

export function useInfoDelegatorSummary<TData = DelegatorSummaryData>(
	params: UseInfoDelegatorSummaryParameters,
	options: UseInfoDelegatorSummaryOptions<TData> = {},
): UseInfoDelegatorSummaryReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getDelegatorSummaryQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
