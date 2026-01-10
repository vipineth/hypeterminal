import type { ClearinghouseStateParameters, ClearinghouseStateResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

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

export function useInfoClearinghouseState<TData = ClearinghouseStateData>(
	params: UseInfoClearinghouseStateParameters,
	options: UseInfoClearinghouseStateOptions<TData> = {},
): UseInfoClearinghouseStateReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("clearinghouseState", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.clearinghouseState(params, signal),
	});
}
