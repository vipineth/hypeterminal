import type { AlignedQuoteTokenInfoParameters, AlignedQuoteTokenInfoResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

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

export function useInfoAlignedQuoteTokenInfo<TData = AlignedQuoteTokenInfoData>(
	params: UseInfoAlignedQuoteTokenInfoParameters,
	options: UseInfoAlignedQuoteTokenInfoOptions<TData> = {},
): UseInfoAlignedQuoteTokenInfoReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("alignedQuoteTokenInfo", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.alignedQuoteTokenInfo(params, signal),
	});
}
