import type { SpotClearinghouseStateParameters, SpotClearinghouseStateResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type SpotClearinghouseStateData = SpotClearinghouseStateResponse;
type SpotClearinghouseStateParams = SpotClearinghouseStateParameters;

export type UseInfoSpotClearinghouseStateParameters = SpotClearinghouseStateParams;
export type UseInfoSpotClearinghouseStateOptions<TData = SpotClearinghouseStateData> = QueryParameter<
	SpotClearinghouseStateData,
	TData
>;
export type UseInfoSpotClearinghouseStateReturnType<TData = SpotClearinghouseStateData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoSpotClearinghouseState<TData = SpotClearinghouseStateData>(
	params: UseInfoSpotClearinghouseStateParameters,
	options: UseInfoSpotClearinghouseStateOptions<TData> = {},
): UseInfoSpotClearinghouseStateReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("spotClearinghouseState", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.spotClearinghouseState(params, signal),
	});
}
