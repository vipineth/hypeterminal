import type { PreTransferCheckParameters, PreTransferCheckResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type PreTransferCheckData = PreTransferCheckResponse;
type PreTransferCheckParams = PreTransferCheckParameters;

export type UseInfoPreTransferCheckParameters = PreTransferCheckParams;
export type UseInfoPreTransferCheckOptions<TData = PreTransferCheckData> = QueryParameter<PreTransferCheckData, TData>;
export type UseInfoPreTransferCheckReturnType<TData = PreTransferCheckData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoPreTransferCheck<TData = PreTransferCheckData>(
	params: UseInfoPreTransferCheckParameters,
	options: UseInfoPreTransferCheckOptions<TData> = {},
): UseInfoPreTransferCheckReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("preTransferCheck", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.preTransferCheck(params, signal),
	});
}
