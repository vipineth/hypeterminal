import type { InfoClient, PreTransferCheckParameters, PreTransferCheckResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type PreTransferCheckData = PreTransferCheckResponse;
type PreTransferCheckParams = PreTransferCheckParameters;

export type UseInfoPreTransferCheckParameters = PreTransferCheckParams;
export type UseInfoPreTransferCheckOptions<TData = PreTransferCheckData> = QueryParameter<PreTransferCheckData, TData>;
export type UseInfoPreTransferCheckReturnType<TData = PreTransferCheckData> = UseQueryResult<
	TData,
	HyperliquidQueryError
> & {
	queryKey: readonly unknown[];
};

export function getPreTransferCheckQueryOptions(
	info: InfoClient,
	params: PreTransferCheckParams,
): QueryOptions<PreTransferCheckData> {
	return {
		queryKey: infoKeys.method("preTransferCheck", params),
		queryFn: ({ signal }) => info.preTransferCheck(params, signal),
	};
}

export function useInfoPreTransferCheck<TData = PreTransferCheckData>(
	params: UseInfoPreTransferCheckParameters,
	options: UseInfoPreTransferCheckOptions<TData> = {},
): UseInfoPreTransferCheckReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getPreTransferCheckQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return {
		...query,
		queryKey: queryOptions.queryKey,
	};
}
