import type { InfoClient, PerpDexLimitsParameters, PerpDexLimitsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type PerpDexLimitsData = PerpDexLimitsResponse;
type PerpDexLimitsParams = PerpDexLimitsParameters;

export type UseInfoPerpDexLimitsParameters = PerpDexLimitsParams;
export type UseInfoPerpDexLimitsOptions<TData = PerpDexLimitsData> = QueryParameter<PerpDexLimitsData, TData>;
export type UseInfoPerpDexLimitsReturnType<TData = PerpDexLimitsData> = UseQueryResult<TData, HyperliquidQueryError> & {
	queryKey: readonly unknown[];
};

export function getPerpDexLimitsQueryOptions(
	info: InfoClient,
	params: PerpDexLimitsParams,
): QueryOptions<PerpDexLimitsData> {
	return {
		queryKey: infoKeys.method("perpDexLimits", params),
		queryFn: ({ signal }) => info.perpDexLimits(params, signal),
	};
}

export function useInfoPerpDexLimits<TData = PerpDexLimitsData>(
	params: UseInfoPerpDexLimitsParameters,
	options: UseInfoPerpDexLimitsOptions<TData> = {},
): UseInfoPerpDexLimitsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getPerpDexLimitsQueryOptions(info, params);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return {
		...query,
		queryKey: queryOptions.queryKey,
	};
}
