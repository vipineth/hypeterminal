import type { AllPerpMetasResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

type AllPerpMetasData = AllPerpMetasResponse;

export type UseInfoAllPerpMetasOptions<TData = AllPerpMetasData> = QueryParameter<AllPerpMetasData, TData>;
export type UseInfoAllPerpMetasReturnType<TData = AllPerpMetasData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoAllPerpMetas<TData = AllPerpMetasData>(
	options: UseInfoAllPerpMetasOptions<TData> = {},
): UseInfoAllPerpMetasReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("allPerpMetas");

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.allPerpMetas(signal),
	});
}
