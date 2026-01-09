import type { PerpDexStatusParameters, PerpDexStatusResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

type PerpDexStatusData = PerpDexStatusResponse;
type PerpDexStatusParams = PerpDexStatusParameters;

export type UseInfoPerpDexStatusParameters = PerpDexStatusParams;
export type UseInfoPerpDexStatusOptions<TData = PerpDexStatusData> = QueryParameter<PerpDexStatusData, TData>;
export type UseInfoPerpDexStatusReturnType<TData = PerpDexStatusData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoPerpDexStatus<TData = PerpDexStatusData>(
	params: UseInfoPerpDexStatusParameters,
	options: UseInfoPerpDexStatusOptions<TData> = {},
): UseInfoPerpDexStatusReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("perpDexStatus", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.perpDexStatus(params, signal),
	});
}
