import type { AlignedQuoteTokenInfoParameters, AlignedQuoteTokenInfoResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

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
>;

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

	return query;
}
