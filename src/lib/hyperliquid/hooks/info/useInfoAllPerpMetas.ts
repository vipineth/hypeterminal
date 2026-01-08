import type { AllPerpMetasResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type AllPerpMetasData = AllPerpMetasResponse;

export type UseInfoAllPerpMetasOptions<TData = AllPerpMetasData> = QueryParameter<AllPerpMetasData, TData>;
export type UseInfoAllPerpMetasReturnType<TData = AllPerpMetasData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoAllPerpMetas<TData = AllPerpMetasData>(
	options: UseInfoAllPerpMetasOptions<TData> = {},
): UseInfoAllPerpMetasReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("allPerpMetas");

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.allPerpMetas(signal),
	});
}
