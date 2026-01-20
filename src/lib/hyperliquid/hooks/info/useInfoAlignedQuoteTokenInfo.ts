import type { AlignedQuoteTokenInfoParameters, AlignedQuoteTokenInfoResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type AlignedQuoteTokenInfoData = AlignedQuoteTokenInfoResponse;
type AlignedQuoteTokenInfoParams = AlignedQuoteTokenInfoParameters;

export type UseInfoAlignedQuoteTokenInfoParameters = AlignedQuoteTokenInfoParams;
export type UseInfoAlignedQuoteTokenInfoOptions<TData = AlignedQuoteTokenInfoData> = QueryParameter<
	AlignedQuoteTokenInfoData,
	TData
>;
export type UseInfoAlignedQuoteTokenInfoReturnType<TData = AlignedQuoteTokenInfoData> = UseQueryResult<
	TData,
	HyperliquidQueryError
> & {
	queryKey: readonly unknown[];
};

export function getAlignedQuoteTokenInfoQueryOptions(
	info: InfoClient,
	params: AlignedQuoteTokenInfoParams,
): QueryOptions<AlignedQuoteTokenInfoData> {
	return {
		queryKey: infoKeys.method("alignedQuoteTokenInfo", params),
		queryFn: ({ signal }) => info.alignedQuoteTokenInfo(params, signal),
	};
}

export function useInfoAlignedQuoteTokenInfo<TData = AlignedQuoteTokenInfoData>(
	params: UseInfoAlignedQuoteTokenInfoParameters,
	options: UseInfoAlignedQuoteTokenInfoOptions<TData> = {},
): UseInfoAlignedQuoteTokenInfoReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getAlignedQuoteTokenInfoQueryOptions(info, params);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return {
		...query,
		queryKey: queryOptions.queryKey,
	};
}
