import type { AllMidsParameters, AllMidsResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type AllMidsData = AllMidsResponse;
type AllMidsParams = AllMidsParameters;

export type UseInfoAllMidsParameters = AllMidsParams;
export type UseInfoAllMidsOptions<TData = AllMidsData> = QueryParameter<AllMidsData, TData>;
export type UseInfoAllMidsReturnType<TData = AllMidsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getAllMidsQueryOptions(info: InfoClient, params: AllMidsParams): QueryOptions<AllMidsData> {
	return {
		queryKey: infoKeys.method("allMids", params),
		queryFn: ({ signal }) => info.allMids(params, signal),
	};
}

export function useInfoAllMids<TData = AllMidsData>(
	params: UseInfoAllMidsParameters,
	options: UseInfoAllMidsOptions<TData> = {},
): UseInfoAllMidsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getAllMidsQueryOptions(info, params);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
