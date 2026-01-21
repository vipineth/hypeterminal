import type { InfoClient, PerpDexLimitsParameters, PerpDexLimitsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type PerpDexLimitsData = PerpDexLimitsResponse;
type PerpDexLimitsParams = PerpDexLimitsParameters;

export type UseInfoPerpDexLimitsParameters = PerpDexLimitsParams;
export type UseInfoPerpDexLimitsOptions<TData = PerpDexLimitsData> = QueryParameter<PerpDexLimitsData, TData>;
export type UseInfoPerpDexLimitsReturnType<TData = PerpDexLimitsData> = UseQueryResult<TData, HyperliquidQueryError>;

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

	return query;
}
