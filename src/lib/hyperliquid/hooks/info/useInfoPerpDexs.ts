import type { InfoClient, PerpDexsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type PerpDexsData = PerpDexsResponse;

export type UseInfoPerpDexsOptions<TData = PerpDexsData> = QueryParameter<PerpDexsData, TData>;
export type UseInfoPerpDexsReturnType<TData = PerpDexsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getPerpDexsQueryOptions(info: InfoClient): QueryOptions<PerpDexsData> {
	return {
		queryKey: infoKeys.method("perpDexs"),
		queryFn: ({ signal }) => info.perpDexs(signal),
	};
}

export function useInfoPerpDexs<TData = PerpDexsData>(
	options: UseInfoPerpDexsOptions<TData> = {},
): UseInfoPerpDexsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getPerpDexsQueryOptions(info);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
