import type { AllPerpMetasResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type AllPerpMetasData = AllPerpMetasResponse;

export type UseInfoAllPerpMetasOptions<TData = AllPerpMetasData> = QueryParameter<AllPerpMetasData, TData>;
export type UseInfoAllPerpMetasReturnType<TData = AllPerpMetasData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getAllPerpMetasQueryOptions(info: InfoClient): QueryOptions<AllPerpMetasData> {
	return {
		queryKey: infoKeys.method("allPerpMetas"),
		queryFn: ({ signal }) => info.allPerpMetas(signal),
	};
}

export function useInfoAllPerpMetas<TData = AllPerpMetasData>(
	options: UseInfoAllPerpMetasOptions<TData> = {},
): UseInfoAllPerpMetasReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getAllPerpMetasQueryOptions(info);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
