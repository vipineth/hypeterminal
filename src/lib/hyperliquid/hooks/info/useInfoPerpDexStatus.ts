import type { InfoClient, PerpDexStatusParameters, PerpDexStatusResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type PerpDexStatusData = PerpDexStatusResponse;
type PerpDexStatusParams = PerpDexStatusParameters;

export type UseInfoPerpDexStatusParameters = PerpDexStatusParams;
export type UseInfoPerpDexStatusOptions<TData = PerpDexStatusData> = QueryParameter<PerpDexStatusData, TData>;
export type UseInfoPerpDexStatusReturnType<TData = PerpDexStatusData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getPerpDexStatusQueryOptions(
	info: InfoClient,
	params: PerpDexStatusParams,
): QueryOptions<PerpDexStatusData> {
	return {
		queryKey: infoKeys.method("perpDexStatus", params),
		queryFn: ({ signal }) => info.perpDexStatus(params, signal),
	};
}

export function useInfoPerpDexStatus<TData = PerpDexStatusData>(
	params: UseInfoPerpDexStatusParameters,
	options: UseInfoPerpDexStatusOptions<TData> = {},
): UseInfoPerpDexStatusReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getPerpDexStatusQueryOptions(info, params);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
