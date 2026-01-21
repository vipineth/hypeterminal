import type { ClearinghouseStateParameters, ClearinghouseStateResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type ClearinghouseStateData = ClearinghouseStateResponse;
type ClearinghouseStateParams = ClearinghouseStateParameters;

export type UseInfoClearinghouseStateParameters = ClearinghouseStateParams;
export type UseInfoClearinghouseStateOptions<TData = ClearinghouseStateData> = QueryParameter<
	ClearinghouseStateData,
	TData
>;
export type UseInfoClearinghouseStateReturnType<TData = ClearinghouseStateData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getClearinghouseStateQueryOptions(
	info: InfoClient,
	params: ClearinghouseStateParams,
): QueryOptions<ClearinghouseStateData> {
	return {
		queryKey: infoKeys.method("clearinghouseState", params),
		queryFn: ({ signal }) => info.clearinghouseState(params, signal),
	};
}

export function useInfoClearinghouseState<TData = ClearinghouseStateData>(
	params: UseInfoClearinghouseStateParameters,
	options: UseInfoClearinghouseStateOptions<TData> = {},
): UseInfoClearinghouseStateReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getClearinghouseStateQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
