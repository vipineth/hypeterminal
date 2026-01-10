import type { SpotDeployStateParameters, SpotDeployStateResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type SpotDeployStateData = SpotDeployStateResponse;
type SpotDeployStateParams = SpotDeployStateParameters;

export type UseInfoSpotDeployStateParameters = SpotDeployStateParams;
export type UseInfoSpotDeployStateOptions<TData = SpotDeployStateData> = QueryParameter<SpotDeployStateData, TData>;
export type UseInfoSpotDeployStateReturnType<TData = SpotDeployStateData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoSpotDeployState<TData = SpotDeployStateData>(
	params: UseInfoSpotDeployStateParameters,
	options: UseInfoSpotDeployStateOptions<TData> = {},
): UseInfoSpotDeployStateReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("spotDeployState", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.spotDeployState(params, signal),
	});
}
