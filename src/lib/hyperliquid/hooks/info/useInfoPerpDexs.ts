import type { PerpDexsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type PerpDexsData = PerpDexsResponse;

export type UseInfoPerpDexsOptions<TData = PerpDexsData> = QueryParameter<PerpDexsData, TData>;
export type UseInfoPerpDexsReturnType<TData = PerpDexsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoPerpDexs<TData = PerpDexsData>(
	options: UseInfoPerpDexsOptions<TData> = {},
): UseInfoPerpDexsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("perpDexs");

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.perpDexs(signal),
	});
}
