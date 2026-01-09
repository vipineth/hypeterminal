import type { PerpDexLimitsParameters, PerpDexLimitsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

type PerpDexLimitsData = PerpDexLimitsResponse;
type PerpDexLimitsParams = PerpDexLimitsParameters;

export type UseInfoPerpDexLimitsParameters = PerpDexLimitsParams;
export type UseInfoPerpDexLimitsOptions<TData = PerpDexLimitsData> = QueryParameter<PerpDexLimitsData, TData>;
export type UseInfoPerpDexLimitsReturnType<TData = PerpDexLimitsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoPerpDexLimits<TData = PerpDexLimitsData>(
	params: UseInfoPerpDexLimitsParameters,
	options: UseInfoPerpDexLimitsOptions<TData> = {},
): UseInfoPerpDexLimitsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("perpDexLimits", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.perpDexLimits(params, signal),
	});
}
