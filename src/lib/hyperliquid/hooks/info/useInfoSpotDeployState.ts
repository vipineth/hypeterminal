import type { InfoClient, SpotDeployStateParameters, SpotDeployStateResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type SpotDeployStateData = SpotDeployStateResponse;
type SpotDeployStateParams = SpotDeployStateParameters;

export type UseInfoSpotDeployStateParameters = SpotDeployStateParams;
export type UseInfoSpotDeployStateOptions<TData = SpotDeployStateData> = QueryParameter<SpotDeployStateData, TData>;
export type UseInfoSpotDeployStateReturnType<TData = SpotDeployStateData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getSpotDeployStateQueryOptions(
	info: InfoClient,
	params: SpotDeployStateParams,
): QueryOptions<SpotDeployStateData> {
	return {
		queryKey: infoKeys.method("spotDeployState", params),
		queryFn: ({ signal }) => info.spotDeployState(params, signal),
	};
}

export function useInfoSpotDeployState<TData = SpotDeployStateData>(
	params: UseInfoSpotDeployStateParameters,
	options: UseInfoSpotDeployStateOptions<TData> = {},
): UseInfoSpotDeployStateReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getSpotDeployStateQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
