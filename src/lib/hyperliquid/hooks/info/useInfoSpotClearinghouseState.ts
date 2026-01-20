import type { InfoClient, SpotClearinghouseStateParameters, SpotClearinghouseStateResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
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

export function getSpotClearinghouseStateQueryOptions(
	info: InfoClient,
	params: SpotClearinghouseStateParams,
): QueryOptions<SpotClearinghouseStateData> {
	return {
		queryKey: infoKeys.method("spotClearinghouseState", params),
		queryFn: ({ signal }) => info.spotClearinghouseState(params, signal),
	};
}

export function useInfoSpotClearinghouseState<TData = SpotClearinghouseStateData>(
	params: UseInfoSpotClearinghouseStateParameters,
	options: UseInfoSpotClearinghouseStateOptions<TData> = {},
): UseInfoSpotClearinghouseStateReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getSpotClearinghouseStateQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
